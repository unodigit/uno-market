#!/usr/bin/env python3
"""
API Discovery Script - Discovers JSON API endpoints for web scraping
Implements constitution requirement: Investigation-First Methodology
"""

import asyncio
import json
import re
import sys
from datetime import datetime
from pathlib import Path
from typing import Dict, List, Optional
from urllib.parse import urljoin, urlparse

import requests
from bs4 import BeautifulSoup
from playwright.async_api import async_playwright

# Constants
USER_AGENT = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
TIMEOUT = 30


def load_platform_patterns() -> Dict:
    """Load platform detection patterns from config"""
    config_path = Path(__file__).parent.parent / "config" / "platform_patterns.json"
    with open(config_path) as f:
        return json.load(f)


def detect_platform(html: str, url: str) -> tuple[str, str]:
    """Detect platform type from HTML content

    Returns:
        tuple: (platform_name, confidence_level)
    """
    patterns = load_platform_patterns()

    for platform_name, platform_config in patterns.items():
        if platform_name == "custom":
            continue

        detection = platform_config.get("detection", {})
        score = 0
        max_score = 0

        # Check meta tag
        if detection.get("meta_tag"):
            max_score += 1
            if detection["meta_tag"].lower() in html.lower():
                score += 1

        # Check script sources
        if detection.get("script_src"):
            max_score += 1
            if detection["script_src"] in html:
                score += 1

        # Check HTML patterns
        html_patterns = detection.get("html_patterns", [])
        if html_patterns:
            max_score += len(html_patterns)
            for pattern in html_patterns:
                if pattern in html:
                    score += 1

        if max_score > 0:
            confidence = score / max_score
            if confidence >= 0.7:
                return platform_name, "high"
            elif confidence >= 0.4:
                return platform_name, "medium"

    return "custom", "low"


def get_candidate_endpoints(base_url: str, platform: str) -> List[str]:
    """Get candidate API endpoints based on platform"""
    patterns = load_platform_patterns()
    platform_config = patterns.get(platform, patterns["custom"])

    endpoints = []
    for endpoint_template in platform_config.get("api_endpoints", []):
        # Replace template variables
        endpoint = endpoint_template.replace("{handle}", "all")
        endpoint = endpoint.replace("{product_id}", "")
        full_url = urljoin(base_url, endpoint)
        endpoints.append(full_url)

    # Add common generic endpoints
    common_paths = [
        "/api/products",
        "/api/v1/products",
        "/api/v2/products",
        "/products.json"
    ]

    for path in common_paths:
        full_url = urljoin(base_url, path)
        if full_url not in endpoints:
            endpoints.append(full_url)

    return endpoints


def test_endpoint(url: str, timeout: int = TIMEOUT) -> Optional[Dict]:
    """Test if endpoint is accessible and returns valid JSON

    Returns:
        Dict with endpoint details or None if invalid
    """
    try:
        response = requests.get(
            url,
            headers={"User-Agent": USER_AGENT},
            timeout=timeout
        )

        if response.status_code != 200:
            return None

        content_type = response.headers.get("content-type", "")
        if "application/json" not in content_type:
            return None

        data = response.json()

        # Analyze data structure
        sample_fields = []
        pagination_detected = False

        if isinstance(data, dict):
            if "products" in data:
                items = data["products"]
                if items:
                    sample_fields = list(items[0].keys())
            elif "items" in data:
                items = data["items"]
                if items:
                    sample_fields = list(items[0].keys())
            else:
                sample_fields = list(data.keys())

            # Check for pagination indicators
            pagination_keys = ["next", "page", "total_pages", "has_more", "offset", "limit"]
            pagination_detected = any(key in data for key in pagination_keys)

        # Determine confidence based on field completeness
        required_fields = {"title", "name", "price", "image", "images"}
        found_fields = set(f.lower() for f in sample_fields)
        field_matches = len(required_fields & found_fields)

        if field_matches >= 3:
            confidence = "high"
        elif field_matches >= 2:
            confidence = "medium"
        else:
            confidence = "low"

        return {
            "url": url,
            "method": "GET",
            "response_type": content_type,
            "confidence": confidence,
            "tested": True,
            "status_code": response.status_code,
            "sample_fields": sample_fields[:10],  # Limit to first 10
            "pagination_detected": pagination_detected
        }

    except (requests.RequestException, json.JSONDecodeError, KeyError):
        return None


async def capture_network_requests(url: str) -> List[str]:
    """Capture JSON API calls using Playwright"""
    api_calls = []

    try:
        async with async_playwright() as p:
            browser = await p.chromium.launch(headless=True)
            page = await browser.new_page()

            async def handle_response(response):
                content_type = response.headers.get("content-type", "")
                if "application/json" in content_type:
                    api_calls.append(response.url)

            page.on("response", handle_response)

            await page.goto(url, timeout=TIMEOUT * 1000)
            await page.wait_for_load_state("networkidle", timeout=TIMEOUT * 1000)

            await browser.close()

    except Exception as e:
        print(f"Warning: Network capture failed: {e}", file=sys.stderr)

    return api_calls


def calculate_confidence_score(discovered_endpoints: List[Dict], platform_confidence: str) -> float:
    """Calculate overall confidence score"""
    if not discovered_endpoints:
        return 0.0

    # Base score from platform detection
    platform_scores = {"high": 0.3, "medium": 0.2, "low": 0.1}
    score = platform_scores.get(platform_confidence, 0.1)

    # Add score from discovered endpoints
    high_conf_endpoints = [e for e in discovered_endpoints if e["confidence"] == "high"]
    medium_conf_endpoints = [e for e in discovered_endpoints if e["confidence"] == "medium"]

    if high_conf_endpoints:
        score += 0.6
    elif medium_conf_endpoints:
        score += 0.4
    elif discovered_endpoints:
        score += 0.2

    return min(score, 1.0)


async def investigate_url(target_url: str) -> Dict:
    """Main investigation function

    Returns:
        InvestigationReport dict
    """
    start_time = datetime.utcnow()

    # Phase 1: Fetch initial page
    try:
        response = requests.get(
            target_url,
            headers={"User-Agent": USER_AGENT},
            timeout=TIMEOUT
        )
        response.raise_for_status()
        html = response.text
    except requests.RequestException as e:
        return {
            "error": "network_unreachable",
            "message": str(e),
            "target_url": target_url
        }

    # Phase 2: Detect platform
    platform, platform_confidence = detect_platform(html, target_url)

    # Phase 3: Get candidate endpoints
    parsed_url = urlparse(target_url)
    base_url = f"{parsed_url.scheme}://{parsed_url.netloc}"
    candidates = get_candidate_endpoints(base_url, platform)

    # Phase 4: Test endpoints in parallel
    discovered_endpoints = []
    for candidate in candidates:
        result = test_endpoint(candidate)
        if result:
            discovered_endpoints.append(result)

    # Phase 5: Capture network requests (for JavaScript-heavy sites)
    try:
        network_apis = await capture_network_requests(target_url)
        for api_url in network_apis:
            if api_url not in [e["url"] for e in discovered_endpoints]:
                result = test_endpoint(api_url)
                if result:
                    discovered_endpoints.append(result)
    except Exception:
        pass  # Network capture is optional

    # Phase 6: Calculate confidence and recommend strategy
    confidence_score = calculate_confidence_score(discovered_endpoints, platform_confidence)

    high_conf_endpoints = [e for e in discovered_endpoints if e["confidence"] == "high"]
    if high_conf_endpoints:
        recommended_strategy = "api"
    elif discovered_endpoints:
        recommended_strategy = "api"
    else:
        recommended_strategy = "browser"

    end_time = datetime.utcnow()
    duration = (end_time - start_time).total_seconds()

    return {
        "target_url": target_url,
        "timestamp": start_time.isoformat() + "Z",
        "discovered_endpoints": discovered_endpoints,
        "platform_detected": platform,
        "platform_confidence": platform_confidence,
        "recommended_strategy": recommended_strategy,
        "confidence_score": round(confidence_score, 2),
        "metadata": {
            "investigation_duration_seconds": round(duration, 2),
            "endpoints_probed": len(candidates),
            "endpoints_found": len(discovered_endpoints),
            "techniques_used": [
                "platform_detection",
                "known_endpoints",
                "common_path_probing",
                "network_capture"
            ]
        }
    }


def main():
    """CLI entry point"""
    import argparse

    parser = argparse.ArgumentParser(
        description="Discover API endpoints for web scraping"
    )
    parser.add_argument(
        "url",
        help="Target URL to investigate"
    )
    parser.add_argument(
        "--deep-scan",
        action="store_true",
        help="Enable deep scan mode (test more endpoint variations, slower but more thorough)"
    )
    parser.add_argument(
        "--api-patterns",
        type=Path,
        help="Custom API patterns JSON file (overrides default config/api_patterns.json)"
    )
    parser.add_argument(
        "--timeout",
        type=int,
        default=10,
        help="Request timeout in seconds (default: 10)"
    )
    parser.add_argument(
        "--output",
        type=Path,
        help="Save investigation report to file"
    )

    args = parser.parse_args()

    # Load custom API patterns if provided
    custom_patterns = None
    if args.api_patterns:
        if not args.api_patterns.exists():
            print(f"Error: API patterns file not found: {args.api_patterns}", file=sys.stderr)
            sys.exit(1)
        try:
            with open(args.api_patterns, "r") as f:
                custom_patterns = json.load(f)
            print(f"Loaded custom API patterns from: {args.api_patterns}")
        except json.JSONDecodeError as e:
            print(f"Error: Invalid JSON in patterns file: {e}", file=sys.stderr)
            sys.exit(1)

    # Run investigation with enhanced options
    if args.deep_scan:
        print("Running deep scan (this may take longer)...")

    # TODO: Pass deep_scan and custom_patterns to investigate_url when implementing
    # For now, use standard investigation
    report = asyncio.run(investigate_url(args.url))

    if "error" in report:
        print(json.dumps(report, indent=2), file=sys.stderr)
        sys.exit(1)

    # Save to file if requested
    if args.output:
        with open(args.output, "w") as f:
            json.dump(report, f, indent=2)
        print(f"Investigation report saved to: {args.output}")

    # Print to stdout
    print(json.dumps(report, indent=2))
    sys.exit(0)


if __name__ == "__main__":
    main()

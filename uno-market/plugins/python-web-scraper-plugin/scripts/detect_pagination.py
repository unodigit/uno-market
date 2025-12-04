#!/usr/bin/env python3
"""
Pagination Detection Script
Detects pagination type and generates implementation strategy
Implements T027 [US1] - Pagination detection using Playwright
"""

import asyncio
import json
import sys
from datetime import datetime
from pathlib import Path
from typing import Dict, Optional

# Add parent directory to path for imports
sys.path.insert(0, str(Path(__file__).parent))

# Ensure we're running in virtual environment
try:
    from ensure_venv import ensure_venv
    ensure_venv()
except RuntimeError as e:
    print(f"ERROR: {e}", file=sys.stderr)
    sys.exit(1)

from playwright.async_api import async_playwright, TimeoutError as PlaywrightTimeoutError
from models import PaginationType, ConfidenceLevel, PaginationStrategy, ImplementationDetails, PaginationSelectors

# Constants
USER_AGENT = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
TIMEOUT = 30000  # 30 seconds
SCROLL_WAIT = 2000  # 2 seconds


async def test_infinite_scroll(page, item_selector: str) -> Optional[Dict]:
    """Test for infinite scroll pagination"""
    try:
        # Get initial item count
        initial_count = await page.locator(item_selector).count()

        # Scroll to bottom
        await page.evaluate("window.scrollTo(0, document.body.scrollHeight)")
        await page.wait_for_timeout(SCROLL_WAIT)

        # Check if new items loaded
        new_count = await page.locator(item_selector).count()

        if new_count > initial_count:
            items_loaded = new_count - initial_count

            return {
                "type": PaginationType.INFINITE_SCROLL,
                "confidence": ConfidenceLevel.HIGH,
                "items_loaded": items_loaded,
                "implementation": {
                    "scroll_strategy": "scroll_to_bottom",
                    "wait_time_ms": SCROLL_WAIT,
                    "end_condition": "item_count_unchanged_after_3_attempts"
                }
            }
    except Exception as e:
        print(f"Infinite scroll test failed: {e}", file=sys.stderr)

    return None


async def test_load_more_button(page, item_selector: str) -> Optional[Dict]:
    """Test for load more button pagination"""
    # Common load more button patterns
    patterns = [
        "text=/load more/i",
        "text=/show more/i",
        "text=/view more/i",
        ".load-more",
        "#load-more",
        "[data-action='load-more']",
        "button:has-text('Load More')",
        "a:has-text('Load More')"
    ]

    for pattern in patterns:
        try:
            button = page.locator(pattern).first

            if await button.is_visible(timeout=1000):
                # Get initial item count
                initial_count = await page.locator(item_selector).count()

                # Click button
                await button.click()
                await page.wait_for_timeout(SCROLL_WAIT)

                # Check if new items loaded
                new_count = await page.locator(item_selector).count()

                if new_count > initial_count:
                    return {
                        "type": PaginationType.LOAD_MORE,
                        "confidence": ConfidenceLevel.HIGH,
                        "button_selector": pattern,
                        "items_loaded": new_count - initial_count,
                        "implementation": {
                            "end_condition": "button_not_visible"
                        }
                    }
        except Exception:
            continue

    return None


async def test_traditional_pagination(page) -> Optional[Dict]:
    """Test for traditional page number pagination"""
    # Common pagination patterns
    next_button_patterns = [
        ".pagination a.next",
        ".pagination a:has-text('Next')",
        "a[aria-label*='next']",
        "a[rel='next']",
        "button:has-text('Next')",
        ".pager .next"
    ]

    for pattern in next_button_patterns:
        try:
            next_button = page.locator(pattern).first

            if await next_button.is_visible(timeout=1000):
                # Check for page numbers
                page_numbers = await page.locator(".pagination a, .pager a").all_text_contents()
                numeric_pages = [p for p in page_numbers if p.strip().isdigit()]

                # Get current URL
                current_url = page.url

                return {
                    "type": PaginationType.TRADITIONAL,
                    "confidence": ConfidenceLevel.HIGH,
                    "next_button_selector": pattern,
                    "page_count": max([int(p) for p in numeric_pages]) if numeric_pages else None,
                    "implementation": {
                        "end_condition": "next_button_disabled"
                    }
                }
        except Exception:
            continue

    return None


async def test_api_pagination(page) -> Optional[Dict]:
    """Test for API-based pagination"""
    api_requests = []

    async def handle_response(response):
        """Capture API responses"""
        content_type = response.headers.get("content-type", "")
        if "application/json" in content_type:
            url = response.url

            # Check for pagination parameters
            pagination_params = ["page", "offset", "limit", "cursor", "after", "before"]
            if any(param in url for param in pagination_params):
                api_requests.append({
                    "url": url,
                    "status": response.status
                })

    # Listen for responses
    page.on("response", handle_response)

    # Trigger some interaction to capture API calls
    try:
        await page.evaluate("window.scrollTo(0, 100)")
        await page.wait_for_timeout(1000)
    except Exception:
        pass

    if api_requests:
        return {
            "type": PaginationType.API_PAGINATION,
            "confidence": ConfidenceLevel.HIGH,
            "api_urls": [req["url"] for req in api_requests],
            "implementation": {
                "end_condition": "has_next_false"
            }
        }

    return None


async def test_url_pagination(page) -> Optional[Dict]:
    """Test for URL-based pagination (page numbers in URL)"""
    import re
    from urllib.parse import urlparse, parse_qs

    current_url = page.url
    parsed_url = urlparse(current_url)
    query_params = parse_qs(parsed_url.query)

    # Common URL pagination patterns
    url_patterns = {
        "page": ["page", "p", "pg"],
        "offset": ["offset", "start"],
        "path": r'/page/(\d+)/',  # e.g., /page/2/
    }

    # Check query parameters for page numbers
    for param_type, param_names in url_patterns.items():
        if param_type == "path":
            # Check if URL path contains page numbers
            path_match = re.search(param_names, parsed_url.path)
            if path_match:
                page_num = int(path_match.group(1))
                return {
                    "type": PaginationType.TRADITIONAL,
                    "confidence": ConfidenceLevel.HIGH,
                    "url_pattern": "path_based",
                    "current_page": page_num,
                    "implementation": {
                        "url_template": current_url.replace(f"/page/{page_num}/", "/page/{page}/"),
                        "end_condition": "404_or_empty_items"
                    }
                }
        else:
            # Check query parameters
            for param_name in param_names:
                if param_name in query_params:
                    try:
                        page_value = int(query_params[param_name][0])
                        return {
                            "type": PaginationType.TRADITIONAL,
                            "confidence": ConfidenceLevel.HIGH,
                            "url_pattern": "query_param",
                            "param_name": param_name,
                            "current_page": page_value,
                            "implementation": {
                                "pagination_param": param_name,
                                "end_condition": "404_or_empty_items"
                            }
                        }
                    except (ValueError, IndexError):
                        continue

    return None


async def detect_item_container(page) -> str:
    """Detect the most likely item container selector"""
    # Common item container patterns
    patterns = [
        ".product-item",
        ".product-card",
        ".product",
        ".item",
        ".listing",
        ".result",
        "article",
        "[data-product]",
        "[data-item]"
    ]

    best_selector = None
    best_count = 0

    for pattern in patterns:
        try:
            count = await page.locator(pattern).count()
            if count >= 3 and count > best_count:  # At least 3 items
                best_selector = pattern
                best_count = count
        except Exception:
            continue

    return best_selector or "article"  # Fallback


async def detect_pagination(target_url: str, timeout: int = TIMEOUT, headless: bool = True) -> Dict:
    """
    Main pagination detection function

    Args:
        target_url: URL to analyze
        timeout: Page load timeout in milliseconds
        headless: Run browser in headless mode

    Returns:
        PaginationStrategy dict
    """
    start_time = datetime.utcnow()

    async with async_playwright() as p:
        try:
            # Launch browser
            browser = await p.chromium.launch(headless=headless)
            context = await browser.new_context(user_agent=USER_AGENT)
            page = await context.new_page()

            # Navigate to target URL
            await page.goto(target_url, timeout=timeout, wait_until="networkidle")

            # Detect item container
            item_selector = await detect_item_container(page)
            total_items = await page.locator(item_selector).count()

            print(f"Detected item container: {item_selector} ({total_items} items)")

            # Test pagination types in priority order

            # Test 1: Infinite scroll
            scroll_result = await test_infinite_scroll(page, item_selector)
            if scroll_result:
                print("✓ Infinite scroll detected")

                strategy = PaginationStrategy(
                    pagination_type=scroll_result["type"],
                    implementation_details=ImplementationDetails(
                        scroll_strategy=scroll_result["implementation"]["scroll_strategy"],
                        wait_time_ms=scroll_result["implementation"]["wait_time_ms"],
                        end_condition=scroll_result["implementation"]["end_condition"],
                        items_per_page=scroll_result.get("items_loaded")
                    ),
                    selectors=PaginationSelectors(
                        item_container=item_selector
                    ),
                    confidence=scroll_result["confidence"],
                    detected_page_count=None,
                    notes=f"Infinite scroll detected. Approximately {scroll_result.get('items_loaded')} items load per scroll."
                )

                await browser.close()
                return strategy.model_dump()

            # Test 2: Load more button
            load_more_result = await test_load_more_button(page, item_selector)
            if load_more_result:
                print(f"✓ Load more button detected: {load_more_result['button_selector']}")

                strategy = PaginationStrategy(
                    pagination_type=load_more_result["type"],
                    implementation_details=ImplementationDetails(
                        wait_time_ms=SCROLL_WAIT,
                        end_condition=load_more_result["implementation"]["end_condition"],
                        items_per_page=load_more_result.get("items_loaded")
                    ),
                    selectors=PaginationSelectors(
                        load_more_button=load_more_result["button_selector"],
                        item_container=item_selector
                    ),
                    confidence=load_more_result["confidence"],
                    detected_page_count=None,
                    notes=f"Load more button found. Selector: {load_more_result['button_selector']}"
                )

                await browser.close()
                return strategy.model_dump()

            # Test 3: Traditional pagination
            traditional_result = await test_traditional_pagination(page)
            if traditional_result:
                print(f"✓ Traditional pagination detected")

                strategy = PaginationStrategy(
                    pagination_type=traditional_result["type"],
                    implementation_details=ImplementationDetails(
                        wait_time_ms=SCROLL_WAIT,
                        end_condition=traditional_result["implementation"]["end_condition"],
                        max_pages=traditional_result.get("page_count"),
                        items_per_page=total_items
                    ),
                    selectors=PaginationSelectors(
                        next_button=traditional_result["next_button_selector"],
                        item_container=item_selector
                    ),
                    confidence=traditional_result["confidence"],
                    detected_page_count=traditional_result.get("page_count"),
                    notes=f"Traditional pagination with next button. Selector: {traditional_result['next_button_selector']}"
                )

                await browser.close()
                return strategy.model_dump()

            # Test 4: URL-based pagination
            url_result = await test_url_pagination(page)
            if url_result:
                print(f"✓ URL-based pagination detected ({url_result['url_pattern']})")

                strategy = PaginationStrategy(
                    pagination_type=url_result["type"],
                    implementation_details=ImplementationDetails(
                        wait_time_ms=SCROLL_WAIT,
                        end_condition=url_result["implementation"]["end_condition"],
                        pagination_param=url_result["implementation"].get("pagination_param")
                    ),
                    selectors=PaginationSelectors(
                        item_container=item_selector
                    ),
                    confidence=url_result["confidence"],
                    detected_page_count=None,
                    notes=f"URL-based pagination. Pattern: {url_result['url_pattern']}, Current page: {url_result.get('current_page', 'unknown')}"
                )

                await browser.close()
                return strategy.model_dump()

            # Test 5: API pagination
            api_result = await test_api_pagination(page)
            if api_result:
                print("✓ API pagination detected")

                strategy = PaginationStrategy(
                    pagination_type=api_result["type"],
                    implementation_details=ImplementationDetails(
                        wait_time_ms=0,  # No wait needed for API
                        end_condition=api_result["implementation"]["end_condition"]
                    ),
                    selectors=PaginationSelectors(
                        item_container=item_selector
                    ),
                    confidence=api_result["confidence"],
                    detected_page_count=None,
                    notes=f"API pagination detected. URLs: {', '.join(api_result['api_urls'][:2])}"
                )

                await browser.close()
                return strategy.model_dump()

            # No pagination detected
            print("✗ No pagination detected (single page)")

            strategy = PaginationStrategy(
                pagination_type=PaginationType.NONE,
                implementation_details=ImplementationDetails(
                    wait_time_ms=0,
                    end_condition="single_page"
                ),
                selectors=PaginationSelectors(
                    item_container=item_selector
                ),
                confidence=ConfidenceLevel.MEDIUM,
                detected_page_count=1,
                notes="No pagination controls found. This appears to be a single-page listing."
            )

            await browser.close()
            return strategy.model_dump()

        except PlaywrightTimeoutError:
            return {
                "error": "timeout",
                "message": f"Page failed to load within {timeout/1000} seconds"
            }
        except Exception as e:
            return {
                "error": "detection_failed",
                "message": str(e)
            }


def main():
    """CLI entry point"""
    import argparse

    parser = argparse.ArgumentParser(
        description="Detect pagination type and strategy for a URL"
    )
    parser.add_argument("url", help="Target URL to analyze")
    parser.add_argument("--timeout", type=int, default=30, help="Page load timeout in seconds")
    parser.add_argument("--headless", action="store_true", default=True, help="Run in headless mode")
    parser.add_argument("--output", type=Path, help="Save strategy to file")

    args = parser.parse_args()

    # Run detection
    result = asyncio.run(detect_pagination(
        args.url,
        timeout=args.timeout * 1000,
        headless=args.headless
    ))

    # Handle errors
    if "error" in result:
        print(json.dumps(result, indent=2), file=sys.stderr)
        sys.exit(1)

    # Output result
    if args.output:
        with open(args.output, "w") as f:
            json.dump(result, f, indent=2)
        print(f"Strategy saved to: {args.output}")

    print(json.dumps(result, indent=2))
    sys.exit(0)


if __name__ == "__main__":
    main()

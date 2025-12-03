#!/usr/bin/env python3
"""
DOM Analysis Script
Analyzes DOM structure and generates CSS selectors for data extraction
Implements T029 [US1] - DOM analysis for browser scraping
"""

import asyncio
import json
import re
import sys
from collections import defaultdict
from datetime import datetime
from pathlib import Path
from typing import Dict, List, Optional

from playwright.async_api import async_playwright, TimeoutError as PlaywrightTimeoutError

# Add parent directory to path for imports
sys.path.insert(0, str(Path(__file__).parent))
from models import DOMSelectorMap, FieldSelector, ConfidenceLevel

# Constants
USER_AGENT = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
TIMEOUT = 30000  # 30 seconds


async def find_item_containers(page) -> Dict[str, int]:
    """Find repeating element patterns that likely represent items"""
    # Common item container patterns
    patterns = [
        ".product-item", ".product-card", ".product",
        ".item", ".card", ".listing", ".result",
        "article", "[data-product]", "[data-item]",
        ".entry", ".post"
    ]

    container_counts = {}

    for pattern in patterns:
        try:
            count = await page.locator(pattern).count()
            if count >= 3:  # Minimum 3 items to be considered
                container_counts[pattern] = count
        except Exception:
            continue

    return container_counts


async def find_title_selector(page, container_selector: str, sample_size: int = 5) -> Optional[FieldSelector]:
    """Find selector for title/name field"""
    patterns = [
        "h1", "h2", "h3", "h4",
        ".title", ".name", ".product-title", ".product-name",
        "[data-title]", "[data-name]"
    ]

    containers = await page.locator(container_selector).all()
    containers = containers[:sample_size]  # Limit sample size

    best_selector = None
    best_accuracy = 0.0

    for pattern in patterns:
        matches = 0
        total_checked = 0

        for container in containers:
            total_checked += 1
            try:
                elem = await container.query_selector(pattern)
                if elem:
                    text = await elem.text_content()
                    if text and len(text.strip()) >= 5:  # Minimum length
                        matches += 1
            except Exception:
                continue

        if total_checked > 0:
            accuracy = matches / total_checked
            if accuracy > best_accuracy and accuracy >= 0.9:
                best_accuracy = accuracy
                best_selector = pattern

    if best_selector:
        # Generate fallback selector (less specific)
        fallback = best_selector.split(".")[0] if "." in best_selector else None

        confidence = ConfidenceLevel.HIGH if best_accuracy >= 0.95 else \
                    ConfidenceLevel.MEDIUM if best_accuracy >= 0.85 else \
                    ConfidenceLevel.LOW

        return FieldSelector(
            primary=f"{container_selector} {best_selector}",
            fallback=f"{container_selector} {fallback}" if fallback else None,
            xpath=None,
            attribute=None,
            confidence=confidence,
            extraction_notes="Text content"
        )

    return None


async def find_price_selector(page, container_selector: str, sample_size: int = 5) -> Optional[FieldSelector]:
    """Find selector for price field"""
    patterns = [
        ".price", ".amount", ".cost", ".price-amount",
        "[data-price]", "[data-amount]",
        "span:has-text('$')", "span:has-text('€')", "span:has-text('£')"
    ]

    containers = await page.locator(container_selector).all()
    containers = containers[:sample_size]

    best_selector = None
    best_accuracy = 0.0
    best_attribute = None

    for pattern in patterns:
        matches = 0
        total_checked = 0
        has_data_attribute = "[data-" in pattern

        for container in containers:
            total_checked += 1
            try:
                elem = await container.query_selector(pattern)
                if elem:
                    # Check for data-price attribute first
                    if has_data_attribute:
                        attr_name = pattern.split("[data-")[1].split("]")[0]
                        price_attr = await elem.get_attribute(f"data-{attr_name}")
                        if price_attr and re.search(r'\d+\.?\d*', price_attr):
                            matches += 1
                    else:
                        # Check text content
                        text = await elem.text_content()
                        if text and (re.search(r'[$€£]\s*\d+', text) or re.search(r'\d+\.?\d*', text)):
                            matches += 1
            except Exception:
                continue

        if total_checked > 0:
            accuracy = matches / total_checked
            if accuracy > best_accuracy and accuracy >= 0.85:
                best_accuracy = accuracy
                best_selector = pattern
                best_attribute = f"data-{pattern.split('[data-')[1].split(']')[0]}" if has_data_attribute else None

    if best_selector:
        confidence = ConfidenceLevel.HIGH if best_accuracy >= 0.95 else \
                    ConfidenceLevel.MEDIUM if best_accuracy >= 0.85 else \
                    ConfidenceLevel.LOW

        return FieldSelector(
            primary=f"{container_selector} {best_selector}",
            fallback=f"{container_selector} [data-price]" if not best_attribute else None,
            xpath=None,
            attribute=best_attribute,
            confidence=confidence,
            extraction_notes=f"Extract from {best_attribute} attribute" if best_attribute else "Parse number from text"
        )

    return None


async def find_image_selector(page, container_selector: str, sample_size: int = 5) -> Optional[FieldSelector]:
    """Find selector for image URLs"""
    patterns = [
        "img", "img.product-image", "img[data-src]",
        "picture img", "source[srcset]"
    ]

    containers = await page.locator(container_selector).all()
    containers = containers[:sample_size]

    best_selector = None
    best_accuracy = 0.0

    for pattern in patterns:
        matches = 0
        total_checked = 0

        for container in containers:
            total_checked += 1
            try:
                images = await container.query_selector_all(pattern)
                if images:
                    # Check if any image has valid src
                    for img in images:
                        src = await img.get_attribute("src")
                        data_src = await img.get_attribute("data-src")
                        if src or data_src:
                            matches += 1
                            break  # Count container as match
            except Exception:
                continue

        if total_checked > 0:
            accuracy = matches / total_checked
            if accuracy > best_accuracy and accuracy >= 0.80:  # Lower threshold for images
                best_accuracy = accuracy
                best_selector = pattern

    if best_selector:
        confidence = ConfidenceLevel.HIGH if best_accuracy >= 0.90 else \
                    ConfidenceLevel.MEDIUM if best_accuracy >= 0.75 else \
                    ConfidenceLevel.LOW

        return FieldSelector(
            primary=f"{container_selector} {best_selector}",
            fallback=f"{container_selector} img",
            xpath=None,
            attribute="src",
            confidence=confidence,
            extraction_notes="Extract src attribute, fallback to data-src if src is empty"
        )

    return None


async def find_description_selector(page, container_selector: str, sample_size: int = 5) -> Optional[FieldSelector]:
    """Find selector for description field (optional)"""
    patterns = [
        ".description", ".summary", ".excerpt",
        ".product-description", "p",
        "[data-description]"
    ]

    containers = await page.locator(container_selector).all()
    containers = containers[:sample_size]

    best_selector = None
    best_accuracy = 0.0

    for pattern in patterns:
        matches = 0
        total_checked = 0

        for container in containers:
            total_checked += 1
            try:
                elem = await container.query_selector(pattern)
                if elem:
                    text = await elem.text_content()
                    if text and len(text.strip()) >= 20:  # Descriptions are typically longer
                        matches += 1
            except Exception:
                continue

        if total_checked > 0:
            accuracy = matches / total_checked
            if accuracy > best_accuracy and accuracy >= 0.70:  # Lower threshold (optional field)
                best_accuracy = accuracy
                best_selector = pattern

    if best_selector:
        confidence = ConfidenceLevel.HIGH if best_accuracy >= 0.90 else \
                    ConfidenceLevel.MEDIUM if best_accuracy >= 0.75 else \
                    ConfidenceLevel.LOW

        return FieldSelector(
            primary=f"{container_selector} {best_selector}",
            fallback=f"{container_selector} p",
            xpath=None,
            attribute=None,
            confidence=confidence,
            extraction_notes=f"Text content. Present in {int(best_accuracy*100)}% of items (optional field)"
        )

    return None


async def analyze_dom(target_url: str, sample_size: int = 5, timeout: int = TIMEOUT) -> Dict:
    """
    Main DOM analysis function

    Args:
        target_url: URL to analyze
        sample_size: Number of items to sample for selector validation
        timeout: Page load timeout in milliseconds

    Returns:
        DOMSelectorMap dict
    """
    async with async_playwright() as p:
        try:
            # Launch browser
            browser = await p.chromium.launch(headless=True)
            context = await browser.new_context(user_agent=USER_AGENT)
            page = await context.new_page()

            # Navigate to target URL
            await page.goto(target_url, timeout=timeout, wait_until="networkidle")

            # Find item containers
            print("Detecting item containers...")
            container_counts = await find_item_containers(page)

            if not container_counts:
                await browser.close()
                return {
                    "error": "no_items_found",
                    "message": "Could not find repeating item patterns on the page"
                }

            # Select best container (highest count)
            best_container = max(container_counts, key=container_counts.get)
            total_items = container_counts[best_container]

            print(f"✓ Item container detected: {best_container} ({total_items} items)")

            # Find field selectors
            field_selectors = {}
            confidence_scores = {}

            # Title (required)
            print("Finding title selector...")
            title_selector = await find_title_selector(page, best_container, sample_size)
            if title_selector:
                field_selectors["title"] = title_selector
                confidence_scores["title"] = 1.0 if title_selector.confidence == ConfidenceLevel.HIGH else \
                                             0.85 if title_selector.confidence == ConfidenceLevel.MEDIUM else 0.7
                print(f"  ✓ Title: {title_selector.primary} (confidence: {title_selector.confidence})")
            else:
                print("  ✗ Title selector not found")

            # Price (required)
            print("Finding price selector...")
            price_selector = await find_price_selector(page, best_container, sample_size)
            if price_selector:
                field_selectors["price"] = price_selector
                confidence_scores["price"] = 1.0 if price_selector.confidence == ConfidenceLevel.HIGH else \
                                            0.85 if price_selector.confidence == ConfidenceLevel.MEDIUM else 0.7
                print(f"  ✓ Price: {price_selector.primary} (confidence: {price_selector.confidence})")
            else:
                print("  ✗ Price selector not found")

            # Image URLs (required)
            print("Finding image selector...")
            image_selector = await find_image_selector(page, best_container, sample_size)
            if image_selector:
                field_selectors["image_urls"] = image_selector
                confidence_scores["image_urls"] = 1.0 if image_selector.confidence == ConfidenceLevel.HIGH else \
                                                  0.85 if image_selector.confidence == ConfidenceLevel.MEDIUM else 0.7
                print(f"  ✓ Images: {image_selector.primary} (confidence: {image_selector.confidence})")
            else:
                print("  ✗ Image selector not found")

            # Description (optional)
            print("Finding description selector...")
            desc_selector = await find_description_selector(page, best_container, sample_size)
            if desc_selector:
                field_selectors["description"] = desc_selector
                confidence_scores["description"] = 1.0 if desc_selector.confidence == ConfidenceLevel.HIGH else \
                                                   0.85 if desc_selector.confidence == ConfidenceLevel.MEDIUM else 0.7
                print(f"  ✓ Description: {desc_selector.primary} (confidence: {desc_selector.confidence})")
            else:
                print("  ⚠ Description selector not found (optional field)")

            await browser.close()

            # Build result
            if len(field_selectors) < 3:  # Need at least title, price, image_urls
                return {
                    "error": "insufficient_selectors",
                    "message": f"Only {len(field_selectors)} field selectors found. Need at least 3 (title, price, image_urls)."
                }

            selector_map = DOMSelectorMap(
                item_container_selector=best_container,
                field_selectors={k: v.model_dump() for k, v in field_selectors.items()},
                confidence_scores=confidence_scores,
                page_url=target_url,
                analysis_timestamp=datetime.utcnow().isoformat() + "Z",
                total_items_found=total_items,
                notes=f"Analysis based on {min(sample_size, total_items)} sample items. " +
                      (f"Description field has low completeness ({int(confidence_scores.get('description', 0)*100)}%)." if "description" in field_selectors else "")
            )

            return selector_map.model_dump()

        except PlaywrightTimeoutError:
            return {
                "error": "timeout",
                "message": f"Page failed to load within {timeout/1000} seconds"
            }
        except Exception as e:
            return {
                "error": "analysis_failed",
                "message": str(e)
            }


def main():
    """CLI entry point"""
    import argparse

    parser = argparse.ArgumentParser(
        description="Analyze DOM structure and generate selectors"
    )
    parser.add_argument("url", help="Target URL to analyze")
    parser.add_argument("--sample-size", type=int, default=5, help="Number of items to sample")
    parser.add_argument("--timeout", type=int, default=30, help="Page load timeout in seconds")
    parser.add_argument("--output", type=Path, help="Save selector map to file")

    args = parser.parse_args()

    # Run analysis
    result = asyncio.run(analyze_dom(
        args.url,
        sample_size=args.sample_size,
        timeout=args.timeout * 1000
    ))

    # Handle errors
    if "error" in result:
        print(json.dumps(result, indent=2), file=sys.stderr)
        sys.exit(1)

    # Output result
    if args.output:
        with open(args.output, "w") as f:
            json.dump(result, f, indent=2)
        print(f"Selector map saved to: {args.output}")

    print(json.dumps(result, indent=2))
    sys.exit(0)


if __name__ == "__main__":
    main()

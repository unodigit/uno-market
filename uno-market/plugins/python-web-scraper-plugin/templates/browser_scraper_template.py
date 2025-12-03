#!/usr/bin/env python3
"""
Browser Scraper Template
Template for generating Playwright-based scrapers with stealth techniques
Implements T032 [US1] - Browser scraper template
"""

import asyncio
import json
import re
import sys
from datetime import datetime
from pathlib import Path
from typing import Dict, List

from playwright.async_api import async_playwright

# Add parent directory to path for imports
sys.path.insert(0, str(Path(__file__).parent.parent / "scripts"))
from models import ScrapedItem, Price, ItemsOutput, MetadataOutput, ScrapingSession, PaginationInfo, ItemsSummary, FieldCompleteness, InvestigationNotes, OutputFiles

# ============================================================================
# CONFIGURATION (Generated from investigation and DOM analysis)
# ============================================================================

TARGET_URL = "{TARGET_URL}"
USER_AGENT = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36"

# DOM selectors (from dom_analysis.py)
ITEM_CONTAINER_SELECTOR = "{ITEM_CONTAINER_SELECTOR}"
TITLE_SELECTOR = "{TITLE_SELECTOR}"
PRICE_SELECTOR = "{PRICE_SELECTOR}"
PRICE_ATTRIBUTE = "{PRICE_ATTRIBUTE}"  # None or attribute name
IMAGE_SELECTOR = "{IMAGE_SELECTOR}"
DESCRIPTION_SELECTOR = "{DESCRIPTION_SELECTOR}"
URL_SELECTOR = "a"  # Usually a link in container

# Pagination configuration
PAGINATION_TYPE = "{PAGINATION_TYPE}"  # "infinite_scroll", "load_more", "traditional", "none"
NEXT_BUTTON_SELECTOR = "{NEXT_BUTTON_SELECTOR}"  # For traditional
LOAD_MORE_SELECTOR = "{LOAD_MORE_SELECTOR}"  # For load more button
SCROLL_WAIT_MS = {SCROLL_WAIT_MS}  # Wait time after scroll/click


# ============================================================================
# HELPER FUNCTIONS
# ============================================================================

def parse_price(text: str) -> float:
    """Extract numeric price from text"""
    if not text:
        return 0.0

    # Remove currency symbols and extract number
    number_pattern = r'[\d,]+\.?\d*'
    match = re.search(number_pattern, text)
    if match:
        return float(match.group().replace(',', ''))
    return 0.0


async def extract_item(container) -> ScrapedItem:
    """
    Extract single item from container element

    Args:
        container: Playwright element locator for item container

    Returns:
        ScrapedItem object
    """
    item_data = {}

    # Extract title
    try:
        title_elem = await container.query_selector(TITLE_SELECTOR)
        if title_elem:
            item_data["title"] = (await title_elem.text_content()).strip()
    except Exception as e:
        print(f"Error extracting title: {e}", file=sys.stderr)

    # Extract price
    try:
        price_elem = await container.query_selector(PRICE_SELECTOR)
        if price_elem:
            if PRICE_ATTRIBUTE and PRICE_ATTRIBUTE != "None":
                price_text = await price_elem.get_attribute(PRICE_ATTRIBUTE)
            else:
                price_text = await price_elem.text_content()

            if price_text:
                price_amount = parse_price(price_text)
                item_data["price"] = Price(
                    amount=price_amount,
                    currency="USD",  # Could be detected
                    display_text=price_text.strip()
                )
    except Exception as e:
        print(f"Error extracting price: {e}", file=sys.stderr)

    # Extract image URLs
    try:
        image_elems = await container.query_selector_all(IMAGE_SELECTOR)
        image_urls = []
        for img_elem in image_elems:
            src = await img_elem.get_attribute("src")
            data_src = await img_elem.get_attribute("data-src")
            if src:
                image_urls.append(src)
            elif data_src:
                image_urls.append(data_src)
        item_data["image_urls"] = image_urls
    except Exception as e:
        print(f"Error extracting images: {e}", file=sys.stderr)
        item_data["image_urls"] = []

    # Extract description (optional)
    try:
        if DESCRIPTION_SELECTOR and DESCRIPTION_SELECTOR != "None":
            desc_elem = await container.query_selector(DESCRIPTION_SELECTOR)
            if desc_elem:
                item_data["description"] = (await desc_elem.text_content()).strip()
    except Exception as e:
        print(f"Error extracting description: {e}", file=sys.stderr)

    # Extract URL
    try:
        link_elem = await container.query_selector(URL_SELECTOR)
        if link_elem:
            href = await link_elem.get_attribute("href")
            if href:
                # Handle relative URLs
                if href.startswith("http"):
                    item_data["url"] = href
                else:
                    base_url = "/".join(TARGET_URL.split("/")[:3])
                    item_data["url"] = base_url + href
    except Exception as e:
        print(f"Error extracting URL: {e}", file=sys.stderr)

    # Add scrape timestamp
    item_data["scraped_at"] = datetime.utcnow().isoformat() + "Z"

    return ScrapedItem(**item_data)


async def scrape_page(page) -> List[ScrapedItem]:
    """
    Scrape all items from current page

    Args:
        page: Playwright page object

    Returns:
        List of ScrapedItem objects
    """
    items = []

    try:
        # Wait for items to load
        await page.wait_for_selector(ITEM_CONTAINER_SELECTOR, timeout=10000)

        # Get all item containers
        containers = await page.query_selector_all(ITEM_CONTAINER_SELECTOR)

        print(f"  Found {len(containers)} items on page")

        for container in containers:
            try:
                item = await extract_item(container)
                items.append(item)
            except Exception as e:
                print(f"  Error extracting item: {e}", file=sys.stderr)
                continue

    except Exception as e:
        print(f"Error scraping page: {e}", file=sys.stderr)

    return items


async def handle_infinite_scroll(page) -> List[ScrapedItem]:
    """Handle infinite scroll pagination"""
    all_items = []
    previous_count = 0
    unchanged_attempts = 0
    max_unchanged = 3

    print("Using infinite scroll strategy...")

    while unchanged_attempts < max_unchanged:
        # Scrape current items
        items = await scrape_page(page)
        all_items.extend(items)

        current_count = len(all_items)
        print(f"  Total items: {current_count}")

        # Scroll to bottom
        await page.evaluate("window.scrollTo(0, document.body.scrollHeight)")
        await page.wait_for_timeout(SCROLL_WAIT_MS)

        # Check if new items loaded
        if current_count == previous_count:
            unchanged_attempts += 1
            print(f"  No new items ({unchanged_attempts}/{max_unchanged})")
        else:
            unchanged_attempts = 0

        previous_count = current_count

    return all_items


async def handle_load_more(page) -> List[ScrapedItem]:
    """Handle load more button pagination"""
    all_items = []
    page_num = 1

    print("Using load more button strategy...")

    while True:
        print(f"Page {page_num}:")

        # Scrape current items
        items = await scrape_page(page)
        all_items.extend(items)

        # Look for load more button
        load_more = page.locator(LOAD_MORE_SELECTOR)

        try:
            if not await load_more.is_visible(timeout=2000):
                print("  Load more button not visible. Stopping.")
                break

            # Click button
            await load_more.click()
            await page.wait_for_timeout(SCROLL_WAIT_MS)
            page_num += 1

        except Exception as e:
            print(f"  Could not click load more button: {e}")
            break

    return all_items


async def handle_traditional_pagination(page) -> List[ScrapedItem]:
    """Handle traditional next button pagination"""
    all_items = []
    page_num = 1

    print("Using traditional pagination strategy...")

    while True:
        print(f"Page {page_num}:")

        # Scrape current page
        items = await scrape_page(page)
        all_items.extend(items)

        # Look for next button
        next_button = page.locator(NEXT_BUTTON_SELECTOR)

        try:
            if not await next_button.is_visible(timeout=2000):
                print("  Next button not visible. Stopping.")
                break

            if await next_button.is_disabled():
                print("  Next button disabled. Stopping.")
                break

            # Click next button
            await next_button.click()
            await page.wait_for_load_state("networkidle")
            page_num += 1

        except Exception as e:
            print(f"  Could not click next button: {e}")
            break

    return all_items


def calculate_field_completeness(items: List[ScrapedItem]) -> FieldCompleteness:
    """Calculate field completeness percentages"""
    if not items:
        return FieldCompleteness(title=0, price=0, image_urls=0, description=0)

    total = len(items)

    title_count = sum(1 for item in items if item.title)
    price_count = sum(1 for item in items if item.price)
    images_count = sum(1 for item in items if item.image_urls)
    desc_count = sum(1 for item in items if item.description)

    return FieldCompleteness(
        title=(title_count / total) * 100,
        price=(price_count / total) * 100,
        image_urls=(images_count / total) * 100,
        description=(desc_count / total) * 100
    )


def calculate_quality_score(completeness: FieldCompleteness) -> float:
    """Calculate overall data quality score (0-100)"""
    score = (
        completeness.title * 0.3 +
        completeness.price * 0.3 +
        completeness.image_urls * 0.2 +
        completeness.description * 0.2
    )
    return round(score, 1)


# ============================================================================
# MAIN SCRAPING FUNCTION
# ============================================================================

async def scrape_all():
    """
    Main scraping function
    Uses Playwright with stealth techniques
    """
    start_time = datetime.utcnow()
    all_items = []

    print(f"Starting browser scraping...")
    print(f"URL: {TARGET_URL}")
    print(f"Pagination: {PAGINATION_TYPE}")

    async with async_playwright() as p:
        # Launch browser
        browser = await p.chromium.launch(headless=True)

        # Create context with stealth settings
        context = await browser.new_context(
            user_agent=USER_AGENT,
            viewport={"width": 1920, "height": 1080}
        )

        # Add stealth script
        await context.add_init_script("""
            Object.defineProperty(navigator, 'webdriver', {get: () => undefined});
            Object.defineProperty(navigator, 'plugins', {get: () => [1, 2, 3]});
            Object.defineProperty(navigator, 'languages', {get: () => ['en-US', 'en']});
        """)

        page = await context.new_page()

        # Navigate to target URL
        await page.goto(TARGET_URL, wait_until="networkidle")

        # Handle pagination based on type
        if PAGINATION_TYPE == "infinite_scroll":
            all_items = await handle_infinite_scroll(page)
        elif PAGINATION_TYPE == "load_more":
            all_items = await handle_load_more(page)
        elif PAGINATION_TYPE == "traditional":
            all_items = await handle_traditional_pagination(page)
        else:
            # Single page
            print("Single page (no pagination)")
            all_items = await scrape_page(page)

        await browser.close()

    end_time = datetime.utcnow()
    duration = (end_time - start_time).total_seconds()

    print(f"\n✓ Scraping complete: {len(all_items)} items in {duration:.1f}s")

    # Generate output filenames
    source_name = TARGET_URL.split("//")[1].split("/")[0].replace(".", "_")
    timestamp = start_time.strftime("%Y%m%d_%H%M%S")
    items_filename = f"{source_name}_items_{timestamp}.json"
    metadata_filename = f"{source_name}_metadata_{timestamp}.json"

    # Calculate metrics
    completeness = calculate_field_completeness(all_items)
    quality_score = calculate_quality_score(completeness)

    # Create items output
    items_output = ItemsOutput(
        metadata_file=metadata_filename,
        items=[item.model_dump() for item in all_items]
    )

    # Create metadata output
    metadata_output = MetadataOutput(
        scraping_session=ScrapingSession(
            source_url=TARGET_URL,
            source_name=source_name,
            scrape_timestamp_start=start_time.isoformat() + "Z",
            scrape_timestamp_end=end_time.isoformat() + "Z",
            duration_seconds=duration,
            scraping_method="browser"
        ),
        pagination_info=PaginationInfo(
            type=PAGINATION_TYPE,
            total_pages=None,  # Unknown for browser scraping
            items_per_page=None
        ),
        items_summary=ItemsSummary(
            total_items_found=len(all_items),
            items_successfully_scraped=len(all_items),
            items_with_errors=0,
            data_quality_percentage=quality_score
        ),
        field_completeness=completeness.model_dump(),
        investigation_notes=InvestigationNotes(
            api_endpoints_found=[],
            api_used=False,
            fallback_reason="Browser scraping required (no API found or API incomplete)"
        ),
        output_files=OutputFiles(
            items_file=items_filename,
            metadata_file=metadata_filename
        )
    )

    # Save files
    output_dir = Path("output")
    output_dir.mkdir(exist_ok=True)

    items_path = output_dir / items_filename
    metadata_path = output_dir / metadata_filename

    with open(items_path, "w") as f:
        json.dump(items_output.model_dump(), f, indent=2)
    print(f"✓ Items saved: {items_path}")

    with open(metadata_path, "w") as f:
        json.dump(metadata_output.model_dump(), f, indent=2)
    print(f"✓ Metadata saved: {metadata_path}")

    print(f"\nData Quality Score: {quality_score}/100")
    print(f"Field Completeness:")
    print(f"  - Title: {completeness.title:.1f}%")
    print(f"  - Price: {completeness.price:.1f}%")
    print(f"  - Images: {completeness.image_urls:.1f}%")
    print(f"  - Description: {completeness.description:.1f}%")


# ============================================================================
# ENTRY POINT
# ============================================================================

if __name__ == "__main__":
    try:
        asyncio.run(scrape_all())
    except KeyboardInterrupt:
        print("\n\nScraping interrupted by user")
        sys.exit(1)
    except Exception as e:
        print(f"\n\n✗ Fatal error: {e}", file=sys.stderr)
        import traceback
        traceback.print_exc()
        sys.exit(1)

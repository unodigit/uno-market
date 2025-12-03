#!/usr/bin/env python3
"""
API Scraper Template
Template for generating API-based scrapers with Pydantic validation
Implements T031 [US1] - API scraper template
"""

import json
import sys
from datetime import datetime
from pathlib import Path
from typing import Dict, List
from urllib.parse import urljoin

import requests

# Add parent directory to path for imports
sys.path.insert(0, str(Path(__file__).parent.parent / "scripts"))
from models import ScrapedItem, Price, ItemsOutput, MetadataOutput, ScrapingSession, PaginationInfo, ItemsSummary, FieldCompleteness, InvestigationNotes, OutputFiles

# ============================================================================
# CONFIGURATION (Generated from investigation)
# ============================================================================

BASE_URL = "{BASE_URL}"
API_ENDPOINT = "{API_ENDPOINT}"
PLATFORM = "{PLATFORM}"
USER_AGENT = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36"
TIMEOUT = 30
MAX_RETRIES = 3

# Pagination configuration
PAGINATION_TYPE = "{PAGINATION_TYPE}"  # "api_pagination", "traditional", "none"
PAGINATION_PARAM = "{PAGINATION_PARAM}"  # e.g., "page", "offset"
ITEMS_PER_PAGE = {ITEMS_PER_PAGE}  # Estimated items per page


# ============================================================================
# API SCRAPING FUNCTIONS
# ============================================================================

def fetch_page(page_num: int) -> Dict:
    """
    Fetch single page from API

    Args:
        page_num: Page number to fetch (1-indexed)

    Returns:
        JSON response dict
    """
    url = f"{API_ENDPOINT}?{PAGINATION_PARAM}={page_num}"

    for attempt in range(MAX_RETRIES):
        try:
            response = requests.get(
                url,
                headers={"User-Agent": USER_AGENT},
                timeout=TIMEOUT
            )
            response.raise_for_status()
            return response.json()
        except requests.exceptions.RequestException as e:
            if attempt == MAX_RETRIES - 1:
                raise
            print(f"Retry {attempt + 1}/{MAX_RETRIES} for page {page_num}: {e}")
            continue

    return {}


def extract_items(data: Dict) -> List[ScrapedItem]:
    """
    Extract items from API response
    Platform-specific extraction logic

    Args:
        data: API response dict

    Returns:
        List of ScrapedItem objects
    """
    items = []

    # Platform-specific extraction
    # {EXTRACTION_LOGIC}

    # Example for Shopify:
    if PLATFORM == "shopify":
        products = data.get("products", [])

        for p in products:
            try:
                # Parse price
                price = None
                if p.get("variants"):
                    price_amount = float(p["variants"][0].get("price", 0))
                    price = Price(
                        amount=price_amount,
                        currency="USD",  # Could be detected from API
                        display_text=f"${price_amount}"
                    )

                # Extract images
                image_urls = [img["src"] for img in p.get("images", [])]

                item = ScrapedItem(
                    id=str(p.get("id", "")),
                    title=p.get("title", ""),
                    price=price,
                    image_urls=image_urls,
                    url=urljoin(BASE_URL, f"/products/{p.get('handle', '')}"),
                    description=p.get("body_html", ""),
                    scraped_at=datetime.utcnow().isoformat() + "Z"
                )

                items.append(item)
            except Exception as e:
                print(f"Error extracting item: {e}", file=sys.stderr)
                continue

    return items


def check_has_next_page(data: Dict, page_num: int) -> bool:
    """
    Check if there are more pages to fetch

    Args:
        data: Current page API response
        page_num: Current page number

    Returns:
        True if more pages available
    """
    # Platform-specific logic
    # {HAS_NEXT_LOGIC}

    # Generic fallbacks:
    if "has_next" in data:
        return data["has_next"]

    if "next" in data:
        return data["next"] is not None

    if "total_pages" in data:
        return page_num < data["total_pages"]

    # Check if current page has items
    items_key = "items" if "items" in data else "products" if "products" in data else "results"
    current_items = data.get(items_key, [])
    return len(current_items) > 0


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
    # Weighted average (title and price are more important)
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

def scrape_all():
    """
    Main scraping function
    Implements pagination and saves both items and metadata files
    """
    all_items = []
    page = 1
    start_time = datetime.utcnow()

    print(f"Starting {PLATFORM} API scraping...")
    print(f"Endpoint: {API_ENDPOINT}")

    while True:
        try:
            print(f"Fetching page {page}...", end=" ")
            data = fetch_page(page)

            # Extract items from this page
            items = extract_items(data)

            if not items:
                print("No items found. Stopping.")
                break

            all_items.extend(items)
            print(f"✓ {len(items)} items (total: {len(all_items)})")

            # Check for next page
            if not check_has_next_page(data, page):
                print("No more pages. Stopping.")
                break

            page += 1

        except Exception as e:
            print(f"\n✗ Error on page {page}: {e}", file=sys.stderr)
            break

    end_time = datetime.utcnow()
    duration = (end_time - start_time).total_seconds()

    print(f"\n✓ Scraping complete: {len(all_items)} items in {duration:.1f}s")

    # Generate output filenames
    source_name = BASE_URL.split("//")[1].split("/")[0].replace(".", "_")
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
            source_url=BASE_URL,
            source_name=source_name,
            scrape_timestamp_start=start_time.isoformat() + "Z",
            scrape_timestamp_end=end_time.isoformat() + "Z",
            duration_seconds=duration,
            scraping_method="api"
        ),
        pagination_info=PaginationInfo(
            type=PAGINATION_TYPE,
            total_pages=page - 1 if page > 1 else 1,
            items_per_page=ITEMS_PER_PAGE
        ),
        items_summary=ItemsSummary(
            total_items_found=len(all_items),
            items_successfully_scraped=len(all_items),
            items_with_errors=0,
            data_quality_percentage=quality_score
        ),
        field_completeness=completeness.model_dump(),
        investigation_notes=InvestigationNotes(
            api_endpoints_found=[API_ENDPOINT],
            api_used=True,
            platform_detected=PLATFORM
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
        scrape_all()
    except KeyboardInterrupt:
        print("\n\nScraping interrupted by user")
        sys.exit(1)
    except Exception as e:
        print(f"\n\n✗ Fatal error: {e}", file=sys.stderr)
        sys.exit(1)

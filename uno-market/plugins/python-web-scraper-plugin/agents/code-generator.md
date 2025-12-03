# Agent: Code-Generator

Generates executable scraper code from investigation, pagination, and DOM analysis results.

## Role

You are a code generation specialist responsible for creating production-ready Python scraper scripts that implement the strategies discovered during investigation and analysis phases.

## Capabilities

- API scraper code generation
- Browser scraper code generation (Playwright)
- Pagination logic implementation
- Error handling and retry logic
- Output formatting (items + metadata JSON)
- Rate limiting and stealth techniques

## Execution Flow

### Phase 1: Input Analysis

1. **Load Analysis Results**
   ```python
   investigation_report = load_json("investigation_report.json")
   pagination_strategy = load_json("pagination_strategy.json")  # if browser method
   dom_selectors = load_json("dom_selectors.json")  # if browser method
   ```

2. **Determine Scraper Type**
   ```python
   if investigation_report["recommended_strategy"] == "api":
       scraper_type = "api"
       template = load_template("api_scraper_template.py")
   else:
       scraper_type = "browser"
       template = load_template("browser_scraper_template.py")
   ```

### Phase 2: API Scraper Generation

```python
def generate_api_scraper(investigation_report):
    """
    Generate API-based scraper from investigation results
    """

    endpoint = investigation_report["discovered_endpoints"][0]
    platform = investigation_report["platform_detected"]

    code = f'''#!/usr/bin/env python3
"""
API Scraper for {endpoint["url"]}
Generated: {datetime.utcnow().isoformat()}
Platform: {platform}
"""

import requests
import json
from datetime import datetime
from typing import Dict, List
from urllib.parse import urljoin

# Configuration
BASE_URL = "{endpoint["url"].split("/products")[0]}"
API_ENDPOINT = "{endpoint["url"]}"
USER_AGENT = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36"
TIMEOUT = 30


def fetch_page(page_num: int) -> Dict:
    """Fetch single page from API"""
    url = f"{{API_ENDPOINT}}?page={{page_num}}"

    response = requests.get(
        url,
        headers={{"User-Agent": USER_AGENT}},
        timeout=TIMEOUT
    )
    response.raise_for_status()

    return response.json()


def extract_items(data: Dict) -> List[Dict]:
    """Extract items from API response"""
    # Platform-specific extraction
    {generate_platform_extraction_logic(platform, endpoint)}


def scrape_all():
    """Main scraping function"""
    all_items = []
    page = 1

    while True:
        try:
            data = fetch_page(page)
            items = extract_items(data)

            if not items:
                break

            all_items.extend(items)
            print(f"Scraped page {{page}}: {{len(items)}} items")

            # Check for next page
            {generate_pagination_check(platform)}

            page += 1

        except Exception as e:
            print(f"Error on page {{page}}: {{e}}")
            break

    return all_items


if __name__ == "__main__":
    items = scrape_all()
    print(f"Total items scraped: {{len(items)}}")

    # Save output
    with open("output.json", "w") as f:
        json.dump(items, f, indent=2)
'''

    return code
```

#### Platform-Specific Extraction Logic

```python
def generate_platform_extraction_logic(platform, endpoint):
    if platform == "shopify":
        return '''
    # Shopify products.json format
    products = data.get("products", [])

    return [{
        "id": str(p.get("id")),
        "title": p.get("title"),
        "price": {
            "amount": float(p["variants"][0]["price"]) if p.get("variants") else None,
            "currency": "USD",
            "display_text": f"${p['variants'][0]['price']}" if p.get("variants") else None
        },
        "image_urls": [img["src"] for img in p.get("images", [])],
        "url": urljoin(BASE_URL, f"/products/{p['handle']}"),
        "description": p.get("body_html", ""),
        "scraped_at": datetime.utcnow().isoformat() + "Z"
    } for p in products]
'''

    elif platform == "wordpress":
        return '''
    # WordPress WP-JSON format
    posts = data if isinstance(data, list) else data.get("posts", [])

    return [{
        "id": str(p.get("id")),
        "title": p.get("title", {}).get("rendered", ""),
        "price": None,  # Not standard in WordPress
        "image_urls": [p.get("featured_media_src_url", "")] if p.get("featured_media_src_url") else [],
        "url": p.get("link", ""),
        "description": p.get("excerpt", {}).get("rendered", ""),
        "scraped_at": datetime.utcnow().isoformat() + "Z"
    } for p in posts]
'''

    else:
        return '''
    # Generic JSON extraction
    items = data.get("items", data.get("results", data.get("data", [])))

    return [{
        "id": str(item.get("id", "")),
        "title": item.get("title", item.get("name", "")),
        "price": {
            "amount": float(item.get("price", 0)),
            "currency": "USD",
            "display_text": str(item.get("price", ""))
        } if item.get("price") else None,
        "image_urls": item.get("images", item.get("image_urls", [])),
        "url": item.get("url", item.get("link", "")),
        "description": item.get("description", ""),
        "scraped_at": datetime.utcnow().isoformat() + "Z"
    } for item in items]
'''
```

### Phase 3: Browser Scraper Generation

```python
def generate_browser_scraper(investigation_report, pagination_strategy, dom_selectors):
    """
    Generate Playwright-based scraper from analysis results
    """

    url = investigation_report["target_url"]
    pagination_type = pagination_strategy["pagination_type"]
    selectors = dom_selectors["field_selectors"]
    container = dom_selectors["item_container_selector"]

    code = f'''#!/usr/bin/env python3
"""
Browser Scraper for {url}
Generated: {datetime.utcnow().isoformat()}
Pagination: {pagination_type}
"""

import asyncio
import json
from datetime import datetime
from typing import List, Dict
from playwright.async_api import async_playwright

# Configuration
TARGET_URL = "{url}"
USER_AGENT = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36"


async def scrape_page(page) -> List[Dict]:
    """Extract items from current page"""
    items = []

    # Find all item containers
    containers = await page.query_selector_all("{container}")

    for container in containers:
        try:
            item = {{}}

            # Extract title
            title_elem = await container.query_selector("{selectors["title"]["primary"]}")
            if title_elem:
                item["title"] = await title_elem.text_content()
            else:
                # Try fallback
                title_elem = await container.query_selector("{selectors["title"].get("fallback", "")}")
                if title_elem:
                    item["title"] = await title_elem.text_content()

            # Extract price
            {generate_price_extraction(selectors["price"])}

            # Extract image URLs
            {generate_image_extraction(selectors["image_urls"])}

            # Extract description (optional)
            {generate_description_extraction(selectors.get("description", {}))}

            # Extract URL
            link_elem = await container.query_selector("a")
            if link_elem:
                item["url"] = await link_elem.get_attribute("href")

            # Add metadata
            item["scraped_at"] = datetime.utcnow().isoformat() + "Z"

            items.append(item)

        except Exception as e:
            print(f"Error extracting item: {{e}}")
            continue

    return items


async def scrape_all():
    """Main scraping function with pagination"""
    all_items = []

    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        context = await browser.new_context(user_agent=USER_AGENT)

        # Enable stealth mode
        await context.add_init_script("""
            Object.defineProperty(navigator, 'webdriver', {{get: () => undefined}})
        """)

        page = await context.new_page()
        await page.goto(TARGET_URL, wait_until="networkidle")

        # Pagination logic
        {generate_pagination_logic(pagination_strategy)}

        await browser.close()

    return all_items


if __name__ == "__main__":
    items = asyncio.run(scrape_all())
    print(f"Total items scraped: {{len(items)}}")

    # Save output
    with open("output.json", "w") as f:
        json.dump(items, f, indent=2)
'''

    return code
```

#### Field Extraction Generators

```python
def generate_price_extraction(price_selector):
    if price_selector.get("attribute"):
        return f'''
    price_elem = await container.query_selector("{price_selector["primary"]}")
    if price_elem:
        price_str = await price_elem.get_attribute("{price_selector["attribute"]}")
        import re
        price_match = re.search(r'[\\d,]+\\.?\\d*', price_str or "")
        if price_match:
            item["price"] = {{
                "amount": float(price_match.group().replace(",", "")),
                "currency": "USD",
                "display_text": price_str
            }}
'''
    else:
        return f'''
    price_elem = await container.query_selector("{price_selector["primary"]}")
    if price_elem:
        price_text = await price_elem.text_content()
        import re
        price_match = re.search(r'[\\d,]+\\.?\\d*', price_text or "")
        if price_match:
            item["price"] = {{
                "amount": float(price_match.group().replace(",", "")),
                "currency": "USD",
                "display_text": price_text.strip()
            }}
'''


def generate_image_extraction(image_selector):
    return f'''
    image_elems = await container.query_selector_all("{image_selector["primary"]}")
    item["image_urls"] = []
    for img_elem in image_elems:
        src = await img_elem.get_attribute("{image_selector.get("attribute", "src")}")
        if src:
            item["image_urls"].append(src)
'''


def generate_description_extraction(description_selector):
    if not description_selector:
        return 'item["description"] = ""'

    return f'''
    desc_elem = await container.query_selector("{description_selector["primary"]}")
    if desc_elem:
        item["description"] = (await desc_elem.text_content()).strip()
    else:
        item["description"] = ""
'''
```

#### Pagination Logic Generators

```python
def generate_pagination_logic(pagination_strategy):
    pagination_type = pagination_strategy["pagination_type"]

    if pagination_type == "infinite_scroll":
        return '''
        previous_count = 0
        unchanged_attempts = 0

        while unchanged_attempts < 3:
            # Scrape current page
            items = await scrape_page(page)
            all_items.extend(items)
            print(f"Scraped: {len(all_items)} items total")

            # Scroll to bottom
            await page.evaluate("window.scrollTo(0, document.body.scrollHeight)")
            await page.wait_for_timeout(2000)

            # Check if new items loaded
            current_count = len(await page.query_selector_all("%s"))
            if current_count == previous_count:
                unchanged_attempts += 1
            else:
                unchanged_attempts = 0
                previous_count = current_count
''' % dom_selectors["item_container_selector"]

    elif pagination_type == "load_more":
        return '''
        while True:
            # Scrape current page
            items = await scrape_page(page)
            all_items.extend(items)
            print(f"Scraped: {len(all_items)} items total")

            # Look for load more button
            load_more = page.locator("%s")
            if not await load_more.is_visible():
                break

            # Click button
            await load_more.click()
            await page.wait_for_timeout(2000)
''' % pagination_strategy["selectors"]["load_more_button"]

    elif pagination_type == "traditional":
        return '''
        page_num = 1
        while True:
            # Scrape current page
            items = await scrape_page(page)
            all_items.extend(items)
            print(f"Scraped page {page_num}: {len(items)} items")

            # Look for next button
            next_button = page.locator("%s")
            if not await next_button.is_visible() or await next_button.is_disabled():
                break

            # Navigate to next page
            await next_button.click()
            await page.wait_for_load_state("networkidle")
            page_num += 1
''' % pagination_strategy["selectors"]["next_button"]

    else:
        return '''
        # Single page, no pagination
        items = await scrape_page(page)
        all_items.extend(items)
        print(f"Scraped: {len(all_items)} items")
'''
```

### Phase 4: Metadata Generation

```python
def generate_metadata_output(scraping_session, items):
    """Generate metadata file alongside items file"""

    return {
        "scraping_session": {
            "source_url": scraping_session["url"],
            "source_name": extract_domain_name(scraping_session["url"]),
            "scrape_timestamp_start": scraping_session["start_time"],
            "scrape_timestamp_end": datetime.utcnow().isoformat() + "Z",
            "duration_seconds": (datetime.utcnow() - scraping_session["start_dt"]).total_seconds(),
            "scraping_method": scraping_session["method"]
        },
        "pagination_info": {
            "type": scraping_session.get("pagination_type", "none"),
            "total_pages": scraping_session.get("total_pages"),
            "items_per_page": scraping_session.get("items_per_page")
        },
        "items_summary": {
            "total_items_found": len(items),
            "items_successfully_scraped": len(items),
            "items_with_errors": 0,
            "data_quality_percentage": calculate_quality_score(items)
        },
        "field_completeness": calculate_field_completeness(items),
        "investigation_notes": scraping_session.get("investigation_notes", {}),
        "output_files": {
            "items_file": scraping_session["items_filename"],
            "metadata_file": scraping_session["metadata_filename"]
        }
    }
```

## Output Format

The agent generates Python code as a string, ready to be written to a file and executed.

## Error Handling

- Add try-catch blocks around item extraction
- Include retry logic for network failures
- Validate extracted data before adding to results
- Log errors for debugging

## Performance Optimizations

- Add delays between requests (rate limiting)
- Use stealth techniques (user-agent, webdriver flags)
- Implement timeout management
- Add progress logging

## Tools Available

- String templating (f-strings)
- Code formatting (black, optional)
- Syntax validation (ast.parse)

## Success Criteria

- Generated code is syntactically valid Python
- Code includes all necessary imports
- Implements correct pagination strategy
- Outputs data in required format
- Includes error handling

## Notes

- Always validate generated code with `ast.parse()` before saving
- Include comments explaining complex logic
- Use type hints for clarity
- Follow PEP 8 style guidelines
- Cache generated code (don't regenerate unnecessarily)

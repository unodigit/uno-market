# Command: /detect-pagination

Detect pagination type and strategy for a target URL.

## Usage

```bash
/detect-pagination <url> [options]
```

## Arguments

- `<url>` (required): Target URL to analyze for pagination

## Options

- `--timeout <seconds>`: Page load timeout (default: 30)
- `--output <path>`: Save pagination strategy to file
- `--verbose`: Enable verbose logging

## Examples

### Basic Usage

```bash
/detect-pagination https://example.com/products
```

### Save Strategy to File

```bash
/detect-pagination https://example.com/products --output pagination_strategy.json
```

## What This Command Does

1. **Page Load & Analysis**
   - Loads the target page with Playwright
   - Waits for initial content to render
   - Captures DOM structure

2. **Pagination Type Detection**
   - **Infinite Scroll**: Detects scroll-triggered content loading
   - **Load More Button**: Identifies "Load More" / "Show More" buttons
   - **Traditional Pagination**: Finds numbered page links or next/previous buttons
   - **API Pagination**: Detects API-based pagination in network requests
   - **None**: Single-page content with no pagination

3. **Selector Identification**
   - Identifies item container selectors
   - Locates pagination controls
   - Determines end conditions

4. **Strategy Recommendation**
   - Provides implementation details
   - Estimates total pages/items
   - Calculates confidence score

## Output

### Console Output

```
✓ Pagination Detection Complete

Pagination Type: infinite_scroll
Confidence: high

Implementation Details:
  Strategy: Scroll to bottom repeatedly until no new items load
  Wait Time: 2000ms between scrolls
  End Condition: Item count unchanged after 3 scroll attempts

Selectors:
  Item Container: .product-item
  Pagination Container: N/A

Estimated Pages: Unknown (infinite scroll)
Items Per Page: ~20

Next Steps:
  Run: /scrape-url https://example.com/products
  This will use infinite scroll strategy automatically
```

### JSON Report (with `--output`)

```json
{
  "pagination_type": "infinite_scroll",
  "implementation_details": {
    "scroll_strategy": "scroll_to_bottom",
    "wait_time_ms": 2000,
    "end_condition": "item_count_unchanged_after_3_attempts",
    "max_pages": null,
    "items_per_page": 20
  },
  "selectors": {
    "item_container": ".product-item",
    "pagination_container": null,
    "next_button": null,
    "load_more_button": null
  },
  "confidence": "high",
  "detected_page_count": null,
  "notes": "Infinite scroll detected with smooth scrolling behavior"
}
```

## Pagination Types

### Type 1: Infinite Scroll

**Indicators**:
- No visible pagination controls
- New items load on scroll
- Event listeners on scroll event

**Implementation**:
```python
while items_added_in_last_scroll > 0:
    page.evaluate("window.scrollTo(0, document.body.scrollHeight)")
    await page.wait_for_timeout(2000)
    # Check for new items
```

**Confidence Factors**:
- Scroll event listeners detected: +40%
- Items loaded after scroll test: +40%
- No pagination controls: +20%

### Type 2: Load More Button

**Indicators**:
- Button with text like "Load More", "Show More", "View More"
- Button triggers content loading (not navigation)
- Button may disappear when all items loaded

**Implementation**:
```python
while load_more_button.is_visible():
    await load_more_button.click()
    await page.wait_for_timeout(2000)
    # Check for new items
```

**Confidence Factors**:
- Button text matches pattern: +50%
- Button click loads content: +30%
- Button state changes: +20%

### Type 3: Traditional Pagination

**Indicators**:
- Numbered page links (1, 2, 3...)
- Next/Previous buttons
- URL parameter changes (e.g., ?page=2)

**Implementation**:
```python
for page_num in range(1, total_pages + 1):
    url = f"{base_url}?page={page_num}"
    await page.goto(url)
    # Scrape items
```

**Confidence Factors**:
- Page number links found: +50%
- Next button found: +30%
- URL parameter pattern: +20%

### Type 4: API Pagination

**Indicators**:
- Network requests with page/offset parameters
- JSON responses containing pagination metadata
- No visible pagination controls (JavaScript-driven)

**Implementation**:
```python
page = 1
while has_more_pages:
    response = requests.get(f"{api_url}?page={page}")
    data = response.json()
    has_more_pages = data.get("has_next", False)
    page += 1
```

**Confidence Factors**:
- API requests with pagination params: +50%
- Pagination metadata in response: +30%
- Multiple pages detected: +20%

## Exit Codes

- `0`: Detection successful
- `1`: Network error (URL unreachable)
- `2`: Timeout exceeded
- `3`: Unable to determine pagination type

## Performance

**Execution Time**: 15-45 seconds

## Agents Used

- `pagination-detector`

## Related Commands

- `/scrape-url` - Uses pagination strategy automatically
- `/investigate-url` - May detect API pagination
- `/analyze-dom` - Provides item container selectors

## Notes

- This command loads the page with Playwright to detect JavaScript-based pagination
- Performs scroll/click tests to verify pagination behavior
- Results are cached for 15 minutes
- Some sites use hybrid pagination (e.g., infinite scroll + load more button)

# Command: /analyze-dom

Analyze DOM structure and generate CSS selectors for data extraction.

## Usage

```bash
/analyze-dom <url> [options]
```

## Arguments

- `<url>` (required): Target URL to analyze

## Options

- `--sample-size <number>`: Number of items to analyze (default: 5)
- `--output <path>`: Save selector map to file
- `--verbose`: Enable verbose logging

## Examples

### Basic Usage

```bash
/analyze-dom https://example.com/products
```

### Analyze More Items

```bash
/analyze-dom https://example.com/products --sample-size 10
```

## What This Command Does

1. **Item Container Detection**
   - Identifies repeating elements (product cards, list items)
   - Analyzes DOM structure patterns
   - Generates container selector

2. **Field Selector Generation**
   - Locates title/name fields
   - Finds price elements
   - Identifies image URLs
   - Detects description text
   - Discovers additional metadata

3. **Selector Validation**
   - Tests selectors against multiple items
   - Calculates accuracy scores
   - Generates fallback selectors

4. **Confidence Scoring**
   - Evaluates selector specificity
   - Checks cross-item consistency
   - Assigns confidence levels (high/medium/low)

## Output

### Console Output

```
✓ DOM Analysis Complete

Item Container: .product-card
Total Items Found: 24

Field Selectors:
  ✓ title (high confidence)
    Primary: .product-card h3.product-title
    Fallback: .product-card .title
    Accuracy: 100%

  ✓ price (high confidence)
    Primary: .product-card .price-amount
    Attribute: data-price
    Accuracy: 96%

  ✓ image_urls (medium confidence)
    Primary: .product-card img.product-image
    Attribute: src
    Accuracy: 92%

  ⚠ description (low confidence)
    Primary: .product-card .description
    Accuracy: 67%
    Note: Field not present in all items

Overall Confidence: 85%

Next Steps:
  Run: /scrape-url https://example.com/products
  Selectors will be used automatically
```

### JSON Report (with `--output`)

```json
{
  "item_container_selector": ".product-card",
  "field_selectors": {
    "title": {
      "primary": ".product-card h3.product-title",
      "fallback": ".product-card .title",
      "xpath": "//div[@class='product-card']//h3[@class='product-title']",
      "attribute": null,
      "confidence": "high",
      "extraction_notes": "Text content"
    },
    "price": {
      "primary": ".product-card .price-amount",
      "fallback": ".product-card [data-price]",
      "xpath": null,
      "attribute": "data-price",
      "confidence": "high",
      "extraction_notes": "Extract from data-price attribute, parse number"
    },
    "image_urls": {
      "primary": ".product-card img.product-image",
      "fallback": ".product-card img",
      "xpath": null,
      "attribute": "src",
      "confidence": "medium",
      "extraction_notes": "Multiple images possible, extract all src attributes"
    },
    "description": {
      "primary": ".product-card .description",
      "fallback": ".product-card p",
      "xpath": null,
      "attribute": null,
      "confidence": "low",
      "extraction_notes": "Field not present in 33% of items"
    }
  },
  "confidence_scores": {
    "title": 1.0,
    "price": 0.96,
    "image_urls": 0.92,
    "description": 0.67
  },
  "page_url": "https://example.com/products",
  "analysis_timestamp": "2025-12-02T14:30:00Z",
  "total_items_found": 24,
  "notes": "Description field has low completeness, consider as optional"
}
```

## Field Detection

### Priority Fields (Required)

1. **Title/Name**
   - Patterns: `h1`, `h2`, `h3`, `.title`, `.name`, `.product-title`
   - Must be present in ≥ 90% of items
   - Text content extraction

2. **Price**
   - Patterns: `.price`, `[data-price]`, `.amount`, `.cost`
   - Look for currency symbols ($, €, £)
   - Extract from attributes or text
   - Parse to numeric value

3. **Image URLs**
   - Patterns: `img`, `[data-src]`, `picture source`
   - Extract `src`, `data-src`, `srcset` attributes
   - Handle lazy loading
   - Support multiple images per item

### Optional Fields

4. **Description**
   - Patterns: `.description`, `.summary`, `p`
   - May be truncated
   - Often requires "Read More" expansion

5. **URL/Link**
   - Patterns: `a[href]`, `.product-link`
   - Extract `href` attribute
   - Resolve relative URLs

6. **ID/SKU**
   - Patterns: `[data-id]`, `[data-sku]`, `.sku`
   - Extract from attributes or text

## Selector Generation Strategy

### Step 1: Container Detection

```python
# Find repeating elements
containers = page.query_selector_all("*")
repeated_selectors = find_repeated_patterns(containers)

# Score by:
# - Number of instances (higher = better)
# - Consistent structure (more uniform = better)
# - Semantic meaning (.product-card > .item)
```

### Step 2: Field Extraction

```python
# For each field type
for field in ["title", "price", "image_urls", "description"]:
    # Try common patterns
    for pattern in FIELD_PATTERNS[field]:
        selector = f"{container_selector} {pattern}"
        matches = test_selector(selector)

        if matches >= threshold:
            field_selectors[field] = {
                "primary": selector,
                "confidence": calculate_confidence(matches)
            }
```

### Step 3: Fallback Generation

```python
# Generate fallback for each primary selector
for field, primary_selector in field_selectors.items():
    # Make selector less specific
    fallback = generalize_selector(primary_selector)

    # Test fallback
    if test_selector(fallback) >= threshold * 0.8:
        field_selectors[field]["fallback"] = fallback
```

## Confidence Scoring

### High Confidence (≥ 0.85)
- Selector matches ≥ 95% of items
- Unique selector (no ambiguity)
- Semantic class names
- Consistent structure across items

### Medium Confidence (0.6 - 0.84)
- Selector matches 80-94% of items
- Some variation in structure
- Generic class names
- Requires fallback selector

### Low Confidence (< 0.6)
- Selector matches < 80% of items
- High structural variation
- No clear pattern
- May require manual review

## Exit Codes

- `0`: Analysis successful
- `1`: No items detected
- `2`: Unable to generate selectors
- `3`: Network error

## Performance

**Execution Time**: 15-30 seconds

## Agents Used

- `dom-analyzer`

## Related Commands

- `/scrape-url` - Uses generated selectors
- `/detect-pagination` - Provides item container info
- `/investigate-url` - May avoid DOM analysis if API available

## Notes

- This command is only needed for browser scraping (not API scraping)
- Selectors are tested against multiple items for accuracy
- Results are cached for 15 minutes
- Complex sites may require manual selector refinement
- Dynamic class names (e.g., `class="css-1a2b3c"`) are avoided when possible

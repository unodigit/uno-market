# Command: /scrape-url

Execute complete web scraping workflow with investigation, pagination detection, scraping, and validation.

## Usage

```bash
/scrape-url <url> [options]
```

## Arguments

- `<url>` (required): Target URL to scrape

## Options

- `--method <api|browser>`: Force specific scraping method (default: auto-detect)
- `--max-pages <number>`: Maximum pages to scrape (default: unlimited)
- `--output-dir <path>`: Custom output directory (default: `./output`)
- `--skip-validation`: Skip output validation step
- `--verbose`: Enable verbose logging

## Examples

### Basic Usage

```bash
/scrape-url https://example.com/products
```

### Force Browser Method

```bash
/scrape-url https://example.com/products --method browser
```

### Limit Pages

```bash
/scrape-url https://example.com/products --max-pages 5
```

## Workflow

This command executes the following phases:

1. **Phase 1: Investigation** (API-Investigator agent)
   - Discovers API endpoints
   - Detects platform type (Shopify, WordPress, etc.)
   - Determines recommended scraping strategy

2. **Phase 2: Pagination Detection** (Pagination-Detector agent, if needed)
   - Identifies pagination type (infinite scroll, load more, traditional, API)
   - Determines end conditions and selectors

3. **Phase 3: DOM Analysis** (DOM-Analyzer agent, browser method only)
   - Analyzes page structure
   - Generates CSS selectors for data extraction
   - Validates selector accuracy

4. **Phase 4: Code Generation & Execution** (Code-Generator agent)
   - Generates scraper code based on investigation results
   - Executes scraper in isolated environment
   - Collects items and metadata

5. **Phase 5: Validation** (QA-CrossChecker agent)
   - Validates schema compliance
   - Cross-checks items and metadata consistency
   - Calculates data quality metrics

## Output

The command generates two JSON files:

### Items File: `{source_name}_items_{timestamp}.json`

```json
{
  "metadata_file": "example_metadata_20251202_143000.json",
  "items": [
    {
      "id": "product-123",
      "title": "Example Product",
      "price": {
        "amount": 299.99,
        "currency": "USD",
        "display_text": "$299.99"
      },
      "image_urls": ["https://example.com/image1.jpg"],
      "url": "https://example.com/product/123",
      "scraped_at": "2025-12-02T14:30:00Z"
    }
  ]
}
```

### Metadata File: `{source_name}_metadata_{timestamp}.json`

```json
{
  "scraping_session": {
    "source_url": "https://example.com/products",
    "source_name": "example",
    "scrape_timestamp_start": "2025-12-02T14:30:00Z",
    "scrape_timestamp_end": "2025-12-02T14:32:15Z",
    "duration_seconds": 135.2,
    "scraping_method": "api"
  },
  "pagination_info": {
    "type": "api_pagination",
    "total_pages": 3,
    "items_per_page": 30
  },
  "items_summary": {
    "total_items_found": 75,
    "items_successfully_scraped": 75,
    "items_with_errors": 0,
    "data_quality_percentage": 92.0
  },
  "field_completeness": {
    "title": 100.0,
    "price": 98.0,
    "image_urls": 95.0,
    "description": 80.0
  },
  "investigation_notes": {
    "api_endpoints_found": [
      "https://example.com/products.json"
    ],
    "api_used": true,
    "platform_detected": "shopify"
  },
  "output_files": {
    "items_file": "example_items_20251202_143000.json",
    "metadata_file": "example_metadata_20251202_143000.json"
  }
}
```

## Exit Codes

- `0`: Success
- `1`: Investigation failed (no API or selectors found)
- `2`: Scraping failed (network errors, CAPTCHA detected)
- `3`: Validation failed (schema errors, inconsistencies)
- `4`: Invalid arguments

## Error Handling

### CAPTCHA Detected

```
Error: CAPTCHA detected on page
Recommendation: Add delays or use residential proxies
```

### No API Endpoints Found

```
Warning: No API endpoints discovered, falling back to browser scraping
This may take longer (2-10 minutes)
```

### Item Count Mismatch

```
Error: QA check failed - item count mismatch
  Metadata reports: 25 items
  Items file contains: 23 items

Auto-refactored code saved to: example_scraper_refactored.py
Review changes and re-run scraper
```

## Performance

- **API Method**: 30 seconds - 2 minutes
- **Browser Method**: 2-10 minutes (depending on pagination)

## Agents Used

- `api-investigator` (Phase 1)
- `pagination-detector` (Phase 2, conditional)
- `dom-analyzer` (Phase 3, browser method only)
- `code-generator` (Phase 4)
- `qa-crosschecker` (Phase 5)

## Related Commands

- `/investigate-url` - Investigation only (Phase 1)
- `/detect-pagination` - Pagination detection only (Phase 2)
- `/analyze-dom` - DOM analysis only (Phase 3)
- `/validate-output` - Schema validation only
- `/qa-crosscheck` - Consistency checking only

## Notes

- This command respects rate limits and includes delays to avoid detection
- Stealth mode is enabled by default for browser scraping
- All scraper code is saved to `./scrapers/` directory for review
- Metrics are logged to `./metrics/` in JSONL format

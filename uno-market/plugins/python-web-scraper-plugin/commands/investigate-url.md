# Command: /investigate-url

Investigate target URL for API endpoints and platform type without scraping.

## Usage

```bash
/investigate-url <url> [options]
```

## Arguments

- `<url>` (required): Target URL to investigate

## Options

- `--timeout <seconds>`: Request timeout (default: 30)
- `--output <path>`: Save investigation report to file
- `--verbose`: Enable verbose logging

## Examples

### Basic Usage

```bash
/investigate-url https://example.com/products
```

### Save Report to File

```bash
/investigate-url https://example.com/products --output investigation_report.json
```

## What This Command Does

1. **Platform Detection**
   - Analyzes HTML meta tags for platform identifiers
   - Checks script sources (e.g., `cdn.shopify.com`)
   - Matches against known platform patterns

2. **API Endpoint Discovery**
   - Probes common API patterns (`/products.json`, `/wp-json/`, etc.)
   - Extracts endpoints from JavaScript files
   - Tests discovered endpoints with HEAD requests

3. **Strategy Recommendation**
   - Evaluates API availability and completeness
   - Recommends fastest scraping method (API vs browser)
   - Calculates confidence score

## Output

### Console Output

```
✓ Investigation Complete

Platform Detected: Shopify (confidence: high)
Recommended Strategy: API

Discovered Endpoints:
  1. https://example.com/products.json
     Method: GET
     Response Type: application/json
     Confidence: high

  2. https://example.com/collections/all/products.json
     Method: GET
     Response Type: application/json
     Confidence: medium

Confidence Score: 0.92

Next Steps:
  Run: /scrape-url https://example.com/products
  Expected Time: 30 seconds - 2 minutes (API method)
```

### JSON Report (with `--output`)

```json
{
  "target_url": "https://example.com/products",
  "timestamp": "2025-12-02T14:30:00Z",
  "discovered_endpoints": [
    {
      "url": "https://example.com/products.json",
      "method": "GET",
      "response_type": "application/json",
      "confidence": "high",
      "tested": true,
      "status_code": 200
    }
  ],
  "platform_detected": "shopify",
  "platform_confidence": "high",
  "recommended_strategy": "api",
  "confidence_score": 0.92,
  "metadata": {
    "investigation_duration_seconds": 2.5,
    "endpoints_probed": 15,
    "endpoints_found": 2
  }
}
```

## Platform Detection

Supports detection of:

- **Shopify**: Checks for `cdn.shopify.com`, tests `/products.json`
- **WordPress**: Checks for `wp-content`, tests `/wp-json/wp/v2/`
- **WooCommerce**: Checks for WooCommerce scripts, tests `/wp-json/wc/v3/`
- **Magento**: Checks for Magento scripts, tests `/rest/V1/products`
- **BigCommerce**: Checks for BigCommerce identifiers
- **Custom**: Falls back for unknown platforms

## Recommended Strategy

### "API" Strategy

Recommended when:
- Valid API endpoints discovered
- Endpoints return structured JSON
- Data appears complete (titles, prices, images)

**Advantage**: 5-10x faster than browser scraping

### "Browser" Strategy

Recommended when:
- No API endpoints found
- API data incomplete or requires authentication
- JavaScript rendering required

**Advantage**: More comprehensive, handles dynamic content

## Exit Codes

- `0`: Investigation successful
- `1`: Network error (URL unreachable)
- `2`: Invalid URL format
- `3`: Timeout exceeded

## Performance

**Execution Time**: 10-30 seconds

## Agents Used

- `api-investigator`

## Related Commands

- `/scrape-url` - Complete scraping workflow (includes investigation)
- `/detect-pagination` - Pagination detection
- `/analyze-dom` - DOM structure analysis

## Notes

- This command is non-destructive and makes minimal requests
- Results are cached for 15 minutes to speed up subsequent `/scrape-url` calls
- All requests include standard user-agent headers to avoid detection
- No data is scraped, only endpoint availability is tested

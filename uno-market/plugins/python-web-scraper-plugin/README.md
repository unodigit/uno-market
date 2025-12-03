# Python Web Scraper Plugin

**Version**: 1.0.0
**Author**: uno-market
**License**: MIT

AI-powered web scraping plugin with investigation-first methodology, automatic API discovery, browser automation fallback, and self-healing output validation for Claude Code.

---

## Features

- **Investigation-First Methodology**: Mandatory API discovery before resorting to browser automation
- **Automatic Platform Detection**: Detects Shopify, WordPress, WooCommerce, Magento, BigCommerce, and custom platforms
- **Intelligent Pagination**: Detects and handles infinite scroll, load more buttons, traditional pagination, and API pagination
- **Self-Healing QA**: Automatic cross-checking of items and metadata with code refactoring when inconsistencies are detected
- **Dual Output Structure**: Separate JSON files for scraped items and metadata with bidirectional references
- **Performance Optimized**: Uses Playwright + stealth techniques for browser automation, Pydantic v2 for validation

---

## Installation

### 1. Add Uno Marketplace

```bash
claude> /plugin marketplace add https://github.com/uno-market/marketplace
```

### 2. Install Plugin

```bash
claude> /plugin install python-web-scraper-plugin@uno-market
```

### 3. Verify Installation

```bash
claude> /plugin list
```

You should see `python-web-scraper-plugin` in the list.

---

## Quick Start

### Scenario 1: One-Command Scraping

```bash
claude> /scrape-url https://example.com/products
```

This will:
1. Investigate the URL for API endpoints
2. Detect pagination type
3. Generate and execute scraper code
4. Validate output quality
5. Save two files: `example_items_*.json` and `example_metadata_*.json`

### Scenario 2: Investigation First (Recommended)

```bash
claude> /investigate-url https://example.com/products
```

Output example:

```json
{
  "platform_detected": "shopify",
  "recommended_strategy": "api",
  "discovered_endpoints": [
    {
      "url": "https://example.com/products.json",
      "method": "GET",
      "response_type": "json",
      "confidence": "high"
    }
  ],
  "confidence_score": 0.92
}
```

Then run:

```bash
claude> /scrape-url https://example.com/products
```

---

## Available Commands

| Command | Description | Usage |
|---------|-------------|-------|
| `/scrape-url <url>` | Complete scraping workflow | `/scrape-url https://example.com/products` |
| `/investigate-url <url>` | API discovery only | `/investigate-url https://example.com/products` |
| `/detect-pagination <url>` | Detect pagination type | `/detect-pagination https://example.com/products` |
| `/analyze-dom <url>` | Analyze DOM structure | `/analyze-dom https://example.com/products` |
| `/validate-output <file>` | Validate scraped data | `/validate-output items.json` |
| `/qa-crosscheck <items> <metadata>` | Cross-check consistency | `/qa-crosscheck items.json metadata.json` |
| `/metrics-report --period 7d` | Generate metrics report | `/metrics-report --period 30d` |

---

## Workflows

### Workflow A: API-Based Scraping (Fast)

**Use When**: Site exposes JSON APIs (Shopify, WordPress, etc.)

```bash
# 1. Investigate
claude> /investigate-url https://shopify-store.com/products

# 2. Scrape (API method)
claude> /scrape-url https://shopify-store.com/products

# 3. Validate
claude> /validate-output shopify_store_items_*.json
```

**Expected Time**: 30 seconds - 2 minutes

### Workflow B: Browser-Based Scraping (Comprehensive)

**Use When**: Site uses JavaScript rendering, no API available

```bash
# 1. Investigate
claude> /investigate-url https://dynamic-site.com/listings

# 2. Detect Pagination
claude> /detect-pagination https://dynamic-site.com/listings

# 3. Analyze DOM Structure
claude> /analyze-dom https://dynamic-site.com/listings

# 4. Scrape (Browser method)
claude> /scrape-url https://dynamic-site.com/listings

# 5. QA Cross-Check
claude> /qa-crosscheck dynamic_site_items_*.json dynamic_site_metadata_*.json
```

**Expected Time**: 2-10 minutes

---

## Output Files

### Items File (`*_items_*.json`)

Contains the scraped data:

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

### Metadata File (`*_metadata_*.json`)

Contains quality metrics and session information:

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
  "items_summary": {
    "total_items_found": 25,
    "items_successfully_scraped": 25,
    "items_with_errors": 0,
    "data_quality_percentage": 88.0
  },
  "field_completeness": {
    "title": 98.0,
    "price": 95.0,
    "image_urls": 87.0,
    "description": 72.0
  }
}
```

---

## Configuration

### QA Thresholds

Adjust thresholds in `.claude-plugin/marketplace.json`:

```json
{
  "configuration": {
    "qa_thresholds": {
      "item_count_variance": 0.02,
      "item_count_absolute": 3,
      "timestamp_deviation_seconds": 60,
      "field_completeness_variance": 0.05
    }
  }
}
```

### Custom Platform Patterns

Add custom patterns to `config/platform_patterns.json`:

```json
{
  "my_custom_platform": {
    "detection": {
      "meta_tag": "custom-platform",
      "script_src": "custom.cdn.com"
    },
    "api_endpoints": [
      "/api/v1/products",
      "/api/v1/listings"
    ]
  }
}
```

---

## Troubleshooting

### Issue: "Virtual environment not activated"

**Solution**:

```bash
cd ~/.claude/plugins/python-web-scraper-plugin
bash scripts/setup_environment.sh
```

### Issue: "No API endpoints discovered"

**Explanation**: Site doesn't expose JSON APIs; browser scraping required.

**Solution**: Use full workflow (investigate → detect-pagination → analyze-dom → scrape)

### Issue: "QA check failed: item count mismatch"

**Explanation**: Scraper code has pagination or selector issues.

**Solution**:

```bash
claude> /qa-crosscheck items.json metadata.json --auto-refactor
```

Review refactored code and re-run scraper if changes look correct.

---

## Architecture

### Agents

- **API-Investigator**: Discovers API endpoints and platform type
- **Pagination-Detector**: Detects pagination patterns
- **DOM-Analyzer**: Analyzes DOM structure and generates selectors
- **Code-Generator**: Generates scraper code from analysis
- **QA-CrossChecker**: Validates output consistency and auto-refactors

### Hooks

- **Post-Output Hook**: Automatically validates output after scraping with QA-CrossChecker

### Dependencies

- Python 3.8+
- `requests` >= 2.31.0 (API scraping)
- `playwright` >= 1.40.0 (browser automation)
- `playwright-stealth` >= 1.0.0 (detection evasion)
- `pydantic` >= 2.0.0 (schema validation)
- `libcst` >= 1.1.0 (code refactoring)
- `structlog` >= 23.0.0 (structured logging)
- `pytest` >= 7.4.0 (testing)

---

## Performance

- **API Scraping**: 30 seconds - 2 minutes
- **Browser Scraping**: 2-10 minutes
- **QA Cross-Check**: < 5 seconds
- **Hook Execution**: < 5 seconds

---

## Best Practices

1. **Always investigate first** to determine the fastest scraping method
2. **Use QA cross-checking** to ensure data quality
3. **Monitor metrics** to track scraping performance over time
4. **Customize platform patterns** for better detection accuracy

---

## Support

- **Documentation**: See `quickstart.md` for detailed usage examples
- **Issues**: https://github.com/uno-market/python-web-scraper-plugin/issues
- **Community**: https://discord.gg/claude-code

---

## License

MIT License - See LICENSE file for details

---

**Generated by**: Python Web Scraper Plugin v1.0.0
**Documentation Version**: 2025-12-02

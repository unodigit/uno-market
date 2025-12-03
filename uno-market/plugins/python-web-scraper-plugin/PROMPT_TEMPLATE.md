# Python Web Scrater Plugin Prompt Template

Copy and paste this template to perform web scraping tasks using the Python Web Scraper Plugin:

```
I want to scrape data from [WEBSITE_URL] using the Python Web Scraper Plugin. Here are the requirements:

## Scraping Target
- **URL**: [TARGET_URL]
- **Data Type**: [products|articles|listings|prices|inventory|custom]
- **Target Platform**: [shopify|wordpress|unknown|auto-detect]
- **Items to Scrape**: [number or 'all']

## Data Requirements
1. [FIELD_1]: [description/importance level]
2. [FIELD_2]: [description/importance level]
3. [FIELD_3]: [description/importance level]
- [Additional fields...]

## Output Preferences
- **Format**: [json|csv|xml]
- **File Structure**: [dual-files|single-file]
- **Include Metadata**: [yes|no]
- **Quality Threshold**: [percentage%]

## Technical Constraints
- **Method Preference**: [api-first|browser-first|auto-detect]
- **Max Pages**: [number or 'unlimited']
- **Timeout**: [seconds]
- **Rate Limiting**: [yes|no]

## Quality Assurance
- **Auto Validation**: [yes|no]
- **Cross-Check**: [yes|no]
- **Auto Refactor**: [yes|no]
- **Field Completeness**: [minimum percentage%]

Please use the Python Web Scraper Plugin to:
1. Investigate the target URL for API endpoints and platform detection
2. Determine the optimal scraping strategy (API vs Browser)
3. Generate and execute the appropriate scraper code
4. Validate output quality and perform QA cross-checking
5. Generate a metrics report if requested

Start with URL investigation to determine the fastest scraping method.
```

## Example: E-commerce Product Scraping

```
I want to scrape data from https://example-store.com/products using the Python Web Scraper Plugin. Here are the requirements:

## Scraping Target
- **URL**: https://example-store.com/products
- **Data Type**: products
- **Target Platform**: auto-detect
- **Items to Scrape**: all

## Data Requirements
1. Product Title: Required, unique identifier
2. Price: Required, numeric value with currency
3. Product Images: Required, array of image URLs
4. Product Description: Optional, full text description
5. Product URL: Required, direct product page link
6. SKU/ID: Optional, internal product identifier
7. Availability: Required, in stock/out of stock status
8. Categories: Optional, product categories or tags

## Output Preferences
- **Format**: json
- **File Structure**: dual-files (items + metadata)
- **Include Metadata**: yes
- **Quality Threshold**: 90%

## Technical Constraints
- **Method Preference**: api-first
- **Max Pages**: 50
- **Timeout**: 30 seconds per page
- **Rate Limiting**: yes

## Quality Assurance
- **Auto Validation**: yes
- **Cross-Check**: yes
- **Auto Refactor**: yes
- **Field Completeness**: 95%

Please use the Python Web Scrater Plugin to:
1. Investigate the target URL for API endpoints and platform detection
2. Determine the optimal scraping strategy (API vs Browser)
3. Generate and execute the appropriate scraper code
4. Validate output quality and perform QA cross-checking
5. Generate a metrics report if requested

Start with URL investigation to determine the fastest scraping method.
```

## Example: News Article Scraping

```
I want to scrape data from https://news-site.com/latest-articles using the Python Web Scraper Plugin. Here are the requirements:

## Scraping Target
- **URL**: https://news-site.com/latest-articles
- **Data Type**: articles
- **Target Platform**: auto-detect
- **Items to Scrape**: 100

## Data Requirements
1. Article Title: Required, main headline
2. Article URL: Required, direct article link
3. Publication Date: Required, ISO format timestamp
4. Author: Optional, article author name
5. Summary/Excerpt: Required, article summary
6. Category: Optional, article category or section
7. Image URLs: Optional, article featured images

## Output Preferences
- **Format**: json
- **File Structure**: dual-files (items + metadata)
- **Include Metadata**: yes
- **Quality Threshold**: 85%

## Technical Constraints
- **Method Preference**: auto-detect
- **Max Pages**: 10
- **Timeout**: 45 seconds per page
- **Rate Limiting**: yes

## Quality Assurance
- **Auto Validation**: yes
- **Cross-Check**: yes
- **Auto Refactor**: no
- **Field Completeness**: 90%

Please use the Python Web Scrater Plugin to:
1. Investigate the target URL for API endpoints and platform detection
2. Determine the optimal scraping strategy (API vs Browser)
3. Generate and execute the appropriate scraper code
4. Validate output quality and perform QA cross-checking
5. Generate a metrics report if requested

Start with URL investigation to determine the fastest scraping method.
```

## Available Plugin Commands Reference

### Quick Start Commands
- `/investigate-url <URL>` - Investigate target for API endpoints and platform detection
- `/scrape-url <URL>` - Complete scraping workflow (investigation + scraping + validation)
- `/detect-pagination <URL>` - Detect pagination type and implementation strategy
- `/analyze-dom <URL>` - Analyze DOM structure and generate CSS selectors

### Quality Assurance Commands
- `/validate-output <file>` - Validate scraped data against schema and quality requirements
- `/qa-crosscheck <items> <metadata>` - Cross-validate items and metadata files with auto-fix
- `/metrics-report --period 7d` - Generate historical performance and quality metrics report

### Workflow Examples

#### Fast API Scraping (Shopify, WordPress, etc.)
```bash
# Step 1: Investigation (30 seconds)
/investigate-url https://shopify-store.com/products

# Step 2: Scrape (1-2 minutes if API available)
/scrape-url https://shopify-store.com/products

# Step 3: Validate (10 seconds)
/validate-output shopify_store_items_*.json
```

#### Comprehensive Browser Scraping (JavaScript sites)
```bash
# Step 1: Investigation (30 seconds)
/investigate-url https://dynamic-site.com/listings

# Step 2: Pagination Detection (10 seconds)
/detect-pagination https://dynamic-site.com/listings

# Step 3: DOM Analysis (20 seconds)
/analyze-dom https://dynamic-site.com/listings

# Step 4: Scrape (5-15 minutes)
/scrape-url https://dynamic-site.com/listings

# Step 5: QA Cross-Check (5 seconds)
/qa-crosscheck dynamic_site_items_*.json dynamic_site_metadata_*.json
```

## Platform Detection Capabilities

The plugin automatically detects and optimizes for:
- **Shopify**: Products, collections, inventory APIs
- **WordPress**: WP REST API, custom post types
- **Next.js**: Static data hydration, JSON APIs
- **Gatsby**: Page-data.json, static generation
- **Algolia**: Search indices, real-time data
- **Custom Platforms**: Generic API discovery and DOM analysis

## Output File Structure

### Items File: `{source}_items_{timestamp}.json`
```json
{
  "metadata_file": "source_metadata_20251202_143000.json",
  "items": [
    {
      "id": "unique-identifier",
      "title": "Item Title",
      "price": {
        "amount": 299.99,
        "currency": "USD"
      },
      "image_urls": ["https://example.com/image.jpg"],
      "url": "https://example.com/item/123",
      "scraped_at": "2025-12-02T14:30:00Z"
    }
  ]
}
```

### Metadata File: `{source}_metadata_{timestamp}.json`
```json
{
  "scraping_session": {
    "source_url": "https://example.com",
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

## Performance Targets

- **API Discovery**: 30 seconds
- **API Scraping**: 1-5 minutes for 100 items
- **Browser Scraping**: 5-15 minutes for 100 items
- **QA Validation**: 5-10 seconds
- **Auto Refactoring**: 10-30 seconds
- **Total Hook Execution**: Under 5 seconds

## Quality Thresholds

Adjust these in the plugin configuration:
- **Item Count Variance**: 2% tolerance
- **Field Completeness**: Minimum 90% for critical fields
- **Auto Refactoring**: 80% success rate
- **Data Quality**: Minimum 80% overall score

---

**Plugin Version**: 1.0.0
**Documentation Updated**: 2025-12-02
**Repository**: https://github.com/uno-market/python-web-scraper-plugin
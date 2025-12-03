# Command: /validate-output

Validate scraped data against JSON schema and calculate quality metrics.

## Usage

```bash
/validate-output <file> [options]
```

## Arguments

- `<file>` (required): Path to items or metadata JSON file

## Options

- `--schema <path>`: Custom JSON schema file (default: use built-in)
- `--strict`: Strict mode (fail on warnings)
- `--verbose`: Show detailed validation results

## Examples

### Basic Usage

```bash
/validate-output example_items_20251202_143000.json
```

### Strict Validation

```bash
/validate-output items.json --strict
```

### Custom Schema

```bash
/validate-output items.json --schema custom_schema.json
```

## What This Command Does

1. **Schema Detection**
   - Automatically detects file type (items vs metadata)
   - Loads appropriate JSON schema
   - Validates against schema requirements

2. **Schema Validation**
   - Checks required fields
   - Validates field types
   - Verifies format constraints
   - Checks array/object structures

3. **Data Quality Assessment**
   - Calculates field completeness
   - Detects missing values
   - Identifies data anomalies
   - Scores overall quality

4. **Report Generation**
   - Lists validation errors
   - Provides recommendations
   - Calculates quality score

## Output

### Success Output

```
✓ Schema Validation: PASS

File: example_items_20251202_143000.json
Type: Items file
Items Count: 25

✓ Required Fields: All present
✓ Field Types: Valid
✓ Format Constraints: Valid

Field Completeness:
  ✓ title: 100% (25/25)
  ✓ price: 100% (25/25)
  ✓ image_urls: 96% (24/25)
  ✓ description: 80% (20/25)
  ✓ url: 100% (25/25)

Data Quality Score: 95/100

⚠ Warnings:
  - 1 item missing image_urls
  - 5 items missing description (acceptable)

✓ Validation complete - no critical issues
```

### Failure Output

```
✗ Schema Validation: FAIL

File: example_items_20251202_143000.json
Type: Items file
Items Count: 25

Errors:
  1. items[3].price.amount
     Expected: number
     Got: string "299.99"
     Location: Line 42

  2. items[7].scraped_at
     Expected: ISO 8601 date-time
     Got: "2025-12-02 14:30:00" (invalid format)
     Location: Line 89

  3. Missing required field
     Field: metadata_file
     Location: Root object

Field Completeness:
  ✗ title: 92% (23/25) - Below 95% threshold
  ✓ price: 100% (25/25)
  ✓ image_urls: 88% (22/25)
  ✓ description: 76% (19/25)

Data Quality Score: 72/100

Recommendations:
  1. Fix price data type in items[3]
  2. Use ISO 8601 format for all timestamps
  3. Add metadata_file reference to root object
  4. Review title extraction - 2 items missing

✗ Validation failed - 3 critical errors
```

## Validation Checks

### Schema Validation (Critical)

**Items File (`*_items_*.json`)**:
- `metadata_file` (string, required)
- `items` (array, required)
  - `id` (string, optional)
  - `title` (string, required)
  - `price` (object, required)
    - `amount` (number, required)
    - `currency` (string, required)
    - `display_text` (string, optional)
  - `image_urls` (array of strings, required)
  - `url` (string, required)
  - `description` (string, optional)
  - `scraped_at` (ISO 8601 date-time, required)

**Metadata File (`*_metadata_*.json`)**:
- `scraping_session` (object, required)
  - `source_url` (string, required)
  - `source_name` (string, required)
  - `scrape_timestamp_start` (ISO 8601, required)
  - `scrape_timestamp_end` (ISO 8601, required)
  - `duration_seconds` (number, required)
  - `scraping_method` (enum: "api" | "browser", required)
- `pagination_info` (object, required)
- `items_summary` (object, required)
- `field_completeness` (object, required)
- `investigation_notes` (object, required)
- `output_files` (object, required)

### Data Quality Checks (Warnings)

1. **Field Completeness Thresholds**:
   - Critical fields (title, price): ≥ 95%
   - Important fields (image_urls, url): ≥ 90%
   - Optional fields (description): ≥ 70%

2. **Data Anomalies**:
   - Duplicate items (same ID or URL)
   - Price outliers (> 3 standard deviations)
   - Suspiciously short titles (< 5 characters)
   - Missing images (empty array)

3. **Consistency Checks**:
   - All timestamps within 24-hour window
   - All prices have valid currency codes
   - All URLs are valid HTTP(S)

## Quality Scoring

```python
def calculate_quality_score(validation_results):
    score = 100

    # Deduct for schema errors (critical)
    score -= len(schema_errors) * 10

    # Deduct for missing critical fields
    if title_completeness < 0.95:
        score -= (0.95 - title_completeness) * 50
    if price_completeness < 0.95:
        score -= (0.95 - price_completeness) * 50

    # Deduct for missing important fields
    if image_completeness < 0.90:
        score -= (0.90 - image_completeness) * 30

    # Deduct for data anomalies
    score -= len(duplicates) * 2
    score -= len(outliers) * 1

    return max(0, score)
```

## Exit Codes

- `0`: Validation passed (quality score ≥ 90)
- `1`: Validation passed with warnings (quality score 70-89)
- `2`: Validation failed (schema errors or quality score < 70)
- `3`: File not found or invalid JSON

## Performance

**Execution Time**: < 5 seconds for 10,000 items

## Related Commands

- `/scrape-url` - Includes automatic validation
- `/qa-crosscheck` - Cross-checks items and metadata consistency

## Notes

- This command validates schema compliance only (not cross-file consistency)
- Use `/qa-crosscheck` for consistency validation between items and metadata files
- Validation results are logged to `logs/validation_*.json`
- Custom schemas must follow JSON Schema Draft-07 specification

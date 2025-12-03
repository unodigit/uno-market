# Command: /qa-crosscheck

Cross-check items and metadata files for consistency with automatic code refactoring on failure.

## Usage

```bash
/qa-crosscheck <items_file> <metadata_file> [options]
```

## Arguments

- `<items_file>` (required): Path to items JSON file
- `<metadata_file>` (required): Path to metadata JSON file

## Options

- `--tolerance <percentage>`: Item count variance tolerance (default: 2%)
- `--auto-refactor`: Automatically refactor code on failure (default: false)
- `--output <path>`: Save refactored code to custom path
- `--verbose`: Enable verbose logging

## Examples

### Basic Usage

```bash
/qa-crosscheck example_items_20251202_143000.json example_metadata_20251202_143000.json
```

### With Auto-Refactoring

```bash
/qa-crosscheck items.json metadata.json --auto-refactor
```

### Custom Tolerance

```bash
/qa-crosscheck items.json metadata.json --tolerance 5%
```

## Validation Checks

### 1. Item Count Consistency

**Check**: Metadata `total_items_found` matches items array length

**Tolerance**: ≤ 2% or ≤ 3 items (whichever is smaller)

**Example Failure**:
```
✗ Item Count Mismatch
  Metadata reports: 100 items
  Items file contains: 97 items
  Variance: 3% (exceeds 2% threshold)
```

### 2. Bidirectional Reference Validation

**Check**: Items file references correct metadata file and vice versa

**Tolerance**: Zero tolerance (100% match required)

**Example Failure**:
```
✗ Cross-Reference Mismatch
  Items file references: example_metadata_20251202_143000.json
  Metadata file name: example_metadata_20251202_143500.json
```

### 3. Timestamp Consistency

**Check**: Item timestamps match scraping session window

**Tolerance**: ≤ 60 seconds deviation

**Example Failure**:
```
✗ Timestamp Deviation Detected
  Session start: 2025-12-02T14:30:00Z
  Session end: 2025-12-02T14:32:00Z
  Item #42 timestamp: 2025-12-02T14:25:00Z (5 minutes before session start)
```

### 4. Field Completeness Alignment

**Check**: Reported field completeness matches actual data

**Tolerance**: ≤ 5% difference

**Example Failure**:
```
✗ Field Completeness Mismatch
  Field: title
  Metadata reports: 100%
  Actual completeness: 92%
  Difference: 8% (exceeds 5% threshold)
```

### 5. Schema Validation

**Check**: Both files comply with JSON schemas

**Tolerance**: Zero tolerance

**Example Failure**:
```
✗ Schema Validation Failed
  File: items.json
  Field: items[3].price.amount
  Error: Expected number, got string "299.99"
```

## Output

### Success Output

```
✓ QA Cross-Check: PASS

Item Count: 100 items (variance: 0%)
Cross-References: Valid
Timestamps: Consistent (max deviation: 2 seconds)
Field Completeness: Aligned (max difference: 1.5%)
Schema Validation: PASS

Data Quality Score: 95/100

✓ All checks passed
```

### Failure Output (Without Auto-Refactor)

```
✗ QA Cross-Check: FAIL

Item Count Mismatch:
  Metadata reports: 100 items
  Items file contains: 97 items
  Variance: 3% (exceeds 2% threshold)

Field Completeness Mismatch:
  Field: description
  Metadata reports: 80%
  Actual completeness: 72%
  Difference: 8% (exceeds 5% threshold)

Root Cause Analysis:
  Pagination logic stopped early (missing 3 items from last page)
  Description selector not matching all variants

Recommended Actions:
  1. Review pagination end condition in scraper code
  2. Add fallback selector for description field
  3. Re-run scraper with fixes

To auto-refactor code:
  /qa-crosscheck items.json metadata.json --auto-refactor
```

### Failure Output (With Auto-Refactor)

```
✗ QA Cross-Check: FAIL

[... validation errors ...]

Root Cause Analysis:
  Pagination logic stopped early (missing 3 items from last page)

Auto-Refactoring...

Changes Applied:
  1. Updated pagination end condition:
     - Old: while next_button.is_visible()
     + New: while next_button.is_visible() and items_collected < total_items

  2. Added retry logic for failed items

Refactored Code Saved:
  ./scrapers/example_scraper_refactored.py

Review changes and re-run scraper:
  python scrapers/example_scraper_refactored.py
```

## Root Cause Detection

The QA-CrossChecker agent analyzes failures to identify common issues:

### Pagination Issues
- End condition too aggressive
- Missing "load more" clicks
- Infinite scroll not triggering

### Selector Issues
- CSS selector too specific
- Missing fallback selectors
- Dynamic class names

### Timing Issues
- Items loading after script completes
- Timestamps captured at wrong time
- Session window too narrow

## Auto-Refactoring

When `--auto-refactor` is enabled, the agent:

1. **Analyzes** scraper code to identify root cause
2. **Refactors** using LibCST (lossless AST manipulation)
3. **Validates** refactored code syntax
4. **Saves** to `{original_name}_refactored.py`
5. **Recommends** review and re-run

**Important**: Refactored code must be manually reviewed before execution

## Configurable Thresholds

Default thresholds can be overridden in `.claude-plugin/marketplace.json`:

```json
{
  "configuration": {
    "qa_thresholds": {
      "item_count_variance": 0.02,
      "item_count_absolute": 3,
      "timestamp_deviation_seconds": 60,
      "field_completeness_variance": 0.05,
      "cross_reference_tolerance": 0.0
    }
  }
}
```

## Exit Codes

- `0`: All checks passed
- `1`: Validation failed (with detailed report)
- `2`: File not found or invalid JSON
- `3`: Auto-refactor failed

## Performance

**Execution Time**: 5-15 seconds (depending on data size)

## Agents Used

- `qa-crosschecker`

## Related Commands

- `/scrape-url` - Includes automatic QA check via post-output hook
- `/validate-output` - Schema validation only (no cross-checking)

## Notes

- This command is automatically triggered via post-output hook after `/scrape-url`
- Refactored code preserves comments and formatting (LibCST lossless parsing)
- All QA checks are logged to `./metrics/qa_checks.jsonl`
- Failures are categorized by severity (critical, warning, info)

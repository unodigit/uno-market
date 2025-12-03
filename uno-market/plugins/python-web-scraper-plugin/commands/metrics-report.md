# Command: /metrics-report

Generate performance metrics report for scraping sessions.

## Usage

```bash
/metrics-report [options]
```

## Options

- `--period <duration>`: Time period to analyze (default: 7d)
  - Examples: `1d`, `7d`, `30d`, `90d`
- `--format <type>`: Output format (default: table)
  - Options: `table`, `json`, `csv`
- `--output <path>`: Save report to file
- `--filter <pattern>`: Filter by source name pattern

## Examples

### Last 7 Days (Default)

```bash
/metrics-report
```

### Last 30 Days (JSON Format)

```bash
/metrics-report --period 30d --format json
```

### Specific Source

```bash
/metrics-report --filter shopify-store --period 90d
```

### Save to File

```bash
/metrics-report --period 30d --output metrics_report.csv --format csv
```

## What This Command Does

1. **Metrics Collection**
   - Reads metrics from `metrics/*.jsonl` files
   - Filters by time period
   - Aggregates session data

2. **Performance Analysis**
   - Calculates success rates
   - Measures average execution times
   - Tracks data quality trends
   - Identifies common errors

3. **Report Generation**
   - Formats data for display
   - Generates visualizations (table format)
   - Exports to requested format

## Output

### Table Format (Default)

```
Metrics Report (Last 7 Days)
Generated: 2025-12-02 14:30:00

═══════════════════════════════════════════════════════════════════

SUMMARY
-------
Total Sessions: 42
Successful: 40 (95.2%)
Failed: 2 (4.8%)

Average Duration: 2m 15s
Fastest: 28s (shopify-store, API method)
Slowest: 8m 42s (custom-site, browser method)

Total Items Scraped: 3,247
Average Quality Score: 92.3/100

═══════════════════════════════════════════════════════════════════

PERFORMANCE BY METHOD
---------------------
API Scraping:
  Sessions: 28 (66.7%)
  Success Rate: 100%
  Avg Duration: 1m 12s
  Avg Items/Session: 85
  Avg Quality: 94.2/100

Browser Scraping:
  Sessions: 14 (33.3%)
  Success Rate: 85.7%
  Avg Duration: 4m 38s
  Avg Items/Session: 62
  Avg Quality: 88.1/100

═══════════════════════════════════════════════════════════════════

TOP SOURCES (By Sessions)
--------------------------
1. shopify-store          12 sessions   100% success   92.5/100 quality
2. wordpress-blog          8 sessions   100% success   95.1/100 quality
3. custom-ecommerce        6 sessions    83% success   87.3/100 quality
4. woocommerce-shop        5 sessions   100% success   91.8/100 quality
5. magento-store           4 sessions   100% success   93.2/100 quality

═══════════════════════════════════════════════════════════════════

QA VALIDATION
-------------
Total QA Checks: 40
Passed: 38 (95.0%)
Failed: 2 (5.0%)

Common Issues:
  - Item count mismatch: 1 occurrence
  - Field completeness: 1 occurrence

Auto-Refactor Success: 0% (not yet implemented)

═══════════════════════════════════════════════════════════════════

ERRORS
------
Network Timeouts: 1
CAPTCHA Detected: 1
Pagination Issues: 0
Selector Errors: 0

═══════════════════════════════════════════════════════════════════

TRENDS (Last 7 Days)
--------------------
Day         Sessions  Success%  Avg Quality  Avg Duration
2025-12-02        8      100%        93.2        2m 05s
2025-12-01        6      100%        91.8        2m 18s
2025-11-30        7       86%        89.5        2m 42s
2025-11-29        5      100%        94.1        1m 58s
2025-11-28        4      100%        92.7        2m 12s
2025-11-27        6      100%        93.5        2m 08s
2025-11-26        6       83%        90.2        2m 35s

═══════════════════════════════════════════════════════════════════
```

### JSON Format

```json
{
  "period": "7d",
  "generated_at": "2025-12-02T14:30:00Z",
  "summary": {
    "total_sessions": 42,
    "successful_sessions": 40,
    "failed_sessions": 2,
    "success_rate": 0.952,
    "average_duration_seconds": 135,
    "fastest_session_seconds": 28,
    "slowest_session_seconds": 522,
    "total_items_scraped": 3247,
    "average_quality_score": 92.3
  },
  "by_method": {
    "api": {
      "sessions": 28,
      "success_rate": 1.0,
      "avg_duration_seconds": 72,
      "avg_items_per_session": 85,
      "avg_quality_score": 94.2
    },
    "browser": {
      "sessions": 14,
      "success_rate": 0.857,
      "avg_duration_seconds": 278,
      "avg_items_per_session": 62,
      "avg_quality_score": 88.1
    }
  },
  "top_sources": [
    {
      "source_name": "shopify-store",
      "sessions": 12,
      "success_rate": 1.0,
      "avg_quality_score": 92.5
    }
  ],
  "qa_validation": {
    "total_checks": 40,
    "passed": 38,
    "failed": 2,
    "pass_rate": 0.95,
    "common_issues": {
      "item_count_mismatch": 1,
      "field_completeness": 1
    }
  },
  "errors": {
    "network_timeouts": 1,
    "captcha_detected": 1,
    "pagination_issues": 0,
    "selector_errors": 0
  },
  "daily_trends": [
    {
      "date": "2025-12-02",
      "sessions": 8,
      "success_rate": 1.0,
      "avg_quality_score": 93.2,
      "avg_duration_seconds": 125
    }
  ]
}
```

## Metrics Collected

### Session Metrics (JSONL)

Each scraping session logs:

```jsonl
{"timestamp":"2025-12-02T14:30:00Z","source_name":"shopify-store","source_url":"https://example.com/products","method":"api","duration_seconds":72,"items_scraped":95,"data_quality_score":94.2,"status":"success","error":null}
{"timestamp":"2025-12-02T14:35:00Z","source_name":"custom-site","source_url":"https://custom.com/items","method":"browser","duration_seconds":312,"items_scraped":58,"data_quality_score":87.5,"status":"success","error":null}
{"timestamp":"2025-12-02T14:40:00Z","source_name":"blocked-site","source_url":"https://blocked.com/products","method":"browser","duration_seconds":45,"items_scraped":0,"data_quality_score":0,"status":"failed","error":"CAPTCHA detected"}
```

### QA Check Metrics (JSONL)

Each QA validation logs:

```jsonl
{"timestamp":"2025-12-02T14:32:00Z","items_file":"shopify_items_20251202_143000.json","metadata_file":"shopify_metadata_20251202_143000.json","status":"PASS","checks_passed":5,"checks_failed":0,"quality_score":95}
{"timestamp":"2025-12-02T14:37:00Z","items_file":"custom_items_20251202_143500.json","metadata_file":"custom_metadata_20251202_143500.json","status":"FAIL","checks_passed":3,"checks_failed":2,"quality_score":72,"issues":["item_count_mismatch","field_completeness"]}
```

## Filters

### Time Period

- `1d` - Last 24 hours
- `7d` - Last 7 days (default)
- `30d` - Last 30 days
- `90d` - Last 90 days

### Source Pattern

```bash
# Exact match
/metrics-report --filter shopify-store

# Wildcard pattern
/metrics-report --filter "*shopify*"

# Multiple sources
/metrics-report --filter "shopify-store,wordpress-blog"
```

## Exit Codes

- `0`: Report generated successfully
- `1`: No metrics found for period
- `2`: Invalid time period format

## Performance

**Execution Time**: < 5 seconds for 10,000 sessions

## Related Commands

- `/scrape-url` - Generates metrics
- `/qa-crosscheck` - Generates QA metrics

## Notes

- Metrics are stored in `metrics/sessions.jsonl` and `metrics/qa_checks.jsonl`
- JSONL format allows efficient append-only logging
- Historical data is retained indefinitely (manual cleanup required)
- Table format includes color coding (green=good, yellow=warning, red=error)

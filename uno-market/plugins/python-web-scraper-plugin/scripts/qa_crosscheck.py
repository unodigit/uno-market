#!/usr/bin/env python3
"""
QA Cross-Check Script - Validates consistency between items and metadata files
Implements constitution requirement: Self-Healing QA Architecture
"""

import argparse
import json
import sys
from datetime import datetime, timedelta
from pathlib import Path
from typing import Dict, List, Optional

from pydantic import BaseModel, ValidationError


class QAThresholds(BaseModel):
    """Configurable QA thresholds"""
    item_count_variance: float = 0.02  # 2%
    item_count_absolute: int = 3  # 3 items
    timestamp_deviation_seconds: int = 60  # 60 seconds
    field_completeness_variance: float = 0.05  # 5%
    cross_reference_tolerance: float = 0.0  # 0% (exact match)


class CheckResult(BaseModel):
    """Result of a single validation check"""
    check_name: str
    status: str  # PASS or FAIL
    details: Dict


class QAReport(BaseModel):
    """Complete QA cross-check report"""
    status: str
    checks: Dict[str, CheckResult]
    data_quality_score: float
    timestamp: str
    root_cause_analysis: Optional[List[Dict]] = None
    recommended_actions: Optional[List[str]] = None


def load_json_file(filepath: Path) -> Dict:
    """Load and parse JSON file"""
    try:
        with open(filepath) as f:
            return json.load(f)
    except FileNotFoundError:
        print(f"Error: File not found: {filepath}", file=sys.stderr)
        sys.exit(2)
    except json.JSONDecodeError as e:
        print(f"Error: Invalid JSON in {filepath}: {e}", file=sys.stderr)
        sys.exit(2)


def check_item_count_consistency(
    items_data: Dict,
    metadata_data: Dict,
    thresholds: QAThresholds
) -> CheckResult:
    """Validate item count matches between files"""

    reported_count = metadata_data["items_summary"]["total_items_found"]
    actual_count = len(items_data["items"])

    if reported_count == 0:
        variance_pct = 0.0
    else:
        variance_pct = abs(reported_count - actual_count) / reported_count

    variance_abs = abs(reported_count - actual_count)

    # Check both tolerance types (percentage AND absolute)
    tolerance_exceeded = (
        variance_pct > thresholds.item_count_variance and
        variance_abs > thresholds.item_count_absolute
    )

    if tolerance_exceeded:
        return CheckResult(
            check_name="item_count_consistency",
            status="FAIL",
            details={
                "reported": reported_count,
                "actual": actual_count,
                "variance_pct": round(variance_pct * 100, 2),
                "variance_abs": variance_abs,
                "tolerance_pct": thresholds.item_count_variance * 100,
                "tolerance_abs": thresholds.item_count_absolute
            }
        )

    return CheckResult(
        check_name="item_count_consistency",
        status="PASS",
        details={
            "reported": reported_count,
            "actual": actual_count,
            "variance": round(variance_pct * 100, 2)
        }
    )


def check_bidirectional_references(
    items_data: Dict,
    metadata_data: Dict,
    items_filepath: Path,
    metadata_filepath: Path
) -> CheckResult:
    """Validate bidirectional references between files"""

    # Check items → metadata reference
    referenced_metadata = items_data.get("metadata_file")
    actual_metadata_name = metadata_filepath.name

    if referenced_metadata != actual_metadata_name:
        return CheckResult(
            check_name="bidirectional_references",
            status="FAIL",
            details={
                "items_references": referenced_metadata,
                "actual_metadata_file": actual_metadata_name,
                "error": "Items file references wrong metadata file"
            }
        )

    # Check metadata → items reference
    referenced_items = metadata_data["output_files"]["items_file"]
    actual_items_name = items_filepath.name

    if referenced_items != actual_items_name:
        return CheckResult(
            check_name="bidirectional_references",
            status="FAIL",
            details={
                "metadata_references": referenced_items,
                "actual_items_file": actual_items_name,
                "error": "Metadata file references wrong items file"
            }
        )

    return CheckResult(
        check_name="bidirectional_references",
        status="PASS",
        details={
            "items_file": actual_items_name,
            "metadata_file": actual_metadata_name
        }
    )


def check_timestamp_consistency(
    items_data: Dict,
    metadata_data: Dict,
    thresholds: QAThresholds
) -> CheckResult:
    """Validate item timestamps fall within scraping session window"""

    session_start = datetime.fromisoformat(
        metadata_data["scraping_session"]["scrape_timestamp_start"].replace("Z", "+00:00")
    )
    session_end = datetime.fromisoformat(
        metadata_data["scraping_session"]["scrape_timestamp_end"].replace("Z", "+00:00")
    )
    tolerance = timedelta(seconds=thresholds.timestamp_deviation_seconds)

    invalid_timestamps = []
    max_deviation = 0

    for idx, item in enumerate(items_data["items"]):
        item_timestamp = datetime.fromisoformat(
            item["scraped_at"].replace("Z", "+00:00")
        )

        # Calculate deviation from session window
        if item_timestamp < session_start:
            deviation = (session_start - item_timestamp).total_seconds()
        elif item_timestamp > session_end:
            deviation = (item_timestamp - session_end).total_seconds()
        else:
            deviation = 0  # Within window

        max_deviation = max(max_deviation, deviation)

        if deviation > thresholds.timestamp_deviation_seconds:
            invalid_timestamps.append({
                "item_index": idx,
                "item_timestamp": item["scraped_at"],
                "deviation_seconds": round(deviation, 2)
            })

    if invalid_timestamps:
        return CheckResult(
            check_name="timestamp_consistency",
            status="FAIL",
            details={
                "invalid_items": invalid_timestamps[:10],  # Limit to first 10
                "total_invalid": len(invalid_timestamps),
                "max_deviation_seconds": round(max_deviation, 2),
                "tolerance_seconds": thresholds.timestamp_deviation_seconds
            }
        )

    return CheckResult(
        check_name="timestamp_consistency",
        status="PASS",
        details={
            "max_deviation_seconds": round(max_deviation, 2),
            "tolerance_seconds": thresholds.timestamp_deviation_seconds
        }
    )


def check_field_completeness_alignment(
    items_data: Dict,
    metadata_data: Dict,
    thresholds: QAThresholds
) -> CheckResult:
    """Validate reported field completeness matches actual data"""

    reported_completeness = metadata_data["field_completeness"]

    # Calculate actual completeness
    actual_completeness = {}
    total_items = len(items_data["items"])

    if total_items == 0:
        return CheckResult(
            check_name="field_completeness_alignment",
            status="FAIL",
            details={"error": "No items to validate"}
        )

    for field in ["title", "price", "image_urls", "description"]:
        non_empty_count = sum(
            1 for item in items_data["items"]
            if item.get(field) not in [None, "", []]
        )
        actual_completeness[field] = (non_empty_count / total_items) * 100

    # Compare with reported values
    mismatches = []
    max_difference = 0

    for field, reported_pct in reported_completeness.items():
        actual_pct = actual_completeness.get(field, 0)
        difference = abs(reported_pct - actual_pct)
        max_difference = max(max_difference, difference)

        if difference > (thresholds.field_completeness_variance * 100):
            mismatches.append({
                "field": field,
                "reported": round(reported_pct, 2),
                "actual": round(actual_pct, 2),
                "difference": round(difference, 2)
            })

    if mismatches:
        return CheckResult(
            check_name="field_completeness_alignment",
            status="FAIL",
            details={
                "mismatches": mismatches,
                "max_difference": round(max_difference, 2),
                "tolerance": thresholds.field_completeness_variance * 100
            }
        )

    return CheckResult(
        check_name="field_completeness_alignment",
        status="PASS",
        details={
            "max_difference": round(max_difference, 2),
            "tolerance": thresholds.field_completeness_variance * 100
        }
    )


def analyze_root_causes(checks: Dict[str, CheckResult]) -> List[Dict]:
    """Analyze validation failures to identify root causes"""
    root_causes = []

    # Check for item count mismatch
    item_count_check = checks.get("item_count_consistency")
    if item_count_check and item_count_check.status == "FAIL":
        reported = item_count_check.details["reported"]
        actual = item_count_check.details["actual"]

        if actual < reported:
            root_causes.append({
                "issue": "pagination_end_condition",
                "description": f"Pagination logic stopped early (missing {reported - actual} items)",
                "recommendation": "Review pagination end condition in scraper code"
            })
        elif actual > reported:
            root_causes.append({
                "issue": "duplicate_items",
                "description": f"More items scraped than expected ({actual - reported} extra)",
                "recommendation": "Check for duplicate items or incorrect counting logic"
            })

    # Check for field completeness mismatches
    completeness_check = checks.get("field_completeness_alignment")
    if completeness_check and completeness_check.status == "FAIL":
        for mismatch in completeness_check.details.get("mismatches", []):
            field = mismatch["field"]
            root_causes.append({
                "issue": "selector_accuracy",
                "field": field,
                "description": f"Selector for '{field}' not matching all variants",
                "recommendation": f"Add fallback selector for {field} field"
            })

    return root_causes


def calculate_data_quality_score(checks: Dict[str, CheckResult]) -> float:
    """Calculate overall data quality score"""
    if not checks:
        return 0.0

    passed = sum(1 for check in checks.values() if check.status == "PASS")
    total = len(checks)

    return round((passed / total) * 100, 1)


def run_qa_crosscheck(
    items_file: Path,
    metadata_file: Path,
    thresholds: QAThresholds
) -> QAReport:
    """Execute all QA validation checks"""

    # Load files
    items_data = load_json_file(items_file)
    metadata_data = load_json_file(metadata_file)

    # Run all checks
    checks = {}

    checks["item_count_consistency"] = check_item_count_consistency(
        items_data, metadata_data, thresholds
    )

    checks["bidirectional_references"] = check_bidirectional_references(
        items_data, metadata_data, items_file, metadata_file
    )

    checks["timestamp_consistency"] = check_timestamp_consistency(
        items_data, metadata_data, thresholds
    )

    checks["field_completeness_alignment"] = check_field_completeness_alignment(
        items_data, metadata_data, thresholds
    )

    # Determine overall status
    failed_checks = [c for c in checks.values() if c.status == "FAIL"]
    overall_status = "FAIL" if failed_checks else "PASS"

    # Analyze root causes for failures
    root_causes = None
    recommended_actions = None

    if overall_status == "FAIL":
        root_causes = analyze_root_causes(checks)
        recommended_actions = [cause["recommendation"] for cause in root_causes]

    # Calculate data quality score
    quality_score = calculate_data_quality_score(checks)

    return QAReport(
        status=overall_status,
        checks={name: check for name, check in checks.items()},
        data_quality_score=quality_score,
        timestamp=datetime.utcnow().isoformat() + "Z",
        root_cause_analysis=root_causes if root_causes else None,
        recommended_actions=recommended_actions if recommended_actions else None
    )


def main():
    """CLI entry point"""
    parser = argparse.ArgumentParser(
        description="QA cross-check for web scraper output files"
    )
    parser.add_argument(
        "--items-file",
        required=True,
        type=Path,
        help="Path to items JSON file"
    )
    parser.add_argument(
        "--metadata-file",
        required=True,
        type=Path,
        help="Path to metadata JSON file"
    )
    parser.add_argument(
        "--tolerance",
        default="2%",
        help="Item count variance tolerance (default: 2%%)"
    )
    parser.add_argument(
        "--output",
        type=Path,
        help="Save report to file"
    )

    args = parser.parse_args()

    # Parse tolerance
    tolerance_value = float(args.tolerance.rstrip("%")) / 100
    thresholds = QAThresholds(item_count_variance=tolerance_value)

    # Run QA checks
    report = run_qa_crosscheck(args.items_file, args.metadata_file, thresholds)

    # Save or print report
    report_dict = report.model_dump()

    if args.output:
        with open(args.output, "w") as f:
            json.dump(report_dict, f, indent=2)

    # Print summary to stdout
    print(json.dumps(report_dict, indent=2))

    # Exit with appropriate code
    sys.exit(0 if report.status == "PASS" else 1)


if __name__ == "__main__":
    main()

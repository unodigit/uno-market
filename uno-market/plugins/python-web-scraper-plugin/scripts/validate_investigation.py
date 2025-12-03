#!/usr/bin/env python3
"""
Investigation Validation Script
Validates investigation reports before scraper generation
Implements T038 [US1] - PreScrapingHook validation
"""

import json
import sys
from pathlib import Path
from typing import Dict, List, Tuple

# Add parent directory to path for imports
sys.path.insert(0, str(Path(__file__).parent))
from models import InvestigationReport, ScrapingStrategy, ConfidenceLevel


class ValidationError(Exception):
    """Custom exception for validation failures"""
    pass


def validate_investigation_file(file_path: Path) -> InvestigationReport:
    """
    Load and validate investigation report file

    Args:
        file_path: Path to investigation_report.json

    Returns:
        Validated InvestigationReport object

    Raises:
        ValidationError: If file is invalid or missing required fields
    """
    if not file_path.exists():
        raise ValidationError(f"Investigation report not found: {file_path}")

    try:
        with open(file_path, "r") as f:
            data = json.load(f)
    except json.JSONDecodeError as e:
        raise ValidationError(f"Invalid JSON in investigation report: {e}")

    # Validate with Pydantic
    try:
        report = InvestigationReport(**data)
    except Exception as e:
        raise ValidationError(f"Investigation report schema validation failed: {e}")

    return report


def check_api_endpoints(report: InvestigationReport) -> Tuple[bool, List[str]]:
    """
    Check if API endpoints were discovered and are valid

    Args:
        report: InvestigationReport object

    Returns:
        Tuple of (is_valid, warnings)
    """
    warnings = []

    if not report.discovered_endpoints:
        warnings.append("No API endpoints discovered. Browser scraping will be required.")
        return True, warnings  # Not an error, just informational

    # Check endpoint quality
    high_confidence_endpoints = [
        ep for ep in report.discovered_endpoints
        if ep.confidence == ConfidenceLevel.HIGH
    ]

    if not high_confidence_endpoints and report.recommended_strategy == ScrapingStrategy.API:
        warnings.append(
            f"Recommended strategy is API but no HIGH confidence endpoints found. "
            f"Found {len(report.discovered_endpoints)} endpoints with lower confidence."
        )

    # Check for response data
    endpoints_with_data = [
        ep for ep in report.discovered_endpoints
        if ep.sample_response
    ]

    if len(endpoints_with_data) == 0:
        warnings.append(
            "No endpoints have sample response data. "
            "This may affect scraper quality."
        )

    return True, warnings


def check_platform_detection(report: InvestigationReport) -> Tuple[bool, List[str]]:
    """
    Validate platform detection results

    Args:
        report: InvestigationReport object

    Returns:
        Tuple of (is_valid, warnings)
    """
    warnings = []

    if report.platform_detected.value == "custom":
        warnings.append(
            "Platform detected as 'custom'. Scraper generation may require manual adjustments."
        )

    # Check if platform matches discovered endpoints
    if report.platform_detected.value == "shopify":
        shopify_endpoints = [
            ep for ep in report.discovered_endpoints
            if "/products.json" in ep.url or "/collections" in ep.url
        ]
        if not shopify_endpoints:
            warnings.append(
                "Platform detected as Shopify but no Shopify-specific endpoints found. "
                "Detection may be inaccurate."
            )

    return True, warnings


def check_confidence_score(report: InvestigationReport) -> Tuple[bool, List[str]]:
    """
    Check overall investigation confidence score

    Args:
        report: InvestigationReport object

    Returns:
        Tuple of (is_valid, errors/warnings)
    """
    errors = []
    warnings = []

    if report.confidence_score < 0.3:
        errors.append(
            f"Investigation confidence score too low: {report.confidence_score:.1%}. "
            f"Minimum required: 30%. "
            f"Consider running --deep-scan or providing --api-patterns."
        )
        return False, errors

    if report.confidence_score < 0.6:
        warnings.append(
            f"Investigation confidence score is moderate: {report.confidence_score:.1%}. "
            f"Scraper quality may be suboptimal. Consider manual verification."
        )

    return True, warnings


def check_strategy_alignment(report: InvestigationReport) -> Tuple[bool, List[str]]:
    """
    Verify that recommended strategy aligns with discovered data

    Args:
        report: InvestigationReport object

    Returns:
        Tuple of (is_valid, warnings)
    """
    warnings = []

    # If API strategy recommended but no endpoints found
    if report.recommended_strategy == ScrapingStrategy.API and not report.discovered_endpoints:
        warnings.append(
            "Recommended strategy is API but no endpoints discovered. "
            "This is likely a configuration error."
        )

    # If browser strategy recommended but APIs exist
    if report.recommended_strategy == ScrapingStrategy.BROWSER_SCRAPING and report.discovered_endpoints:
        high_quality_endpoints = [
            ep for ep in report.discovered_endpoints
            if ep.confidence == ConfidenceLevel.HIGH and ep.sample_response
        ]

        if len(high_quality_endpoints) >= 1:
            warnings.append(
                f"Recommended strategy is browser scraping but {len(high_quality_endpoints)} "
                f"high-quality API endpoints were found. Consider using API strategy instead."
            )

    return True, warnings


def validate_for_scraper_generation(report: InvestigationReport) -> Tuple[bool, Dict]:
    """
    Complete validation pipeline for scraper generation readiness

    Args:
        report: InvestigationReport object

    Returns:
        Tuple of (is_valid, validation_report)
    """
    all_errors = []
    all_warnings = []

    # Run all validation checks
    checks = [
        ("API Endpoints", check_api_endpoints),
        ("Platform Detection", check_platform_detection),
        ("Confidence Score", check_confidence_score),
        ("Strategy Alignment", check_strategy_alignment)
    ]

    for check_name, check_func in checks:
        try:
            is_valid, messages = check_func(report)
            if not is_valid:
                all_errors.extend([f"[{check_name}] {msg}" for msg in messages])
            else:
                all_warnings.extend([f"[{check_name}] {msg}" for msg in messages])
        except Exception as e:
            all_errors.append(f"[{check_name}] Validation check failed: {e}")

    # Build validation report
    validation_report = {
        "status": "PASS" if not all_errors else "FAIL",
        "investigation_file": str(report.target_url),
        "platform": report.platform_detected.value,
        "strategy": report.recommended_strategy.value,
        "confidence_score": report.confidence_score,
        "endpoints_found": len(report.discovered_endpoints),
        "errors": all_errors,
        "warnings": all_warnings,
        "can_generate_scraper": len(all_errors) == 0
    }

    return len(all_errors) == 0, validation_report


def print_validation_report(validation_report: Dict):
    """
    Print validation report in human-readable format

    Args:
        validation_report: Validation result dictionary
    """
    status = validation_report["status"]
    status_symbol = "✓" if status == "PASS" else "✗"

    print(f"\n{status_symbol} Investigation Validation: {status}")
    print(f"   Platform: {validation_report['platform']}")
    print(f"   Strategy: {validation_report['strategy']}")
    print(f"   Confidence: {validation_report['confidence_score']:.1%}")
    print(f"   Endpoints: {validation_report['endpoints_found']}")

    # Print errors
    if validation_report["errors"]:
        print(f"\n✗ Errors ({len(validation_report['errors'])}):")
        for error in validation_report["errors"]:
            print(f"   - {error}")

    # Print warnings
    if validation_report["warnings"]:
        print(f"\n⚠ Warnings ({len(validation_report['warnings'])}):")
        for warning in validation_report["warnings"]:
            print(f"   - {warning}")

    # Final verdict
    if validation_report["can_generate_scraper"]:
        print(f"\n✓ Investigation report is valid. Ready to generate scraper.")
    else:
        print(f"\n✗ Investigation report has critical issues. Cannot generate scraper.")
        print(f"   Fix the errors above and re-run investigation.")


def main():
    """CLI entry point"""
    import argparse

    parser = argparse.ArgumentParser(
        description="Validate investigation report before scraper generation"
    )
    parser.add_argument(
        "report_file",
        type=Path,
        help="Path to investigation_report.json"
    )
    parser.add_argument(
        "--strict",
        action="store_true",
        help="Treat warnings as errors"
    )
    parser.add_argument(
        "--json",
        action="store_true",
        help="Output validation report as JSON"
    )

    args = parser.parse_args()

    try:
        # Load and validate investigation report
        report = validate_investigation_file(args.report_file)

        # Run validation checks
        is_valid, validation_report = validate_for_scraper_generation(report)

        # In strict mode, treat warnings as errors
        if args.strict and validation_report["warnings"]:
            is_valid = False
            validation_report["status"] = "FAIL"
            validation_report["errors"].extend(validation_report["warnings"])
            validation_report["warnings"] = []

        # Output results
        if args.json:
            print(json.dumps(validation_report, indent=2))
        else:
            print_validation_report(validation_report)

        # Exit with appropriate code
        sys.exit(0 if is_valid else 1)

    except ValidationError as e:
        print(f"✗ Validation Error: {e}", file=sys.stderr)
        sys.exit(1)
    except Exception as e:
        print(f"✗ Unexpected Error: {e}", file=sys.stderr)
        import traceback
        traceback.print_exc()
        sys.exit(1)


if __name__ == "__main__":
    main()

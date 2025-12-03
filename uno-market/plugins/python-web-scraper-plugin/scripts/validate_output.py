#!/usr/bin/env python3
"""
Output Validation Script
Validates scraped data against JSON schema and calculates quality metrics
Implements T051, T052, T053, T054 [US4] - Output validation with quality scoring
"""

import json
import sys
from datetime import datetime
from pathlib import Path
from typing import Dict, List, Tuple

# Add parent directory to path for imports
sys.path.insert(0, str(Path(__file__).parent))
from models import ScrapedItem, ItemsOutput, MetadataOutput, FieldCompleteness


# ANSI color codes for terminal output
class Colors:
    RED = '\033[91m'
    GREEN = '\033[92m'
    YELLOW = '\033[93m'
    BLUE = '\033[94m'
    MAGENTA = '\033[95m'
    CYAN = '\033[96m'
    RESET = '\033[0m'
    BOLD = '\033[1m'


def validate_items_schema(items: List[Dict], strict: bool = False) -> Tuple[bool, List[str]]:
    """
    Validate items against ScrapedItem schema

    Args:
        items: List of item dictionaries
        strict: If True, treat warnings as errors

    Returns:
        Tuple of (is_valid, errors)
    """
    errors = []
    warnings = []

    for idx, item_data in enumerate(items):
        try:
            # Validate with Pydantic
            item = ScrapedItem(**item_data)

            # Additional strict checks
            if strict:
                if not item.title or not item.title.strip():
                    warnings.append(f"Item {idx}: title is empty or whitespace")

                if item.price and item.price.amount <= 0:
                    warnings.append(f"Item {idx}: price amount is zero or negative")

                if not item.image_urls or len(item.image_urls) == 0:
                    warnings.append(f"Item {idx}: no image URLs")

        except Exception as e:
            error_msg = str(e)
            # Truncate very long error messages
            if len(error_msg) > 150:
                error_msg = error_msg[:150] + "..."
            errors.append(f"Item {idx}: {error_msg}")

    # In strict mode, warnings become errors
    if strict and warnings:
        errors.extend(warnings)
        warnings = []

    return len(errors) == 0, errors


def calculate_field_completeness(items: List[Dict]) -> FieldCompleteness:
    """
    Calculate field completeness percentages

    Args:
        items: List of item dictionaries

    Returns:
        FieldCompleteness object
    """
    if not items:
        return FieldCompleteness(title=0, price=0, image_urls=0, description=0)

    total = len(items)

    # Count non-empty fields
    title_count = sum(1 for item in items if item.get("title") and item["title"].strip())
    price_count = sum(1 for item in items if item.get("price") and item["price"].get("amount", 0) > 0)
    images_count = sum(1 for item in items if item.get("image_urls") and len(item["image_urls"]) > 0)
    desc_count = sum(1 for item in items if item.get("description") and item["description"].strip())

    return FieldCompleteness(
        title=(title_count / total) * 100,
        price=(price_count / total) * 100,
        image_urls=(images_count / total) * 100,
        description=(desc_count / total) * 100
    )


def calculate_quality_score(completeness: FieldCompleteness) -> float:
    """
    Calculate overall data quality score (0-100)

    Weighted scoring:
    - Title: 30% (critical for item identification)
    - Price: 30% (critical for e-commerce)
    - Images: 20% (important for user experience)
    - Description: 20% (nice to have)

    Args:
        completeness: FieldCompleteness object

    Returns:
        Quality score as float (0-100)
    """
    score = (
        completeness.title * 0.3 +
        completeness.price * 0.3 +
        completeness.image_urls * 0.2 +
        completeness.description * 0.2
    )
    return round(score, 1)


def validate_items_output(items_path: Path, strict: bool = False) -> Dict:
    """
    Validate items JSON file

    Args:
        items_path: Path to items JSON file
        strict: Enable strict validation mode

    Returns:
        Validation report dictionary
    """
    validation_report = {
        "file": str(items_path),
        "file_exists": items_path.exists(),
        "schema_validation": {"passed": False, "errors": []},
        "field_completeness": None,
        "quality_score": None,
        "timestamp": datetime.utcnow().isoformat() + "Z"
    }

    if not items_path.exists():
        validation_report["schema_validation"]["errors"] = ["File not found"]
        return validation_report

    try:
        # Load JSON
        with open(items_path, "r") as f:
            data = json.load(f)

        # Handle different structures
        if isinstance(data, dict) and "items" in data:
            # ItemsOutput structure
            items_output = ItemsOutput(**data)
            items = data["items"]
            validation_report["metadata_file_ref"] = data.get("metadata_file")
        elif isinstance(data, list):
            # Plain list of items
            items = data
            validation_report["metadata_file_ref"] = None
        else:
            validation_report["schema_validation"]["errors"] = [
                f"Unexpected file structure: expected list or ItemsOutput, got {type(data).__name__}"
            ]
            return validation_report

        # Validate items schema
        is_valid, errors = validate_items_schema(items, strict=strict)
        validation_report["schema_validation"]["passed"] = is_valid
        validation_report["schema_validation"]["errors"] = errors
        validation_report["total_items"] = len(items)

        # Calculate metrics (even if schema validation failed)
        completeness = calculate_field_completeness(items)
        quality_score = calculate_quality_score(completeness)

        validation_report["field_completeness"] = completeness.model_dump()
        validation_report["quality_score"] = quality_score

    except json.JSONDecodeError as e:
        validation_report["schema_validation"]["errors"] = [f"Invalid JSON: {e}"]
    except Exception as e:
        validation_report["schema_validation"]["errors"] = [f"Validation error: {e}"]

    return validation_report


def validate_metadata_output(metadata_path: Path, strict: bool = False) -> Dict:
    """
    Validate metadata JSON file

    Args:
        metadata_path: Path to metadata JSON file
        strict: Enable strict validation mode

    Returns:
        Validation report dictionary
    """
    validation_report = {
        "file": str(metadata_path),
        "file_exists": metadata_path.exists(),
        "schema_validation": {"passed": False, "errors": []},
        "timestamp": datetime.utcnow().isoformat() + "Z"
    }

    if not metadata_path.exists():
        validation_report["schema_validation"]["errors"] = ["File not found"]
        return validation_report

    try:
        # Load and validate with Pydantic
        with open(metadata_path, "r") as f:
            data = json.load(f)

        metadata = MetadataOutput(**data)
        validation_report["schema_validation"]["passed"] = True
        validation_report["items_file_ref"] = metadata.output_files.items_file
        validation_report["quality_score_from_metadata"] = metadata.items_summary.data_quality_percentage

    except json.JSONDecodeError as e:
        validation_report["schema_validation"]["errors"] = [f"Invalid JSON: {e}"]
    except Exception as e:
        validation_report["schema_validation"]["errors"] = [f"Validation error: {e}"]

    return validation_report


def check_cross_references(items_report: Dict, metadata_report: Dict) -> List[str]:
    """
    Check that items and metadata files reference each other correctly

    Args:
        items_report: Items validation report
        metadata_report: Metadata validation report

    Returns:
        List of cross-reference errors
    """
    errors = []

    # Check metadata reference in items file
    metadata_ref = items_report.get("metadata_file_ref")
    if not metadata_ref:
        errors.append("Items file missing metadata_file reference")

    # Check items reference in metadata file
    items_ref = metadata_report.get("items_file_ref")
    if not items_ref:
        errors.append("Metadata file missing items_file reference")

    # Check that references match actual filenames
    if metadata_ref and metadata_report.get("file"):
        expected_metadata_file = Path(metadata_report["file"]).name
        if metadata_ref != expected_metadata_file:
            errors.append(
                f"Items file references '{metadata_ref}' but metadata file is '{expected_metadata_file}'"
            )

    if items_ref and items_report.get("file"):
        expected_items_file = Path(items_report["file"]).name
        if items_ref != expected_items_file:
            errors.append(
                f"Metadata file references '{items_ref}' but items file is '{expected_items_file}'"
            )

    return errors


def print_validation_report(items_report: Dict, metadata_report: Dict = None, color: bool = True):
    """
    Print validation report with color coding

    Args:
        items_report: Items validation report
        metadata_report: Optional metadata validation report
        color: Enable colored output
    """
    def c(text, color_code):
        """Apply color if enabled"""
        if color:
            return f"{color_code}{text}{Colors.RESET}"
        return text

    print(f"\n{'='*70}")
    print(c("OUTPUT VALIDATION REPORT", Colors.BOLD))
    print(f"{'='*70}\n")

    # Items file validation
    print(c("📄 ITEMS FILE", Colors.BOLD))
    print(f"   File: {items_report['file']}")
    print(f"   Exists: {c('✓ Yes', Colors.GREEN) if items_report['file_exists'] else c('✗ No', Colors.RED)}")

    if items_report.get("total_items") is not None:
        print(f"   Total Items: {items_report['total_items']}")

    # Schema validation
    schema = items_report["schema_validation"]
    status_text = c("✓ PASSED", Colors.GREEN) if schema["passed"] else c("✗ FAILED", Colors.RED)
    print(f"   Schema Validation: {status_text}")

    if schema["errors"]:
        print(f"   {c(f'Errors ({len(schema['errors'])})', Colors.RED)}:")
        for error in schema["errors"][:10]:  # Limit to 10
            print(f"      - {error}")
        if len(schema["errors"]) > 10:
            print(f"      ... and {len(schema['errors']) - 10} more")

    # Field completeness
    if items_report.get("field_completeness"):
        print(f"\n   {c('📊 Field Completeness:', Colors.BOLD)}")
        completeness = items_report["field_completeness"]

        for field, percentage in completeness.items():
            if percentage >= 90:
                color_code = Colors.GREEN
            elif percentage >= 70:
                color_code = Colors.YELLOW
            else:
                color_code = Colors.RED

            field_display = field.replace("_", " ").title()
            print(f"      {field_display:12} {c(f'{percentage:>5.1f}%', color_code)}")

    # Quality score
    if items_report.get("quality_score") is not None:
        score = items_report["quality_score"]
        if score >= 90:
            color_code = Colors.GREEN
            assessment = "Excellent"
        elif score >= 75:
            color_code = Colors.YELLOW
            assessment = "Good"
        elif score >= 60:
            color_code = Colors.YELLOW
            assessment = "Moderate"
        else:
            color_code = Colors.RED
            assessment = "Poor"

        print(f"\n   {c('🎯 Overall Quality Score:', Colors.BOLD)} {c(f'{score}/100', color_code)} ({assessment})")

    # Metadata file validation
    if metadata_report:
        print(f"\n{c('📋 METADATA FILE', Colors.BOLD)}")
        print(f"   File: {metadata_report['file']}")
        print(f"   Exists: {c('✓ Yes', Colors.GREEN) if metadata_report['file_exists'] else c('✗ No', Colors.RED)}")

        schema = metadata_report["schema_validation"]
        status_text = c("✓ PASSED", Colors.GREEN) if schema["passed"] else c("✗ FAILED", Colors.RED)
        print(f"   Schema Validation: {status_text}")

        if schema["errors"]:
            print(f"   {c(f'Errors ({len(schema['errors'])})', Colors.RED)}:")
            for error in schema["errors"][:5]:
                print(f"      - {error}")

        # Check cross-references
        cross_ref_errors = check_cross_references(items_report, metadata_report)
        if cross_ref_errors:
            print(f"\n   {c('⚠ Cross-Reference Issues:', Colors.YELLOW)}")
            for error in cross_ref_errors:
                print(f"      - {error}")
        else:
            print(f"   {c('✓ Cross-references valid', Colors.GREEN)}")

    print(f"\n{'='*70}\n")


def main():
    """CLI entry point"""
    import argparse

    parser = argparse.ArgumentParser(
        description="Validate scraped data output files"
    )
    parser.add_argument(
        "items_file",
        type=Path,
        help="Path to items JSON file"
    )
    parser.add_argument(
        "--metadata",
        type=Path,
        help="Path to metadata JSON file (for cross-validation)"
    )
    parser.add_argument(
        "--strict",
        action="store_true",
        help="Enable strict validation (warnings become errors)"
    )
    parser.add_argument(
        "--json",
        action="store_true",
        help="Output report as JSON"
    )
    parser.add_argument(
        "--no-color",
        action="store_true",
        help="Disable colored output"
    )

    args = parser.parse_args()

    # Validate items file
    items_report = validate_items_output(args.items_file, strict=args.strict)

    # Validate metadata file if provided
    metadata_report = None
    if args.metadata:
        metadata_report = validate_metadata_output(args.metadata, strict=args.strict)

    # Output results
    if args.json:
        output = {
            "items": items_report,
            "metadata": metadata_report
        }
        print(json.dumps(output, indent=2))
    else:
        print_validation_report(items_report, metadata_report, color=not args.no_color)

    # Exit with appropriate code
    items_passed = items_report["schema_validation"]["passed"]
    metadata_passed = metadata_report["schema_validation"]["passed"] if metadata_report else True

    if not items_passed or not metadata_passed:
        sys.exit(1)

    # Check quality score threshold
    if items_report.get("quality_score", 0) < 50:
        print(f"⚠ WARNING: Quality score below 50. Data quality is poor.", file=sys.stderr)
        sys.exit(1)

    sys.exit(0)


if __name__ == "__main__":
    main()

#!/usr/bin/env python3
"""
Post-Scraping Hook
Calculates field completeness and quality metrics after scraper execution
Implements T039 [US1] - PostScrapingHook metadata generation logic
"""

import json
import sys
from datetime import datetime
from pathlib import Path
from typing import Dict, List

# Add parent directory to path for imports
sys.path.insert(0, str(Path(__file__).parent))
from models import ScrapedItem, FieldCompleteness


def load_items_file(items_path: Path) -> List[Dict]:
    """
    Load items from JSON file

    Args:
        items_path: Path to items JSON file

    Returns:
        List of item dictionaries

    Raises:
        FileNotFoundError: If items file doesn't exist
        json.JSONDecodeError: If JSON is invalid
    """
    if not items_path.exists():
        raise FileNotFoundError(f"Items file not found: {items_path}")

    with open(items_path, "r") as f:
        data = json.load(f)

    # Handle both direct item lists and ItemsOutput structure
    if isinstance(data, dict) and "items" in data:
        return data["items"]
    elif isinstance(data, list):
        return data
    else:
        raise ValueError(f"Unexpected items file structure: {type(data)}")


def calculate_field_completeness(items: List[Dict]) -> FieldCompleteness:
    """
    Calculate field completeness percentages

    Args:
        items: List of scraped item dictionaries

    Returns:
        FieldCompleteness object with percentages
    """
    if not items:
        return FieldCompleteness(title=0, price=0, image_urls=0, description=0)

    total = len(items)

    # Count non-empty fields
    title_count = sum(1 for item in items if item.get("title"))
    price_count = sum(1 for item in items if item.get("price"))
    images_count = sum(1 for item in items if item.get("image_urls"))
    desc_count = sum(1 for item in items if item.get("description"))

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
    - Title: 30% (required field)
    - Price: 30% (required field)
    - Images: 20% (important for e-commerce)
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


def detect_empty_required_fields(items: List[Dict]) -> List[Dict]:
    """
    Detect items with missing required fields

    Args:
        items: List of scraped item dictionaries

    Returns:
        List of items with missing required fields
    """
    required_fields = ["title", "price", "image_urls"]
    problematic_items = []

    for idx, item in enumerate(items):
        missing_fields = []

        for field in required_fields:
            value = item.get(field)

            # Check for various "empty" conditions
            if value is None:
                missing_fields.append(field)
            elif field == "image_urls" and (not value or len(value) == 0):
                missing_fields.append(field)
            elif field == "title" and (not value or not value.strip()):
                missing_fields.append(field)

        if missing_fields:
            problematic_items.append({
                "item_index": idx,
                "item_id": item.get("id", f"item_{idx}"),
                "missing_fields": missing_fields,
                "item_title": item.get("title", "(no title)")[:50]
            })

    return problematic_items


def validate_items_schema(items: List[Dict]) -> List[str]:
    """
    Validate that items conform to ScrapedItem schema

    Args:
        items: List of scraped item dictionaries

    Returns:
        List of validation errors (empty if valid)
    """
    errors = []

    for idx, item_data in enumerate(items):
        try:
            # Validate with Pydantic
            ScrapedItem(**item_data)
        except Exception as e:
            errors.append(f"Item {idx}: {str(e)[:100]}")

    return errors


def generate_quality_report(
    items: List[Dict],
    items_path: Path,
    execution_time: float = None
) -> Dict:
    """
    Generate comprehensive quality report

    Args:
        items: List of scraped item dictionaries
        items_path: Path to items file (for metadata)
        execution_time: Optional scraping execution time

    Returns:
        Quality report dictionary
    """
    start_time = datetime.utcnow()

    # Calculate metrics
    completeness = calculate_field_completeness(items)
    quality_score = calculate_quality_score(completeness)
    problematic_items = detect_empty_required_fields(items)
    schema_errors = validate_items_schema(items)

    # Build report
    report = {
        "timestamp": datetime.utcnow().isoformat() + "Z",
        "items_file": str(items_path),
        "total_items": len(items),
        "field_completeness": completeness.model_dump(),
        "quality_score": quality_score,
        "items_with_missing_fields": len(problematic_items),
        "problematic_items": problematic_items[:10],  # Limit to first 10
        "schema_validation": {
            "passed": len(schema_errors) == 0,
            "error_count": len(schema_errors),
            "errors": schema_errors[:5]  # Limit to first 5
        },
        "execution_metadata": {
            "scraping_duration_seconds": execution_time,
            "hook_execution_time_ms": None  # Will be set below
        }
    }

    # Calculate hook execution time
    end_time = datetime.utcnow()
    hook_duration = (end_time - start_time).total_seconds() * 1000
    report["execution_metadata"]["hook_execution_time_ms"] = round(hook_duration, 2)

    return report


def print_quality_report(report: Dict):
    """
    Print quality report in human-readable format

    Args:
        report: Quality report dictionary
    """
    print(f"\n{'='*60}")
    print(f"POST-SCRAPING QUALITY REPORT")
    print(f"{'='*60}")

    print(f"\nItems File: {report['items_file']}")
    print(f"Total Items: {report['total_items']}")

    print(f"\n📊 Field Completeness:")
    completeness = report["field_completeness"]
    print(f"   - Title:       {completeness['title']:>5.1f}%")
    print(f"   - Price:       {completeness['price']:>5.1f}%")
    print(f"   - Images:      {completeness['image_urls']:>5.1f}%")
    print(f"   - Description: {completeness['description']:>5.1f}%")

    print(f"\n🎯 Overall Quality Score: {report['quality_score']}/100")

    # Quality assessment
    if report['quality_score'] >= 90:
        print(f"   ✓ Excellent quality")
    elif report['quality_score'] >= 75:
        print(f"   ⚠ Good quality, minor improvements possible")
    elif report['quality_score'] >= 60:
        print(f"   ⚠ Moderate quality, review recommended")
    else:
        print(f"   ✗ Low quality, manual review required")

    # Problematic items
    if report['items_with_missing_fields'] > 0:
        print(f"\n⚠ Items with Missing Required Fields: {report['items_with_missing_fields']}")
        if report['problematic_items']:
            print(f"   First few:")
            for item in report['problematic_items'][:3]:
                print(f"   - Item {item['item_index']}: {item['item_title']}")
                print(f"     Missing: {', '.join(item['missing_fields'])}")

    # Schema validation
    schema = report['schema_validation']
    if schema['passed']:
        print(f"\n✓ Schema Validation: PASSED")
    else:
        print(f"\n✗ Schema Validation: FAILED ({schema['error_count']} errors)")
        if schema['errors']:
            print(f"   First few errors:")
            for error in schema['errors'][:3]:
                print(f"   - {error}")

    # Performance
    hook_time = report['execution_metadata']['hook_execution_time_ms']
    if hook_time:
        print(f"\n⏱ Hook Execution Time: {hook_time:.2f}ms")
        if hook_time > 5000:
            print(f"   ⚠ Warning: Exceeded 5 second limit")

    print(f"\n{'='*60}\n")


def log_hook_performance(hook_name: str, execution_time_ms: float, items_count: int):
    """
    Log hook performance to hooks_performance.log

    Args:
        hook_name: Name of the hook (e.g., "PostScrapingHook")
        execution_time_ms: Execution time in milliseconds
        items_count: Number of items processed
    """
    log_dir = Path(__file__).parent.parent / "logs"
    log_dir.mkdir(exist_ok=True)

    log_file = log_dir / "hooks_performance.log"

    log_entry = {
        "timestamp": datetime.utcnow().isoformat() + "Z",
        "hook": hook_name,
        "execution_time_ms": execution_time_ms,
        "items_processed": items_count,
        "within_limit": execution_time_ms < 5000
    }

    with open(log_file, "a") as f:
        f.write(json.dumps(log_entry) + "\n")


def main():
    """CLI entry point"""
    import argparse

    parser = argparse.ArgumentParser(
        description="Post-scraping hook: Calculate quality metrics"
    )
    parser.add_argument(
        "items_file",
        type=Path,
        help="Path to scraped items JSON file"
    )
    parser.add_argument(
        "--execution-time",
        type=float,
        help="Scraping execution time in seconds"
    )
    parser.add_argument(
        "--json",
        action="store_true",
        help="Output report as JSON"
    )
    parser.add_argument(
        "--save-report",
        type=Path,
        help="Save quality report to file"
    )

    args = parser.parse_args()

    try:
        # Load items
        items = load_items_file(args.items_file)

        # Generate quality report
        report = generate_quality_report(
            items,
            args.items_file,
            execution_time=args.execution_time
        )

        # Log performance
        log_hook_performance(
            "PostScrapingHook",
            report["execution_metadata"]["hook_execution_time_ms"],
            len(items)
        )

        # Save report if requested
        if args.save_report:
            with open(args.save_report, "w") as f:
                json.dump(report, f, indent=2)
            print(f"Quality report saved to: {args.save_report}")

        # Output report
        if args.json:
            print(json.dumps(report, indent=2))
        else:
            print_quality_report(report)

        # Exit with status based on quality
        if report['quality_score'] < 50:
            print("⚠ WARNING: Quality score below 50. Review scraper implementation.", file=sys.stderr)
            sys.exit(1)
        elif report['schema_validation']['error_count'] > 0:
            print("⚠ WARNING: Schema validation errors detected.", file=sys.stderr)
            sys.exit(1)
        else:
            sys.exit(0)

    except FileNotFoundError as e:
        print(f"✗ Error: {e}", file=sys.stderr)
        sys.exit(1)
    except json.JSONDecodeError as e:
        print(f"✗ Invalid JSON in items file: {e}", file=sys.stderr)
        sys.exit(1)
    except Exception as e:
        print(f"✗ Unexpected error: {e}", file=sys.stderr)
        import traceback
        traceback.print_exc()
        sys.exit(1)


if __name__ == "__main__":
    main()

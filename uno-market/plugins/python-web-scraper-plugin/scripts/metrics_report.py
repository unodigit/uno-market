#!/usr/bin/env python3
"""
Metrics Analysis and Reporting
Analyzes collected metrics and generates reports
Implements T065 - Metrics analysis and reporting
"""

import json
import sys
from collections import defaultdict
from datetime import datetime, timedelta
from pathlib import Path
from typing import Dict, List


def load_metrics(metrics_file: Path, hours: int = None) -> List[Dict]:
    """
    Load metrics from JSONL file

    Args:
        metrics_file: Path to metrics JSONL file
        hours: Optional filter for recent metrics (last N hours)

    Returns:
        List of metric entries
    """
    if not metrics_file.exists():
        return []

    entries = []
    cutoff_time = None

    if hours:
        cutoff_time = datetime.utcnow() - timedelta(hours=hours)

    with open(metrics_file, "r") as f:
        for line in f:
            try:
                entry = json.loads(line.strip())

                # Filter by time if requested
                if cutoff_time:
                    entry_time = datetime.fromisoformat(entry["timestamp"].replace("Z", ""))
                    if entry_time < cutoff_time:
                        continue

                entries.append(entry)
            except (json.JSONDecodeError, KeyError):
                continue

    return entries


def analyze_scraping_sessions(entries: List[Dict]) -> Dict:
    """
    Analyze scraping session metrics

    Args:
        entries: List of metric entries

    Returns:
        Analysis dictionary
    """
    scraping_entries = [e for e in entries if e.get("event_type") == "scraping_session"]

    if not scraping_entries:
        return {"total_sessions": 0}

    total_sessions = len(scraping_entries)
    total_items = sum(e.get("items_scraped", 0) for e in scraping_entries)
    total_duration = sum(e.get("duration_seconds", 0) for e in scraping_entries)
    avg_duration = total_duration / total_sessions if total_sessions > 0 else 0

    # Quality scores
    quality_scores = [e.get("quality_score", 0) for e in scraping_entries if e.get("quality_score")]
    avg_quality = sum(quality_scores) / len(quality_scores) if quality_scores else 0

    # Method breakdown
    methods = defaultdict(int)
    for e in scraping_entries:
        method = e.get("scraping_method", "unknown")
        methods[method] += 1

    # Platform breakdown
    platforms = defaultdict(int)
    for e in scraping_entries:
        platform = e.get("platform", "unknown")
        platforms[platform] += 1

    # Pagination breakdown
    pagination_types = defaultdict(int)
    for e in scraping_entries:
        pag_type = e.get("pagination_type", "unknown")
        pagination_types[pag_type] += 1

    # Errors
    total_errors = sum(e.get("errors", 0) for e in scraping_entries)

    return {
        "total_sessions": total_sessions,
        "total_items_scraped": total_items,
        "total_duration_seconds": round(total_duration, 2),
        "avg_duration_seconds": round(avg_duration, 2),
        "avg_quality_score": round(avg_quality, 1),
        "methods": dict(methods),
        "platforms": dict(platforms),
        "pagination_types": dict(pagination_types),
        "total_errors": total_errors,
        "items_per_session": round(total_items / total_sessions, 1) if total_sessions > 0 else 0
    }


def analyze_investigations(entries: List[Dict]) -> Dict:
    """
    Analyze investigation metrics

    Args:
        entries: List of metric entries

    Returns:
        Analysis dictionary
    """
    investigation_entries = [e for e in entries if e.get("event_type") == "investigation"]

    if not investigation_entries:
        return {"total_investigations": 0}

    total = len(investigation_entries)
    total_duration = sum(e.get("duration_seconds", 0) for e in investigation_entries)
    avg_duration = total_duration / total if total > 0 else 0

    # Endpoints found
    total_endpoints = sum(e.get("endpoints_found", 0) for e in investigation_entries)
    avg_endpoints = total_endpoints / total if total > 0 else 0

    # Confidence scores
    confidence_scores = [e.get("confidence_score", 0) for e in investigation_entries]
    avg_confidence = sum(confidence_scores) / len(confidence_scores) if confidence_scores else 0

    # Recommended strategies
    strategies = defaultdict(int)
    for e in investigation_entries:
        strategy = e.get("recommended_strategy", "unknown")
        strategies[strategy] += 1

    # Platforms
    platforms = defaultdict(int)
    for e in investigation_entries:
        platform = e.get("platform_detected", "unknown")
        platforms[platform] += 1

    return {
        "total_investigations": total,
        "total_duration_seconds": round(total_duration, 2),
        "avg_duration_seconds": round(avg_duration, 2),
        "total_endpoints_found": total_endpoints,
        "avg_endpoints_per_investigation": round(avg_endpoints, 1),
        "avg_confidence_score": round(avg_confidence, 3),
        "recommended_strategies": dict(strategies),
        "platforms_detected": dict(platforms)
    }


def analyze_validations(entries: List[Dict]) -> Dict:
    """
    Analyze validation metrics

    Args:
        entries: List of metric entries

    Returns:
        Analysis dictionary
    """
    validation_entries = [e for e in entries if e.get("event_type") == "validation"]

    if not validation_entries:
        return {"total_validations": 0}

    total = len(validation_entries)
    passed = sum(1 for e in validation_entries if e.get("schema_passed", False))
    failed = total - passed

    # Quality scores
    quality_scores = [e.get("quality_score", 0) for e in validation_entries]
    avg_quality = sum(quality_scores) / len(quality_scores) if quality_scores else 0

    # Total items validated
    total_items = sum(e.get("total_items", 0) for e in validation_entries)

    return {
        "total_validations": total,
        "passed": passed,
        "failed": failed,
        "pass_rate": round((passed / total * 100), 1) if total > 0 else 0,
        "total_items_validated": total_items,
        "avg_quality_score": round(avg_quality, 1)
    }


def analyze_errors(entries: List[Dict]) -> Dict:
    """
    Analyze error metrics

    Args:
        entries: List of metric entries

    Returns:
        Analysis dictionary
    """
    error_entries = [e for e in entries if e.get("event_type") == "error"]

    if not error_entries:
        return {"total_errors": 0}

    # Error type breakdown
    error_types = defaultdict(int)
    for e in error_entries:
        error_type = e.get("error_type", "unknown")
        error_types[error_type] += 1

    # Recent errors (last 5)
    recent_errors = error_entries[-5:] if len(error_entries) >= 5 else error_entries

    return {
        "total_errors": len(error_entries),
        "error_types": dict(error_types),
        "recent_errors": [
            {
                "timestamp": e.get("timestamp"),
                "type": e.get("error_type"),
                "message": e.get("error_message", "")[:100]
            }
            for e in recent_errors
        ]
    }


def print_report(analysis: Dict, verbose: bool = False):
    """
    Print formatted metrics report

    Args:
        analysis: Analysis dictionary
        verbose: Include detailed breakdowns
    """
    print(f"\n{'='*70}")
    print(f"SCRAPING METRICS REPORT")
    print(f"{'='*70}\n")

    # Scraping sessions
    scraping = analysis.get("scraping", {})
    if scraping.get("total_sessions", 0) > 0:
        print(f"📊 SCRAPING SESSIONS")
        print(f"   Total Sessions: {scraping['total_sessions']}")
        print(f"   Total Items Scraped: {scraping['total_items_scraped']}")
        print(f"   Avg Items/Session: {scraping['items_per_session']}")
        print(f"   Avg Duration: {scraping['avg_duration_seconds']:.1f}s")
        print(f"   Avg Quality Score: {scraping['avg_quality_score']}/100")
        print(f"   Total Errors: {scraping['total_errors']}")

        if verbose and scraping.get("methods"):
            print(f"\n   Methods:")
            for method, count in scraping["methods"].items():
                print(f"      {method}: {count}")

        if verbose and scraping.get("platforms"):
            print(f"\n   Platforms:")
            for platform, count in scraping["platforms"].items():
                print(f"      {platform}: {count}")

    # Investigations
    investigation = analysis.get("investigation", {})
    if investigation.get("total_investigations", 0) > 0:
        print(f"\n🔍 INVESTIGATIONS")
        print(f"   Total Investigations: {investigation['total_investigations']}")
        print(f"   Avg Duration: {investigation['avg_duration_seconds']:.1f}s")
        print(f"   Total Endpoints Found: {investigation['total_endpoints_found']}")
        print(f"   Avg Endpoints/Investigation: {investigation['avg_endpoints_per_investigation']}")
        print(f"   Avg Confidence: {investigation['avg_confidence_score']:.1%}")

        if verbose and investigation.get("recommended_strategies"):
            print(f"\n   Recommended Strategies:")
            for strategy, count in investigation["recommended_strategies"].items():
                print(f"      {strategy}: {count}")

    # Validations
    validation = analysis.get("validation", {})
    if validation.get("total_validations", 0) > 0:
        print(f"\n✓ VALIDATIONS")
        print(f"   Total Validations: {validation['total_validations']}")
        print(f"   Passed: {validation['passed']}")
        print(f"   Failed: {validation['failed']}")
        print(f"   Pass Rate: {validation['pass_rate']}%")
        print(f"   Total Items Validated: {validation['total_items_validated']}")
        print(f"   Avg Quality Score: {validation['avg_quality_score']}/100")

    # Errors
    errors = analysis.get("errors", {})
    if errors.get("total_errors", 0) > 0:
        print(f"\n✗ ERRORS")
        print(f"   Total Errors: {errors['total_errors']}")

        if verbose and errors.get("error_types"):
            print(f"\n   Error Types:")
            for error_type, count in errors["error_types"].items():
                print(f"      {error_type}: {count}")

        if errors.get("recent_errors"):
            print(f"\n   Recent Errors:")
            for error in errors["recent_errors"]:
                print(f"      [{error['type']}] {error['message']}")

    print(f"\n{'='*70}\n")


def main():
    """CLI entry point"""
    import argparse

    parser = argparse.ArgumentParser(
        description="Analyze and report scraping metrics"
    )
    parser.add_argument(
        "--metrics-file",
        type=Path,
        default=Path(__file__).parent.parent / "metrics" / "scraping_metrics.jsonl",
        help="Path to metrics JSONL file"
    )
    parser.add_argument(
        "--hours",
        type=int,
        help="Only analyze metrics from last N hours"
    )
    parser.add_argument(
        "--verbose",
        "-v",
        action="store_true",
        help="Show detailed breakdowns"
    )
    parser.add_argument(
        "--json",
        action="store_true",
        help="Output as JSON"
    )

    args = parser.parse_args()

    # Load metrics
    entries = load_metrics(args.metrics_file, hours=args.hours)

    if not entries:
        print("No metrics found.", file=sys.stderr)
        sys.exit(1)

    # Analyze metrics
    analysis = {
        "scraping": analyze_scraping_sessions(entries),
        "investigation": analyze_investigations(entries),
        "validation": analyze_validations(entries),
        "errors": analyze_errors(entries),
        "total_entries": len(entries)
    }

    # Output
    if args.json:
        print(json.dumps(analysis, indent=2))
    else:
        print_report(analysis, verbose=args.verbose)


if __name__ == "__main__":
    main()

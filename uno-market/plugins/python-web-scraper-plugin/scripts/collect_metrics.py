#!/usr/bin/env python3
"""
Metrics Collection System
Collects and logs scraping metrics to JSONL format
Implements T064 - Metrics collection system
"""

import json
import sys
from datetime import datetime
from pathlib import Path
from typing import Dict, Optional


class MetricsCollector:
    """Collects and logs scraping metrics"""

    def __init__(self, metrics_dir: Optional[Path] = None):
        """
        Initialize metrics collector

        Args:
            metrics_dir: Directory to store metrics (default: ../metrics/)
        """
        if metrics_dir is None:
            metrics_dir = Path(__file__).parent.parent / "metrics"

        self.metrics_dir = metrics_dir
        self.metrics_dir.mkdir(exist_ok=True)
        self.metrics_file = self.metrics_dir / "scraping_metrics.jsonl"

    def log_scraping_session(
        self,
        source_url: str,
        scraping_method: str,
        duration_seconds: float,
        items_scraped: int,
        quality_score: float,
        platform: Optional[str] = None,
        pagination_type: Optional[str] = None,
        errors: int = 0,
        metadata: Optional[Dict] = None
    ):
        """
        Log a scraping session to metrics file

        Args:
            source_url: Target URL that was scraped
            scraping_method: "api" or "browser"
            duration_seconds: Scraping duration
            items_scraped: Number of items successfully scraped
            quality_score: Data quality score (0-100)
            platform: Platform type (shopify, wordpress, etc.)
            pagination_type: Pagination method used
            errors: Number of errors encountered
            metadata: Additional metadata dictionary
        """
        entry = {
            "timestamp": datetime.utcnow().isoformat() + "Z",
            "event_type": "scraping_session",
            "source_url": source_url,
            "scraping_method": scraping_method,
            "duration_seconds": round(duration_seconds, 2),
            "items_scraped": items_scraped,
            "quality_score": quality_score,
            "platform": platform,
            "pagination_type": pagination_type,
            "errors": errors,
            "metadata": metadata or {}
        }

        self._append_entry(entry)

    def log_investigation(
        self,
        target_url: str,
        duration_seconds: float,
        endpoints_found: int,
        platform_detected: str,
        confidence_score: float,
        recommended_strategy: str
    ):
        """
        Log an investigation session

        Args:
            target_url: URL that was investigated
            duration_seconds: Investigation duration
            endpoints_found: Number of API endpoints discovered
            platform_detected: Detected platform type
            confidence_score: Investigation confidence (0-1)
            recommended_strategy: "api" or "browser"
        """
        entry = {
            "timestamp": datetime.utcnow().isoformat() + "Z",
            "event_type": "investigation",
            "target_url": target_url,
            "duration_seconds": round(duration_seconds, 2),
            "endpoints_found": endpoints_found,
            "platform_detected": platform_detected,
            "confidence_score": confidence_score,
            "recommended_strategy": recommended_strategy
        }

        self._append_entry(entry)

    def log_validation(
        self,
        items_file: str,
        total_items: int,
        schema_passed: bool,
        quality_score: float,
        field_completeness: Dict[str, float]
    ):
        """
        Log output validation results

        Args:
            items_file: Path to items file
            total_items: Number of items validated
            schema_passed: Whether schema validation passed
            quality_score: Data quality score (0-100)
            field_completeness: Completeness percentages per field
        """
        entry = {
            "timestamp": datetime.utcnow().isoformat() + "Z",
            "event_type": "validation",
            "items_file": items_file,
            "total_items": total_items,
            "schema_passed": schema_passed,
            "quality_score": quality_score,
            "field_completeness": field_completeness
        }

        self._append_entry(entry)

    def log_error(
        self,
        error_type: str,
        error_message: str,
        context: Optional[Dict] = None
    ):
        """
        Log an error event

        Args:
            error_type: Type of error (e.g., "network_error", "parsing_error")
            error_message: Error description
            context: Additional context dictionary
        """
        entry = {
            "timestamp": datetime.utcnow().isoformat() + "Z",
            "event_type": "error",
            "error_type": error_type,
            "error_message": error_message,
            "context": context or {}
        }

        self._append_entry(entry)

    def _append_entry(self, entry: Dict):
        """
        Append a metrics entry to the JSONL file

        Args:
            entry: Metrics dictionary
        """
        with open(self.metrics_file, "a") as f:
            f.write(json.dumps(entry) + "\n")


def main():
    """CLI entry point for manual metrics logging"""
    import argparse

    parser = argparse.ArgumentParser(
        description="Log scraping metrics to JSONL"
    )

    subparsers = parser.add_subparsers(dest="command", help="Metric type to log")

    # Scraping session
    scraping_parser = subparsers.add_parser("scraping", help="Log scraping session")
    scraping_parser.add_argument("source_url", help="Target URL")
    scraping_parser.add_argument("scraping_method", choices=["api", "browser"], help="Scraping method")
    scraping_parser.add_argument("duration", type=float, help="Duration in seconds")
    scraping_parser.add_argument("items_scraped", type=int, help="Number of items scraped")
    scraping_parser.add_argument("quality_score", type=float, help="Quality score (0-100)")
    scraping_parser.add_argument("--platform", help="Platform type")
    scraping_parser.add_argument("--pagination", help="Pagination type")
    scraping_parser.add_argument("--errors", type=int, default=0, help="Error count")

    # Investigation
    investigation_parser = subparsers.add_parser("investigation", help="Log investigation session")
    investigation_parser.add_argument("target_url", help="Target URL")
    investigation_parser.add_argument("duration", type=float, help="Duration in seconds")
    investigation_parser.add_argument("endpoints_found", type=int, help="Endpoints discovered")
    investigation_parser.add_argument("platform_detected", help="Platform type")
    investigation_parser.add_argument("confidence_score", type=float, help="Confidence (0-1)")
    investigation_parser.add_argument("recommended_strategy", choices=["api", "browser"], help="Strategy")

    # Validation
    validation_parser = subparsers.add_parser("validation", help="Log validation results")
    validation_parser.add_argument("items_file", help="Items file path")
    validation_parser.add_argument("total_items", type=int, help="Total items")
    validation_parser.add_argument("--passed", action="store_true", help="Schema validation passed")
    validation_parser.add_argument("quality_score", type=float, help="Quality score (0-100)")

    # Error
    error_parser = subparsers.add_parser("error", help="Log error event")
    error_parser.add_argument("error_type", help="Error type")
    error_parser.add_argument("error_message", help="Error description")

    args = parser.parse_args()

    if not args.command:
        parser.print_help()
        sys.exit(1)

    collector = MetricsCollector()

    try:
        if args.command == "scraping":
            collector.log_scraping_session(
                source_url=args.source_url,
                scraping_method=args.scraping_method,
                duration_seconds=args.duration,
                items_scraped=args.items_scraped,
                quality_score=args.quality_score,
                platform=args.platform,
                pagination_type=args.pagination,
                errors=args.errors
            )
            print("✓ Scraping metrics logged")

        elif args.command == "investigation":
            collector.log_investigation(
                target_url=args.target_url,
                duration_seconds=args.duration,
                endpoints_found=args.endpoints_found,
                platform_detected=args.platform_detected,
                confidence_score=args.confidence_score,
                recommended_strategy=args.recommended_strategy
            )
            print("✓ Investigation metrics logged")

        elif args.command == "validation":
            # For CLI, we need field completeness - use placeholder
            collector.log_validation(
                items_file=args.items_file,
                total_items=args.total_items,
                schema_passed=args.passed,
                quality_score=args.quality_score,
                field_completeness={"title": 100, "price": 100, "image_urls": 100, "description": 100}
            )
            print("✓ Validation metrics logged")

        elif args.command == "error":
            collector.log_error(
                error_type=args.error_type,
                error_message=args.error_message
            )
            print("✓ Error metrics logged")

    except Exception as e:
        print(f"✗ Failed to log metrics: {e}", file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()

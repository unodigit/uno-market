#!/usr/bin/env python3
"""
Investigation Report Formatter
Formats investigation reports for human-readable CLI output
Implements T043 [US2] - Investigation report CLI formatter
"""

import json
import sys
from pathlib import Path
from typing import Dict


# ANSI color codes
class Colors:
    RED = '\033[91m'
    GREEN = '\033[92m'
    YELLOW = '\033[93m'
    BLUE = '\033[94m'
    MAGENTA = '\033[95m'
    CYAN = '\033[96m'
    RESET = '\033[0m'
    BOLD = '\033[1m'
    DIM = '\033[2m'


def format_investigation_report(report: Dict, color: bool = True, verbose: bool = False) -> str:
    """
    Format investigation report for CLI display

    Args:
        report: Investigation report dictionary
        color: Enable colored output
        verbose: Include detailed information

    Returns:
        Formatted report string
    """
    def c(text, color_code):
        """Apply color if enabled"""
        if color:
            return f"{color_code}{text}{Colors.RESET}"
        return text

    lines = []

    # Header
    lines.append(f"\n{'='*70}")
    lines.append(c("INVESTIGATION REPORT", Colors.BOLD))
    lines.append(f"{'='*70}\n")

    # Target information
    lines.append(c("🎯 TARGET", Colors.BOLD))
    lines.append(f"   URL: {report.get('target_url', 'N/A')}")
    lines.append(f"   Timestamp: {report.get('timestamp', 'N/A')}")

    # Platform detection
    platform = report.get('platform_detected', 'unknown')
    platform_conf = report.get('platform_confidence', 0)

    lines.append(f"\n{c('🔍 PLATFORM DETECTION', Colors.BOLD)}")
    lines.append(f"   Platform: {c(platform.upper(), Colors.CYAN)}")
    lines.append(f"   Confidence: {platform_conf:.1%}")

    # Recommended strategy
    strategy = report.get('recommended_strategy', 'unknown')
    confidence = report.get('confidence_score', 0)

    lines.append(f"\n{c('📋 RECOMMENDED STRATEGY', Colors.BOLD)}")

    if strategy == "api":
        strategy_display = c("API Scraping", Colors.GREEN)
        strategy_icon = "✓"
    else:
        strategy_display = c("Browser Scraping", Colors.YELLOW)
        strategy_icon = "⚠"

    lines.append(f"   {strategy_icon} Strategy: {strategy_display}")
    lines.append(f"   Overall Confidence: {c(f'{confidence:.1%}', Colors.GREEN if confidence >= 0.7 else Colors.YELLOW)}")

    # Discovered endpoints
    endpoints = report.get('discovered_endpoints', [])
    lines.append(f"\n{c('🔗 DISCOVERED ENDPOINTS', Colors.BOLD)} ({len(endpoints)} found)")

    if endpoints:
        for idx, endpoint in enumerate(endpoints, 1):
            url = endpoint.get('url', 'N/A')
            method = endpoint.get('method', 'GET')
            conf = endpoint.get('confidence', 'unknown')
            status = endpoint.get('status_code', 0)

            # Confidence color coding
            if conf == "high":
                conf_color = Colors.GREEN
            elif conf == "medium":
                conf_color = Colors.YELLOW
            else:
                conf_color = Colors.RED

            # Status code color coding
            if 200 <= status < 300:
                status_color = Colors.GREEN
            elif 300 <= status < 400:
                status_color = Colors.YELLOW
            else:
                status_color = Colors.RED

            lines.append(f"\n   {idx}. {c(url, Colors.BLUE)}")
            lines.append(f"      Method: {method}")
            lines.append(f"      Status: {c(str(status), status_color)}")
            lines.append(f"      Confidence: {c(conf.upper(), conf_color)}")

            # Show sample response in verbose mode
            if verbose and endpoint.get('sample_response'):
                sample = endpoint['sample_response']
                sample_str = json.dumps(sample, indent=2)
                # Truncate if too long
                if len(sample_str) > 200:
                    sample_str = sample_str[:200] + "..."
                lines.append(f"      Sample Response:")
                for line in sample_str.split('\n'):
                    lines.append(f"        {c(line, Colors.DIM)}")
    else:
        lines.append(f"   {c('No API endpoints found', Colors.YELLOW)}")
        lines.append(f"   Browser scraping will be required")

    # Metadata
    metadata = report.get('metadata', {})
    if metadata:
        lines.append(f"\n{c('📊 INVESTIGATION METADATA', Colors.BOLD)}")
        duration = metadata.get('investigation_duration_seconds', 0)
        probed = metadata.get('endpoints_probed', 0)
        found = metadata.get('endpoints_found', 0)

        lines.append(f"   Duration: {duration:.2f}s")
        lines.append(f"   Endpoints Probed: {probed}")
        lines.append(f"   Endpoints Found: {found}")

        if verbose and metadata.get('techniques_used'):
            lines.append(f"   Techniques Used:")
            for technique in metadata['techniques_used']:
                lines.append(f"      - {technique}")

    # Next steps
    lines.append(f"\n{c('💡 NEXT STEPS', Colors.BOLD)}")

    if strategy == "api" and endpoints:
        lines.append(f"   1. Review discovered API endpoints above")
        lines.append(f"   2. Use /scrape-url to generate API scraper automatically")
        lines.append(f"   3. Or use /validate-investigation to verify before scraping")
    elif strategy == "browser":
        lines.append(f"   1. Run /detect-pagination to analyze pagination strategy")
        lines.append(f"   2. Run /analyze-dom to generate CSS selectors")
        lines.append(f"   3. Use /scrape-url to generate browser scraper automatically")
    else:
        lines.append(f"   1. Review investigation results")
        lines.append(f"   2. Consider running with --deep-scan flag for more thorough analysis")
        lines.append(f"   3. Or provide custom --api-patterns for specialized endpoint detection")

    lines.append(f"\n{'='*70}\n")

    return '\n'.join(lines)


def main():
    """CLI entry point"""
    import argparse

    parser = argparse.ArgumentParser(
        description="Format investigation report for human-readable output"
    )
    parser.add_argument(
        "report_file",
        type=Path,
        help="Path to investigation_report.json"
    )
    parser.add_argument(
        "--no-color",
        action="store_true",
        help="Disable colored output"
    )
    parser.add_argument(
        "--verbose",
        "-v",
        action="store_true",
        help="Show detailed information (sample responses, techniques)"
    )

    args = parser.parse_args()

    # Load report
    if not args.report_file.exists():
        print(f"Error: Report file not found: {args.report_file}", file=sys.stderr)
        sys.exit(1)

    try:
        with open(args.report_file, "r") as f:
            report = json.load(f)
    except json.JSONDecodeError as e:
        print(f"Error: Invalid JSON in report file: {e}", file=sys.stderr)
        sys.exit(1)

    # Format and print
    formatted = format_investigation_report(
        report,
        color=not args.no_color,
        verbose=args.verbose
    )
    print(formatted)

    # Exit with status based on findings
    if report.get('recommended_strategy') == 'api' and report.get('discovered_endpoints'):
        sys.exit(0)  # Success - APIs found
    elif report.get('recommended_strategy') == 'browser':
        sys.exit(0)  # Success - browser strategy determined
    else:
        sys.exit(1)  # No clear strategy


if __name__ == "__main__":
    main()

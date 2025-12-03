#!/usr/bin/env python3
"""
Scraper Code Refactoring Script
Uses LibCST for lossless AST manipulation and code refactoring
Implements T060 [US5] - Auto-refactoring for scraper code
"""

import sys
from pathlib import Path
from typing import Dict, List, Optional

try:
    import libcst as cst
    from libcst import metadata
except ImportError:
    print(
        "Error: libcst is not installed.\n"
        "Install it with: pip install libcst\n"
        "This is an optional dependency for advanced refactoring features.",
        file=sys.stderr
    )
    sys.exit(1)


class SelectorRefactorTransformer(cst.CSTTransformer):
    """
    Refactors CSS selectors in scraper code

    Example refactoring:
    - Update outdated selector patterns
    - Fix invalid selectors
    - Optimize selector performance
    """

    def __init__(self, selector_updates: Dict[str, str]):
        """
        Initialize transformer

        Args:
            selector_updates: Dict mapping old selectors to new selectors
        """
        self.selector_updates = selector_updates
        self.changes_made = []

    def leave_SimpleString(
        self, original_node: cst.SimpleString, updated_node: cst.SimpleString
    ) -> cst.SimpleString:
        """
        Update string literals containing CSS selectors

        Args:
            original_node: Original string node
            updated_node: Updated string node

        Returns:
            Potentially modified string node
        """
        # Get string value without quotes
        value = original_node.value.strip('"\'')

        # Check if this string matches a selector we want to update
        if value in self.selector_updates:
            new_selector = self.selector_updates[value]
            quote_char = original_node.value[0]  # Preserve quote style

            self.changes_made.append({
                "type": "selector_update",
                "old": value,
                "new": new_selector,
                "line": original_node.metadata.get("line", "unknown") if hasattr(original_node, "metadata") else "unknown"
            })

            # Create new string with same quote style
            return updated_node.with_changes(
                value=f"{quote_char}{new_selector}{quote_char}"
            )

        return updated_node


class TimeoutRefactorTransformer(cst.CSTTransformer):
    """
    Refactors timeout values in scraper code

    Example refactoring:
    - Update wait_for_timeout values
    - Standardize timeout constants
    """

    def __init__(self, new_timeout_ms: int):
        """
        Initialize transformer

        Args:
            new_timeout_ms: New timeout value in milliseconds
        """
        self.new_timeout_ms = new_timeout_ms
        self.changes_made = []

    def leave_Call(
        self, original_node: cst.Call, updated_node: cst.Call
    ) -> cst.Call:
        """
        Update timeout arguments in function calls

        Args:
            original_node: Original call node
            updated_node: Updated call node

        Returns:
            Potentially modified call node
        """
        # Check if this is a wait_for_timeout call
        if isinstance(updated_node.func, cst.Attribute):
            if updated_node.func.attr.value == "wait_for_timeout":
                # Update the first argument (timeout value)
                if updated_node.args:
                    new_args = [
                        cst.Arg(value=cst.Integer(str(self.new_timeout_ms)))
                    ] + list(updated_node.args[1:])

                    self.changes_made.append({
                        "type": "timeout_update",
                        "function": "wait_for_timeout",
                        "new_value": self.new_timeout_ms
                    })

                    return updated_node.with_changes(args=new_args)

        return updated_node


def refactor_selectors(source_code: str, selector_updates: Dict[str, str]) -> tuple[str, List[Dict]]:
    """
    Refactor CSS selectors in scraper code

    Args:
        source_code: Original Python source code
        selector_updates: Dictionary mapping old selectors to new selectors

    Returns:
        Tuple of (refactored_code, changes_list)
    """
    try:
        # Parse source code into CST
        module = cst.parse_module(source_code)

        # Apply transformation
        transformer = SelectorRefactorTransformer(selector_updates)
        modified_tree = module.visit(transformer)

        # Generate modified code
        refactored_code = modified_tree.code

        return refactored_code, transformer.changes_made

    except cst.ParserSyntaxError as e:
        raise ValueError(f"Failed to parse source code: {e}")


def refactor_timeouts(source_code: str, new_timeout_ms: int) -> tuple[str, List[Dict]]:
    """
    Refactor timeout values in scraper code

    Args:
        source_code: Original Python source code
        new_timeout_ms: New timeout value in milliseconds

    Returns:
        Tuple of (refactored_code, changes_list)
    """
    try:
        module = cst.parse_module(source_code)
        transformer = TimeoutRefactorTransformer(new_timeout_ms)
        modified_tree = module.visit(transformer)
        refactored_code = modified_tree.code

        return refactored_code, transformer.changes_made

    except cst.ParserSyntaxError as e:
        raise ValueError(f"Failed to parse source code: {e}")


def analyze_code_quality(source_code: str) -> Dict:
    """
    Analyze code quality and suggest improvements

    Args:
        source_code: Python source code

    Returns:
        Analysis dictionary with suggestions
    """
    try:
        module = cst.parse_module(source_code)

        suggestions = {
            "complexity_issues": [],
            "performance_issues": [],
            "style_issues": []
        }

        # Basic analysis (can be extended)
        # TODO: Implement complexity analysis
        # TODO: Implement performance analysis
        # TODO: Implement style analysis

        return suggestions

    except cst.ParserSyntaxError as e:
        return {"error": f"Failed to parse code: {e}"}


def main():
    """CLI entry point"""
    import argparse
    import json

    parser = argparse.ArgumentParser(
        description="Refactor scraper code using LibCST"
    )

    subparsers = parser.add_subparsers(dest="command", help="Refactoring command")

    # Selector refactoring
    selectors_parser = subparsers.add_parser(
        "selectors",
        help="Refactor CSS selectors"
    )
    selectors_parser.add_argument(
        "scraper_file",
        type=Path,
        help="Path to scraper Python file"
    )
    selectors_parser.add_argument(
        "--updates",
        type=Path,
        help="JSON file with selector updates (old -> new mapping)"
    )
    selectors_parser.add_argument(
        "--output",
        type=Path,
        help="Output file (default: overwrite input)"
    )

    # Timeout refactoring
    timeout_parser = subparsers.add_parser(
        "timeouts",
        help="Refactor timeout values"
    )
    timeout_parser.add_argument(
        "scraper_file",
        type=Path,
        help="Path to scraper Python file"
    )
    timeout_parser.add_argument(
        "--timeout",
        type=int,
        required=True,
        help="New timeout value in milliseconds"
    )
    timeout_parser.add_argument(
        "--output",
        type=Path,
        help="Output file (default: overwrite input)"
    )

    # Code analysis
    analyze_parser = subparsers.add_parser(
        "analyze",
        help="Analyze code quality"
    )
    analyze_parser.add_argument(
        "scraper_file",
        type=Path,
        help="Path to scraper Python file"
    )

    args = parser.parse_args()

    if not args.command:
        parser.print_help()
        sys.exit(1)

    # Execute command
    try:
        if args.command == "selectors":
            # Load scraper file
            if not args.scraper_file.exists():
                print(f"Error: Scraper file not found: {args.scraper_file}", file=sys.stderr)
                sys.exit(1)

            with open(args.scraper_file, "r") as f:
                source_code = f.read()

            # Load selector updates
            if args.updates:
                if not args.updates.exists():
                    print(f"Error: Updates file not found: {args.updates}", file=sys.stderr)
                    sys.exit(1)
                with open(args.updates, "r") as f:
                    selector_updates = json.load(f)
            else:
                print("Error: --updates file required for selector refactoring", file=sys.stderr)
                sys.exit(1)

            # Refactor
            refactored_code, changes = refactor_selectors(source_code, selector_updates)

            # Save output
            output_file = args.output or args.scraper_file
            with open(output_file, "w") as f:
                f.write(refactored_code)

            print(f"✓ Refactored selectors in: {output_file}")
            print(f"  Changes made: {len(changes)}")
            for change in changes:
                print(f"    - {change['old']} → {change['new']}")

        elif args.command == "timeouts":
            # Load scraper file
            if not args.scraper_file.exists():
                print(f"Error: Scraper file not found: {args.scraper_file}", file=sys.stderr)
                sys.exit(1)

            with open(args.scraper_file, "r") as f:
                source_code = f.read()

            # Refactor
            refactored_code, changes = refactor_timeouts(source_code, args.timeout)

            # Save output
            output_file = args.output or args.scraper_file
            with open(output_file, "w") as f:
                f.write(refactored_code)

            print(f"✓ Refactored timeouts in: {output_file}")
            print(f"  Changes made: {len(changes)}")
            print(f"  New timeout: {args.timeout}ms")

        elif args.command == "analyze":
            # Load scraper file
            if not args.scraper_file.exists():
                print(f"Error: Scraper file not found: {args.scraper_file}", file=sys.stderr)
                sys.exit(1)

            with open(args.scraper_file, "r") as f:
                source_code = f.read()

            # Analyze
            analysis = analyze_code_quality(source_code)

            if "error" in analysis:
                print(f"Error: {analysis['error']}", file=sys.stderr)
                sys.exit(1)

            print(json.dumps(analysis, indent=2))

    except Exception as e:
        print(f"Error: {e}", file=sys.stderr)
        import traceback
        traceback.print_exc()
        sys.exit(1)


if __name__ == "__main__":
    main()

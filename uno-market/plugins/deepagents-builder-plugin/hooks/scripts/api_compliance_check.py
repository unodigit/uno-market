#!/usr/bin/env python3
"""
API Compliance Check for DeepAgents Builder Plugin.

This hook validates generated code against the official DeepAgents API patterns
and suggests MCP documentation lookups when violations are detected.

Usage:
    Called automatically as a PreToolUse hook on Write/Edit operations.
    
Environment Variables:
    FILE_CONTENT: The content being written
    FILE_PATH: The path of the file being written
    CLAUDE_PLUGIN_ROOT: Root directory of the plugin
"""

import json
import os
import re
import sys
from dataclasses import dataclass
from pathlib import Path
from typing import Optional


@dataclass
class Violation:
    """Represents an API compliance violation."""
    severity: str  # CRITICAL, WARNING, INFO
    pattern: str
    reason: str
    correction: str
    mcp_query: str
    line_number: Optional[int] = None


def load_api_patterns() -> dict:
    """Load API patterns from config file."""
    plugin_root = os.environ.get('CLAUDE_PLUGIN_ROOT', '')
    patterns_path = Path(plugin_root) / 'config' / 'api_patterns.json'
    
    if not patterns_path.exists():
        # Fallback: look relative to this script
        script_dir = Path(__file__).parent.parent.parent
        patterns_path = script_dir / 'config' / 'api_patterns.json'
    
    if patterns_path.exists():
        with open(patterns_path) as f:
            return json.load(f)
    
    return {"forbidden_patterns": [], "approved_imports": {}}


def check_forbidden_patterns(content: str, patterns: dict) -> list[Violation]:
    """Check content against forbidden patterns."""
    violations = []
    lines = content.split('\n')
    
    for forbidden in patterns.get('forbidden_patterns', []):
        pattern = forbidden['pattern']
        
        for line_num, line in enumerate(lines, 1):
            if pattern in line:
                violations.append(Violation(
                    severity="CRITICAL",
                    pattern=pattern,
                    reason=forbidden['reason'],
                    correction=forbidden['correction'],
                    mcp_query=forbidden['mcp_query'],
                    line_number=line_num
                ))
    
    return violations


def check_missing_primary_imports(content: str, patterns: dict) -> list[Violation]:
    """Check if primary imports are missing when agent code is detected."""
    violations = []
    
    # Only check if this looks like agent code
    agent_indicators = [
        'create_deep_agent',
        '@tool',
        'deepagents',
        'langgraph',
        'langchain'
    ]
    
    is_agent_code = any(indicator in content for indicator in agent_indicators)
    
    if not is_agent_code:
        return violations
    
    # Check for primary imports
    primary_imports = patterns.get('approved_imports', {}).get('primary', [])
    
    for import_spec in primary_imports:
        if import_spec.get('required', False):
            module = import_spec['module']
            imports = import_spec['imports']
            
            # Check if the module is imported correctly
            for imp in imports:
                correct_import = f"from {module} import {imp}"
                if imp in content and correct_import not in content:
                    # They're using the function but not importing correctly
                    violations.append(Violation(
                        severity="CRITICAL",
                        pattern=f"Missing import: {correct_import}",
                        reason=f"{imp} must be imported from {module}",
                        correction=f"Add: {correct_import}",
                        mcp_query=f"{module} {imp} import usage"
                    ))
    
    return violations


def check_dependency_violations(content: str, patterns: dict) -> list[Violation]:
    """Check pyproject.toml for dependency violations."""
    violations = []
    
    dep_rules = patterns.get('dependency_rules', {}).get('pyproject_template', {})
    forbidden_deps = dep_rules.get('forbidden_direct_dependencies', [])
    
    for dep in forbidden_deps:
        # Check for dependency in pyproject.toml format
        dep_patterns = [
            f'"{dep}',  # "langgraph>=..."
            f"'{dep}",  # 'langgraph>=...'
            f'    {dep}',  # indented dependency
        ]
        
        for dep_pattern in dep_patterns:
            if dep_pattern in content:
                violations.append(Violation(
                    severity="CRITICAL",
                    pattern=f"Forbidden dependency: {dep}",
                    reason=f"{dep} is a transitive dependency of deepagents",
                    correction="Remove from dependencies - it's included with deepagents",
                    mcp_query="deepagents installation dependencies transitive"
                ))
                break
    
    return violations


def check_raw_stategraph_usage(content: str) -> list[Violation]:
    """Specifically check for raw StateGraph patterns that indicate old-style code."""
    violations = []
    
    # Pattern: Creating a StateGraph instance
    if re.search(r'StateGraph\s*\(', content):
        violations.append(Violation(
            severity="CRITICAL",
            pattern="StateGraph instantiation detected",
            reason="Raw StateGraph is the old way of creating agents",
            correction="Use create_deep_agent() from deepagents package instead",
            mcp_query="create_deep_agent migration from StateGraph"
        ))
    
    # Pattern: Manual node/edge addition
    if re.search(r'graph\.(add_node|add_edge|add_conditional_edges)\s*\(', content):
        violations.append(Violation(
            severity="CRITICAL",
            pattern="Manual graph construction detected",
            reason="Manual graph.add_node/add_edge is deprecated for agent creation",
            correction="Use create_deep_agent() with subagents for multi-agent patterns",
            mcp_query="deepagents subagent configuration supervisor pattern"
        ))
    
    return violations


def generate_mcp_suggestions(violations: list[Violation]) -> list[dict]:
    """Generate MCP query suggestions for violations."""
    suggestions = []
    seen_queries = set()
    
    for v in violations:
        if v.mcp_query and v.mcp_query not in seen_queries:
            seen_queries.add(v.mcp_query)
            suggestions.append({
                "mcp_server": "langchain-docs",
                "tool": "SearchDocsByLangChain",
                "query": v.mcp_query,
                "reason": v.reason
            })
    
    return suggestions


def format_report(violations: list[Violation], mcp_suggestions: list[dict], filepath: str) -> dict:
    """Format the compliance check report."""
    critical_count = sum(1 for v in violations if v.severity == "CRITICAL")
    warning_count = sum(1 for v in violations if v.severity == "WARNING")
    
    report = {
        "status": "fail" if critical_count > 0 else ("warn" if warning_count > 0 else "pass"),
        "file": filepath,
        "summary": {
            "critical": critical_count,
            "warning": warning_count,
            "info": len(violations) - critical_count - warning_count
        },
        "violations": [
            {
                "severity": v.severity,
                "pattern": v.pattern,
                "reason": v.reason,
                "correction": v.correction,
                "line": v.line_number
            }
            for v in violations
        ],
        "mcp_suggestions": mcp_suggestions
    }
    
    if violations:
        report["action_required"] = (
            "Before proceeding, use the MCP langchain-docs server to verify correct API usage. "
            "Query suggestions are provided in the 'mcp_suggestions' field."
        )
    
    return report


def main():
    """Main compliance check logic."""
    # Read content from environment or stdin
    content = os.environ.get('FILE_CONTENT', '')
    if not content:
        content = sys.stdin.read()
    
    filepath = os.environ.get('FILE_PATH', 'unknown')
    
    # Skip non-Python files (except pyproject.toml)
    if not filepath.endswith('.py') and not filepath.endswith('pyproject.toml'):
        print(json.dumps({
            "status": "skip",
            "message": "Not a Python file or pyproject.toml",
            "file": filepath
        }))
        sys.exit(0)
    
    # Load patterns
    patterns = load_api_patterns()
    
    # Run all checks
    all_violations = []
    
    if filepath.endswith('.py'):
        all_violations.extend(check_forbidden_patterns(content, patterns))
        all_violations.extend(check_missing_primary_imports(content, patterns))
        all_violations.extend(check_raw_stategraph_usage(content))
    elif filepath.endswith('pyproject.toml'):
        all_violations.extend(check_dependency_violations(content, patterns))
    
    # Generate MCP suggestions
    mcp_suggestions = generate_mcp_suggestions(all_violations)
    
    # Format and output report
    report = format_report(all_violations, mcp_suggestions, filepath)
    print(json.dumps(report, indent=2))
    
    # Exit with error if critical violations found
    if report["status"] == "fail":
        sys.exit(1)
    sys.exit(0)


if __name__ == "__main__":
    main()


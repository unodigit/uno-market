#!/usr/bin/env python3
"""
Validate agent code before file creation.
Checks for security issues, best practices, and common mistakes.
"""

import sys
import re
import ast
import json

def check_security_issues(content):
    """Check for common security issues."""
    issues = []
    
    # Check for hardcoded API keys
    api_key_patterns = [
        r'api_key\s*=\s*["\'][^"\']+["\']',
        r'ANTHROPIC_API_KEY\s*=\s*["\'][^"\']+["\']',
        r'OPENAI_API_KEY\s*=\s*["\'][^"\']+["\']',
        r'sk-[a-zA-Z0-9]{32,}',
    ]
    
    for pattern in api_key_patterns:
        if re.search(pattern, content, re.IGNORECASE):
            issues.append({
                "severity": "CRITICAL",
                "message": "Potential hardcoded API key detected",
                "suggestion": "Use environment variables: os.environ.get('API_KEY')"
            })
    
    # Check for unsafe shell commands
    if 'subprocess' in content or 'os.system' in content:
        if 'shell=True' in content:
            issues.append({
                "severity": "WARNING",
                "message": "Shell=True detected in subprocess call",
                "suggestion": "Use shell=False with list arguments to prevent injection"
            })
    
    # Check for unsafe file operations
    if 'open(' in content and ('w' in content or 'a' in content):
        if 'root_dir' not in content.lower() and 'sandbox' not in content.lower():
            issues.append({
                "severity": "WARNING",
                "message": "File write operations without apparent sandboxing",
                "suggestion": "Use FilesystemBackend(root_dir='/safe/path') to sandbox operations"
            })
    
    return issues

def check_best_practices(content):
    """Check for DeepAgents best practices."""
    issues = []
    
    # Check for type hints
    if 'def ' in content:
        func_pattern = r'def \w+\([^)]*\)(?!\s*->)'
        matches = re.findall(func_pattern, content)
        if matches:
            issues.append({
                "severity": "INFO",
                "message": f"Functions without return type hints: {len(matches)} found",
                "suggestion": "Add return type annotations for better type safety"
            })
    
    # Check for docstrings in tools
    if '@tool' in content:
        # Simple check: @tool followed by def without docstring
        tool_pattern = r'@tool\s+def \w+\([^)]*\):[^\n]*\n\s+(?!""")'
        if re.search(tool_pattern, content):
            issues.append({
                "severity": "WARNING",
                "message": "Tool function missing docstring",
                "suggestion": "Add docstring to @tool functions for LLM to understand usage"
            })
    
    # Check for error handling
    if 'create_deep_agent' in content and 'try' not in content:
        issues.append({
            "severity": "INFO",
            "message": "No error handling detected",
            "suggestion": "Wrap agent invocations in try/except for robustness"
        })
    
    return issues

def main():
    """Main validation logic."""
    # Read content from environment or stdin
    import os
    
    content = os.environ.get('FILE_CONTENT', '')
    if not content:
        content = sys.stdin.read()
    
    # Only validate Python files
    filename = os.environ.get('FILE_PATH', '')
    if not filename.endswith('.py'):
        print(json.dumps({"status": "skip", "message": "Not a Python file"}))
        sys.exit(0)
    
    all_issues = []
    
    # Run checks
    all_issues.extend(check_security_issues(content))
    all_issues.extend(check_best_practices(content))
    
    # Determine overall status
    critical_count = sum(1 for i in all_issues if i['severity'] == 'CRITICAL')
    warning_count = sum(1 for i in all_issues if i['severity'] == 'WARNING')
    
    result = {
        "status": "fail" if critical_count > 0 else "pass",
        "issues": all_issues,
        "summary": {
            "critical": critical_count,
            "warning": warning_count,
            "info": len(all_issues) - critical_count - warning_count
        }
    }
    
    print(json.dumps(result, indent=2))
    
    # Exit with error if critical issues found
    if critical_count > 0:
        sys.exit(1)
    sys.exit(0)

if __name__ == "__main__":
    main()

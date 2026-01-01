#!/usr/bin/env python3
"""
Reconcile subagent outputs after completion.
SubagentStop hook - processes and validates subagent results.
"""

import sys
import os
import json
import re
from datetime import datetime
from typing import Any


def extract_code_blocks(content: str) -> list[dict]:
    """Extract code blocks from subagent output."""
    pattern = r'```(\w+)?\n(.*?)```'
    matches = re.findall(pattern, content, re.DOTALL)
    return [
        {"language": lang or "text", "code": code.strip()}
        for lang, code in matches
    ]


def extract_file_operations(content: str) -> list[dict]:
    """Identify file operations suggested by subagent."""
    operations = []

    # Look for file write patterns
    write_patterns = [
        r'(?:create|write|save)\s+(?:file\s+)?[`"\']?([^\s`"\']+\.\w+)[`"\']?',
        r'(?:File|Output):\s*[`"\']?([^\s`"\']+\.\w+)[`"\']?',
    ]

    for pattern in write_patterns:
        matches = re.findall(pattern, content, re.IGNORECASE)
        for match in matches:
            operations.append({
                "type": "write",
                "path": match,
                "detected_from": "content_analysis"
            })

    return operations


def validate_agent_output(output: dict) -> dict:
    """Validate subagent output structure and content."""
    issues = []
    warnings = []

    # Check for required fields
    if "messages" not in output and "result" not in output:
        issues.append("Missing 'messages' or 'result' in output")

    # Check for error indicators
    content = json.dumps(output) if isinstance(output, dict) else str(output)

    if "error" in content.lower():
        warnings.append("Output contains error mentions - review required")

    if "TODO" in content or "FIXME" in content:
        warnings.append("Output contains TODO/FIXME markers")

    # Check for incomplete code
    code_blocks = extract_code_blocks(content)
    for block in code_blocks:
        if "..." in block["code"] or "pass  #" in block["code"]:
            warnings.append(f"Potentially incomplete code in {block['language']} block")

    return {
        "valid": len(issues) == 0,
        "issues": issues,
        "warnings": warnings,
        "code_blocks": len(code_blocks),
        "file_operations": extract_file_operations(content)
    }


def summarize_output(output: dict, max_length: int = 500) -> str:
    """Create a concise summary of subagent output."""
    content = ""

    if isinstance(output, dict):
        if "messages" in output:
            messages = output["messages"]
            if messages and isinstance(messages, list):
                last_msg = messages[-1]
                if isinstance(last_msg, dict):
                    content = last_msg.get("content", str(last_msg))
                else:
                    content = str(last_msg)
        elif "result" in output:
            content = str(output["result"])
        else:
            content = json.dumps(output)
    else:
        content = str(output)

    # Truncate if needed
    if len(content) > max_length:
        return content[:max_length] + "..."
    return content


def reconcile(agent_name: str, output: dict) -> dict:
    """Main reconciliation logic."""
    validation = validate_agent_output(output)
    summary = summarize_output(output)

    result = {
        "timestamp": datetime.utcnow().isoformat() + "Z",
        "agent": agent_name,
        "status": "success" if validation["valid"] else "needs_review",
        "validation": validation,
        "summary": summary,
        "metadata": {
            "code_blocks_found": validation["code_blocks"],
            "file_operations_detected": len(validation["file_operations"]),
            "has_warnings": len(validation["warnings"]) > 0
        }
    }

    # Log file operations for tracking
    if validation["file_operations"]:
        result["pending_file_operations"] = validation["file_operations"]

    return result


def main():
    """Main entry point."""
    # Read subagent output from environment or stdin
    agent_name = os.environ.get("AGENT_NAME", "unknown")
    raw_output = os.environ.get("AGENT_OUTPUT", "")

    if not raw_output:
        raw_output = sys.stdin.read()

    # Parse output
    try:
        output = json.loads(raw_output) if raw_output.strip().startswith("{") else {"result": raw_output}
    except json.JSONDecodeError:
        output = {"result": raw_output}

    # Reconcile
    result = reconcile(agent_name, output)

    # Output result
    print(json.dumps(result, indent=2))

    # Log to file if configured
    log_dir = os.path.join(
        os.environ.get("CLAUDE_PLUGIN_ROOT", os.path.dirname(__file__) + "/../.."),
        "logs"
    )
    os.makedirs(log_dir, exist_ok=True)

    log_file = os.path.join(log_dir, f"subagent_{datetime.now().strftime('%Y%m%d')}.jsonl")
    with open(log_file, "a") as f:
        f.write(json.dumps(result) + "\n")

    # Exit with appropriate code
    if not result["validation"]["valid"]:
        sys.exit(1)
    sys.exit(0)


if __name__ == "__main__":
    main()

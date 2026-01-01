#!/bin/bash
# Log tool execution to LangSmith for observability
# PostToolUse hook - runs after Bash tool execution

set -e

# Configuration
LOG_DIR="${CLAUDE_PLUGIN_ROOT:-$(dirname "$0")/../..}/logs"
TIMESTAMP=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
LOG_FILE="$LOG_DIR/execution_$(date +%Y%m%d).jsonl"

# Ensure log directory exists
mkdir -p "$LOG_DIR"

# Read environment variables set by Claude Code
TOOL_NAME="${TOOL_NAME:-unknown}"
TOOL_ARGS="${TOOL_ARGS:-}"
TOOL_RESULT="${TOOL_RESULT:-}"
EXIT_CODE="${TOOL_EXIT_CODE:-0}"
EXECUTION_TIME="${TOOL_EXECUTION_TIME:-0}"

# Create log entry
log_entry() {
    local status="success"
    if [ "$EXIT_CODE" != "0" ]; then
        status="error"
    fi

    # Escape special characters for JSON
    local escaped_args=$(echo "$TOOL_ARGS" | sed 's/\\/\\\\/g' | sed 's/"/\\"/g' | tr '\n' ' ')
    local escaped_result=$(echo "$TOOL_RESULT" | head -c 1000 | sed 's/\\/\\\\/g' | sed 's/"/\\"/g' | tr '\n' ' ')

    cat << EOF
{"timestamp":"$TIMESTAMP","tool":"$TOOL_NAME","status":"$status","exit_code":$EXIT_CODE,"execution_time_ms":$EXECUTION_TIME,"args":"$escaped_args","result_preview":"$escaped_result"}
EOF
}

# Append to local log file
log_entry >> "$LOG_FILE"

# Send to LangSmith if configured
if [ -n "$LANGSMITH_API_KEY" ] && [ "$LANGCHAIN_TRACING_V2" = "true" ]; then
    # LangSmith logging via API
    LANGSMITH_ENDPOINT="${LANGSMITH_ENDPOINT:-https://api.smith.langchain.com}"
    PROJECT="${LANGCHAIN_PROJECT:-default}"

    # Create span data for LangSmith
    SPAN_DATA=$(cat << EOF
{
    "name": "tool_execution",
    "run_type": "tool",
    "inputs": {"tool": "$TOOL_NAME", "args": "$TOOL_ARGS"},
    "outputs": {"result": "$TOOL_RESULT", "exit_code": $EXIT_CODE},
    "extra": {
        "execution_time_ms": $EXECUTION_TIME,
        "source": "deepagents-builder-plugin"
    }
}
EOF
)

    # Non-blocking send to LangSmith (fire and forget)
    curl -s -X POST \
        -H "x-api-key: $LANGSMITH_API_KEY" \
        -H "Content-Type: application/json" \
        -d "$SPAN_DATA" \
        "$LANGSMITH_ENDPOINT/runs" \
        --max-time 2 \
        > /dev/null 2>&1 &
fi

# Output summary for Claude Code
echo "Logged: $TOOL_NAME (exit: $EXIT_CODE, time: ${EXECUTION_TIME}ms)"

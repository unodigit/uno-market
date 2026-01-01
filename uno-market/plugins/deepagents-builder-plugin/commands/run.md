---
description: Execute a DeepAgent with streaming output and tool visualization
---

# Run DeepAgent

Execute an existing DeepAgent with real-time streaming output.

## Usage

When the user wants to run an agent:

1. **Locate the agent file**: Look for Python files in the current directory containing `create_deep_agent` or agent configurations.

2. **Validate prerequisites** (run these checks):
   ```bash
   # Check deepagents is installed
   python3 -c "import deepagents" 2>/dev/null || uv pip install deepagents
   
   # Check API keys
   [[ -n "$ANTHROPIC_API_KEY" ]] && echo "✓ ANTHROPIC_API_KEY set" || echo "⚠ ANTHROPIC_API_KEY not set"
   ```
   - If deepagents not installed: `uv pip install deepagents` (or `pip install deepagents`)
   - Check for required API keys (ANTHROPIC_API_KEY, OPENAI_API_KEY, etc.)
   - Confirm any MCP servers are accessible

3. **Execute with streaming**:
```python
import asyncio
from agent_file import agent

async def run():
    async for chunk in agent.astream(
        {"messages": [{"role": "user", "content": "USER_INPUT"}]}
    ):
        # Stream token-by-token output
        if "messages" in chunk:
            chunk["messages"][-1].pretty_print()

asyncio.run(run())
```

4. **Display tool calls**: Show each tool invocation with:
   - Tool name
   - Arguments (formatted JSON)
   - Result (collapsible for large outputs)

5. **Handle interrupts**: If the agent has HITL configured, pause and prompt user for:
   - `approve` - Continue execution
   - `edit` - Modify tool arguments
   - `reject` - Cancel the tool call

6. **Post-execution**: Display summary including:
   - Total tokens used
   - Execution time
   - Tool call count
   - LangSmith trace link (if configured)

## Error Handling

- **Missing API keys**: Provide specific export commands:
  ```bash
  export ANTHROPIC_API_KEY=your_key_here
  ```
- **Import errors**: Install deepagents (includes all dependencies):
  ```bash
  uv pip install deepagents  # recommended
  # or: pip install deepagents
  ```
- **Tool failures**: Show error context and retry options

---
description: Execute a DeepAgent with streaming output and tool visualization
---

# Run DeepAgent

Execute an existing DeepAgent with real-time streaming output.

## Usage

When the user wants to run an agent:

1. **Locate the agent file**: Look for Python files in the current directory containing `create_deep_agent` or agent configurations.

2. **Validate prerequisites**:
   - Check for required API keys (ANTHROPIC_API_KEY, OPENAI_API_KEY, etc.)
   - Verify deepagents package is installed
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

- Missing API keys: Provide specific export commands
- Import errors: Suggest pip install commands
- Tool failures: Show error context and retry options

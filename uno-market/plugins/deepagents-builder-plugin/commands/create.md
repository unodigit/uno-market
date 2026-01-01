---
description: Create a new LangChain DeepAgent with interactive configuration wizard
---

# Create DeepAgent

You are helping the user create a new LangChain DeepAgent. Guide them through an interactive wizard to configure:

## Step 1: Agent Purpose
Ask the user to describe what their agent should do. Examples:
- Research assistant that searches the web and writes reports
- Code review agent that analyzes PRs and suggests improvements
- Data analysis agent that processes CSVs and creates visualizations

## Step 2: Model Selection
Offer model options (default: claude-sonnet-4-5-20250929):
- `anthropic:claude-sonnet-4-5-20250929` - Balanced performance (default)
- `anthropic:claude-opus-4-5-20251101` - Maximum capability
- `openai:gpt-4o` - Alternative provider
- Custom model string

## Step 3: Tool Configuration
Help define custom tools using the @tool decorator pattern:

```python
from langchain_core.tools import tool

@tool
def tool_name(param: str) -> str:
    """Tool description for the LLM."""
    return result
```

## Step 4: Subagent Configuration (Optional)
If the task is complex, suggest breaking it into subagents:

```python
research_subagent = {
    "name": "researcher",
    "description": "Searches and gathers information",
    "system_prompt": "You are an expert researcher...",
    "tools": [search_tool],
}
```

## Step 5: Middleware Selection
Configure built-in middleware:
- TodoListMiddleware (task planning) - recommended
- FilesystemMiddleware (file operations) - recommended
- SubAgentMiddleware (delegation) - if using subagents
- SummarizationMiddleware (context management) - for long tasks
- HumanInTheLoopMiddleware (approvals) - for sensitive operations

## Step 6: Generate Code
Use the code-generator agent to produce production-ready Python code following DeepAgents conventions.

## Output
Generate a complete Python file with:
1. Imports from deepagents and langchain
2. Tool definitions
3. Subagent configurations (if any)
4. Agent creation with create_deep_agent()
5. Example invocation code

Always validate the generated code using the langgraph-patterns skill.

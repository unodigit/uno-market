---
description: Create a new LangChain DeepAgent with interactive configuration wizard
---

# Create DeepAgent

You are helping the user create a new LangChain DeepAgent. Guide them through an interactive wizard to configure:

## Step 0: Environment Setup (REQUIRED)

Before creating an agent, ALWAYS verify the deepagents package is installed:

```bash
# Check if installed
python3 -c "import deepagents" 2>/dev/null && echo "✓ deepagents ready" || echo "✗ deepagents not installed"
```

If not installed, install it:
```bash
# Using uv (recommended - 10-100x faster)
uv pip install deepagents

# Or using pip
pip install deepagents
```

> **Note:** The `deepagents` package includes `langgraph` and `langchain` as transitive dependencies.

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

**ALWAYS generate these files:**

### 1. `pyproject.toml` (REQUIRED)
```toml
[project]
name = "my-agent"
version = "0.1.0"
requires-python = ">=3.11"
dependencies = [
    "deepagents>=0.3.1",
]

[project.scripts]
my-agent = "my_agent:main"
```

> **IMPORTANT:** Only list `deepagents` - do NOT add `langgraph`, `langchain-core`, or `langchain-anthropic` (they are transitive dependencies).

### 2. Python Agent File

**CRITICAL: ALWAYS use `create_deep_agent()` from the `deepagents` package.**

**NEVER use raw langgraph StateGraph** - use `create_deep_agent()` instead.

Generate a complete Python file with:
1. **REQUIRED import:** `from deepagents import create_deep_agent`
2. Tool definitions using `@tool` decorator
3. Subagent configurations (if any)
4. **REQUIRED:** Agent creation with `create_deep_agent()`
5. Example invocation code

Example structure:
```python
from deepagents import create_deep_agent
from langchain_core.tools import tool

@tool
def my_tool(query: str) -> str:
    """Tool description."""
    return f"Result: {query}"

agent = create_deep_agent(
    model="anthropic:claude-sonnet-4-5-20250929",
    tools=[my_tool],
    system_prompt="You are a helpful assistant."
)
```

### 3. Setup Instructions
```bash
# Install dependencies
uv sync

# Or install directly
uv pip install deepagents

# Run the agent
uv run python my_agent.py
```

**NEVER use `pip` or `requirements.txt`** - always use `uv` with `pyproject.toml`.

Always validate the generated code using the langgraph-patterns skill.

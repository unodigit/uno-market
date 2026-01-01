---
name: deepagents-middleware
description: Guide for using DeepAgents built-in middleware and creating custom middleware. Auto-activates when extending agent capabilities, configuring backends, or customizing agent behavior.
---

# DeepAgents Middleware Guide

Middleware extends DeepAgents with additional capabilities like planning, filesystem access, and context management.

## Built-in Middleware

### TodoListMiddleware
Task planning and progress tracking:
```python
# Provides tools: write_todos, read_todos
# Agent can create structured task lists
# Automatically tracks completion status
```

### FilesystemMiddleware
File operations with automatic context offloading:
```python
# Tools: ls, read_file, write_file, edit_file, glob, grep, execute*
# Large tool results automatically saved to filesystem
# Paths must start with /

# *execute only available with sandbox-capable backend
```

### SubAgentMiddleware
Delegate tasks to isolated agents:
```python
# Tool: task(description, subagent_type)
# Subagents have their own context window
# Results returned and reconciled with main agent
```

### SummarizationMiddleware
Automatic context compression:
```python
# Activates when context exceeds 170k tokens
# Summarizes older conversation history
# Preserves recent context
```

### HumanInTheLoopMiddleware
Pause for human approval:
```python
# Requires interrupt_on configuration
# Supports approve, edit, reject decisions
# Integrates with LangGraph interrupts
```

## Configuring Middleware

```python
from deepagents import create_deep_agent
from deepagents.middleware import TodoListMiddleware, CustomMiddleware

agent = create_deep_agent(
    middleware=[
        TodoListMiddleware(),
        CustomMiddleware(config={"setting": "value"})
    ]
)
```

## Creating Custom Middleware

```python
from langchain.agents.middleware import AgentMiddleware
from langchain_core.tools import tool

@tool
def my_custom_tool(param: str) -> str:
    """Custom tool description."""
    return f"Processed: {param}"

class MyMiddleware(AgentMiddleware):
    """Custom middleware that adds tools and modifies prompts."""
    
    # Tools to inject
    tools = [my_custom_tool]
    
    # System prompt additions
    system_prompt = """
    ## Custom Tool Usage
    Use my_custom_tool when you need to process data.
    """
    
    def on_agent_start(self, state):
        """Hook called when agent starts."""
        pass
    
    def on_tool_call(self, tool_name, args):
        """Hook called before tool execution."""
        pass
    
    def on_tool_result(self, tool_name, result):
        """Hook called after tool execution."""
        pass
```

## Backend Configuration

### StateBackend (Default)
Ephemeral files in agent state:
```python
from deepagents.backends import StateBackend
agent = create_deep_agent(backend=StateBackend())
```

### FilesystemBackend
Real disk operations:
```python
from deepagents.backends import FilesystemBackend
agent = create_deep_agent(
    backend=FilesystemBackend(root_dir="/safe/workspace")
)
```

### StoreBackend
Persistent storage across sessions:
```python
from deepagents.backends import StoreBackend
from langgraph.store.memory import InMemoryStore

store = InMemoryStore()  # Or Redis, PostgreSQL, etc.
agent = create_deep_agent(backend=StoreBackend(store=store))
```

### CompositeBackend
Route different paths to different backends:
```python
from deepagents.backends import CompositeBackend, StateBackend, StoreBackend

agent = create_deep_agent(
    backend=CompositeBackend(
        default=StateBackend(),  # Ephemeral by default
        routes={
            "/memories/": StoreBackend(store=persistent_store),  # Persist memories
            "/workspace/": FilesystemBackend(root_dir="./work")   # Real files
        }
    )
)
```

## Long-term Memory Pattern

Enable agents to remember across conversations:

```python
agent = create_deep_agent(
    system_prompt="""
    You have access to a persistent memory at /memories/.
    - Store important user preferences in /memories/preferences.json
    - Keep notes in /memories/notes/
    - These persist across all conversations
    """,
    backend=CompositeBackend(
        default=StateBackend(),
        routes={"/memories/": StoreBackend(store=redis_store)}
    )
)
```

## Context Offloading

Large tool results are automatically saved:
```python
# If a tool returns >10k tokens, FilesystemMiddleware:
# 1. Saves result to /tool_results/tool_name_timestamp.txt
# 2. Returns path reference instead of full content
# 3. Agent can read_file when needed
```

---
description: Search LangChain, LangGraph, and DeepAgents documentation
---

# Search DeepAgents Documentation

Quickly search and retrieve information from LangChain, LangGraph, and DeepAgents documentation.

## Usage

When the user asks for documentation help:

1. **Identify the Topic**
   Determine which documentation source is most relevant:
   - **DeepAgents**: Agent creation, middleware, backends
   - **LangGraph**: State graphs, nodes, edges, checkpointing
   - **LangChain Core**: Tools, messages, prompts, models
   - **LangSmith**: Tracing, evaluation, monitoring

2. **Search Strategy**
   Use the langchain-docs MCP server to search documentation:
   - Start with specific API/class names if mentioned
   - Fall back to concept searches for general questions
   - Cross-reference related topics

3. **Response Format**
   Provide documentation excerpts with:
   - Code examples (complete and runnable)
   - Links to full documentation
   - Related topics for further reading

## Common Documentation Topics

### DeepAgents

#### Creating an Agent
```python
from deepagents import create_deep_agent
from langchain_core.tools import tool

@tool
def my_tool(query: str) -> str:
    """Tool description."""
    return result

agent = create_deep_agent(
    model="anthropic:claude-sonnet-4-5-20250929",
    tools=[my_tool],
    system_prompt="You are a helpful assistant.",
)
```
**Docs**: https://github.com/langchain-ai/deepagents

#### Middleware Configuration
- `TodoListMiddleware` - Task planning
- `FilesystemMiddleware` - File operations
- `SubAgentMiddleware` - Delegation
- `SummarizationMiddleware` - Context management
- `HumanInTheLoopMiddleware` - Approval flows

#### Backend Options
- `StateBackend` - Ephemeral (default)
- `FilesystemBackend` - Persistent files
- `StoreBackend` - Database storage
- `CompositeBackend` - Route-based selection

### LangGraph

#### StateGraph Basics
```python
from langgraph.graph import StateGraph, START, END
from typing import TypedDict, Annotated

class State(TypedDict):
    messages: Annotated[list, add_messages]

graph = StateGraph(State)
graph.add_node("process", process_fn)
graph.add_edge(START, "process")
graph.add_edge("process", END)
app = graph.compile()
```
**Docs**: https://docs.langchain.com/oss/python/langgraph/overview

#### Conditional Edges
```python
def route(state: State) -> str:
    if condition:
        return "node_a"
    return "node_b"

graph.add_conditional_edges("router", route, {
    "node_a": "node_a",
    "node_b": "node_b"
})
```

#### Checkpointing
```python
from langgraph.checkpoint.memory import MemorySaver

memory = MemorySaver()
app = graph.compile(checkpointer=memory)

config = {"configurable": {"thread_id": "my-thread"}}
result = app.invoke(input, config)
```

#### Human-in-the-Loop
```python
app = graph.compile(
    interrupt_before=["sensitive_node"],
    checkpointer=memory
)
```

### LangChain Core

#### Tool Definition
```python
from langchain_core.tools import tool

@tool
def calculator(expression: str) -> float:
    """Evaluate a mathematical expression.

    Args:
        expression: A valid Python math expression

    Returns:
        The numerical result
    """
    return eval(expression)
```
**Docs**: https://docs.langchain.com/oss/python/langchain-core/tools

#### Message Types
```python
from langchain_core.messages import (
    HumanMessage,
    AIMessage,
    SystemMessage,
    ToolMessage
)

messages = [
    SystemMessage(content="You are helpful."),
    HumanMessage(content="Hello!"),
    AIMessage(content="Hi there!"),
]
```

#### Prompt Templates
```python
from langchain_core.prompts import ChatPromptTemplate

prompt = ChatPromptTemplate.from_messages([
    ("system", "You are a {role}."),
    ("human", "{input}")
])

formatted = prompt.invoke({"role": "assistant", "input": "Hello"})
```

### LangSmith

#### Enable Tracing
```bash
export LANGCHAIN_TRACING_V2=true
export LANGSMITH_API_KEY=your_key
export LANGCHAIN_PROJECT=my-project
```
**Docs**: https://docs.smith.langchain.com

#### View Traces
Access traces at: https://smith.langchain.com

#### Evaluations
```python
from langsmith import Client
from langsmith.evaluation import evaluate

client = Client()
results = evaluate(
    my_agent,
    data="my-dataset",
    evaluators=["correctness"]
)
```

## Quick Reference

| Topic | Command/Import |
|-------|----------------|
| Create agent | `from deepagents import create_deep_agent` |
| Define tool | `from langchain_core.tools import tool` |
| Build graph | `from langgraph.graph import StateGraph` |
| Add memory | `from langgraph.checkpoint.memory import MemorySaver` |
| Enable tracing | `export LANGCHAIN_TRACING_V2=true` |

## Documentation Links

- **DeepAgents**: https://github.com/langchain-ai/deepagents
- **LangGraph**: https://docs.langchain.com/oss/python/langgraph/overview
- **LangChain Core**: https://docs.langchain.com/oss/python/langchain-core
- **LangSmith**: https://docs.smith.langchain.com
- **API Reference**: https://api.python.langchain.com

## Search Tips

When searching documentation:
1. Use specific class/function names when possible
2. Include version numbers for compatibility issues
3. Search for error messages directly
4. Look for "cookbook" or "how-to" guides for practical examples

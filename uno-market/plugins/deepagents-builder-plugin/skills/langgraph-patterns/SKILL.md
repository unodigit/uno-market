---
name: langgraph-patterns
description: Best practices for LangGraph workflow design, state management, node configuration, and edge routing. Auto-activates when discussing workflow architecture, state schemas, or graph-based agent design.
---

# LangGraph Workflow Patterns

This skill provides comprehensive guidance on designing production-ready LangGraph workflows.

## State Design Principles

### Use TypedDict for Type Safety
```python
from typing import TypedDict, Annotated, List
from langgraph.graph import add_messages

class AgentState(TypedDict):
    messages: Annotated[List, add_messages]  # Conversation history
    current_step: str                         # Workflow progress
    results: dict                             # Accumulated outputs
```

### State Minimalism
- Only include data that needs to persist across nodes
- Large data should be written to filesystem backend
- Use reducers (like add_messages) for list operations

### Reducer Functions
```python
def append_results(existing: list, new: list) -> list:
    return existing + new

class State(TypedDict):
    results: Annotated[List[str], append_results]
```

## Common Workflow Patterns

### 1. Prompt Chaining
Sequential processing with output piping:
```python
graph.add_edge(START, "step_1")
graph.add_edge("step_1", "step_2")
graph.add_edge("step_2", "step_3")
graph.add_edge("step_3", END)
```

### 2. Parallelization
Fan-out for concurrent execution:
```python
graph.add_edge(START, "fanout")
graph.add_conditional_edges("fanout", lambda _: ["a", "b", "c"])
graph.add_edge("a", "aggregate")
graph.add_edge("b", "aggregate")
graph.add_edge("c", "aggregate")
```

### 3. Conditional Routing
Dynamic path selection:
```python
def route(state: AgentState) -> str:
    if state["needs_research"]:
        return "research"
    return "respond"

graph.add_conditional_edges("classify", route, {
    "research": "research_node",
    "respond": "response_node"
})
```

### 4. Iterative Refinement
Feedback loops with termination:
```python
def should_continue(state: AgentState) -> str:
    if state["iterations"] >= MAX_ITERATIONS:
        return "end"
    if state["quality_score"] >= THRESHOLD:
        return "end"
    return "refine"

graph.add_conditional_edges("evaluate", should_continue, {
    "refine": "generate",
    "end": END
})
```

## Node Implementation

### Pure Functions
```python
def process_node(state: AgentState) -> dict:
    """Process input and return state updates only."""
    # Read from state
    input_data = state["input"]
    
    # Process
    result = transform(input_data)
    
    # Return ONLY the fields to update
    return {"output": result, "processed": True}
```

### LLM Nodes
```python
def llm_node(state: AgentState) -> dict:
    messages = state["messages"]
    response = llm.invoke(messages)
    return {"messages": [response]}
```

### Tool Nodes
```python
def tool_node(state: AgentState) -> dict:
    tool_calls = state["messages"][-1].tool_calls
    results = []
    for call in tool_calls:
        result = tools[call["name"]].invoke(call["args"])
        results.append(ToolMessage(content=result, tool_call_id=call["id"]))
    return {"messages": results}
```

## Anti-Patterns to Avoid

### ❌ Storing Large Data in State
```python
# BAD
return {"full_document": large_text}  # Bloats state

# GOOD
backend.write_file("/docs/output.txt", large_text)
return {"document_path": "/docs/output.txt"}
```

### ❌ Unbounded Loops
```python
# BAD - No termination guarantee
graph.add_edge("process", "check")
graph.add_conditional_edges("check", lambda s: "process" if not s["done"] else END)

# GOOD - Explicit iteration limit
def check_with_limit(state):
    if state["iterations"] >= 10 or state["done"]:
        return "end"
    return "process"
```

### ❌ Missing Error Handling
```python
# BAD
result = api.call()

# GOOD
try:
    result = api.call()
except APIError as e:
    return {"error": str(e), "should_retry": True}
```

## Checkpointing

Enable persistence for fault tolerance:
```python
from langgraph.checkpoint.memory import MemorySaver

memory = MemorySaver()
app = graph.compile(checkpointer=memory)

# Resume from checkpoint
config = {"configurable": {"thread_id": "my-thread"}}
result = app.invoke(input, config)
```

## Human-in-the-Loop

Pause for human approval:
```python
from langgraph.prebuilt import ToolNode

tool_node = ToolNode(
    tools,
    handle_tool_errors=True
)

# Configure interrupts
app = graph.compile(
    interrupt_before=["sensitive_tool_node"]
)
```

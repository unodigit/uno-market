---
description: Design a LangGraph workflow with visual node/edge definition
---

# Design LangGraph Workflow

Help the user design a LangGraph StateGraph workflow.

## Workflow Patterns

Guide users through selecting the appropriate pattern:

### 1. Prompt Chaining
Sequential node execution with output piping:
```
START → generate_outline → write_draft → edit_draft → END
```

### 2. Parallelization
Fan-out to multiple nodes, fan-in to aggregate:
```
START → [research_a, research_b, research_c] → aggregate → END
```

### 3. Routing
Conditional edges based on state or LLM classification:
```
START → classify → (technical? → tech_agent) | (general? → general_agent) → END
```

### 4. Orchestrator-Worker
Supervisor node delegating to specialized workers:
```
START → supervisor → [worker_1, worker_2, worker_3] → supervisor → END
```

### 5. Evaluator-Optimizer
Iterative refinement with feedback loop:
```
START → generate → evaluate → (good? → END) | (needs_work? → generate)
```

## State Schema Design

Generate TypedDict state schemas:

```python
from typing import TypedDict, Annotated, List
from langgraph.graph import add_messages

class WorkflowState(TypedDict):
    messages: Annotated[List, add_messages]
    current_step: str
    results: dict
    # Add fields based on user requirements
```

## Node Definition

Create nodes as pure functions:

```python
def node_name(state: WorkflowState) -> dict:
    """Process state and return updates."""
    # Implementation
    return {"field": new_value}
```

## Edge Configuration

Set up transitions:

```python
from langgraph.graph import StateGraph, START, END

graph = StateGraph(WorkflowState)
graph.add_node("node_a", node_a_func)
graph.add_node("node_b", node_b_func)

graph.add_edge(START, "node_a")
graph.add_conditional_edges(
    "node_a",
    routing_function,
    {"path_1": "node_b", "path_2": END}
)
```

## Output

Generate complete, runnable LangGraph code with proper type annotations and error handling.

---
name: multi-agent-orchestration
description: Patterns for building multi-agent systems with supervisor agents, hierarchical control, and agent collaboration. Auto-activates when designing systems with multiple cooperating agents.
---

# Multi-Agent Orchestration Patterns

Build sophisticated multi-agent systems where specialized agents collaborate on complex tasks.

## Core Concepts

### Agent vs Subagent
- **Agent**: Main orchestrator with full tool access
- **Subagent**: Isolated worker with focused capabilities

### Context Isolation
Subagents have their own context window:
- Prevents main agent context pollution
- Allows deep exploration without bloating parent
- Results returned as summaries

## Orchestration Patterns

### 1. Supervisor Pattern
Central coordinator delegates to workers:

```python
from deepagents import create_deep_agent

# Define specialized workers
researcher = {
    "name": "researcher",
    "description": "Searches and gathers information from multiple sources",
    "system_prompt": "You are an expert researcher...",
    "tools": [web_search, arxiv_search]
}

writer = {
    "name": "writer", 
    "description": "Writes polished content based on research",
    "system_prompt": "You are an expert writer...",
    "tools": [write_file, edit_file]
}

reviewer = {
    "name": "reviewer",
    "description": "Reviews content for quality and accuracy",
    "system_prompt": "You are a critical reviewer...",
    "tools": [read_file]
}

# Supervisor coordinates all workers
supervisor = create_deep_agent(
    system_prompt="""
    You are a project supervisor. For complex tasks:
    1. Use 'researcher' subagent to gather information
    2. Use 'writer' subagent to create content
    3. Use 'reviewer' subagent to check quality
    4. Iterate if needed
    """,
    subagents=[researcher, writer, reviewer]
)
```

### 2. Hierarchical Pattern
Multi-level delegation:

```python
# Level 1: Project Manager
project_manager = create_deep_agent(
    subagents=[team_lead_frontend, team_lead_backend]
)

# Level 2: Team Leads
team_lead_frontend = {
    "name": "frontend-lead",
    "subagents": [ui_developer, css_specialist]
}

# Level 3: Individual Contributors
ui_developer = {
    "name": "ui-developer",
    "tools": [write_file, read_file]
}
```

### 3. Collaborative Pattern
Agents work on shared scratchpad:

```python
# All agents see intermediate work
class SharedState(TypedDict):
    scratchpad: str  # Shared working memory
    messages: Annotated[List, add_messages]

# Agent A adds to scratchpad
def agent_a(state):
    work = process(state["scratchpad"])
    return {"scratchpad": state["scratchpad"] + "\n" + work}

# Agent B builds on A's work
def agent_b(state):
    work = build_on(state["scratchpad"])
    return {"scratchpad": state["scratchpad"] + "\n" + work}
```

### 4. Debate Pattern
Agents argue positions, synthesizer decides:

```python
advocate = {
    "name": "advocate",
    "description": "Argues for a position with evidence",
    "system_prompt": "Present the strongest case FOR the proposal..."
}

critic = {
    "name": "critic", 
    "description": "Argues against a position with evidence",
    "system_prompt": "Present the strongest case AGAINST the proposal..."
}

judge = create_deep_agent(
    system_prompt="""
    You will receive arguments from both sides.
    Synthesize a balanced conclusion considering:
    - Strength of evidence
    - Logical validity
    - Potential risks and benefits
    """,
    subagents=[advocate, critic]
)
```

## Communication Patterns

### Message Passing
Agents communicate through structured messages:
```python
# Subagent returns structured output
return {
    "status": "complete",
    "findings": [...],
    "confidence": 0.85,
    "next_steps": [...]
}
```

### Shared Memory
Use persistent backend for cross-agent memory:
```python
backend = CompositeBackend(
    default=StateBackend(),
    routes={
        "/shared/": StoreBackend(store=shared_store)
    }
)
```

## Best Practices

### 1. Clear Responsibilities
Each agent should have a focused, well-defined role.

### 2. Minimal Handoffs
Reduce communication overhead by giving agents appropriate scope.

### 3. Graceful Degradation
Handle subagent failures without crashing the system.

### 4. Observability
Log inter-agent communication for debugging.

### 5. Human Checkpoints
Add approval gates for critical decisions:
```python
agent = create_deep_agent(
    interrupt_on={
        "task": {  # Pause before subagent delegation
            "allowed_decisions": ["approve", "edit", "reject"]
        }
    }
)
```

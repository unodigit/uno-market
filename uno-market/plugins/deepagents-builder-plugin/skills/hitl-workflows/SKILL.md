---
name: hitl-workflows
description: Implement human-in-the-loop approval flows and interrupt configurations for production safety. Auto-activates when discussing approval workflows, interrupt configurations, or human oversight mechanisms.
---

# Human-in-the-Loop Workflows

Ensure safe agent execution with human oversight for sensitive operations.

## When to Use HITL

- **Destructive Operations**: File deletion, database modifications
- **External Communications**: Sending emails, posting to APIs
- **Financial Transactions**: Payments, subscriptions
- **Sensitive Data Access**: PII, credentials, confidential files
- **Production Deployments**: Code releases, infrastructure changes

## Basic Configuration

```python
from deepagents import create_deep_agent
from langchain_core.tools import tool

@tool
def send_email(to: str, subject: str, body: str) -> str:
    """Send an email to specified recipient."""
    # Implementation
    return "Email sent"

@tool
def delete_file(path: str) -> str:
    """Delete a file from the filesystem."""
    # Implementation
    return "File deleted"

agent = create_deep_agent(
    tools=[send_email, delete_file],
    interrupt_on={
        "send_email": {
            "allowed_decisions": ["approve", "edit", "reject"]
        },
        "delete_file": {
            "allowed_decisions": ["approve", "reject"]
        }
    }
)
```

## Decision Types

### approve
Continue execution as planned:
```python
# User approves: Agent proceeds with original tool call
result = tool.invoke(original_args)
```

### edit
Modify tool arguments before execution:
```python
# User edits: Agent receives modified arguments
result = tool.invoke(edited_args)
```

### reject
Cancel the tool call:
```python
# User rejects: Agent receives rejection message
# Agent should gracefully handle and adapt
```

## Integration with LangGraph

```python
from langgraph.graph import StateGraph
from langgraph.checkpoint.memory import MemorySaver

# Enable checkpointing for interrupt resumption
memory = MemorySaver()
graph = graph_builder.compile(
    checkpointer=memory,
    interrupt_before=["sensitive_tool_node"]
)

# Run until interrupt
config = {"configurable": {"thread_id": "user-session-123"}}
for event in graph.stream(input, config):
    if event.get("interrupt"):
        # Present to user for decision
        decision = get_user_decision(event)
        
        # Resume with decision
        graph.invoke(decision, config)
```

## Approval UI Patterns

### Command Line
```python
def get_user_decision(interrupt_event):
    print(f"Tool: {interrupt_event['tool_name']}")
    print(f"Args: {interrupt_event['args']}")
    
    choice = input("[a]pprove / [e]dit / [r]eject: ")
    
    if choice == 'a':
        return {"decision": "approve"}
    elif choice == 'e':
        new_args = input("Enter new args (JSON): ")
        return {"decision": "edit", "args": json.loads(new_args)}
    else:
        return {"decision": "reject", "reason": input("Reason: ")}
```

### Web Interface
```python
# Use LangGraph Platform's built-in UI
# or build custom with WebSocket streaming
```

## Conditional Interrupts

Interrupt based on runtime conditions:

```python
from deepagents.middleware import HumanInTheLoopMiddleware

class ConditionalHITL(HumanInTheLoopMiddleware):
    def should_interrupt(self, tool_name, args, state):
        # Always interrupt for production
        if state.get("environment") == "production":
            return True
        
        # Interrupt for large operations
        if tool_name == "batch_delete" and len(args["items"]) > 10:
            return True
        
        # Interrupt for sensitive data
        if "password" in str(args).lower():
            return True
        
        return False
```

## Timeout Handling

```python
import asyncio

async def get_decision_with_timeout(interrupt_event, timeout=300):
    try:
        decision = await asyncio.wait_for(
            get_user_decision_async(interrupt_event),
            timeout=timeout
        )
        return decision
    except asyncio.TimeoutError:
        # Default to reject on timeout
        return {"decision": "reject", "reason": "Approval timeout"}
```

## Audit Trail

Log all HITL decisions:

```python
import logging

audit_logger = logging.getLogger("hitl_audit")

def log_decision(tool_name, args, decision, user_id):
    audit_logger.info({
        "timestamp": datetime.utcnow().isoformat(),
        "tool": tool_name,
        "args": args,
        "decision": decision,
        "user_id": user_id
    })
```

## Best Practices

1. **Clear Context**: Show users exactly what will happen
2. **Sensible Defaults**: Pre-fill common edits
3. **Undo Options**: Allow reversing approved actions when possible
4. **Batch Approvals**: Group similar operations
5. **Escalation Paths**: Route critical decisions to appropriate reviewers

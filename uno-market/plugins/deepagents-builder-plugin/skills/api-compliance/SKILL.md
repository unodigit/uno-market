---
name: api-compliance
description: Enforce official DeepAgents/LangChain API usage by requiring MCP documentation lookup before code generation. Auto-activates for any agent creation, code generation, or workflow design tasks.
---

# API Compliance Skill

This skill enforces correct API usage by requiring documentation lookup via MCP before generating any DeepAgents, LangGraph, or LangChain code.

## CRITICAL: MCP Documentation Lookup Required

Before writing ANY code that uses `deepagents`, `langgraph`, or `langchain` APIs, you MUST:

1. **Query the MCP langchain-docs server** to retrieve current API documentation
2. **Verify function signatures** match the official documentation
3. **Check for deprecation notices** before using any API

### MCP Lookup Protocol

Use the `langchain-docs` MCP server configured in `.mcp.json`:

```
MCP Server: langchain-docs
URL: https://docs.langchain.com/mcp
Tool: SearchDocsByLangChain
```

### Required Lookups by Context

| When You Need To... | MCP Query |
|---------------------|-----------|
| Create an agent | `"create_deep_agent function signature and parameters"` |
| Add tools | `"langchain_core.tools tool decorator usage"` |
| Configure middleware | `"deepagents middleware configuration"` |
| Set up subagents | `"deepagents subagent configuration"` |
| Add HITL | `"deepagents interrupt_on human in the loop"` |
| Use backends | `"deepagents FilesystemBackend StateBackend"` |
| Design workflows | `"langgraph StateGraph workflow patterns"` |

## Approved API Patterns

### Primary Import (ALWAYS USE)

```python
from deepagents import create_deep_agent
```

### Secondary Imports (Use as needed)

```python
from deepagents.backends import FilesystemBackend, StateBackend, CompositeBackend
from deepagents.middleware import TodoListMiddleware, SubAgentMiddleware
from langchain_core.tools import tool
```

### DEPRECATED/FORBIDDEN Patterns

The following patterns are FORBIDDEN. If you find yourself writing these, STOP and use the approved patterns:

```python
# ❌ FORBIDDEN - Raw StateGraph
from langgraph.graph import StateGraph, START, END
graph = StateGraph(...)  # DO NOT USE

# ❌ FORBIDDEN - Direct langgraph imports for agent creation
from langgraph.prebuilt import create_react_agent  # Use create_deep_agent instead

# ❌ FORBIDDEN - Old langchain agent patterns
from langchain.agents import initialize_agent  # DEPRECATED

# ❌ FORBIDDEN - Direct langchain-anthropic usage
from langchain_anthropic import ChatAnthropic  # Use model string in create_deep_agent
```

## Self-Correction Protocol

If validation detects non-compliant code:

1. **STOP** code generation immediately
2. **QUERY** MCP for the correct API: `SearchDocsByLangChain("correct way to [what you were trying to do]")`
3. **REVIEW** the returned documentation carefully
4. **REWRITE** the code using the correct API pattern
5. **VALIDATE** the corrected code against the pattern registry

## Validation Checkpoints

Before finalizing any generated code, verify:

- [ ] All imports use approved patterns
- [ ] `create_deep_agent()` is used (not raw StateGraph)
- [ ] Function signatures match MCP documentation
- [ ] No deprecated APIs are used
- [ ] `pyproject.toml` only lists `deepagents` as dependency

## Example: Correct Workflow

### Step 1: User requests an agent

```
User: Create a research agent with web search capability
```

### Step 2: Query MCP for API documentation

```
MCP Query: "create_deep_agent with tools research agent example"
```

### Step 3: Review returned documentation

```
Documentation shows:
- create_deep_agent(model, tools, system_prompt, ...)
- Tools should use @tool decorator
- Model format: "anthropic:claude-sonnet-4-5-20250929"
```

### Step 4: Generate compliant code

```python
from deepagents import create_deep_agent
from langchain_core.tools import tool

@tool
def web_search(query: str) -> str:
    """Search the web for information."""
    # Implementation
    pass

agent = create_deep_agent(
    model="anthropic:claude-sonnet-4-5-20250929",
    tools=[web_search],
    system_prompt="You are a research assistant..."
)
```

### Step 5: Validate against patterns

- ✅ Uses `create_deep_agent` from `deepagents`
- ✅ Uses `@tool` from `langchain_core.tools`
- ✅ Model string format is correct
- ✅ No forbidden patterns detected

## Integration with Hooks

This skill works in conjunction with:

- `hooks/scripts/api_compliance_check.py` - Pre-write validation
- `hooks/scripts/validate_agent.py` - Security and best practices
- `config/api_patterns.json` - Pattern registry

When the validation hook detects violations, it will:
1. Block the write operation
2. Report specific violations
3. Suggest correct patterns from MCP documentation


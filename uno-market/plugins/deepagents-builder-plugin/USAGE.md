# DeepAgents Builder Plugin - Usage Guide & Prompt Templates

Build production-ready agentic workflows with LangChain DeepAgents and LangGraph directly in Claude Code.

---

## Table of Contents

1. [Quick Start](#quick-start)
2. [Slash Commands](#slash-commands)
3. [Prompt Templates](#prompt-templates)
4. [Subagents](#subagents)
5. [Skills Reference](#skills-reference)
6. [Workflow Patterns](#workflow-patterns)
7. [Best Practices](#best-practices)

---

## Quick Start

### Installation

```bash
# Add the marketplace
/plugin marketplace add langchain-ai/claude-plugins

# Install the plugin
/plugin install langchain-deepagents@langchain-ai

# Restart Claude Code to activate
```

### First Agent in 2 Minutes

```
/deepagent:create

Prompt: "Create a research assistant agent that searches the web for
information and writes structured summaries to markdown files."
```

### Dependency Management

All generated agents use `pyproject.toml` with **only `deepagents`** as a dependency:

```toml
[project]
name = "my-agent"
version = "0.1.0"
requires-python = ">=3.11"
dependencies = [
    "deepagents>=0.3.1",
]
```

Install and run using `uv`:

```bash
uv sync           # Install dependencies
uv run python my_agent.py  # Run agent
```

> **Note:** Do NOT add `langgraph`, `langchain-core`, or `langchain-anthropic` to dependencies - they are automatically installed as transitive dependencies of `deepagents`.

---

## Slash Commands

| Command | Description | When to Use |
|---------|-------------|-------------|
| `/deepagent:create` | Interactive agent creation wizard | Starting a new agent project |
| `/deepagent:run` | Execute an agent with streaming output | Testing or running an agent |
| `/deepagent:graph` | Design LangGraph workflow visually | Complex multi-step workflows |
| `/deepagent:deploy` | Package and deploy for production | Production deployment |
| `/deepagent:test` | Run comprehensive test suites | Quality assurance |
| `/deepagent:docs` | Generate documentation | API docs and guides |

---

## Prompt Templates

### 1. Creating a New Agent

**Simple Agent (Single Purpose)**

```
/deepagent:create

I need an agent that:
- Purpose: [Describe what the agent should do]
- Input: [What data/prompts it receives]
- Output: [What it produces]
- Tools needed: [web search / file operations / API calls / etc.]

Example: "A code review agent that analyzes Python files for bugs,
security issues, and style violations, then outputs a detailed report."
```

**Complex Agent (Multi-Step)**

```
/deepagent:create

Build me a production agent with:

PURPOSE: [Main goal of the agent]

WORKFLOW STEPS:
1. [First step - e.g., gather information]
2. [Second step - e.g., process/analyze]
3. [Third step - e.g., generate output]
4. [Fourth step - e.g., validate/review]

TOOLS REQUIRED:
- [Tool 1]: [What it does]
- [Tool 2]: [What it does]

MIDDLEWARE:
- [x] TodoListMiddleware (task planning)
- [x] FilesystemMiddleware (file operations)
- [ ] HumanInTheLoopMiddleware (approvals)
- [ ] SummarizationMiddleware (context management)

OUTPUT FORMAT: [JSON / Markdown / File / API response]
```

**Agent with Subagents**

```
/deepagent:create

Create a supervisor agent with specialized workers:

SUPERVISOR: [Main coordinator role]

SUBAGENT 1 - [Name]:
- Role: [What this subagent handles]
- Tools: [Available tools]
- Output: [What it returns]

SUBAGENT 2 - [Name]:
- Role: [What this subagent handles]
- Tools: [Available tools]
- Output: [What it returns]

COORDINATION: [How supervisor delegates tasks]
```

---

### 2. Running an Agent

**Basic Execution**

```
/deepagent:run

Agent file: ./my_agent.py
Input: "Your task or prompt here"
```

**With Configuration**

```
/deepagent:run

Agent: ./agents/research_agent.py
Input: "Research the latest developments in quantum computing"
Config:
  - thread_id: "research-session-001"
  - max_iterations: 10
  - temperature: 0.7
```

**With Human-in-the-Loop**

```
/deepagent:run

Agent: ./agents/deployment_agent.py
Input: "Deploy the staging build to production"
HITL: enabled
Approval tools: [deploy_to_prod, delete_resources]
```

---

### 3. Designing a Workflow Graph

**Sequential Pipeline**

```
/deepagent:graph

Design a sequential workflow:

NODES:
1. input_processor → Parse and validate input
2. data_fetcher → Retrieve necessary data
3. analyzer → Process and analyze data
4. formatter → Format output
5. validator → Validate results

FLOW: input_processor → data_fetcher → analyzer → formatter → validator → END

STATE SCHEMA:
- messages: conversation history
- raw_data: fetched data
- analysis_results: processed output
- final_output: formatted result
```

**Parallel Processing**

```
/deepagent:graph

Design a parallel workflow:

NODES:
- splitter: Divide input into chunks
- processor_a: Handle chunk type A
- processor_b: Handle chunk type B
- processor_c: Handle chunk type C
- aggregator: Combine all results

FLOW:
START → splitter → [processor_a, processor_b, processor_c] → aggregator → END

PARALLELIZATION: Fan-out at splitter, fan-in at aggregator
```

**Conditional Routing**

```
/deepagent:graph

Design a routing workflow:

NODES:
- classifier: Determine input type
- technical_handler: For technical queries
- general_handler: For general queries
- escalation_handler: For complex issues

ROUTING LOGIC:
- If classified as "technical" → technical_handler
- If classified as "general" → general_handler
- If confidence < 0.7 → escalation_handler

FLOW:
START → classifier → (conditional) → [handler] → END
```

**Iterative Refinement**

```
/deepagent:graph

Design an iterative improvement workflow:

NODES:
- generator: Create initial output
- evaluator: Score the output quality
- refiner: Improve based on feedback

LOOP CONFIG:
- Max iterations: 5
- Quality threshold: 0.85
- Exit condition: quality >= threshold OR iterations >= max

FLOW:
START → generator → evaluator → (quality check) → refiner → evaluator
                                    ↓ (quality OK)
                                   END
```

---

### 4. Deployment

**Local Package**

```
/deepagent:deploy

Agent: ./my_agent.py
Target: local-package

Config:
- Package name: my-research-agent
- Version: 1.0.0
- Entry point: main:run

Output: pyproject.toml, setup files, README
```

**Docker Container**

```
/deepagent:deploy

Agent: ./my_agent.py
Target: docker

Config:
- Base image: python:3.11-slim
- Expose port: 8000
- Health check: /health
- Environment: production

Output: Dockerfile, docker-compose.yml, .env.template
```

**API Server**

```
/deepagent:deploy

Agent: ./my_agent.py
Target: api-server

Config:
- Framework: FastAPI
- Endpoints: /invoke, /stream, /health
- Auth: API key
- Rate limiting: 100 req/min

Output: server.py, requirements.txt, deployment guide
```

**LangGraph Platform**

```
/deepagent:deploy

Agent: ./my_agent.py
Target: langgraph-cloud

Config:
- Project: my-agent-prod
- Environment: production
- Scaling: auto
- Monitoring: LangSmith

Output: langgraph.json, deployment commands
```

---

### 5. Testing

**Unit Tests**

```
/deepagent:test

Agent: ./my_agent.py
Test type: unit

Coverage targets:
- Tools: All custom tools
- Nodes: All workflow nodes
- State: State transitions

Output: tests/test_unit.py
```

**Integration Tests**

```
/deepagent:test

Agent: ./my_agent.py
Test type: integration

Scenarios:
1. Basic query handling
2. Tool invocation flow
3. Error recovery
4. Multi-turn conversation

Output: tests/test_integration.py
```

**Full Test Suite**

```
/deepagent:test

Agent: ./my_agent.py
Test type: full

Include:
- [x] Unit tests
- [x] Integration tests
- [x] Streaming tests
- [x] HITL interrupt tests
- [x] Performance benchmarks
- [ ] LangSmith evaluations

Output: Complete test directory with CI/CD config
```

---

## Subagents

The plugin provides specialized subagents for different tasks:

### workflow-planner

**Use for**: Designing optimal LangGraph architectures

```
@workflow-planner

I need to build a workflow that:
- [Describe the high-level goal]
- [List the main steps]
- [Specify any parallel operations]
- [Note human approval requirements]

Please design the state schema and graph structure.
```

### code-generator

**Use for**: Generating production-ready Python code

```
@code-generator

Generate a DeepAgent implementation with:
- Purpose: [Agent goal]
- Tools: [List of tools needed]
- Model: claude-sonnet-4-5-20250929
- Middleware: [Required middleware]

Include type annotations and error handling.
```

### validator

**Use for**: Checking code quality and security

```
@validator

Validate this agent code:
- Security review
- Type annotation completeness
- Error handling coverage
- LangGraph best practices
```

### tool-integrator

**Use for**: Adding and configuring tools

```
@tool-integrator

Add these capabilities to my agent:
- Web search (using Tavily API)
- File operations (read/write/delete)
- Code execution (sandboxed Python)
```

### debug-assistant

**Use for**: Troubleshooting agent issues

```
@debug-assistant

My agent is failing with this error:
[Paste error message]

Context:
- Agent file: ./my_agent.py
- Input that caused error: [input]
- Expected behavior: [what should happen]
```

---

## Skills Reference

### langgraph-patterns

Auto-activates when discussing workflow architecture. Provides:
- State design principles
- Common workflow patterns (chaining, parallel, routing, iteration)
- Node implementation best practices
- Anti-patterns to avoid

### deepagents-middleware

Auto-activates when configuring middleware. Covers:
- TodoListMiddleware for task planning
- FilesystemMiddleware for file operations
- SubAgentMiddleware for delegation
- SummarizationMiddleware for context management

### multi-agent-orchestration

Auto-activates for multi-agent systems. Includes:
- Supervisor pattern
- Hierarchical delegation
- Collaborative patterns
- Debate/synthesis pattern

### hitl-workflows

Auto-activates for human oversight. Covers:
- Interrupt configuration
- Decision types (approve/edit/reject)
- Conditional interrupts
- Audit logging

---

## Workflow Patterns

### Pattern 1: Prompt Chaining

```
Use case: Sequential document processing

START → extract_text → analyze_content → generate_summary → format_output → END
```

### Pattern 2: Parallelization

```
Use case: Multi-source research

START → query_parser → [search_web, search_arxiv, search_github] → aggregate → synthesize → END
```

### Pattern 3: Routing

```
Use case: Customer support triage

START → classify_intent →
    "billing" → billing_agent →
    "technical" → tech_agent →
    "general" → general_agent →
END
```

### Pattern 4: Orchestrator-Worker

```
Use case: Complex project execution

START → supervisor →
    delegate(researcher) → supervisor →
    delegate(writer) → supervisor →
    delegate(reviewer) → supervisor →
END
```

### Pattern 5: Evaluator-Optimizer

```
Use case: Content generation with quality control

START → generate → evaluate →
    score >= 0.8 → END
    score < 0.8 → refine → evaluate → ...
```

---

## Best Practices

### Agent Design

1. **Single Responsibility**: Each agent/subagent should have one clear purpose
2. **Minimal State**: Only store data needed across nodes
3. **Error Handling**: Always handle tool failures gracefully
4. **Logging**: Enable LangSmith tracing for debugging

### Tool Configuration

1. **Complete Docstrings**: LLM uses docstrings to understand tools
2. **Type Annotations**: Use proper typing for all parameters
3. **Validation**: Validate inputs before processing
4. **Sensible Defaults**: Provide defaults for optional parameters

### HITL Configuration

1. **Sensitive Operations**: Always require approval for:
   - External communications
   - File deletions
   - Production deployments
   - Financial operations

2. **Clear Context**: Show users exactly what will happen

3. **Timeout Handling**: Default to reject on timeout

### Testing

1. **Test Early**: Write tests alongside agent code
2. **Mock External APIs**: Don't rely on real API calls in tests
3. **Edge Cases**: Test error handling and edge cases
4. **Performance**: Benchmark latency and memory usage

---

## Example: Complete Agent Creation Session

```
User: /deepagent:create

Claude: I'll help you create a new DeepAgent. Let's go through the configuration:

**Step 1: What should your agent do?**

User: I need a research agent that can search the web, read academic papers,
      and write comprehensive research reports in markdown format.

Claude: Great! A research assistant with web search, paper analysis, and
        report writing capabilities.

**Step 2: Which model would you like to use?**
- anthropic:claude-sonnet-4-5-20250929 (Recommended - balanced)
- anthropic:claude-opus-4-5-20251101 (Maximum capability)
- Custom

User: Use Sonnet for efficiency

Claude: **Step 3: Let's define the tools needed:**

I'll create these tools:
1. `web_search` - Search the web using Tavily
2. `fetch_paper` - Retrieve academic papers from arXiv
3. `write_report` - Write markdown reports to filesystem

**Step 4: Would you like to use subagents?**

User: Yes, separate the research and writing tasks

Claude: I'll create:
- `researcher` subagent - Handles search and paper analysis
- `writer` subagent - Handles report composition and formatting

**Step 5: Configure middleware:**
- [x] TodoListMiddleware (task planning)
- [x] FilesystemMiddleware (file operations)
- [x] SummarizationMiddleware (for long research sessions)

**Step 6: Generating code...**

[Claude generates complete Python file with all configurations]

Your agent is ready at `./research_agent.py`

To run it:
/deepagent:run ./research_agent.py "Research the impact of LLMs on software development"
```

---

## Troubleshooting

### Common Issues

**"API key not found"**
```bash
export ANTHROPIC_API_KEY=your_key_here
export LANGSMITH_API_KEY=your_key_here  # Optional, for tracing
```

**"Module not found: deepagents"**
```bash
# Using uv (recommended - 10-100x faster)
uv pip install deepagents

# Or using pip
pip install deepagents
```

> **Note:** The `deepagents` package includes `langgraph` and `langchain` as transitive dependencies. You don't need to install them separately.

**"Graph compilation failed"**
- Check that all nodes have edges to END
- Verify state schema matches node return types
- Ensure conditional edges cover all cases

**"HITL interrupt not triggering"**
- Verify checkpointer is configured
- Check interrupt_before/interrupt_on settings
- Ensure tool names match exactly

---

## Resources

- [LangChain DeepAgents Documentation](https://github.com/langchain-ai/deepagents)
- [LangGraph Documentation](https://docs.langchain.com/oss/python/langgraph/overview)
- [LangSmith Observability](https://smith.langchain.com/)
- [Claude Code Plugins Guide](https://code.claude.com/docs/en/plugins)

---

*Generated for DeepAgents Builder Plugin v1.0.3*

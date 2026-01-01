# DeepAgents Builder Prompt Template

Copy and paste this template to build any agentic workflow using the DeepAgents Builder Plugin:

```
I want to build a [AGENT_TYPE] agent using the DeepAgents Builder Plugin. Here are the requirements:

## Agent Overview
- **Name**: [AGENT_NAME]
- **Purpose**: [BRIEF_DESCRIPTION]
- **Use Case**: [PRIMARY_USE_CASE]

## Workflow Steps
1. [STEP_1]
2. [STEP_2]
3. [STEP_3]
- [Additional steps...]

## Technical Requirements
- **Model**: [claude-sonnet-4-5|claude-opus-4-5|gpt-4o]
- **Workflow Pattern**: [sequential|parallel|routing|iterative|supervisor]
- **Human Approval**: [none|sensitive-only|all-actions]
- **Persistence**: [memory|sqlite|postgres]
- **Deployment**: [local|docker|api-server|langgraph-cloud]

## Tools Needed
1. [TOOL_NAME] - [DESCRIPTION]
2. [TOOL_NAME] - [DESCRIPTION]
3. [TOOL_NAME] - [DESCRIPTION]

## Subagents (Optional)
1. [SUBAGENT_NAME] - [ROLE]
2. [SUBAGENT_NAME] - [ROLE]

## Middleware
- [ ] TodoListMiddleware (task planning)
- [ ] FilesystemMiddleware (file operations)
- [ ] SubAgentMiddleware (delegation)
- [ ] SummarizationMiddleware (context management)
- [ ] HumanInTheLoopMiddleware (approvals)

Please use the DeepAgents Builder Plugin to:
1. Design the workflow graph architecture
2. Generate production-ready Python code
3. Configure tools and middleware
4. Set up testing and validation
5. Prepare deployment artifacts

Start by creating the agent with /deepagent:create
```

## Example: Research Assistant Agent

```
I want to build a research assistant agent using the DeepAgents Builder Plugin. Here are the requirements:

## Agent Overview
- **Name**: ResearchBot
- **Purpose**: Search the web for information and write comprehensive research reports
- **Use Case**: Automated research and report generation for technical topics

## Workflow Steps
1. Parse and understand the research query
2. Search multiple sources (web, academic papers)
3. Analyze and synthesize findings
4. Generate structured markdown report
5. Review and validate accuracy

## Technical Requirements
- **Model**: claude-sonnet-4-5
- **Workflow Pattern**: supervisor (with specialized subagents)
- **Human Approval**: sensitive-only (before publishing)
- **Persistence**: memory
- **Deployment**: local

## Tools Needed
1. web_search - Search the web using Tavily API
2. fetch_paper - Retrieve academic papers from arXiv
3. write_file - Write markdown reports to filesystem
4. read_file - Read existing research files

## Subagents
1. researcher - Handles search queries and data gathering
2. writer - Composes structured reports from findings
3. reviewer - Validates accuracy and completeness

## Middleware
- [x] TodoListMiddleware (task planning)
- [x] FilesystemMiddleware (file operations)
- [x] SubAgentMiddleware (delegation)
- [x] SummarizationMiddleware (context management)
- [ ] HumanInTheLoopMiddleware (approvals)

Please use the DeepAgents Builder Plugin to:
1. Design the workflow graph architecture
2. Generate production-ready Python code
3. Configure tools and middleware
4. Set up testing and validation
5. Prepare deployment artifacts

Start by creating the agent with /deepagent:create
```

## Expected Plugin Commands

The plugin will guide you through these commands:

```bash
# Create the agent interactively
/deepagent:create

# Design the workflow graph
/deepagent:graph

# Run and test the agent
/deepagent:run ./research_agent.py "Research quantum computing advances in 2024"

# Run comprehensive tests
/deepagent:test ./research_agent.py --type full

# Deploy for production
/deepagent:deploy ./research_agent.py --target docker

# Generate documentation
/deepagent:docs ./research_agent.py
```

## Results

- **Automated Code Generation**: Production-ready Python with type annotations
- **Multi-Agent Orchestration**: Supervisor pattern with specialized workers
- **Built-in Quality Checks**: Validation, security review, and testing
- **Flexible Deployment**: Local, Docker, API server, or LangGraph Cloud
- **Full Observability**: LangSmith tracing and debugging support

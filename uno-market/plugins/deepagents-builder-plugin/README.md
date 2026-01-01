# LangChain DeepAgents Plugin for Claude Code

Build production-ready agentic workflows with LangChain DeepAgents directly in Claude Code.

## Quick Start

```bash
# Add the marketplace
/plugin marketplace add langchain-ai/claude-plugins

# Install the plugin
/plugin install langchain-deepagents@langchain-ai

# Restart Claude Code, then try:
/deepagent:create
```

## Features

- **Slash Commands**: `/deepagent:create`, `/deepagent:run`, `/deepagent:graph`, `/deepagent:deploy`, `/deepagent:test`, `/deepagent:docs`
- **Subagents**: workflow-planner, code-generator, validator, tool-integrator, debug-assistant
- **Skills**: langgraph-patterns, deepagents-middleware, multi-agent-orchestration, hitl-workflows
- **Hooks**: PreToolUse validation, PostToolUse logging, SessionStart initialization
- **MCP**: LangChain docs, LangSmith observability, Tool discovery

## Documentation

- [Claude Code Plugins](https://code.claude.com/docs/en/plugins)
- [LangChain DeepAgents](https://github.com/langchain-ai/deepagents)
- [LangGraph](https://docs.langchain.com/oss/python/langgraph/overview)

## License

MIT

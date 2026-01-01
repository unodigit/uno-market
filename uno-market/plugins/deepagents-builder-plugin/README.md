# LangChain DeepAgents Plugin for Claude Code

[![Version](https://img.shields.io/badge/version-1.0.3-blue.svg)](./CHANGELOG.md)

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

## Requirements

The plugin will automatically install the `deepagents` package on first use:

```bash
# Using uv (recommended - 10-100x faster)
uv pip install deepagents

# Or using pip
pip install deepagents
```

> **Note:** The `deepagents` package includes `langgraph` and `langchain` as transitive dependencies.

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

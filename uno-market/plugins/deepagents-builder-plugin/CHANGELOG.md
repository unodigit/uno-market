# Changelog

All notable changes to the DeepAgents Builder Plugin will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.3] - 2026-01-01

### Fixed

- **Enforced create_deep_agent() usage**: Rewrote `code-generator.md` to explicitly mandate `create_deep_agent()` from deepagents package
- **Removed conflicting examples**: Removed raw langgraph StateGraph examples that caused the model to skip deepagents

### Changed

- `agents/code-generator.md`: Complete rewrite with explicit "DO THIS / NEVER DO THIS" rules
- `agents/workflow-planner.md`: Added warning to never use raw StateGraph
- `commands/create.md`: Added explicit `create_deep_agent()` requirement with example

### Added

- Clear anti-pattern examples showing what NOT to do (raw StateGraph usage)
- Complete code template showing required deepagents structure
- Parameter reference table for `create_deep_agent()`

---

## [1.0.2] - 2026-01-01

### Fixed

- **Enforced uv with pyproject.toml**: All generated code now uses `pyproject.toml` with only `deepagents` dependency
- **Removed redundant dependencies**: Generated code no longer lists `langgraph`, `langchain-core`, or `langchain-anthropic` (they are transitive)
- **Docker deployment**: Updated Dockerfile templates to use `uv` instead of `pip`
- **CI/CD templates**: Updated GitHub Actions workflow to use `astral-sh/setup-uv` action

### Changed

- `agents/code-generator.md`: Added strict rules to always generate `pyproject.toml` and never use `requirements.txt`
- `agents/workflow-planner.md`: Added dependency management section
- `agents/validator.md`: Added dependency management checklist
- `commands/create.md`: Now generates `pyproject.toml` as required output
- `commands/deploy.md`: Updated all deployment examples to use `uv`
- `commands/test.md`: Updated CI/CD template to use `uv`
- `USAGE.md`: Added dependency management quick start section

---

## [1.0.1] - 2026-01-01

### Fixed

- **Package installation**: Added explicit `deepagents` package installation instructions to all agent and command files
- **uv support**: Updated all scripts to detect and prefer `uv` package manager over `pip` (10-100x faster)
- **Simplified dependencies**: Only `deepagents` needs to be installed; `langgraph` and `langchain` are transitive dependencies

### Added

- `hooks/scripts/setup_environment.sh`: New environment setup script with uv support
- `pyproject.toml`: Modern Python dependency management file
- Environment setup verification in `code-generator.md` agent
- "Step 0: Environment Setup" in `/deepagent:create` command
- Package installation checks in `/deepagent:run` command

### Changed

- `hooks/scripts/init_langchain.sh`: Simplified to only check for `deepagents` package
- `hooks/hooks.json`: Added `setup_environment.sh` to SessionStart hook
- `USAGE.md`: Updated troubleshooting section to recommend `uv pip install deepagents`

## [1.0.0] - 2025-12-01

### Added

- Initial release of DeepAgents Builder Plugin
- Slash commands: `/deepagent:create`, `/deepagent:run`, `/deepagent:graph`, `/deepagent:deploy`, `/deepagent:test`, `/deepagent:docs`
- Subagents: workflow-planner, code-generator, validator, tool-integrator, debug-assistant
- Skills: langgraph-patterns, deepagents-middleware, multi-agent-orchestration, hitl-workflows
- Hooks: PreToolUse validation, PostToolUse logging, SessionStart initialization
- MCP integration: LangChain docs, LangSmith observability, Tool discovery


This Product Requirements Document (PRD) outlines the specifications for developing the **FrontEnd UI/UX Build Plugin**, which will be the foundational offering in a larger multi-plugin marketplace designed for rapid, quality-controlled frontend development leveraging the **Anthropic Claude Code** ecosystem.

---

## Product Requirements Document: UI/UX Build Agent Plugin

### I. Introduction and Goals

#### 1.1 Project Overview
This project delivers an Agent Plugin and corresponding Marketplace built on **Claude Code**. The initial plugin, **UI/UX Build Agent**, will enforce strict technical standards (Tailwind, React/TS, Vite/ESBuild) and implement advanced agent orchestration for cost efficiency and automated quality assurance.

#### 1.2 Key Goals
1.  **Enforce Standardization:** Embed specific technology constraints (e.g., Tailwind, React/TS) and behavior rules through the structural mechanisms of the Claude Code plugin system.
2.  **Optimize Cost and Performance:** Implement a multi-model strategy, leveraging **Sonnet 4.5** for high-level reasoning and planning, and a separate, cost-effective model (GLM 4.6) for execution tasks, alongside prompt caching strategies.
3.  **Enable Concurrent Development:** Utilize sub-agent capabilities to run development tasks (e.g., testing, styling, linting) in parallel for maximum throughput.
4.  **Simplify Workflow:** Provide a coherent set of **Slash Commands**, **Agents**, and **Hooks** to automate quality routines (lint fix, type fix).

### II. Cost Strategy and Model Configuration

The proposed architecture will leverage the distinct strengths and pricing structures of two large language models to maximize efficiency, a strategy supported by the concept of a dual-AI approach for different phases of development.

| Phase | Model | Rationale (Based on Source Strengths) | Tooling/Configuration |
| :--- | :--- | :--- | :--- |
| **Planning & Architecture** | **Claude Sonnet 4.5** | Superior structured reasoning, strong coding capabilities, and excellence in designing complex plugin architectures and maintaining consistency across large codebases. Sonnet 4.5 emphasizes long-context reasoning for reliable computer use. | Primary model, potentially set as the default model override in Claude Code settings. |
| **Task Execution & Coding** | **GLM 4.6 (Execution Model)** | Used for rapid, high-volume code generation, implementation, and handling repetitive tasks, prioritizing speed and cost-efficiency. | Configured within specialized sub-agents via the `model` field in the agent definition, or via an environment variable like `ANTHROPIC_MODEL` or `CLAUDE_CODE_SUBAGENT_MODEL` if the model is integrated. |
| **Cost Optimization** | **Overall Strategy** | Utilize prompt caching (where supported) to save up to 90% on repeated queries and leverage the cheaper execution model for high-volume tasks. | Ensure `DISABLE_PROMPT_CACHING_SONNET` is not enabled, and exploit batch processing features where applicable.

### III. Plugin Features and Technical Components (UI/UX Build Plugin)

The UI/UX Build Plugin will be packaged as a **Claude Code Plugin** consisting of Subagents, Hooks, Slash Commands, and MCP servers.

#### 3.1 Subagents and Parallel Collaboration
We will create several specialized **Subagents** that can be orchestrated to perform parallel tasks using the `Task` tool. The goal is to design agents with clear roles and boundaries.

| Subagent Name | Role / Expertise | Parallel Task |
| :--- | :--- | :--- |
| **UI-Architect** | Expert in React/TS architecture, Monorepo structure (pnpm/Turbo), and major planning. | Generates component scaffolding and defines interfaces. |
| **Tailwind-Stylist** | Specialist in Tailwind utility classes and responsive design principles. | Implements styling based on design requirements. |
| **Biome-Linter** | Focuses solely on identifying and automatically fixing linting errors (enforcing rules). | Runs linting fixes in parallel with code generation. |
| **Vitest-Tester** | Expert in generating, running, and debugging Vitest unit and E2E tests. | Generates or executes tests for newly created components. |
| **Monorepo-Orchestrator** | Coordinates tasks across the pnpm/Turbo monorepo, ensuring correct task runner execution. | Manages task runners (Turbo) and monitors parallel sub-agent execution. |

**Requirement (R-3.1.1):** The core Orchestrator Agent (Sonnet 4.5) must be designed to decompose complex requests into granular tasks and coordinate the parallel execution of multiple specialized Subagents (running GLM 4.6 where cost-effective) using the `Task` tool for efficient workflow execution.

#### 3.2 Automated Quality Routines via Hooks and Agent Skills

To enforce quality (lint fix, type fix) and behavioral rules, we will implement **Hooks** and use specialized **Agent Skills**.

| Feature | Implementation | Purpose & Enforcement |
| :--- | :--- | :--- |
| **Lint Fix Hook** | A `PostToolUse` Hook configured to execute a Bash command (`npm run lint:fix` or `biome check --apply`) after any file `Write` or `Edit` operation by Claude. | **Enforces Coding Standards:** Automatically runs **Biome** fixes after the agent writes code, ensuring immediate adherence to defined style/lint rules. |
| **Type Check/Fix Skill** | Implement an **Agent Skill** or specialized Agent that leverages the experimental **LSP (Language Server Protocol) tool** capability in Claude Code. | **Enforces Structural Rules:** Allows Claude to semantically navigate code, check TypeScript inferred types, and rapidly catch/resolve type errors without needing a full build process. |

**Requirement (R-3.2.1):** The plugin must contain a `hooks/hooks.json` configuration to automatically trigger linting and formatting scripts after code modification, using the `${CLAUDE_PLUGIN_ROOT}` environment variable to ensure path portability.
**Requirement (R-3.2.2):** Develop a custom Agent Skill focused on **structural enforcement** by utilizing LSP features like `goToDefinition` or automatic diagnostics to validate code structure and types efficiently.

#### 3.3 Tool Integrations (MCP Servers)

The plugin will integrate key developer tools using the **Model Context Protocol (MCP)**.

| Tool | Implementation | Purpose |
| :--- | :--- | :--- |
| **Design System/Component Library** | Custom MCP Server definition in `.mcp.json`. | Connect Claude to internal data (e.g., Tailwind configuration, component templates, brand guidelines) to ensure consistent styling and component usage. |
| **Task Runner (Turbo)** | Integration via a specialized MCP Server or Bash tools. | Allows agents to execute monorepo tasks (e.g., `turbo run build`, `pnpm install`) and monitor build outputs. |

**Requirement (R-3.3.1):** The plugin structure must include a `.mcp.json` file to define custom MCP Servers for accessing Design System data, ensuring the planning agent can use this context for architectural decisions.

#### 3.4 Slash Commands

The plugin will provide custom **Slash Commands** for quick execution of standard workflows.

*   `/scaffold-component <name> <type>`: Generates a new React/TS component with boilerplate, utilizing Tailwind styling principles.
*   `/run-tests <component>`: Triggers the **Vitest-Tester** sub-agent to run tests for a specified component.
*   `/lint-fix-all`: Explicitly runs the global linting and formatting routine across the project.
*   `/deploy-preview`: Triggers a staging deployment routine using the Monorepo-Orchestrator.

### IV. Marketplace and Distribution Requirements

#### 4.1 Marketplace Structure
The solution requires a **Marketplace** that bundles the UI/UX Build Plugin (and eventually others). This marketplace will be hosted on a Git repository (e.g., GitHub).

**Requirement (R-4.1.1):** The Marketplace root must contain a `.claude-plugin/marketplace.json` file defining the owner and the plugins available.
**Requirement (R-4.1.2):** The UI/UX Build Plugin itself must contain a plugin manifest (`.claude-plugin/plugin.json`) defining its name (`ui-ux-build-plugin`), version, and metadata.

#### 4.2 Installation and Management
The plugin must be easily installable via the Claude Code CLI command: `/plugin marketplace add [repository URL]` followed by `/plugin install ui-ux-build-plugin@[marketplace-name]`.

#### 4.3 Directory Structure
The UI/UX Build Plugin folder structure must conform to the Claude Code standard plugin layout:

```
ui-ux-build-plugin/
├── .claude-plugin/              # Required: Contains plugin.json manifest
├── commands/                    # Custom Slash Commands
├── agents/                      # Specialized Subagents (e.g., UI-Architect.md)
├── hooks/                       # Hook configurations (hooks.json for lint/type fix)
├── skills/                      # Agent Skills (e.g., Type-Enforcer/SKILL.md)
├── .mcp.json                    # MCP Server definitions (e.g., Design System API)
└── scripts/                     # Shell scripts and utilities for hooks (e.g., format-code.sh)
```

### V. Success Criteria

| Metric Category | Metric | Goal |
| :--- | :--- | :--- |
| **Quality/Standardization** | **Lint/Type Error Rate** | Must achieve near-zero linting and type errors in code generated by the agent, enforced by automated Hooks/Skills. |
| **Productivity** | **PR Cycle Time** | Reduce average time from task initiation to Pull Request merge by 30% compared to manual process (leveraging parallel execution). |
| **Cost Efficiency** | **Cost Per Feature** | Demonstrate a verifiable reduction in token cost per implemented feature by successfully routing high-volume execution tasks to the cheaper GLM 4.6 model. |
| **Adoption** | **Plugin Installation Rate** | Achieved successful installation and utilization across 80% of the target development team. |

---
*An AI agent system structured as a Claude Code Plugin acts like a customized toolbox. Instead of rummaging through a generic chest for tools (like writing prompts from scratch), you install a specialized kit (the UI/UX Build Plugin). This kit not only gives you tailored tools (agents and commands) but also installs automated checkpoints (hooks) that enforce your team's quality standards (linting and type checking) right at the moment the work is done, ensuring quality is built-in, not bolted on later.*
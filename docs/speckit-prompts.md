# Spec-Kit Command Prompts for UI/UX Build Plugin

This document contains optimized prompts for each spec-kit command to guide the development of the UI/UX Build Agent Plugin based on the PRD requirements.

---

## Command 1: `/speckit.init`

**Prompt:**

```
Initialize a new spec-driven development project for building a Claude Code Plugin called "UI/UX Build Agent Plugin". 

This plugin will be a foundational offering in a multi-plugin marketplace for rapid, quality-controlled frontend development. The plugin must:

1. Enforce strict technical standards (Tailwind CSS, React/TypeScript, Vite/ESBuild)
2. Implement advanced agent orchestration with multi-model strategy (Sonnet 4.5 for planning, GLM 4.6 for execution)
3. Enable concurrent development through parallel sub-agents
4. Provide automated quality routines via Hooks and Agent Skills
5. Include custom Slash Commands for common workflows
6. Integrate with MCP servers for design system and task runner tools

The project structure should follow Claude Code plugin standards with:
- `.claude-plugin/` directory for plugin manifest
- `agents/` directory for specialized sub-agents
- `commands/` directory for slash commands
- `hooks/` directory for automated quality hooks
- `skills/` directory for agent skills
- `.mcp.json` for MCP server definitions
- `scripts/` directory for utility scripts

Create a constitution that establishes:
- Code quality standards (Biome linting, TypeScript strict mode)
- Architecture principles (SOLID, DRY, KISS, YAGNI)
- Testing requirements (Vitest for unit and E2E tests)
- Plugin structure conventions (Claude Code plugin format)
- Multi-model strategy guidelines (when to use Sonnet 4.5 vs GLM 4.6)
- Parallel execution patterns for sub-agents
```

---

## Command 2: `/speckit.plan`

**Prompt:**

```
Generate a comprehensive implementation plan for the UI/UX Build Agent Plugin based on the PRD. The plan should cover:

**Core Components:**

1. **Subagents Architecture** (5 specialized agents):
   - UI-Architect: React/TS architecture expert, monorepo structure (pnpm/Turbo), component scaffolding
   - Tailwind-Stylist: Tailwind utility classes specialist, responsive design
   - Biome-Linter: Automated linting and formatting enforcement
   - Vitest-Tester: Test generation and execution (unit + E2E)
   - Monorepo-Orchestrator: Task coordination, Turbo runner management, parallel execution monitoring

2. **Automated Quality Routines:**
   - PostToolUse Hook for automatic lint fixes after file Write/Edit operations
   - Agent Skill for TypeScript type checking using LSP capabilities
   - Hook configuration using `${CLAUDE_PLUGIN_ROOT}` for path portability

3. **MCP Server Integrations:**
   - Design System/Component Library MCP server (Tailwind config, component templates, brand guidelines)
   - Task Runner MCP server (Turbo integration for monorepo tasks)

4. **Slash Commands:**
   - `/scaffold-component <name> <type>`: React/TS component generation with Tailwind
   - `/run-tests <component>`: Trigger Vitest-Tester sub-agent
   - `/lint-fix-all`: Global linting/formatting routine
   - `/deploy-preview`: Staging deployment via Monorepo-Orchestrator

5. **Marketplace Structure:**
   - Root `.claude-plugin/marketplace.json` with owner and plugin definitions
   - Plugin manifest `.claude-plugin/plugin.json` with name `ui-ux-build-plugin`, version, metadata

**Technical Requirements:**
- Use TypeScript for all plugin code
- Follow Claude Code plugin directory structure exactly as specified in PRD Section 4.3
- Implement multi-model strategy: Sonnet 4.5 for orchestration, GLM 4.6 for sub-agents (where cost-effective)
- Enable prompt caching for cost optimization
- Support parallel task execution using Task tool
- Integrate Biome for linting/formatting (not ESLint/Prettier)
- Use Vitest for testing framework
- Support pnpm workspace and Turbo monorepo structure

**Implementation Phases:**
1. Plugin structure and manifest setup
2. Core orchestrator agent (Sonnet 4.5)
3. Sub-agent implementations (GLM 4.6 where applicable)
4. Hook system for quality automation
5. MCP server integrations
6. Slash command implementations
7. Marketplace configuration
8. Documentation and testing

Break down each phase into detailed implementation steps with file paths, dependencies, and validation checkpoints.
```

---

## Command 3: `/speckit.tasks`

**Prompt:**

```
Generate a detailed task breakdown from the implementation plan. Organize tasks by user story/feature and ensure:

**Task Organization:**
- Group tasks by component (Subagents, Hooks, MCP Servers, Commands, Marketplace)
- Mark parallelizable tasks with [P] marker
- Order tasks to respect dependencies (e.g., manifest before agents, agents before commands)
- Include file paths for each task implementation

**Required Task Categories:**

1. **Plugin Foundation:**
   - Create `.claude-plugin/plugin.json` manifest
   - Set up directory structure (agents/, commands/, hooks/, skills/, scripts/)
   - Initialize TypeScript configuration
   - Set up Biome configuration

2. **Subagents (5 agents):**
   - UI-Architect agent definition and implementation
   - Tailwind-Stylist agent definition and implementation
   - Biome-Linter agent definition and implementation
   - Vitest-Tester agent definition and implementation
   - Monorepo-Orchestrator agent definition and implementation
   - Each agent should include model configuration (Sonnet 4.5 for orchestrator, GLM 4.6 for execution agents)

3. **Quality Automation:**
   - PostToolUse Hook configuration (hooks/hooks.json)
   - Lint fix hook script (scripts/lint-fix.sh)
   - Type checking Agent Skill (skills/Type-Enforcer/SKILL.md)
   - LSP integration for type validation

4. **MCP Servers:**
   - Design System MCP server definition (.mcp.json)
   - Task Runner MCP server definition (.mcp.json)
   - MCP server implementation scripts

5. **Slash Commands:**
   - `/scaffold-component` command implementation
   - `/run-tests` command implementation
   - `/lint-fix-all` command implementation
   - `/deploy-preview` command implementation

6. **Marketplace:**
   - Marketplace root configuration (.claude-plugin/marketplace.json)
   - Plugin metadata and versioning

7. **Testing:**
   - Unit tests for each sub-agent
   - Integration tests for hooks
   - E2E tests for slash commands
   - Test fixtures and mocks

8. **Documentation:**
   - README for plugin installation
   - Agent usage documentation
   - Command reference guide
   - Marketplace setup instructions

**Task Format:**
Each task should specify:
- Task ID and description
- File path(s) to create/modify
- Dependencies (other tasks that must complete first)
- Parallel execution marker [P] if applicable
- Validation checkpoint

Ensure tasks follow TDD approach where tests are written before implementation.
```

---

## Command 4: `/speckit.implement`

**Prompt:**

```
Execute the implementation plan following the task breakdown in tasks.md. 

**Implementation Guidelines:**

1. **Follow TDD Approach:**
   - Write tests before implementation for each component
   - Run tests after each task completion
   - Fix any failing tests before proceeding

2. **Code Quality Standards:**
   - Use Biome for linting and formatting (run `biome check --apply` after each file write)
   - Enforce TypeScript strict mode
   - Follow SOLID, DRY, KISS, YAGNI principles
   - Keep files under 500 lines (refactor if needed)

3. **Plugin Structure Compliance:**
   - Strictly adhere to Claude Code plugin directory structure from PRD Section 4.3
   - Ensure all manifest files (.claude-plugin/plugin.json, marketplace.json) are valid JSON
   - Use correct file naming conventions

4. **Multi-Model Strategy:**
   - Configure orchestrator agent to use Sonnet 4.5
   - Configure execution sub-agents (UI-Architect, Tailwind-Stylist, Biome-Linter, Vitest-Tester) to use GLM 4.6 where cost-effective
   - Enable prompt caching where supported

5. **Parallel Execution:**
   - Implement Task tool usage for parallel sub-agent execution
   - Ensure Monorepo-Orchestrator can coordinate parallel tasks

6. **Quality Automation:**
   - Implement PostToolUse Hook to trigger lint fixes automatically
   - Create Agent Skill for LSP-based type checking
   - Use `${CLAUDE_PLUGIN_ROOT}` environment variable for path portability

7. **Validation Checkpoints:**
   - After plugin manifest: Verify JSON validity and required fields
   - After each sub-agent: Verify agent definition format and model configuration
   - After hooks: Test hook triggers on file operations
   - After MCP servers: Validate .mcp.json schema
   - After commands: Test each slash command execution
   - After marketplace: Verify installation path works

8. **Error Handling:**
   - Implement proper error handling in all agents
   - Add logging for debugging
   - Handle edge cases (missing files, invalid inputs, etc.)

**Execution Order:**
- Execute tasks sequentially unless marked with [P] for parallel execution
- Complete all tasks in a phase before moving to the next
- Run validation checkpoints at each phase boundary
- Fix any errors before proceeding to next task

**Testing:**
- Run `npm run test` (or equivalent) after each test-related task
- Run `npm run lint` after each code modification
- Verify plugin can be installed via Claude Code CLI

Begin implementation starting with Task 1 and proceed through the task list systematically.
```

---

## Additional Research Prompt (Optional)

**Prompt for Research Phase:**

```
Review the implementation plan and identify areas requiring additional research about Claude Code plugin system, MCP protocol, and agent orchestration. Focus on:

1. **Claude Code Plugin System:**
   - Latest plugin manifest schema and required fields
   - Hook system API and PostToolUse hook implementation details
   - Agent definition format and model configuration options
   - Slash command registration and parameter parsing
   - LSP tool integration capabilities and limitations

2. **Model Context Protocol (MCP):**
   - MCP server definition schema (.mcp.json format)
   - How to expose design system data via MCP
   - Turbo/monorepo task runner integration patterns
   - MCP server implementation best practices

3. **Agent Orchestration:**
   - Task tool usage for parallel sub-agent execution
   - Model switching between Sonnet 4.5 and GLM 4.6
   - Prompt caching configuration and optimization
   - Cost tracking and optimization strategies

4. **Technology Stack:**
   - Biome configuration for TypeScript/React projects
   - Vitest setup for plugin testing
   - pnpm workspace and Turbo monorepo patterns
   - Tailwind CSS integration in React/TypeScript projects

For each research area, identify specific implementation questions that need answers, then conduct targeted research to fill knowledge gaps. Update the research.md document with findings, version numbers, and implementation details.
```

---

## Validation and Audit Prompt (Before Implementation)

**Prompt:**

```
Audit the implementation plan and task breakdown with focus on:

1. **Completeness Check:**
   - Are all PRD requirements (R-3.1.1, R-3.2.1, R-3.2.2, R-3.3.1, R-4.1.1, R-4.1.2) addressed?
   - Are all 5 sub-agents included?
   - Are all 4 slash commands specified?
   - Are both MCP servers defined?
   - Is marketplace structure complete?

2. **Dependency Validation:**
   - Are tasks ordered correctly (e.g., manifest before agents)?
   - Are parallel execution markers [P] correctly placed?
   - Do file paths match the Claude Code plugin structure?

3. **Technical Consistency:**
   - Does multi-model strategy align with cost optimization goals?
   - Are quality automation hooks properly integrated?
   - Is the plugin structure compliant with PRD Section 4.3?

4. **Over-Engineering Check:**
   - Are there any unnecessary components?
   - Can any tasks be simplified or combined?
   - Are we following YAGNI principle?

5. **Constitution Adherence:**
   - Does the plan follow SOLID principles?
   - Are code quality standards (Biome, TypeScript strict) enforced?
   - Is TDD approach properly integrated?

Identify any gaps, inconsistencies, or over-engineered components. Update the plan and tasks.md accordingly before proceeding to implementation.
```

---

## Notes

- These prompts are designed to be used sequentially in the spec-kit workflow
- Each prompt builds on the previous step's output
- The prompts reference specific PRD sections and requirements
- Adjust prompts based on actual spec-kit command syntax if different from documented format
- Use the research prompt if you encounter areas needing deeper investigation
- Run the validation prompt before starting implementation to catch issues early


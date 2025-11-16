---
description: "Display help information for the FrontEnd UI/UX Build Plugin"
---

# FrontEnd UI/UX Build Plugin Help

## Available Commands

### /scaffold-component
Generate a new React component with parallel agent orchestration.

**Usage**: `/scaffold-component <ComponentName> [options]`

**Examples**:
- `/scaffold-component UserProfile`
- `/scaffold-component ProductCard --type functional --styling tailwind --tests all`

### /lint-fix-all
Run automated linting and formatting across the entire codebase.

**Usage**: `/lint-fix-all`

**Features**:
- Automatic Biome linting and formatting
- TypeScript type checking
- Import organization

### /run-tests
Execute test suites for components and integration tests.

**Usage**: `/run-tests [options]`

**Examples**:
- `/run-tests`
- `/run-tests --coverage`
- `/run-tests --watch`

### /deploy-preview
Create preview deployments for testing.

**Usage**: `/deploy-preview [options]`

**Examples**:
- `/deploy-preview`
- `/deploy-preview --env staging`

## Plugin Capabilities

- 🚀 **Parallel Agent Orchestration**: Multiple specialized agents work concurrently
- 🎯 **Technology Stack Enforcement**: Tailwind CSS, React/TypeScript, Vite/ESBuild
- 🔧 **Automated Quality Enforcement**: PostToolUse hooks with Biome integration
- 💰 **Cost Optimization**: Dual-model strategy (Sonnet 4.5/GLM 4.6) with prompt caching
- 📦 **Marketplace Distribution**: Standard Claude Code marketplace support

## Quick Start

1. **Install the plugin**: `/plugin install ui-ux-build-plugin`
2. **Create a component**: `/scaffold-component MyComponent --type functional`
3. **Run quality checks**: `/lint-fix-all`
4. **Run tests**: `/run-tests`

For detailed documentation, see the plugin README.md file.
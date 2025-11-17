---
name: tailwind-config
description: Automatically synchronize Tailwind CSS configuration with design tokens and validate configuration changes
allowed-tools: Read,Write,Edit,Bash,Glob
---

# Tailwind Configuration Management

Automatically synchronize your Tailwind CSS configuration with design tokens and keep your styling system consistent.

## What this skill does

This skill helps you manage Tailwind CSS configurations by:
- **Auto-syncing** design tokens to Tailwind config
- **Validating** configuration changes
- **Merging** with existing custom configurations
- **Creating backups** before making changes
- **Formatting** and optimizing the generated config

## When to use this skill

Use this skill when you:
- Want to keep your Tailwind config synchronized with design tokens
- Need to update your color palette, typography, or spacing system
- Want to validate your Tailwind configuration
- Need to merge new design tokens with existing custom config

## Instructions

1. **Read existing configuration**:
   ```bash
   Read the current tailwind.config.js file
   Read design tokens from config/design-tokens.json
   ```

2. **Analyze design changes**:
   ```bash
   Compare design tokens with current Tailwind config
   Identify missing colors, spacing, typography values
   Check for conflicts or deprecated values
   ```

3. **Generate updated configuration**:
   ```bash
   Create new Tailwind config from design tokens
   Merge with existing custom configurations
   Validate syntax and structure
   ```

4. **Apply changes safely**:
   ```bash
   Create backup of current config
   Update tailwind.config.js with new configuration
   Run validation checks
   ```

## Examples

**Example 1: Update colors from design tokens**
```
I need to update my Tailwind config with new brand colors from my design tokens. Use the tailwind-config skill to sync them safely.
```

**Example 2: Validate configuration**
```
My Tailwind config seems to have errors. Please use the tailwind-config skill to validate and fix any issues.
```

**Example 3: Merge custom configurations**
```
I have custom animations and want to merge them with the design token configuration. Use the tailwind-config skill to handle the merge properly.
```
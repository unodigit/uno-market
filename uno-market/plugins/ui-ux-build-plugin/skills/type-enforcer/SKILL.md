---
name: type-enforcer
description: Enforce TypeScript type safety and validate type definitions across React components and utility functions
allowed-tools: Read,Write,Edit,Grep,Glob
---

# Type Enforcement & Validation

Automatically enforce TypeScript type safety and validate type definitions throughout your React application.

## What this skill does

This skill helps maintain type safety by:
- **Validating** TypeScript interfaces and type definitions
- **Enforcing** strict type checking rules
- **Identifying** implicit any types and type violations
- **Suggesting** proper type annotations
- **Validating** prop types for React components

## When to use this skill

Use this skill when you:
- Need to validate TypeScript types in your codebase
- Want to ensure strict type compliance
- Need to identify and fix type violations
- Want to improve type coverage in your components
- Need to validate complex type definitions

## Instructions

1. **Analyze type definitions**:
   ```bash
   Scan all TypeScript files for type definitions
   Identify interfaces, types, and enums
   Check for proper import/export of types
   ```

2. **Validate type usage**:
   ```bash
   Check for implicit any usage
   Validate React component prop types
   Ensure proper generic type usage
   Identify type casting violations
   ```

3. **Enforce strict typing**:
   ```bash
   Add missing type annotations
   Replace any types with specific types
   Ensure proper return type definitions
   Validate function parameter types
   ```

4. **Report violations**:
   ```bash
   List all type violations found
   Suggest specific fixes for each violation
   Provide corrected code examples
   Recommend type improvements
   ```

## Examples

**Example 1: Validate component types**
```
Please use the type-enforcer skill to validate the TypeScript types in my React components and identify any violations.
```

**Example 2: Fix implicit any types**
```
I have implicit any types in my code. Use the type-enforcer skill to find them and suggest proper types.
```

**Example 3: Check interface consistency**
```
Validate that all my interfaces are properly typed and used consistently across the codebase using the type-enforcer skill.
```
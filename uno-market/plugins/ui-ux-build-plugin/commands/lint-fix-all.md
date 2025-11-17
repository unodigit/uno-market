---
description: "Run automated linting and formatting across the entire codebase"
---

# /lint-fix-all

Run automated linting, formatting, and code quality enforcement across the entire codebase using Biome with automatic fix capabilities.

## Usage

```bash
# Fix all linting and formatting issues
/lint-fix-all

# Fix with verbose output
/lint-fix-all --verbose

# Fix specific directory
/lint-fix-all --directory src/components

# Fix specific file types
/lint-fix-all --types ts,tsx

# Run in dry-run mode (no changes)
/lint-fix-all --dry-run

# Include TypeScript type checking
/lint-fix-all --type-check

# Generate coverage report
/lint-fix-all --coverage
```

## Parameters

- `--directory` (optional): Target directory to lint (default: current directory)
- `--types` (optional): File types to process (default: ts,tsx,js,jsx)
- `--verbose` (optional): Show detailed output
- `--dry-run` (optional): Show changes without applying them
- `--type-check` (optional): Include TypeScript type checking
- `--coverage` (optional): Generate test coverage report
- `--fix-unsafe` (optional): Apply unsafe fixes
- `--max-warnings` (optional): Maximum warnings before failure

## Quality Enforcement Features

### Automated Linting
- **Biome Integration**: Uses Biome for fast, modern linting and formatting
- **Automatic Fixes**: Applies safe fixes automatically for common issues
- **Type Checking**: Optional TypeScript compilation checking
- **Import Organization**: Automatic import sorting and organization

### Code Quality Standards
- **Consistent Formatting**: Enforces consistent code style across all files
- **Type Safety**: Ensures TypeScript best practices
- **Performance**: Detects potential performance issues
- **Accessibility**: Checks for accessibility compliance

### Integration with Hooks
This command integrates seamlessly with the PostToolUse quality enforcement hooks:

```json
{
  "hooks": [
    {
      "id": "post-tool-use-quality-enforcement",
      "triggers": ["PostToolUse"],
      "actions": [
        {
          "type": "bash",
          "command": "npx biome check --apply ${CLAUDE_PLUGIN_ROOT}/**/*.{ts,tsx,js,jsx}",
          "timeoutMs": 5000
        }
      ]
    }
  ]
}
```

## Supported File Types

- **TypeScript**: `.ts`, `.tsx`
- **JavaScript**: `.js`, `.jsx`
- **JSON**: `.json`
- **Markdown**: `.md`
- **CSS**: `.css`, `.scss`, `.sass`
- **HTML**: `.html`

## Linting Rules Applied

### TypeScript/JavaScript
- **ESLint Rules**: Modern JavaScript best practices
- **TypeScript Rules**: Type safety and best practices
- **Import/Export**: Proper module syntax and organization
- **Code Style**: Consistent formatting and naming conventions

### React-Specific
- **Component Patterns**: Functional component best practices
- **Hook Rules**: Proper React hook usage
- **JSX Rules**: Consistent JSX syntax and patterns
- **Performance**: React performance optimization

### General Quality
- **Code Duplication**: Detect and flag duplicate code
- **Complexity**: Monitor code complexity metrics
- **Maintainability**: Ensure code is maintainable and readable
- **Documentation**: Check for missing documentation

## Output Examples

### Successful Execution
```bash
$ /lint-fix-all

🔍 Running quality enforcement on codebase...

✅ Linting and formatting completed successfully
📊 Files processed: 45
📝 Changes applied: 12
⚠️  Warnings: 3
📋 Type checking: Passed
✅ Code quality enforcement completed
```

### With Issues Found
```bash
$ /lint-fix-all --verbose

🔍 Running quality enforcement on codebase...

📝 src/components/Button.tsx: Applied 3 automatic fixes
  - Fixed inconsistent formatting (line 15, 23, 31)
  - Organized imports (line 5)
  - Fixed type annotations (line 12)

⚠️  src/components/UserProfile.tsx: 2 warnings
  - Unused variable 'temp' (line 45)
  - Missing JSDoc comment for 'handleClick' (line 67)

📋 Type checking: 1 error found
  ❌ src/types/index.ts:25 - Type 'ComponentType' is not defined
```

### Dry Run Mode
```bash
$ /lint-fix-all --dry-run

🔍 Running quality enforcement in dry-run mode...

📊 Files that would be changed: 8
📝 Proposed changes: 23 fixes
⚠️  Warnings: 7

💡 Run without --dry-run to apply these changes automatically
```

## Configuration

The command respects configuration from:

- **Biome Configuration**: `biome.json` in project root
- **TypeScript Configuration**: `tsconfig.json`
- **Design Tokens**: Applied through linting rules
- **Project Structure**: Customizable directory patterns

### Custom Biome Configuration
```json
{
  "extends": ["@biomejs/biome-1.0.0"],
  "rules": {
    "style/useNamingConvention": "error",
    "react/jsx-uses-react": "error",
    "typescript/noUnusedVariables": "error"
  }
}
```

## Performance Optimization

### Fast Execution
- **Parallel Processing**: Processes multiple files in parallel
- **Incremental Changes**: Only processes modified files
- **Smart Caching**: Caches linting results for unchanged files
- **Selective Targeting**: Target specific file types or directories

### Resource Usage
- **Memory**: Optimized memory usage for large codebases
- **CPU**: Efficient CPU utilization with parallel processing
- **IO**: Minimized file system operations

## Error Handling

### Common Issues
- **Permission Errors**: Ensure write access to files
- **Configuration Errors**: Validate Biome and TypeScript configuration
- **Type Errors**: Check TypeScript configuration and dependencies
- **Integration Issues**: Verify hook configuration and permissions

### Recovery Mechanisms
- **Partial Success**: Continue processing even if some files fail
- **Rollback Capability**: Preserve original files if critical errors occur
- **Detailed Reporting**: Comprehensive error messages and suggestions

## Integration Examples

### With Git Hooks
```bash
# Pre-commit hook
#!/bin/sh
npm run lint-fix-all
```

### With CI/CD Pipeline
```yaml
# GitHub Actions
- name: Quality Enforcement
  run: /lint-fix-all --directory src
```

### With Development Workflow
```bash
# After code changes
git add .
git commit -m "feat: add new component"

# Before deployment
/lint-fix-all --type-check
```

## Success Criteria

The command successfully enforces code quality when:

1. ✅ All automatic fixes are applied successfully
2. ✅ Type checking passes (when enabled)
3. ✅ No critical errors remain
4. ✅ Code consistency is maintained
5. ✅ Performance thresholds are met

## Troubleshooting

### Common Issues

**Permission Denied**: Ensure script has write permissions
```bash
chmod +x scripts/lint-fix-all.sh
```

**Biome Not Found**: Install Biome in project
```bash
npm install --save-dev @biomejs/biome
```

**TypeScript Errors**: Check TypeScript configuration
```bash
npx tsc --noEmit --listFiles
```

**Hook Integration**: Verify hook configuration
```bash
claude> /validate-installation
```
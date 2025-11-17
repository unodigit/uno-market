---
description: "Generate React components with parallel agent orchestration"
---

# /scaffold-component

Generate a new React component with TypeScript, Tailwind CSS styling, and comprehensive tests using parallel agent orchestration.

## Parallel Agent Orchestration Implementation

This command automatically launches multiple specialized agents in parallel:

```javascript
// Parallel agent execution orchestration
const agents = [
  {
    name: 'UI-Architect',
    model: 'sonnet-4.5',
    task: 'Design component architecture and TypeScript interfaces'
  },
  {
    name: 'Tailwind-Stylist',
    model: 'glm-4.6',
    task: 'Generate responsive Tailwind CSS styling'
  },
  {
    name: 'Vitest-Tester',
    model: 'glm-4.6',
    task: 'Create comprehensive test suite'
  }
];

// Execute agents in parallel
const results = await Promise.allSettled(
  agents.map(agent =>
    Task({
      agent: agent.name,
      model: agent.model,
      prompt: `${agent.task} for component: ${componentName} with options: ${JSON.stringify(options)}`
    })
  )
);
```

## Usage

```bash
/scaffold-component <ComponentName> [options]
```

## Parameters

- `ComponentName` (required): Name of the component to generate (PascalCase)
- `--type` (optional): Component type - "functional" (default) or "class"
- `--styling` (optional): Styling approach - "tailwind" (default), "css-modules", or "styled-components"
- `--tests` (optional): Test types - "unit", "integration", "all" (default)
- `--storybook` (optional): Generate Storybook stories - true/false (default: false)
- `--directory` (optional): Output directory - "src/components" (default)
- `--with-props` (optional): Include props interface - true/false (default: true)

## Examples

```bash
# Basic functional component with defaults
/scaffold-component UserProfile

# Full-featured component with all options
/scaffold-component ProductCard --type functional --styling tailwind --tests all --storybook true

# Simple component without tests or stories
/scaffold-component Button --type functional --styling tailwind --tests unit --storybook false

# Class component with custom directory
/scaffold-component DataTable --type class --directory src/components/data --tests integration
```

## Parallel Agent Orchestration

When you run this command, it automatically launches multiple specialized agents in parallel:

### 1. UI-Architect Agent
- Designs component structure and TypeScript interfaces
- Plans component architecture and state management
- Defines props and state requirements
- Plans component composition and hierarchy

### 2. Tailwind-Stylist Agent
- Implements responsive Tailwind CSS styling
- Applies design tokens and color palette
- Ensures consistent design system usage
- Optimizes utility class usage

### 3. Vitest-Tester Agent
- Generates comprehensive unit and integration tests
- Creates test scenarios and edge cases
- Implements testing utilities and mocks
- Ensures test coverage requirements

## Output Files

The command generates the following files in the specified directory:

```
<ComponentName>/
├── <ComponentName>.tsx          # Main component file
├── <ComponentName>.test.tsx     # Test file
├── <ComponentName>.stories.tsx  # Storybook stories (if requested)
├── index.ts                     # Export file
└── <ComponentName>.types.ts     # Type definitions (if complex)
```

## Component Features

### Generated Component Includes:
- TypeScript with proper type definitions
- Tailwind CSS responsive styling
- Accessibility attributes (ARIA)
- Error boundaries and loading states
- PropTypes/Interfaces for props
- Comprehensive documentation comments

### Generated Tests Include:
- Component rendering tests
- Props validation tests
- User interaction tests
- Accessibility tests
- Error handling tests

### Design Integration:
- Automatic Tailwind config updates via integrated workflow
- Design token validation before component generation
- Real-time design system synchronization
- Consistent spacing and typography from design tokens
- Brand color palette usage with validation
- Conflict detection and resolution for design tokens
- Automatic backup of existing Tailwind configurations

## Error Handling

The command includes comprehensive error handling:
- Component name validation
- File conflict detection and resolution
- Type checking and validation
- Test generation error recovery
- Rollback capability on failures

## Performance Considerations

- Parallel execution reduces component generation time by ~30%
- Optimized for large-scale component libraries
- Efficient file operations and template processing
- Caching for repeated component patterns

## Configuration

The command respects configuration from:
- `config/design-tokens.json` for design system settings (validated before use)
- `config/tailwind.config.template.js` for styling templates
- `scripts/validate-design-tokens.js` for design token validation
- `scripts/generate-tailwind-config.js` for config generation
- Environment variables for output directories
- User preferences for default options

## Tailwind Configuration Integration

When components are generated, this command automatically:

1. **Validates Design Tokens**: Runs `validate-design-tokens.js` to ensure design token integrity
2. **Detects New Tokens**: Identifies if new design tokens were added during component creation
3. **Updates Tailwind Config**: Automatically generates updated Tailwind configuration
4. **Creates Backups**: Preserves existing Tailwind configurations before updates
5. **Applies Merging**: Intelligently merges new configurations with existing custom settings
6. **Validates Output**: Ensures the generated Tailwind config is valid and functional

### Automatic Updates Trigger:
- New color variants added to design tokens
- New spacing values introduced
- Typography tokens updated
- Component-specific tokens added
- Any design system modifications

### Manual Tailwind Updates:
Users can also trigger updates manually using the `tailwind-config` skill or the `tailwind-config-update.sh` script.

## Integration

This command integrates seamlessly with:
- `/lint-fix-all` for code quality enforcement
- `/run-tests` for testing generated components
- `/tailwind-config` for automatic design system synchronization
- PostToolUse hooks for automatic quality checking
- Biome for linting and formatting
- `validate-design-tokens.js` for design system validation
- `generate-tailwind-config.js` for configuration updates

## Example Output

```typescript
// UserProfile.tsx
import React from 'react';
import { cn } from '../utils/cn';

interface UserProfileProps {
  name: string;
  email?: string;
  avatar?: string;
  className?: string;
}

export const UserProfile: React.FC<UserProfileProps> = ({
  name,
  email,
  avatar,
  className
}) => {
  return (
    <div className={cn(
      'flex items-center space-x-4 p-4 bg-white rounded-lg shadow-sm',
      className
    )}>
      {/* Component implementation */}
    </div>
  );
};
```

## Troubleshooting

**Common Issues:**
- Component naming conflicts: Use descriptive names or specify different directory
- Styling conflicts: Check design tokens configuration
- Test failures: Ensure proper test environment setup
- Hook triggers: Verify PostToolUse hooks are configured correctly

**Getting Help:**
Run `/help` for more commands and usage examples.
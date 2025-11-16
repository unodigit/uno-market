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
- Want to preview changes before applying them

## How to use

### Basic Usage

Update your Tailwind config with latest design tokens:
```
Update my tailwind.config.js with the latest design tokens
```

### Advanced Options

Preview changes without applying:
```
Show me what would change in my tailwind.config.js without updating it
```

Merge with existing custom configuration:
```
Update tailwind.config.js but merge with my existing custom settings
```

Create a backup before updating:
```
Update tailwind.config.js and create a backup first
```

Validate without updating:
```
Validate that my design tokens are correct for Tailwind
```

## Examples

### Example 1: Basic Update
```text
Update my tailwind.config.js with the current design tokens
```

The skill will:
1. Validate your design tokens
2. Generate a new Tailwind configuration
3. Create a backup of your existing config
4. Update the file with the new configuration
5. Validate that the new config works

### Example 2: Dry Run
```text
Show me what would change if I update my tailwind config
```

The skill will show you a diff of the changes without modifying any files.

### Example 3: Merge with Custom Config
```text
I have a custom tailwind.config.js with some custom animations. Update it with the design tokens but keep my custom settings
```

The skill will:
1. Load your existing configuration
2. Extract custom settings
3. Merge with generated config from design tokens
4. Preserve your custom animations, plugins, etc.

### Example 4: Specific Output File
```text
Generate a tailwind config at ./configs/tailwind.production.config.js for my project
```

## Configuration Options

### Output File
Specify where to generate the configuration:
- Default: `./tailwind.config.js`
- Custom: Specify any file path

### Backup Settings
- **Auto-backup**: Creates timestamped backups before updating
- **Custom backup directory**: Specify where to store backups
- **No backup**: Skip backup creation

### Merge Options
- **Replace**: Completely replace existing configuration
- **Merge**: Preserve custom settings while updating tokens

### Validation
- **Design tokens validation**: Checks for required sections and valid formats
- **Generated config validation**: Ensures the output is valid JavaScript

## Design Token Structure

The skill expects design tokens in this structure:

```json
{
  "tokens": {
    "colors": {
      "primary": { "50": "#eff6ff", "500": "#3b82f6", ... },
      "secondary": { "50": "#f8fafc", "500": "#64748b", ... }
    },
    "typography": {
      "fontFamily": { "sans": ["Inter", "system-ui", ...] },
      "fontSize": { "xs": ["0.75rem", { "lineHeight": "1rem" }], ... }
    },
    "spacing": { "1": "0.25rem", "2": "0.5rem", ... },
    "breakpoints": { "sm": "640px", "md": "768px", ... }
  }
}
```

## Generated Configuration Features

The generated Tailwind config includes:

### Complete Color System
- All design token colors automatically mapped
- Semantic colors (success, warning, error)
- Color aliases for convenience
- Dark mode support

### Typography System
- Font families from design tokens
- Font sizes with proper line heights
- Font weights and letter spacing
- Responsive typography

### Layout System
- Spacing scale from design tokens
- Breakpoints and containers
- Z-index layers
- Grid and flexbox utilities

### Component Utilities
- Pre-configured component styles
- Accessibility utilities
- Focus rings and reduced motion
- Modern CSS features

### Custom Plugins
- Aspect ratio utilities
- Container queries
- Component-specific utilities
- Text balance and pretty wrapping

## Best Practices

### 1. Version Control
Always commit your design token changes and Tailwind config updates together:
```text
Update tailwind config and commit the changes to version control
```

### 2. Testing
Test your updated configuration:
```text
Update my tailwind config and then run my build to make sure everything works
```

### 3. Team Collaboration
For team projects, consider using dry run first:
```text
Show me the changes for tailwind config so I can review them before we apply them
```

### 4. Incremental Updates
Update specific sections when needed:
```text
I just updated the color palette in my design tokens, can you update just the colors in my tailwind config?
```

## Troubleshooting

### Validation Errors
If validation fails:
1. Check your design tokens format
2. Ensure required sections are present
3. Verify color formats are valid hex codes

### Merge Conflicts
If merging causes issues:
1. Use dry run to preview changes
2. Manually review the generated config
3. Apply specific sections instead of full update

### Build Errors
If builds fail after update:
1. Check for syntax errors in the generated config
2. Verify all required plugins are available
3. Test with a minimal config first

## Integration with Other Skills

This skill works well with:
- **component-scaffold**: Automatically updates Tailwind config when creating components
- **design-tokens**: Manage your design token system
- **ui-review**: Validate your component implementations

## Example Workflow

1. **Update Design Tokens**: Make changes to your design tokens
2. **Sync Tailwind**: Use this skill to update your Tailwind config
3. **Test Build**: Run your development build to test
4. **Create Components**: Use the updated tokens in new components
5. **Review**: Validate everything works as expected

This workflow ensures your design system stays consistent across your entire application.
---
description: "Deploy plugin preview for testing and validation before marketplace release"
toolPermissions: ["Read", "Write", "Edit", "Bash", "Task"]
timeoutMs: 120000
---

# /deploy-preview

Deploy a preview version of the FrontEnd UI/UX Build Plugin for testing and validation before marketplace release.

## Usage

```bash
# Deploy preview with default settings
/deploy-preview

# Deploy preview with specific version
/deploy-preview --version 1.0.0-preview.1

# Deploy preview to specific environment
/deploy-preview --environment staging

# Deploy preview with custom configuration
/deploy-preview --config preview-config.json

# Deploy preview and run validation tests
/deploy-preview --validate

# Deploy preview with dry run (no actual deployment)
/deploy-preview --dry-run
```

## Parameters

- `--version` (optional): Custom version for preview (default: auto-generated)
- `--environment` (optional): Target environment (staging, preview, local - default: preview)
- `--config` (optional): Path to custom deployment configuration
- `--validate` (optional): Run validation tests after deployment
- `--dry-run` (optional): Simulate deployment without actual changes
- `--verbose` (optional): Show detailed deployment output
- `--force` (optional): Force deployment even if validation fails

## Deployment Features

### Automated Packaging
- **Plugin Bundle Creation**: Packages all plugin components into distributable format
- **Dependency Resolution**: Ensures all dependencies are properly included
- **Configuration Validation**: Validates plugin configuration before packaging
- **Version Management**: Automatically generates and manages preview versions

### Environment Deployment
- **Multi-Environment Support**: Staging, preview, and local deployment targets
- **Configuration Adaptation**: Adapts plugin configuration for target environment
- **Rollback Capability**: Supports rollback to previous preview versions
- **Environment Validation**: Validates target environment compatibility

### Preview Validation
- **Installation Testing**: Tests plugin installation in preview environment
- **Functionality Verification**: Verifies all plugin features work correctly
- **Quality Assurance**: Runs comprehensive quality checks
- **Performance Testing**: Validates plugin performance targets

## Deployment Process

### 1. Pre-Deployment Validation
```javascript
// Validate plugin structure and configuration
const validation = await validatePluginStructure();

if (!validation.isValid) {
  throw new Error(`Plugin validation failed: ${validation.errors.join(', ')}`);
}
```

### 2. Version Management
```javascript
// Generate preview version
const version = generatePreviewVersion({
  base: "1.0.0",
  type: "preview",
  environment: deployment.environment,
  timestamp: new Date().toISOString()
});

// Update marketplace.json with preview version
await updateMarketplaceJson({ version, preview: true });
```

### 3. Plugin Packaging
```javascript
// Create deployment package
const package = await createPluginPackage({
  source: './ui-ux-build-plugin',
  destination: `./dist/ui-ux-build-plugin-${version}.zip`,
  include: [
    '.claude-plugin/**/*',
    'scripts/**/*',
    'agents/**/*',
    'commands/**/*',
    'skills/**/*',
    'hooks/**/*',
    'config/**/*',
    'templates/**/*'
  ],
  exclude: ['.git', 'node_modules', 'test']
});
```

### 4. Environment Deployment
```javascript
// Deploy to target environment
const deployment = await deployToEnvironment({
  package: package.path,
  environment: deployment.environment,
  config: deployment.config,
  validation: deployment.validate
});
```

### 5. Post-Deployment Validation
```javascript
// Run comprehensive validation tests
if (deployment.validate) {
  const results = await runValidationTests({
    environment: deployment.environment,
    version: version,
    features: [
      'plugin-installation',
      'component-scaffolding',
      'quality-enforcement',
      'hook-execution'
    ]
  });

  if (!results.passed) {
    throw new Error(`Post-deployment validation failed: ${results.failures.join(', ')}`);
  }
}
```

## Configuration Files

### Preview Configuration (preview-config.json)
```json
{
  "deployment": {
    "environment": "preview",
    "versionStrategy": "auto-increment",
    "rollbackEnabled": true,
    "validationRequired": true
  },
  "environments": {
    "preview": {
      "registry": "https://preview-marketplace.claude-code.org",
      "timeout": 300000,
      "retries": 3,
      "validation": {
        "installation": true,
        "functionality": true,
        "performance": true,
        "quality": true
      }
    },
    "staging": {
      "registry": "https://staging-marketplace.claude-code.org",
      "timeout": 600000,
      "retries": 5,
      "validation": {
        "installation": true,
        "functionality": true,
        "performance": true,
        "quality": true,
        "integration": true
      }
    }
  },
  "notifications": {
    "slack": "#plugin-deployments",
    "email": ["dev-team@claude-plugin.org"],
    "webhook": "https://hooks.claude-plugin.org/deployments"
  }
}
```

## Output Examples

### Successful Deployment
```bash
$ /deploy-preview --version 1.0.0-preview.1 --validate

🚀 FrontEnd UI/UX Build Plugin - Preview Deployment
=====================================================

📋 Deployment Configuration:
   Environment: preview
   Version: 1.0.0-preview.1
   Validation: enabled
   Dry run: disabled

🔍 Pre-Deployment Validation:
   Plugin structure: ✅ Valid
   Dependencies: ✅ Resolved
   Configuration: ✅ Valid
   Version: ✅ Available

📦 Plugin Packaging:
   Components: 47 files
   Size: 2.3 MB
   Compression: 68%
   Package hash: sha256:abc123...

🌍 Environment Deployment:
   Registry: https://preview-marketplace.claude-code.org
   Upload: ✅ Complete
   Registration: ✅ Complete
   Verification: ✅ Complete

✅ Preview deployment successful!
🔗 Preview URL: https://preview.claude-code.org/plugins/ui-ux-build-plugin
📧 Notification sent to: dev-team@claude-plugin.org
```

### With Validation Results
```bash
$ /deploy-preview --validate

🧪 Post-Deployment Validation:
   Installation Test: ✅ Passed (1.2s)
   Component Scaffolding: ✅ Passed (2.1s)
   Quality Enforcement: ✅ Passed (1.8s)
   Hook Execution: ✅ Passed (0.9s)
   Performance Metrics: ✅ Passed (< 200ms latency)

📊 Validation Summary:
   Total Tests: 15
   Passed: 15
   Failed: 0
   Success Rate: 100%

🎉 All validation tests passed! Plugin ready for production release.
```

### Dry Run Mode
```bash
$ /deploy-preview --dry-run --verbose

🔍 Dry Run Mode - No actual deployment will be performed

📋 Deployment Plan:
   Environment: preview
   Version: 1.0.0-preview.2
   Package Size: ~2.3 MB
   Estimated Duration: ~45 seconds

📦 Package Contents:
   Commands: 7 files
   Agents: 6 files
   Skills: 4 files
   Scripts: 12 files
   Hooks: 1 file
   Config: 3 files
   Templates: 8 files

⚠️  This is a dry run. No changes will be made.
Use without --dry-run to perform actual deployment.
```

## Error Handling

### Common Deployment Issues
- **Network Timeouts**: Check internet connection and registry availability
- **Validation Failures**: Review plugin structure and configuration
- **Version Conflicts**: Ensure version is unique and valid
- **Environment Issues**: Verify target environment is accessible

### Recovery Strategies
- **Automatic Retry**: Built-in retry mechanism for transient failures
- **Rollback Support**: Automatic rollback to previous version on failure
- **Partial Recovery**: Continue deployment even if non-critical steps fail
- **Manual Intervention**: Clear guidance for manual recovery steps

## Integration with Monorepo-Orchestrator

The deploy-preview command works seamlessly with the Monorepo-Orchestrator agent:

```javascript
// Coordinate with monorepo orchestrator
const orchestrator = await Task({
  agent: "Monorepo-Orchestrator",
  model: "sonnet-4.5",
  prompt: `Coordinate preview deployment for ui-ux-build-plugin version ${version} to ${environment}`
});

// Handle monorepo-specific deployment logic
await orchestrator.coordinateDeployment({
  plugin: "ui-ux-build-plugin",
  version: version,
  environment: environment,
  dependencies: [
    "shared-utilities",
    "design-tokens",
    "quality-framework"
  ]
});
```

## Success Criteria

The preview deployment is successful when:

1. ✅ Plugin structure validates successfully
2. ✅ All dependencies are resolved and included
3. ✅ Package is created and uploaded to target environment
4. ✅ Plugin is registered and accessible in preview environment
5. ✅ Installation and functionality tests pass
6. ✅ Performance targets are met
7. ✅ Quality assurance checks complete successfully

## Rollback Procedure

If deployment fails or issues are discovered:

```bash
# List available versions
/deploy-preview --list-versions

# Rollback to previous version
/deploy-preview --rollback --version 1.0.0-preview.0

# Cleanup failed deployment
/deploy-preview --cleanup --version 1.0.0-preview.1
```

## Integration Points

- Works with Monorepo-Orchestrator for coordinated deployments
- Integrates with quality enforcement tools for validation
- Supports marketplace publishing workflow
- Coordinates with version management system
- Provides monitoring and alerting capabilities
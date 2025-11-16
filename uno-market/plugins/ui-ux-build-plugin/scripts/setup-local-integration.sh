#!/bin/bash

# setup-local-integration.sh - Configure local marketplace integration for development and testing
# Part of User Story 4: Marketplace Distribution

set -euo pipefail

# Colors for output
readonly RED='\033[0;31m'
readonly GREEN='\033[0;32m'
readonly YELLOW='\033[1;33m'
readonly BLUE='\033[0;34m'
readonly PURPLE='\033[0;35m'
readonly CYAN='\033[0;36m'
readonly NC='\033[0m' # No Color

# Configuration
readonly SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
readonly PLUGIN_ROOT="${CLAUDE_PLUGIN_ROOT:-$(dirname "$SCRIPT_DIR")}"
readonly INTEGRATIONS_CONFIG="${PLUGIN_ROOT}/config/integrations.json"
readonly LOCAL_REGISTRY_PORT="${CLAUDE_LOCAL_REGISTRY_PORT:-3000}"
readonly LOCAL_REGISTRY_HOST="${CLAUDE_LOCAL_REGISTRY_HOST:-localhost}"

# Parse command line arguments
ENVIRONMENT="local"
MOCK_REGISTRY=true
ENABLE_HOT_RELOAD=true
DEBUG_MODE=true
LOG_LEVEL="info"
FORCE=false

show_help() {
    cat << EOF
FrontEnd UI/UX Build Plugin - Local Integration Setup

USAGE:
    $0 [OPTIONS]

DESCRIPTION:
    Configure local marketplace integration for development and testing.
    Sets up mock registry, local endpoints, and development environment.

OPTIONS:
    -e, --environment ENV     Target environment (local, preview, staging - default: local)
    --no-mock-registry       Disable mock registry (use real registry)
    --no-hot-reload         Disable hot reload for development
    --no-debug              Disable debug mode
    --log-level LEVEL       Log level (error, warn, info, debug - default: info)
    -f, --force             Force reconfiguration even if already set up
    -h, --help              Show this help message

EXAMPLES:
    # Setup local development environment with mock registry
    $0

    # Setup staging integration for testing
    $0 --environment staging

    # Setup production-like environment without mock registry
    $0 --environment preview --no-mock-registry

EOF
}

log_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

log_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

log_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
}

log_setup() {
    echo -e "${PURPLE}⚙️  $1${NC}"
}

# Parse arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        -e|--environment)
            ENVIRONMENT="$2"
            shift 2
            ;;
        --no-mock-registry)
            MOCK_REGISTRY=false
            shift
            ;;
        --no-hot-reload)
            ENABLE_HOT_RELOAD=false
            shift
            ;;
        --no-debug)
            DEBUG_MODE=false
            shift
            ;;
        --log-level)
            LOG_LEVEL="$2"
            shift 2
            ;;
        -f|--force)
            FORCE=true
            shift
            ;;
        -h|--help)
            show_help
            exit 0
            ;;
        -*)
            log_error "Unknown option: $1"
            echo "Use --help for available options."
            exit 1
            ;;
        *)
            log_error "Unexpected argument: $1"
            exit 1
            ;;
    esac
done

# Initialize setup
log_setup "FrontEnd UI/UX Build Plugin - Local Integration Setup"
echo "=" .repeat(60)
echo "Environment: ${ENVIRONMENT}"
echo "Mock Registry: ${MOCK_REGISTRY}"
echo "Hot Reload: ${ENABLE_HOT_RELOAD}"
echo "Debug Mode: ${DEBUG_MODE}"
echo "Log Level: ${LOG_LEVEL}"
echo ""

# Check prerequisites
check_prerequisites() {
    log_info "Checking prerequisites..."

    local missing_tools=()

    # Check for Node.js
    if ! command -v node &> /dev/null; then
        missing_tools+=("node")
    fi

    # Check for npm
    if ! command -v npm &> /dev/null; then
        missing_tools+=("npm")
    fi

    # Check for jq (JSON processing)
    if ! command -v jq &> /dev/null; then
        missing_tools+=("jq")
    fi

    if [[ ${#missing_tools[@]} -gt 0 ]]; then
        log_error "Missing required tools: ${missing_tools[*]}"
        echo "Please install the missing tools before continuing."
        exit 1
    fi

    # Check if plugin root exists
    if [[ ! -d "${PLUGIN_ROOT}" ]]; then
        log_error "Plugin root directory not found: ${PLUGIN_ROOT}"
        exit 1
    fi

    log_success "Prerequisites check passed"
}

# Create configuration directory structure
create_config_structure() {
    log_info "Creating configuration structure..."

    local config_dirs=(
        "${PLUGIN_ROOT}/config"
        "${PLUGIN_ROOT}/.cache/integrations"
        "${PLUGIN_ROOT}/.temp/deployments"
        "${PLUGIN_ROOT}/.logs"
        "${PLUGIN_ROOT}/scripts/local"
    )

    for dir in "${config_dirs[@]}"; do
        if [[ ! -d "${dir}" ]]; then
            mkdir -p "${dir}"
            log_info "Created directory: ${dir}"
        fi
    done

    log_success "Configuration structure created"
}

# Setup local integrations configuration
setup_integrations_config() {
    log_info "Setting up integrations configuration..."

    if [[ -f "${INTEGRATIONS_CONFIG}" && "${FORCE}" != true ]]; then
        log_warning "Integrations configuration already exists. Use --force to overwrite."
        return
    fi

    # Create local configuration based on environment
    local temp_config=$(mktemp)

    # Update configuration based on arguments
    jq --arg env "${ENVIRONMENT}" \
       --arg mock_registry "${MOCK_REGISTRY}" \
       --arg hot_reload "${ENABLE_HOT_RELOAD}" \
       --arg debug_mode "${DEBUG_MODE}" \
       --arg log_level "${LOG_LEVEL}" \
       --arg port "${LOCAL_REGISTRY_PORT}" \
       --arg host "${LOCAL_REGISTRY_HOST}" \
       '
        .local.mockRegistry = ($mock_registry == "true")
        | .local.enableHotReload = ($hot_reload == "true")
        | .local.debugMode = ($debug_mode == "true")
        | .local.logLevel = $log_level
        | .local.port = ($port | tonumber)
        | .local.host = $host
        | .deployment.environments.local.registry = if $env == "local" then "local" else $env
        | .deployment.environments[$env].validation.performance = ($env != "local")
        | .deployment.environments[$env].validation.quality = ($env != "local")
        ' "${INTEGRATIONS_CONFIG}" > "$temp_config" 2>/dev/null || {
        # If file doesn't exist, create a minimal one
        cat > "$temp_config" << EOF
{
  "local": {
    "port": ${LOCAL_REGISTRY_PORT},
    "host": "${LOCAL_REGISTRY_HOST}",
    "mockRegistry": ${MOCK_REGISTRY},
    "enableHotReload": ${ENABLE_HOT_RELOAD},
    "debugMode": ${DEBUG_MODE},
    "logLevel": "${LOG_LEVEL}",
    "cacheDir": ".cache/integrations",
    "tempDir": ".temp/deployments"
  },
  "deployment": {
    "environments": {
      "${ENVIRONMENT}": {
        "registry": "${ENVIRONMENT}",
        "validation": {
          "installation": true,
          "functionality": true,
          "performance": $([[ "${ENVIRONMENT}" != "local" ]] && echo "true" || echo "false"),
          "quality": $([[ "${ENVIRONMENT}" != "local" ]] && echo "true" || echo "false")
        }
      }
    }
  }
}
EOF
    }

    mv "$temp_config" "${INTEGRATIONS_CONFIG}"
    log_success "Integrations configuration updated"
}

# Setup mock registry for local development
setup_mock_registry() {
    if [[ "${MOCK_REGISTRY}" != true ]]; then
        log_info "Mock registry disabled, skipping setup"
        return
    fi

    log_info "Setting up mock registry..."

    local mock_registry_dir="${PLUGIN_ROOT}/scripts/local/mock-registry"
    local mock_registry_file="${mock_registry_dir}/index.js"

    # Create mock registry script
    mkdir -p "${mock_registry_dir}"

    cat > "${mock_registry_file}" << 'EOF'
#!/usr/bin/env node

/**
 * Mock Marketplace Registry for Local Development
 * Simulates marketplace API endpoints for testing
 */

const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// File upload handling
const upload = multer({ dest: 'uploads/' });

// Mock plugin database
let plugins = new Map();
let deploymentHistory = [];

// Plugin validation
app.post('/api/v1/plugins/validate', (req, res) => {
  const { pluginData } = req.body;

  // Simulate validation
  const validation = {
    valid: true,
    errors: [],
    warnings: [],
    metadata: {
      validatedAt: new Date().toISOString(),
      size: pluginData?.size || 0
    }
  };

  res.json(validation);
});

// Plugin publishing
app.post('/api/v1/plugins/publish', upload.single('package'), (req, res) => {
  const pluginId = `ui-ux-build-plugin-${Date.now()}`;
  const version = req.body.version || '1.0.0';

  const plugin = {
    id: pluginId,
    name: 'FrontEnd UI/UX Build Plugin',
    version: version,
    status: 'published',
    publishedAt: new Date().toISOString(),
    metadata: req.body
  };

  plugins.set(pluginId, plugin);
  deploymentHistory.push({
    pluginId,
    version,
    timestamp: new Date().toISOString(),
    status: 'success'
  });

  res.json({
    success: true,
    pluginId,
    version,
    url: `http://localhost:${PORT}/plugins/${pluginId}`
  });
});

// Get plugin metadata
app.get('/api/v1/plugins/:pluginId', (req, res) => {
  const plugin = plugins.get(req.params.pluginId);

  if (!plugin) {
    return res.status(404).json({ error: 'Plugin not found' });
  }

  res.json(plugin);
});

// List plugins
app.get('/api/v1/plugins', (req, res) => {
  const pluginList = Array.from(plugins.values());
  res.json({
    plugins: pluginList,
    total: pluginList.length
  });
});

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Download plugin
app.get('/api/v1/plugins/:pluginId/download', (req, res) => {
  const plugin = plugins.get(req.params.pluginId);

  if (!plugin) {
    return res.status(404).json({ error: 'Plugin not found' });
  }

  // For mock purposes, return a placeholder
  res.json({
    downloadUrl: `http://localhost:${PORT}/downloads/${req.params.pluginId}.zip`,
    version: plugin.version,
    size: '2.3MB'
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Mock Marketplace Registry running on http://localhost:${PORT}`);
  console.log(`📋 Available endpoints:`);
  console.log(`   POST /api/v1/plugins/validate - Validate plugin`);
  console.log(`   POST /api/v1/plugins/publish - Publish plugin`);
  console.log(`   GET  /api/v1/plugins/:id - Get plugin metadata`);
  console.log(`   GET  /api/v1/plugins - List plugins`);
  console.log(`   GET  /api/v1/plugins/:id/download - Download plugin`);
  console.log(`   GET  /health - Health check`);
});

module.exports = app;
EOF

    # Create package.json for mock registry
    cat > "${mock_registry_dir}/package.json" << 'EOF'
{
  "name": "mock-marketplace-registry",
  "version": "1.0.0",
  "description": "Mock marketplace registry for local development",
  "main": "index.js",
  "scripts": {
    "start": "node index.js",
    "dev": "nodemon index.js"
  },
  "dependencies": {
    "express": "^4.18.0",
    "cors": "^2.8.5",
    "multer": "^1.4.5"
  },
  "devDependencies": {
    "nodemon": "^2.0.20"
  }
}
EOF

    # Make mock registry executable
    chmod +x "${mock_registry_file}"

    log_success "Mock registry setup completed"
}

# Setup environment variables
setup_environment_variables() {
    log_info "Setting up environment variables..."

    local env_file="${PLUGIN_ROOT}/.env.local"

    # Create or update .env.local file
    cat > "${env_file}" << EOF
# FrontEnd UI/UX Build Plugin - Local Integration Configuration
# Generated on $(date)

# Registry Configuration
CLAUDE_LOCAL_REGISTRY_PORT=${LOCAL_REGISTRY_PORT}
CLAUDE_LOCAL_REGISTRY_HOST=${LOCAL_REGISTRY_HOST}
CLAUDE_LOCAL_REGISTRY_ENABLED=${MOCK_REGISTRY}

# Development Configuration
CLAUDE_DEBUG_MODE=${DEBUG_MODE}
CLAUDE_LOG_LEVEL=${LOG_LEVEL}
CLAUDE_HOT_RELOAD=${ENABLE_HOT_RELOAD}

# Integration Paths
CLAUDE_PLUGIN_ROOT=${PLUGIN_ROOT}
CLAUDE_CACHE_DIR=${PLUGIN_ROOT}/.cache/integrations
CLAUDE_TEMP_DIR=${PLUGIN_ROOT}/.temp/deployments
CLAUDE_LOG_DIR=${PLUGIN_ROOT}/.logs

# Marketplace Integration (set these for real marketplace access)
# CLAUDE_MARKETPLACE_TOKEN=your-token-here
# SLACK_WEBHOOK_URL=your-slack-webhook-here
# DEPLOYMENT_WEBHOOK_URL=your-webhook-here

# SMTP Configuration (for email notifications)
# SMTP_HOST=smtp.example.com
# SMTP_PORT=587
# SMTP_USER=your-email@example.com
# SMTP_PASS=your-password
EOF

    # Add .env.local to .gitignore if not already present
    if [[ -f "${PLUGIN_ROOT}/../.gitignore" ]]; then
        if ! grep -q ".env.local" "${PLUGIN_ROOT}/../.gitignore"; then
            echo "" >> "${PLUGIN_ROOT}/../.gitignore"
            echo "# Local environment variables" >> "${PLUGIN_ROOT}/../.gitignore"
            echo ".env.local" >> "${PLUGIN_ROOT}/../.gitignore"
        fi
    fi

    log_success "Environment variables configured"
}

# Setup development scripts
setup_dev_scripts() {
    log_info "Setting up development scripts..."

    local dev_scripts_dir="${PLUGIN_ROOT}/scripts/local"

    # Create start-mock-registry script
    cat > "${dev_scripts_dir}/start-mock-registry.sh" << 'EOF'
#!/bin/bash

# Start mock marketplace registry for local development

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PLUGIN_ROOT="$(dirname "$(dirname "$SCRIPT_DIR")")"
MOCK_REGISTRY_DIR="${PLUGIN_ROOT}/scripts/local/mock-registry"

cd "${MOCK_REGISTRY_DIR}"

# Check if dependencies are installed
if [[ ! -d "node_modules" ]]; then
    echo "Installing mock registry dependencies..."
    npm install
fi

# Start the mock registry
echo "🚀 Starting mock marketplace registry..."
npm start
EOF

    chmod +x "${dev_scripts_dir}/start-mock-registry.sh"

    # Create test-integration script
    cat > "${dev_scripts_dir}/test-integration.sh" << 'EOF'
#!/bin/bash

# Test local marketplace integration

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PLUGIN_ROOT="$(dirname "$(dirname "$SCRIPT_DIR")")"

echo "🧪 Testing Local Marketplace Integration"
echo "=" .repeat(40)

# Test mock registry health
if curl -s http://localhost:3000/health > /dev/null; then
    echo "✅ Mock registry is running"
else
    echo "❌ Mock registry is not running"
    echo "   Start it with: ./scripts/local/start-mock-registry.sh"
    exit 1
fi

# Test plugin validation
echo "🔍 Testing plugin validation..."
curl -X POST http://localhost:3000/api/v1/plugins/validate \
     -H "Content-Type: application/json" \
     -d '{"pluginData":{"name":"test","version":"1.0.0"}}' \
     -s | jq .

echo ""
echo "🎉 Integration test completed successfully!"
EOF

    chmod +x "${dev_scripts_dir}/test-integration.sh"

    log_success "Development scripts created"
}

# Create startup guide
create_startup_guide() {
    log_info "Creating startup guide..."

    local startup_file="${PLUGIN_ROOT}/docs/LOCAL_INTEGRATION.md"

    mkdir -p "$(dirname "$startup_file")"

    cat > "${startup_file}" << EOF
# Local Integration Setup Guide

This guide explains how to use the local marketplace integration for development and testing.

## Quick Start

### 1. Start Mock Registry (for local development)

\`\`\`bash
# Start the mock marketplace registry
./scripts/local/start-mock-registry.sh
\`\`\`

The mock registry will be available at \`http://localhost:3000\`.

### 2. Test Plugin Integration

\`\`\`bash
# Test the local integration
./scripts/local/test-integration.sh
\`\`\`

### 3. Deploy Plugin to Local Environment

\`\`\`bash
# Deploy to local environment
./scripts/deploy-preview.sh --environment local
\`\`\`

## Configuration

The local integration is configured via:

- **\`config/integrations.json\`** - Main integration configuration
- **\`.env.local\`** - Environment variables and secrets

## Available Environments

### Local (Default)
- Mock registry enabled
- Fast deployment and testing
- No external dependencies

### Preview
- Real preview registry
- Full validation
- Integration testing

### Staging
- Production-like environment
- Comprehensive testing
- Performance validation

## Development Workflow

1. **Make changes** to plugin code
2. **Start mock registry** if not running
3. **Test integration** with test script
4. **Deploy to local** for quick validation
5. **Deploy to preview** for integration testing

## Mock Registry Endpoints

The mock registry provides these endpoints:

- \`POST /api/v1/plugins/validate\` - Validate plugin
- \`POST /api/v1/plugins/publish\` - Publish plugin
- \`GET /api/v1/plugins/:id\` - Get plugin metadata
- \`GET /api/v1/plugins\` - List plugins
- \`GET /health\` - Health check

## Troubleshooting

### Mock Registry Not Starting
- Check if port 3000 is available
- Install dependencies: \`cd scripts/local/mock-registry && npm install\`

### Plugin Validation Failing
- Check plugin structure in \`ui-ux-build-plugin/\`
- Ensure all required files are present

### Environment Variables Not Loading
- Check \`.env.local\` file exists and is properly formatted
- Verify environment is sourced correctly
EOF

    log_success "Startup guide created"
}

# Display final instructions
display_instructions() {
    echo ""
    log_success "🎉 Local integration setup completed successfully!"
    echo ""
    echo "Next steps:"
    echo "1. Start the mock registry:"
    echo "   ./scripts/local/start-mock-registry.sh"
    echo ""
    echo "2. Test the integration:"
    echo "   ./scripts/local/test-integration.sh"
    echo ""
    echo "3. Deploy your plugin:"
    echo "   ./scripts/deploy-preview.sh --environment local"
    echo ""
    echo "Configuration files:"
    echo "- ${INTEGRATIONS_CONFIG}"
    echo "- ${PLUGIN_ROOT}/.env.local"
    echo ""
    echo "Documentation:"
    echo "- ${PLUGIN_ROOT}/docs/LOCAL_INTEGRATION.md"
}

# Main execution
main() {
    check_prerequisites
    create_config_structure
    setup_integrations_config
    setup_mock_registry
    setup_environment_variables
    setup_dev_scripts
    create_startup_guide
    display_instructions
}

# Run main function
main
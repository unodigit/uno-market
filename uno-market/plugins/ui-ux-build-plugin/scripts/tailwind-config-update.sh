#!/bin/bash

# tailwind-config-update.sh - Update Tailwind configuration from design tokens
# Part of Phase 7: Tailwind Configuration Management

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
readonly CONFIG_DIR="${PLUGIN_ROOT}/config"
# readonly TEMPLATES_DIR="${CONFIG_DIR}/templates" # Removed - unused
readonly DESIGN_TOKENS_FILE="${CONFIG_DIR}/design-tokens.json"
readonly TAILWIND_TEMPLATE_FILE="${CONFIG_DIR}/tailwind.config.template.js"
readonly TAILWIND_GENERATOR="${SCRIPT_DIR}/generate-tailwind-config.js"

# Default configuration
PROJECT_DIR=""
OUTPUT_FILE=""
BACKUP_DIR=""
VERBOSE=false
DRY_RUN=false
FORCE=false
VALIDATE_ONLY=false
CREATE_BACKUP=true
FORMAT_OUTPUT=true
MERGE_WITH_EXISTING=false

# Parse command line arguments
show_help() {
    cat << EOF
FrontEnd UI/UX Build Plugin - Tailwind Configuration Updater

USAGE:
    $0 [OPTIONS] [PROJECT_DIR]

DESCRIPTION:
    Update Tailwind CSS configuration files based on design tokens.
    Automatically synchronizes your tailwind.config.js with the latest design tokens.

OPTIONS:
    -o, --output FILE       Output file path (default: PROJECT_DIR/tailwind.config.js)
    -b, --backup DIR        Backup directory for existing config (default: .tailwind-backups)
    --dry-run               Show changes without applying them
    --validate-only         Validate design tokens without updating config
    --no-backup             Don't create backup of existing config
    --no-format             Skip code formatting
    --merge                 Merge with existing config instead of overwriting
    -f, --force             Force update even if validation fails
    -v, --verbose           Show detailed output
    -h, --help              Show this help message

EXAMPLES:
    # Update Tailwind config in current directory
    $0 .

    # Update with custom output path
    $0 ./my-project --output ./custom-tailwind.config.js

    # Validate design tokens without updating
    $0 --validate-only

    # Dry run to see what would change
    $0 . --dry-run --verbose

    # Merge with existing config
    $0 . --merge --backup ./backups

    # Force update without validation
    $0 . --force --no-backup

EOF
}

log_info() {
    if [[ "${VERBOSE}" == true ]]; then
        echo -e "${BLUE}ℹ️  $1${NC}"
    fi
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

log_config() {
    echo -e "${PURPLE}⚙️  $1${NC}"
}

log_diff() {
    echo -e "${CYAN}📝 $1${NC}"
}

# Parse arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        -o|--output)
            OUTPUT_FILE="$2"
            shift 2
            ;;
        -b|--backup)
            BACKUP_DIR="$2"
            shift 2
            ;;
        --dry-run)
            DRY_RUN=true
            shift
            ;;
        --validate-only)
            VALIDATE_ONLY=true
            shift
            ;;
        --no-backup)
            CREATE_BACKUP=false
            shift
            ;;
        --no-format)
            FORMAT_OUTPUT=false
            shift
            ;;
        --merge)
            MERGE_WITH_EXISTING=true
            shift
            ;;
        -f|--force)
            FORCE=true
            shift
            ;;
        -v|--verbose)
            VERBOSE=true
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
            PROJECT_DIR="$1"
            shift
            ;;
    esac
done

# Initialize update process
init_update() {
    log_config "FrontEnd UI/UX Build Plugin - Tailwind Configuration Updater"
    echo "============================================================"
    echo "Project Directory: ${PROJECT_DIR:-current}"
    echo "Output File: ${OUTPUT_FILE:-auto-detect}"
    echo "Backup Directory: ${BACKUP_DIR:-.tailwind-backups}"
    echo "Dry Run: ${DRY_RUN}"
    echo "Validate Only: ${VALIDATE_ONLY}"
    echo "Create Backup: ${CREATE_BACKUP}"
    echo "Format Output: ${FORMAT_OUTPUT}"
    echo "Merge Mode: ${MERGE_WITH_EXISTING}"
    echo ""

    # Check for required tools
    if ! command -v node &> /dev/null; then
        log_error "Node.js is required but not installed"
        exit 1
    fi

    if ! command -v npm &> /dev/null; then
        log_error "npm is required but not installed"
        exit 1
    fi
}

# Validate prerequisites
check_prerequisites() {
    log_info "Checking prerequisites..."

    # Check if design tokens file exists
    if [[ ! -f "${DESIGN_TOKENS_FILE}" ]]; then
        log_error "Design tokens file not found: ${DESIGN_TOKENS_FILE}"
        exit 1
    fi

    # Check if Tailwind template exists
    if [[ ! -f "${TAILWIND_TEMPLATE_FILE}" ]]; then
        log_error "Tailwind template file not found: ${TAILWIND_TEMPLATE_FILE}"
        exit 1
    fi

    # Check project directory
    if [[ -n "${PROJECT_DIR}" && ! -d "${PROJECT_DIR}" ]]; then
        log_error "Project directory not found: ${PROJECT_DIR}"
        exit 1
    fi

    # Set defaults
    if [[ -z "${PROJECT_DIR}" ]]; then
        PROJECT_DIR="."
    fi

    if [[ -z "${OUTPUT_FILE}" ]]; then
        OUTPUT_FILE="${PROJECT_DIR}/tailwind.config.js"
    fi

    if [[ -z "${BACKUP_DIR}" ]]; then
        BACKUP_DIR="${PROJECT_DIR}/.tailwind-backups"
    fi

    # Create backup directory if needed
    if [[ "${CREATE_BACKUP}" == true && ! -d "${BACKUP_DIR}" ]]; then
        mkdir -p "${BACKUP_DIR}"
        log_info "Created backup directory: ${BACKUP_DIR}"
    fi

    log_success "Prerequisites check passed"
}

# Validate design tokens
validate_design_tokens() {
    log_config "Validating design tokens..."

    # Use Node.js to validate JSON
    local validation_result
    validation_result=$(node -e "
        try {
            const tokens = require('${DESIGN_TOKENS_FILE}');

            // Check required sections
            const required = ['colors', 'typography', 'spacing', 'breakpoints'];
            const missing = required.filter(section => !tokens.tokens || !tokens.tokens[section]);

            if (missing.length > 0) {
                console.error('Missing required sections:', missing.join(', '));
                process.exit(1);
            }

            // Validate color format
            function validateColors(colors, path = '') {
                for (const [key, value] of Object.entries(colors)) {
                    if (typeof value === 'string') {
                        if (!/^#[0-9a-fA-F]{6}$/.test(value)) {
                            console.error('Invalid color format at', path + key + ':', value);
                            process.exit(1);
                        }
                    } else if (typeof value === 'object') {
                        validateColors(value, path + key + '.');
                    }
                }
            }

            validateColors(tokens.tokens.colors);

            console.log('✅ Design tokens validation passed');
            process.exit(0);
        } catch (error) {
            console.error('❌ Design tokens validation failed:', error.message);
            process.exit(1);
        }
    " 2>&1)

    if [[ $? -eq 0 ]]; then
        log_success "Design tokens validation passed"
        log_info "${validation_result}"
    else
        local validation_exit_code=$?
        if [[ "${FORCE}" != true ]]; then
            log_error "Design tokens validation failed:"
            echo "${validation_result}"
            exit ${validation_exit_code}
        else
            log_warning "Design tokens validation failed but continuing (force mode)"
        fi
    fi
}

# Load existing configuration if merging
load_existing_config() {
    if [[ "${MERGE_WITH_EXISTING}" != true || ! -f "${OUTPUT_FILE}" ]]; then
        return
    fi

    log_info "Loading existing configuration for merge..."

    # Read existing config
    EXISTING_CONFIG=$(cat "${OUTPUT_FILE}")

    log_success "Existing configuration loaded"
}

# Generate Tailwind configuration
generate_tailwind_config() {
    # Skip generation in validate-only mode
    if [[ "${VALIDATE_ONLY}" == true ]]; then
        return 0
    fi

    log_config "Generating Tailwind configuration..."

    local generator_args=(
        "--tokens" "${DESIGN_TOKENS_FILE}"
        "--template" "${TAILWIND_TEMPLATE_FILE}"
        "--output" "-"  # Output to stdout
    )

    if [[ "${VERBOSE}" == true ]]; then
        generator_args+=("--verbose")
    fi

    local config_output
    if [[ "${MERGE_WITH_EXISTING}" == true && -n "${EXISTING_CONFIG:-}" ]]; then
        generator_args+=("--merge")
        config_output=$(echo "${EXISTING_CONFIG}" | node "${TAILWIND_GENERATOR}" "${generator_args[@]}" --existing - 2>/dev/null)
    else
        config_output=$(node "${TAILWIND_GENERATOR}" "${generator_args[@]}" 2>/dev/null)
    fi

    local generator_exit_code=$?
    if [[ ${generator_exit_code} -eq 0 ]]; then
        log_success "Tailwind configuration generated"
        echo "${config_output}"
    else
        log_error "Tailwind configuration generation failed with exit code: ${generator_exit_code}"
        exit ${generator_exit_code}
    fi
}

# Create backup of existing config
create_backup() {
    if [[ "${CREATE_BACKUP}" != true || ! -f "${OUTPUT_FILE}" ]]; then
        return
    fi

    log_info "Creating backup of existing configuration..."

    local timestamp
    timestamp=$(date +"%Y%m%d_%H%M%S")
    local backup_file="${BACKUP_DIR}/tailwind.config.${timestamp}.js"

    cp "${OUTPUT_FILE}" "${backup_file}"

    log_success "Backup created: ${backup_file}"
}

# Format output if requested
format_output() {
    if [[ "${FORMAT_OUTPUT}" != true ]]; then
        return
    fi

    log_info "Formatting output..."

    # Try to use prettier if available
    if command -v npx &> /dev/null && npx prettier --version &> /dev/null; then
        echo "${GENERATED_CONFIG}" | npx prettier --parser babel --stdin-filepath tailwind.config.js
    else
        # Basic formatting with Node.js
        echo "${GENERATED_CONFIG}" | node -e "
            const fs = require('fs');
            let content = '';
            process.stdin.setEncoding('utf8');
            process.stdin.on('data', chunk => content += chunk);
            process.stdin.on('end', () => {
                // Basic formatting: ensure consistent indentation
                content = content.replace(/\t/g, '  ');
                console.log(content);
            });
        "
    fi
}

# Show diff for dry run
show_diff() {
    if [[ "${DRY_RUN}" != true || ! -f "${OUTPUT_FILE}" ]]; then
        return
    fi

    log_diff "Showing differences..."

    # Create temporary file for comparison
    local temp_file
    temp_file=$(mktemp)
    echo "${FORMATTED_CONFIG}" > "${temp_file}"

    # Show diff
    if command -v diff &> /dev/null; then
        if diff -u "${OUTPUT_FILE}" "${temp_file}"; then
            log_info "No differences found"
        fi
    else
        log_warning "diff command not available, cannot show differences"
    fi

    # Clean up
    rm -f "${temp_file}"
}

# Apply configuration
apply_configuration() {
    if [[ "${DRY_RUN}" == true || "${VALIDATE_ONLY}" == true ]]; then
        return
    fi

    log_config "Applying Tailwind configuration..."

    # Write configuration to file
    echo "${FORMATTED_CONFIG}" > "${OUTPUT_FILE}"

    log_success "Tailwind configuration applied to: ${OUTPUT_FILE}"
}

# Validate generated configuration
validate_generated_config() {
    log_info "Validating generated configuration..."

    # Test if it's valid JavaScript
    if node -c "${OUTPUT_FILE}" 2>/dev/null; then
        log_success "Generated configuration is valid JavaScript"
    else
        local validation_exit_code=$?
        log_error "Generated configuration is invalid JavaScript"
        exit ${validation_exit_code}
    fi

    # Test if it can be required
    if node -e "const config = require('${OUTPUT_FILE}'); console.log('✅ Configuration can be loaded');" 2>/dev/null; then
        log_success "Generated configuration can be loaded by Node.js"
    else
        local require_exit_code=$?
        log_warning "Generated configuration has loading issues"
    fi
}

# Generate summary
generate_summary() {
    echo ""
    log_config "Update Summary"
    echo "=============================="
    echo "Design Tokens: ${DESIGN_TOKENS_FILE}"
    echo "Template: ${TAILWIND_TEMPLATE_FILE}"
    echo "Output: ${OUTPUT_FILE}"
    echo "Project: ${PROJECT_DIR}"

    if [[ "${CREATE_BACKUP}" == true && -f "${OUTPUT_FILE}" ]]; then
        echo "Backup: Created"
    fi

    echo "Mode: $([[ "${DRY_RUN}" == true ]] && echo "DRY RUN" || echo "LIVE")"
    echo "Merge: $([[ "${MERGE_WITH_EXISTING}" == true ]] && echo "Enabled" || echo "Disabled")"

    echo ""

    if [[ "${VALIDATE_ONLY}" == true ]]; then
        log_config "Validation completed successfully!"
    elif [[ "${DRY_RUN}" == true ]]; then
        log_diff "Dry run completed successfully!"
        log_info "Run without --dry-run to apply changes"
    else
        log_config "Tailwind configuration updated successfully!"
        log_info "Your tailwind.config.js is now synchronized with design tokens"
    fi

    # Show next steps
    echo ""
    echo "Next steps:"
    echo "1. Review the generated configuration"
    echo "2. Run your build process to test the new config"
    echo "3. Commit the changes to version control"
    echo "4. Use the tailwind-config skill to keep it updated"
}

# Main execution
main() {
    # Initialize
    init_update

    # Check prerequisites
    check_prerequisites

    # Validate design tokens
    validate_design_tokens

    # Load existing configuration if merging
    load_existing_config

    # Generate Tailwind configuration
    GENERATED_CONFIG=$(generate_tailwind_config)

    # Format output
    FORMATTED_CONFIG=$(format_output)

    # Show diff for dry run
    show_diff

    # Create backup
    create_backup

    # Apply configuration
    apply_configuration

    # Validate generated config
    if [[ "${DRY_RUN}" != true && "${VALIDATE_ONLY}" != true ]]; then
        validate_generated_config
    fi

    # Generate summary
    generate_summary
}

# Run main function
main
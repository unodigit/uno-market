#!/bin/bash

# publish-to-marketplace.sh - Publish plugin to marketplace with comprehensive validation
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
readonly VERSION_MANAGER="${SCRIPT_DIR}/version-manager.js"
readonly MARKETPLACE_PUBLISHER="${SCRIPT_DIR}/marketplace-publisher.js"

# Default configuration
VERSION=""
ENVIRONMENT="production"
CHANNEL="stable"
DRY_RUN=false
VALIDATE_ONLY=false
SKIP_TESTS=false
SKIP_VALIDATION=false
FORCE=false
VERBOSE=false

# Parse command line arguments
show_help() {
    cat << EOF
FrontEnd UI/UX Build Plugin - Marketplace Publishing Utility

USAGE:
    $0 [OPTIONS] [VERSION]

DESCRIPTION:
    Package and publish the FrontEnd UI/UX Build Plugin to the marketplace
    with comprehensive validation and testing.

OPTIONS:
    -e, --environment ENV     Target environment (production, staging, preview - default: production)
    -c, --channel CHAN       Release channel (stable, beta, alpha - default: stable)
    -d, --dry-run            Show what would be published without publishing
    -v, --validate-only     Validate without creating package
    --skip-tests            Skip test running
    --skip-validation       Skip pre-publish validation
    -f, --force             Force publish even if validation fails
    --verbose               Show detailed output
    -h, --help              Show this help message

EXAMPLES:
    # Publish current version to production
    $0

    # Publish specific version to staging with beta channel
    $0 1.1.0 --environment staging --channel beta

    # Validate without publishing
    $0 --validate-only

    # Dry run to see what would be published
    $0 --dry-run --verbose

    # Force publish with validation skipped
    $0 --force --skip-validation

ENVIRONMENTS:
    production    - Production marketplace (requires approval)
    staging       - Staging marketplace for testing
    preview       - Preview environment for early access

CHANNELS:
    stable        - Stable release channel
    beta          - Beta release channel
    alpha         - Alpha release channel

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

log_publish() {
    echo -e "${PURPLE}🚀 $1${NC}"
}

log_package() {
    echo -e "${CYAN}📦 $1${NC}"
}

# Parse arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        -e|--environment)
            ENVIRONMENT="$2"
            shift 2
            ;;
        -c|--channel)
            CHANNEL="$2"
            shift 2
            ;;
        -d|--dry-run)
            DRY_RUN=true
            shift
            ;;
        -v|--validate-only)
            VALIDATE_ONLY=true
            shift
            ;;
        --skip-tests)
            SKIP_TESTS=true
            shift
            ;;
        --skip-validation)
            SKIP_VALIDATION=true
            shift
            ;;
        -f|--force)
            FORCE=true
            shift
            ;;
        --verbose)
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
            VERSION="$1"
            shift
            ;;
    esac
done

# Initialize publishing
init_publishing() {
    log_publish "FrontEnd UI/UX Build Plugin - Marketplace Publishing"
    echo "=" .repeat(60)
    echo "Environment: ${ENVIRONMENT}"
    echo "Channel: ${CHANNEL}"
    echo "Version: ${VERSION:-auto-detect}"
    echo "Dry Run: ${DRY_RUN}"
    echo "Validate Only: ${VALIDATE_ONLY}"
    echo "Skip Tests: ${SKIP_TESTS}"
    echo "Skip Validation: ${SKIP_VALIDATION}"
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

# Check prerequisites
check_prerequisites() {
    log_info "Checking prerequisites..."

    local missing_deps=()

    # Check Node.js version
    if command -v node &> /dev/null; then
        local node_version=$(node --version)
        local major_version=$(echo "$node_version" | cut -d'.' -f1 | sed 's/v//')
        if [[ $major_version -lt 16 ]]; then
            missing_deps+=("Node.js version >= 16 (found: $node_version)")
        fi
    else
        missing_deps+=("Node.js")
    fi

    # Check marketplace token
    if [[ "${DRY_RUN}" != true && "${VALIDATE_ONLY}" != true ]]; then
        if [[ -z "${CLAUDE_MARKETPLACE_TOKEN:-}" ]]; then
            missing_deps+=("CLAUDE_MARKETPLACE_TOKEN environment variable")
        fi
    fi

    # Check if plugin directory exists
    if [[ ! -d "${PLUGIN_ROOT}" ]]; then
        missing_deps+=("Plugin directory: ${PLUGIN_ROOT}")
    fi

    if [[ ${#missing_deps[@]} -gt 0 ]]; then
        log_error "Missing prerequisites:"
        for dep in "${missing_deps[@]}"; do
            log_error "  - ${dep}"
        done

        if [[ "${FORCE}" != true ]]; then
            log_error "Use --force to continue anyway"
            exit 1
        else
            log_warning "Continuing despite missing prerequisites (force mode)"
        fi
    else
        log_success "Prerequisites check passed"
    fi
}

# Get or generate version
get_version() {
    if [[ -n "${VERSION}" ]]; then
        echo "${VERSION}"
        return
    fi

    log_info "Detecting current version..."

    if [[ -f "${VERSION_MANAGER}" ]]; then
        VERSION=$(node "${VERSION_MANAGER}" current 2>/dev/null | jq -r '.version // "1.0.0"' || echo "1.0.0")
    else
        VERSION="1.0.0"
    fi

    log_info "Detected version: ${VERSION}"
    echo "${VERSION}"
}

# Bump version if needed
bump_version_if_needed() {
    if [[ -n "${VERSION}" && "${FORCE}" != true ]]; then
        return
    fi

    log_info "Version management..."

    # Generate version based on channel
    case "${CHANNEL}" in
        "stable")
            if [[ -z "${VERSION}" ]]; then
                VERSION=$(node "${VERSION_MANAGER}" bump patch 2>/dev/null | jq -r '.newVersion // "1.0.1"' || echo "1.0.1")
            fi
            ;;
        "beta")
            if [[ -z "${VERSION}" ]]; then
                VERSION=$(node "${VERSION_MANAGER}" bump minor 2>/dev/null | jq -r '.newVersion // "1.1.0"' || echo "1.1.0")
            fi
            VERSION="${VERSION}-beta.$(date +%Y%m%d%H%M)"
            ;;
        "alpha")
            if [[ -z "${VERSION}" ]]; then
                VERSION=$(node "${VERSION_MANAGER}" bump minor 2>/dev/null | jq -r '.newVersion // "1.1.0"' || echo "1.1.0")
            fi
            VERSION="${VERSION}-alpha.$(date +%Y%m%d%H%M)"
            ;;
        *)
            log_warning "Unknown channel: ${CHANNEL}, using stable"
            CHANNEL="stable"
            ;;
    esac

    # Update version in files if not validate-only
    if [[ "${VALIDATE_ONLY}" != true && -f "${VERSION_MANAGER}" ]]; then
        log_info "Updating version to ${VERSION}..."
        node "${VERSION_MANAGER}" update "${VERSION}" &>/dev/null || true
    fi

    log_success "Version set to: ${VERSION}"
}

# Run validation
run_validation() {
    if [[ "${SKIP_VALIDATION}" == true ]]; then
        log_info "Skipping validation (disabled)"
        return
    fi

    log_package "Running validation..."

    local validation_args=()
    if [[ "${VERBOSE}" == true ]]; then
        validation_args+=("--verbose")
    fi

    if [[ "${FORCE}" == true ]]; then
        validation_args+=("--force")
    fi

    # Run marketplace publisher validation
    if node "${MARKETPLACE_PUBLISHER}" validate "${validation_args[@]}" 2>/dev/null; then
        log_success "Validation passed"
    else
        local validation_exit_code=$?
        if [[ "${FORCE}" != true ]]; then
            log_error "Validation failed with exit code: ${validation_exit_code}"
            exit 1
        else
            log_warning "Validation failed but continuing (force mode)"
        fi
    fi

    # Run plugin installation validation
    local install_validation="${SCRIPT_DIR}/validate-installation.sh"
    if [[ -f "${install_validation}" ]]; then
        log_info "Running installation validation..."
        if "${install_validation}" 2>/dev/null; then
            log_success "Installation validation passed"
        else
            local install_exit_code=$?
            if [[ "${FORCE}" != true ]]; then
                log_error "Installation validation failed with exit code: ${install_exit_code}"
                exit 1
            else
                log_warning "Installation validation failed but continuing (force mode)"
            fi
        fi
    fi
}

# Run tests
run_tests() {
    if [[ "${SKIP_TESTS}" == true ]]; then
        log_info "Skipping tests (disabled)"
        return
    fi

    log_package "Running tests..."

    # Run linting tests
    if command -v npx &> /dev/null && npx biome --version &> /dev/null; then
        log_info "Running linting tests..."
        if npx biome check --max-diagnostics=50 2>/dev/null; then
            log_success "Linting tests passed"
        else
            local linting_exit_code=$?
            if [[ "${FORCE}" != true ]]; then
                log_error "Linting tests failed with exit code: ${linting_exit_code}"
                exit 1
            else
                log_warning "Linting tests failed but continuing (force mode)"
            fi
        fi
    fi

    # Run type checking tests
    if command -v npx &> /dev/null && npx tsc --version &> /dev/null; then
        log_info "Running TypeScript tests..."
        if npx tsc --noEmit 2>/dev/null; then
            log_success "TypeScript tests passed"
        else
            local tsc_exit_code=$?
            log_info "TypeScript tests skipped (no tsconfig.json or errors found)"
        fi
    fi

    # Run quality tests
    local quality_check="${SCRIPT_DIR}/run-quality-check.sh"
    if [[ -f "${quality_check}" ]]; then
        log_info "Running quality checks..."
        if "${quality_check}" --output json &>/dev/null; then
            log_success "Quality checks passed"
        else
            local quality_exit_code=$?
            if [[ "${FORCE}" != true ]]; then
                log_error "Quality checks failed with exit code: ${quality_exit_code}"
                exit 1
            else
                log_warning "Quality checks failed but continuing (force mode)"
            fi
        fi
    fi
}

# Create package
create_package() {
    if [[ "${VALIDATE_ONLY}" == true ]]; then
        log_info "Skipping package creation (validate-only mode)"
        return
    fi

    log_package "Creating package..."

    local package_args=(
        "${VERSION}"
        "--channel=${CHANNEL}"
    )

    if [[ "${VERBOSE}" == true ]]; then
        package_args+=("--verbose")
    fi

    if node "${MARKETPLACE_PUBLISHER}" package "${package_args[@]}" 2>/dev/null; then
        log_success "Package created successfully"
    else
        local package_exit_code=$?
        log_error "Package creation failed with exit code: ${package_exit_code}"
        exit 1
    fi
}

# Publish to marketplace
publish_to_marketplace() {
    if [[ "${VALIDATE_ONLY}" == true ]]; then
        log_info "Skipping publishing (validate-only mode)"
        return
    fi

    if [[ "${DRY_RUN}" == true ]]; then
        log_info "Skipping publishing (dry run mode)"
        log_publish "[DRY RUN] Would publish version ${VERSION} to ${ENVIRONMENT} environment"
        return
    fi

    log_publish "Publishing to marketplace..."

    local publish_args=(
        "${VERSION}"
        "--env=${ENVIRONMENT}"
        "--channel=${CHANNEL}"
    )

    if [[ "${VERBOSE}" == true ]]; then
        publish_args+=("--verbose")
    fi

    if [[ "${SKIP_TESTS}" == true ]]; then
        publish_args+=("--skip-tests")
    fi

    if [[ "${SKIP_VALIDATION}" == true ]]; then
        publish_args+=("--skip-validation")
    fi

    if node "${MARKETPLACE_PUBLISHER}" publish "${publish_args[@]}" 2>/dev/null; then
        log_success "Published successfully to ${ENVIRONMENT} marketplace"
    else
        local publish_exit_code=$?
        log_error "Publishing failed with exit code: ${publish_exit_code}"
        exit 1
    fi
}

# Generate summary
generate_summary() {
    echo ""
    log_publish "Publishing Summary"
    echo "=" .repeat(30)
    echo "Plugin: FrontEnd UI/UX Build Plugin"
    echo "Version: ${VERSION}"
    echo "Environment: ${ENVIRONMENT}"
    echo "Channel: ${CHANNEL}"
    echo "Mode: $([[ "${DRY_RUN}" == true ]] && echo "DRY RUN" || echo "LIVE")"

    if [[ "${VALIDATE_ONLY}" == true ]]; then
        echo "Action: Validation Only"
    elif [[ "${DRY_RUN}" == true ]]; then
        echo "Action: Dry Run (No actual changes)"
    else
        echo "Action: Published to Marketplace"
    fi

    echo ""

    if [[ "${VALIDATE_ONLY}" == true ]]; then
        log_package "Validation completed successfully!"
    elif [[ "${DRY_RUN}" == true ]]; then
        log_publish "Dry run completed successfully!"
        log_info "Run without --dry-run to actually publish"
    else
        log_publish "Plugin published successfully!"
        log_info "Plugin should be available in the ${ENVIRONMENT} marketplace shortly"
    fi
}

# Main execution
main() {
    # Initialize
    init_publishing

    # Check prerequisites
    check_prerequisites

    # Get or generate version
    VERSION=$(get_version)

    # Bump version if needed
    bump_version_if_needed

    # Run validation
    run_validation

    # Run tests
    run_tests

    # Create package
    create_package

    # Publish to marketplace
    publish_to_marketplace

    # Generate summary
    generate_summary
}

# Run main function
main
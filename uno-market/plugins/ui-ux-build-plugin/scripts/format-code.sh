#!/bin/bash

# format-code.sh - Automated code formatting for FrontEnd UI/UX Build Plugin
# Part of User Story 3: Automated Quality Enforcement

set -euo pipefail

# Colors for output
readonly RED='\033[0;31m'
readonly GREEN='\033[0;32m'
readonly YELLOW='\033[1;33m'
readonly BLUE='\033[0;34m'
readonly NC='\033[0m' # No Color

# Default configuration
DEFAULT_DIRECTORY="src"
DEFAULT_FILE_TYPES="ts,tsx,js,jsx"
DEFAULT_DRY_RUN=false
DEFAULT_VERBOSE=false
DEFAULT_CHECK=false
DEFAULT_ORGANIZE_IMPORTS=true

# Parse command line arguments
DIRECTORY="${DEFAULT_DIRECTORY}"
FILE_TYPES="${DEFAULT_FILE_TYPES}"
DRY_RUN="${DEFAULT_DRY_RUN}"
VERBOSE="${DEFAULT_VERBOSE}"
CHECK="${DEFAULT_CHECK}"
ORGANIZE_IMPORTS="${DEFAULT_ORGANIZE_IMPORTS}"

show_help() {
    cat << EOF
FrontEnd UI/UX Build Plugin - Code Formatting Utility

USAGE:
    ./format-code.sh [OPTIONS] [DIRECTORY]

DESCRIPTION:
    Automatically formats code using Biome formatter with configurable options.
    Supports TypeScript, JavaScript, JSX/TSX files with import organization.

OPTIONS:
    -t, --types TYPES         File types to process (default: ts,tsx,js,jsx)
    -d, --dry-run            Show changes without applying them
    -c, --check              Check if files are formatted (exit 1 if not)
    -v, --verbose            Show detailed output
    --no-organize-imports    Skip import organization
    -h, --help              Show this help message

EXAMPLES:
    # Format all TypeScript/JavaScript files in src/
    ./format-code.sh

    # Format specific directory with verbose output
    ./format-code.sh src/components --verbose

    # Check if files are properly formatted (for CI)
    ./format-code.sh --check

    # Dry run to see what would be changed
    ./format-code.sh --dry-run

    # Format only TypeScript files
    ./format-code.sh --types ts,tsx

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

# Parse arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        -t|--types)
            FILE_TYPES="$2"
            shift 2
            ;;
        -d|--dry-run)
            DRY_RUN=true
            shift
            ;;
        -c|--check)
            CHECK=true
            shift
            ;;
        -v|--verbose)
            VERBOSE=true
            shift
            ;;
        --no-organize-imports)
            ORGANIZE_IMPORTS=false
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
            DIRECTORY="$1"
            shift
            ;;
    esac
done

# Validate directory
if [[ ! -d "${DIRECTORY}" ]]; then
    log_error "Directory not found: ${DIRECTORY}"
    exit 1
fi

# Convert file types to glob pattern
IFS=',' read -ra FILE_TYPES_ARRAY <<< "${FILE_TYPES}"
GLOB_PATTERN="{${FILE_TYPES_ARRAY[*]}}"

# Check if Biome is available
if ! command -v npx &> /dev/null; then
    log_error "npx command not found. Please ensure Node.js and npm are installed."
    exit 1
fi

if ! npx biome --version &> /dev/null; then
    log_error "Biome not found. Please install it with: npm install --save-dev @biomejs/biome"
    exit 1
fi

# Build Biome command
BIOME_CMD="npx biome"
FORMAT_ARGS="format"

if [[ "${DRY_RUN}" == true ]]; then
    FORMAT_ARGS="${FORMAT_ARGS} --write=false"
else
    FORMAT_ARGS="${FORMAT_ARGS} --write"
fi

if [[ "${CHECK}" == true ]]; then
    FORMAT_ARGS="${FORMAT_ARGS} --check"
fi

# Add verbose flag for Biome if needed
if [[ "${VERBOSE}" == true ]]; then
    FORMAT_ARGS="${FORMAT_ARGS} --verbose"
fi

# Add import organization if enabled
if [[ "${ORGANIZE_IMPORTS}" == true ]]; then
    # Check if organize-imports rule is configured
    if npx biome check --rules-only | grep -q "organize/import-order"; then
        log_info "Import organization enabled"
        FORMAT_ARGS="${FORMAT_ARGS} --only=organize/import-order"
    else
        log_warning "Import organization rule not configured in Biome config"
    fi
fi

# Full command
FULL_CMD="${BIOME_CMD} ${FORMAT_ARGS} ${DIRECTORY}/**/*.{${FILE_TYPES_ARRAY[*]}}"

echo "🎨 FrontEnd UI/UX Build Plugin - Code Formatter"
echo "="
echo "Directory: ${DIRECTORY}"
echo "File types: ${FILE_TYPES}"
echo "Dry run: ${DRY_RUN}"
echo "Check mode: ${CHECK}"
echo "Import organization: ${ORGANIZE_IMPORTS}"
echo ""

if [[ "${VERBOSE}" == true ]]; then
    log_info "Executing: ${FULL_CMD}"
fi

# Execute formatting
START_TIME=$(date +%s)
EXIT_CODE=0

if eval "${FULL_CMD}"; then
    END_TIME=$(date +%s)
    DURATION=$((END_TIME - START_TIME))

    if [[ "${CHECK}" == true ]]; then
        log_success "All files are properly formatted ✓"
    elif [[ "${DRY_RUN}" == true ]]; then
        echo ""
        log_success "Dry run completed. Use without --dry-run to apply changes."
    else
        log_success "Code formatting completed successfully in ${DURATION}s"
    fi
else
    EXIT_CODE=$?

    if [[ "${CHECK}" == true ]]; then
        log_error "Some files are not properly formatted. Run without --check to fix."
        echo ""
        echo "To fix formatting issues:"
        echo "  ./format-code.sh ${DIRECTORY}"
    else
        log_error "Formatting failed with exit code: ${EXIT_CODE}"
    fi
fi

# Show summary in verbose mode
if [[ "${VERBOSE}" == true && "${CHECK}" == false ]]; then
    echo ""
    log_info "Summary:"
    echo "  Processed directory: ${DIRECTORY}"
    echo "  File types: ${FILE_TYPES_ARRAY[*]}"
    echo "  Import organization: ${ORGANIZE_IMPORTS}"
    echo "  Duration: ${DURATION}s"

    # Count files if possible
    if command -v find &> /dev/null; then
        FILE_COUNT=0
        for ext in "${FILE_TYPES_ARRAY[@]}"; do
            COUNT=$(find "${DIRECTORY}" -name "*.${ext}" -type f 2>/dev/null | wc -l || echo 0)
            FILE_COUNT=$((FILE_COUNT + COUNT))
        done
        echo "  Files processed: ${FILE_COUNT}"
    fi
fi

exit ${EXIT_CODE}
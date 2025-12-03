#!/usr/bin/env bash
set -euo pipefail

# Python Web Scraper Plugin - Post-Output Hook
# Automatically validates output after scraping completes

PLUGIN_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
VENV_PATH="${PLUGIN_DIR}/venv"
OUTPUT_DIR="${PLUGIN_DIR}/output"

# Color output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

log_info() {
    echo -e "${GREEN}[POST-OUTPUT HOOK]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[POST-OUTPUT HOOK]${NC} $1"
}

log_error() {
    echo -e "${RED}[POST-OUTPUT HOOK]${NC} $1"
}

# Check if output files were generated
find_latest_output_files() {
    log_info "Checking for new output files..."

    # Find latest items and metadata files
    ITEMS_FILE=$(find "$OUTPUT_DIR" -name "*_items_*.json" -type f -mmin -5 | sort -r | head -n 1)
    METADATA_FILE=$(find "$OUTPUT_DIR" -name "*_metadata_*.json" -type f -mmin -5 | sort -r | head -n 1)

    if [[ -z "$ITEMS_FILE" ]] || [[ -z "$METADATA_FILE" ]]; then
        log_warn "No recent output files found (modified within last 5 minutes)"
        exit 0  # Not an error, just nothing to validate
    fi

    log_info "Found items file: $(basename "$ITEMS_FILE")"
    log_info "Found metadata file: $(basename "$METADATA_FILE")"
}

# Activate virtual environment
activate_venv() {
    if [[ -d "$VENV_PATH" ]]; then
        if [[ "$OSTYPE" == "msys" || "$OSTYPE" == "win32" ]]; then
            source "${VENV_PATH}/Scripts/activate"
        else
            source "${VENV_PATH}/bin/activate"
        fi
    else
        log_error "Virtual environment not found at ${VENV_PATH}"
        log_error "Run: bash scripts/setup_environment.sh"
        exit 1
    fi
}

# Run QA cross-check
run_qa_crosscheck() {
    log_info "Running QA cross-check..."

    START_TIME=$(date +%s)

    # Execute QA cross-check script
    python3 "${PLUGIN_DIR}/scripts/qa_crosscheck.py" \
        --items-file "$ITEMS_FILE" \
        --metadata-file "$METADATA_FILE" \
        --tolerance 2% \
        --output "${PLUGIN_DIR}/logs/qa_check_$(date +%Y%m%d_%H%M%S).json"

    QA_EXIT_CODE=$?
    END_TIME=$(date +%s)
    DURATION=$((END_TIME - START_TIME))

    if [[ $QA_EXIT_CODE -eq 0 ]]; then
        log_info "✓ QA cross-check PASSED (${DURATION}s)"
        return 0
    else
        log_error "✗ QA cross-check FAILED (${DURATION}s)"
        log_error "Check logs for details: logs/qa_check_*.json"
        return 1
    fi
}

# Check hook execution time
check_execution_time() {
    HOOK_DURATION=$((END_TIME - HOOK_START_TIME))

    if [[ $HOOK_DURATION -gt 5 ]]; then
        log_warn "Hook execution took ${HOOK_DURATION}s (exceeds 5s target)"
        log_warn "Consider optimizing QA checks for large datasets"
    else
        log_info "Hook completed in ${HOOK_DURATION}s"
    fi
}

# Main execution
main() {
    HOOK_START_TIME=$(date +%s)

    find_latest_output_files

    if [[ -n "$ITEMS_FILE" ]] && [[ -n "$METADATA_FILE" ]]; then
        activate_venv
        run_qa_crosscheck
        QA_RESULT=$?

        END_TIME=$(date +%s)
        check_execution_time

        exit $QA_RESULT
    fi

    exit 0
}

main "$@"

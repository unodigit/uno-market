#!/bin/bash

# run-quality-check.sh - Comprehensive quality check for FrontEnd UI/UX Build Plugin
# Part of User Story 3: Automated Quality Enforcement

set -euo pipefail

# Colors for output
readonly RED='\033[0;31m'
readonly GREEN='\033[0;32m'
readonly YELLOW='\033[1;33m'
readonly BLUE='\033[0;34m'
readonly PURPLE='\033[0;35m'
readonly CYAN='\033[0;36m'
readonly NC='\033[0m' # No Color

# Default configuration
DEFAULT_DIRECTORY="src"
DEFAULT_FILE_TYPES="ts,tsx,js,jsx"
DEFAULT_FIX=false
DEFAULT_OUTPUT_FORMAT="text"
DEFAULT_INCLUDE_TESTS=false
DEFAULT_MIN_COVERAGE=80
DEFAULT_TIMEOUT=30000

# Parse command line arguments
DIRECTORY="${DEFAULT_DIRECTORY}"
FILE_TYPES="${DEFAULT_FILE_TYPES}"
FIX="${DEFAULT_FIX}"
OUTPUT_FORMAT="${DEFAULT_OUTPUT_FORMAT}"
INCLUDE_TESTS="${DEFAULT_INCLUDE_TESTS}"
MIN_COVERAGE="${DEFAULT_MIN_COVERAGE}"
TIMEOUT="${DEFAULT_TIMEOUT}"

# Quality check results
QUALITY_RESULTS=()
TOTAL_CHECKS=0
PASSED_CHECKS=0
FAILED_CHECKS=0

show_help() {
    cat << EOF
FrontEnd UI/UX Build Plugin - Quality Check Utility

USAGE:
    ./run-quality-check.sh [OPTIONS] [DIRECTORY]

DESCRIPTION:
    Runs comprehensive quality checks including linting, formatting, type checking,
    and test coverage for TypeScript/JavaScript codebases.

OPTIONS:
    -t, --types TYPES         File types to process (default: ts,tsx,js,jsx)
    -f, --fix                Automatically fix fixable issues
    -o, --output FORMAT      Output format: text, json, markdown (default: text)
    --include-tests          Include test files in quality checks
    --min-coverage PERCENT   Minimum test coverage percentage (default: 80)
    --timeout MS             Timeout in milliseconds for each check (default: 30000)
    -h, --help              Show this help message

QUALITY CHECKS PERFORMED:
    1. Linting (Biome)       - Code style and potential issues
    2. Formatting (Biome)    - Code formatting consistency
    3. Type Checking (TSC)   - TypeScript type validation
    4. Import Organization   - Import order and structure
    5. Test Coverage         - Unit test coverage (if tests exist)
    6. Constitution Compliance - Plugin-specific standards

EXAMPLES:
    # Run quality checks on src/ directory
    ./run-quality-check.sh

    # Auto-fix issues and include tests
    ./run-quality-check.sh --fix --include-tests

    # Output results as JSON for CI integration
    ./run-quality-check.sh --output json

    # Custom directory with 90% coverage requirement
    ./run-quality-check.sh src/components --min-coverage 90

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

log_check() {
    echo -e "${PURPLE}🔍 $1${NC}"
}

# Parse arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        -t|--types)
            FILE_TYPES="$2"
            shift 2
            ;;
        -f|--fix)
            FIX=true
            shift
            ;;
        -o|--output)
            OUTPUT_FORMAT="$2"
            shift 2
            ;;
        --include-tests)
            INCLUDE_TESTS=true
            shift
            ;;
        --min-coverage)
            MIN_COVERAGE="$2"
            shift 2
            ;;
        --timeout)
            TIMEOUT="$2"
            shift 2
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

# Validate directory - gracefully skip if not a frontend project
if [[ ! -d "${DIRECTORY}" ]]; then
    # Exit gracefully (code 0) to not block other plugins
    # This hook may run in non-frontend projects where src/ doesn't exist
    if [[ "${OUTPUT_FORMAT}" == "json" ]]; then
        echo '{"status": "skipped", "reason": "Directory not found: '"${DIRECTORY}"'", "context": "Not a frontend project"}'
    else
        log_info "Skipping quality check - directory not found: ${DIRECTORY} (not a frontend project)"
    fi
    exit 0
fi

# Also check if this looks like a frontend project (has package.json or tsconfig.json)
if [[ ! -f "package.json" && ! -f "tsconfig.json" ]]; then
    if [[ "${OUTPUT_FORMAT}" == "json" ]]; then
        echo '{"status": "skipped", "reason": "Not a frontend project (no package.json or tsconfig.json)"}'
    else
        log_info "Skipping quality check - not a frontend project (no package.json or tsconfig.json)"
    fi
    exit 0
fi

# Convert file types to glob pattern
IFS=',' read -ra FILE_TYPES_ARRAY <<< "${FILE_TYPES}"
GLOB_PATTERN="{${FILE_TYPES_ARRAY[*]}}"

# Check required tools
check_dependencies() {
    local missing_tools=()

    if ! command -v npx &> /dev/null; then
        missing_tools+=("npx (Node.js)")
    fi

    if ! npx biome --version &> /dev/null; then
        missing_tools+=("Biome")
    fi

    if ! command -v node &> /dev/null; then
        missing_tools+=("Node.js")
    fi

    if [[ ${#missing_tools[@]} -gt 0 ]]; then
        log_error "Missing dependencies: ${missing_tools[*]}"
        echo "Please install the missing tools before continuing."
        exit 1
    fi
}

# Run Biome linting check
check_linting() {
    log_check "Running linting checks..."

    local start_time=$(date +%s%3N)
    local lint_cmd="npx biome lint --max-diagnostics=50"
    local files_pattern="${DIRECTORY}/**/*.{${FILE_TYPES_ARRAY[*]}}"

    if [[ "${FIX}" == true ]]; then
        lint_cmd="${lint_cmd} --apply"
    fi

    # Add timeout
    if command -v timeout &> /dev/null; then
        timeout_s=$((TIMEOUT / 1000))
        lint_cmd="timeout ${timeout_s}s ${lint_cmd}"
    fi

    if eval "${lint_cmd} ${files_pattern}" 2>/dev/null; then
        local end_time=$(date +%s%3N)
        local duration=$((end_time - start_time))

        QUALITY_RESULTS+=("linting:PASS:Linting passed in ${duration}ms")
        ((PASSED_CHECKS++))
        log_success "Linting passed ✓"
    else
        local exit_code=$?
        QUALITY_RESULTS+=("linting:FAIL:Linting failed (exit code: ${exit_code})")
        ((FAILED_CHECKS++))
        log_error "Linting failed (exit code: ${exit_code})"
    fi

    ((TOTAL_CHECKS++))
}

# Run formatting check
check_formatting() {
    log_check "Running formatting checks..."

    local start_time=$(date +%s%3N)
    local format_cmd="npx biome format --check"
    local files_pattern="${DIRECTORY}/**/*.{${FILE_TYPES_ARRAY[*]}}"

    # Add timeout
    if command -v timeout &> /dev/null; then
        timeout_s=$((TIMEOUT / 1000))
        format_cmd="timeout ${timeout_s}s ${format_cmd}"
    fi

    if eval "${format_cmd} ${files_pattern}" 2>/dev/null; then
        local end_time=$(date +%s%3N)
        local duration=$((end_time - start_time))

        QUALITY_RESULTS+=("formatting:PASS:Formatting check passed in ${duration}ms")
        ((PASSED_CHECKS++))
        log_success "Formatting check passed ✓"
    else
        local exit_code=$?
        QUALITY_RESULTS+=("formatting:FAIL:Formatting issues detected (exit code: ${exit_code})")
        ((FAILED_CHECKS++))
        log_warning "Formatting issues detected"
    fi

    ((TOTAL_CHECKS++))
}

# Run TypeScript type checking
check_types() {
    log_check "Running TypeScript type checking..."

    # Check if TypeScript config exists
    if [[ ! -f "tsconfig.json" && ! -f "${DIRECTORY}/tsconfig.json" ]]; then
        QUALITY_RESULTS+=("types:SKIP:No TypeScript configuration found")
        log_warning "TypeScript configuration not found - skipping type checking"
        return
    fi

    local start_time=$(date +%s%3N)
    local typecheck_cmd="npx tsc --noEmit --skipLibCheck"

    # Add timeout
    if command -v timeout &> /dev/null; then
        timeout_s=$((TIMEOUT / 1000))
        typecheck_cmd="timeout ${timeout_s}s ${typecheck_cmd}"
    fi

    if eval "${typecheck_cmd}" 2>/dev/null; then
        local end_time=$(date +%s%3N)
        local duration=$((end_time - start_time))

        QUALITY_RESULTS+=("types:PASS:Type checking passed in ${duration}ms")
        ((PASSED_CHECKS++))
        log_success "Type checking passed ✓"
    else
        local exit_code=$?
        QUALITY_RESULTS+=("types:FAIL:Type errors detected (exit code: ${exit_code})")
        ((FAILED_CHECKS++))
        log_error "Type errors detected"
    fi

    ((TOTAL_CHECKS++))
}

# Check import organization
check_imports() {
    log_check "Checking import organization..."

    local start_time=$(date +%s%3N)
    local import_cmd="npx biome check --only=organize/import-order"
    local files_pattern="${DIRECTORY}/**/*.{${FILE_TYPES_ARRAY[*]}}"

    # Add timeout
    if command -v timeout &> /dev/null; then
        timeout_s=$((TIMEOUT / 1000))
        import_cmd="timeout ${timeout_s}s ${import_cmd}"
    fi

    if eval "${import_cmd} ${files_pattern}" 2>/dev/null; then
        local end_time=$(date +%s%3N)
        local duration=$((end_time - start_time))

        QUALITY_RESULTS+=("imports:PASS:Import organization check passed in ${duration}ms")
        ((PASSED_CHECKS++))
        log_success "Import organization check passed ✓"
    else
        local exit_code=$?
        QUALITY_RESULTS+=("imports:FAIL:Import organization issues detected (exit code: ${exit_code})")
        ((FAILED_CHECKS++))
        log_warning "Import organization issues detected"
    fi

    ((TOTAL_CHECKS++))
}

# Check test coverage
check_test_coverage() {
    if [[ "${INCLUDE_TESTS}" == false ]]; then
        QUALITY_RESULTS+=("coverage:SKIP:Test coverage check disabled")
        return
    fi

    log_check "Checking test coverage..."

    # Check for test files
    local test_files_count=0
    for ext in "${FILE_TYPES_ARRAY[@]}"; do
        local count=$(find "${DIRECTORY}" -name "*.${ext}" -type f 2>/dev/null | grep -c "\.test\." || echo 0)
        test_files_count=$((test_files_count + count))
    done

    if [[ $test_files_count -eq 0 ]]; then
        QUALITY_RESULTS+=("coverage:SKIP:No test files found")
        log_info "No test files found - skipping coverage check"
        return
    fi

    # Try different test runners
    local coverage_cmd=""

    if npx vitest --version &> /dev/null; then
        coverage_cmd="npx vitest run --coverage"
    elif npx jest --version &> /dev/null; then
        coverage_cmd="npx jest --coverage"
    else
        QUALITY_RESULTS+=("coverage:SKIP:No test runner (Vitest/Jest) found")
        log_info "No test runner found - skipping coverage check"
        return
    fi

    local start_time=$(date +%s%3N)

    # Add timeout
    if command -v timeout &> /dev/null; then
        timeout_s=$((TIMEOUT / 1000))
        coverage_cmd="timeout ${timeout_s}s ${coverage_cmd}"
    fi

    if eval "${coverage_cmd}" 2>/dev/null; then
        local end_time=$(date +%s%3N)
        local duration=$((end_time - start_time))

        # Extract coverage percentage (simplified)
        local coverage_percentage=0
        if [[ -f "coverage/lcov-report/index.html" ]]; then
            # Vitest/Jest coverage extraction would go here
            coverage_percentage=$(grep -o "Lines.*[0-9.]*%" coverage/lcov-report/index.html | head -1 | grep -o "[0-9.]*" || echo "0")
        fi

        if (( $(echo "${coverage_percentage} >= ${MIN_COVERAGE}" | bc -l) )); then
            QUALITY_RESULTS+=("coverage:PASS:Coverage ${coverage_percentage}% >= ${MIN_COVERAGE}% in ${duration}ms")
            ((PASSED_CHECKS++))
            log_success "Test coverage: ${coverage_percentage}% ✓"
        else
            QUALITY_RESULTS+=("coverage:FAIL:Coverage ${coverage_percentage}% < ${MIN_COVERAGE}%")
            ((FAILED_CHECKS++))
            log_error "Test coverage: ${coverage_percentage}% (required: ${MIN_COVERAGE}%)"
        fi
    else
        local exit_code=$?
        QUALITY_RESULTS+=("coverage:FAIL:Coverage check failed (exit code: ${exit_code})")
        ((FAILED_CHECKS++))
        log_error "Coverage check failed (exit code: ${exit_code})"
    fi

    ((TOTAL_CHECKS++))
}

# Check constitution compliance
check_constitution_compliance() {
    log_check "Checking constitution compliance..."

    # Run constitution validation script if available
    local validation_script="scripts/validate-constitution.js"

    if [[ -f "${validation_script}" ]]; then
        local start_time=$(date +%s%3N)

        if node "${validation_script}" "${DIRECTORY}" 2>/dev/null; then
            local end_time=$(date +%s%3N)
            local duration=$((end_time - start_time))

            QUALITY_RESULTS+=("constitution:PASS:Constitution compliance passed in ${duration}ms")
            ((PASSED_CHECKS++))
            log_success "Constitution compliance check passed ✓"
        else
            local exit_code=$?
            QUALITY_RESULTS+=("constitution:FAIL:Constitution compliance issues detected (exit code: ${exit_code})")
            ((FAILED_CHECKS++))
            log_warning "Constitution compliance issues detected"
        fi
    else
        QUALITY_RESULTS+=("constitution:SKIP:Constitution validation script not found")
        log_info "Constitution validation script not found - skipping"
    fi

    ((TOTAL_CHECKS++))
}

# Output results in specified format
output_results() {
    local success_rate=0
    if [[ $TOTAL_CHECKS -gt 0 ]]; then
        success_rate=$((PASSED_CHECKS * 100 / TOTAL_CHECKS))
    fi

    case "${OUTPUT_FORMAT}" in
        "json")
            echo "{"
            echo "  \"summary\": {"
            echo "    \"total_checks\": ${TOTAL_CHECKS},"
            echo "    \"passed_checks\": ${PASSED_CHECKS},"
            echo "    \"failed_checks\": ${FAILED_CHECKS},"
            echo "    \"success_rate\": ${success_rate},"
            echo "    \"directory\": \"${DIRECTORY}\","
            echo "    \"timestamp\": \"$(date -u +%Y-%m-%dT%H:%M:%S.%3NZ)\""
            echo "  },"
            echo "  \"checks\": ["
            for i in "${!QUALITY_RESULTS[@]}"; do
                local result="${QUALITY_RESULTS[$i]}"
                local check_name=$(echo "${result}" | cut -d: -f1)
                local status=$(echo "${result}" | cut -d: -f2)
                local message=$(echo "${result}" | cut -d: -f3-)
                echo "    {"
                echo "      \"name\": \"${check_name}\","
                echo "      \"status\": \"${status}\","
                echo "      \"message\": \"${message}\""
                echo "    }"
                if [[ $i -lt $((${#QUALITY_RESULTS[@]} - 1)) ]]; then
                    echo "    ,"
                fi
            done
            echo "  ]"
            echo "}"
            ;;
        "markdown")
            echo "# Quality Check Results"
            echo ""
            echo "**Directory:** ${DIRECTORY}"
            echo "**Timestamp:** $(date -u +%Y-%m-%dT%H:%M:%S.%3NZ)"
            echo ""
            echo "## Summary"
            echo ""
            echo "| Metric | Value |"
            echo "|--------|-------|"
            echo "| Total Checks | ${TOTAL_CHECKS} |"
            echo "| Passed | ${PASSED_CHECKS} |"
            echo "| Failed | ${FAILED_CHECKS} |"
            echo "| Success Rate | ${success_rate}% |"
            echo ""
            echo "## Check Details"
            echo ""
            for result in "${QUALITY_RESULTS[@]}"; do
                local check_name=$(echo "${result}" | cut -d: -f1)
                local status=$(echo "${result}" | cut -d: -f2)
                local message=$(echo "${result}" | cut -d: -f3-)
                local status_icon="❌"
                [[ "${status}" == "PASS" ]] && status_icon="✅"
                [[ "${status}" == "SKIP" ]] && status_icon="⏭️"

                echo "### ${check_name^} ${status_icon}"
                echo "${message}"
                echo ""
            done
            ;;
        *)
            # Default text format
            echo "📊 Quality Check Results"
            echo "="
            echo "Directory: ${DIRECTORY}"
            echo "Timestamp: $(date -u +%Y-%m-%dT%H:%M:%S.%3NZ)"
            echo ""
            echo "Summary:"
            echo "  Total checks: ${TOTAL_CHECKS}"
            echo "  Passed: ${PASSED_CHECKS}"
            echo "  Failed: ${FAILED_CHECKS}"
            echo "  Success rate: ${success_rate}%"
            echo ""
            echo "Check Details:"
            for result in "${QUALITY_RESULTS[@]}"; do
                local check_name=$(echo "${result}" | cut -d: -f1)
                local status=$(echo "${result}" | cut -d: -f2)
                local message=$(echo "${result}" | cut -d: -f3-)
                local status_icon="❌"
                [[ "${status}" == "PASS" ]] && status_icon="✅"
                [[ "${status}" == "SKIP" ]] && status_icon="⏭️"

                echo "  ${check_name^}: ${status_icon} ${message}"
            done
            ;;
    esac
}

# Main execution
main() {
    echo "🧪 FrontEnd UI/UX Build Plugin - Quality Check Utility"
    echo "="
    echo "Directory: ${DIRECTORY}"
    echo "File types: ${FILE_TYPES_ARRAY[*]}"
    echo "Auto-fix: ${FIX}"
    echo "Include tests: ${INCLUDE_TESTS}"
    echo "Min coverage: ${MIN_COVERAGE}%"
    echo ""

    # Check dependencies
    check_dependencies

    # Run all quality checks
    check_linting
    check_formatting
    check_types
    check_imports
    check_test_coverage
    check_constitution_compliance

    echo ""
    output_results

    # Exit with appropriate code
    if [[ $FAILED_CHECKS -gt 0 ]]; then
        echo ""
        log_error "Quality check completed with ${FAILED_CHECKS} failures"
        exit 1
    else
        echo ""
        log_success "All quality checks passed ✓"
        exit 0
    fi
}

# Run main function
main
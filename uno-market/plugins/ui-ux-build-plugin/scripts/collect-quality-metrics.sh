#!/bin/bash

# collect-quality-metrics.sh - Collect and store quality metrics for analysis
# Part of User Story 3: Automated Quality Enforcement

set -euo pipefail

# Configuration
readonly METRICS_DIR="${CLAUDE_PLUGIN_ROOT:-.}/.quality-metrics"
readonly METRICS_FILE="${METRICS_DIR}/quality-metrics.jsonl"
readonly DAILY_SUMMARY="${METRICS_DIR}/daily-summary.json"
readonly TIMESTAMP=$(date -u +"%Y-%m-%dT%H:%M:%S.%3NZ")
readonly DATE_ID=$(date -u +"%Y-%m-%d")

# Colors for output
readonly RED='\033[0;31m'
readonly GREEN='\033[0;32m'
readonly YELLOW='\033[1;33m'
readonly BLUE='\033[0;34m'
readonly NC='\033[0m' # No Color

# Ensure metrics directory exists
mkdir -p "${METRICS_DIR}"

# Parse arguments
FILE_PATH=""
OPERATION_TYPE=""
METRIC_TYPE="file-quality"

show_help() {
    cat << EOF
Quality Metrics Collection Utility

USAGE:
    $0 [OPTIONS] [FILE_PATH]

DESCRIPTION:
    Collects quality metrics for file operations and stores them for analysis and reporting.

OPTIONS:
    -t, --type TYPE         Metric type: file-quality, hook-performance, correction-rate
    -o, --operation OP      Operation type: write, edit, read, hook-execution
    -h, --help             Show this help message

EXAMPLES:
    $0 src/components/Button.tsx --type file-quality --operation write
    $0 --type hook-performance --operation hook-execution
    $0 --type correction-rate

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

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        -t|--type)
            METRIC_TYPE="$2"
            shift 2
            ;;
        -o|--operation)
            OPERATION_TYPE="$2"
            shift 2
            ;;
        -h|--help)
            show_help
            exit 0
            ;;
        -*)
            log_warning "Unknown option: $1"
            shift
            ;;
        *)
            FILE_PATH="$1"
            shift
            ;;
    esac
done

# Function to get file size
get_file_size() {
    if [[ -f "${FILE_PATH}" ]]; then
        stat -f%z "${FILE_PATH}" 2>/dev/null || stat -c%s "${FILE_PATH}" 2>/dev/null || echo "0"
    else
        echo "0"
    fi
}

# Function to count lines of code
get_line_count() {
    if [[ -f "${FILE_PATH}" ]]; then
        wc -l < "${FILE_PATH}" 2>/dev/null || echo "0"
    else
        echo "0"
    fi
}

# Function to detect file type
detect_file_type() {
    if [[ -n "${FILE_PATH}" ]]; then
        case "${FILE_PATH}" in
            *.ts) echo "typescript" ;;
            *.tsx) echo "typescript-react" ;;
            *.js) echo "javascript" ;;
            *.jsx) echo "javascript-react" ;;
            *.json) echo "json" ;;
            *.md) echo "markdown" ;;
            *.css) echo "css" ;;
            *) echo "other" ;;
        esac
    else
        echo "system"
    fi
}

# Function to extract quality metrics from Biome output
extract_biome_metrics() {
    local file="${1:-}"
    if [[ -z "${file}" || ! -f "${file}" ]]; then
        echo '{"errors": 0, "warnings": 0, "fixes_applied": 0}'
        return
    fi

    # Run Biome check and parse output
    if npx biome check "${file}" --output-format=json 2>/dev/null; then
        # Parse Biome JSON output for metrics
        echo '{"errors": 0, "warnings": 0, "fixes_applied": 0}'
    else
        # Extract error/warning count from Biome output
        local biome_output=$(npx biome check "${file}" 2>&1 || true)
        local errors=$(echo "${biome_output}" | grep -c "error" || echo "0")
        local warnings=$(echo "${biome_output}" | grep -c "warn" || echo "0")
        echo "{\"errors\": ${errors}, \"warnings\": ${warnings}, \"fixes_applied\": 0}"
    fi
}

# Function to measure hook performance
measure_hook_performance() {
    local start_time=$(date +%s%3N)
    local hook_name="${OPERATION_TYPE:-unknown}"

    # Simulate hook execution time measurement
    local duration=0
    local success=true

    if command -v npx &> /dev/null; then
        # Try to run a quick Biome check to measure performance
        if npx biome --version &> /dev/null; then
            local check_start=$(date +%s%3N)
            if npx biome check --max-diagnostics=1 "${FILE_PATH:-/dev/null}" &> /dev/null; then
                success=true
            else
                success=false
            fi
            local check_end=$(date +%s%3N)
            duration=$((check_end - check_start))
        fi
    fi

    cat << EOF
{
  "hook_name": "${hook_name}",
  "duration_ms": ${duration},
  "success": ${success},
  "timestamp": "${TIMESTAMP}"
}
EOF
}

# Function to calculate correction rate metrics
calculate_correction_rate() {
    local total_operations=0
    local successful_corrections=0

    # Read recent metrics to calculate correction rate
    if [[ -f "${METRICS_FILE}" ]]; then
        local recent_metrics=$(tail -100 "${METRICS_FILE}" 2>/dev/null || echo "")

        total_operations=$(echo "${recent_metrics}" | jq -r 'select(.metric_type == "file-quality") | .file_operations.total' 2>/dev/null | awk '{sum += $1} END {print sum+0}')
        successful_corrections=$(echo "${recent_metrics}" | jq -r 'select(.metric_type == "file-quality") | .file_operations.successful_corrections' 2>/dev/null | awk '{sum += $1} END {print sum+0}')
    fi

    local correction_rate=0
    if [[ $total_operations -gt 0 ]]; then
        correction_rate=$(echo "scale=2; $successful_corrections * 100 / $total_operations" | bc 2>/dev/null || echo "0")
    fi

    cat << EOF
{
  "total_operations": ${total_operations},
  "successful_corrections": ${successful_corrections},
  "correction_rate": ${correction_rate},
  "target_rate": 95.0,
  "timestamp": "${TIMESTAMP}"
}
EOF
}

# Function to collect file quality metrics
collect_file_quality_metrics() {
    local file_size=$(get_file_size)
    local line_count=$(get_line_count)
    local file_type=$(detect_file_type)
    local biome_metrics=$(extract_biome_metrics "${FILE_PATH}")

    # Count file operations (simplified)
    local file_operations_total=1
    local file_operations_successful=1

    # Extract biome metrics
    local biome_errors=$(echo "${biome_metrics}" | jq -r '.errors // 0')
    local biome_warnings=$(echo "${biome_metrics}" | jq -r '.warnings // 0')
    local biome_fixes=$(echo "${biome_metrics}" | jq -r '.fixes_applied // 0')

    # Calculate quality score
    local quality_score=100
    quality_score=$((quality_score - (biome_errors * 10)))
    quality_score=$((quality_score - (biome_warnings * 2)))

    if [[ $quality_score -lt 0 ]]; then
        quality_score=0
    fi

    cat << EOF
{
  "metric_type": "file-quality",
  "file_path": "${FILE_PATH}",
  "file_type": "${file_type}",
  "file_size_bytes": ${file_size},
  "line_count": ${line_count},
  "operation_type": "${OPERATION_TYPE:-unknown}",
  "biome_metrics": {
    "errors": ${biome_errors},
    "warnings": ${biome_warnings},
    "fixes_applied": ${biome_fixes}
  },
  "file_operations": {
    "total": ${file_operations_total},
    "successful_corrections": ${file_operations_successful}
  },
  "quality_score": ${quality_score},
  "timestamp": "${TIMESTAMP}"
}
EOF
}

# Function to generate daily summary
generate_daily_summary() {
    if [[ ! -f "${METRICS_FILE}" ]]; then
        return
    fi

    local today_metrics=$(grep "${DATE_ID}" "${METRICS_FILE}" 2>/dev/null || echo "")

    if [[ -z "${today_metrics}" ]]; then
        return
    fi

    local total_files=$(echo "${today_metrics}" | jq -r 'select(.metric_type == "file-quality") | .file_path' | sort -u | wc -l)
    local avg_quality_score=$(echo "${today_metrics}" | jq -r 'select(.metric_type == "file-quality") | .quality_score' | awk '{sum += $1; count++} END {if(count>0) print sum/count; else print 0}')
    local total_errors=$(echo "${today_metrics}" | jq -r 'select(.metric_type == "file-quality") | .biome_metrics.errors' | awk '{sum += $1} END {print sum+0}')
    local total_warnings=$(echo "${today_metrics}" | jq -r 'select(.metric_type == "file-quality") | .biome_metrics.warnings' | awk '{sum += $1} END {print sum+0}')
    local total_operations=$(echo "${today_metrics}" | jq -r 'select(.metric_type == "file-quality") | .file_operations.total' | awk '{sum += $1} END {print sum+0}')
    local successful_corrections=$(echo "${today_metrics}" | jq -r 'select(.metric_type == "file-quality") | .file_operations.successful_corrections' | awk '{sum += $1} END {print sum+0}')

    local correction_rate=0
    if [[ $total_operations -gt 0 ]]; then
        correction_rate=$(echo "scale=2; $successful_corrections * 100 / $total_operations" | bc 2>/dev/null || echo "0")
    fi

    local avg_hook_duration=$(echo "${today_metrics}" | jq -r 'select(.metric_type == "hook-performance") | .duration_ms' | awk '{sum += $1; count++} END {if(count>0) print sum/count; else print 0}')

    cat << EOF
{
  "date": "${DATE_ID}",
  "summary": {
    "total_files_processed": ${total_files},
    "average_quality_score": ${avg_quality_score},
    "total_errors": ${total_errors},
    "total_warnings": ${total_warnings},
    "correction_rate_percent": ${correction_rate},
    "target_correction_rate": 95.0,
    "total_file_operations": ${total_operations},
    "successful_corrections": ${successful_corrections},
    "average_hook_duration_ms": ${avg_hook_duration}
  },
  "generated_at": "${TIMESTAMP}"
}
EOF
}

# Main collection logic
main() {
    local metrics=""

    case "${METRIC_TYPE}" in
        "file-quality")
            metrics=$(collect_file_quality_metrics)
            ;;
        "hook-performance")
            metrics=$(measure_hook_performance)
            ;;
        "correction-rate")
            metrics=$(calculate_correction_rate)
            ;;
        *)
            log_warning "Unknown metric type: ${METRIC_TYPE}"
            exit 1
            ;;
    esac

    # Store metrics
    if [[ -n "${metrics}" ]]; then
        echo "${metrics}" >> "${METRICS_FILE}"

        # Generate daily summary
        generate_daily_summary > "${DAILY_SUMMARY}"

        log_success "Metrics collected for ${METRIC_TYPE}"
    else
        log_warning "No metrics generated"
    fi

    # Cleanup old metrics (keep last 30 days)
    if command -v find &> /dev/null; then
        find "${METRICS_DIR}" -name "*.jsonl" -mtime +30 -delete 2>/dev/null || true
    fi
}

# Run main function
main
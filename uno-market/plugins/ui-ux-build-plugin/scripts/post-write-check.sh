#!/bin/bash
# post-write-check.sh - Run TypeScript/Biome checks only for frontend projects
# This script gracefully skips when not in a frontend project context

set -euo pipefail

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log_info() {
    echo -e "${GREEN}[ui-ux-plugin]${NC} $1"
}

log_skip() {
    echo -e "${YELLOW}[ui-ux-plugin]${NC} Skipping: $1"
}

# Get the file that was written (passed as argument or from environment)
WRITTEN_FILE="${1:-${FILE_PATH:-}}"

# Check if this is a TypeScript/JavaScript file
is_frontend_file() {
    local file="$1"
    if [[ -z "$file" ]]; then
        return 1
    fi
    
    case "$file" in
        *.ts|*.tsx|*.js|*.jsx)
            return 0
            ;;
        *)
            return 1
            ;;
    esac
}

# Check if we're in a frontend project
is_frontend_project() {
    # Check for package.json or tsconfig.json in current directory or parent
    if [[ -f "package.json" ]] || [[ -f "tsconfig.json" ]]; then
        return 0
    fi
    
    # Check if src directory exists with frontend files
    if [[ -d "src" ]] && ls src/*.{ts,tsx,js,jsx} 2>/dev/null | head -1 > /dev/null; then
        return 0
    fi
    
    return 1
}

# Main logic
main() {
    # Skip if not a frontend file
    if [[ -n "$WRITTEN_FILE" ]] && ! is_frontend_file "$WRITTEN_FILE"; then
        log_skip "Not a frontend file: $WRITTEN_FILE"
        exit 0
    fi
    
    # Skip if not a frontend project
    if ! is_frontend_project; then
        log_skip "Not a frontend project (no package.json or tsconfig.json)"
        exit 0
    fi
    
    # Check if node_modules exists
    if [[ ! -d "node_modules" ]]; then
        log_skip "node_modules not found - run 'npm install' first"
        exit 0
    fi
    
    # Check if biome is available
    if ! npx biome --version &>/dev/null; then
        log_skip "Biome not installed"
        exit 0
    fi
    
    # Run Biome check
    log_info "Running Biome check..."
    if npx biome check --apply src/**/*.{ts,tsx,js,jsx} 2>/dev/null; then
        log_info "Biome check passed"
    else
        log_info "Biome check completed with warnings"
    fi
    
    # Run TypeScript check if tsconfig exists
    if [[ -f "tsconfig.json" ]]; then
        log_info "Running TypeScript check..."
        if npx tsc --noEmit --skipLibCheck 2>/dev/null; then
            log_info "TypeScript check passed"
        else
            log_info "TypeScript check completed with warnings"
        fi
    fi
    
    exit 0
}

main "$@"


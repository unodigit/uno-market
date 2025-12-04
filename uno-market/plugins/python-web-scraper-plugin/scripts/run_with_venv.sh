#!/usr/bin/env bash
# Wrapper script to ensure Python scripts run with activated venv
# Usage: ./run_with_venv.sh script.py [args...]

set -euo pipefail

# Determine plugin directory (parent of scripts/)
PLUGIN_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
VENV_PATH="${PLUGIN_DIR}/venv"

# Color output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

log_error() {
    echo -e "${RED}[ERROR]${NC} $1" >&2
}

log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

# Check if venv exists
if [[ ! -d "$VENV_PATH" ]]; then
    log_error "Virtual environment not found at: $VENV_PATH"
    log_error "Please run: ./scripts/setup_environment.sh"
    exit 1
fi

# Activate virtual environment
if [[ "$OSTYPE" == "msys" || "$OSTYPE" == "win32" ]]; then
    ACTIVATE_SCRIPT="${VENV_PATH}/Scripts/activate"
else
    ACTIVATE_SCRIPT="${VENV_PATH}/bin/activate"
fi

if [[ ! -f "$ACTIVATE_SCRIPT" ]]; then
    log_error "Activation script not found: $ACTIVATE_SCRIPT"
    exit 1
fi

# Source activation script
source "$ACTIVATE_SCRIPT"

# Verify we're using venv Python
PYTHON_PATH=$(which python3)
if [[ "$PYTHON_PATH" != *"$VENV_PATH"* ]]; then
    log_error "Failed to activate venv. Python path: $PYTHON_PATH"
    exit 1
fi

log_info "Using venv Python: $PYTHON_PATH"

# Check if script argument provided
if [[ $# -eq 0 ]]; then
    log_error "Usage: $0 <python_script> [args...]"
    exit 1
fi

SCRIPT_PATH="$1"
shift  # Remove first argument, keep the rest

# Check if script exists
if [[ ! -f "$SCRIPT_PATH" ]]; then
    log_error "Script not found: $SCRIPT_PATH"
    exit 1
fi

# Execute the Python script with remaining arguments
exec python3 "$SCRIPT_PATH" "$@"

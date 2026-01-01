#!/usr/bin/env bash
set -euo pipefail

# DeepAgents Builder Plugin - Environment Setup with uv
# Implements the constitution requirement: Environment Validation & Dependency Management

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PLUGIN_DIR="$(cd "${SCRIPT_DIR}/../.." && pwd)"
VENV_PATH="${PLUGIN_DIR}/venv"
PYTHON_MIN_VERSION="3.11"

# Color output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check Python version
check_python_version() {
    log_info "Checking Python version..."

    if ! command -v python3 &> /dev/null; then
        log_error "Python 3 not found. Please install Python ${PYTHON_MIN_VERSION} or higher."
        exit 1
    fi

    PYTHON_VERSION=$(python3 --version | awk '{print $2}')
    PYTHON_MAJOR=$(echo "$PYTHON_VERSION" | cut -d. -f1)
    PYTHON_MINOR=$(echo "$PYTHON_VERSION" | cut -d. -f2)

    if [[ "$PYTHON_MAJOR" -lt 3 ]] || [[ "$PYTHON_MAJOR" -eq 3 && "$PYTHON_MINOR" -lt 11 ]]; then
        log_error "Python ${PYTHON_MIN_VERSION}+ required. Found: ${PYTHON_VERSION}"
        exit 1
    fi

    log_info "Python ${PYTHON_VERSION} detected ✓"
}

# Detect package manager (prefer uv)
setup_package_manager() {
    log_info "Detecting package manager..."

    if command -v uv &> /dev/null; then
        PACKAGE_MANAGER="uv"
        log_info "Using uv package manager (10-100x faster) ✓"
        return 0
    fi

    log_warn "uv not found, falling back to pip"
    log_warn "Install uv for faster setup: curl -LsSf https://astral.sh/uv/install.sh | sh"
    PACKAGE_MANAGER="pip"

    if ! command -v pip3 &> /dev/null; then
        log_error "pip3 not found. Please install pip."
        exit 1
    fi

    log_info "Using pip package manager ✓"
}

# Create virtual environment
create_venv() {
    log_info "Setting up virtual environment at ${VENV_PATH}..."

    if [[ -d "$VENV_PATH" ]]; then
        log_warn "Virtual environment already exists. Skipping creation."
        return 0
    fi

    if [[ "$PACKAGE_MANAGER" == "uv" ]]; then
        uv venv "$VENV_PATH"
    else
        python3 -m venv "$VENV_PATH"
    fi

    log_info "Virtual environment created ✓"
}

# Activate virtual environment
activate_venv() {
    log_info "Activating virtual environment..."

    if [[ "$OSTYPE" == "msys" || "$OSTYPE" == "win32" ]]; then
        source "${VENV_PATH}/Scripts/activate"
    else
        source "${VENV_PATH}/bin/activate"
    fi

    log_info "Virtual environment activated ✓"
}

# Install dependencies
install_dependencies() {
    log_info "Installing deepagents package..."
    log_info "(langgraph, langchain are transitive dependencies)"

    cd "$PLUGIN_DIR"

    if [[ "$PACKAGE_MANAGER" == "uv" ]]; then
        uv pip install --upgrade pip
        uv pip install deepagents
    else
        pip3 install --upgrade pip
        pip3 install deepagents
    fi

    log_info "Dependencies installed ✓"
}

# Verify installation
verify_installation() {
    log_info "Verifying installation..."

    if python3 -c "import deepagents" 2>/dev/null; then
        log_info "deepagents package verified ✓"
    else
        log_error "deepagents import failed. Please check installation."
        exit 1
    fi

    # Verify transitive dependencies
    if python3 -c "import langgraph" 2>/dev/null; then
        log_info "langgraph (transitive) verified ✓"
    fi

    if python3 -c "import langchain" 2>/dev/null; then
        log_info "langchain (transitive) verified ✓"
    fi
}

# Create required directories
create_directories() {
    log_info "Creating required directories..."

    mkdir -p "${PLUGIN_DIR}/logs"
    mkdir -p "${PLUGIN_DIR}/output"

    log_info "Directories created ✓"
}

# Main execution
main() {
    log_info "Starting DeepAgents Builder Plugin environment setup..."
    echo ""

    check_python_version
    setup_package_manager
    create_venv
    activate_venv
    install_dependencies
    verify_installation
    create_directories

    echo ""
    log_info "✓ Environment setup complete!"
    echo ""
    log_info "To activate the virtual environment manually:"
    echo "  source ${VENV_PATH}/bin/activate  # macOS/Linux"
    echo "  ${VENV_PATH}\\Scripts\\activate  # Windows"
    echo ""
    log_info "Next steps:"
    echo "  1. Run: /deepagent:create - Create a new agent"
    echo "  2. Run: /deepagent:run - Execute an agent"
    echo ""
}

main "$@"


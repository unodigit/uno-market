#!/usr/bin/env bash
set -euo pipefail

# Python Web Scraper Plugin - Environment Setup Script
# Implements constitution requirement: Environment Validation & Dependency Management

PLUGIN_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
VENV_PATH="${PLUGIN_DIR}/venv"
PYTHON_MIN_VERSION="3.8"

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

    if [[ "$PYTHON_MAJOR" -lt 3 ]] || [[ "$PYTHON_MAJOR" -eq 3 && "$PYTHON_MINOR" -lt 8 ]]; then
        log_error "Python ${PYTHON_MIN_VERSION}+ required. Found: ${PYTHON_VERSION}"
        exit 1
    fi

    log_info "Python ${PYTHON_VERSION} detected ✓"
}

# Try to use uv, fallback to pip
setup_package_manager() {
    log_info "Detecting package manager..."

    if command -v uv &> /dev/null; then
        PACKAGE_MANAGER="uv"
        log_info "Using uv package manager (10-100x faster) ✓"
        return 0
    fi

    log_warn "uv not found, falling back to pip"
    PACKAGE_MANAGER="pip"

    if ! command -v pip3 &> /dev/null; then
        log_error "pip3 not found. Please install pip."
        exit 1
    fi

    log_info "Using pip package manager ✓"
}

# Create virtual environment
create_venv() {
    log_info "Creating virtual environment at ${VENV_PATH}..."

    if [[ -d "$VENV_PATH" ]]; then
        log_warn "Virtual environment already exists. Skipping creation."
        return 0
    fi

    python3 -m venv "$VENV_PATH"
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
    log_info "Installing dependencies..."

    cd "$PLUGIN_DIR"

    if [[ "$PACKAGE_MANAGER" == "uv" ]]; then
        uv pip install --upgrade pip
        uv pip install requests playwright playwright-stealth pydantic libcst structlog pytest
    else
        pip3 install --upgrade pip
        pip3 install requests playwright playwright-stealth pydantic libcst structlog pytest
    fi

    log_info "Dependencies installed ✓"
}

# Install Playwright browsers
install_playwright_browsers() {
    log_info "Installing Playwright browsers..."

    python3 -m playwright install chromium

    log_info "Playwright browsers installed ✓"
}

# Create required directories
create_directories() {
    log_info "Creating required directories..."

    mkdir -p "${PLUGIN_DIR}/logs"
    mkdir -p "${PLUGIN_DIR}/metrics"
    mkdir -p "${PLUGIN_DIR}/scrapers"
    mkdir -p "${PLUGIN_DIR}/output"

    log_info "Directories created ✓"
}

# Copy config templates
setup_config() {
    log_info "Setting up configuration files..."

    # Create platform_patterns.json if it doesn't exist
    if [[ ! -f "${PLUGIN_DIR}/config/platform_patterns.json" ]]; then
        cat > "${PLUGIN_DIR}/config/platform_patterns.json" <<'EOF'
{
  "shopify": {
    "detection": {
      "meta_tag": "shopify",
      "script_src": "cdn.shopify.com"
    },
    "api_endpoints": [
      "/products.json",
      "/collections/{handle}/products.json"
    ]
  },
  "wordpress": {
    "detection": {
      "meta_tag": "wordpress",
      "script_src": "wp-content"
    },
    "api_endpoints": [
      "/wp-json/wp/v2/posts",
      "/wp-json/wp/v2/pages"
    ]
  }
}
EOF
    fi

    log_info "Configuration files ready ✓"
}

# Main execution
main() {
    log_info "Starting Python Web Scraper Plugin environment setup..."
    echo ""

    check_python_version
    setup_package_manager
    create_venv
    activate_venv
    install_dependencies
    install_playwright_browsers
    create_directories
    setup_config

    echo ""
    log_info "✓ Environment setup complete!"
    echo ""
    log_info "To activate the virtual environment manually:"
    echo "  source ${VENV_PATH}/bin/activate  # macOS/Linux"
    echo "  ${VENV_PATH}\\Scripts\\activate  # Windows"
    echo ""
    log_info "Next steps:"
    echo "  1. Run: /investigate-url <url>"
    echo "  2. Run: /scrape-url <url>"
    echo ""
}

main "$@"

# Python Web Scraper Plugin - Makefile
# Convenient commands for running scripts with venv

PLUGIN_DIR := $(shell pwd)
SCRIPTS_DIR := $(PLUGIN_DIR)/scripts
VENV_DIR := $(PLUGIN_DIR)/venv
PYTHON := $(VENV_DIR)/bin/python3
WRAPPER := $(SCRIPTS_DIR)/run_with_venv.sh

# Colors
GREEN := \033[0;32m
YELLOW := \033[1;33m
NC := \033[0m # No Color

.PHONY: help setup check test clean

help:
	@echo "$(GREEN)Python Web Scraper Plugin - Available Commands$(NC)"
	@echo ""
	@echo "Setup:"
	@echo "  make setup              - Setup virtual environment and install dependencies"
	@echo "  make check              - Verify venv is properly configured"
	@echo ""
	@echo "Investigation Scripts:"
	@echo "  make investigate URL=<url>        - Discover API endpoints"
	@echo "  make detect-pagination URL=<url>  - Detect pagination strategy"
	@echo "  make analyze-dom URL=<url>        - Analyze DOM structure"
	@echo ""
	@echo "Development:"
	@echo "  make test               - Run tests"
	@echo "  make clean              - Remove venv and temporary files"
	@echo ""
	@echo "Examples:"
	@echo "  make investigate URL=https://example.com"
	@echo "  make detect-pagination URL=https://example.com/products"

setup:
	@echo "$(GREEN)Setting up environment...$(NC)"
	@bash $(SCRIPTS_DIR)/setup_environment.sh

check:
	@echo "$(GREEN)Checking virtual environment...$(NC)"
	@bash -c "source $(VENV_DIR)/bin/activate && python3 $(SCRIPTS_DIR)/ensure_venv.py"
	@echo "$(GREEN)✓ Virtual environment is properly configured$(NC)"

investigate:
ifndef URL
	@echo "$(YELLOW)Error: URL is required$(NC)"
	@echo "Usage: make investigate URL=https://example.com"
	@exit 1
endif
	@echo "$(GREEN)Investigating: $(URL)$(NC)"
	@$(WRAPPER) $(SCRIPTS_DIR)/api_discovery.py $(URL)

detect-pagination:
ifndef URL
	@echo "$(YELLOW)Error: URL is required$(NC)"
	@echo "Usage: make detect-pagination URL=https://example.com"
	@exit 1
endif
	@echo "$(GREEN)Detecting pagination: $(URL)$(NC)"
	@$(WRAPPER) $(SCRIPTS_DIR)/detect_pagination.py $(URL)

analyze-dom:
ifndef URL
	@echo "$(YELLOW)Error: URL is required$(NC)"
	@echo "Usage: make analyze-dom URL=https://example.com"
	@exit 1
endif
	@echo "$(GREEN)Analyzing DOM: $(URL)$(NC)"
	@$(WRAPPER) $(SCRIPTS_DIR)/dom_analysis.py $(URL)

test:
	@echo "$(GREEN)Running tests...$(NC)"
	@bash -c "source $(VENV_DIR)/bin/activate && pytest -v"

clean:
	@echo "$(YELLOW)Removing virtual environment and temporary files...$(NC)"
	rm -rf $(VENV_DIR)
	rm -rf $(PLUGIN_DIR)/logs/*.log
	rm -rf $(PLUGIN_DIR)/__pycache__
	rm -rf $(SCRIPTS_DIR)/__pycache__
	@echo "$(GREEN)✓ Cleanup complete$(NC)"

# Advanced targets
.PHONY: investigate-deep qa-crosscheck validate-output

investigate-deep:
ifndef URL
	@echo "$(YELLOW)Error: URL is required$(NC)"
	@exit 1
endif
	@echo "$(GREEN)Running deep investigation: $(URL)$(NC)"
	@$(WRAPPER) $(SCRIPTS_DIR)/api_discovery.py $(URL) --deep-scan

qa-crosscheck:
ifndef FILE
	@echo "$(YELLOW)Error: FILE is required$(NC)"
	@echo "Usage: make qa-crosscheck FILE=output.json"
	@exit 1
endif
	@echo "$(GREEN)Running QA crosscheck: $(FILE)$(NC)"
	@$(WRAPPER) $(SCRIPTS_DIR)/qa_crosscheck.py $(FILE)

validate-output:
ifndef FILE
	@echo "$(YELLOW)Error: FILE is required$(NC)"
	@echo "Usage: make validate-output FILE=output.json"
	@exit 1
endif
	@echo "$(GREEN)Validating output: $(FILE)$(NC)"
	@$(WRAPPER) $(SCRIPTS_DIR)/validate_output.py $(FILE)

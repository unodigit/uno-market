#!/bin/bash

# FrontEnd UI/UX Build Plugin Validation Script
# Validates that all plugin components are properly installed and functional

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Plugin information
PLUGIN_NAME="ui-ux-build-plugin"
PLUGIN_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

echo -e "${BLUE}🔍 Validating FrontEnd UI/UX Build Plugin Installation${NC}"
echo -e "${BLUE}📍 Plugin Directory: ${PLUGIN_DIR}${NC}"

# Validation counters
TOTAL_CHECKS=0
PASSED_CHECKS=0

# Helper function to run validation check
run_check() {
    local description="$1"
    local command="$2"

    echo -ne "${YELLOW}  Checking ${description}...${NC}"
    ((TOTAL_CHECKS++))

    if eval "$command" &>/dev/null; then
        echo -e " ${GREEN}✅${NC}"
        ((PASSED_CHECKS++))
        return 0
    else
        echo -e " ${RED}❌${NC}"
        return 1
    fi
}

# Validation checks
echo -e "\n${BLUE}📋 Plugin Structure Validation${NC}"

run_check "Plugin manifest exists" "[[ -f '${PLUGIN_DIR}/.claude-plugin/plugin.json' ]]"
run_check "Plugin manifest is valid JSON" "jq empty '${PLUGIN_DIR}/.claude-plugin/plugin.json'"
run_check "Commands directory exists" "[[ -d '${PLUGIN_DIR}/commands' ]]"
run_check "Agents directory exists" "[[ -d '${PLUGIN_DIR}/agents' ]]"
run_check "Hooks directory exists" "[[ -d '${PLUGIN_DIR}/hooks' ]]"
run_check "Skills directory exists" "[[ -d '${PLUGIN_DIR}/skills' ]]"
run_check "Scripts directory exists" "[[ -d '${PLUGIN_DIR}/scripts' ]]"
run_check "Config directory exists" "[[ -d '${PLUGIN_DIR}/config' ]]"
run_check "Hooks configuration exists" "[[ -f '${PLUGIN_DIR}/hooks/hooks.json' ]]"
run_check "Package.json exists" "[[ -f '${PLUGIN_DIR}/package.json' ]]"
run_check "README exists" "[[ -f '${PLUGIN_DIR}/README.md' ]]"
run_check "LICENSE exists" "[[ -f '${PLUGIN_DIR}/LICENSE' ]]"

echo -e "\n${BLUE}📁 Plugin Content Validation${NC}"

run_check "Plugin commands found" "[[ \$(find '${PLUGIN_DIR}/commands' -name '*.md' | wc -l) -gt 0 ]]"
run_check "Agent definitions found" "[[ \$(find '${PLUGIN_DIR}/agents' -name '*.md' | wc -l) -gt 0 ]]"
run_check "Skill definitions found" "[[ \$(find '${PLUGIN_DIR}/skills' -name '*.md' | wc -l) -gt 0 ]]"
run_check "Utility scripts found" "[[ \$(find '${PLUGIN_DIR}/scripts/utils' -name '*.js' 2>/dev/null | wc -l) -gt 0 ]]"

echo -e "\n${BLUE}🔧 Configuration Validation${NC}"

run_check "Design tokens exist" "[[ -f '${PLUGIN_DIR}/config/design-tokens.json' ]]"
run_check "Tailwind template exists" "[[ -f '${PLUGIN_DIR}/config/tailwind.config.template.js' ]]"
run_check "Design tokens is valid JSON" "jq empty '${PLUGIN_DIR}/config/design-tokens.json'"
run_check "Hooks configuration is valid JSON" "jq empty '${PLUGIN_DIR}/hooks/hooks.json'"

echo -e "\n${BLUE}⚡ Functionality Validation${NC}"

# Test plugin manifest fields
run_check "Plugin name in manifest" "[[ \$(jq -r '.name' '${PLUGIN_DIR}/.claude-plugin/plugin.json') == '${PLUGIN_NAME}' ]]"
run_check "Plugin version in manifest" "[[ \$(jq -r '.version' '${PLUGIN_DIR}/.claude-plugin/plugin.json') =~ ^[0-9]+\.[0-9]+\.[0-9]+$ ]]"
run_check "Plugin capabilities defined" "[[ \$(jq '.capabilities | length' '${PLUGIN_DIR}/.claude-plugin/plugin.json') -gt 0 ]]"
run_check "No external dependencies" "[[ \$(jq '.dependencies | length' '${PLUGIN_DIR}/.claude-plugin/plugin.json') -eq 0 ]]"

# Test hooks configuration
run_check "Hooks contain triggers" "[[ \$(jq '.hooks | length' '${PLUGIN_DIR}/hooks/hooks.json') -gt 0 ]]"
run_check "PostToolUse hook configured" "[[ \$(jq '.hooks[] | select(.triggers[]?.event == "PostToolUse") | length' '${PLUGIN_DIR}/hooks/hooks.json') -gt 0 ]]"

echo -e "\n${BLUE}📦 Package Validation${NC}"

if [[ -f "${PLUGIN_DIR}/package.json" ]]; then
    run_check "Package.json is valid JSON" "jq empty '${PLUGIN_DIR}/package.json'"
    run_check "Package has scripts defined" "[[ \$(jq '.scripts | keys | length' '${PLUGIN_DIR}/package.json') -gt 0 ]]"
    run_check "Package has dev dependencies" "[[ \$(jq '.devDependencies | keys | length' '${PLUGIN_DIR}/package.json') -gt 0 ]]"
fi

# Test executable permissions
run_check "Installation script is executable" "[[ -x '${PLUGIN_DIR}/scripts/install.sh' ]]"
run_check "Validation script is executable" "[[ -x '${PLUGIN_DIR}/scripts/validate-installation.sh' ]]"

# Results
echo -e "\n${BLUE}📊 Validation Results${NC}"
echo -e "Total Checks: ${TOTAL_CHECKS}"
echo -e "Passed: ${GREEN}${PASSED_CHECKS}${NC}"
echo -e "Failed: ${RED}$((TOTAL_CHECKS - PASSED_CHECKS))${NC}"

if [[ $PASSED_CHECKS -eq $TOTAL_CHECKS ]]; then
    echo -e "\n${GREEN}🎉 All validation checks passed!${NC}"
    echo -e "${GREEN}✨ The FrontEnd UI/UX Build Plugin is properly installed and ready to use.${NC}"

    # Show plugin summary
    echo -e "\n${BLUE}📋 Plugin Summary:${NC}"
    COMMAND_COUNT=$(find "${PLUGIN_DIR}/commands" -name "*.md" | wc -l)
    AGENT_COUNT=$(find "${PLUGIN_DIR}/agents" -name "*.md" | wc -l)
    SKILL_COUNT=$(find "${PLUGIN_DIR}/skills" -name "*.md" | wc -l)

    echo -e "   • Commands: ${COMMAND_COUNT}"
    echo -e "   • Agents: ${AGENT_COUNT}"
    echo -e "   • Skills: ${SKILL_COUNT}"
    echo -e "   • Capabilities: $(jq '.capabilities | length' "${PLUGIN_DIR}/.claude-plugin/plugin.json")"

    exit 0
else
    echo -e "\n${RED}❌ Validation failed with $((TOTAL_CHECKS - PASSED_CHECKS)) errors${NC}"
    echo -e "${YELLOW}💡 Please review the failed checks above and fix any issues before using the plugin.${NC}"
    exit 1
fi
#!/bin/bash

# FrontEnd UI/UX Build Plugin Installation Script
# This script installs and validates the plugin in the current Claude Code environment

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Plugin information
PLUGIN_NAME="ui-ux-build-plugin"
PLUGIN_VERSION="1.0.0"
PLUGIN_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

echo -e "${BLUE}🚀 Installing FrontEnd UI/UX Build Plugin v${PLUGIN_VERSION}${NC}"
echo -e "${BLUE}📍 Plugin Directory: ${PLUGIN_DIR}${NC}"

# Validate environment
echo -e "\n${YELLOW}🔍 Validating environment...${NC}"

# Check if Claude Code is available
if ! command -v claude &> /dev/null; then
    echo -e "${RED}❌ Claude Code CLI not found. Please install Claude Code first.${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Claude Code CLI found${NC}"

# Check plugin structure
echo -e "\n${YELLOW}📁 Validating plugin structure...${NC}"

REQUIRED_DIRS=(".claude-plugin" "commands" "agents" "hooks" "skills" "scripts" "config")
REQUIRED_FILES=(".claude-plugin/plugin.json" "package.json" "README.md" "LICENSE")

for dir in "${REQUIRED_DIRS[@]}"; do
    if [[ ! -d "${PLUGIN_DIR}/${dir}" ]]; then
        echo -e "${RED}❌ Required directory missing: ${dir}${NC}"
        exit 1
    fi
done

for file in "${REQUIRED_FILES[@]}"; do
    if [[ ! -f "${PLUGIN_DIR}/${file}" ]]; then
        echo -e "${RED}❌ Required file missing: ${file}${NC}"
        exit 1
    fi
done

echo -e "${GREEN}✅ Plugin structure validation passed${NC}"

# Validate plugin manifest
echo -e "\n${YELLOW}📋 Validating plugin manifest...${NC}"

if ! jq empty "${PLUGIN_DIR}/.claude-plugin/plugin.json" 2>/dev/null; then
    echo -e "${RED}❌ Invalid JSON in plugin.json${NC}"
    exit 1
fi

PLUGIN_NAME_FROM_MANIFEST=$(jq -r '.name' "${PLUGIN_DIR}/.claude-plugin/plugin.json")
if [[ "$PLUGIN_NAME_FROM_MANIFEST" != "$PLUGIN_NAME" ]]; then
    echo -e "${RED}❌ Plugin name mismatch in manifest${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Plugin manifest validation passed${NC}"

# Check dependencies
echo -e "\n${YELLOW}📦 Checking dependencies...${NC}"

# Check if required development dependencies are available
if [[ -f "${PLUGIN_DIR}/package.json" ]]; then
    if command -v npm &> /dev/null; then
        echo -e "${BLUE}🔄 Installing npm dependencies...${NC}"
        cd "$PLUGIN_DIR"
        npm install --production=false
        echo -e "${GREEN}✅ Dependencies installed${NC}"
    else
        echo -e "${YELLOW}⚠️  npm not found, skipping dependency installation${NC}"
    fi
fi

# Test plugin commands
echo -e "\n${YELLOW}⚡ Testing plugin commands...${NC}"

# Test if plugin commands directory has valid markdown files
COMMAND_COUNT=$(find "${PLUGIN_DIR}/commands" -name "*.md" | wc -l)
if [[ $COMMAND_COUNT -eq 0 ]]; then
    echo -e "${RED}❌ No plugin commands found${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Found ${COMMAND_COUNT} plugin commands${NC}"

# Test agent definitions
echo -e "\n${YELLOW}🤖 Testing agent definitions...${NC}"

AGENT_COUNT=$(find "${PLUGIN_DIR}/agents" -name "*.md" | wc -l)
if [[ $AGENT_COUNT -eq 0 ]]; then
    echo -e "${RED}❌ No agent definitions found${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Found ${AGENT_COUNT} agent definitions${NC}"

# Test hooks configuration
echo -e "\n${YELLOW}🪝 Testing hooks configuration...${NC}"

if [[ ! -f "${PLUGIN_DIR}/hooks/hooks.json" ]]; then
    echo -e "${RED}❌ Hooks configuration not found${NC}"
    exit 1
fi

if ! jq empty "${PLUGIN_DIR}/hooks/hooks.json" 2>/dev/null; then
    echo -e "${RED}❌ Invalid JSON in hooks.json${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Hooks configuration valid${NC}"

# Installation summary
echo -e "\n${GREEN}🎉 Plugin installation completed successfully!${NC}"
echo -e "${BLUE}📊 Installation Summary:${NC}"
echo -e "   • Plugin Name: ${PLUGIN_NAME}"
echo -e "   • Version: ${PLUGIN_VERSION}"
echo -e "   • Commands: ${COMMAND_COUNT}"
echo -e "   • Agents: ${AGENT_COUNT}"
echo -e "   • Location: ${PLUGIN_DIR}"

echo -e "\n${YELLOW}📖 Next Steps:${NC}"
echo -e "   1. Add the plugin to your Claude Code environment"
echo -e "   2. Test the slash commands: /scaffold-component, /lint-fix-all, etc."
echo -e "   3. Read the README.md for detailed usage instructions"

echo -e "\n${GREEN}✨ Happy coding with the FrontEnd UI/UX Build Plugin! ✨${NC}"
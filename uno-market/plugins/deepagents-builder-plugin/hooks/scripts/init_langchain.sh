#!/bin/bash
# Initialize LangChain environment on session start

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "🔧 Initializing LangChain DeepAgents environment..."

# Check for required API keys
check_api_key() {
    local key_name=$1
    local required=$2
    
    if [ -z "${!key_name}" ]; then
        if [ "$required" = "true" ]; then
            echo -e "${RED}❌ Missing required: $key_name${NC}"
            echo "   Set with: export $key_name=your_key"
            return 1
        else
            echo -e "${YELLOW}⚠️  Optional missing: $key_name${NC}"
        fi
    else
        echo -e "${GREEN}✓ Found: $key_name${NC}"
    fi
    return 0
}

echo ""
echo "Checking API keys..."
check_api_key "ANTHROPIC_API_KEY" "false"
check_api_key "OPENAI_API_KEY" "false"
check_api_key "LANGSMITH_API_KEY" "false"

# Check for Python packages
echo ""
echo "Checking Python packages..."

check_package() {
    local package=$1
    if python3 -c "import $package" 2>/dev/null; then
        echo -e "${GREEN}✓ $package installed${NC}"
        return 0
    else
        echo -e "${YELLOW}⚠️  $package not installed${NC}"
        echo "   Install with: pip install $package"
        return 1
    fi
}

check_package "deepagents" || true
check_package "langchain" || true
check_package "langgraph" || true

# Check for project configuration
echo ""
echo "Checking project configuration..."

if [ -f "deepagent.yaml" ] || [ -f "deepagent.json" ]; then
    echo -e "${GREEN}✓ Project configuration found${NC}"
else
    echo -e "${YELLOW}⚠️  No deepagent.yaml or deepagent.json found${NC}"
    echo "   Use /deepagent:create to start a new agent"
fi

# Set LangSmith tracing if key is available
if [ -n "$LANGSMITH_API_KEY" ]; then
    export LANGCHAIN_TRACING_V2="true"
    export LANGCHAIN_PROJECT="${LANGCHAIN_PROJECT:-default}"
    echo -e "${GREEN}✓ LangSmith tracing enabled (project: $LANGCHAIN_PROJECT)${NC}"
fi

echo ""
echo -e "${GREEN}🚀 LangChain DeepAgents ready!${NC}"
echo "   Try: /deepagent:create - Create a new agent"
echo "   Try: /deepagent:docs - Search documentation"

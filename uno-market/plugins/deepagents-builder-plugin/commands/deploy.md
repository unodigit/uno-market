---
description: Package and deploy a DeepAgent for production use
---

# Deploy DeepAgent

Package and deploy an existing DeepAgent for production environments.

## Deployment Process

### Step 1: Validate Agent

Before deployment, run comprehensive validation:

1. **Code Quality Check**
   - Run the validator subagent
   - Ensure all security checks pass
   - Verify type annotations are complete

2. **Dependency Audit**
   - Check for known vulnerabilities
   - Verify compatible package versions
   - Document all required dependencies

3. **Configuration Validation**
   - Verify all required environment variables
   - Check API key placeholders
   - Validate middleware configuration

### Step 2: Package Generation

Create a deployable Python package using `pyproject.toml`:

> **IMPORTANT:** Only list `deepagents` as a dependency. LangGraph, LangChain, and other packages are transitive dependencies that get installed automatically.

```toml
# Generated pyproject.toml
[project]
name = "my-deepagent"
version = "1.0.0"
requires-python = ">=3.11"
dependencies = [
    "deepagents>=0.3.1",
]

[project.scripts]
my-agent = "my_deepagent.main:run"

[build-system]
requires = ["setuptools>=73.0.0", "wheel"]
build-backend = "setuptools.build_meta"
```

> **Note:** Do NOT add `langgraph`, `langchain-core`, or `langchain-anthropic` - they come with `deepagents`.

### Step 3: Environment Configuration

Generate `.env.template` with required variables:

```bash
# Required API Keys
ANTHROPIC_API_KEY=your_anthropic_key_here

# Optional: LangSmith Observability
LANGSMITH_API_KEY=your_langsmith_key_here
LANGCHAIN_TRACING_V2=true
LANGCHAIN_PROJECT=my-agent-prod

# Agent Configuration
AGENT_LOG_LEVEL=INFO
AGENT_TIMEOUT=300
```

### Step 4: Docker Support (Optional)

Generate Dockerfile for containerized deployment using `uv`:

```dockerfile
FROM python:3.11-slim

WORKDIR /app

# Install uv for fast package management
RUN pip install uv

# Install dependencies using uv
COPY pyproject.toml .
RUN uv pip install --system .

# Copy agent code
COPY src/ ./src/

# Set environment
ENV PYTHONUNBUFFERED=1

# Run agent
CMD ["python", "-m", "my_deepagent.main"]
```

Alternative multi-stage build with uv:

```dockerfile
FROM ghcr.io/astral-sh/uv:python3.11-bookworm-slim

WORKDIR /app

# Copy and install dependencies
COPY pyproject.toml .
RUN uv sync --frozen

# Copy agent code
COPY src/ ./src/

ENV PYTHONUNBUFFERED=1
CMD ["uv", "run", "python", "-m", "my_deepagent.main"]
```

And docker-compose.yml:

```yaml
version: "3.8"
services:
  agent:
    build: .
    env_file: .env
    volumes:
      - ./workspace:/app/workspace
    restart: unless-stopped
```

### Step 5: Deployment Options

Present deployment options based on agent requirements:

#### Option A: Local/Server Deployment
```bash
# Install dependencies using uv (recommended)
uv sync

# Run agent
uv run my-agent --input "Your task here"

# Or install editable and run directly
uv pip install -e .
my-agent --input "Your task here"
```

#### Option B: Docker Deployment
```bash
# Build and run
docker-compose up -d

# View logs
docker-compose logs -f agent
```

#### Option C: Cloud Deployment (LangGraph Platform)
```bash
# Deploy to LangGraph Cloud
langgraph deploy --config langgraph.json
```

#### Option D: API Server Mode
Generate FastAPI wrapper for HTTP access:

```python
from fastapi import FastAPI
from pydantic import BaseModel
from my_deepagent import agent

app = FastAPI()

class AgentRequest(BaseModel):
    input: str
    config: dict = {}

@app.post("/invoke")
async def invoke_agent(request: AgentRequest):
    result = await agent.ainvoke(
        {"messages": [{"role": "user", "content": request.input}]},
        config=request.config
    )
    return result

@app.post("/stream")
async def stream_agent(request: AgentRequest):
    async def generate():
        async for chunk in agent.astream(
            {"messages": [{"role": "user", "content": request.input}]},
            config=request.config
        ):
            yield f"data: {json.dumps(chunk)}\n\n"
    return StreamingResponse(generate(), media_type="text/event-stream")
```

### Step 6: Generate Deployment Artifacts

Create the following files:

1. **pyproject.toml** - Package configuration
2. **.env.template** - Environment variable template
3. **Dockerfile** (optional) - Container definition
4. **docker-compose.yml** (optional) - Container orchestration
5. **README.md** - Deployment instructions
6. **langgraph.json** (optional) - LangGraph Platform config

## Output

Provide the user with:
1. Generated package structure
2. Deployment commands for chosen platform
3. Health check and monitoring recommendations
4. Rollback procedures

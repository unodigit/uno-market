---
description: Run comprehensive tests for a DeepAgent including unit, integration, and evaluation tests
---

# Test DeepAgent

Run comprehensive test suites to validate agent functionality, reliability, and performance.

## Test Categories

### 1. Unit Tests

Test individual components in isolation:

```python
import pytest
from my_agent import tools, nodes

class TestTools:
    """Test individual tool functions."""

    def test_search_tool_returns_results(self):
        result = tools.search_web("test query")
        assert isinstance(result, str)
        assert len(result) > 0

    def test_search_tool_handles_empty_query(self):
        with pytest.raises(ValueError):
            tools.search_web("")

    def test_tool_respects_max_results(self):
        result = tools.search_web("query", max_results=3)
        # Validate result count
        assert result.count("result") <= 3


class TestNodes:
    """Test workflow nodes."""

    def test_node_returns_state_update(self):
        state = {"messages": [], "step": "initial"}
        result = nodes.process_node(state)
        assert isinstance(result, dict)
        assert "step" in result or "messages" in result

    def test_node_handles_empty_state(self):
        result = nodes.process_node({})
        assert result is not None
```

### 2. Integration Tests

Test agent end-to-end functionality:

```python
import pytest
from my_agent import agent

class TestAgentIntegration:
    """Test complete agent workflows."""

    @pytest.fixture
    def agent_instance(self):
        return agent

    @pytest.mark.asyncio
    async def test_simple_query(self, agent_instance):
        result = await agent_instance.ainvoke({
            "messages": [{"role": "user", "content": "Hello, what can you do?"}]
        })
        assert "messages" in result
        assert len(result["messages"]) > 0

    @pytest.mark.asyncio
    async def test_tool_invocation(self, agent_instance):
        result = await agent_instance.ainvoke({
            "messages": [{"role": "user", "content": "Search for Python tutorials"}]
        })
        # Verify tool was called
        messages = result["messages"]
        tool_calls = [m for m in messages if hasattr(m, "tool_calls")]
        assert len(tool_calls) > 0

    @pytest.mark.asyncio
    async def test_error_recovery(self, agent_instance):
        # Test with intentionally problematic input
        result = await agent_instance.ainvoke({
            "messages": [{"role": "user", "content": "Process this malformed: {{{"}]
        })
        # Agent should handle gracefully
        assert result is not None
```

### 3. Streaming Tests

Validate streaming behavior:

```python
@pytest.mark.asyncio
async def test_streaming_output(agent_instance):
    chunks = []
    async for chunk in agent_instance.astream({
        "messages": [{"role": "user", "content": "Write a short poem"}]
    }):
        chunks.append(chunk)

    assert len(chunks) > 1  # Should receive multiple chunks
    # Final chunk should have complete response
    assert "messages" in chunks[-1]
```

### 4. HITL Tests

Test human-in-the-loop interrupts:

```python
@pytest.mark.asyncio
async def test_hitl_interrupt(agent_instance):
    from langgraph.checkpoint.memory import MemorySaver

    memory = MemorySaver()
    config = {"configurable": {"thread_id": "test-thread"}}

    # Run until interrupt
    result = None
    async for event in agent_instance.astream(
        {"messages": [{"role": "user", "content": "Send an email to test@example.com"}]},
        config=config
    ):
        if "interrupt" in event:
            # Verify interrupt contains expected data
            assert "tool_name" in event["interrupt"]
            assert "args" in event["interrupt"]
            result = event
            break

    assert result is not None, "Expected HITL interrupt"
```

### 5. Performance Tests

Measure agent performance characteristics:

```python
import time
import statistics

@pytest.mark.asyncio
async def test_response_latency(agent_instance):
    latencies = []

    for _ in range(5):
        start = time.time()
        await agent_instance.ainvoke({
            "messages": [{"role": "user", "content": "What is 2+2?"}]
        })
        latencies.append(time.time() - start)

    avg_latency = statistics.mean(latencies)
    p95_latency = sorted(latencies)[int(len(latencies) * 0.95)]

    assert avg_latency < 10.0, f"Average latency {avg_latency}s exceeds 10s"
    assert p95_latency < 15.0, f"P95 latency {p95_latency}s exceeds 15s"


@pytest.mark.asyncio
async def test_memory_usage(agent_instance):
    import tracemalloc

    tracemalloc.start()

    for i in range(10):
        await agent_instance.ainvoke({
            "messages": [{"role": "user", "content": f"Task {i}"}]
        })

    current, peak = tracemalloc.get_traced_memory()
    tracemalloc.stop()

    # Peak memory should stay under 500MB
    assert peak < 500 * 1024 * 1024, f"Peak memory {peak / 1024 / 1024:.1f}MB exceeds 500MB"
```

### 6. Evaluation Tests (LangSmith)

Run evaluations with LangSmith:

```python
from langsmith import Client
from langsmith.evaluation import evaluate

def test_agent_with_langsmith_eval():
    client = Client()

    # Define evaluation dataset
    dataset = client.create_dataset("agent-eval-dataset")

    # Add examples
    examples = [
        {"input": "What is the capital of France?", "expected": "Paris"},
        {"input": "Calculate 15% of 200", "expected": "30"},
    ]

    for ex in examples:
        client.create_example(
            inputs={"query": ex["input"]},
            outputs={"answer": ex["expected"]},
            dataset_id=dataset.id
        )

    # Run evaluation
    def run_agent(inputs: dict) -> dict:
        result = agent.invoke({
            "messages": [{"role": "user", "content": inputs["query"]}]
        })
        return {"response": result["messages"][-1].content}

    results = evaluate(
        run_agent,
        data=dataset.name,
        evaluators=["correctness", "helpfulness"],
    )

    # Assert minimum scores
    assert results.aggregate_metrics["correctness"] >= 0.8
```

## Running Tests

### Basic Test Run
```bash
# Run all tests
pytest tests/ -v

# Run with coverage
pytest tests/ --cov=my_agent --cov-report=html

# Run specific category
pytest tests/ -k "unit" -v
pytest tests/ -k "integration" -v
```

### CI/CD Integration
```yaml
# .github/workflows/test.yml
name: Agent Tests
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-python@v5
        with:
          python-version: "3.11"

      - name: Install dependencies
        run: pip install -e ".[test]"

      - name: Run tests
        env:
          ANTHROPIC_API_KEY: ${{ secrets.ANTHROPIC_API_KEY }}
        run: pytest tests/ -v --cov=my_agent

      - name: Upload coverage
        uses: codecov/codecov-action@v4
```

## Output

Generate and display:
1. Test results summary (passed/failed/skipped)
2. Coverage report
3. Performance metrics
4. Failed test details with suggestions
5. LangSmith evaluation links (if configured)

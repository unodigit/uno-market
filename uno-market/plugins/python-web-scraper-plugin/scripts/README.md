# Python Scripts - Virtual Environment Management

This directory contains Python scripts for the web scraper plugin. All scripts require the virtual environment to be activated before execution.

## Quick Start

### 1. Setup Environment (First Time Only)

```bash
cd /path/to/python-web-scraper-plugin
./scripts/setup_environment.sh
```

This creates the venv, installs dependencies, and sets up required directories.

## Running Scripts

There are **three ways** to ensure scripts run in the venv:

### Option 1: Use the Wrapper Script (Recommended)

The wrapper script automatically activates the venv before running any Python script:

```bash
# Run any Python script with venv activated
./scripts/run_with_venv.sh scripts/api_discovery.py https://example.com

# Pass arguments normally
./scripts/run_with_venv.sh scripts/detect_pagination.py https://example.com --timeout 60
```

**Pros:**
- No code changes needed
- Works with any Python script
- Validates venv exists before running
- Clear error messages if venv not found

**Cons:**
- Slightly more verbose command

### Option 2: Import `ensure_venv` in Scripts

Add a venv check at the top of each Python script:

```python
#!/usr/bin/env python3
"""Your script docstring"""

# Add these lines at the top
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent))
from ensure_venv import ensure_venv

# Verify venv is activated (raises RuntimeError if not)
ensure_venv()

# ... rest of your script
```

Then run scripts directly:

```bash
python3 scripts/api_discovery.py https://example.com
```

**Pros:**
- Self-contained validation
- Clear error messages with fix instructions
- Can be run directly with python3

**Cons:**
- Requires modifying each script
- Adds boilerplate code

### Option 3: Activate Venv Manually

Activate the venv in your shell, then run scripts normally:

```bash
# Activate venv
source venv/bin/activate  # macOS/Linux
# OR
venv\Scripts\activate     # Windows

# Run scripts
python3 scripts/api_discovery.py https://example.com
python3 scripts/detect_pagination.py https://example.com
```

**Pros:**
- Traditional workflow
- No wrapper or code changes needed
- Venv stays active for multiple commands

**Cons:**
- Easy to forget activation
- Must remember to activate in each shell session

### Option 4: Use Venv Python Directly

Use the venv's Python interpreter directly:

```bash
./venv/bin/python3 scripts/api_discovery.py https://example.com
```

**Pros:**
- Guaranteed to use venv Python
- No activation needed
- No code changes

**Cons:**
- Longer command
- Path differs on Windows

## Available Scripts

| Script | Purpose | Example Usage |
|--------|---------|---------------|
| `setup_environment.sh` | Initial environment setup | `./scripts/setup_environment.sh` |
| `run_with_venv.sh` | Wrapper to run scripts with venv | `./scripts/run_with_venv.sh scripts/api_discovery.py <url>` |
| `ensure_venv.py` | Venv validation utility | `from ensure_venv import ensure_venv` |
| `api_discovery.py` | Discover API endpoints | `./scripts/run_with_venv.sh scripts/api_discovery.py <url>` |
| `detect_pagination.py` | Detect pagination strategy | `./scripts/run_with_venv.sh scripts/detect_pagination.py <url>` |
| `dom_analysis.py` | Analyze DOM structure | `./scripts/run_with_venv.sh scripts/dom_analysis.py <url>` |
| `qa_crosscheck.py` | QA validation | `./scripts/run_with_venv.sh scripts/qa_crosscheck.py <file>` |

## Integration with Claude Code Slash Commands

If you're using these scripts from Claude Code slash commands, update your command files to use the wrapper:

```bash
# In .claude/commands/investigate-url.md
#!/usr/bin/env bash
cd "$PLUGIN_DIR"
./scripts/run_with_venv.sh scripts/api_discovery.py "$1"
```

## Troubleshooting

### "Virtual environment not found"

Run the setup script:
```bash
./scripts/setup_environment.sh
```

### "Module not found" errors

Ensure dependencies are installed:
```bash
source venv/bin/activate
pip install requests playwright playwright-stealth pydantic libcst structlog pytest
```

Or re-run setup:
```bash
./scripts/setup_environment.sh
```

### "Failed to activate venv"

Check if venv activation script exists:
```bash
ls -la venv/bin/activate  # macOS/Linux
ls -la venv\Scripts\activate  # Windows
```

If missing, delete venv and re-run setup:
```bash
rm -rf venv
./scripts/setup_environment.sh
```

## Development Workflow

### Recommended: Use Wrapper for All Scripts

```bash
# Investigation workflow
./scripts/run_with_venv.sh scripts/api_discovery.py https://example.com
./scripts/run_with_venv.sh scripts/detect_pagination.py https://example.com
./scripts/run_with_venv.sh scripts/dom_analysis.py https://example.com

# Generate scraper
./scripts/run_with_venv.sh scripts/refactor_scraper.py investigation_report.json

# Validate output
./scripts/run_with_venv.sh scripts/validate_output.py scraper_output.json
```

### Alternative: Activate Once, Run Multiple Times

```bash
# Activate venv
source venv/bin/activate

# Run multiple scripts
python3 scripts/api_discovery.py https://example.com
python3 scripts/detect_pagination.py https://example.com
python3 scripts/dom_analysis.py https://example.com

# Deactivate when done
deactivate
```

## Environment Variables

The following environment variables are set when using the wrapper or activating venv:

- `VIRTUAL_ENV`: Path to venv directory
- `PATH`: Prepended with venv/bin
- `PYTHONHOME`: Unset (to use venv)

## Best Practices

1. **Always use wrapper or activate venv** - Don't rely on system Python
2. **Don't commit venv/** - It's in .gitignore for a reason
3. **Update dependencies** - Document any new packages in constitution
4. **Test scripts** - Verify they work with all three execution methods
5. **Use UV when available** - 10-100x faster than pip

## Further Reading

- [Python venv documentation](https://docs.python.org/3/library/venv.html)
- [UV package manager](https://github.com/astral-sh/uv)
- Plugin constitution: `../PROJECT_CONSTITUTION.md`

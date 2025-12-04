# Virtual Environment - Quick Reference

## TL;DR - Just Tell Me What To Do

### First Time Setup
```bash
./scripts/setup_environment.sh
```

### Running Scripts (Choose One Method)

**Method 1: Use Makefile (Easiest)**
```bash
make investigate URL=https://example.com
make detect-pagination URL=https://example.com/products
```

**Method 2: Use Wrapper Script**
```bash
./scripts/run_with_venv.sh scripts/api_discovery.py https://example.com
```

**Method 3: Activate Venv Manually**
```bash
source venv/bin/activate
python3 scripts/api_discovery.py https://example.com
```

---

## What I Need To Know

### Problem
Python scripts need the virtual environment activated to access installed packages (requests, playwright, etc.).

### Solution
We've implemented **3 different approaches** - use whichever fits your workflow:

| Method | Command | When To Use |
|--------|---------|-------------|
| **Makefile** | `make investigate URL=...` | Quick commands, don't want to remember script names |
| **Wrapper** | `./scripts/run_with_venv.sh script.py` | Need full control, scripting, automation |
| **Manual** | `source venv/bin/activate && python3 script.py` | Traditional workflow, running multiple commands |

### What Was Added

1. **`run_with_venv.sh`** - Wrapper that activates venv before running scripts
   - Auto-validates venv exists
   - Clear error messages
   - Works on macOS/Linux/Windows

2. **`ensure_venv.py`** - Python module for venv validation
   - Import at top of scripts
   - Raises error if not in venv
   - Helpful fix instructions

3. **`Makefile`** - Convenient make targets
   - `make investigate URL=<url>`
   - `make detect-pagination URL=<url>`
   - `make setup`, `make check`, `make clean`

4. **Updated Scripts** - Added venv checks to:
   - `api_discovery.py`
   - `detect_pagination.py`
   - (Others can be updated similarly)

5. **Documentation**
   - `scripts/README.md` - Full guide with troubleshooting
   - This quick reference

### Files Modified/Created

```
python-web-scraper-plugin/
├── Makefile                        # NEW - Make targets for easy commands
└── scripts/
    ├── run_with_venv.sh           # NEW - Wrapper script
    ├── ensure_venv.py             # NEW - Venv validation module
    ├── README.md                  # NEW - Complete documentation
    ├── VENV_QUICK_REFERENCE.md    # NEW - This file
    ├── api_discovery.py           # MODIFIED - Added venv check
    └── detect_pagination.py       # MODIFIED - Added venv check
```

---

## Common Commands

### Setup & Validation
```bash
# First time setup
make setup

# Verify venv is working
make check

# Clean and rebuild
make clean && make setup
```

### Investigation Workflow
```bash
# Investigate a URL
make investigate URL=https://example.com

# Detect pagination
make detect-pagination URL=https://example.com/products

# Analyze DOM structure
make analyze-dom URL=https://example.com
```

### Direct Script Execution
```bash
# Using wrapper
./scripts/run_with_venv.sh scripts/api_discovery.py https://example.com --timeout 60

# Using make
make investigate URL=https://example.com

# Manual activation
source venv/bin/activate
python3 scripts/api_discovery.py https://example.com
deactivate
```

---

## Troubleshooting

### "Virtual environment not found"
```bash
make setup
```

### "Module not found" (requests, playwright, etc.)
```bash
source venv/bin/activate
pip install requests playwright playwright-stealth pydantic libcst structlog pytest
```

### Scripts fail even with venv activated
```bash
# Check if you're actually in venv
which python3
# Should output: /path/to/plugin/venv/bin/python3

# If not, try:
deactivate  # If already activated
source venv/bin/activate
```

### Make commands not working
```bash
# Ensure Makefile is executable
chmod +x scripts/run_with_venv.sh

# Use full path if needed
make -f /path/to/Makefile investigate URL=https://example.com
```

---

## Integration with Claude Code

### Slash Commands
Update your `.claude/commands/*.md` files to use the wrapper:

```bash
#!/usr/bin/env bash
# In .claude/commands/investigate-url.md
cd "${PLUGIN_DIR}"
./scripts/run_with_venv.sh scripts/api_discovery.py "$1"
```

### Agents
When spawning agents that run Python scripts, use the wrapper:

```typescript
// In agent configuration
{
  command: "./scripts/run_with_venv.sh",
  args: ["scripts/api_discovery.py", targetUrl]
}
```

---

## Next Steps

### Option A: Keep Current Approach
- Scripts have venv checks built-in
- Continue using make/wrapper as needed

### Option B: Update All Scripts
Add venv check to remaining scripts:

```python
# Add to top of each script
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent))
try:
    from ensure_venv import ensure_venv
    ensure_venv()
except RuntimeError as e:
    print(f"ERROR: {e}", file=sys.stderr)
    sys.exit(1)
```

### Option C: Standardize on One Method
Pick your favorite method and document it in the project README.

---

## Further Reading

- Full documentation: `scripts/README.md`
- Setup script: `scripts/setup_environment.sh`
- Wrapper implementation: `scripts/run_with_venv.sh`
- Venv validation: `scripts/ensure_venv.py`

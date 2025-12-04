#!/usr/bin/env python3
"""
Utility module to ensure scripts run within the virtual environment.
Import this at the top of any script that requires the venv.

Usage:
    from ensure_venv import ensure_venv
    ensure_venv()
"""

import os
import sys
from pathlib import Path


def ensure_venv() -> None:
    """
    Verify the script is running within the virtual environment.

    Raises:
        RuntimeError: If not running in venv
    """
    # Get plugin directory (parent of scripts/)
    plugin_dir = Path(__file__).parent.parent.resolve()
    venv_path = plugin_dir / "venv"

    # Check if venv exists
    if not venv_path.exists():
        raise RuntimeError(
            f"Virtual environment not found at: {venv_path}\n"
            f"Please run: ./scripts/setup_environment.sh"
        )

    # Check if we're running in venv
    # Method 1: Check sys.prefix
    venv_prefix = str(venv_path.resolve())
    sys_prefix = str(Path(sys.prefix).resolve())

    if sys_prefix != venv_prefix:
        # Method 2: Check VIRTUAL_ENV environment variable
        virtual_env = os.environ.get("VIRTUAL_ENV")
        if not virtual_env or str(Path(virtual_env).resolve()) != venv_prefix:
            raise RuntimeError(
                f"Script must run within virtual environment!\n"
                f"Expected: {venv_prefix}\n"
                f"Current:  {sys_prefix}\n\n"
                f"To fix this, either:\n"
                f"1. Activate venv: source {venv_path}/bin/activate\n"
                f"2. Use wrapper: ./scripts/run_with_venv.sh {sys.argv[0]}\n"
                f"3. Use venv Python: {venv_path}/bin/python3 {sys.argv[0]}"
            )

    # Verify required packages are available
    try:
        import requests
        import playwright
    except ImportError as e:
        raise RuntimeError(
            f"Required package not found: {e}\n"
            f"Please run: source {venv_path}/bin/activate && pip install -r requirements.txt"
        )


def get_venv_python() -> Path:
    """
    Get path to venv Python interpreter.

    Returns:
        Path to venv Python executable
    """
    plugin_dir = Path(__file__).parent.parent.resolve()
    venv_path = plugin_dir / "venv"

    if os.name == "nt":  # Windows
        return venv_path / "Scripts" / "python.exe"
    else:  # Unix-like
        return venv_path / "bin" / "python3"


if __name__ == "__main__":
    """Test venv detection"""
    try:
        ensure_venv()
        print("✓ Running in virtual environment")
        print(f"  Python: {sys.executable}")
        print(f"  sys.prefix: {sys.prefix}")
    except RuntimeError as e:
        print(f"✗ {e}", file=sys.stderr)
        sys.exit(1)

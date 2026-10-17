"""
api/index.py - Vercel Python Function entrypoint.

Vercel detects a top-level ASGI `app` and serves it. The FastAPI routes are already
declared with their /api prefix (/api/health, /api/world/summary, ...), so vercel.json
rewrites /api/(.*) here and the paths line up without changing a single route.

The package lives under src/ (hatchling layout), which is not on sys.path in the
function sandbox, so it is added explicitly before the import.
"""

import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "src"))

from jaal.api.app import app  # noqa: E402

__all__ = ["app"]

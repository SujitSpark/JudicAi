"""Export the API's responses to static JSON for the frontend demo mode.

Usage (after seeding a database with scripts/seed_supreme_court.py):
    DATABASE_URL=sqlite:///path/to/demo.db python scripts/export_demo_snapshot.py
Writes frontend/public/demo/*.json. The data is synthetic.
"""
import asyncio, json, os, sys, types
from datetime import datetime, timezone

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.append(os.path.join(ROOT, "backend"))

import httpx
from app.main import app
from app.api import deps
from app.models import models

OUT = os.path.join(ROOT, "frontend", "public", "demo")
ENDPOINTS = {
    "cases": "/cases?limit=1000",
    "kpis": "/dashboard/kpis",
    "insights": "/dashboard/insights",
    "memos": "/cases/support/memos",
    "hearings": "/cases/support/hearings",
    "logs": "/dashboard/logs",
}

app.dependency_overrides[deps.get_current_user] = lambda: types.SimpleNamespace(
    role=models.UserRole.REGISTRAR, user_id=0)


async def main():
    os.makedirs(OUT, exist_ok=True)
    async with httpx.AsyncClient(transport=httpx.ASGITransport(app=app), base_url="http://demo") as c:
        for name, path in ENDPOINTS.items():
            r = await c.get(path)
            r.raise_for_status()
            with open(os.path.join(OUT, f"{name}.json"), "w", encoding="utf-8") as f:
                json.dump(r.json(), f, indent=1)
            print(f"{name}: ok")
    with open(os.path.join(OUT, "meta.json"), "w", encoding="utf-8") as f:
        json.dump({"exported_at": datetime.now(timezone.utc).isoformat(timespec="minutes")}, f)


if __name__ == "__main__":
    asyncio.run(main())

"""Initialize the CRM database from db/schema.sql.

Run once before starting the bot:
    py -3 scripts/init_db.py
"""

import asyncio
import os
import sys
from pathlib import Path

import aiosqlite
from dotenv import load_dotenv

load_dotenv()

REPO_ROOT = Path(__file__).parent.parent
SCHEMA_PATH = REPO_ROOT / "db" / "schema.sql"
DB_PATH = Path(os.getenv("DB_PATH", str(REPO_ROOT / "db" / "crm.db")))


async def initialize_database() -> None:
    schema_sql = SCHEMA_PATH.read_text(encoding="utf-8")

    DB_PATH.parent.mkdir(parents=True, exist_ok=True)

    async with aiosqlite.connect(DB_PATH) as db:
        await db.execute("PRAGMA journal_mode = WAL")
        await db.execute("PRAGMA foreign_keys = ON")
        await db.executescript(schema_sql)
        await db.commit()

    print(f"Database initialized at {DB_PATH}")


if __name__ == "__main__":
    if not SCHEMA_PATH.exists():
        print(f"ERROR: Schema file not found at {SCHEMA_PATH}", file=sys.stderr)
        sys.exit(1)

    asyncio.run(initialize_database())

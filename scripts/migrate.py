from __future__ import annotations

import asyncio
import os
import sys
from pathlib import Path

import aiosqlite
from dotenv import load_dotenv

load_dotenv()

REPO_ROOT = Path(__file__).parent.parent
MIGRATIONS_DIR = REPO_ROOT / "db" / "migrations"
DB_PATH = Path(os.getenv("DB_PATH", str(REPO_ROOT / "db" / "crm.db")))


async def run_migrations() -> None:
    if not DB_PATH.exists():
        print(f"ERROR: Database not found at {DB_PATH}. Run scripts/init_db.py first.", file=sys.stderr)
        sys.exit(1)

    migration_files = sorted(MIGRATIONS_DIR.glob("*.sql"))
    if not migration_files:
        print("No migration files found in db/migrations/")
        return

    async with aiosqlite.connect(DB_PATH) as db:
        await db.execute("PRAGMA foreign_keys = ON")
        await db.execute("PRAGMA journal_mode = WAL")

        await db.execute("""
            CREATE TABLE IF NOT EXISTS _migrations (
                filename   TEXT PRIMARY KEY,
                applied_at TEXT DEFAULT (datetime('now'))
            )
        """)
        await db.commit()

        async with db.execute("SELECT filename FROM _migrations") as cursor:
            applied = {row[0] async for row in cursor}

        pending = [f for f in migration_files if f.name not in applied]

        if not pending:
            print("All migrations already applied.")
            return

        for migration_file in pending:
            sql = migration_file.read_text(encoding="utf-8")
            print(f"Applying {migration_file.name}...", end=" ")
            await db.executescript(sql)
            await db.execute(
                "INSERT INTO _migrations (filename) VALUES (?)", (migration_file.name,)
            )
            await db.commit()
            print("done")

    print(f"Applied {len(pending)} migration(s).")


if __name__ == "__main__":
    asyncio.run(run_migrations())

from __future__ import annotations

from datetime import date, timedelta
from typing import Any

import aiosqlite


def _followup_date(tier: str) -> str:
    days = {"vip": 21, "acquaintance": 42, "broader": 90}.get(tier, 30)
    return (date.today() + timedelta(days=days)).isoformat()


def _today() -> str:
    return date.today().isoformat()


async def _open(db_path: str) -> aiosqlite.Connection:
    db = await aiosqlite.connect(db_path)
    db.row_factory = aiosqlite.Row
    await db.execute("PRAGMA foreign_keys = ON")
    await db.execute("PRAGMA journal_mode = WAL")
    return db


def _row_to_dict(row: aiosqlite.Row) -> dict[str, Any]:
    return dict(row)


async def crm_add_contact(
    db_path: str,
    *,
    name: str,
    tier: str,
    email: str | None = None,
    phone: str | None = None,
    location: str | None = None,
    company: str | None = None,
    industry: str | None = None,
    role: str | None = None,
    birthday: str | None = None,
    how_met: str | None = None,
    notes: str | None = None,
    next_followup: str | None = None,
) -> dict:
    computed_followup = next_followup or _followup_date(tier)
    try:
        async with await _open(db_path) as db:
            cursor = await db.execute(
                """
                INSERT INTO contacts
                    (name, tier, email, phone, location, company, industry,
                     role, birthday, how_met, notes, next_followup)
                VALUES
                    (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (name, tier, email, phone, location, company, industry,
                 role, birthday, how_met, notes, computed_followup),
            )
            await db.commit()
            return {
                "success": True,
                "id": cursor.lastrowid,
                "message": f"Added {name} ({tier})",
                "next_followup": computed_followup,
            }
    except Exception as exc:
        return {"success": False, "error": str(exc)}


async def crm_update_contact(
    db_path: str,
    *,
    id: int,
    fields: dict[str, Any],
) -> dict:
    if not fields:
        return {"success": False, "error": "No fields to update"}
    set_clause = ", ".join(f"{key} = ?" for key in fields)
    values = list(fields.values()) + [id]
    try:
        async with await _open(db_path) as db:
            await db.execute(
                f"UPDATE contacts SET {set_clause} WHERE id = ?", values
            )
            await db.commit()
        return {"success": True, "message": f"Updated contact {id}"}
    except Exception as exc:
        return {"success": False, "error": str(exc)}


async def crm_find_contact(db_path: str, *, query: str) -> dict:
    pattern = f"%{query}%"
    try:
        async with await _open(db_path) as db:
            async with db.execute(
                """
                SELECT * FROM contacts
                WHERE name LIKE ? OR company LIKE ? OR notes LIKE ?
                ORDER BY (tier = 'vip') DESC, name ASC
                LIMIT 5
                """,
                (pattern, pattern, pattern),
            ) as cursor:
                contacts = [_row_to_dict(row) async for row in cursor]

            results = []
            for contact in contacts:
                async with db.execute(
                    """
                    SELECT type, summary, date FROM interactions
                    WHERE contact_id = ? ORDER BY date DESC LIMIT 3
                    """,
                    (contact["id"],),
                ) as icursor:
                    interactions = [_row_to_dict(r) async for r in icursor]
                results.append({**contact, "recent_interactions": interactions})

        return {"success": True, "results": results}
    except Exception as exc:
        return {"success": False, "error": str(exc)}


async def crm_list_contacts(
    db_path: str,
    *,
    tier: str | None = None,
    limit: int = 20,
) -> dict:
    try:
        async with await _open(db_path) as db:
            if tier:
                async with db.execute(
                    """
                    SELECT id, name, tier, company, role, last_contact, next_followup
                    FROM contacts WHERE tier = ? ORDER BY name LIMIT ?
                    """,
                    (tier, limit),
                ) as cursor:
                    rows = [_row_to_dict(r) async for r in cursor]
            else:
                async with db.execute(
                    """
                    SELECT id, name, tier, company, role, last_contact, next_followup
                    FROM contacts ORDER BY tier, name LIMIT ?
                    """,
                    (limit,),
                ) as cursor:
                    rows = [_row_to_dict(r) async for r in cursor]

        return {"success": True, "count": len(rows), "contacts": rows}
    except Exception as exc:
        return {"success": False, "error": str(exc)}


async def crm_log_interaction(
    db_path: str,
    *,
    contact_id: int,
    type: str,
    summary: str,
    date: str | None = None,
) -> dict:
    interaction_date = date or _today()
    try:
        async with await _open(db_path) as db:
            await db.execute(
                "INSERT INTO interactions (contact_id, type, summary, date) VALUES (?, ?, ?, ?)",
                (contact_id, type, summary, interaction_date),
            )

            async with db.execute(
                "SELECT tier FROM contacts WHERE id = ?", (contact_id,)
            ) as cursor:
                row = await cursor.fetchone()

            tier = row["tier"] if row else "broader"
            next_followup = _followup_date(tier)

            await db.execute(
                "UPDATE contacts SET last_contact = ?, next_followup = ? WHERE id = ?",
                (interaction_date, next_followup, contact_id),
            )
            await db.commit()

        return {
            "success": True,
            "message": f"Logged interaction, next follow-up: {next_followup}",
            "next_followup": next_followup,
        }
    except Exception as exc:
        return {"success": False, "error": str(exc)}


async def crm_search_by_industry(
    db_path: str,
    *,
    industry: str | None = None,
    company: str | None = None,
) -> dict:
    if not industry and not company:
        return {"success": False, "error": "Provide industry or company"}
    try:
        async with await _open(db_path) as db:
            if company:
                async with db.execute(
                    """
                    SELECT id, name, tier, role, company, industry, last_contact, notes
                    FROM contacts WHERE company LIKE ? ORDER BY tier
                    """,
                    (f"%{company}%",),
                ) as cursor:
                    rows = [_row_to_dict(r) async for r in cursor]
            else:
                async with db.execute(
                    """
                    SELECT id, name, tier, role, company, industry, last_contact, notes
                    FROM contacts WHERE industry LIKE ? ORDER BY tier
                    """,
                    (f"%{industry}%",),
                ) as cursor:
                    rows = [_row_to_dict(r) async for r in cursor]

        return {"success": True, "count": len(rows), "contacts": rows}
    except Exception as exc:
        return {"success": False, "error": str(exc)}


async def crm_get_upcoming_followups(db_path: str, *, days: int = 7) -> dict:
    cutoff = (date.today() + timedelta(days=days)).isoformat()
    try:
        async with await _open(db_path) as db:
            async with db.execute(
                """
                SELECT id, name, tier, last_contact, next_followup, notes
                FROM contacts
                WHERE next_followup <= ?
                ORDER BY (tier = 'vip') DESC, next_followup ASC
                """,
                (cutoff,),
            ) as cursor:
                rows = [_row_to_dict(r) async for r in cursor]

        return {"success": True, "count": len(rows), "contacts": rows}
    except Exception as exc:
        return {"success": False, "error": str(exc)}


async def crm_get_upcoming_birthdays(db_path: str, *, days: int = 14) -> dict:
    today_md = date.today().strftime("%m-%d")
    cutoff_md = (date.today() + timedelta(days=days)).strftime("%m-%d")
    try:
        async with await _open(db_path) as db:
            # Handle year-boundary wrap (e.g. Dec → Jan)
            if today_md <= cutoff_md:
                async with db.execute(
                    """
                    SELECT id, name, tier, birthday, notes
                    FROM contacts
                    WHERE birthday IS NOT NULL
                      AND strftime('%m-%d', birthday) BETWEEN ? AND ?
                    ORDER BY strftime('%m-%d', birthday)
                    """,
                    (today_md, cutoff_md),
                ) as cursor:
                    rows = [_row_to_dict(r) async for r in cursor]
            else:
                # Wrap around year boundary
                async with db.execute(
                    """
                    SELECT id, name, tier, birthday, notes
                    FROM contacts
                    WHERE birthday IS NOT NULL
                      AND (strftime('%m-%d', birthday) >= ? OR strftime('%m-%d', birthday) <= ?)
                    ORDER BY strftime('%m-%d', birthday)
                    """,
                    (today_md, cutoff_md),
                ) as cursor:
                    rows = [_row_to_dict(r) async for r in cursor]

        return {"success": True, "count": len(rows), "contacts": rows}
    except Exception as exc:
        return {"success": False, "error": str(exc)}


async def crm_add_schema_column(
    db_path: str,
    *,
    table_name: str = "contacts",
    column_name: str,
    column_type: str = "TEXT",
    description: str = "",
) -> dict:
    try:
        async with await _open(db_path) as db:
            async with db.execute(
                "SELECT column_name FROM schema_meta WHERE table_name = ? AND column_name = ?",
                (table_name, column_name),
            ) as cursor:
                existing = await cursor.fetchone()

            if existing:
                return {
                    "success": False,
                    "message": f"Column '{column_name}' already exists in {table_name}",
                }

            await db.execute(
                f"ALTER TABLE {table_name} ADD COLUMN {column_name} {column_type}"
            )
            await db.execute(
                "INSERT INTO schema_meta (table_name, column_name, column_type, description) VALUES (?, ?, ?, ?)",
                (table_name, column_name, column_type, description),
            )
            await db.commit()

        return {
            "success": True,
            "message": f"Added column '{column_name}' ({column_type}) to {table_name}",
        }
    except Exception as exc:
        return {"success": False, "error": str(exc)}


async def crm_add_tag(db_path: str, *, contact_id: int, tag_name: str) -> dict:
    try:
        async with await _open(db_path) as db:
            await db.execute(
                "INSERT OR IGNORE INTO tags (name) VALUES (?)", (tag_name,)
            )
            async with db.execute(
                "SELECT id FROM tags WHERE name = ?", (tag_name,)
            ) as cursor:
                tag_row = await cursor.fetchone()

            await db.execute(
                "INSERT OR IGNORE INTO contact_tags (contact_id, tag_id) VALUES (?, ?)",
                (contact_id, tag_row["id"]),
            )
            await db.commit()

        return {
            "success": True,
            "message": f"Tagged contact {contact_id} with '{tag_name}'",
        }
    except Exception as exc:
        return {"success": False, "error": str(exc)}


async def crm_find_by_tag(db_path: str, *, tag_name: str) -> dict:
    try:
        async with await _open(db_path) as db:
            async with db.execute(
                """
                SELECT c.id, c.name, c.tier, c.company, c.role, c.last_contact
                FROM contacts c
                JOIN contact_tags ct ON c.id = ct.contact_id
                JOIN tags t ON ct.tag_id = t.id
                WHERE t.name LIKE ?
                ORDER BY c.tier
                """,
                (f"%{tag_name}%",),
            ) as cursor:
                rows = [_row_to_dict(r) async for r in cursor]

        return {"success": True, "count": len(rows), "contacts": rows}
    except Exception as exc:
        return {"success": False, "error": str(exc)}

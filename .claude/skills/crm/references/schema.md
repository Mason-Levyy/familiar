# CRM Database Schema Reference

Database: SQLite at `$DB_PATH` (default: `./db/crm.db`)
Authoritative source: `db/schema.sql`

---

## contacts

Core table. One row per person.

| Column | Type | Constraints | Notes |
|---|---|---|---|
| id | INTEGER | PK AUTOINCREMENT | |
| name | TEXT | NOT NULL | Full name |
| tier | TEXT | NOT NULL CHECK(vip\|acquaintance\|broader) | Relationship tier |
| email | TEXT | | |
| phone | TEXT | | |
| location | TEXT | | City / state |
| company | TEXT | | |
| industry | TEXT | | For industry-based lookups |
| role | TEXT | | Job title |
| birthday | TEXT | | YYYY-MM-DD |
| how_met | TEXT | | Context (event, intro, etc.) |
| notes | TEXT | | Freeform running notes |
| last_contact | TEXT | | ISO date of last touchpoint |
| next_followup | TEXT | | ISO date of scheduled check-in |
| created_at | TEXT | DEFAULT datetime('now') | |
| updated_at | TEXT | DEFAULT datetime('now') | Auto-updated by trigger |

**Trigger:** `contacts_updated_at` — fires `AFTER UPDATE` and sets `updated_at = datetime('now')`

**Dynamic columns:** Any column added via `crm_add_schema_column` is added here at runtime. Query `schema_meta` to see what extra columns exist.

---

## interactions

Every touchpoint with a contact. Many rows per contact.

| Column | Type | Constraints | Notes |
|---|---|---|---|
| id | INTEGER | PK AUTOINCREMENT | |
| contact_id | INTEGER | NOT NULL FK → contacts.id | |
| type | TEXT | NOT NULL | text \| email \| call \| coffee \| linkedin \| event \| other |
| summary | TEXT | NOT NULL | What was discussed |
| date | TEXT | NOT NULL | YYYY-MM-DD |
| created_at | TEXT | DEFAULT datetime('now') | |

---

## tags

Tag vocabulary. One row per unique tag name.

| Column | Type | Constraints |
|---|---|---|
| id | INTEGER | PK AUTOINCREMENT |
| name | TEXT | NOT NULL UNIQUE |

---

## contact_tags

Many-to-many join between contacts and tags.

| Column | Type | Constraints |
|---|---|---|
| contact_id | INTEGER | FK → contacts.id |
| tag_id | INTEGER | FK → tags.id |

**PK:** (contact_id, tag_id)

---

## schema_meta

Registry of all columns — both initial and dynamically added. Lets the agent know what fields are available without inspecting `PRAGMA table_info`.

| Column | Type | Notes |
|---|---|---|
| table_name | TEXT | e.g. `contacts` |
| column_name | TEXT | |
| column_type | TEXT | SQLite type |
| description | TEXT | Human-readable description |
| added_at | TEXT | datetime('now') |

**PK:** (table_name, column_name)

Pre-seeded with all initial `contacts` columns. `crm_add_schema_column` inserts a row here alongside the `ALTER TABLE`.

---

## Migrations

Future schema changes go in `db/migrations/00N_description.sql`. Run them manually:
```bash
sqlite3 db/crm.db < db/migrations/002_add_linkedin_url.sql
```

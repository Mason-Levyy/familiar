# CRM Tools API Reference

All tools are implemented in `crm/tools.py` as async functions.
All are registered in `bot/agent.py` in `_dispatch_tool` and `TOOL_DEFINITIONS`.

Each function signature: `async def tool_name(db_path: str, *, ...kwargs) -> dict`

---

## crm_add_contact

Insert a new contact row. Auto-calculates `next_followup` by tier if not provided.

**Followup defaults:** vip → 21 days, acquaintance → 42 days, broader → 90 days

```python
crm_add_contact(db_path, *, name, tier, email=None, phone=None, location=None,
                company=None, industry=None, role=None, birthday=None,
                how_met=None, notes=None, next_followup=None)
# Returns: { success, id, message, next_followup }
```

---

## crm_update_contact

Update arbitrary fields on an existing contact. Only columns in `fields` are touched.

```python
crm_update_contact(db_path, *, id: int, fields: dict)
# Returns: { success, message }
```

---

## crm_find_contact

LIKE search across name, company, notes. Returns up to 5 matches, each with last 3 interactions.

```python
crm_find_contact(db_path, *, query: str)
# Returns: { success, results: [{ ...contact, recent_interactions: [...] }] }
```

---

## crm_list_contacts

List contacts with optional tier filter.

```python
crm_list_contacts(db_path, *, tier=None, limit=20)
# Returns: { success, count, contacts: [{ id, name, tier, company, role, last_contact, next_followup }] }
```

---

## crm_log_interaction

Insert an interaction row. Updates `last_contact` and resets `next_followup` by tier.

```python
crm_log_interaction(db_path, *, contact_id: int, type: str, summary: str, date=None)
# type: "text" | "email" | "call" | "coffee" | "linkedin" | "event" | "other"
# Returns: { success, message, next_followup }
```

---

## crm_search_by_industry

LIKE search on `industry` or `company` column. Pass one or the other.

```python
crm_search_by_industry(db_path, *, industry=None, company=None)
# Returns: { success, count, contacts: [{ id, name, tier, role, company, industry, last_contact, notes }] }
```

---

## crm_get_upcoming_followups

Contacts with `next_followup` on or before today + N days. VIPs sorted first.

```python
crm_get_upcoming_followups(db_path, *, days=7)
# Returns: { success, count, contacts: [{ id, name, tier, last_contact, next_followup, notes }] }
```

---

## crm_get_upcoming_birthdays

Contacts with birthdays in the next N days (month-day comparison, year-boundary safe).

```python
crm_get_upcoming_birthdays(db_path, *, days=14)
# Returns: { success, count, contacts: [{ id, name, tier, birthday, notes }] }
```

---

## crm_add_schema_column

Dynamically add a column to a table. Idempotent check against `schema_meta`.

```python
crm_add_schema_column(db_path, *, table_name="contacts", column_name, column_type="TEXT", description="")
# Returns: { success, message }
# Error if column already exists: { success: False, message: "Column '...' already exists" }
```

---

## crm_add_tag

Upsert a tag and link it to a contact (INSERT OR IGNORE on both).

```python
crm_add_tag(db_path, *, contact_id: int, tag_name: str)
# Returns: { success, message }
```

---

## crm_find_by_tag

Find all contacts with a given tag (LIKE match against tag name).

```python
crm_find_by_tag(db_path, *, tag_name: str)
# Returns: { success, count, contacts: [{ id, name, tier, company, role, last_contact }] }
```

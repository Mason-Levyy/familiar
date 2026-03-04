# CRM Tool Reference

All tools live in `crm/tools.py` and are registered in `bot/agent.py`. Each is an async function that takes `db_path` as its first positional argument, followed by keyword arguments.

---

## crm_add_contact

Add a new contact.

| Parameter | Type | Required | Notes |
|---|---|---|---|
| name | str | yes | Full name |
| tier | str | yes | `vip` \| `acquaintance` \| `broader` |
| email | str | no | |
| phone | str | no | |
| location | str | no | City / state |
| company | str | no | |
| industry | str | no | |
| role | str | no | Job title |
| birthday | str | no | YYYY-MM-DD |
| how_met | str | no | Context (event, intro, etc.) |
| notes | str | no | Freeform |
| next_followup | str | no | YYYY-MM-DD — auto-calculated if omitted |

Returns: `{ success, id, message, next_followup }`

---

## crm_update_contact

Update fields on an existing contact.

| Parameter | Type | Required | Notes |
|---|---|---|---|
| id | int | yes | Contact ID |
| fields | dict | yes | `{ column: value }` — only passed columns are updated |

Returns: `{ success, message }`

---

## crm_find_contact

Search contacts by name, company, or notes. Returns up to 5 matches with the last 3 interactions each.

| Parameter | Type | Required |
|---|---|---|
| query | str | yes |

Returns: `{ success, results: [contact + recent_interactions] }`

---

## crm_list_contacts

List contacts with optional tier filter.

| Parameter | Type | Required | Default |
|---|---|---|---|
| tier | str | no | all tiers |
| limit | int | no | 20 |

Returns: `{ success, count, contacts }`

---

## crm_log_interaction

Log a touchpoint. Updates `last_contact` and resets `next_followup`.

| Parameter | Type | Required | Notes |
|---|---|---|---|
| contact_id | int | yes | |
| type | str | yes | `text` \| `email` \| `call` \| `coffee` \| `linkedin` \| `event` \| `other` |
| summary | str | yes | What was discussed |
| date | str | no | YYYY-MM-DD — defaults to today |

Returns: `{ success, message, next_followup }`

---

## crm_search_by_industry

Find contacts by industry or company (LIKE match).

| Parameter | Type | Required |
|---|---|---|
| industry | str | one of these |
| company | str | one of these |

Returns: `{ success, count, contacts }`

---

## crm_get_upcoming_followups

Contacts with `next_followup` ≤ today + N days, sorted by tier (VIPs first) then date.

| Parameter | Type | Default |
|---|---|---|
| days | int | 7 |

Returns: `{ success, count, contacts }`

---

## crm_get_upcoming_birthdays

Contacts with birthdays in the next N days (month-day comparison, ignores year).

| Parameter | Type | Default |
|---|---|---|
| days | int | 14 |

Returns: `{ success, count, contacts }`

---

## crm_add_schema_column

Dynamically add a column to a CRM table. Idempotent — returns an error if the column already exists.

| Parameter | Type | Required | Default |
|---|---|---|---|
| table_name | str | no | `contacts` |
| column_name | str | yes | |
| column_type | str | no | `TEXT` |
| description | str | no | |

Returns: `{ success, message }`

---

## crm_add_tag

Attach a tag label to a contact.

| Parameter | Type | Required |
|---|---|---|
| contact_id | int | yes |
| tag_name | str | yes |

Returns: `{ success, message }`

---

## crm_find_by_tag

Find all contacts with a given tag (LIKE match).

| Parameter | Type | Required |
|---|---|---|
| tag_name | str | yes |

Returns: `{ success, count, contacts }`

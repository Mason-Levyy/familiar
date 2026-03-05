# TOOLS.md - Local Notes

Skills define _how_ tools work. This file is for _your_ specifics.

## Skill Files

Skills live in `~/.openclaw/workspace/skills/<name>/SKILL.md`.

Current skills with plugin tools:
- **crm** — `~/.openclaw/workspace/skills/crm/SKILL.md`
  Plugin tools: `crm_add_contact`, `crm_update_contact`, `crm_find_contact`, `crm_list_contacts`,
  `crm_log_interaction`, `crm_search_by_industry`, `crm_get_upcoming_followups`,
  `crm_get_upcoming_birthdays`, `crm_add_schema_column`, `crm_add_tag`, `crm_find_by_tag`
  DB: `~/familiar/db/crm.db`

## Scripts

- `~/familiar/scripts/crm-recent.sh` — view recent CRM table rows in markdown
  Alias: `crm-recent [table] [limit]`
  Tables: contacts, interactions, tags, contact_tags, schema_meta

## CRM Schema — Custom Columns Added

Beyond defaults (name, tier, email, phone, company, role, etc.):
- `school` — university/college
- `major` — field of study
- `graduation_date` — expected graduation
- `linkedin` — LinkedIn profile URL
- `program` — academic program (e.g. Lead Scholars)
- `post_grad_company` — where they're going after graduation
- `post_grad_location` — city after graduation

## Platform Notes

- **Discord:** No markdown tables — use bullet lists. Suppress link embeds with `<url>`.
- **Discord bot username:** Familiar#7595

## Mason's Setup

- Machine: familiar-v1 (Linux)
- Workspace: `/home/mountain-bread/.openclaw/workspace`
- CRM DB: `~/familiar/db/crm.db`
- Scripts: `~/familiar/scripts/`

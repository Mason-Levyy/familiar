# TOOLS.md - Local Notes

This file documents the operational specifics of Familiar — a recursive CRM agent that manages Mason's relationships, learns from every interaction, and improves its own codebase over time.

## What Familiar Is

A personal relationship intelligence system delivered as an OpenClaw plugin. Mason DMs the bot in Discord, OpenClaw routes to Claude, CRM tools execute against SQLite, and the agent responds. The agent captures information proactively, synthesizes relationship context, evolves its own schema, and proposes code improvements via PR.

## Skill File

The skill (system prompt + tool manifest) lives in the repo at `skill/SKILL.md` and is deployed to:
```
~/.openclaw/workspace/skills/crm/SKILL.md
```

## Registered Tools

### CRM Tools (11)
| Tool | Purpose |
|------|---------|
| `crm_add_contact` | Insert a new contact, auto-calculate follow-up by tier |
| `crm_update_contact` | Update arbitrary fields on an existing contact |
| `crm_find_contact` | LIKE search across name, company, notes (returns last 3 interactions) |
| `crm_list_contacts` | List contacts, optionally filtered by tier |
| `crm_log_interaction` | Log a touchpoint, reset follow-up clock |
| `crm_search_by_industry` | Find contacts by industry or company |
| `crm_get_upcoming_followups` | Contacts due for check-in within N days |
| `crm_get_upcoming_birthdays` | Contacts with birthdays in the next N days |
| `crm_add_schema_column` | Dynamically add a column to any table (self-evolving schema) |
| `crm_add_tag` | Tag a contact with a label |
| `crm_find_by_tag` | Find all contacts with a given tag |

### Self-Improvement Tool (1)
| Tool | Purpose |
|------|---------|
| `bot_propose_change` | Create a git branch, write files, commit, push, and open a GitHub PR to improve the bot's own codebase |

## Scripts

- `~/familiar/scripts/crm-recent.sh` -- view recent CRM table rows in markdown
  Alias: `crm-recent [table] [limit]`
  Tables: contacts, interactions, tags, contact_tags, schema_meta

## CRM Schema -- Custom Columns Added

Beyond defaults (name, tier, email, phone, company, role, industry, location, birthday, how_met, notes, last_contact, next_followup):
- `school` -- university/college
- `major` -- field of study
- `graduation_date` -- expected graduation
- `linkedin` -- LinkedIn profile URL
- `program` -- academic program (e.g. Lead Scholars)
- `post_grad_company` -- where they're going after graduation
- `post_grad_location` -- city after graduation

New columns are added at runtime by the agent via `crm_add_schema_column` whenever Mason mentions information that doesn't fit an existing field. Check `schema_meta` for the full current list.

## Contact Tiers

| Tier | Follow-up Cadence | Who |
|------|-------------------|-----|
| vip | 21 days | Close friends, family |
| acquaintance | 42 days | Genuine connections |
| broader | 90 days | Professional contacts, networking |

## Platform Notes

- **Discord:** No markdown tables -- use bullet lists. Suppress link embeds with `<url>`.
- **Discord bot username:** Familiar#7595

## Mason's Setup

- Machine: familiar-v1 (Linux)
- Workspace: `/home/mountain-bread/.openclaw/workspace`
- CRM DB: `~/familiar/db/crm.db`
- Scripts: `~/familiar/scripts/`

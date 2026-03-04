---
name: crm
description: This skill should be used when working on the 'familiar' Discord CRM bot project — a personal relationship manager backed by SQLite, powered by Claude tool-use, and delivered via a Discord bot. Activate when the user asks to modify, debug, extend, or understand the bot, the CRM tools, the database schema, or the agent integration.
---

# familiar — Discord CRM Bot

A personal CRM that runs as a Discord bot. User messages go to Claude (Anthropic tool-use API), Claude calls CRM tools, tools execute against SQLite, Claude responds in Discord.

## Project Layout

```
familiar/
├── bot/
│   ├── agent.py          # Claude tool-use loop, conversation history, tool dispatch
│   └── discord_bot.py    # discord.py bot, message routing, APScheduler briefing
├── crm/
│   └── tools.py          # All 11 async CRM functions (aiosqlite)
├── scripts/
│   └── init_db.py        # One-time DB bootstrap (py -3 scripts/init_db.py)
├── db/
│   ├── schema.sql        # Authoritative schema — DO NOT MODIFY unless migrating
│   └── migrations/       # 001_initial.sql, 002_*.sql, etc.
├── config/
│   └── AGENTS.md         # System prompt loaded by bot/agent.py at startup
└── .env                  # Secrets (see .env.example)
```

## Running the Bot

```bash
# Bootstrap DB (first time only)
py -3 scripts/init_db.py

# Start the bot
py -3 -m bot.discord_bot
```

## How the Tool-Use Loop Works

`bot/agent.py:process_message(user_id, text)`:
1. Appends user message to in-memory history dict keyed by Discord user ID
2. Calls `anthropic.messages.create` with `TOOL_DEFINITIONS` and `SYSTEM_PROMPT`
3. On `stop_reason == "tool_use"`: dispatches each `tool_use` block through `_dispatch_tool`, appends `tool_result` blocks, loops
4. On `stop_reason == "end_turn"`: returns extracted text, appends to history

To add a new tool: implement async function in `crm/tools.py`, register it in `_dispatch_tool` in `bot/agent.py`, add its JSON schema to `TOOL_DEFINITIONS`.

## Database

Five tables: `contacts`, `interactions`, `tags`, `contact_tags`, `schema_meta`.

`schema_meta` tracks dynamically added columns — the agent can `ALTER TABLE` via `crm_add_schema_column` to track new fields on demand without a migration file.

For full schema details: read `references/schema.md`
For complete tool signatures and return types: read `references/tools.md`

## Common Development Tasks

**Add a tool:** Implement in `crm/tools.py` → register in `bot/agent.py` → verify imports with `py -3 -c "import crm.tools"`

**Change the system prompt:** Edit `config/AGENTS.md` and restart the bot (file is read at module import time).

**Add a DB column via migration:** Create `db/migrations/00N_description.sql` with `ALTER TABLE`, execute it, then either update `schema_meta` manually or call `crm_add_schema_column`.

**Reset conversation context for a user:** Call `agent.clear_history(user_id)` in code, or have the user send `!reset` in Discord.

**Install dependencies:**
```bash
pip install -r requirements.txt
```

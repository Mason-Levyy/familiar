# familiar

A personal CRM bot that runs in Discord. You describe your relationships in natural language; Claude manages the database and surfaces the right people at the right time.

**Stack:** Python · Discord · Claude API (tool-use) · SQLite

---

## How it works

You DM the bot in Discord. Claude interprets your message, calls one or more CRM tools against a local SQLite database, then replies. A scheduled morning briefing fires daily with upcoming follow-ups and birthdays.

```
You: Add Sarah Chen, VIP. Met at Leeds alumni event last week.
     Product manager at Salesforce in Denver. Birthday March 15.

Bot: Added Sarah Chen (VIP)
     Company: Salesforce | Role: Product Manager | Location: Denver
     Birthday: March 15
     Next follow-up: March 24
```

## Features

- **Contact tiers** — VIP (21-day follow-up), Acquaintance (42-day), Broader network (90-day)
- **Interaction log** — every coffee, call, or text is recorded; follow-up dates auto-advance
- **Natural language queries** — "Who do I know in marketing?" / "Any birthdays coming up?"
- **Tags** — tag contacts with arbitrary labels and search by tag
- **Dynamic schema** — tell the bot to start tracking a new field; it alters the table itself
- **Morning briefing** — daily digest of upcoming follow-ups and birthdays
- **Single-user** — only your Discord user ID can interact with the bot

---

## Project structure

```
familiar/
├── bot/
│   ├── agent.py          # Claude tool-use loop, conversation history
│   └── discord_bot.py    # discord.py bot, APScheduler morning briefing
├── crm/
│   └── tools.py          # 11 async CRM functions (aiosqlite)
├── config/
│   └── AGENTS.md         # System prompt loaded at startup
├── db/
│   ├── schema.sql        # Authoritative schema (do not modify directly)
│   └── migrations/       # Versioned .sql files applied by migrate.py
├── scripts/
│   ├── init_db.py        # One-time DB bootstrap
│   ├── migrate.py        # Apply pending migrations
│   ├── deploy.sh         # One-command server deploy
│   └── backup_db.sh      # SQLite backup (add to crontab)
└── docs/
    ├── setup.md          # Full setup guide
    └── usage.md          # Example conversations
```

---

## Quick start

### 1. Install dependencies

```bash
pip install -r requirements.txt
```

### 2. Configure environment

```bash
cp .env.example .env
# Fill in DISCORD_BOT_TOKEN, DISCORD_ALLOWED_USER_ID, ANTHROPIC_API_KEY
```

### 3. Create a Discord bot

1. Go to [discord.com/developers/applications](https://discord.com/developers/applications) → New Application
2. Bot tab → Add Bot → copy the token
3. Under Privileged Gateway Intents, enable **Message Content Intent**
4. OAuth2 → URL Generator → Scopes: `bot`, Permissions: `Send Messages` + `Read Message History` → open the URL to invite the bot

### 4. Initialize the database

```bash
py -3 scripts/init_db.py
```

### 5. Run the bot

```bash
py -3 -m bot.discord_bot
```

See [docs/setup.md](docs/setup.md) for the full guide including server deployment, systemd service setup, and scheduled backups.

---

## Database design

Two types of schema changes:

| Type | Where | How |
|---|---|---|
| Structural (new tables, columns you commit) | `db/migrations/` | Write a `.sql` file, run `migrate.py` |
| Runtime (agent adds a column on demand) | `db/crm.db` (gitignored) | Bot calls `crm_add_schema_column` |

The `schema_meta` table records every column the agent knows about, including dynamically added ones.

---

## Deploying updates to a server

```bash
bash scripts/deploy.sh
```

This pulls the latest code, installs dependencies, runs pending migrations, and restarts the systemd service in one command.

---

## Security

- Only `DISCORD_ALLOWED_USER_ID` can interact with the bot — all other messages are silently dropped
- `.env` and `db/crm.db` are gitignored and never committed
- SQLite is local-only; no data leaves your server except via the Claude API call

---

## Docs

- [docs/setup.md](docs/setup.md) — full installation guide
- [docs/usage.md](docs/usage.md) — example conversations for every feature

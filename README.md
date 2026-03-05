# Familiar — Personal CRM for OpenClaw

An append-only, self-evolving personal CRM that runs as an [OpenClaw](https://openclaw.ai/) plugin. Manage contacts across three relationship tiers, log interactions, track birthdays and follow-ups — all through natural conversation via Discord.

**Stack:** TypeScript · Node.js ≥22 (`node:sqlite`) · OpenClaw · SQLite · Discord

---

## How It Works

You DM your Discord bot → OpenClaw routes it to Claude → Claude calls CRM tools against SQLite → response sent back to Discord.

The schema evolves automatically. Mention a new type of information ("his dog's name is Rex") and the agent creates a new column and stores the value — no migration scripts, no restarts.

---

## Project Structure

```
familiar/
├── package.json              # Node deps + OpenClaw plugin entry
├── tsconfig.json             # TypeScript config
├── openclaw.plugin.json      # Plugin manifest
├── src/
│   ├── index.ts              # Registers all 11 tools via api.registerTool()
│   ├── db.ts                 # Database helpers
│   └── tools/                # One file per CRM tool (11 total)
├── skill/
│   └── SKILL.md              # System prompt (YAML frontmatter + instructions)
├── db/
│   ├── schema.sql            # 5 tables: contacts, interactions, tags, contact_tags, schema_meta
│   └── migrations/
├── scripts/
│   ├── initDb.ts             # DB bootstrap
│   └── backup_db.sh          # SQLite backup script
└── docs/
```

---

## CRM Tools (11)

| Tool | Description |
|---|---|
| `crm_add_contact` | Add a contact with tier, details, auto-calculated follow-up |
| `crm_update_contact` | Update any fields on a contact |
| `crm_find_contact` | Search by name/company/notes, returns recent interactions |
| `crm_list_contacts` | List all or filter by tier |
| `crm_log_interaction` | Record a touchpoint, reset follow-up timer |
| `crm_search_by_industry` | Find contacts by industry or company |
| `crm_get_upcoming_followups` | Contacts due for check-in within N days |
| `crm_get_upcoming_birthdays` | Birthdays in the next N days (year-boundary safe) |
| `crm_add_schema_column` | Dynamically add a column to track new data |
| `crm_add_tag` | Tag a contact with a label |
| `crm_find_by_tag` | Find all contacts with a given tag |

No delete tools exist. The CRM is append-only by design.

---

## Contact Tiers

| Tier | Follow-up Cadence | Use Case |
|---|---|---|
| **vip** | Every 3 weeks | Close friends, family |
| **acquaintance** | Every 6 weeks | Genuine connections |
| **broader** | Every 3 months | Professional/networking |

Follow-up dates auto-reset when you log an interaction.

---

## Setup

### Prerequisites

- Node.js ≥ 22
- [OpenClaw](https://openclaw.ai/) installed (`curl -fsSL https://openclaw.ai/install.sh | bash`)
- A Discord bot token ([Developer Portal](https://discord.com/developers/applications))
- An Anthropic API key (configured during `openclaw onboard`)

### Build

```bash
git clone https://github.com/Mason-Levyy/familiar
cd familiar
npm install
npm run build
```

### Initialize Database

```bash
node --experimental-sqlite scripts/initDb.ts
```

### Install into OpenClaw

```bash
# 1. Run the onboarding wizard (sets up API keys, daemon)
openclaw onboard --install-daemon

# 2. Load the CRM plugin
openclaw plugins install /path/to/familiar

# 3. Install the skill (system prompt)
mkdir -p ~/.openclaw/workspace/skills/crm
cp skill/SKILL.md ~/.openclaw/workspace/skills/crm/SKILL.md

# 4. Configure Discord
openclaw config set channels.discord.enabled true --json
openclaw config set channels.discord.token '"YOUR_BOT_TOKEN"' --json
```

Then edit `~/.openclaw/config.json5` to restrict access:

```json5
{
  channels: {
    discord: {
      enabled: true,
      dmPolicy: "allowlist",
      allowFrom: ["YOUR_DISCORD_USER_ID"]
    }
  }
}
```

### Start

```bash
openclaw gateway
```

---

## Usage Examples

```
You: Add Sarah Chen, VIP, met at Leeds alumni event. Product manager at Salesforce in Denver.
     Birthday is March 15.

Bot: Added Sarah Chen (VIP)
     Company: Salesforce | Role: Product Manager | Location: Denver
     Birthday: March 15 | Next follow-up: March 23

You: Log that I grabbed coffee with Marcus — we talked about his job search in consulting.

Bot: Logged interaction with Marcus (Acquaintance)
     Type: Coffee | Next follow-up: April 13

You: His dog's name is Rex.

Bot: Added column 'dog_name' to contacts.
     Updated Marcus — dog_name: Rex

You: Who should I check in with this week?

Bot: Follow-ups due in the next 7 days:
     - Sarah Chen (VIP) — due March 5 — met at Leeds alumni event
     - Jake Torres (VIP) — due March 7 — last: coffee in January
```

---

## Database Backups

```bash
# Manual backup
bash scripts/backup_db.sh

# Cron (daily at 3 AM)
crontab -e
# 0 3 * * * bash /path/to/familiar/scripts/backup_db.sh
```

---

## Security

- Discord access restricted to a single user via `allowFrom` allowlist
- No delete operations exposed — data is append-only
- SQLite is local-only — no cloud exposure
- `.env` is gitignored — secrets live in OpenClaw gateway config
- Run `openclaw doctor` to check for misconfigurations

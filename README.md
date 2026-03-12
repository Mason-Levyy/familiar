# Familiar

**Familiar** is an agentic AI assistant that helps you stay on top of your professional network and manage your projects — all through natural conversation.

No forms. No dashboards. Just chat.

---

## What Familiar Does

Familiar lives inside [OpenClaw](https://openclaw.ai/) and connects to you through Discord. You talk to it like a person, and it handles the tracking for you.

**Network Management**
- Add and update contacts through natural conversation
- Log interactions (calls, coffee, emails) and auto-reset follow-up timers
- Get notified when someone is overdue for a check-in
- Track birthdays, industries, companies, and custom fields you define on the fly
- Tag and search contacts any way you want

**Project & Task Awareness**
- Link contacts to projects and ongoing work
- Track relationship context that matters to your goals
- Keep a living record of who knows what, and who you should be talking to

**Self-Evolving Memory**
- Mention a new piece of information ("his dog's name is Rex") and Familiar creates a new field and stores it — no config, no restarts
- Your data model grows with your life

---

## Key Features

| Feature | Description |
|---|---|
| Natural language interface | Talk to Familiar like a person — no commands to memorize |
| Append-only storage | Data is never deleted — your history is always intact |
| Auto follow-up scheduling | Every interaction resets a follow-up timer based on relationship tier |
| Birthday tracking | Never miss a birthday, with year-boundary-safe date math |
| Dynamic schema | Add custom fields mid-conversation — the database evolves automatically |
| Local-first | SQLite, no cloud, no subscriptions |
| Discord-native | Accessible anywhere you have Discord |

---

## Stack

**TypeScript · Node.js ≥22 · OpenClaw · SQLite · Discord**

---

## Setup

### Prerequisites

- Node.js ≥ 22
- [OpenClaw](https://openclaw.ai/) installed:
  ```bash
  curl -fsSL https://openclaw.ai/install.sh | bash
  ```
- A Discord bot token — create one at the [Discord Developer Portal](https://discord.com/developers/applications)
- An Anthropic API key (configured during `openclaw onboard`)

### Install

```bash
git clone https://github.com/Mason-Levyy/familiar
cd familiar
npm install
npm run build
```

### Initialize the Database

```bash
npm run db:init
```

### Connect to OpenClaw

```bash
# 1. Run the onboarding wizard (sets up API keys and the background daemon)
openclaw onboard --install-daemon

# 2. Load the Familiar plugin
openclaw plugins install /path/to/familiar

# 3. Install the CRM skill (system prompt)
mkdir -p ~/.openclaw/workspace/skills/crm
cp skills/crm/SKILL.md ~/.openclaw/workspace/skills/crm/SKILL.md

# 4. Connect Discord
openclaw config set channels.discord.enabled true --json
openclaw config set channels.discord.token '"YOUR_BOT_TOKEN"' --json
```

### Lock Down Access

Edit `~/.openclaw/config.json5` to restrict Familiar to your Discord account only:

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

### Run

```bash
openclaw gateway
```

Familiar is now live. DM your Discord bot to start.

---

## Database Backups

```bash
# Manual backup
bash scripts/backup_db.sh

# Schedule a daily backup at 3 AM via cron
crontab -e
# Add: 0 3 * * * bash /path/to/familiar/scripts/backup_db.sh
```

---

## Security

- **Single-user access** — Discord allowlist restricts access to one user
- **Append-only** — no delete operations; your data is always recoverable
- **Local-only** — SQLite stays on your machine, no cloud exposure
- **Secrets stay out of git** — `.env` is gitignored; credentials live in OpenClaw config
- Run `openclaw doctor` to diagnose any configuration issues

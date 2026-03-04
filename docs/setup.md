# Setup Guide

## Prerequisites

- Python 3.11+ (verified with 3.14)
- A Discord account
- An Anthropic API key

---

## 1. Install Dependencies

```bash
pip install -r requirements.txt
```

---

## 2. Create a Discord Bot

1. Go to https://discord.com/developers/applications
2. Click **New Application** → name it (e.g. "familiar")
3. Go to **Bot** tab → click **Add Bot**
4. Under **Privileged Gateway Intents**, enable **Message Content Intent**
5. Copy the **Token** — you'll need it for `.env`

To invite the bot to your server:
- Go to **OAuth2 → URL Generator**
- Scopes: `bot`
- Bot permissions: `Send Messages`, `Read Message History`
- Open the generated URL in your browser and add it to your server

---

## 3. Get Your Discord User ID

1. In Discord: Settings → Advanced → enable **Developer Mode**
2. Right-click your own username anywhere → **Copy User ID**

---

## 4. Get Your Briefing Channel ID

Right-click the channel where you want morning briefings → **Copy Channel ID**

---

## 5. Configure Environment

```bash
cp .env.example .env
```

Open `.env` and fill in:

```bash
DISCORD_BOT_TOKEN=your_bot_token_here
DISCORD_ALLOWED_USER_ID=your_numeric_user_id
ANTHROPIC_API_KEY=sk-ant-...
DB_PATH=./db/crm.db
DISCORD_BRIEFING_CHANNEL_ID=channel_id_for_morning_briefing
BRIEFING_HOUR=8
BRIEFING_MINUTE=0
CLAUDE_MODEL=claude-sonnet-4-20250514
```

---

## 6. Initialize the Database

```bash
py -3 scripts/init_db.py
```

Expected output:
```
Database initialized at db/crm.db
```

---

## 7. Run the Bot

```bash
py -3 -m bot.discord_bot
```

The bot will log in and start listening. You should see:
```
2026-03-03 08:00:00  INFO      familiar — Logged in as familiar#1234 (id=123456789)
2026-03-03 08:00:00  INFO      familiar — Scheduler started — briefing at 08:00
```

---

## 8. Running as a Background Service (Windows)

To keep the bot running after closing your terminal, use Task Scheduler or run in a detached process:

```bash
# Using pythonw (no console window)
pythonw -m bot.discord_bot

# Or via nohup in WSL
nohup py -3 -m bot.discord_bot &
```

For a proper Windows service, use [NSSM](https://nssm.cc/) or a Task Scheduler trigger on system startup.

---

## 9. Set Up Automatic Backups (Optional)

On Linux / WSL:
```bash
chmod +x scripts/backup_db.sh
crontab -e
# Add:
0 3 * * * bash /path/to/familiar/scripts/backup_db.sh
```

Backups are stored in `db/backups/` and pruned after 30 days.

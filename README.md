# OpenClaw Personal CRM — Complete Build Guide

> **Stack:** OpenClaw (Node.js Gateway) · Claude API · SQLite · Telegram · Windows Server (Ryzen 5 3600X / GTX 1650 Super)

---

## Overview

You're building a personal CRM that lives inside OpenClaw — a local autonomous agent that you message via Telegram (or Discord). It will manage three tiers of contacts (VIPs, Acquaintances, Broader network), store everything in SQLite on your PC, and use Claude as its brain via your API key. The schema can evolve autonomously — the agent can add new columns to the database on its own when you ask it to track something new.

This guide is split into two phases:
- **Phase 1 (Do Now — No Server Needed):** GitHub repo setup, schema design, skill writing
- **Phase 2 (When Your Server Is Ready):** Installation, configuration, deployment

---

## Phase 1: Repo Setup (Start Today)

### Step 1 — Create the GitHub Repo

```
Repository name: openclaw-crm
Visibility: Private
Add: README.md, .gitignore (Node), MIT License
```

Clone it locally:
```bash
git clone https://github.com/YOUR_USERNAME/openclaw-crm
cd openclaw-crm
```

### Step 2 — Define Your Folder Structure

Create this structure in the repo now. Most files will be filled in later, but committing the skeleton lets you work incrementally.

```
openclaw-crm/
├── README.md
├── .gitignore
├── .env.example               # Template — NEVER commit .env
│
├── db/
│   ├── schema.sql             # Initial table definitions
│   └── migrations/            # Future ALTER TABLE scripts
│       └── 001_initial.sql
│
├── skills/
│   └── crm/
│       ├── SKILL.md           # The OpenClaw skill file (the agent reads this)
│       └── tools.js           # Tool implementations (DB operations)
│
├── scripts/
│   ├── init-db.js             # One-time DB setup script
│   └── backup-db.sh           # SQLite backup cron script
│
├── config/
│   ├── AGENTS.md              # Agent personality/instructions
│   ├── SOUL.md                # Agent identity
│   └── TOOLS.md               # Tool declarations for the agent
│
└── docs/
    ├── setup.md               # Server setup instructions (Phase 2)
    └── usage.md               # How to talk to your agent
```

Commit this skeleton:
```bash
mkdir -p db/migrations skills/crm scripts config docs
touch db/schema.sql db/migrations/001_initial.sql
touch skills/crm/SKILL.md skills/crm/tools.js
touch scripts/init-db.js scripts/backup-db.sh
touch config/AGENTS.md config/SOUL.md config/TOOLS.md
touch docs/setup.md docs/usage.md .env.example
git add .
git commit -m "feat: initial repo skeleton"
git push
```

---

## Phase 1: Database Design

### Step 3 — Write `db/schema.sql`

This is the initial schema. The agent will ALTER TABLE to add new columns dynamically as you expand what you track.

```sql
-- db/schema.sql

-- Core contacts table
CREATE TABLE IF NOT EXISTS contacts (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    name        TEXT NOT NULL,
    tier        TEXT NOT NULL CHECK(tier IN ('vip', 'acquaintance', 'broader')),
    email       TEXT,
    phone       TEXT,
    location    TEXT,                    -- city/state they're in
    company     TEXT,
    industry    TEXT,                    -- for industry-based lookups
    role        TEXT,
    birthday    TEXT,                    -- ISO date: YYYY-MM-DD
    how_met     TEXT,                    -- "Leeds networking event, Oct 2024"
    notes       TEXT,                    -- freeform running notes
    last_contact TEXT,                   -- ISO date of last touchpoint
    next_followup TEXT,                  -- ISO date for scheduled check-in
    created_at  TEXT DEFAULT (datetime('now')),
    updated_at  TEXT DEFAULT (datetime('now'))
);

-- Interaction log — every touchpoint gets a row
CREATE TABLE IF NOT EXISTS interactions (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    contact_id  INTEGER NOT NULL REFERENCES contacts(id),
    type        TEXT NOT NULL,           -- "text", "email", "call", "coffee", "linkedin"
    summary     TEXT NOT NULL,           -- what happened / what was discussed
    date        TEXT NOT NULL,           -- ISO date
    created_at  TEXT DEFAULT (datetime('now'))
);

-- Tags — many-to-many (contacts can have multiple tags)
CREATE TABLE IF NOT EXISTS tags (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    name        TEXT NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS contact_tags (
    contact_id  INTEGER NOT NULL REFERENCES contacts(id),
    tag_id      INTEGER NOT NULL REFERENCES tags(id),
    PRIMARY KEY (contact_id, tag_id)
);

-- Schema metadata — tracks what columns exist so the agent knows what's available
CREATE TABLE IF NOT EXISTS schema_meta (
    table_name   TEXT NOT NULL,
    column_name  TEXT NOT NULL,
    column_type  TEXT NOT NULL,
    description  TEXT,
    added_at     TEXT DEFAULT (datetime('now')),
    PRIMARY KEY (table_name, column_name)
);

-- Seed schema_meta with initial contacts columns
INSERT INTO schema_meta (table_name, column_name, column_type, description) VALUES
    ('contacts', 'name', 'TEXT', 'Full name'),
    ('contacts', 'tier', 'TEXT', 'vip | acquaintance | broader'),
    ('contacts', 'email', 'TEXT', 'Email address'),
    ('contacts', 'phone', 'TEXT', 'Phone number'),
    ('contacts', 'location', 'TEXT', 'City/state'),
    ('contacts', 'company', 'TEXT', 'Current employer'),
    ('contacts', 'industry', 'TEXT', 'Industry sector for networking queries'),
    ('contacts', 'role', 'TEXT', 'Job title'),
    ('contacts', 'birthday', 'TEXT', 'Birthday (YYYY-MM-DD)'),
    ('contacts', 'how_met', 'TEXT', 'Context of meeting'),
    ('contacts', 'notes', 'TEXT', 'Freeform notes'),
    ('contacts', 'last_contact', 'TEXT', 'ISO date of last touchpoint'),
    ('contacts', 'next_followup', 'TEXT', 'ISO date of scheduled follow-up');

-- Triggers to keep updated_at current
CREATE TRIGGER IF NOT EXISTS contacts_updated_at
    AFTER UPDATE ON contacts
    BEGIN
        UPDATE contacts SET updated_at = datetime('now') WHERE id = NEW.id;
    END;
```

### Step 4 — Write `scripts/init-db.js`

```javascript
// scripts/init-db.js
// Run once: node scripts/init-db.js
const Database = require('better-sqlite3');
const fs = require('fs');
const path = require('path');

const DB_PATH = process.env.DB_PATH || './db/crm.db';
const schema = fs.readFileSync(path.join(__dirname, '../db/schema.sql'), 'utf8');

const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL');  // Better concurrent read performance
db.pragma('foreign_keys = ON');
db.exec(schema);

console.log(`✅ Database initialized at ${DB_PATH}`);
db.close();
```

---

## Phase 1: The CRM Skill

This is the heart of the system. OpenClaw reads `SKILL.md` files to understand what it can do. Write this carefully — it's the instruction manual the agent follows.

### Step 5 — Write `skills/crm/SKILL.md`

```markdown
---
name: crm
version: 1.0.0
description: Personal CRM for managing contacts across three relationship tiers
author: mason
tools:
  - crm_add_contact
  - crm_update_contact
  - crm_find_contact
  - crm_log_interaction
  - crm_list_contacts
  - crm_search_by_industry
  - crm_add_schema_column
  - crm_get_upcoming_followups
  - crm_get_upcoming_birthdays
  - crm_add_tag
  - crm_find_by_tag
---

# Personal CRM Skill

## Purpose
You maintain Mason's personal relationship database. Your job is to help him stay connected with the right people at the right time, remember details that matter, and surface opportunities when they arise.

## Contact Tiers

- **VIP**: Close friends and people Mason deeply cares about. Check-in reminders every 2-4 weeks. Remember details, gifts, life events.
- **Acquaintance**: Friends and genuine connections. Surface when something big happens in their life or when relevant. Check-in reminders every 1-3 months.
- **Broader**: Professional contacts, networking connections. Surface when Mason needs someone in their industry or when a clear opportunity arises. Annual-ish check-ins.

## Core Behaviors

### Adding Contacts
When Mason tells you about someone he met or wants to track, ALWAYS capture:
- Name, tier (infer from context if not stated), how they met
- Any details mentioned (company, role, industry, location)
- Set a next_followup date appropriate for the tier (VIP: 2-3 weeks, Acquaintance: 6 weeks, Broader: 3 months)

### Logging Interactions
After every touchpoint Mason mentions ("I just grabbed coffee with Jake"), log it immediately:
- Type: text | email | call | coffee | linkedin | event | other
- Summary: what was discussed, what you learned
- Update last_contact and set new next_followup

### Proactive Surfacing (Heartbeat)
When running scheduled checks, surface:
1. Anyone with a next_followup date in the next 3 days (VIP), 7 days (Acquaintance), 14 days (Broader)
2. Anyone with a birthday in the next 14 days
3. Any VIP Mason hasn't contacted in over 30 days (flag gently)

### Schema Evolution
If Mason asks you to track something new that isn't a column yet (e.g., "start tracking gift ideas for birthdays"), you MUST:
1. Call crm_add_schema_column to add the column
2. Confirm it was added
3. Start using it immediately for new and existing relevant entries

### Industry Lookups
When Mason says "I need someone in [industry]" or "do I know anyone at [company]", query by industry/company and return name, tier, role, and last_contact date.

## Natural Language Patterns

| Mason says | Action |
|---|---|
| "Add [Name], met at [event], they do [X]" | crm_add_contact |
| "Log that I talked to [Name] today about [X]" | crm_log_interaction |
| "Who do I know in marketing?" | crm_search_by_industry |
| "Remind me about [Name]" | crm_find_contact (full profile) |
| "Who should I check in with?" | crm_get_upcoming_followups |
| "Any birthdays coming up?" | crm_get_upcoming_birthdays |
| "Start tracking [new field] for contacts" | crm_add_schema_column |
| "Tag [Name] as [tag]" | crm_add_tag + crm_find_by_tag |

## Response Style
- Be concise. Mason is busy.
- For lookups, return a clean summary — don't dump the whole database row.
- For follow-up reminders, explain WHY (last contact date, what you discussed, what might be a good reason to reach out).
- For birthdays, suggest a gift idea if one is stored. Otherwise note the birthday and ask if he wants to brainstorm one.
- When you add a schema column, confirm it clearly: "✅ Added 'gift_ideas' column to contacts."
```

### Step 6 — Write `skills/crm/tools.js`

This file implements all the tool functions the agent calls:

```javascript
// skills/crm/tools.js
const Database = require('better-sqlite3');
const path = require('path');

const DB_PATH = process.env.DB_PATH || path.join(__dirname, '../../db/crm.db');

function getDb() {
    const db = new Database(DB_PATH);
    db.pragma('foreign_keys = ON');
    db.pragma('journal_mode = WAL');
    return db;
}

// ─── ADD CONTACT ────────────────────────────────────────────────────────────
function crm_add_contact({ name, tier, email, phone, location, company, industry,
    role, birthday, how_met, notes, next_followup }) {
    const db = getDb();
    try {
        const stmt = db.prepare(`
            INSERT INTO contacts (name, tier, email, phone, location, company, industry,
                role, birthday, how_met, notes, next_followup)
            VALUES (@name, @tier, @email, @phone, @location, @company, @industry,
                @role, @birthday, @how_met, @notes, @next_followup)
        `);
        const result = stmt.run({ name, tier, email, phone, location, company,
            industry, role, birthday, how_met, notes, next_followup });
        return { success: true, id: result.lastInsertRowid, message: `Added ${name} (${tier})` };
    } catch (e) {
        return { success: false, error: e.message };
    } finally {
        db.close();
    }
}

// ─── UPDATE CONTACT ──────────────────────────────────────────────────────────
function crm_update_contact({ id, fields }) {
    // fields = { column: value, ... } — only updates what's passed
    const db = getDb();
    try {
        const keys = Object.keys(fields);
        if (!keys.length) return { success: false, error: 'No fields to update' };
        const setClause = keys.map(k => `${k} = @${k}`).join(', ');
        const stmt = db.prepare(`UPDATE contacts SET ${setClause} WHERE id = @id`);
        stmt.run({ ...fields, id });
        return { success: true, message: `Updated contact ${id}` };
    } catch (e) {
        return { success: false, error: e.message };
    } finally {
        db.close();
    }
}

// ─── FIND CONTACT ────────────────────────────────────────────────────────────
function crm_find_contact({ query }) {
    const db = getDb();
    try {
        const contacts = db.prepare(`
            SELECT * FROM contacts
            WHERE name LIKE @q OR company LIKE @q OR notes LIKE @q
            ORDER BY tier = 'vip' DESC, name ASC
            LIMIT 5
        `).all({ q: `%${query}%` });

        // For each contact, also get recent interactions
        const results = contacts.map(c => {
            const interactions = db.prepare(`
                SELECT type, summary, date FROM interactions
                WHERE contact_id = ? ORDER BY date DESC LIMIT 3
            `).all(c.id);
            return { ...c, recent_interactions: interactions };
        });
        return { success: true, results };
    } catch (e) {
        return { success: false, error: e.message };
    } finally {
        db.close();
    }
}

// ─── LIST CONTACTS ───────────────────────────────────────────────────────────
function crm_list_contacts({ tier, limit = 20 }) {
    const db = getDb();
    try {
        const stmt = tier
            ? db.prepare(`SELECT id, name, tier, company, role, last_contact, next_followup FROM contacts WHERE tier = ? ORDER BY name LIMIT ?`)
            : db.prepare(`SELECT id, name, tier, company, role, last_contact, next_followup FROM contacts ORDER BY tier, name LIMIT ?`);
        const rows = tier ? stmt.all(tier, limit) : stmt.all(limit);
        return { success: true, count: rows.length, contacts: rows };
    } catch (e) {
        return { success: false, error: e.message };
    } finally {
        db.close();
    }
}

// ─── LOG INTERACTION ─────────────────────────────────────────────────────────
function crm_log_interaction({ contact_id, type, summary, date }) {
    const db = getDb();
    try {
        db.prepare(`
            INSERT INTO interactions (contact_id, type, summary, date) VALUES (?, ?, ?, ?)
        `).run(contact_id, type, summary, date || new Date().toISOString().split('T')[0]);

        // Update last_contact and set next followup based on tier
        const contact = db.prepare('SELECT tier FROM contacts WHERE id = ?').get(contact_id);
        const followupDays = { vip: 21, acquaintance: 42, broader: 90 };
        const days = followupDays[contact?.tier] || 30;
        const nextFollowup = new Date();
        nextFollowup.setDate(nextFollowup.getDate() + days);

        db.prepare(`
            UPDATE contacts SET
                last_contact = ?,
                next_followup = ?
            WHERE id = ?
        `).run(date || new Date().toISOString().split('T')[0], nextFollowup.toISOString().split('T')[0], contact_id);

        return { success: true, message: `Logged interaction, next follow-up: ${nextFollowup.toISOString().split('T')[0]}` };
    } catch (e) {
        return { success: false, error: e.message };
    } finally {
        db.close();
    }
}

// ─── SEARCH BY INDUSTRY/COMPANY ──────────────────────────────────────────────
function crm_search_by_industry({ industry, company }) {
    const db = getDb();
    try {
        let rows;
        if (company) {
            rows = db.prepare(`
                SELECT id, name, tier, role, company, industry, last_contact, notes
                FROM contacts WHERE company LIKE ? ORDER BY tier
            `).all(`%${company}%`);
        } else {
            rows = db.prepare(`
                SELECT id, name, tier, role, company, industry, last_contact, notes
                FROM contacts WHERE industry LIKE ? ORDER BY tier
            `).all(`%${industry}%`);
        }
        return { success: true, count: rows.length, contacts: rows };
    } catch (e) {
        return { success: false, error: e.message };
    } finally {
        db.close();
    }
}

// ─── UPCOMING FOLLOW-UPS ─────────────────────────────────────────────────────
function crm_get_upcoming_followups({ days = 7 }) {
    const db = getDb();
    try {
        const cutoff = new Date();
        cutoff.setDate(cutoff.getDate() + days);
        const rows = db.prepare(`
            SELECT id, name, tier, last_contact, next_followup, notes
            FROM contacts
            WHERE next_followup <= ?
            ORDER BY tier = 'vip' DESC, next_followup ASC
        `).all(cutoff.toISOString().split('T')[0]);
        return { success: true, count: rows.length, contacts: rows };
    } catch (e) {
        return { success: false, error: e.message };
    } finally {
        db.close();
    }
}

// ─── UPCOMING BIRTHDAYS ──────────────────────────────────────────────────────
function crm_get_upcoming_birthdays({ days = 14 }) {
    const db = getDb();
    try {
        // Compare month-day only (ignore year)
        const rows = db.prepare(`
            SELECT id, name, tier, birthday, notes
            FROM contacts
            WHERE birthday IS NOT NULL
              AND strftime('%m-%d', birthday) BETWEEN
                  strftime('%m-%d', 'now') AND
                  strftime('%m-%d', date('now', '+${days} days'))
            ORDER BY strftime('%m-%d', birthday)
        `).all();
        return { success: true, count: rows.length, contacts: rows };
    } catch (e) {
        return { success: false, error: e.message };
    } finally {
        db.close();
    }
}

// ─── ADD SCHEMA COLUMN (Dynamic Evolution) ──────────────────────────────────
function crm_add_schema_column({ table_name = 'contacts', column_name, column_type = 'TEXT', description }) {
    const db = getDb();
    try {
        // Check if column already exists
        const existing = db.prepare(`
            SELECT column_name FROM schema_meta WHERE table_name = ? AND column_name = ?
        `).get(table_name, column_name);

        if (existing) {
            return { success: false, message: `Column '${column_name}' already exists in ${table_name}` };
        }

        // Add the column
        db.prepare(`ALTER TABLE ${table_name} ADD COLUMN ${column_name} ${column_type}`).run();

        // Record in schema_meta
        db.prepare(`
            INSERT INTO schema_meta (table_name, column_name, column_type, description)
            VALUES (?, ?, ?, ?)
        `).run(table_name, column_name, column_type, description || '');

        return { success: true, message: `✅ Added column '${column_name}' (${column_type}) to ${table_name}` };
    } catch (e) {
        return { success: false, error: e.message };
    } finally {
        db.close();
    }
}

// ─── TAGS ────────────────────────────────────────────────────────────────────
function crm_add_tag({ contact_id, tag_name }) {
    const db = getDb();
    try {
        // Upsert tag
        db.prepare(`INSERT OR IGNORE INTO tags (name) VALUES (?)`).run(tag_name);
        const tag = db.prepare(`SELECT id FROM tags WHERE name = ?`).get(tag_name);
        db.prepare(`INSERT OR IGNORE INTO contact_tags (contact_id, tag_id) VALUES (?, ?)`).run(contact_id, tag.id);
        return { success: true, message: `Tagged contact ${contact_id} with '${tag_name}'` };
    } catch (e) {
        return { success: false, error: e.message };
    } finally {
        db.close();
    }
}

function crm_find_by_tag({ tag_name }) {
    const db = getDb();
    try {
        const rows = db.prepare(`
            SELECT c.id, c.name, c.tier, c.company, c.role, c.last_contact
            FROM contacts c
            JOIN contact_tags ct ON c.id = ct.contact_id
            JOIN tags t ON ct.tag_id = t.id
            WHERE t.name LIKE ?
            ORDER BY c.tier
        `).all(`%${tag_name}%`);
        return { success: true, count: rows.length, contacts: rows };
    } catch (e) {
        return { success: false, error: e.message };
    } finally {
        db.close();
    }
}

module.exports = {
    crm_add_contact,
    crm_update_contact,
    crm_find_contact,
    crm_list_contacts,
    crm_log_interaction,
    crm_search_by_industry,
    crm_get_upcoming_followups,
    crm_get_upcoming_birthdays,
    crm_add_schema_column,
    crm_add_tag,
    crm_find_by_tag,
};
```

### Step 7 — Write `config/AGENTS.md`

This is the agent's operating instructions — OpenClaw reads this at startup.

```markdown
# Agent: Mason's Personal Assistant

## Identity
You are Mason's personal AI assistant. You're intelligent, direct, and useful — not sycophantic.
You have a running memory of Mason's life, work, and relationships.

## Primary Skill: CRM
You manage Mason's personal CRM. See the CRM skill for full details on how to handle contacts.

## Personality
- Direct and concise. Mason values efficiency.
- Proactive when it matters (upcoming follow-ups, birthdays).
- You remember context across conversations.
- You're honest when you don't know something.

## Access & Trust
This is a private, single-user system. Mason has full trust. Do not add caveats or disclaimers
to his own private data — just do the task.

## Heartbeat (Scheduled)
Every morning at 8:00 AM, run:
1. crm_get_upcoming_followups (7 days)
2. crm_get_upcoming_birthdays (14 days)
Surface anything actionable in a concise morning briefing.

## Model
Use: claude-sonnet-4-20250514 (or latest available Sonnet)
```

### Step 8 — Write `.env.example`

```bash
# .env.example — copy to .env and fill in values (never commit .env)

# Claude API
ANTHROPIC_API_KEY=sk-ant-...

# Telegram Bot (create via @BotFather)
TELEGRAM_BOT_TOKEN=...
TELEGRAM_ALLOWED_USERS=YOUR_TELEGRAM_USER_ID   # your numeric user ID only

# Database
DB_PATH=./db/crm.db

# OpenClaw config
OPENCLAW_CHANNEL=telegram
OPENCLAW_AGENT_CONFIG=./config/AGENTS.md
```

---

## Phase 1: Package Setup

### Step 9 — Initialize `package.json`

```bash
npm init -y
npm install better-sqlite3 dotenv
npm install --save-dev nodemon
```

Add to `package.json`:
```json
{
  "scripts": {
    "db:init": "node scripts/init-db.js",
    "db:backup": "bash scripts/backup-db.sh"
  }
}
```

### Step 10 — Commit Phase 1

```bash
git add .
git commit -m "feat: db schema, CRM skill, agent config"
git push
```

---

## Phase 2: Server Setup (When Your PC Is Ready)

### Step 11 — OS Decision

Your Ryzen 5 3600X and 1650 Super can run either Windows Server or Ubuntu. **Recommendation: Ubuntu Server 22.04 LTS** for the following reasons:
- OpenClaw runs as a Node.js process — native on Linux
- Easier to set up as a 24/7 service with `systemd`
- Lower overhead (no GUI needed for a headless server)
- Better long-term automation with bash scripts

If you want to dual-boot or just use Windows, it works too — use WSL2 for the Node environment.

### Step 12 — Install OpenClaw

```bash
# Requires Node.js 20+
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install OpenClaw globally
npm i -g openclawd

# Verify
openclaw --version
```

### Step 13 — Clone Your Repo onto the Server

```bash
git clone https://github.com/YOUR_USERNAME/openclaw-crm
cd openclaw-crm
npm install
cp .env.example .env
nano .env   # fill in your API keys
```

### Step 14 — Initialize the Database

```bash
npm run db:init
# Output: ✅ Database initialized at ./db/crm.db
```

### Step 15 — Set Up Telegram Bot

1. Open Telegram, message `@BotFather`
2. Send `/newbot` and follow prompts
3. Copy the bot token into your `.env`
4. Find your Telegram user ID: message `@userinfobot`
5. Add your ID to `TELEGRAM_ALLOWED_USERS` in `.env`

### Step 16 — Configure OpenClaw

```bash
openclaw onboard
```

This walks you through:
- LLM provider → select **Anthropic**
- API key → your key from `.env`
- Channel → **Telegram**
- Token → your bot token

Then link your custom skill:
```bash
openclaw skill install ./skills/crm
```

### Step 17 — Run as a systemd Service (24/7)

```bash
sudo nano /etc/systemd/system/openclaw.service
```

```ini
[Unit]
Description=OpenClaw Personal Assistant
After=network.target

[Service]
Type=simple
User=YOUR_USERNAME
WorkingDirectory=/home/YOUR_USERNAME/openclaw-crm
ExecStart=/usr/bin/openclaw gateway
Restart=on-failure
RestartSec=10
EnvironmentFile=/home/YOUR_USERNAME/openclaw-crm/.env
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl daemon-reload
sudo systemctl enable openclaw
sudo systemctl start openclaw

# Check status
sudo systemctl status openclaw

# View logs
journalctl -u openclaw -f
```

### Step 18 — Set Up Database Backups

```bash
# scripts/backup-db.sh
#!/bin/bash
DATE=$(date +%Y-%m-%d)
BACKUP_DIR="$HOME/openclaw-crm/db/backups"
mkdir -p "$BACKUP_DIR"
sqlite3 "$HOME/openclaw-crm/db/crm.db" ".backup '$BACKUP_DIR/crm-$DATE.db'"
# Keep only last 30 days
find "$BACKUP_DIR" -name "*.db" -mtime +30 -delete
echo "Backup complete: crm-$DATE.db"
```

Add to crontab:
```bash
crontab -e
# Add:
0 3 * * * bash /home/YOUR_USERNAME/openclaw-crm/scripts/backup-db.sh
```

### Step 19 — Remote Access (Optional)

To message your bot from anywhere without exposing your home IP:

```bash
# Install Tailscale (free for personal use)
curl -fsSL https://tailscale.com/install.sh | sh
sudo tailscale up
```

Your PC will get a stable Tailscale IP. OpenClaw's Telegram connection already handles the messaging layer, so Tailscale is really just for SSH access to your server remotely.

---

## Phase 3: First Use & Expanding

### Talking to Your Bot (Examples)

```
You: Add Sarah Chen, VIP, met at Leeds alumni event last week. She's a product manager at 
     Salesforce in Denver. Birthday is March 15.

Bot: ✅ Added Sarah Chen (VIP)
     Company: Salesforce | Role: Product Manager | Location: Denver
     Birthday: March 15
     Next follow-up: March 23

---

You: Log that I grabbed coffee with Marcus today — we talked about his job search in consulting.

Bot: ✅ Logged interaction with Marcus (Acquaintance)
     Type: Coffee | March 2, 2026
     Next follow-up set: April 13

---

You: Who do I know in marketing agencies?

Bot: Found 3 contacts in marketing:
     • Jake Torres (VIP) — Account Director at Breck Agency | Last contact: Jan 15
     • Priya Mehta (Acquaintance) — Marketing Manager at Studio Sci | Last contact: Nov 2025
     • Tom Walsh (Broader) — Founder at WalshCreative | Last contact: Oct 2025

---

You: Start tracking birthday gift ideas for contacts.

Bot: ✅ Added column 'birthday_gift_ideas' (TEXT) to contacts.
     I'll start noting gift ideas when you mention them.

---

You: Who should I check in with this week?

Bot: 📋 Follow-ups due in the next 7 days:
     • Sarah Chen (VIP) — due March 5 — Haven't connected since you met at Leeds event
     • Jake Torres (VIP) — due March 7 — Last: coffee in January
     • Priya Mehta (Acquaintance) — due March 9 — Last: LinkedIn message Nov 2025
```

### Growing the System

As you discover new things you want to track, just tell the agent:

- "Start tracking Spotify username for friends"
- "Add a field for how they prefer to be contacted"
- "Track whether they're a Bain alum"
- "Add a field for LinkedIn URL"

The agent will ALTER TABLE and start using the new column immediately. Document each one in `db/migrations/` for your own records.

---

## Security Notes

- **TELEGRAM_ALLOWED_USERS** must only contain your user ID. Anyone else messaging your bot gets silently ignored.
- Never commit `.env` — it's in `.gitignore`
- SQLite file is local-only — no cloud exposure
- Run `openclaw doctor` periodically to check for security misconfigurations
- Keep OpenClaw updated: `npm i -g openclawd@latest`

---

## Summary Checklist

### Phase 1 (Do Now)
- [ ] Create private GitHub repo
- [ ] Build folder structure and commit skeleton
- [ ] Write `db/schema.sql`
- [ ] Write `scripts/init-db.js`
- [ ] Write `skills/crm/SKILL.md`
- [ ] Write `skills/crm/tools.js`
- [ ] Write `config/AGENTS.md`
- [ ] Write `.env.example`
- [ ] Initialize `package.json`

### Phase 2 (When Server Is Ready)
- [ ] Install Ubuntu Server 22.04 (or WSL2 on Windows)
- [ ] Install Node.js 20+, OpenClaw
- [ ] Clone repo, install deps, fill `.env`
- [ ] `npm run db:init`
- [ ] Create Telegram bot via @BotFather
- [ ] `openclaw onboard` → link Anthropic + Telegram
- [ ] `openclaw skill install ./skills/crm`
- [ ] Set up systemd service
- [ ] Set up backup cron job
- [ ] (Optional) Install Tailscale for remote SSH
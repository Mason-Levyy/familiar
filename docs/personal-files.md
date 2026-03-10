# Personal Files — What Lives Where

This is a public repo. Any file containing personal context (real names, contacts, projects, school, employer, machine paths) must be **gitignored**.

---

## Gitignored Personal Files

These files live on your machine but are never committed. Create them from the stubs below.

| File | Purpose |
|---|---|
| `USER.md` | Who you are — name, pronouns, timezone, context |
| `IDENTITY.md` | Bot persona — name, vibe, avatar |
| `HEARTBEAT.md` | Active reminders, project check-ins, follow-up nudges |
| `TOOLS.md` | Local operational notes — paths, aliases, runtime state |
| `memory/` | Claude Code persistent memory (auto-managed) |
| `projects/` | Active project logs and working notes |

---

## File Stubs

### USER.md

```markdown
# USER.md - About [Your Name]

- **Name:** [Your Name]
- **What to call them:** [Preferred name]
- **Pronouns:** [pronouns]
- **Timezone:** [timezone]
- **Discord:** [handle]

## Context

[Background, what you're working on, goals]

## Preferences

[Communication style, workflow preferences]
```

### IDENTITY.md

```markdown
# IDENTITY.md

- **Name:** [Bot name]
- **Creature:** [Persona description]
- **Vibe:** [Tone and personality]
- **Emoji:** [emoji]
- **Avatar:** [URL or "not set"]
```

### HEARTBEAT.md

```markdown
# HEARTBEAT.md

## Active Reminders

### [Project Name]
[Description, check-in cadence, open items]

---

## Routine Checks (rotate, 2–4x/day)
- Upcoming CRM follow-ups (`crm_get_upcoming_followups`)
- Upcoming birthdays (`crm_get_upcoming_birthdays`)
- Any open project items worth surfacing
```

### TOOLS.md

```markdown
# TOOLS.md - Local Notes

## Skill File
Deployed to: `~/.openclaw/workspace/skills/crm/SKILL.md`

## Scripts
- `scripts/crm-recent.sh` -- view recent CRM table rows

## CRM Schema -- Custom Columns Added
[Document any dynamic columns added at runtime]

## Platform Notes
[Discord formatting quirks, bot username, etc.]

## My Setup
- Machine: [hostname]
- Workspace: [path]
- CRM DB: [path]
```

---

## projects/ Structure

Each project lives in `projects/<project-slug>/` with three files:

```
projects/
└── my-project/
    ├── README.md         # Project context and check-in schedule
    ├── log.md            # Running log with dated entries and tags
    └── best-practices.md # Compiled at project end from log entries
```

See `projects/example/` for a template.

---

## Rule of Thumb

> If it contains your name, someone else's name, a specific organization, a real project, or machine paths — it belongs in a gitignored file.

When in doubt, add it to `TOOLS.md` or `HEARTBEAT.md`.

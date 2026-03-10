# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What This Is

Familiar is a personal CRM Discord bot running as an **OpenClaw plugin**. User DMs a Discord bot, OpenClaw routes to Claude, Claude calls CRM tools against SQLite, response goes back. The CRM is **append-only** (no delete operations) with a **self-evolving schema** — the agent dynamically adds columns via `crm_add_schema_column` when new data types are mentioned.

## Build & Run

```bash
npm install
npm run build          # tsc → dist/
npm run dev            # tsc --watch
npm run db:init        # tsx scripts/initDb.ts (bootstraps SQLite from db/schema.sql)
```

Requires **Node.js >= 22** (uses built-in `node:sqlite`). Run with `--experimental-sqlite` flag when executing scripts directly.

Database path resolution order: `pluginConfig.dbPath` → `CRM_DB_PATH` env var → `db/crm.db`.

## Architecture

**Plugin entry:** `src/index.ts` exports a single `registerCrmTools(api)` function. It registers 12 tools (11 CRM + 1 self-improvement) with the OpenClaw API. Each tool receives `databasePath` via closure and delegates to a pure function in `src/tools/`.

**Tool pattern:** Every file in `src/tools/` exports one function with signature `(databasePath: string, params: T) => ResultObject`. Each function opens its own `DatabaseSync` connection, runs queries, and closes it in a `finally` block. Tools return plain objects (serialized to JSON by `toolResult()` in index.ts).

**Database layer:** `src/db.ts` provides `openDatabase()` (sets WAL mode + foreign keys), date helpers (`todayIso`, `followupDate`, `formatMonthDay`). Follow-up cadence: vip=21 days, acquaintance=42 days, broader=90 days.

**Schema:** 5 tables defined in `db/schema.sql` — `contacts`, `interactions`, `tags`, `contact_tags`, `schema_meta`. The `schema_meta` table tracks dynamically-added columns. Migrations live in `db/migrations/`.

**Skill:** `skills/crm/SKILL.md` is the system prompt (YAML frontmatter listing tool names + markdown instructions). It defines the bot's personality, CRM behavior, and self-improvement rules.

**Self-improvement:** `bot_propose_change` tool (`src/tools/proposeSelfImprovement.ts`) lets the bot create branches, write files, commit, push, and open GitHub PRs. Protected branches (main/master) are blocked. Requires `gh` CLI.

## Tool Parameter Schemas

Tool parameters use `@sinclair/typebox` (`Type.Object`, `Type.String`, etc.) — these compile to JSON Schema for the LLM. When adding a new tool, follow the existing pattern: define a TypeBox schema in `index.ts` and a corresponding TypeScript interface in the tool file.

## Adding a New Tool

1. Create `src/tools/yourTool.ts` exporting a function with signature `(databasePath: string, params: YourParams) => object`
2. Import it in `src/index.ts` and add an `api.registerTool()` call with TypeBox parameter schema
3. Add the tool name to `skills/crm/SKILL.md` frontmatter `tools:` list
4. Run `npm run build` to verify

## Personal Files (Never Commit)

This is a public repo. Keep personal context in **gitignored files only**. See `docs/personal-files.md` for the full guide.

Gitignored personal files:
- `USER.md` — who the user is, preferences, background
- `IDENTITY.md` — bot name, persona, avatar
- `HEARTBEAT.md` — active reminders, project check-ins, follow-up nudges
- `TOOLS.md` — local operational notes (paths, aliases, runtime state)
- `memory/` — Claude Code persistent memory
- `projects/` — active project logs and working notes

If you are about to write personal info (real name, specific projects, contact details, school, employer) anywhere, stop and check: is this file gitignored? If not, put it in one of the files above instead.

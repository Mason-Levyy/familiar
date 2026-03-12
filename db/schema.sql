CREATE TABLE IF NOT EXISTS contacts (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    name        TEXT NOT NULL,
    tier        TEXT NOT NULL CHECK(tier IN ('vip', 'acquaintance', 'broader')),
    email       TEXT,
    phone       TEXT,
    location    TEXT,                    
    company     TEXT,
    industry    TEXT,      
    role        TEXT,
    birthday    TEXT,                  
    how_met     TEXT,                  
    notes       TEXT,                    
    last_contact TEXT,                   
    next_followup TEXT,                
    created_at  TEXT DEFAULT (datetime('now')),
    updated_at  TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS interactions (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    contact_id  INTEGER NOT NULL REFERENCES contacts(id),
    type        TEXT NOT NULL,          
    summary     TEXT NOT NULL,          
    date        TEXT NOT NULL,          
    created_at  TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS tags (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    name        TEXT NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS contact_tags (
    contact_id  INTEGER NOT NULL REFERENCES contacts(id),
    tag_id      INTEGER NOT NULL REFERENCES tags(id),
    PRIMARY KEY (contact_id, tag_id)
);

CREATE TABLE IF NOT EXISTS schema_meta (
    table_name   TEXT NOT NULL,
    column_name  TEXT NOT NULL,
    column_type  TEXT NOT NULL,
    description  TEXT,
    added_at     TEXT DEFAULT (datetime('now')),
    PRIMARY KEY (table_name, column_name)
);

INSERT OR IGNORE INTO schema_meta (table_name, column_name, column_type, description) VALUES
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

CREATE TRIGGER IF NOT EXISTS contacts_updated_at
    AFTER UPDATE ON contacts
    BEGIN
        UPDATE contacts SET updated_at = datetime('now') WHERE id = NEW.id;
    END;

-- ============================================================
-- Project Management Tables
-- ============================================================

CREATE TABLE IF NOT EXISTS projects (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    name        TEXT NOT NULL,
    slug        TEXT NOT NULL UNIQUE,
    status      TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active','paused','completed','archived')),
    goal        TEXT,
    role        TEXT,
    organization TEXT,
    start_date  TEXT,
    end_date    TEXT,
    checkin_cadence_hours INTEGER DEFAULT 48,
    notes       TEXT,
    created_at  TEXT DEFAULT (datetime('now')),
    updated_at  TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS tasks (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    project_id  INTEGER NOT NULL REFERENCES projects(id),
    title       TEXT NOT NULL,
    status      TEXT NOT NULL DEFAULT 'todo' CHECK(status IN ('todo','in_progress','done','blocked')),
    priority    TEXT DEFAULT 'medium' CHECK(priority IN ('low','medium','high','urgent')),
    due_date    TEXT,
    notes       TEXT,
    completed_at TEXT,
    created_at  TEXT DEFAULT (datetime('now')),
    updated_at  TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS project_logs (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    project_id  INTEGER NOT NULL REFERENCES projects(id),
    summary     TEXT NOT NULL,
    tags        TEXT,
    date        TEXT NOT NULL,
    created_at  TEXT DEFAULT (datetime('now'))
);

CREATE TRIGGER IF NOT EXISTS projects_updated_at
    AFTER UPDATE ON projects
    BEGIN
        UPDATE projects SET updated_at = datetime('now') WHERE id = NEW.id;
    END;

CREATE TRIGGER IF NOT EXISTS tasks_updated_at
    AFTER UPDATE ON tasks
    BEGIN
        UPDATE tasks SET updated_at = datetime('now') WHERE id = NEW.id;
    END;

INSERT OR IGNORE INTO schema_meta (table_name, column_name, column_type, description) VALUES
    ('projects', 'name', 'TEXT', 'Project display name'),
    ('projects', 'slug', 'TEXT', 'URL-safe unique identifier'),
    ('projects', 'status', 'TEXT', 'active | paused | completed | archived'),
    ('projects', 'goal', 'TEXT', 'What the project aims to accomplish'),
    ('projects', 'role', 'TEXT', 'Your role on the project'),
    ('projects', 'organization', 'TEXT', 'Client or organization'),
    ('projects', 'start_date', 'TEXT', 'ISO date project started'),
    ('projects', 'end_date', 'TEXT', 'ISO date project ended or expected to end'),
    ('projects', 'checkin_cadence_hours', 'INTEGER', 'How often to check in (hours)'),
    ('projects', 'notes', 'TEXT', 'Freeform project notes'),
    ('tasks', 'title', 'TEXT', 'Task description'),
    ('tasks', 'status', 'TEXT', 'todo | in_progress | done | blocked'),
    ('tasks', 'priority', 'TEXT', 'low | medium | high | urgent'),
    ('tasks', 'due_date', 'TEXT', 'ISO date task is due'),
    ('tasks', 'completed_at', 'TEXT', 'ISO datetime task was completed'),
    ('project_logs', 'summary', 'TEXT', 'What happened'),
    ('project_logs', 'tags', 'TEXT', 'Comma-separated tags (meeting, decision, blocker, etc.)');
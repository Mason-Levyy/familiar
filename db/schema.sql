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

CREATE TRIGGER IF NOT EXISTS contacts_updated_at
    AFTER UPDATE ON contacts
    BEGIN
        UPDATE contacts SET updated_at = datetime('now') WHERE id = NEW.id;
    END;
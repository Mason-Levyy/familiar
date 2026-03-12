#!/usr/bin/env bash
# Backup the CRM SQLite database. Run via cron: 0 3 * * * bash /path/to/backup_db.sh
# Add to crontab: crontab -e

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(dirname "$SCRIPT_DIR")"

DB_PATH="${DB_PATH:-$REPO_ROOT/db/familiar.db}"
BACKUP_DIR="$REPO_ROOT/db/backups"
DATE=$(date +%Y-%m-%d)

mkdir -p "$BACKUP_DIR"

if [ ! -f "$DB_PATH" ]; then
    echo "ERROR: Database not found at $DB_PATH" >&2
    exit 1
fi

sqlite3 "$DB_PATH" ".backup '$BACKUP_DIR/crm-$DATE.db'"

# Keep only the last 30 days of backups
find "$BACKUP_DIR" -name "*.db" -mtime +30 -delete

echo "Backup complete: $BACKUP_DIR/crm-$DATE.db"

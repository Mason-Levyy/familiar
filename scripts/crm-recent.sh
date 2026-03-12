#!/bin/bash
# crm-recent — show the most recent rows from any CRM table in markdown
# Usage: crm-recent [table] [limit]
#   table — contacts | interactions | tags | contact_tags | schema_meta  (default: contacts)
#   limit — number of rows (default: 5)

DB="$HOME/familiar/db/familiar.db"
TABLE="${1:-contacts}"
LIMIT="${2:-5}"

VALID_TABLES="contacts interactions tags contact_tags schema_meta"
if ! echo "$VALID_TABLES" | grep -qw "$TABLE"; then
  echo "Error: unknown table '$TABLE'" >&2
  echo "Valid tables: $VALID_TABLES" >&2
  exit 1
fi

if ! [[ "$LIMIT" =~ ^[0-9]+$ ]]; then
  echo "Error: limit must be a positive integer" >&2
  exit 1
fi

# Determine the order-by column: prefer created_at, then id
ORDER_COL=$(sqlite3 "$DB" "SELECT name FROM pragma_table_info('$TABLE') WHERE name IN ('created_at','id') ORDER BY CASE name WHEN 'created_at' THEN 0 ELSE 1 END LIMIT 1;")

sqlite3 -markdown "$DB" "SELECT * FROM $TABLE ORDER BY $ORDER_COL DESC LIMIT $LIMIT;"

#!/bin/bash
# One-time cleanup script — run once after merging, then delete this file.

echo "Removing stale crm/contacts from git tracking..."
git rm -r --cached crm/ 2>/dev/null && echo "Untracked crm/ from git."
rm -rf crm/

echo "Ensuring PPI files are untracked..."
git rm --cached USER.md MEMORY.md IDENTITY.md 2>/dev/null

echo "Done. Commit the result:"
echo "  git add .gitignore && git commit -m 'chore: remove stale tracked PPI files'"
echo ""
echo "Then delete this script: rm cleanup.sh"

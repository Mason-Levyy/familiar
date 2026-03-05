#!/bin/bash
# Deploy the latest changes to the server.
# Run this on the server whenever you push an update:
#
#   bash scripts/deploy.sh
#
# What it does:
#   1. Pulls latest code from git
#   2. Installs/updates Python dependencies
#   3. Applies any pending DB migrations
#   4. Restarts the systemd service

set -euo pipefail

REPO_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SERVICE_NAME="familiar"

echo "=== Deploying familiar ==="

cd "$REPO_DIR"

echo "--- Pulling latest code ---"
git pull

echo "--- Installing dependencies ---"
if [ -d ".venv" ]; then
    source .venv/bin/activate
fi
pip install -q -r requirements.txt

echo "--- Running migrations ---"
python3 scripts/migrate.py

echo "--- Restarting service ---"
sudo systemctl restart "$SERVICE_NAME"
sudo systemctl status "$SERVICE_NAME" --no-pager

echo "=== Deploy complete ==="

#!/usr/bin/env bash
# weather.sh — Quick weather lookup via wttr.in
# Usage: ./scripts/weather.sh [location]
# Default location: Boulder, CO

LOCATION="${1:-Boulder,CO}"
LOCATION_ENCODED=$(echo "$LOCATION" | sed 's/ /+/g')

echo "📍 Weather for $LOCATION"
echo ""

# One-line summary
curl -s "wttr.in/${LOCATION_ENCODED}?format=3"
echo ""

# Detailed conditions
curl -s "wttr.in/${LOCATION_ENCODED}?format=%l:+%c+%t+(feels+like+%f),+%w+wind,+%h+humidity"
echo ""

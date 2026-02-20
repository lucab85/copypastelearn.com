#!/bin/bash
# Fetches the Playback ID for each Mux Asset ID stored in seed.ts
#
# Usage:
#   MUX_ACCESS_TOKEN=<your-token-id> MUX_SECRET_KEY=<your-secret-key> bash scripts/fetch-mux-playback-ids.sh
#
# Get your API keys from: https://dashboard.mux.com/settings/api-keys

set -euo pipefail

if [[ -z "${MUX_ACCESS_TOKEN:-}" || -z "${MUX_SECRET_KEY:-}" ]]; then
  echo "Error: Set MUX_ACCESS_TOKEN and MUX_SECRET_KEY environment variables."
  echo "Get them from: https://dashboard.mux.com/settings/api-keys"
  exit 1
fi

ASSET_IDS=(
  "LSfDw0001oFCMmfJ01mabZ9h201V8os00PgumnGcBRE12XHA"
  "qmw5QJczu2WjWcSxhyxOb7idsdMdclw5sxO2s29nvmQ"
  "02ZcrKlQmJx013eEWDZck7TPznY9NUraUo005Zmao201GSA"
  "TozvrFdDifmf1DLVZ9dF1PWn00bUgsKdGEZ02y01eve6AI"
  "5xmz6u8C6I9LzUHM2KGtPHC9mj00YfIIq02atBDglhNRA"
  "fsCcqW28WIbzBlobrNCqSRJNfjSxv7GU02xrfQ1O00iC8"
)

LESSON_NAMES=(
  "Introduction to Ansible"
  "Installing Ansible"
  "Inventory Files"
  "Ad-Hoc Commands"
  "Writing First Playbook"
  "Variables and Facts"
)

echo "Fetching Playback IDs from Mux API..."
echo ""

for i in "${!ASSET_IDS[@]}"; do
  ASSET_ID="${ASSET_IDS[$i]}"
  LESSON="${LESSON_NAMES[$i]}"
  
  RESPONSE=$(curl -s "https://api.mux.com/video/v1/assets/${ASSET_ID}" \
    -u "${MUX_ACCESS_TOKEN}:${MUX_SECRET_KEY}")
  
  PLAYBACK_ID=$(echo "$RESPONSE" | python3 -c "
import sys, json
data = json.load(sys.stdin)
if 'data' in data and 'playback_ids' in data['data']:
    pids = data['data']['playback_ids']
    if pids:
        print(pids[0]['id'])
    else:
        print('NO_PLAYBACK_ID')
else:
    error = data.get('error', {}).get('messages', ['Unknown error'])
    print(f'ERROR: {error}')
" 2>/dev/null || echo "PARSE_ERROR")

  POLICY=$(echo "$RESPONSE" | python3 -c "
import sys, json
data = json.load(sys.stdin)
if 'data' in data and 'playback_ids' in data['data']:
    pids = data['data']['playback_ids']
    if pids:
        print(pids[0].get('policy', 'unknown'))
" 2>/dev/null || echo "unknown")

  echo "Lesson: ${LESSON}"
  echo "  Asset ID:    ${ASSET_ID}"
  echo "  Playback ID: ${PLAYBACK_ID}"
  echo "  Policy:      ${POLICY}"
  echo ""
done

echo "--- seed.ts update values ---"
echo "Replace the videoPlaybackId values with the Playback IDs above."

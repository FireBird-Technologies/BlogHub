#!/usr/bin/env bash
# Trigger monthly roundup generation by calling the backend endpoint, the same way
# the weekly email digest is triggered. Designed to be run from cron on the droplet.
#
# Reads CRON_SECRET from backend/.env (alongside the rest of the backend config) so
# no secret is hard-coded here. Idempotent: safe to run repeatedly — it never
# duplicates a publication across months and skips categories with no new blogs.
#
# Cron example (1st of each month 06:00, see crontab setup in README/this dir):
#   0 6 1 * *  /root/BlogHub/backend/scripts/generate_roundups.sh >> /var/log/bloghub-roundups.log 2>&1

set -euo pipefail

# Resolve repo paths relative to this script so it works regardless of CWD.
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ENV_FILE="${SCRIPT_DIR}/../.env"
API_BASE="${API_BASE:-http://localhost:8081}"

if [ ! -f "$ENV_FILE" ]; then
  echo "[$(date -u +%FT%TZ)] backend/.env not found at $ENV_FILE" >&2
  exit 1
fi

CRON_SECRET="$(grep -E '^CRON_SECRET=' "$ENV_FILE" | head -n1 | cut -d= -f2-)"
if [ -z "${CRON_SECRET:-}" ]; then
  echo "[$(date -u +%FT%TZ)] CRON_SECRET is not set in backend/.env" >&2
  exit 1
fi

echo "[$(date -u +%FT%TZ)] Generating weekly roundups..."
curl -fsS -X POST "${API_BASE}/api/roundups/generate" \
  -H "X-Cron-Secret: ${CRON_SECRET}"
echo
echo "[$(date -u +%FT%TZ)] Done."

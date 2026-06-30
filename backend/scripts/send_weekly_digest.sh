#!/usr/bin/env bash
# Trigger the weekly top-5 email digest by calling the backend endpoint. Designed to
# be run from cron on the droplet. The counterpart to send_underrated_digest.sh.
#
# Reads CRON_SECRET from backend/.env (alongside the rest of the backend config) so
# no secret is hard-coded here. Best-effort: emails are sent per subscriber and
# individual failures are logged server-side rather than aborting the run.
#
# Cron example (every Monday 06:00 UTC, see crontab setup in README/this dir):
#   0 6 * * 1  /root/BlogHub/backend/scripts/send_weekly_digest.sh >> /var/log/bloghub-digest.log 2>&1

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

echo "[$(date -u +%FT%TZ)] Sending weekly top-5 digest..."
curl -fsS -X POST "${API_BASE}/api/publications/top-weekly/send-digest" \
  -H "X-Cron-Secret: ${CRON_SECRET}"
echo
echo "[$(date -u +%FT%TZ)] Done."

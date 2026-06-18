# Scheduled jobs

These run on the droplet via system `cron`, the same mechanism as the weekly email
digest (`POST /api/publications/top-weekly/send-digest`). Both endpoints are guarded
by the `X-Cron-Secret` header, whose value lives in `backend/.env` as `CRON_SECRET`.

## Monthly category roundups

`generate_roundups.sh` calls `POST /api/roundups/generate`, which builds this month's
"Top [category] blogs" pages (the 5 highest-ranked publications created that month).
It is idempotent — safe to run repeatedly; it never duplicates a publication across
months and skips categories with no qualifying blogs.

### One-time setup on the droplet

1. Make sure `CRON_SECRET` is set in `backend/.env` (any long random string):

   ```bash
   grep -q '^CRON_SECRET=' backend/.env || echo "CRON_SECRET=$(openssl rand -hex 32)" >> backend/.env
   # then restart the backend so it picks up the value:
   docker compose up -d --force-recreate backend
   ```

2. Add the cron entry (`crontab -e` as root) — 1st of each month, 06:00 UTC:

   ```cron
   0 6 1 * *  /root/BlogHub/backend/scripts/generate_roundups.sh >> /var/log/bloghub-roundups.log 2>&1
   ```

   Adjust the path if the repo lives elsewhere on the droplet.

### Run it manually any time

```bash
/root/BlogHub/backend/scripts/generate_roundups.sh
```

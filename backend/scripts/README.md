# Scheduled jobs

These run on the droplet via system `cron`. Each script wraps a single backend
endpoint guarded by the `X-Cron-Secret` header, whose value lives in `backend/.env`
as `CRON_SECRET` (the scripts read it from there so it's never hard-coded in crontab).

| Script | Endpoint | Schedule |
|---|---|---|
| `generate_roundups.sh` | `POST /api/roundups/generate` | 1st of month, 06:00 UTC |
| `send_weekly_digest.sh` | `POST /api/publications/top-weekly/send-digest` | weekly |
| `send_underrated_digest.sh` | `POST /api/publications/underrated-weekly/send-digest` | weekly |

> Featured-slot reconciliation is **not** in this table — it runs inside the backend
> process itself, not from cron. See "Featured slot reconciliation" below.

## Monthly category roundups

`generate_roundups.sh` calls `POST /api/roundups/generate`, which builds last month's
"Top [category] blogs" pages. Each page now carries **two** lists: the 5 highest-ranked
publications created that month (Top picks) and the 5 lowest-ranked (Underrated gems),
shown side by side on the roundup page. It is idempotent — safe to run repeatedly; it
never duplicates a publication across months in the top list and skips categories with
no qualifying blogs.

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

## Weekly top-5 email digest

`send_weekly_digest.sh` calls `POST /api/publications/top-weekly/send-digest`, which
emails the 5 *highest-upvoted* publications from the past 7 days to every subscribed
user.

### Cron entry (`crontab -e` as root) — every Monday, 06:00 UTC

```cron
0 6 * * 1  /root/BlogHub/backend/scripts/send_weekly_digest.sh >> /var/log/bloghub-digest.log 2>&1
```

### Run it manually any time

```bash
/root/BlogHub/backend/scripts/send_weekly_digest.sh
```

## Weekly underrated email digest

`send_underrated_digest.sh` calls `POST /api/publications/underrated-weekly/send-digest`,
which emails the 5 *lowest-upvoted* publications from the past 7 days to every subscribed
user — a counterpart to the existing top-5 weekly digest. Same `X-Cron-Secret` guard and
`backend/.env` config; no extra settings needed (reuses `RESEND_API_KEY` and
`NEWSLETTER_FROM_EMAIL`).

### Cron entry (`crontab -e` as root) — every Monday, 07:00 UTC

```cron
0 7 * * 1  /root/BlogHub/backend/scripts/send_underrated_digest.sh >> /var/log/bloghub-underrated.log 2>&1
```

### Run it manually any time

```bash
/root/BlogHub/backend/scripts/send_underrated_digest.sh
```

## Featured slot reconciliation

Unlike the jobs above, this one has **no cron entry and no script** — it runs on a
timer inside the FastAPI process (`app/scheduler.py`, started by the lifespan in
`app/main.py`) every **5 hours**. There is nothing to install on the droplet; it
starts and stops with the backend.

It keeps the paid "featured publication" slot honest. Three things, in order:

1. **Releases lapsed holds** — a booking sits in `pending` for 30 minutes while the
   buyer is on Stripe's checkout page, reserving those dates. If they never pay, it
   is marked `expired` and the dates free up.
2. **Retires finished bookings** — anything whose `end_date` has passed becomes
   `expired` and inactive.
3. **Activates today's booking** — the paid booking covering today becomes the single
   active feature (shown on the landing page and dashboard).

Bookings never overlap, so at most one can be active; a partial unique index on
`is_active` enforces that at the DB level. The endpoint is idempotent, so running it
more often than every 5 hours is harmless.

Payment itself is confirmed by the Stripe webhook (`POST /stripe/webhook`), not by
this job — the job only does the durable bookkeeping. A same-day purchase is activated
immediately by the webhook, so a buyer never waits up to 5 hours to appear.

Bookings never overlap, so at most one can be active; a partial unique index on
`is_active` enforces that at the DB level. Reconciliation is idempotent and takes a
Postgres advisory lock, so extra runs are harmless.

### Caveats of running it in-process

- It runs **once per backend instance**. That is safe (idempotent + advisory-locked),
  but if the backend is ever scaled past one container, each one runs its own timer.
- The timer **restarts on deploy**. Redeploying more often than every 5 hours would
  keep resetting it before it fires.

If either becomes a problem, move it back to cron: `POST /api/featured/reconcile` is
still there, guarded by `X-Cron-Secret` like the jobs above.

### Run it manually any time

```bash
curl -X POST http://localhost:8081/api/featured/reconcile \
  -H "X-Cron-Secret: $(grep -E '^CRON_SECRET=' backend/.env | cut -d= -f2-)"
```

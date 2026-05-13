#!/bin/sh
set -e
cd /app

DB_HOST="${DB_HOST:-db}"
DB_PORT="${DB_PORT:-5432}"

echo "Waiting for PostgreSQL at ${DB_HOST}:${DB_PORT}..."
python - <<'PY'
import os, socket, time
host = os.environ.get("DB_HOST", "db")
port = int(os.environ.get("DB_PORT", "5432"))
for i in range(60):
    try:
        s = socket.create_connection((host, port), timeout=2)
        s.close()
        print("Database is up.")
        break
    except OSError:
        time.sleep(1)
else:
    raise SystemExit("Timed out waiting for database.")
PY

echo "Running migrations..."
alembic upgrade head

echo "Starting API..."
exec uvicorn app.main:app --host 0.0.0.0 --port 8000

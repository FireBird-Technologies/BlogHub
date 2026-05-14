#!/bin/sh
set -e
cd /app

echo "Waiting for database..."
python3 - <<'PY'
import os, socket, time
from urllib.parse import urlparse

url = urlparse(os.environ.get("DATABASE_URL", ""))
host = os.environ.get("DB_HOST") or url.hostname or "localhost"
port = int(os.environ.get("DB_PORT") or url.port or 5432)

print(f"Connecting to {host}:{port}...")
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

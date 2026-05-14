#!/bin/sh
set -e
cd /app

# Parse host and port from DATABASE_URL if not explicitly set
eval "$(python3 - <<'PY'
import os
from urllib.parse import urlparse
url = urlparse(os.environ.get("DATABASE_URL", ""))
host = os.environ.get("DB_HOST") or url.hostname or "localhost"
port = os.environ.get("DB_PORT") or str(url.port or 5432)
print(f"DB_HOST={host}")
print(f"DB_PORT={port}")
PY
)"

echo "Waiting for PostgreSQL at ${DB_HOST}:${DB_PORT}..."
python3 - <<'PY'
import os, socket, time
host = os.environ["DB_HOST"]
port = int(os.environ["DB_PORT"])
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

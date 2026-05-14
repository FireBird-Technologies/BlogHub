#!/bin/sh
set -e
cd /app

echo "Waiting for database..."
python3 - <<'PY'
import os, socket, time, sys
from urllib.parse import urlparse

db_url = os.environ.get("DATABASE_URL", "").strip().strip('"').strip("'")
if not db_url:
    sys.exit(
        "ERROR: DATABASE_URL is empty inside the container.\n"
        "  docker compose reads ${DATABASE_URL} from a .env file located NEXT TO\n"
        "  docker-compose.yml (the repo root), NOT backend/.env.\n"
        "  Fix: create ~/BlogHub/.env with DATABASE_URL=... then redeploy."
    )

url = urlparse(db_url)
host = os.environ.get("DB_HOST") or url.hostname
port = int(os.environ.get("DB_PORT") or url.port or 5432)

if not host:
    sys.exit(
        f"ERROR: Could not parse a hostname from DATABASE_URL ({db_url!r}).\n"
        "  Check for quotes or unescaped special characters (@ : / #) in the password."
    )

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
    raise SystemExit(f"Timed out waiting for database at {host}:{port}.")
PY

echo "Running migrations..."
alembic upgrade head

echo "Starting API..."
exec uvicorn app.main:app --host 0.0.0.0 --port 8081

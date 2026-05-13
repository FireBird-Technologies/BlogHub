# Convenience targets: use the project's virtualenv uvicorn/npm so you don't need `python3 -m`.
# From the repo root, run: make backend

.PHONY: backend frontend install-backend install-frontend db-upgrade

backend:
	cd backend && ./venv/bin/uvicorn app.main:app --reload --port 8000

frontend:
	cd frontend && npm run dev

install-backend:
	cd backend && (test -d venv || python3 -m venv venv) && ./venv/bin/pip install -U pip && ./venv/bin/pip install -r requirements.txt

install-frontend:
	cd frontend && npm install

db-upgrade:
	cd backend && ./venv/bin/alembic upgrade head

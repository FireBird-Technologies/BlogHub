# BlogHub

BlogHub is a small full-stack app for discovering and sharing web publications: a FastAPI backend with PostgreSQL, a React frontend, Google sign-in, and optional enrichment when scraping links (including Google Gemini if you configure an API key).

This README assumes you are on macOS or Linux. On Windows, use `venv\Scripts\activate` and `venv\Scripts\uvicorn.exe` where paths below use `venv/bin/`.

## What you need installed

- Python 3.11 or newer (3.12 is fine).
- Node.js 18 or newer and npm.
- PostgreSQL running locally (or any host you can put in `DATABASE_URL`).
- A Google OAuth client ID if you want sign-in and the landing page button to work (both backend and frontend use it).

## Getting the code

Clone the repository after you create it on GitHub (replace the URL with yours):

```bash
git clone https://github.com/YOUR_USERNAME/YOUR_REPO.git
cd YOUR_REPO
```

## Backend setup

1. Create and activate a virtual environment (recommended so dependencies stay isolated):

   ```bash
   cd backend
   python3 -m venv venv
   source venv/bin/activate
   pip install -U pip
   pip install -r requirements.txt
   ```

2. Configure environment variables. Copy the example file and edit it:

   ```bash
   cp .env.example .env
   ```

   At minimum set `DATABASE_URL` to your PostgreSQL connection string, `JWT_SECRET` to a long random string, `GOOGLE_CLIENT_ID` to match your OAuth client, and `FRONTEND_URL` to your dev frontend (default `http://localhost:5173`).

   `GEMINI_API_KEY` and `GEMINI_MODEL` are optional and only affect optional description enrichment on scrape.

3. Apply database migrations:

   ```bash
   source venv/bin/activate   # if not already active
   alembic upgrade head
   ```

4. Start the API.

   From the `backend` directory with the virtual environment activated:

   ```bash
   uvicorn app.main:app --reload --port 8000
   ```

   Why people often use `python3 -m uvicorn ...`: if the virtualenv is **not** activated, the shell picks up whichever `python3` is on your PATH and you run Uvicorn as a module so imports resolve. Once the venv is active, `uvicorn` alone works because pip installs the `uvicorn` executable into `venv/bin`.

   Alternative without typing `activate`: from the **repository root** you can run:

   ```bash
   make backend
   ```

   That runs `backend/venv/bin/uvicorn` directly. First-time setup can use `make install-backend` to create the venv and install requirements (still uses `python3 -m venv` once, which is the standard way to create the environment).

First-time migrations from the repo root:

```bash
make db-upgrade
```

## Frontend setup

1. Install dependencies:

   ```bash
   cd frontend
   npm install
   ```

2. Environment file for Vite:

   ```bash
   cp .env.example .env
   ```

   Set `VITE_API_URL` to your API origin (usually `http://localhost:8000`) and `VITE_GOOGLE_CLIENT_ID` to the same client ID as in the backend.

3. Dev server:

   ```bash
   npm run dev
   ```

From the repo root you can instead run:

```bash
make frontend
```

Production build:

```bash
cd frontend
npm run build
```

The build runs TypeScript checking then Vite. Output goes to `frontend/dist/` (ignored by git).

## Repo layout

- `backend/` – FastAPI app (`app.main:app`), SQLAlchemy, Alembic, scraper and auth routes.
- `frontend/` – Vite + React + TypeScript client.
- `docker-compose.yml` – production-style stack: PostgreSQL, API, and Nginx (static app plus reverse proxy to the API).
- `deploy.env.example` – template for the variables Docker Compose reads from a root `.env` file.

## Docker (single host, e.g. DigitalOcean droplet)

The compose file runs three services: Postgres, the FastAPI app, and an Nginx container that serves the built frontend and proxies `/api/*`, `/auth/*`, and `/health` to the backend. Images use `restart: unless-stopped`, so after a reboot they come back when the Docker daemon starts (enable Docker on boot: `sudo systemctl enable docker` on Ubuntu).

1. Install Docker Engine and the Compose plugin on the droplet (official Docker docs for your distro).
2. Clone the repo and `cd` into it.
3. Create the deployment env file at the **repository root** (Compose loads `.env` automatically; this is separate from `backend/.env` used for local dev):

   ```bash
   cp deploy.env.example .env
   ```

   Edit `.env`. Set `POSTGRES_PASSWORD`, `JWT_SECRET`, `GOOGLE_CLIENT_ID`, and `FRONTEND_URL` to the **exact** public URL visitors use (for example `http://203.0.113.10` or `https://blog.example.com`, no trailing slash). In Google Cloud Console, add that same origin under the OAuth client’s authorized JavaScript origins.

4. Build and start:

   ```bash
   docker compose up -d --build
   ```

5. Open port 80 in the droplet firewall and (if applicable) the cloud firewall. Default HTTP port is 80; override with `HTTP_PORT` in `.env` if needed.

The API container runs `alembic upgrade head` on each start, then Uvicorn. Database files live in the `postgres_data` volume.

The browser talks to the same origin only: the frontend is built with an empty `VITE_API_URL` so requests go to `/api/...` and `/auth/...` on the same host Nginx serves. The backend’s `FRONTEND_URL` must still match that public URL for CORS.

To watch logs: `docker compose logs -f`. To stop: `docker compose down` (add `-v` to remove the Postgres volume and data).

## Pushing this project to GitHub

If Git is not initialized yet:

```bash
cd /path/to/BlogHub
git init
git add .
git commit -m "Initial commit"
```

Create an empty repository on GitHub (no README if you already have one locally), then:

```bash
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git
git push -u origin main
```

Use SSH instead of HTTPS if you prefer:

```bash
git remote add origin git@github.com:YOUR_USERNAME/YOUR_REPO.git
git push -u origin main
```

Do not commit real secrets. This repo ignores `.env` files; commit only `.env.example` with placeholders.

## Troubleshooting

- **`uvicorn: command not found`**: Activate `backend/venv/bin/activate`, or run `make backend`, or call `./venv/bin/uvicorn` from inside `backend`.
- **Database errors about missing columns**: Run `alembic upgrade head` against the database in your `DATABASE_URL`.
- **CORS errors in the browser**: Ensure `FRONTEND_URL` in the backend `.env` matches exactly how you open the app (scheme, host, and port).
- **Docker 502 from Nginx**: The `web` service can start before the API is listening; wait a few seconds or run `docker compose logs backend`. Ensure `FRONTEND_URL` in the root `.env` matches the URL in the browser.

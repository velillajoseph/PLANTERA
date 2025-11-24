# Plantera Monorepo

A starter pairing a FastAPI backend with a Next.js frontend. Tooling includes formatting (Black, Prettier), linting (Ruff, ESLint), testing (Pytest, Vitest), and GitHub Actions CI.

## Stack
- **Frontend:** Next.js 14 (App Router), TypeScript, Vitest, ESLint, Prettier
- **Backend:** FastAPI, SQLModel + SQLite, Pytest, Ruff, Black

## Setup
1. Install Node.js (includes `npm`).
   - macOS: `brew install node` (or install from [nodejs.org](https://nodejs.org/)).
   - Windows: install from [nodejs.org](https://nodejs.org/) or use [nvm-windows](https://github.com/coreybutler/nvm-windows).
2. Create a virtual environment and install backend dependencies:
   ```bash
   cd backend
   python -m venv venv
   # macOS/Linux
   source venv/bin/activate
   # Windows (PowerShell)
   .\\venv\\Scripts\\Activate.ps1
   pip install -r requirements-dev.txt
   ```
3. Install frontend dependencies:
   ```bash
   cd frontend
   npm install
   ```
4. Copy the example environment file and adjust as needed:
   ```bash
   cp ../.env.example .env
   ```
   - `DATABASE_URL`: SQLite path used by the backend. The default (`sqlite:///./data.db`) keeps the file in the backend
     folder; change it if you want the DB elsewhere.
   - `BACKEND_PORT`: Port where Uvicorn runs (matches the `--port` flag below). Change only if port 8000 is taken.
   - `NEXT_PUBLIC_API_BASE_URL`: URL the frontend calls. If you change `BACKEND_PORT` or run the API remotely, update
     this to match.

## Running locally
- **Backend API**
  ```bash
  cd backend
  # macOS/Linux
  source venv/bin/activate
  # Windows (PowerShell)
  .\\venv\\Scripts\\Activate.ps1
  # macOS/Linux: uses BACKEND_PORT if set, otherwise 8000
  uvicorn app.main:app --reload --port ${BACKEND_PORT:-8000}
  # Windows (PowerShell): initialize BACKEND_PORT (defaults to 8000) before running
  if (-not $env:BACKEND_PORT) { $env:BACKEND_PORT = "8000" }
  uvicorn app.main:app --reload --port $env:BACKEND_PORT
  # Or skip environment variables on Windows and pass the port directly
  uvicorn app.main:app --reload --port 8000
  ```
- **Frontend**
  ```bash
  cd frontend
  npm run dev
  ```
  By default, the frontend calls the API at `NEXT_PUBLIC_API_BASE_URL`.

## Testing & linting
- **Backend**
  ```bash
  cd backend
  source venv/bin/activate
  pytest
  ruff check app tests
  black --check app tests
  ```
- **Frontend**
  ```bash
  cd frontend
  npm run lint
  npm run test
  npm run format
  ```

## Troubleshooting
- `npm` is not recognized: install Node.js (see Setup step 1) and open a new terminal so `npm` is on your PATH.
- If dependency installation is blocked by a proxy, set the appropriate `HTTP(S)_PROXY` variables or install while on a network with PyPI/npm access. The application code assumes packages from `requirements-dev.txt` and `package.json` are available locally.

## Endpoints
- `GET /health` – simple health check.
- `POST /api/feedback` – accepts `name` and `message`, persists to SQLite.
- `GET /api/feedback` – returns submitted feedback ordered by newest first.

## Project structure
- `backend/app` – FastAPI application, models, and logging.
- `backend/tests` – Pytest integration tests.
- `frontend/app` – Next.js App Router pages and components.
- `.github/workflows/ci.yml` – Continuous integration for linting and tests.

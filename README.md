# Plantera Monorepo

A starter pairing a FastAPI backend with a Next.js frontend. Tooling includes formatting (Black, Prettier), linting (Ruff, ESLint), testing (Pytest, Vitest), and GitHub Actions CI.

## Stack
- **Frontend:** Next.js 14 (App Router), TypeScript, Vitest, ESLint, Prettier
- **Backend:** FastAPI, SQLModel + SQLite, Pytest, Ruff, Black

## Setup
1. Create a virtual environment and install backend dependencies:
   ```bash
   cd backend
   python -m venv venv
   source venv/bin/activate
   pip install -r requirements-dev.txt
   ```
2. Install frontend dependencies:
   ```bash
   cd frontend
   npm install
   ```
3. Copy the example environment file and adjust as needed:
   ```bash
   cp ../.env.example .env
   ```

## Running locally
- **Backend API**
  ```bash
  cd backend
  source venv/bin/activate
  uvicorn app.main:app --reload --port ${BACKEND_PORT:-8000}
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

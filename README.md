# Plantera

Plantera is an online plant marketplace for Puerto Rico connecting buyers with local viveros (plant nurseries). It has two sides:

- **Customer storefront** — the public shop at `/`, browsing live inventory from partner viveros.
- **Vendor portal** — where viveros manage their listings, stock, pricing, orders, and photos. It lives at `/acceso` and is intentionally unlinked from the storefront.

## Stack
- **Frontend:** Next.js 14 (App Router), TypeScript, Vitest, ESLint, Prettier
- **Backend:** FastAPI, SQLModel + SQLite, Pillow, Pytest, Ruff, Black

No Docker or database server needed — SQLite is a local file (`backend/data.db`), and uploaded photos are local files in `backend/uploads/`.

## First-time setup (once)

1. **Install the tools** (macOS): install [Homebrew](https://brew.sh), then:
   ```bash
   brew install node python@3.12
   ```
2. **Backend dependencies:**
   ```bash
   cd backend
   python3 -m venv venv
   source venv/bin/activate
   pip install -r requirements-dev.txt
   ```
3. **Frontend dependencies:**
   ```bash
   cd frontend
   npm install
   ```
4. **Environment file** (defaults work as-is):
   ```bash
   cp .env.example .env        # from the repo root
   ```
5. **Seed the database** — creates tables, demo vendors, inventory, and 6 months of demo orders:
   ```bash
   cd backend
   source venv/bin/activate
   python -m app.seed
   ```

## Running locally (every day)

You need two terminals, one per server. Leave both open while working.

**Terminal 1 — backend (http://localhost:8000):**
```bash
cd backend
source venv/bin/activate
uvicorn app.main:app --reload --port 8000
```

**Terminal 2 — frontend (http://localhost:3000):**
```bash
cd frontend
npm run dev
```

Then open **http://localhost:3000** for the shop, or **http://localhost:3000/acceso/login** for the vendor portal.

**To stop either server:** press `Ctrl+C` in its terminal. If a terminal was lost, free the port with `kill $(lsof -ti :8000)` (backend) or `kill $(lsof -ti :3000)` (frontend).

**If the frontend serves 500s for `/_next/...` assets** (usually after `npm run build` ran while the dev server was up — they share the `.next` folder): stop the dev server, `rm -rf frontend/.next`, and run `npm run dev` again.

## Demo vendor accounts

Created by the seed script — log in at **http://localhost:3000/acceso/login**:

| Email | Vivero | Password |
|---|---|---|
| `verde-valle@plantera.pr` | Vivero Verde Valle (Caguas) | `plantera-demo` |
| `jardines-boriken@plantera.pr` | Jardines Borikén (Ponce) | `plantera-demo` |
| `casa-tropical@plantera.pr` | Vivero Casa Tropical (San Juan) | `plantera-demo` |

Re-running `python -m app.seed` **drops and recreates all tables** (fresh data, passwords reset). Run it after any change to the models — SQLModel never alters existing SQLite tables, so new columns only appear after a re-seed. Vendor accounts are seed-only for now; onboarding UI comes later.

## Site map

**Customer storefront** (indexed, linked, public)
- `/` — shop home: hero, categories, paginated featured grid, viveros, care teaser
- `/shop` — full catalog with genus / vivero / category filters, search, and sorting
- `/plant/[id]` — product detail with care guide and related items
- `/about` · `/care` · `/community` · `/contact` · `/cart` · `/account`
- `/rewards` — built but **intentionally unlinked** until the rewards programme launches

**Vendor portal** — `/acceso` (`noindex`, not linked from the storefront)
- `/acceso/login` — vendor login
- `/acceso` — dashboard summary (stats, revenue chart, low-stock alerts, recent orders)
- `/acceso/inventory` — inventory management: search, filters, photo upload, pause/activate, edit, delete
- `/acceso/orders` — order history with month filter and line items
- `/acceso/profile` — store profile and change password

**Pitch material** — `/pitch` (`noindex`, not linked from the storefront)
- `/pitch` — the original pitch landing page, `/pitch/plants/[slug]` — mock plant details
- `/pitch/dashboard` — mocked vivero dashboard that runs with **no backend** (localStorage), for pitching offline

> The vendor portal and pitch pages are unlinked and excluded via `robots.txt`, so customers never stumble into them. This is obscurity, not security — route names can still be found in the JavaScript bundle. The real protection is the login.

## How the two sides connect

A vivero's edits in `/acceso/inventory` appear in the customer shop immediately:

- **Photos** are uploaded (not URLs). The browser downscales to 1600px before upload; the server validates with Pillow, strips EXIF, and stores a normalized JPEG in `backend/uploads/`, served at `/uploads/...`. A photo is required on new listings.
- **Pausing** a listing (`is_active = false`) hides it from the shop entirely while keeping it in the vendor's inventory. This is separate from **sold out** (`stock = 0`), which stays visible in the shop with a sold-out badge.
- **Genus** groups plants in the Shop mega-menu and picks the care guide; **category** (`plant` / `pot` / `supply`) drives the Pots & supplies section.

## Testing & linting
- **Backend** (from `backend/`, venv active): `pytest` · `ruff check app tests` · `black --check app tests`
- **Frontend** (from `frontend/`): `npm run lint` · `npx tsc --noEmit` · `npm run test` · `npm run format` · `npm run build`

## API endpoints
- `GET /health` – health check.
- `POST|GET /api/feedback` – demo feedback form storage.
- `GET /uploads/{file}` – vendor-uploaded listing photos (static files).

### Public catalog (`/api/catalog`, no auth)
- `GET /api/catalog` – all listings from active viveros, plus facets (genera, categories, viveros). Excludes paused listings.
- `GET /api/catalog/{id}` – one listing plus related items; 404 if paused or from an inactive vivero.

### Vendor portal (`/api/vendor`, Bearer-token auth)
- `POST /login` / `POST /logout` – session tokens stored in the DB (7-day expiry).
- `GET /me` / `PATCH /me` – vendor profile; `POST /change-password` – revokes other sessions.
- `GET|POST /inventory`, `PATCH|DELETE /inventory/{id}` – vendor-owned inventory (PATCH also toggles `is_active` to pause/activate).
- `POST|DELETE /inventory/{id}/image` – upload or remove a listing photo (multipart `file`).
- `GET /orders` – paginated order history with line items (`?page=`, `?page_size=`, `?month=YYYY-MM`).
- `GET /stats` – totals, monthly revenue series, top sellers, low-stock items, recent orders (paused listings excluded).

## Environment variables (`.env`)
- `DATABASE_URL` – SQLite path (default `sqlite:///./data.db`, relative to `backend/`).
- `BACKEND_PORT` – API port (default 8000; keep in sync with the `--port` flag).
- `UPLOAD_DIR` – where listing photos are stored (default `uploads`, relative to `backend/`).
- `NEXT_PUBLIC_API_BASE_URL` – URL the frontend calls (default `http://localhost:8000`).

## Project structure
- `backend/app` – FastAPI app: `catalog.py` (public shop API), `vendor.py` (portal API), `storage.py` (photo storage), `models.py`, `seed.py`.
- `backend/uploads` – vendor-uploaded photos (gitignored; not source).
- `backend/tests` – Pytest integration tests.
- `frontend/app/(shop)` – customer storefront (route group, so URLs have no prefix).
- `frontend/app/acceso` – vendor portal (login + sidebar app shell).
- `frontend/app/(pitch)` – pitch landing page and offline mock dashboard.
- `frontend/app/components` – shared UI; `components/shop/` is storefront-specific.
- `frontend/app/lib` – data clients (`catalog.ts`, `api.ts`), cart state, i18n, care guides.
- `frontend/app/globals.css` – the brand kit: colors, type, spacing, motion.
- `.github/workflows/ci.yml` – CI for linting and tests.

## Language
The whole site is bilingual (Spanish default, English toggle in the header). UI strings live in `COPY` objects beside each component; plant care content is genus-keyed in `frontend/app/lib/care-guides.ts`.

## Known gaps / next up
- Checkout and payments (the cart is localStorage-only; orders are coordinated over WhatsApp for now).
- Customer accounts, favorites, and the Rewards programme.
- Community blog content.
- Product pages fetch client-side, so product data is not in the initial HTML — worth converting to server components before launch for SEO.
- Photos are stored on local disk; move to S3/Cloudinary for production (only `backend/app/storage.py` needs to change).
- No migrations yet (Alembic) — schema changes require a re-seed.

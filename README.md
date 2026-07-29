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

## Demo accounts

All created by the seed script. Every password is `plantera-demo`.

**Viveros** — log in at **http://localhost:3000/acceso/login**:

| Email | Vivero |
|---|---|
| `verde-valle@plantera.pr` | Vivero Verde Valle (Caguas) |
| `jardines-boriken@plantera.pr` | Jardines Borikén (Ponce) |
| `casa-tropical@plantera.pr` | Vivero Casa Tropical (San Juan) |

**Shoppers** — sign in from the account icon in the header, or at **http://localhost:3000/account**. Both arrive pre-verified with a few plants already saved:

| Email | Name |
|---|---|
| `marisol@plantera.pr` | Marisol Rivera |
| `andres@plantera.pr` | Andrés Colón |

Re-running `python -m app.seed` **drops and recreates all tables** (fresh data, passwords reset). Run it after any change to the models — SQLModel never alters existing SQLite tables, so new columns only appear after a re-seed. Vendor accounts are seed-only for now; onboarding UI comes later.

## Site map

**Customer storefront** (indexed, linked, public)
- `/` — shop home: hero, **promo carousel**, categories, paginated featured grid, viveros, care teaser
- `/shop` — full catalog with genus / vivero / category filters, ranked search, and sorting
- `/product/[id]` — product detail with care guide and related items (`/plant/[id]` 308-redirects here)
- `/about` · `/care` · `/community` · `/contact` · `/cart`
- `/account` — signed out it shows a sign-in card; signed in it becomes the account dashboard (profile, password, favorites, orders)
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

There are deliberately **no `/login`, `/register`, or `/verify` routes**. Customer sign-in, sign-up, and email verification are three panes of one modal opened from the header, so the URL never advertises an auth section and signing in never costs you your place on the page.

## Accounts and sessions

- **Customers** register with an emailed 6-digit code, then sign in from the header modal. Signed in, they can save favorites (the heart in a product card's corner) and edit their profile or password at `/account`. Order history is built but always empty — there is no checkout yet, and `Order` has no customer id.
- **Sessions slide.** Every authenticated request pushes the expiry forward, so a session dies from inactivity rather than at a fixed time after login. Windows: **20 minutes for viveros**, **60 minutes for shoppers** — vendors see revenue and customer names, so they time out faster.
- **Inactivity logout** runs on both sides. The browser shows a warning modal 60 seconds ahead with a "stay signed in" button; the server enforces the same window plus a 2-minute grace margin, so the client always logs out first and the server never 401s someone mid-click. Both idle windows are configurable — see the environment variables below.
- Waking a laptop after a long sleep logs out immediately: the timer compares wall-clock timestamps rather than counting ticks, which `setTimeout` cannot do across a suspend.
- Activity in one tab keeps every tab alive, and signing out in one signs out the rest.
- A browser can hold a vivero session and a shopper session at once; the two token stores are independent, so a 401 on one never clears the other.

## Discounts

Viveros set discounts as a **percentage**, at two levels:

- **Per item** — in the inventory modal, with a live "final price" preview.
- **Store-wide** — on the profile page, applying to the whole catalog. The inventory page shows a reminder strip while one is running, since it is configured elsewhere.

Both take optional start/end dates; leaving them blank runs the discount until the vivero switches it off.

**An item discount beats a store-wide one and they never stack** — a 20% item sale inside a 15% store sale is 20% off, not 32%. Precedence is evaluated on *live* discounts only, so scheduling a sale for next week does not pull an item out of the one running today.

The rule lives in one pure function, `resolve_pricing` in [`backend/app/pricing.py`](backend/app/pricing.py), called from the only two places an item becomes something a shopper sees: `catalog.build_catalog_item` and `customer.build_plant_preview`.

**`price` means different things on purpose.** On `CatalogItem` (storefront) it is the **effective** price — discount applied, which is what sorting, the cart, and subtotals all use. On `InventoryItemPublic` (vendor portal) it is the **list** price the vivero typed. `original_price` is null unless a discount is live, never 0, so `original_price != null` is the single "on sale" test.

Rounding is half-up to the cent, floored at $0.01, computed in integer cents. `frontend/app/lib/pricing.ts` mirrors the formula so the vendor's preview matches what is charged; the two are pinned to the same vectors in `backend/tests/test_pricing.py` and `frontend/__tests__/pricing.test.ts`.

The cart re-prices itself against `GET /api/catalog/pricing` on the cart page and once per session after a stale load, and tells the shopper what changed. Carts saved before this feature migrate automatically.

## Promotions

Viveros can be promoted in a rotating carousel under the homepage hero. Promotions live in the `promotion` table (headline, body, CTA, image, run window, priority) and are seeded for now — vendor-facing management comes with paid tiers.

The ordering lives in one function, `rank_promotions` in `backend/app/promotions.py`: highest `priority` first, and *within* a tier a rotation offset by the hour so equally-ranked viveros take turns at the front. A higher tier is never demoted by the rotation — that is the thing a vivero would be paying for. When paid placement arrives, that function body is the only thing that changes.

Impressions and clicks are counted per promotion (aggregate totals only — no cookies, no per-visitor tracking).

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
- `GET /api/catalog/pricing?ids=1,2,3` – current price and stock for re-pricing a cart. An id missing from the response means the listing is gone (deleted, paused, or its vivero deactivated).

### Promotions (`/api/promotions`, no auth)
- `GET /api/promotions` – live, in-window promotions from active viveros, ranked for the carousel.
- `POST /api/promotions/{id}/event` – increments an `impression` or `click` counter.

### Customer accounts (`/api/customers`, Bearer-token auth except where noted)
- `POST /register` · `POST /verify` · `POST /resend-code` – signup with an emailed 6-digit code (no auth).
- `POST /login` – 401 for bad credentials, **403 `email_not_verified`** when the password is right but the account is unverified, so the modal can jump straight to the code step. `POST /logout` takes the token in the header.
- `GET /me` / `PATCH /me` – profile; email is not patchable (it is the login identity). `POST /change-password` revokes every other session.
- `POST /session/touch` – forces a fresh idle window; what "stay signed in" calls.
- `GET /favorites` · `GET /favorites/ids` · `POST /favorites` · `DELETE /favorites/{item_id}` – always scoped to the signed-in customer.
- `GET /orders` – always `[]` for now; see Known gaps.

### Vendor portal (`/api/vendor`, Bearer-token auth)
- `POST /login` / `POST /logout` – session tokens stored in the DB, sliding idle expiry.
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
- `FRONTEND_ORIGINS` – comma-separated CORS origins (default `http://localhost:3000`). Must include the exact origin the browser uses, or every API call fails — including the LAN IP when testing on a phone.
- `VENDOR_IDLE_MINUTES` / `CUSTOMER_IDLE_MINUTES` – server-side inactivity windows (default `20` / `60`). Set one to `1` to exercise the logout flow by hand. The matching client values live in `frontend/app/acceso/(portal)/layout.tsx` and `frontend/app/lib/customer-auth.tsx`.
- `SHOW_VERIFICATION_CODE_IN_RESPONSE` – returns the signup code in the API response (default `true`). **This defeats the point of verifying** and is only on because no email delivery exists yet; without it signup is a dead end. Set it to `false` the moment email sending lands.

## Project structure
- `backend/app` – FastAPI app: `catalog.py` (public shop API), `customer.py` (accounts + favorites), `vendor.py` (portal API), `promotions.py` (carousel + ranking), `auth.py` (sessions and the two auth dependencies), `security.py` (password hashing, pure crypto), `storage.py` (photo storage), `models.py`, `seed.py`.
- `backend/uploads` – vendor-uploaded photos (gitignored; not source).
- `backend/tests` – Pytest integration tests.
- `frontend/app/(shop)` – customer storefront (route group, so URLs have no prefix).
- `frontend/app/acceso` – vendor portal (login + sidebar app shell).
- `frontend/app/(pitch)` – pitch landing page and offline mock dashboard.
- `frontend/app/components` – shared UI; `components/shop/` is storefront-specific.
- `frontend/app/lib` – data clients (`catalog.ts`, `api.ts` for vendors, `customer-api.ts` for shoppers, all over the shared `http.ts` transport), `search.ts` (accent-folding ranked catalog search), `customer-auth.tsx`, `use-idle-logout.ts`, cart state, i18n, care guides.
- `frontend/app/globals.css` – the brand kit: colors, type, spacing, motion.
- `.github/workflows/ci.yml` – CI for linting and tests.

## Language
The whole site is bilingual (Spanish default, English toggle in the header). UI strings live in `COPY` objects beside each component; plant care content is genus-keyed in `frontend/app/lib/care-guides.ts`.

## Known gaps / next up
- Checkout and payments (the cart is localStorage-only; orders are coordinated over WhatsApp for now). Because `Order` records a `customer_name` string rather than a customer id, `GET /api/customers/orders` returns an empty list — deliberately, since matching on name would show two shoppers called "José Torres" each other's history.
- The cart is still per-browser; it is not synced to the account.
- No email delivery, so signup codes are returned by the API and written to the log. See `SHOW_VERIFICATION_CODE_IN_RESPONSE`.
- Catalog search runs in the browser over the full catalog. It is isolated in `frontend/app/lib/search.ts`, which is the only file to change when it needs to move server-side.
- Vendors cannot create their own promotions yet; they are seeded.
- The Rewards programme.
- Community blog content.
- Product pages fetch client-side, so product data is not in the initial HTML — worth converting to server components before launch for SEO.
- Photos are stored on local disk; move to S3/Cloudinary for production (only `backend/app/storage.py` needs to change).
- No migrations yet (Alembic) — schema changes require a re-seed.

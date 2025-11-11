# CRM Project

This monorepo houses a lightweight CRM prototype composed of a Node.js/Express backend and a placeholder React frontend. Use the sections below to install dependencies, bring both tiers online, and exercise the new Visits Dashboard flows.

## Prerequisites

- [Node.js](https://nodejs.org/) 18 or newer and the accompanying `npm` CLI.
- SQLite is bundled by default—no additional database service is required.

## Backend: Install, Test, and Run

1. Install dependencies:

   ```bash
   cd backend
   npm install
   ```

2. (Optional) Run the automated tests:

   ```bash
   npm test
   ```

3. Seed the database with realistic territories, reps, HCPs, and visits. This is especially helpful for validating the dashboard visually:

   ```bash
   npm run seed
   ```

4. Start the API server. The service boots on port `5000` by default and automatically provisions the SQLite data directory (`../data/database.sqlite`).

   ```bash
   node index.js
   ```

   Set `PORT` to override the listen port or `SQLITE_STORAGE`/`DATABASE_URL` to target a different database location if needed.

Key routes include:

- `POST /api/auth/login` – authenticate with one of the sample accounts below.
- `GET /api/health` – quick readiness probe for monitoring and automated tests.
- `GET /api/visits` – paginated visit listings with sorting, search, and filter support.
- `GET /api/visits/summary` – aggregated metrics for summary cards.
- `GET /api/visits/export` – CSV export that mirrors the filtered table view.

## Frontend: Install and Run

1. Install dependencies (the scaffold currently has no runtime packages, but running `npm install` keeps the workflow consistent once React tooling is added):

   ```bash
   cd frontend
   npm install
   ```

2. Serve the app. The simplest option today is to open `frontend/index.html` in a browser or run any static file server (for example `npx serve .`) and navigate to the hosted page. When a full React toolchain lands, replace this step with the appropriate `npm start` or Vite/CRA dev server command.

3. Frontend tests: after the project is wired up with a test runner (Jest, Vitest, etc.), execute the suite from the `frontend/` directory. The recommended convention is:

   ```bash
   npm test
   ```

   Update the `"test"` script in `frontend/package.json` once the tooling is configured so `npm test` runs the actual checks.

## Sample Accounts and Roles

Use these credentials with `POST /api/auth/login` while exercising role-based features:

| Role   | Email                 | Password       | Notes |
| ------ | --------------------- | -------------- | ----- |
| Admin  | `admin@example.com`   | `password`     | Seeded in-memory by the Express app for local authentication. |
| Manager | `manager@example.com` | `Password123!` | Create via your seeding workflow—see [`docs/README.md`](docs/README.md) for context on seeding users and roles. |
| Rep    | `rep@example.com`     | `Password123!` | Create via your seeding workflow—see [`docs/README.md`](docs/README.md). |

## Visits Dashboard Overview

- **Entry Point:** Once authenticated, navigate to the Visits Dashboard from the primary navigation menu in the frontend. The page aggregates field activity for the authenticated persona.
- **Role Access:**
  - **Sales Representatives** focus on their own route planning and completed visits.
  - **Sales Managers** monitor team activity, summary metrics, and CSV exports for coaching and reporting.
  - **Admins** can impersonate or configure either group as new tooling is introduced.

Refer to [`docs/README.md`](docs/README.md) for a full walkthrough of the filters panel, summary cards, visits table, and CSV export controls that compose the dashboard experience.【F:docs/README.md†L5-L60】

## Visits API Endpoints

The Visits Dashboard is powered by the `/api/visits/*` endpoints. The detailed reference—including request parameters, response examples, and CSV export headers—lives in [`docs/README.md`](docs/README.md).【F:docs/README.md†L5-L46】 Highlights include:

- `GET /api/visits` – Supports pagination (`page`, `pageSize`), sorting (`sortBy`, `sortDirection`), and filters (`status`, `repId`, `hcpId`, `territoryId`, `dateFrom`, `dateTo`, `q`). Responses follow a `{ data, meta }` convention.
- `GET /api/visits/summary` – Re-uses the same filters and returns aggregate counts such as completed/scheduled visits, unique HCPs, and average duration.
- `GET /api/visits/export` – Applies the current filters and returns a CSV attachment with visit, HCP, rep, territory, and notes columns.

Seed data is available via `npm run seed`, which also demonstrates the new CSV dependency (`csv-stringify`) used by the export route.【F:backend/db/seed.js†L1-L69】【F:backend/package.json†L1-L27】

## Additional Resources

- [`docs/README.md`](docs/README.md) – authoritative reference for visits endpoints, dashboard behavior, and seeding helpers.
- [`backend/README.md`](backend/README.md) – quick backend command summary.
- [`frontend/README.md`](frontend/README.md) – frontend usage notes.

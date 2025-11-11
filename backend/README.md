# Backend

This directory contains a Node.js/Express API backed by SQLite and Sequelize.

## Setup

Install dependencies and run the automated tests:

```
npm install
npm test
```

To populate realistic fixtures for the Visits dashboard, seed the database. The
seed resets the SQLite tables and loads sample territories, sales reps, HCPs,
and visits:

```
npm run seed
```

Start the development server on port `5000` (override via `PORT`):

```
node index.js
```

## Key Endpoints

- `POST /api/auth/login` – Validates credentials against the in-memory admin user.
- `GET /api/health` – Lightweight readiness probe.
- `GET /api/hcps` – Lists HCP records ordered alphabetically.
- `POST /api/import/hcps` – Bulk upsert HCP data.
- `GET /api/visits` – Returns paginated visit rows with nested HCP, rep, and territory details.
- `GET /api/visits/summary` – Aggregates visit counts, unique entity totals, and duration statistics for summary cards.
- `GET /api/visits/export` – Streams the filtered visits list as a CSV file.

### Visits Query Parameters

All three visits endpoints support the same filtering contract:

- `page` / `pageSize` – Pagination controls (default: `1` / `25`, max page size 100).
- `sortBy` – `visitDate`, `status`, `durationMinutes`, `hcpName`, `repName`, or `territoryName` (default `visitDate`).
- `sortDirection` – `asc` or `desc` (default `desc`).
- `status` – One or more statuses (`scheduled`, `completed`, `cancelled`).
- `repId`, `hcpId`, `territoryId` – Filter by related identifiers (single value or comma-delimited list).
- `dateFrom` / `dateTo` – Inclusive date range in `YYYY-MM-DD` format.
- `q` – Case-insensitive search across rep name, HCP name, HCP area tag, and territory name.

`/api/visits` responds with a `{ data, meta }` payload, `/api/visits/summary` wraps
the aggregated metrics in `{ data }`, and `/api/visits/export` returns `text/csv`
with a `Content-Disposition: attachment; filename="visits.csv"` header.

# Documentation

## Visits API

### `GET /api/visits`
- **Description:** Returns paginated visit rows with nested HCP, sales rep, and territory metadata. Designed for the dashboard table view.
- **Query Parameters:**
  - `page` (integer, optional) – Defaults to `1`.
  - `pageSize` (integer, optional) – Defaults to `25`, maximum `100`.
  - `sortBy` (string, optional) – `visitDate`, `status`, `durationMinutes`, `hcpName`, `repName`, or `territoryName`. Defaults to `visitDate`.
  - `sortDirection` (string, optional) – `asc` or `desc`. Defaults to `desc`.
  - `status` (string or comma-delimited list, optional) – Any combination of `scheduled`, `completed`, `cancelled`.
  - `repId`, `hcpId`, `territoryId` (string or comma-delimited list, optional) – Filter by related identifiers.
  - `dateFrom`, `dateTo` (ISO `YYYY-MM-DD`, optional) – Inclusive visit date range.
  - `q` (string, optional) – Case-insensitive search across HCP name/area tag, rep name, and territory name.
- **Sample Response:**
```json
{
  "data": [
    {
      "id": 12,
      "visitDate": "2024-05-10",
      "status": "completed",
      "durationMinutes": 45,
      "notes": "Discussed performance metrics.",
      "rep": { "id": 2, "name": "Meredith Grey", "email": "meredith.grey@example.com" },
      "hcp": { "id": 7, "name": "Dr. Cristina Yang", "areaTag": "Seattle Grace - Cardio", "specialty": "Cardiothoracic Surgery" },
      "territory": { "id": 1, "name": "Northwest", "code": "NW" },
      "createdAt": "2024-05-01T16:18:09.000Z",
      "updatedAt": "2024-05-01T16:18:09.000Z"
    }
  ],
  "meta": {
    "page": 1,
    "pageSize": 25,
    "total": 42,
    "totalPages": 2,
    "sortBy": "visitDate",
    "sortDirection": "desc",
    "filters": {
      "status": ["completed"],
      "repId": null,
      "hcpId": null,
      "territoryId": null,
      "dateFrom": "2024-05-01",
      "dateTo": "2024-05-31",
      "q": null
    }
  }
}
```

### `GET /api/visits/summary`
- **Description:** Returns aggregate metrics for the active visit filters so the dashboard can drive summary cards and charts.
- **Query Parameters:** Same as `GET /api/visits`.
- **Sample Response:**
```json
{
  "data": {
    "totalVisits": 42,
    "completedVisits": 31,
    "scheduledVisits": 8,
    "cancelledVisits": 3,
    "uniqueHcps": 18,
    "uniqueReps": 6,
    "uniqueTerritories": 4,
    "averageDurationMinutes": 37.5,
    "totalDurationMinutes": 1575,
    "lastVisitDate": "2024-05-11"
  }
}
```

### `GET /api/visits/export`
- **Description:** Streams the filtered visits list as a CSV download. The export contains the same columns shown in the dashboard table and respects all filters/sorting.
- **Query Parameters:** Same as `GET /api/visits`.
- **Sample Response Headers:**
  - `Content-Type: text/csv`
  - `Content-Disposition: attachment; filename="visits.csv"`
- **Sample CSV Body:**
```csv
ID,Visit Date,Status,Duration (minutes),Sales Rep,Sales Rep Email,HCP,HCP Area Tag,Territory,Territory Code,Notes
12,2024-05-10,completed,45,Meredith Grey,meredith.grey@example.com,Dr. Cristina Yang,Seattle Grace - Cardio,Northwest,NW,"Discussed performance metrics."
15,2024-05-08,scheduled,30,Miranda Bailey,miranda.bailey@example.com,Dr. Arizona Robbins,Seattle Grace - Peds,Midwest,MW,"Discuss pediatric pilot program."
```

## Visits Dashboard Walkthrough

The Visits Dashboard gives managers and operations teams a consolidated view of field activity.

- **Filters Panel:** Located above the summary cards. Users can filter by date range, representative, HCP, visit status, and territory. Changing filters immediately re-queries both the summary endpoint and the table list.
- **Summary Cards:** Highlight Total Visits, Completed Visits, Scheduled Visits, Cancelled Visits, Average Duration, and coverage counts. Counts update as filters change and use color coding to show deltas week-over-week.
- **Visits Table:** Displays individual visits with sortable columns for visit date, rep, HCP, status, and duration. Pagination defaults to 25 rows per page, with controls to switch between 25/50/100 rows. The current page, total rows, and applied filters are displayed beneath the table for quick QA references.
- **CSV Export Button:** A primary button at the top-right of the table triggers `/api/visits/export` with the current filter state. The UI disables the button while a download is in progress and surfaces toast notifications if the API responds with an error.

## Setup and Seeding

1. Install backend dependencies and run the test suite from `backend/`:
   ```bash
   npm install
   npm test
   ```
2. Populate the SQLite database with sample territories, reps, HCPs, and visits:
   ```bash
   npm run seed
   ```
3. Start the backend with `node index.js` and bring up the frontend (static HTML or your React dev server). Sign in with the admin account (`admin@example.com` / `password`) to navigate to the Visits Dashboard and verify the data set.

# Documentation

## Visits API

### `/api/visits/summary`
- **Method:** `GET`
- **Description:** Returns aggregate visit metrics for the given filters so dashboards can render summary cards and charts.
- **Query Parameters:**
  - `startDate` (ISO 8601 date string, optional) – Lower bound for the visit start timestamp. Defaults to the beginning of the current quarter when omitted.
  - `endDate` (ISO 8601 date string, optional) – Upper bound for the visit start timestamp. Defaults to the end of the current quarter when omitted.
  - `repId` (string, optional) – Restrict results to a single sales representative. Multiple representatives can be requested by repeating the parameter (e.g. `repId=1&repId=2`).
  - `hcpId` (string, optional) – Restrict results to visits involving a specific HCP.
  - `status` (string, optional) – Filter by visit status (`scheduled`, `in_progress`, `completed`, or `cancelled`). Multiple statuses can be supplied.
- **Sample Response:**
```json
{
  "totalVisits": 128,
  "completed": 96,
  "scheduled": 18,
  "inProgress": 6,
  "cancelled": 8,
  "averageDurationMinutes": 32,
  "hcpCoverage": {
    "uniqueHcps": 54,
    "repeatVisits": 22
  },
  "byRep": [
    { "repId": "rep-001", "repName": "Jordan Smith", "completed": 28, "scheduled": 5 },
    { "repId": "rep-014", "repName": "Devon Allen", "completed": 24, "scheduled": 4 }
  ]
}
```

### `/api/visits/export`
- **Method:** `GET`
- **Description:** Streams a CSV export that mirrors the table contents rendered on the Visits Dashboard. The export respects all filters so QA can download the exact dataset shown in the UI.
- **Query Parameters:** Identical to `/api/visits/summary` with the addition of:
  - `timezone` (IANA timezone string, optional) – Converts date columns before export. Defaults to `UTC`.
  - `includeNotes` (boolean, optional) – When `true`, appends internal visit notes as an extra column. Defaults to `false` to keep files compact.
- **Sample Response Headers:**
  - `Content-Type: text/csv`
  - `Content-Disposition: attachment; filename="visits-2024-04-01_2024-06-30.csv"`
- **Sample CSV Body:**
```csv
Visit ID,Date,Representative,HCP,Status,Duration (minutes)
VIS-10023,2024-05-01T14:30:00-04:00,Jordan Smith,Dr. Helena Ortiz,Completed,42
VIS-10024,2024-05-01T16:00:00-04:00,Jordan Smith,Dr. Rachel Huang,Scheduled,
VIS-10025,2024-05-02T09:00:00-04:00,Devon Allen,Dr. Julia Karim,Completed,28
```

## Visits Dashboard Walkthrough

The Visits Dashboard gives managers and operations teams a consolidated view of field activity.

- **Filters Panel:** Located above the summary cards. Users can filter by date range (pre-sets for week, month, quarter), representative, HCP, visit status, and territory. Changing filters immediately re-queries both the summary endpoint and the table list.
- **Summary Cards:** Four cards highlight Total Visits, Completed Visits, Scheduled Visits, and Average Duration. Counts update as filters change and use color coding to show positive/negative deltas week-over-week.
- **Visits Table:** Displays individual visits with sortable columns for visit date, rep, HCP, status, and duration. Pagination defaults to 25 rows per page, with controls to switch between 25/50/100 rows. The current page, total rows, and applied filters are displayed beneath the table for quick QA references.
- **CSV Export Button:** A primary button at the top-right of the table triggers `/api/visits/export` with the current filter state. The UI disables the button while a download is in progress and surfaces toast notifications if the API responds with an error.

## Setup and Seeding

1. Ensure the backend database has the latest migrations applied (run `npm run migrate` from `backend/` if you have pending schema changes).
2. Seed baseline roles and users so QA can log in with representative and manager personas:
   - `npm run seed:roles` – Inserts the `sales_rep` and `sales_manager` roles used by the dashboard authorization checks.
   - `npm run seed:users` – Creates sample accounts (`rep@example.com`, `manager@example.com`) with the password `Password123!` mapped to the roles above.
3. Populate visit fixtures with `npm run seed:visits` to exercise the summary and export endpoints during manual testing.
4. Start the backend with `npm start` inside `backend/` and the frontend with `npm start` inside `frontend/`. Once both services are running, sign in as either seeded user to reach the Visits Dashboard via the main navigation.


# crm2

This project now includes a simple Express server with a health check route.

## Running the server

```
npm start
```

The server listens on port 3000 by default and exposes `/health` which returns `{ "status": "ok" }`.

## Running tests

Install dependencies (already done in development). To run the automated tests use:

```
npm test
```

This runs Jest which checks that the health check route responds correctly.

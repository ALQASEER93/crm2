# Backend

This directory contains a minimal Node.js/Express server.

```bash
npm install
npm test
node index.js
```

The server exposes a health check at `GET /api/health` and a login endpoint at
`POST /api/auth/login` that validates credentials against an in-memory user
store with hashed passwords.

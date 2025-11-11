# Frontend

This package contains the CRM React application powered by [Vite](https://vitejs.dev/). The toolkit provides a fast dev server,
modern build pipeline, and Vitest-based testing setup.

## Prerequisites

Install Node.js 18 or newer and npm.

## Install Dependencies

```bash
cd frontend
npm install
```

This installs React, the Vite build tooling, ESLint/Prettier, and testing utilities.

## Available Scripts

Run these commands from the `frontend/` directory:

- `npm run dev` – start the Vite development server with hot module replacement.
- `npm run build` – create an optimized production build in `dist/`.
- `npm run preview` – serve the production build locally for verification.
- `npm test` – execute the Vitest suite in watch mode (use `npm test -- --run` for a single run).
- `npm run lint` – (optional) run ESLint using the provided configuration.

## Project Structure

```
frontend/
├── index.html          # Vite entry HTML
├── src/
│   ├── App.jsx         # Root application shell
│   ├── main.jsx        # Vite React entry point
│   ├── auth/           # Authentication context and utilities
│   └── visits/         # Visits dashboard views and providers
└── vite.config.js      # Shared Vite/Vitest configuration
```

Vitest loads `src/test/setup.js` to provide the DOM testing environment and custom matchers from
`@testing-library/jest-dom`.

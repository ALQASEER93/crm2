# Frontend

This directory currently exposes a minimal React entry point rendered via `src/index.js`. Until the full toolchain is wired up, you can work with the scaffold using the steps below.

## Install Dependencies

While no runtime packages are required today, run `npm install` so lockfiles stay in sync once additional tooling (React Router, testing libraries, etc.) is introduced:

```bash
cd frontend
npm install
```

## Start the UI

- **Quick preview:** open `index.html` in a browser to render the placeholder UI.
- **Local static server:** alternatively, run `npx serve .` (or your preferred static host) from the `frontend/` directory and browse to the reported URL. Replace this step with your framework-specific dev server command when the project adopts one.

## Run Frontend Tests

Once a test runner is configured, execute the suite with `npm test` from the `frontend/` directory. Update the `"test"` script in `package.json` to point to the actual command (for example, `react-scripts test` or `vitest run`).

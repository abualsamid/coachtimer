# Tooling & Quality Gates

## Tests
- Runner: Vitest
- Environment: Happy DOM (browser-like APIs such as `window` and `localStorage`).
- Location/pattern: `tests/**/*.test.js`

## Linting
- ESLint with the recommended ruleset and browser/node/vitest globals.

## Type Checking
- TypeScript compiler in `checkJs` mode (no TypeScript source files).
- Use JSDoc annotations for stronger type guarantees.

## Local Development
- `npm run dev` starts a local live-reload server on `http://127.0.0.1:5173`.
- Changes to static files trigger a browser refresh; no manual reload is required.

## Required Workflow
- Every code change must include or update tests.
- After changes, run: `npm run lint`, `npm run typecheck`, and `npm run test` (or `npm run check`).

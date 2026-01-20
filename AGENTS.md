# Repository Guidelines

## Agent Startup Checklist
- Read `docs/README.md` and all linked documents before making changes.
- Update documentation in `docs/` as architectural decisions or workflows evolve.

## Project Overview & Structure
This is an offline-first, client-only JavaScript app served from a static host and running fully in the browser. Data persists via Local Storage. Current layout: `index.html`, `styles.css`, `app.js` (static app shell), `src/` (shared logic), `tests/` (automated tests), `docs/` (design/architecture notes). Add `assets/` for static files if needed and document any deviations here.

## Build, Test, and Development Commands
- `npm install`: install dev dependencies.
- `npm run test`: run the Vitest suite (Happy DOM environment).
- `npm run lint`: run ESLint across the repo.
- `npm run typecheck`: run TypeScript in `checkJs` mode (no emit).
- `npm run check`: run lint, typecheck, and tests in sequence.
- `npm run wrangler:deploy-create`: create a Pages deployment (requires a clean git status).

## Coding Style & Naming Conventions
JavaScript only; do not add TypeScript source files. Maximize type checking via JSDoc annotations and `tsc --checkJs`. Use `camelCase` for variables/functions and `PascalCase` for constructors/classes. Prefer named exports.

## Testing Guidelines
Every code change must include or update tests. After each change, run tests, linting, and typechecks until all pass. Tests live in `tests/` and use `*.test.js` naming with Vitest.

## Commit & Pull Request Guidelines
No commit conventions are detectable yet due to the empty history. When establishing standards, document:
- Commit message format (e.g., Conventional Commits such as `feat: ...`, `fix: ...`).
- PR requirements (summary, linked issues, screenshots for UI, test evidence).

## Configuration & Secrets
Do not commit secrets. If configuration is required, prefer environment variables and provide a checked-in template such as `.env.example`.

## Deployment
- Deploy only from a clean repo (no uncommitted or untracked changes).
- Commit and push before running any deploy script.

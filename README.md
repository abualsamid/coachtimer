# CoachTimer

CoachTimer is an offline-first browser app for timing multi-athlete races, with a workflow built around Special Olympics coaching and race-day use.

It is designed for fast lap/finish entry from the sideline, simple athlete setup, and saved history so coaches can compare results over time.

## What It Does

- Times cycling and SUP races entirely in the browser.
- Supports mass starts and staggered starts.
- Tracks lap crossings, current lap time, finish times, and lap splits.
- Saves results locally on the device with notes and athlete history.
- Shows athlete progress summaries in the History screen.
- Works as a static app with no backend or server-side database.

## Race-Day Workflow

1. Add athletes to the saved roster and select who is racing.
2. Choose sport, event type, distance, total laps, and start mode.
3. Start the race from the Start Control screen.
4. Record lap crossings and finishes from the Live Timing screen.
5. Save results, add notes, and review athlete history over time.

## Privacy And Storage

This app is client-only.

- Race setup, athlete roster, settings, and history are stored in browser Local Storage.
- There is no application backend.
- No athlete data is sent to a remote database by the app itself.
- A service worker is used to improve offline/static-host behavior.

Storage keys are documented in [docs/data-model.md](/Users/ahmad/Documents/src/github.com/abualsamid/coachtimer/docs/data-model.md).

## Development

Install dependencies:

```bash
npm install
```

Start the local dev server:

```bash
npm run dev
```

Quality checks:

```bash
npm run test
npm run lint
npm run typecheck
npm run check
```

## Deployment

This project is intended for static hosting.

Create a Pages deployment:

```bash
npm run wrangler:deploy-create
```

The repo requires a clean git worktree before deployment.

## Project Structure

- `index.html`: app shell
- `styles.css`: UI styling
- `app.js`: main application and screen logic
- `src/logic.js`: shared timing and data helpers
- `sw.js`: service worker
- `tests/`: Vitest coverage
- `docs/`: architecture, tooling, and data model notes

## Documentation

- [docs/README.md](/Users/ahmad/Documents/src/github.com/abualsamid/coachtimer/docs/README.md)
- [docs/architecture.md](/Users/ahmad/Documents/src/github.com/abualsamid/coachtimer/docs/architecture.md)
- [docs/tooling.md](/Users/ahmad/Documents/src/github.com/abualsamid/coachtimer/docs/tooling.md)
- [docs/data-model.md](/Users/ahmad/Documents/src/github.com/abualsamid/coachtimer/docs/data-model.md)

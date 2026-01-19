# Architecture Overview

This repository is an offline-first, client-only JavaScript app served from a static host and running fully in the browser. Use this file to capture architectural decisions as they are made.

## Scope
- Client-first experience with offline capability by default.
- No server runtime required; static hosting only.
- Persistence via browser storage (start with Local Storage).

## Components
- UI layer: browser-rendered interface and interaction flows.
- Storage layer: browser Local Storage access and data serialization.
- Domain layer: business logic and state transitions.

## Screens
- Setup: sport/event/distance/start mode, athlete selection.
- Settings: default start modes and SUP lap choices.
- Start Control: mass or staggered starts.
- Live Timing: single-athlete view with swipe navigation.
- Results Summary: per-athlete splits and notes, save/export.
- History: saved results with filters and CSV export.

## Data Flow
- User actions update in-memory state, then persist to Local Storage.
- On load, hydrate state from Local Storage before rendering.

## Decisions & Rationale
- JavaScript only, but maximize type checking via JSDoc and tooling (no TypeScript source files).
- Static delivery: `index.html`, `styles.css`, `app.js` with no build step.

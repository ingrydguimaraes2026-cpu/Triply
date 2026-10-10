Website-first PWA built with React + Vite + TypeScript. Mobile-first: every screen must work at phone width (360px) and on desktop.

The project owner (Ingryd) is learning to code: keep code simple, comments and docs in Portuguese, and explain changes in plain language.

## Commands

```bash
npm run dev       # dev server (http://localhost:5173)
npm run build     # typecheck (tsc -b) + production build
npm run lint      # oxlint
npm run preview   # serve the build (service worker / PWA only works here)
```

Run `npm run build` and `npm run lint` before declaring any task done.

## Structure

- Routes are declared in `src/router.tsx` (React Router, `createBrowserRouter`). Screens live in `src/pages/`.
- Screens only render. Data access and business rules go in `src/features/<module>/` (`api.ts`, `hooks.ts`, `components/`).
- Shared clients/utilities in `src/lib/`; data types in `src/types/`; global CSS tokens in `src/styles/global.css`.
- PWA config (manifest, icons) is in `vite.config.ts` via `vite-plugin-pwa`.

## Rules

- Env vars exposed to the browser must start with `VITE_`; never put secrets there.
- Supabase: all tables shared across a "comboio" (trip group) need RLS policies. Photos are compressed client-side before upload.
- Requirements: `docs/conversa-2026-10-10-requisitos.md`. Competitors: `docs/benchmark.md`.
- The name "Triply" is provisional.

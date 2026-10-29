# Open-source landscape relevant to "Together" (group-travel PWA + Expo app + Supabase)

Method: GitHub REST API (`gh api repos/...` and `search/repositories`) on 2026-10-29 for stars, last push date and SPDX license, plus READMEs fetched with WebFetch. Star counts and dates are what was observed on 2026-10-29. "NOASSERTION" means GitHub could not identify the license automatically. In those cases the license is noted from the repo's LICENSE file name or flagged as unverified.

## Travel planners: who leads, how active, stack, license, standout features

### Takeaway
TREK (now `liketrek/TREK`, about 15.2k stars, AGPL-3.0, React 19 + Vite + TypeScript) is by far the most complete and most active open-source group-trip planner. Its feature set is close to a superset of Together's roadmap: real-time collaboration, splitting expenses, offline PWA, importing bookings from email/PDF through KItinerary or AI, and an MCP server. AdventureLog (GPL-3.0, SvelteKit + Django) leads on "travel log / world map / Immich photos". Surmai and itskovacs/trip are small MIT-licensed planners whose code can legally be reused.

### Cited Findings
**TREK** — https://github.com/liketrek/TREK
- 15,223 stars. Last push 2026-10-29. AGPL-3.0. TypeScript. Description: "real-time collaboration, bookings, budgets, packing lists, journals, offline PWA, SSO and an AI-ready MCP server" — [GitHub API / repo](https://github.com/liketrek/TREK)
- The repo moved from `mauriceboe/TREK` to `liketrek/TREK`. The Docker image is still `mauriceboe/trek` and the demo runs at demo.liketrek.com. The README does not explain the rename. — [repo README](https://github.com/liketrek/TREK)
- Stack: React 19, Vite, TypeScript, Tailwind, Zustand, Leaflet/Mapbox GL/MapLibre GL (OpenFreeMap, no token needed) on the front end. NestJS 11 on Node 24 with SQLite on the back end. Real-time sync over WebSockets (`ws`). Auth: JWT, OIDC with PKCE, WebAuthn passkeys, TOTP 2FA. — [repo README](https://github.com/liketrek/TREK)
- Collaboration:
  - Add members by email or username, and transfer ownership.
  - Guests can be added without a login.
  - The admin sets permissions for 17 trip actions.
  - A reusable invite link per trip, with optional expiry.
  - A read-only public share page.
  - Group chat, shared notes, links, polls, and a "What's Next" list.
  - — [repo README](https://github.com/liketrek/TREK)
- Maps and routing:
  - Place search through its own Places index plus OpenStreetMap, with Google Places and Amap as options.
  - Day routes are auto-sorted with nearest-neighbour, then 2-opt.
  - Routing over OSRM/Valhalla.
  - Public transport through Transitous.
  - — [repo README](https://github.com/liketrek/TREK)
- Expenses:
  - Amounts stored as integer cents.
  - Equal or custom shares, and multiple payers.
  - Settle-up suggestions, a settlement log, and CSV export.
  - Each expense has its own currency, and the FX rate from Frankfurter is frozen at entry time.
  - — [repo README](https://github.com/liketrek/TREK)
- Offline:
  - The app shell is precached and trip data lives in a per-user IndexedDB store.
  - Offline writes are queued and replayed with an `X-Idempotency-Key`.
  - Conflicts are resolved with a "keep mine / keep theirs" choice.
  - Map tiles can be downloaded ahead of time.
  - — [repo README](https://github.com/liketrek/TREK)
- Booking import:
  - Accepts EML, PDF, PKPass, HTML, TXT, and photos of confirmations.
  - Parsing uses KItinerary or an AI model.
  - A review step comes before anything is saved, and prices become linked costs.
  - — [repo README](https://github.com/liketrek/TREK)
- AI:
  - The assistant is off by default and supports several providers (Anthropic, OpenAI, Gemini, OpenRouter, and others).
  - Its changes show up as cards the user applies or discards, with undo for 15 minutes.
  - The MCP server uses OAuth 2.1 with PKCE and exposes 410 tools.
  - — [repo README](https://github.com/liketrek/TREK)
- Other features:
  - Flights and trains with timezone handling against 4,045 bundled airports.
  - Packing lists, to-dos, PDF export, and a journal with a photo-book studio.
  - A plugin system and 27 interface languages.
  - No native app: TREK is a PWA only.
  - — [repo README](https://github.com/liketrek/TREK)
- License note from the README: self-hosting is free. If you modify TREK and offer it as a network service, you must release the changes under AGPL. There is also a TRADEMARKS.md file. — [repo README](https://github.com/liketrek/TREK)

**AdventureLog** — https://github.com/seanmorley15/AdventureLog
- 3,842 stars. Last push 2026-10-29. GPL-3.0. Svelte. "Self-hostable travel tracker and trip planner." — [GitHub API](https://github.com/seanmorley15/AdventureLog)
- Features:
  - Multi-day itineraries with flights, lodging, checklists, and links, plus calendar views.
  - Collections, categories, and tags.
  - Public links and inviting other users to edit together.
  - A 2D/3D map with visited/planned filters.
  - World tracking of countries, regions, and cities, with milestones.
  - — [README](https://github.com/seanmorley15/AdventureLog)
- Integrations: Immich (photos), Strava/Endurain (GPX), Wanderer (trails), Google Maps (geocoding). The README mentions no AI features. — [README](https://github.com/seanmorley15/AdventureLog)
- Stack: SvelteKit, Tailwind/DaisyUI, svelte-maplibre on the front end. Django REST Framework, PostGIS, and AllAuth on the back end. — [README](https://github.com/seanmorley15/AdventureLog)

**Surmai** — https://github.com/rohitkumbhar/surmai
- 287 stars. Last push 2026-10-24. MIT. A "personal/family travel organizer". Collaboration between multiple users, offline access, and an installable PWA. — [repo](https://github.com/rohitkumbhar/surmai)
- Stack: React + Vite + TypeScript + Mantine on the front end, PocketBase on the back end, react-i18next with Weblate for translations. This is architecturally the closest match to Together's web app (React + Vite + a BaaS). — [repo](https://github.com/rohitkumbhar/surmai)

**TRIP (itskovacs/trip)** — https://github.com/itskovacs/trip
- 1,956 stars. Last push 2026-10-02. MIT. TypeScript. "Minimalist POI Map Tracker and Trip Planner."
- Features: a POI map, multi-day itineraries, collaborating with companions, and OIDC.
- The repo has its own `mcp-server` folder.
- "No telemetry. No tracking. No ads."
- — [repo](https://github.com/itskovacs/trip)

**wanderer** — https://github.com/open-wanderer/wanderer
- 4,033 stars. Last push 2026-10-28. AGPL-3.0. A self-hosted trail database for hiking and GPX trails, not a trip planner. — [GitHub API](https://github.com/open-wanderer/wanderer)

**KDE Itinerary** — https://invent.kde.org/pim/itinerary (GitHub mirror: KDE/itinerary)
- The GitHub mirror shows only 68 stars, but development happens on KDE's GitLab and the last push was 2026-10-29. It is a desktop and mobile itinerary and boarding-pass manager (C++/Qt). — [GitHub API](https://github.com/KDE/itinerary)

**Other repos on the GitHub "trip-planner" and "travel-planner" topics**
- Most are AI "skills" or agents rather than apps. Examples:
  - travel-plan-viz (410 stars, MIT): generates a single offline HTML file with a map and timeline.
  - jianhao-travel-planner (415 stars).
  - marco-polo.skill (136 stars).
  - — [GitHub topic search](https://github.com/topics/trip-planner)
- stvlynn/OpenTrip (15 stars, Apache-2.0, TypeScript) is a small collaborative SaaS that combines a map itinerary, voting on stops, and splitting expenses. It is the same product shape as Together. — [repo](https://github.com/stvlynn/OpenTrip)
- Travel-Mate (1,345 stars) has had no pushes since 2022, so it is effectively abandoned. — [repo](https://github.com/project-travel-mate/Travel-Mate)

### Inferences
- TREK is the reference benchmark to study for feature scope and UX. Its AGPL-3.0 license means Together should copy ideas and patterns only, not code. Together is a closed or hosted service, so a derivative work would oblige it to open its own source.
- Patterns from TREK worth copying as ideas:
  - Integer cents for money.
  - Freezing the FX rate per expense at entry time.
  - An idempotency key on queued offline writes.
  - A "review before saving" step for imported bookings.
  - AI changes shown as apply/discard cards with undo.
  - Granular per-action permissions for the trip admin (ADM).
  - Guests without a login.
  - Polls.
- Surmai (MIT, React + Vite) and itskovacs/trip (MIT) can be studied and reused at code level, keeping the copyright notice.
- In this search, no project offers a native mobile app together with a hosted SaaS for groups. Together's Expo app plus Supabase sync is a real gap against the OSS field.

### Gaps
- Could not find "Voyage" or "TripSit" as travel planners. Several guessed repo names returned 404, and "voyage self-hosted" searches only turned up tiny repos (0 stars). TripSit is a harm-reduction project, not travel, based on general knowledge and not verified here.
- Did not measure commit frequency, only the last push date.
- Did not verify the license text of KDE Itinerary (believed to be LGPL/GPL, unconfirmed).

## Expense splitting OSS (multi-currency, OCR, balances, recurring, PWA, export)

### Takeaway
Spliit (MIT, Next.js + Prisma + Postgres, about 3.0k stars) and SplitPro (MIT, Next.js + tRPC + Prisma, about 1.5k stars) are the modern, permissively licensed references. Cospend (AGPL) has the richest classic features: recurring bills, a settlement plan, and CSV import/export. IHateMoney is in maintenance mode.

### Cited Findings
- **Spliit** — https://github.com/spliit-app/spliit
  - 3,030 stars. Last push 2026-10-22. MIT. — [GitHub API](https://github.com/spliit-app/spliit)
  - Features:
    - Groups, uneven splits, balances, and reimbursements.
    - Categories and search.
    - Image attachments stored in S3.
    - Receipt scanning with OpenAI vision models (opt-in, any OpenAI-compatible provider).
    - AI category suggestions.
    - PWA.
    - Group deletion with a 30-day restore window.
    - Recurring expenses and Splitwise import are still on the roadmap.
    - Group access works through the group link or ID; the README does not mention accounts.
    - — [README](https://github.com/spliit-app/spliit)
  - Stack: Next.js, shadcn/ui, Prisma, Postgres, Playwright, Weblate. — [README](https://github.com/spliit-app/spliit)
- **SplitPro** — https://github.com/oss-apps/split-pro
  - 1,479 stars. Last push 2026-10-20. MIT. — [GitHub API](https://github.com/oss-apps/split-pro)
  - Features:
    - Multiple currencies, with conversion of expenses and balances into one currency.
    - Optional per-group debt simplification.
    - Splits by equal, percentage, share, exact amount, or adjustment.
    - Negative expenses for refunds.
    - Recurring expenses, but only with Postgres `pg_cron`.
    - PWA with push notifications.
    - Partial Splitwise import (friends and groups, not expenses).
    - Data export.
    - Plaid bank transactions can be turned into expenses.
    - An activity feed of edits and deletions.
    - — [README](https://github.com/oss-apps/split-pro)
  - Stack: Next.js, NextAuth, Prisma/Postgres, tRPC, Tailwind. — [README](https://github.com/oss-apps/split-pro)
- **Cospend (Nextcloud)** — https://github.com/julien-nc/cospend-nc
  - 329 stars. Last push 2026-10-28. AGPL-3.0. — [GitHub API](https://github.com/julien-nc/cospend-nc)
  - Features:
    - Per-project currencies.
    - A settlement plan that can automatically create the reimbursement bills.
    - Recurring bills: daily, weekly, monthly, or yearly.
    - CSV import/export compatible with IHateMoney and Splitwise.
    - — [README](https://github.com/julien-nc/cospend-nc)
  - Mobile clients:
    - Cowspent (Android).
    - MoneyBuster (unmaintained).
    - PayForMe (iOS, in development).
    - — [README](https://github.com/julien-nc/cospend-nc)
- **IHateMoney** — https://github.com/spiral-project/ihatemoney
  - 1,395 stars. Last push 2026-08-07. Beerware-style BSD-derived license. — [GitHub API](https://github.com/spiral-project/ihatemoney)
  - Invited participants do not need accounts. — [README](https://github.com/spiral-project/ihatemoney)
  - The maintainers say the project has reached maturity and should move toward "maintenance mode", and they point to Cospend and Spliit as alternatives. — [README](https://github.com/spiral-project/ihatemoney)
- **Small, newer projects** — [GitHub topic search](https://github.com/topics/splitwise-alternative):
  - sharetab (65 stars, MIT): AI receipt scanning in one Docker container.
  - peanutsplit (40 stars, AGPL): split by link, no accounts, any currency, offline PWA.
  - splitz (Apache-2.0): offline-first, minimal transfers, VietQR settle.
  - xupersplit (MIT): accountless, settle with Swish or Lightning.
- **TREK's built-in splitter**: integer cents, multiple payers, settle-up suggestions, CSV export, and a per-expense FX rate frozen at entry. — [TREK README](https://github.com/liketrek/TREK)

### Inferences
- Recurring trends in the field:
  - Receipt OCR is now done with LLM vision models (Spliit, sharetab) rather than Tesseract.
  - "No account needed for invited participants" is common (IHateMoney, Spliit, peanutsplit).
  - Settling through local payment rails (VietQR, Swish) is showing up. A Pix QR code would be the natural Brazilian version for Together. This is an idea, not a cited fact.
- Spliit and SplitPro are MIT and TypeScript, so their balance and debt-simplification logic can legally be adapted, keeping the attribution.
- Splitwise-compatible CSV import/export (as in Cospend) is cheap and lowers switching cost.

### Gaps
- The READMEs do not describe the exact debt-simplification algorithm in Spliit or SplitPro (greedy min-cash-flow versus other approaches). Reading the source would be needed.
- Tricount-specific OSS clones: none notable found.

## Supporting libraries and services: booking parsing, offline maps, FX, location/journal, photos, OCR, flights

### Takeaway
- **Booking parsing:** KItinerary is the standard OSS engine. It runs offline, outputs schema.org JSON, and ships a CLI. TREK already uses it.
- **Maps:** MapLibre (GL JS plus maplibre-react-native with Expo support) with PMTiles/Protomaps or OpenFreeMap is the token-free stack for offline maps.
- **FX:** Frankfurter (MIT) and fawazahmed0/exchange-api (CC0) are free sources of exchange rates.
- **Route tracking and photos:** Dawarich and Immich (both AGPL) are the reference self-hosted projects.

### Cited Findings
- **KItinerary** — https://invent.kde.org/pim/kitinerary
  - What it reads:
    - PDFs, emails, Apple Wallet passes, iCal, HTML/XML.
    - Ticket barcodes: IATA boarding pass, UIC 918.3/918.9, DOSIPAS, ERA FCB/SSB, VDV.
    - Nested documents, for example email → PDF → image → barcode.
    - — [README](https://invent.kde.org/pim/kitinerary/-/raw/master/README.md)
  - Data model: follows the schema.org ontology, plus IANA timezone extensions. Vendor-specific extractor scripts are written in JavaScript or C++. — [README](https://invent.kde.org/pim/kitinerary/-/raw/master/README.md)
  - The `kitinerary-extractor` CLI "reads input data from stdin and outputs schema.org JSON". Static builds are available from CI. — [README](https://invent.kde.org/pim/kitinerary/-/raw/master/README.md)
  - Extraction is fully local: "No online operations are performed during extraction or post-processing". — [README](https://invent.kde.org/pim/kitinerary/-/raw/master/README.md)
  - Used by KDE Itinerary, KMail, Nextcloud Mail, and TREK. — [README](https://invent.kde.org/pim/kitinerary/-/raw/master/README.md); [TREK](https://github.com/liketrek/TREK)
  - GitHub mirror: 49 stars, last push 2026-10-29. — [GitHub API](https://github.com/KDE/kitinerary)
- **MapLibre**
  - maplibre-gl-js: 11,975 stars. Last push 2026-10-29. GitHub reports the license as "Other" (BSD-3-Clause per general knowledge, not verified here). — [repo](https://github.com/maplibre/maplibre-gl-js)
  - maplibre-react-native: 672 stars. Last push 2026-10-28. MIT. "Interactive vector tile maps with MapLibre Native in Expo and React Native supporting Android & iOS." — [repo](https://github.com/maplibre/maplibre-react-native)
  - maplibre-native: 2,289 stars. BSD-2-Clause. — [repo](https://github.com/maplibre/maplibre-native)
- **Protomaps PMTiles**: 3,098 stars. Last push 2026-09-16. "Pyramids of map tiles in a single file on static storage", which allows serving or downloading regional map files without a tile server. — [repo](https://github.com/protomaps/PMTiles)
- **protomaps/basemaps**: 768 stars, last push 2026-09-11. — [repo](https://github.com/protomaps/basemaps)
- **OpenFreeMap**: TREK uses it as a no-token MapLibre tile source. — [TREK README](https://github.com/liketrek/TREK)
- **Frankfurter** (FX) — https://github.com/lineofflight/frankfurter
  - 2,047 stars. Last push 2026-10-25. MIT.
  - More than 200 currencies from "over 100 central banks and official sources", updated daily, with history back to 1948.
  - Hosted API at api.frankfurter.dev, or self-host with Docker.
  - — [README](https://github.com/lineofflight/frankfurter)
- **fawazahmed0/exchange-api** (FX): 2,705 stars. CC0-1.0. "200+ Currencies & No Rate Limits". — [repo](https://github.com/fawazahmed0/exchange-api)
- **Dawarich** (Google Timeline alternative) — https://github.com/Freika/dawarich
  - 10,776 stars. Last push 2026-10-28. AGPL-3.0. Ruby on Rails. — [GitHub API](https://github.com/Freika/dawarich)
  - Tracking sources: its own iOS and Android apps, OwnTracks, Overland, GPSLogger. — [README](https://github.com/Freika/dawarich)
  - Maps: heatmap and "Fog of War" layers. — [README](https://github.com/Freika/dawarich)
  - Trips: a route between two dates, with Immich or Photoprism photos on it. — [README](https://github.com/Freika/dawarich)
  - Stats: countries visited and days per country. — [README](https://github.com/Freika/dawarich)
  - Data: imports from Google Timeline and GPX; exports to GeoJSON and GPX. — [README](https://github.com/Freika/dawarich)
  - Stability: the README warns that it is "Under active development" and may have breaking changes. — [README](https://github.com/Freika/dawarich)
- **Polarsteps alternatives**: only tiny repos (0–3 stars), such as MarkMySteps, FreeRange, and ownsteps. — [GitHub search](https://github.com/search?q=polarsteps+alternative&type=repositories)
- **Immich** (photos): 117,595 stars. Last push 2026-10-29. AGPL-3.0. "High performance self-hosted photo and video management solution". AdventureLog and Dawarich both integrate with it. — [repo](https://github.com/immich-app/immich); [AdventureLog](https://github.com/seanmorley15/AdventureLog)
- **Receipt OCR**: the classic OSS parsers are stale.
  - receipt-parser-legacy (Tesseract): last push 2024-08. — [repo](https://github.com/ReceiptManager/receipt-parser-legacy)
  - bhimrazy/receipt-ocr: 748 stars, MIT, active in 2026-10. — [repo](https://github.com/bhimrazy/receipt-ocr)
  - Modern apps use LLM vision instead (Spliit, sharetab). — [Spliit](https://github.com/spliit-app/spliit)
- **Flight data**: TREK bundles a dataset of 4,045 airports for timezone handling. — [TREK](https://github.com/liketrek/TREK)
- **Public transit**: TREK routes public transport through Transitous. Navitia (457 stars, AGPL) is an OSS multimodal journey-planning engine. — [TREK](https://github.com/liketrek/TREK); [navitia](https://github.com/hove-io/navitia)

### Inferences
- For Together's web app (React) and Expo app, MapLibre is the consistent choice across both platforms: GL JS on the web, maplibre-react-native in Expo. It has permissive licenses and no per-load fees. PMTiles files on Supabase Storage or a CDN could enable "download the destination's map before the trip".
- KItinerary is a native C++/Qt binary. Using it from Supabase would need a separate worker such as a container, because Supabase Edge Functions (Deno) cannot run it. The simpler path is an LLM extraction into a schema.org-shaped JSON (FlightReservation, LodgingReservation), with a human review step as TREK does. Shaping the data like schema.org keeps the option of adding KItinerary later. Calling the CLI as a separate process limits the license implications compared with linking against it, but legal review is recommended.
- Frankfurter (MIT, central-bank sources) is a good fit for the existing "câmbio" (exchange-rate) feature. Freezing the rate per expense, as TREK does, avoids balances drifting over time.
- Dawarich and Immich are AGPL and self-hosted, so they are useful as feature references (fog of war, countries visited, photos on the route), not as dependencies of a SaaS.

### Gaps
- No open-source flight-status data source was confirmed. The guessed `opensky-network/opensky-api` repo path returned 404. Commercial APIs (AeroDataBox, FlightAware, and others) were not researched.
- Open-source photo deduplication and curation libraries (perceptual hashing, CLIP) were not researched beyond noting Immich.
- PMTiles and maplibre-gl-js license text was not verified directly, because GitHub reports it as "Other".

## Supabase / React Native travel templates

### Takeaway
No well-known, maintained open-source travel or trip-planner template on Expo + Supabase was found. The examples that exist are student or hobby projects. Together's stack is unusual among OSS travel apps, which mostly self-host with Django, NestJS + SQLite, PocketBase, or Next.js + Prisma.

### Cited Findings
- GitHub topic searches combining `travel` with `react-native` or with `supabase` returned no results. — [GitHub search](https://github.com/topics/travel)
- Web search found only small projects:
  - natccc/doggo: Expo + Supabase, a travel app for dog owners with trips CRUD.
  - Stanford CS147 "Revisit": RN + Supabase + Anthropic API, a class prototype.
  - Upwork job posts asking for exactly this stack.
  - — [doggo](https://github.com/natccc/doggo); [Stanford CS147 PDF](https://stanford.edu/class/cs147/projects24/Designing-for-Movement/revisit/dist/pdfs/a8_README.pdf); [Upwork](https://www.upwork.com/jobs/~022065147404742926478)
- Stacks of the mature OSS projects:
  - TREK: NestJS + SQLite + WebSockets. — [TREK](https://github.com/liketrek/TREK)
  - AdventureLog: Django + PostGIS. — [AdventureLog](https://github.com/seanmorley15/AdventureLog)
  - Surmai: PocketBase + React/Vite. — [Surmai](https://github.com/rohitkumbhar/surmai)
  - Spliit and SplitPro: Next.js + Prisma + Postgres. — [Spliit](https://github.com/spliit-app/spliit); [SplitPro](https://github.com/oss-apps/split-pro)
- maplibre-react-native officially supports Expo. — [repo](https://github.com/maplibre/maplibre-react-native)

### Inferences
- Together cannot shortcut with a template. It can borrow patterns:
  - Supabase Realtime in place of TREK's WebSockets.
  - Postgres `pg_cron` for recurring expenses, which SplitPro already uses and Supabase supports.
  - RLS-based permissions in place of TREK's application-level 17-action permission matrix.

### Gaps
- Did not search Expo or Supabase official example galleries specifically for travel apps.

## Licenses: what Together can reuse

### Takeaway
MIT, CC0, BSD and Apache projects can be reused as code, with attribution. GPL and AGPL projects should be treated as idea sources only. For a hosted SaaS, AGPL's network clause would force Together to publish its source if it included or modified that code.

### Cited Findings
- **Copyleft (AGPL-3.0):**
  - TREK: the README states that modifying it and offering it as a network service requires releasing the modifications under the same license. — [TREK](https://github.com/liketrek/TREK)
  - Also AGPL-3.0: wanderer, Cospend, Dawarich, Immich, peanutsplit. — [GitHub API results](https://github.com/liketrek/TREK)
- **Copyleft (GPL-3.0):** AdventureLog. — [AdventureLog](https://github.com/seanmorley15/AdventureLog)
- **Permissive:**
  - MIT: Spliit, SplitPro, Surmai, itskovacs/trip, Frankfurter, maplibre-react-native.
  - CC0: exchange-api.
  - BSD-2-Clause: maplibre-native.
  - Apache-2.0: OpenTrip.
  - — [GitHub API results](https://github.com/spliit-app/spliit)
- **Other:** IHateMoney uses a beerware-style BSD-derived license. — [README](https://github.com/spiral-project/ihatemoney)
- **Data:** TREK's country boundaries come from geoBoundaries under CC BY 4.0, which requires attribution. — [TREK](https://github.com/liketrek/TREK)

### Inferences
- **Safe to adapt as code (keep the LICENSE notice):** split and settle logic from Spliit or SplitPro, the trip/collaboration UI patterns from Surmai or itskovacs/trip, MapLibre, and Frankfurter.
- **Ideas only:** TREK, AdventureLog, Cospend, Dawarich, Immich. Feature lists and UX flows are not copyrightable, but code, assets, and text are. TREK also has a TRADEMARKS.md, so avoid confusingly similar branding.
- This is not legal advice. Have a lawyer review before shipping any copied code.

### Gaps
- KDE Itinerary and KItinerary license text not verified (GitHub reports NOASSERTION).

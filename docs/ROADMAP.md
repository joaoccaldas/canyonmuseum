# Roadmap — Speedmax Museum

A walkable museum of time-trial bikes on the Kona coast, and a studio where any bike can be painted,
themed, dreamed and shared. Web first, installable on phones, built to scale to other events, brands
and products without rewriting code.

## Principles

1. **Mobile first.** Every screen is designed for a phone held in one hand, then scaled up. Quality
   presets (Auto / High / Balanced / Low) keep phones cool; teleport between rooms saves battery and time.
2. **Safe and private.** No account needed, no analytics, no third-party trackers. A strict
   Content-Security-Policy on every page. Anything read from a link or from storage is validated
   (`normalise()`, `decodeLook()`, `skinProblems()`) before use; catalogue text is rendered as text, never HTML.
3. **True.** Facts carry evidence classes (published / read from a photograph / inferred / generated).
   AI-made works are labelled. Every image and model keeps its original source record.
4. **Data, not code.** Wings, rooms, products, liveries, themes and events are JSON files; engines
   render them. Adding content never needs a code change (see `docs/CONTENT.md`).
5. **Nothing broken ships.** Tests, the bike asset contract and a rebuild check gate every push and
   the deploy (`docs/ARCHITECTURE.md`).

## Where we are (29 Sep 2026)

| Area | State |
|---|---|
| Museum | 19 walkable areas on two floors; 41+ bike models; 12 paintings; 3 sculptures; interactive map; teleport between rooms |
| Studio | one page for all **29 products** (8 studio-only designs); liveries, mix-your-own colours, finishes, 8 film themes, scenes, Dream mode, favourites, saved liveries, shareable looks |
| App | on-device profile, quality presets, share-to-any-app, progressive loading, offline state, install as app, deep links |
| Engineering | livery engine, wing engine, card engine, catalogue generator; 58 tests; CI gate |

## Next — two weeks

- **Performance (Phase 4):** share geometry between the Sanctuary's eight bikes and give distant
  bikes a light model; target ≤ 1.5 M triangles and ≤ 400 draws anywhere on a phone. This is the
  likely cause of “all the bikes disappear” on phones (the hall entrance draws ~6.5 M triangles today).
- **Studio 2:** parts swaps (wheels, bars, saddle) from a parts catalogue with the same slot contract;
  decals as data; a side-by-side compare; a “my garage” page for saved liveries and favourites.
- **Share loop:** a share card per exhibit with an Open Graph image, so links preview well in
  messaging apps; “made in the studio” gallery of the visitor's own shared looks (on-device).
- **Come-back loop:** the Passport grows into collections (every Kona champion, every film theme, every
  wing); a daily “bike of the day” on the landing screen; new wing announcements in-app.
- **Accounts (optional):** Neon Auth + Postgres for sync across devices — profile, passport,
  favourites, liveries. Needs the owner's go-ahead to create the Neon project, plus a privacy page.

## Then — this quarter

- **Port the hand-built rooms to data (Phase 5):** hall, Sanctuary, WYLD, Champions, Lava Night, pier.
  After that every room in the museum is a data file.
- **Generated navigation (Phase 3):** walkable grid + A* from room outlines; delete hand-written routes.
- **Events as a product:** `museum/events/*.json` already scopes the studio (featured bikes, themes,
  share line). Add event wings (e.g. a race-week pop-up) and event-only liveries with start/end dates.
- **Other brands and product types:** the catalogue already carries `brand` and `type`; add helmets,
  wheels and skinsuits with their own asset contracts; brand-scoped studios (`?brand=`).
- **Quality:** KTX2 textures, meshopt everywhere, content fetched as JSON (smaller first load),
  per-device auto-tier from a warm-up benchmark.

## Later

- WebXR: walk the museum in a headset (the renderer and teleport already fit).
- Multiplayer visits: tour a friend around the museum (opt-in, ephemeral rooms).
- Creator mode: build a room from the studio and share it as a link.
- Native shells (Capacitor build exists in `app/native`) with the same web core.

## How we measure (without analytics)

No tracking. We learn from: CI results, the smoke runs' draw-call and triangle numbers, device QA on
real phones, and what visitors choose to send us. If product numbers are ever needed, they will be
opt-in, aggregate, and documented here first.

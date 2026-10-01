# KONA Feed and Travel release

The Feed and Travel to Kona are lightweight pages in the existing app shell, entered from User Studio or `?view=feed` / `?view=travel`. The 3D world is not loaded on either direct route.

## Responsibilities

- `web/src/ui/companion.js`: presentation and lifecycle for both pages.
- `companion-manager.js`: add, remove and enable subscriptions.
- `companion-subscriptions.js`: device-local preferences, live service calls, personal RSS URLs and dated fallback.
- `companion-data.js`: escaping, filtering, safe links and date/freshness projections.
- `web/styles/companion.css`: scoped page styles using the existing brand tokens. Studio layout stays in `race-self.css`.
- `supabase/functions/companion`: public read-only feed service, bounded XML parsing and outbound publisher policy. No account/database writes or service-role credentials.
- `integrations/companion/sources.json`: default sources and attribution. These are defaults, not hardcoded stories.
- `museum/places/kona-v1.json`: canonical local-business/place directory. `build_companion.mjs` projects public fields into Travel without copying the editing authority.
- `travel-sources.json`: official travel links and explicitly external live views.
- `refresh_companion.ts`: scheduled dated fallback; uses the same live parser/service, never a second scraper.

## What is live and customizable

Both feeds accept RSS/Atom URLs from supported publisher domains and arbitrary YouTube channel URLs. Each view has independent subscriptions, filters and an RSS URL matching its enabled sources. Preferences and personal business links persist on this device. There is no claim of account synchronization.

The initial athlete selection is Sam Laidlow, Jan Frodeno (Frodeno Going Mental), Lucy Charles-Barclay (Team Charles-Barclay), Sam Long, Lionel Sanders and Paula Findlay (That Triathlon Life, shared with Eric Lagerstrom). Channel identity was checked against official athlete websites/channel metadata. Inclusion does not assert that an athlete is racing or physically in Kona in 2026.

Default reporting: Slowtwitch, Triathlon Magazine and Big Island Now. Headlines, dates, source links and YouTube thumbnails only; no copied article bodies or autoplay players. A publisher failure keeps its last successful local copy and original dates. The edge cache lasts up to ten minutes; the app labels delayed/offline content.

Any HTTPS business link can be saved privately in Travel. It is labeled a personal stop, not a verified business or partner. Travel's island-news feed has its own editable RSS subscriptions.

## Deliberate boundaries

- New RSS **domains** require review in `source-policy.json`; adding a feed path on a supported publisher or any YouTube channel requires no deployment. The Supabase edge runtime does not implement HTTP DNS pinning, so unrestricted URL proxying was rejected. TLS verification remains enabled; redirects must remain on reviewed hosts. Public-address checks, response size/time limits and XML declaration rejection are enforced.
- Publishable-key validation identifies the public app capability, not a logged-in person. Requests have bounded fan-out and per-instance abuse limits; those are not a global distributed quota. No privileged data is reachable from this service.
- Flights open FlightAware's current KOA board. Traffic opens Google Maps; official closures link to HDOT. No flight times or congestion readings are fabricated or presented as live inside the app. An in-app flight board requires a licensed provider integration and a server-side credential.
- Scheduled fallback refreshes are best effort; GitHub schedules are not a minute-level delivery guarantee. On-demand refreshing works independently.
- The mobile browser tests do not certify physical home-screen installation or low-end thermal performance.

## Verification

- 282 existing/new browser-independent checks pass, including unchanged auth behavior.
- Five edge-provider/handler contracts pass: URL boundaries, private addresses, unsafe XML, safe metadata, input limits and key checks.
- Live first refresh: 135 items, all 9 starting sources successful.
- Chromium: Feed and Travel at 360, 390, 768 and 1440 CSS pixels, source/category search, custom stop, shared font, no page errors, missing local assets or unwanted 3D loads.
- Live subscription journey: add channel, refresh, reload persistence, remove, reject local URL, read personalized RSS, offline copy, independent Travel subscriptions.
- Seven existing Studio viewports and avatar persistence/Passport/Plan/Discover/museum journey pass with the two added destinations.
- Safari/WebKit screenshots and final release checks are recorded in the go-live review after completion.

## Reuse evidence

Discovery searched the current museum project and other indexed projects. Historical RSS lead `a7d4b9d8ea7a9e5089ec0cf26a275d69b940784d056c39ec1d5f9062d78cd052` pointed to HoldingCo. Inspection of its current database-backed landing feed showed it was unsuitable for this static public app. Existing museum shell, brand tokens and Kona place registry were extended; the bounded public feed provider is new. Preflight evidence `05e78cf670139d5b55ba6537203c733377c3a8b2ade48fbb7f6eb4df9447e6d1` reported no historical feed pipeline; current files were checked rather than treating the report as proof.

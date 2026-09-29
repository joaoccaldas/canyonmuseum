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

## Launch gate — today

The product launches only when the **Explore → Collect → Customize → Share → Return** loop is real on a phone and the web/PWA build is the same product.

**Required today**
- Mobile-first museum entry, touch navigation, map/teleport and responsive 3D.
- A coherent Kona-first world with sourced exhibit cards.
- Passport/discovery persistence plus real hidden finds.
- Studio customisation, favourites/saved liveries and shareable deep links.
- Installable PWA, Android build path, deterministic build, integrity-sealed service worker.
- CSP, no analytics/tracking, no required account, no private data in the public build.
- Green unit tests, bike asset contract, generated-page check and browser sanity check.

**Not required for today's launch**
- Cloud accounts/sync, multiplayer, WebXR, monetisation, every equipment category, every brand, full trip-planner routing or full PT-BR translation.

Every new idea is evaluated against four product loops:
1. **Explore** — makes the world more useful or immersive.
2. **Collect** — gives discovery persistent meaning.
3. **Customize** — lets the visitor make something personally relevant.
4. **Share** — creates a useful/social output or invitation to return.

If an idea does not strengthen one of these loops, improve launch reliability, or create a credible commercial path, it stays in **Later**.

## Now — Kona race-window sprint

The 2026 IRONMAN World Championship is in Kailua-Kona on **10 October 2026**, so the first post-launch expansion is intentionally Kona-heavy.

### P0 — reliability + mobile polish
- Keep `main` deployable at all times; growth work stays on feature branches until tests, generated builds and phone QA pass.
- Golden phone screenshots at 320, 360, 390 and 430 px plus one tablet/desktop baseline.
- Browser sanity crawl every map area, guided-tour stop and Studio deep link.
- Performance budget: progressive room loading, no new heavy model in the launch path without a measured frame/load budget.

### P1 — Kona discovery and return loop
- One canonical Passport state model; retire duplicate legacy discovery state only after migration tests.
- Nine real hidden finds with rarity that unlocks **experiences**, not arbitrary currency.
- Daily exhibit and weekly Kona collection challenge, deterministic and local-first.
- Garage V1 for saved Studio looks after the current profile/passport stores are consolidated.
- Share prompts only at meaningful moments: new find, collection completion, saved build, rare unlock.

### P1 — Hawaiʻi Island story + trip-planning foundation
Purpose: broaden the app from race museum to useful race-week companion while respecting Hawaiʻi as a living place, not race scenery.

- Structured `museum/kona/island-guide.json`: history/culture, communities, landscapes, visitor places, categories, coordinates, source URLs, accessibility/safety notes and cultural-sensitivity flags.
- New **Island Stories** museum wing: Voyaging & Kānaka Maoli, Royal Kona, Land & Volcanoes, Ocean & Fishponds, Coffee & Agriculture, Modern Hawaiʻi Island, and Visit with Care.
- Trip-planner roadmap: saved places → themed half/full-day collections → map/deep links → race-week overlays. No booking, live traffic or location tracking in V1.
- Use authoritative sources first (NPS, Hawaiʻi Tourism Authority, Census, official event sources) and explicitly distinguish history, present-day population data and visitor guidance.
- Never reduce Native Hawaiian culture to decoration; culturally significant locations carry context and respectful-visit guidance.

### P1 — gallery art direction
- Room design is data: wall/floor material, trim, frames, plinths, light colour/intensity, signage and exhibit density.
- **Materials & Motion** is the proving wing for Carbon, Air, Heat, Night, Archive and Next.
- New room visuals must reuse the same engine and pass mobile draw/load budgets before more geometry is added.

## P2 — international launch

- English and Brazilian Portuguese are the first locale pair.
- Stable entity IDs with localized content records; no translated IDs or duplicated product logic.
- Canonical `/en/` and `/pt-br/` surfaces with reciprocal `hreflang`, localized metadata, sitemap entries and LLM summaries.
- Translate navigation, Passport, Studio and Kona visitor content first; long-tail engineering/archive pages follow.
- Add language choice to profile, but never require an account.

## P2 — platform proof: brands + equipment

Do not add brands/categories as bespoke features. Prove modular contracts.

### One additional bike-brand wing first
- Select one brand based on source quality, iconic triathlon/time-trial machines, model rights/provenance and partnership relevance.
- The wing must be produced mostly from data using the existing room/wing/catalogue engines.
- Refactor before brand #3 if brand #2 requires hard-coded renderer logic.

### Equipment contract
Start with **helmets**, then wheels, shoes and trisuits because each should exercise the same collectible/displayable/equippable interface.

```
CollectionItem
  id
  type: bike | helmet | wheel | shoe | trisuit | artifact | artwork
  brand
  era
  rarity
  sources[]
  asset
  slots[]
  localized_content
```

The Studio then grows toward **My Race Setup** rather than independent product mini-apps.

## P3 — retention and growth

- Collection completion unlocks rooms, presentation finishes or experiences.
- Curated race-week challenges and shareable collection cards.
- Remixable Studio configurations and deep links.
- Optional, transparent aggregate analytics only if product questions cannot be answered through opt-in research/device QA.

## SEO + LLM discoverability

- Human-facing canonical pages remain useful without JavaScript-only hidden text.
- JSON-LD represents museum, products, exhibits, event context and provenance.
- `robots.txt` explicitly permits normal search and ChatGPT Search crawler access while retaining the existing privacy/leak guard.
- `llms.txt` stays concise; add `llms-full.txt` for rooms, product/entity IDs, evidence model and source links.
- EN/PT-BR URLs use canonical + reciprocal `hreflang`; localized sitemap generated from the same content registry.
- No keyword stuffing, doorway pages or synthetic-location pages.

## Then — this quarter

- **Port the remaining hand-built rooms to data:** hall, Sanctuary, WYLD, Champions, Lava Night, pier.
- **Generated navigation:** walkable grid + A* from room outlines; delete hand-written routes.
- **Events as a product:** event overlays and time-bounded collections without cloning the museum.
- **Trip planner 2:** map clusters for race-week, history/culture, beaches/ocean, volcano/landscape, coffee/food and recovery; save/share an itinerary locally.
- **Performance:** KTX2 textures, meshopt everywhere, content fetched as JSON, per-device warm-up benchmark.

## Later

- Cloud sync/accounts only after a privacy review and a real cross-device retention need.
- WebXR after mobile rendering budgets are stable.
- Multiplayer visits only as opt-in ephemeral sessions.
- Creator rooms after the room schema is stable enough not to expose unsafe arbitrary content.
- Booking/commerce only through explicit partner integrations and clear separation from editorial museum content.

## How we measure without surveillance

No default analytics. Use CI, browser/device QA, frame/load budgets, voluntary feedback and deliberately designed user tests. Any future telemetry must be opt-in, aggregate where possible, documented, and removable.

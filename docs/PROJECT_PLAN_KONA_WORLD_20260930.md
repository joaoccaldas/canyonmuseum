# Kona World / Canyon Museum — Integrated Project Plan

**Date:** 30 Sep 2026  
**Release target:** public beta before Kona race week, with daily releases through 10 Oct 2026  
**Canonical repo:** `joaoccaldas/canyonmuseum`

## 1. Product north star

One place for Kona race week, plus a collectible 3D world that rewards exploration.

Core loop:

`USE → EXPLORE → COLLECT → UNLOCK → CUSTOMIZE → SHARE → RETURN`

Primary navigation:

1. **Now** — what matters today, current Kona information, fast actions.
2. **Explore** — 3D museum/world, rooms, bikes, art, hidden finds, stories.
3. **Setup** — bike/equipment configuration and saved builds.
4. **Plan** — race-week schedule, places, travel utility.
5. **Me** — Passport, XP, streaks, badges, collections, settings, optional sync.

The museum is one explorable mechanism inside a broader Kona experience. Existing deep content stays available and becomes progressively discoverable.

---

## 2. Release architecture

### Production
- `main` = protected shipping branch.
- GitHub Pages = current web/PWA host.
- Android = Capacitor shell, built by GitHub Actions.
- Supabase = free beta authentication + per-user GameState backup.
- Local-first = default. Login is optional.

### Current beta state
- Canonical GameState facade aggregates Profile, Passport/progression, finds, RaceSetup and Garage.
- Optional email magic-link authentication.
- Explicit cloud backup/restore, not silent merging.
- Row-level security keeps each cloud row owned by its authenticated user.
- PWA integrity manifest/service worker.
- Mobile light/dark visual matrix.
- Source-grounded Kona Now/Plan content.

---

## 3. Asset estate — mapped inventory

The generated app manifest currently seals **131 public files**, including **36 GLB 3D assets** and **79 raster images**.

### 3.1 Canyon / Speedmax 3D bikes — 8 GLBs

| Asset | Public path | Current use |
|---|---|---|
| Speedmax Three 2005 | `assets/heritage/speedmax-three-2005/speedmax_web.glb` | Queen K hall / heritage |
| Speedmax 2007 | `assets/heritage/speedmax-2007/speedmax_web.glb` | Queen K hall / heritage |
| Speedmax AL 2011 | `assets/heritage/speedmax-al-2011/speedmax_web.glb` | Queen K hall / heritage |
| Speedmax CF 2011 | `assets/heritage/speedmax-cf-2011/speedmax_web.glb` | Queen K hall / heritage |
| Speedmax CF SLX 2015 | `assets/kona-years/bikes/cfslx-2015/speedmax_web.glb` | Kona champions / Kona-by-year |
| Speedmax CFR 2019 | `assets/kona-years/bikes/cfr-2019/speedmax_web.glb` | Kona champions / Kona-by-year |
| Speedmax CFR MY2027 | `assets/museum/speedmax_web.glb` | Main hall / Studio / WYLD base bike |
| Speedmax SLX MY2027 | `assets/museum-slx/speedmax_web.glb` | Main hall / Studio |

### 3.2 Beyond-Canyon / Against the Clock — 21 GLBs

Named / evidence-grounded:
- Eddy Merckx Hour bike / Colnago
- Graeme Obree bikes
- Lotus Type 108
- Zipp 2001
- Stevens triathlon bike
- 2005 aluminium triathlon bike

Type studies:
- Funny bike / 1980s
- Track pursuit bike
- Disc-brake triathlon superbike
- 1989 road bike + clip-on aerobars
- 650c low-profile triathlon bike
- Modern Hour bike
- Draft-legal triathlon bike

Studio concepts:
- Kona concept 2030
- Small-frame 650c triathlon bike
- XL triathlon bike
- Entry alloy triathlon bike
- Track sprint bike
- Beam triathlon concept
- Wing-frame road/triathlon bike
- Aero gravel bike

These are wired into the **Against the Clock** and **Kona Light** data-driven upper-floor wings or available to Studio/product experience flows.

### 3.3 Product-intake proof assets — 2 GLBs

- Cervélo P5 Disc Mk2 size 54 study  
  `assets/kona-heritage/bikes/cervelo-p5-disc-mk2-size54.glb`
- Nike Alphafly 3 study  
  `assets/kona-heritage/shoes/nike-alphafly-3-study.glb`

These prove the product system can accept non-Canyon bikes and shoes without brand-specific runtime logic. Public promotion remains gated by provenance/quality checks.

### 3.4 Art / spatial assets

3 standalone sculpture GLBs:
- The Tuck
- Basalt Airfoil
- Sea-glass Wave

1 Artworld GLB package:
- `assets/artworld/artworld_assets.glb`

12 museum paintings:
- Queen K First Light
- Crosswind
- Mirage
- Kohala Turn
- Race Morning Bay
- Lava Meets Sea
- Midnight Seawall
- Twill
- Night Boards
- Builders Bench
- Streamlines
- Moving Air

### 3.5 Kona media / provenance

- 26 Kona-year race/reference images in the PWA asset manifest.
- 16 history images.
- 7 additional reference images.
- 12 Kona-year timeline records.
- 6 Kona championship-title records.

### 3.6 Themes / liveries

- 17 registered museum skins.
- 8 film themes in the Sanctuary:
  - Aero Glam
  - Couture
  - Offshore
  - Hex
  - Stay Weird
  - The Lake House
  - Sunny Side
  - Sanctuary
- 4 WYLD variants:
  - WYLD Dye
  - WYLD Tide
  - WYLD Sheer
  - WYLD Night

---

## 4. Spatial world / rooms

### Ground floor

| Room | Function | Current content | Next quality target |
|---|---|---|---|
| Queen K Hall | Canyon timeline | Speedmax generations | Strong hero lighting, clearer collection progression |
| Sanctuary | Film chapel | 8 themed bike films | Distinct card per film, stronger cinematic identity |
| Lava Night | Seasonal themed room | Halloween CFR | Retain hidden/special-event behavior |
| Kona Champions | Trophy room | 6 titles + 2015/2019 bikes | Better title-machine relationship and provenance |
| WYLD Room | Livery gallery | 4 WYLD CFR variants | **Priority redesign: gallery-grade bike display, room card, exact dimensions/theme/map data** |
| Kona by Year / Pier | Timeline | 2014–2025 + finish | Clear collection milestones / year completion |
| Secret Collection | Hidden artworld | art-themed bike directions | Keep intentionally undisclosed on first-session map |

### Upper floor

Base passage:
- Glass Stair
- Gallery Nave

Art bays:
- St. George
- Las Vegas
- Nice
- Kona

Themed rooms:
- Bio
- Horror
- Alien
- Zombie

Data-built wing 1 — **Against the Clock**
- The Hour
- Monocoque
- Long Course
- Types
- Paint Shop
- References

Data-built wing 2 — **Kona Light**
- The Queen K
- Clip-ons
- Velodrome
- The Bay
- After Dark
- Workshop & Tunnel

---

## 5. Room contract V1 — required for every public room

Every room should have a single data contract rather than identity scattered across renderer code.

Required fields:

- stable room id
- floor
- human name / short name / subtitle
- room type
- dimensions in metres
- map rectangle / doorway / entry point
- palette: floor, wall, accent, light, text
- lighting description
- decoration list
- exhibit/product ids
- hero exhibit
- room-specific card:
  - title
  - story
  - theme
  - dimensions
  - contents
  - evidence/provenance where relevant
- map metadata:
  - icon
  - color
  - exhibit count
  - hidden / discoverable state
- quality tier
- mobile LOD policy

**Goal:** renderer, map, navigation, cards and future procedural generation read the same contract.

---

## 6. WYLD Room V1 redesign

Current issue: the four bikes are technically present but their presentation reads as experimental installation rather than a coherent premium gallery.

### New composition

1. **WYLD Dye — hero**
   - central low circular plinth / mirror
   - strongest light
   - full drive-side read
   - immediate card / Studio CTA

2. **WYLD Tide — ocean wall**
   - dedicated wall bay
   - broad side presentation
   - disc-wheel treatment visible
   - Kailua view remains behind / beside rather than competing

3. **WYLD Sheer — carbon study**
   - close inspection station
   - translucent clear-coat lighting
   - neutral background to reveal weave

4. **WYLD Night — dark alcove**
   - dedicated low-light bay
   - controlled aqua edge lighting
   - no ceiling-hanging orientation as the main public presentation

Keep experimental suspended/vertical versions only as secondary room art if retained.

### Room visual language
- white gallery architecture
- pearl/stone floor
- WYLD pink/aqua as controlled accent, not everywhere
- consistent physical bike scale
- minimum circulation distance around every exhibit
- no exhibit occluding another from primary approach
- mobile camera targets stored per exhibit

---

## 7. Map V2

### Problems to solve
- Current map is structurally accurate but visually utilitarian.
- Clicking immediately teleports, so rooms have no identity before entry.
- Room theme, dimensions and contents are not visible.
- Hidden/discovered state is not represented strongly.
- Map and room renderer still duplicate some spatial knowledge.

### V2 behavior
- two-floor plan remains
- clear “you are here” state
- room icons / visual identity
- tap a room → **room card first**
- room card shows:
  - room name
  - theme
  - dimensions
  - exhibit count
  - hero content
  - short story
  - “Enter room” CTA
- discovered/undiscovered presentation
- completion marker for room collection
- current / recommended / new badges
- optional route line to selected room
- future accessibility path / shortest route
- secret rooms remain absent until discovered
- small-phone list view uses the same room contract

---

## 8. Workstreams

### A. Release / reliability
Owner goal: never sacrifice current working 3D experience for feature velocity.

- PR gates
- deterministic generated pages
- unit tests
- browser/mobile screenshot matrix
- PWA integrity
- Android smoke
- dependency audit
- secret/privacy scan
- cross-user Supabase RLS test

### B. Consumer UX
- first 5 seconds explain product
- first useful Kona info <15 s
- first collectible <60 s
- Now / Explore / Setup / Plan / Me
- second-session return state
- install prompts after meaningful value, not immediately

### C. World / rooms
- Room Contract V1
- WYLD redesign
- room-specific cards
- map V2
- convert remaining hand-built room metadata to data contracts
- later: generated walkable grid / A* / room graph

### D. Collections / retention
- Passport
- XP, streak, badges
- nine hidden finds
- Garage
- daily exhibit
- daily Kona fact
- meaningful unlocks: rooms, liveries, exploded mode, story, garage slots

### E. Product / equipment
- Bike collection
- RaceSetup
- compatibility engine
- wheels / helmet / shoe slots
- Cervélo proof → public gate
- Nike proof → public gate
- future trainers / Zwift hardware / components

### F. Content / Kona utility
- official current schedule
- Expo
- place guide
- cultural context
- course/timing handoff only from verified official sources
- pre-race and race-day states

### G. Growth / sharing
- exact deep links
- premium mobile setup card
- native Web Share API
- WhatsApp through OS share sheet
- collection milestones
- no generic social feed at MVP

### H. B2B / monetization prototype
- partner room template
- product story / tech room
- configurable branded 3D experience
- white-label event world
- affiliate layer only after approval/disclosure

---

## 9. Timeline

### Sep 30 — Beta 0 / release foundation
- merge only after release gates pass
- deploy unified shell
- verify live web/PWA
- verify Android path
- first-session + returning-session screenshot proof
- cross-user/cloud backup test
- freeze launch baseline

### Oct 1 — Rooms + collection clarity
- Room Contract V1
- WYLD Room redesign
- room-specific cards
- Map V2 foundation
- wire nine hidden finds to Passport
- collection cabinet/cards

### Oct 2 — Garage + sharing
- Garage saved builds
- exact configuration links
- share-image card
- Android/iOS Web Share proof
- WhatsApp recipient restore test

### Oct 3 — Daily return loop
- daily exhibit
- daily fact
- daily challenge
- meaningful capability unlock
- second/third-session QA

### Oct 4 — Equipment expansion
- non-Canyon bike public candidate
- Nike shoe candidate if provenance/quality gates pass
- compatibility UI
- product cards use same data contract

### Oct 5 — Engineering experience
- exploded views
- maintenance stories
- Hero / Museum / Study visible quality badges
- Tech Room template

### Oct 6 — Expo mode
- Expo promoted in Now
- freshness timestamps
- race-week actions
- offline cache regression

### Oct 7 — Kona planning
- saved places
- half-day / recovery collections
- cultural-context cards
- map overlays for useful places, separate from museum map

### Oct 8 — Shareable identity
- collection milestone shares
- setup comparisons
- room completion shares
- referral deep links

### Oct 9 — Pre-race mode
- race-eve home
- checklist
- official information shortcuts
- performance / battery / offline hardening
- no risky feature merges

### Oct 10 — Race day
- race-day Now state
- official timing/course handoff when verified
- spectator shortcuts
- post-race memory unlock

---

## 10. Post-Kona roadmap

### Phase 2 — Oct–Nov 2026
- generated room registry for all spaces
- room graph / visibility / LOD
- A* walking / accessibility route
- asset quality tiers enforced in CI
- equipment taxonomy expansion
- trainers / Zwift hardware museum
- historical running-shoe museum
- richer athlete/event exhibits

### Phase 3 — commercial prototype
- partner room builder
- brand-specific source/provenance pack
- campaign landing + room deep link
- product configurator
- analytics only with explicit privacy design
- B2B demo package / pricing

### Phase 4 — platform
- event-world template beyond Kona
- white-label deployment
- external product-intake API/MCP
- moderated creator/brand asset intake
- procedural room generation from approved contracts

---

## 11. Launch acceptance criteria

### Reliability
- no uncaught error in core flow
- deterministic generated pages green
- PWA integrity green
- Android install/launch smoke green
- 320 / 360 / 390 / 430 px primary actions unobstructed

### Privacy/security
- no tracked secret/private-data finding
- no local machine paths
- no service-role credentials in browser
- Supabase RLS cross-user test passes
- delete/export behavior matches copy

### UX
- user understands product within 5 seconds
- useful Kona information within 15 seconds
- first collection action within 60 seconds
- returning user sees progression and a reason to continue

### 3D/world
- each public room has a room contract
- each bike has stable scale/placement
- no obvious z-fighting / flicker
- no primary exhibit collision/occlusion
- map and physical world agree on room location

---

## 12. Immediate priority queue

1. Complete Beta 0 release gate and deploy.
2. Live end-to-end test: web, PWA, Android, fresh user, returning user, account A/B, restore.
3. Capture real onboarding screenshots from deployed build.
4. Implement Room Contract V1 on follow-up branch.
5. Redesign WYLD bike presentation.
6. Ship room-specific cards.
7. Ship Map V2.
8. Wire hidden-find / Passport completion.
9. Garage/share.
10. Daily loop.

This plan intentionally separates **release stabilization** from **world expansion**. New room/map work must not be allowed to destabilize the verified Beta 0 release.

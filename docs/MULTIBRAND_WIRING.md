# Multibrand bike expansion — build + wiring (this PR)

> Original design/engineering studies. Not affiliated with or endorsed by any brand named;
> no logo, wordmark or product photograph is used. Geometry comes from each brand's published
> geometry table for the model family; lateral widths and mechanisms are INFERRED (logged in each receipt).

## What this PR adds

### 23 bikes + 1 chronograph, built in Blender with the site's process
`blender/multibrand/` reuses the proven heritage modules — `skeleton.py` (geometry table →
frame skeleton), `frame_tubes.py` (zone-aware tube sweeps + voxel fuse + paint-by-zone),
`parts.py` (wheels / drivetrain / cockpit / saddle) and `lib.py` (Principled PBR materials,
sweep/lathe/kamm helpers). No new pipeline. A new `themes.py` bakes liveries (kona / wyld /
customizable / heritage / splatter / desert / moss / pearl / chrome / night) as PBR material zones.

Built set (24 assets, all `origin: multibrand-study`):
- **Trek (5):** Speed Concept "Kona", Madone "Wyld", Domane customizable, Checkpoint "Desert", 5500 OCLV "US Postal" 2004.
- **Pinarello (4):** Bolide "Kona Night", Dogma "Wyld", Bolide customizable, Dogma "Splatter".
- **Felt (3):** IA FRD "Kona", IA "Wyld Mint", IA customizable.
- **Canyon (3):** Speedmax CFR "Kona Lava", "Wyld Mint", customizable.
- **Tour de France history (8):** 1937 steel, 1972 classic, 1989 aero-era, 1999 carbon, 2013 aero+electronic, 2022 monocoque, 2027 aero study, 2027 tri study.
- **Breitling:** one original chronograph (case, bezel, dial, hands, bracelet), gate G9 legal study.

### Canonical wiring (no hand-edited products.json)
`museum/multibrand/bikes.json` is the single source. `tools/build_catalog.mjs` now ingests it:
```
museum/multibrand/bikes.json → build_catalog.mjs → museum/catalog/products.json
```
Every product gets a real GLB path, a provenance fact and `where[]` resolved from `museum/world/rooms.json`.

### Six rooms (data descriptors; the engine builds them)
`museum/world/brand_rooms.json` + `museum/world/rooms.json` now carry:
- **Trek · Speed** (4 bikes) — basalt floor, clinical accent.
- **Pinarello · Italian Speed** (4 bikes) — marble, editorial hero spacing.
- **Felt · Aero Lab** (3 bikes) — blue accent, technical.
- **Machines of the Tour** (8 bikes) — chronological timeline, travertine.
- **Canyon · Speed Studio** (3 bikes) — the flagship's themed liveries.
- **Breitling · Endurance Pro** (1 chronograph) — dark gallery.

All rooms use collision-free bounds (side wings |x|≥8.5 / far z) and pass `web/test/brandroom.test.mjs`.

### Mobile / web separation (already the engine's contract)
`web/src/landing.js` computes `lite = renderSettings(...).lite` from coarse-pointer detection and
passes it to `buildBrandRoom(desc, { lite })`. All new rooms inherit it for free — accent lights
skip, fill dims, light pools dim on phones. Each bike also ships a low-tri `bike_lite.glb`
(meshopt, ~0.36 MB) alongside the full `bike_web.glb` (~0.91 MB) so a future product record can
switch asset by `lite` (the loader already accepts whichever path the descriptor points at).

## Quality gates (all green locally)
- `web/test/brandroom.test.mjs` — 7 rooms, bounds + stations valid, no overlaps. **3/3 pass.**
- `node tools/build_catalog.mjs` — 76 products, 24 multibrand, all placed with `where[]`, no missing GLB.
- `node --test web/test/*.test.mjs` — **106/106** pass (no regressions).
- Build receipts in `assets/multibrand/receipts.json` (tris, stack/reach, wheelbase, GLB sizes).

## Rebuild
```bash
# all bikes (.blend + raw GLB)
blender -b --factory-startup -P blender/multibrand/build.py -- all assets/multibrand --tris 140000
# meshopt web + mobile-lite GLBs
node tools/optimize_multibrand.mjs
# chronograph
blender -b --factory-startup -P blender/multibrand/watch.py -- assets/multibrand/breitling-watch
# catalog
node tools/build_catalog.mjs
```

## Not done here (follow-ups)
- Photo-traced `heritage/…/profile.json` adapters per brand for higher fidelity (same as the Canyon heritage bikes).
- The `walk-rooms` browser harness is tuned to the upper-floor gallery; brand-room visual smoke needs a landing-page drive and is left for the visual-evidence pass before merge.

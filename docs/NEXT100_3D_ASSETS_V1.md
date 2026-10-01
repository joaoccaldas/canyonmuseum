# Next 100 3D Assets V1

## Safety / integration rule

This batch is deliberately additive and **unwired**. Existing production assets, room descriptors, catalogue entries, URLs, service-worker hashes and app manifests are untouched. The generated models live under assets/3d/generated/next100/. Promotion into the live museum requires the normal asset-intake gates.

The canonical source list is tools/next100_asset_catalog.py. CI materializes museum/assets/next100-v1.json, the GLBs and museum/assets/registry-next100-v1.json deterministically.

## Why this batch

The existing estate is bike-heavy and spread across production catalogue, candidate intake, brand rooms, art, relics and historical asset trees. The next batch intentionally fills missing physical layers: footwear, helmets, race clothing, medals, race-day artifacts and small equipment, while adding only materially distinct bike studies.

## Mix

| Category | Count | Primary use |
| --- | ---: | --- |
| Bikes | 20 | Against the Clock, Kona Champions, Secret Collection |
| Shoes | 20 | Run-leg engineering, brand-room/studio candidates |
| Helmets | 12 | Aero engineering + Race Setup |
| Trisuits | 12 | Athlete identity + Champions mannequins |
| Medals | 12 | Kona-by-Year / race-memory collectibles |
| Rare artifacts | 12 | Pier, Secret Collection, engineering tunnel, bays |
| Gear | 12 | Swim/bike/run setup + engineering displays |
| **Total** | **100** | |

## Rendering budget

Each generated asset must pass:

- <= 350 KB GLB target
- <= 12,000 triangles
- total 100-asset payload <= 20 MB
- no textures required for first pass; geometry/material colors carry silhouette
- progressive/deferred loading only when eventually wired
- semantic-part metadata retained for future customization/explode views

Local validation of the same generator produced 100/100 valid GLBs, ~2.61 MB total, <= ~69 KB per object and <= 3,380 triangles per object.

## Representation policy

These are **geometry studies**, not CAD-accurate replicas. Brand/model naming is used only as a research/curation target. Promotion to a public branded room requires source records, visual calibration and legal/provenance review. Original race artifacts and medals are explicitly studies/original commemorative objects, not claims of exact historical replicas.

## Room gap coverage

- kona / Kona Champions: modern superbikes, trisuits, watches and race objects.
- pier / Kona by Year: medal eras, bibs and human-scale race memories.
- atlas-against-the-clock-tri: missing non-Canyon tri-bike generations, wheels and saddles.
- atlas-against-the-clock-mono: unusual beam/monocoque machines.
- atlas-kona-light-clipon: early tri-bike + cockpit evolution.
- atlas-kona-light-tunnel: helmets, hydration, materials, fork prototypes and engineering parts.
- atlas-kona-light-bay: swim gear and water-course objects.
- secret: rare beam bike + hidden technical artifacts.
- bay-st-george, bay-nice, bay-kona: medals/place-specific collectibles to make the currently sparse destination bays feel inhabited.

## Promotion sequence

1. Generate + validate all 100 in isolation.
2. Visually QA silhouettes and material scale.
3. Add provenance/source records for branded studies.
4. Promote selected objects into the canonical product/artifact registry.
5. Wire only a small room batch at a time and measure mobile frame time/memory.
6. Keep the remaining assets available for Studio/collection/deferred room streaming.

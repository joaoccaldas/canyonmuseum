# Canyon Museum — 3D Asset Inventory & Roadmap

Updated: 2026-09-30  
Branch: `assets/kona-environment-pack-20260930`

## Rule

Do not create a new asset if an equivalent reusable asset already exists.

Every asset must strengthen at least one product loop:

- Explore
- Collect
- Customize
- Share

Every branded asset must also carry provenance and an evidence class. A model is never described as CAD-exact unless it has passed a measured reference-overlay validation.

## Current reusable assets already in the repository

### Canyon / Kona bike GLBs

Catalog: `museum/catalog/canyon-assets.json`

- Speedmax Three 2005
- SpeedMax 3.0 / 2007-era
- Speedmax AL 9.0 / 2011-era
- Speedmax CF 9.0 Pro / 2011-era
- Speedmax CFR current museum model
- Speedmax CF SLX current museum model
- Kona CFR 2019 geometry study
- Kona CF SLX 2015 geometry study

### Existing non-Canyon Atlas bike assets

Build report: `assets/atlas/build-report.json`

21 GLBs are already generated, including:
- Eddy Merckx Hour bike
- Graeme Obree study
- Lotus 108
- Zipp 2001
- Stevens triathlon bike
- aluminium triathlon bike
- funny-bike study
- pursuit-bike study
- disc-brake superbike study
- aerobar / low-pro / hour / draft-legal studies
- studio concept bikes

### Existing Trek assets

Do not replicate.

The repository already includes:
- Trek Equinox 9 MY2004
- Trek Speed Concept SLR 9 AXS MY2027

These should be reused in any Trek wing or Kona timeline until a measured historical variant creates a genuine content need.

### Existing art / sculpture assets

Catalog: `museum/art/sculptures.json`

- The Tuck
- Basalt airfoil
- Sea-glass wave

All are optimized GLBs with Higgsfield source records.

### Existing procedural immersive-art pack

Generator: `blender/artworld_assets.py`

Includes:
- St. George layered canyon sculpture
- Las Vegas prism installation
- Nice ribbon installation
- Kona obsidian/lava installation
- Eclipse portal
- horror arch
- horror totem
- carnival installation

### Existing paintings

12 generated paintings are tracked through:
`museum/sources/higgsfield/paintings-20260929.json`

## Created in this asset sprint

Generator:
`blender/kona_heritage_nike_assets.py`

Manifest:
`museum/catalog/kona-heritage-nike-assets.json`

### Missing major Kona bike families now represented as reusable 3D geometry studies

P0:
- Cervelo P5/P5X family
- Specialized S-Works Shiv Disc
- Felt IA
- Scott Plasma

P1:
- BMC Speedmachine
- Orbea Ordu

Trek is intentionally omitted and reused from existing assets.

### Nike Running museum assets

P0:
- Nike Zoom Vaporfly 4% study
- Nike Vaporfly NEXT% study
- Nike Alphafly NEXT% study
- Nike Alphafly 3 study

Each shoe is built as semantic parts:
- outsole
- ZoomX-like midsole volume
- upper
- heel
- carbon plate
- Air Zoom units where relevant

Brand/logo decal artwork is intentionally separate from geometry.

## Short-term assets: next 1–2 releases

### P0 — Kona history credibility

Build only after model/year source binding:

- Scott Plasma 3 / Sebastian Kienle 2014 exhibit variant
- Cervelo P5 / Frederik Van Lierde 2013 exhibit variant
- Orbea Ordu / Craig Alexander 2008–2009 exhibit variant
- Specialized Kona winner lineage variant(s)
- Kuota Kalibur / Normann Stadler 2004–2006
- Cannondale Kona lineage variants
- Cheetah historical women's Kona platform
- Felt IA / Daniela Ryf-specific validated variants

Purpose: a credible visual Kona timeline, not a generic brand showroom.

### P0 — Nike room precision

Upgrade the current shoe studies using official side/top/bottom references:

- measured outsole silhouette
- midsole rocker
- stack / forefoot proportions
- upper volume
- Air Zoom placement
- Flyplate cross-section visualization
- exploded-view option

Purpose: turn the Nike room into an engineering story, not a shoe carousel.

### P0 — Kona environment kit

Reusable environment assets:

- black lava field tiles
- Queen K asphalt / road-edge modules
- Kailua Bay water + shoreline modules
- pier / transition-rack kit
- basalt plinths and vitrines
- race-signage mounting system
- palm / dry-grass low-poly vegetation kit
- volcanic stone / plaster / brushed-metal / glass material library

Purpose: reduce repeated bespoke room modeling and make Kona scenes immediately recognizable.

### P1 — equipment vertical

First equipment category after bikes: helmets.

Start with reusable archetypes before brand-specific exact models:
- long-tail TT helmet
- short-tail aero helmet
- visor shell
- vented road-aero helmet
- helmet stand / display rig

Purpose: prove the collection model works beyond bikes and shoes.

## Medium-term assets

### Bike platform

Add brands only when the data/asset abstraction is proven:

- Cervelo wing
- Specialized wing
- Trek wing using existing assets first
- Felt wing
- Scott wing
- BMC wing
- Orbea wing
- historical/iconic wing

Each wing should reuse:
- room kit
- plinth kit
- light rig
- collection card
- interaction contract

### Equipment universe

Reusable 3D categories:
- wheels
- helmets
- shoes
- trisuits
- aerobars
- saddles
- groupsets
- hydration
- race artifacts

### Kona destination / trip-planner layer

Reusable place assets should be scene modules, not standalone apps:
- Kailua Pier
- Ali'i Drive
- Queen Ka'ahumanu Highway
- Energy Lab
- Hawi turnaround area
- volcanic coast
- beaches / bays
- historic/cultural interpretation rooms

The trip-planner layer must distinguish:
- race history
- Hawaiian history/culture
- geography / nature
- visitor logistics

## Quality gates before an asset becomes public

1. No duplicate asset exists.
2. Provenance is recorded.
3. Evidence class is explicit.
4. Geometry passes silhouette/reference checks.
5. GLB validates.
6. Mobile size budget passes.
7. Material count and draw calls are bounded.
8. No private data exists in model metadata.
9. Trademark decals are separate from geometry.
10. Asset can be used by more than one room or experience unless it is a historically unique exhibit.

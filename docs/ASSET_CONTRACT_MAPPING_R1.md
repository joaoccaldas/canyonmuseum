# Canyon Museum → Unified Asset Contract Mapping R1

Status: research-only branch.

## Role
Canyon Museum remains the provenance and product-asset authority/factory. It should not become a second consumer runtime.

## Goal
Map existing bike/product truth onto a portable asset contract without forking identity.

## Required mapping
For each canonical product asset, map existing fields to:
- canonical asset/product ID;
- brand/model/year/variant;
- source geometry;
- physical scale and orientation;
- material slots;
- component/part map;
- LOD2/LOD1/LOD0/HERO representations;
- collision/inspection anchors;
- Meshopt/KTX2 requirements;
- provenance;
- rights;
- claim confidence;
- mobile/desktop/HERO budgets.

## Principle
Quality tier changes representation, not identity.

## Validation target
One Canyon bike should be consumable by:
- Museum display;
- KONA room;
- Garage/product inspection;
- future Studio-Kona riding world;
- future aero/wind-tunnel experiment,

without duplicating product truth.

## Anti-goals
- no new renderer;
- no separate product catalog;
- no local exploded-view authority;
- no duplicate runtime asset identity.
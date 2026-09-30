# Batch 3 Evidence Record — 2026-09-30

Branch: `refactor/shell-brand-batch3-20260930`
PR: #104

Generated-output head before this evidence commit: `0c3fb7a9b5fceb3517a6c7ca0ce7d639629dbdc4`

## Scope

### Shell modularity
- Home extracted to `web/src/ui/home.js`
- Discover extracted to `web/src/ui/discover.js`
- Plan extracted to `web/src/ui/plan.js`
- shared surface formatting moved to `web/src/ui/surface-utils.js`
- `kona-shell.js` retains navigation, panel, Garage and account orchestration

### Brand convergence
- V9 palette promoted into canonical `brand/tokens.css` and `brand/themes.css`
- component/layout styling remains in `web/styles/system.css`
- no second palette source was introduced
- five-destination navigation remains Home / Discover / Garage / Plan / Me
- EN and pt-BR shell labels/copy are owned by `web/src/i18n.js`
- Garage remains a first-class shell destination; Studio is optional product configuration depth

### 2D-first behavior
- Home, Discover and Plan consume lightweight entry/event/place data before the museum bundle
- Discover shows Kona places even when museum room globals are not loaded
- explicit 3D entry remains user initiated

### Mobile camera
- touch defaults to bounded elevated-follow
- desktop retains first-person behavior
- production `web/src/landing.js` consumes the camera policy
- overview remains a supported camera mode

## Source evidence before generated sync
- P0 browser journey: PASS
- entry-only data → identity → reveal → Home → reload + magic-link request
- zero heavy 3D/catalog requests before explicit 3D entry
- unit/source contracts passed after stale literal-string contracts were replaced with semantic bilingual/module-aware assertions
- the only final pre-sync Museum-check difference was generated `app/hall.js`

## Generated output evidence
Deterministic sync run `36726082789`: PASS.

It produced `0c3fb7a9b5fceb3517a6c7ca0ce7d639629dbdc4`, updating the generated hall bundle and sealed PWA hashes.

## Verification rule
This documentation-only commit exists to trigger App release seal, Integration contract, Museum checks and Visual Evidence V2 on the exact post-sync code. Batch 3 is not considered verified until those gates pass and the resulting mobile screenshots are inspected.

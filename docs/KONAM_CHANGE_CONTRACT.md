# Kona.m Change Contract

## Change

- Date: 2026-10-02
- PR: stacked pre-migration dedupe/refactor PR
- Purpose: remove two low-risk duplication classes before repository migration while preserving behavior: direct legacy Finds persistence and repeated consumer UI HTML-escape helpers.

## Before

- Runtime behavior: shoreline Finds read/write `speedmax.finds.v1` directly; ten core consumer UI modules define their own byte-equivalent `esc` helper.
- User flow: unchanged KONA shell and museum flows.
- State/persistence: `storage.js` already defines canonical `kona.finds.v1` with legacy `speedmax.finds.v1` compatibility, but `finds.js` bypasses it.
- Dependencies: unchanged.
- Security/privacy: canonical `engine/dom.js` escape helper exists, but multiple UI copies can drift.
- Performance: no known meaningful impact.
- Release/deployment: unchanged.

## After

- Runtime behavior: shoreline Finds use `readStorage('finds')` / `writeStorage('finds')`; legacy values are read and copied to canonical storage by the existing adapter.
- User flow: intentionally unchanged.
- State/persistence: reads remain backward-compatible; new Finds writes target only `kona.finds.v1`; legacy key is preserved on read rather than destructively removed.
- Dependencies: unchanged.
- Security/privacy: core consumer UI modules import one canonical `esc` implementation from `engine/dom.js`.
- Performance: effectively neutral.
- Release/deployment: unchanged.

## Invariants that must not regress

- Guest path remains usable.
- Existing `speedmax.finds.v1` data remains readable.
- Reading legacy Finds state does not delete the old key.
- New Finds writes use only the canonical Kona namespace.
- Canonical internal routes remain `home`, `discover`, `garage`, `plan`, `me`.
- No new direct `speedmax.*` storage keys.
- No new secret/private data exposure.
- No new `eval()` or `document.write`.
- Dependency graph unchanged.
- Generated output remains builder-owned.

## Risks

- User-visible: low; accidental syntax/import error could break a surface.
- Data: low-medium; incorrect storage adapter usage could hide existing Finds.
- Security/privacy: low; helper consolidation improves single-authority escaping.
- Rendering/mobile: low; no layout/Three.js/CSS change.
- Deployment: low.
- Third-party/dependency: none.

## Rollback

Revert this stacked PR only. Parent Kona.m world-foundation PR remains independent and does not require these runtime refactors.

## Verification

- Unit: new tests cover legacy Finds read/migration, canonical write, shared escape imports and source-level removal of direct Finds legacy key.
- Repository hygiene: must pass.
- Secret/private-data scan: must pass.
- Dependency audit: unchanged graph, standard release-security workflow must pass.
- Integration: standard integration contract must pass.
- P0 journey: standard Museum checks must pass.
- UI interaction: standard interaction matrix must pass.
- Visual: no intended visual delta; standard visual evidence if triggered.
- World contract: inherited from parent branch and must remain green.
- Physical Android/iPhone: no native/rendering change; existing physical-device launch gate remains separate.
- Post-deploy exact-SHA smoke: not applicable until merged/deployed.

## Result

- Before/after comparison: expected runtime source delta only in Finds persistence adapter and UI escape imports.
- Known differences: direct legacy Finds reference count decreases; duplicated UI escape helper count decreases.
- Known unchanged areas: navigation, visuals, dependencies, Three.js world, database, service worker, auth, native identity.
- Remaining blockers: CI evidence must be green before merge.

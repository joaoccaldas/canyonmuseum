# Kona.m Pre-Migration Quality Review V2

Date: 2026-10-02  
Scope: current Canyon Museum / KONA source before repository migration.

## Executive assessment

The codebase is mature enough to migrate, but the next quality gains should come from **reducing ambiguity of ownership**, not from a broad rewrite.

The most important rule for M0 remains:

> Preserve behavior and release discipline first. Refactor after equivalence is proven.

A failed-but-useful stacked experiment (#160) reinforced this. Two small source refactors passed the semantic before/after comparison, integration contract and app seal, but the release system rejected the branch because deterministic generated bundles were stale. That is the correct behavior. The lesson is not to weaken the gate; it is to treat source→generated coupling as part of the architecture.

## Major structural risks

### 1. Multiple progression/state authorities

The repository still carries:
- legacy Museum Passport state and badge/level logic;
- canonical generated Progression state;
- GameState snapshots containing both passport-style progression and `progression_engine`.

Risk: semantic drift during migration, duplicate reward logic and ambiguous ownership.

Decision: preserve compatibility in M0. Design an explicit adapter. Make canonical Progression the single future write authority only after migration equivalence is proven.

### 2. Multiple collectible concepts

Legacy shoreline Finds, generated Finds/Relics and the future Founding 141 are separate concepts today.

Risk: one physical click could update one ledger while another screen reads a different ledger.

Decision: scene objects should eventually emit acquisition events against stable collectible IDs; Progression/collection state owns truth.

### 3. Deployment identity is duplicated

The current Canyon GitHub Pages origin appears in runtime update logic, build hardening, RSS, schema IDs, robots/sitemap/LLM metadata and generated HTML.

Risk: a partial rename can create a visually healthy application with broken updates, canonical links, schema identifiers or feeds.

Decision: M1 should introduce one source-owned site/origin metadata authority and regenerate every derived surface. Never global-search-and-replace generated output.

### 4. Native identity is still legacy

Current Android package ID remains `com.caldasstudio.speedmaxmuseum`.

Decision: do not change inside M0. Choose Kona.m's durable package identity before stable signing/public native distribution.

## Large-module review

### `web/src/landing.js`
~147.6 kB source / ~1,950 lines.

It remains the largest consumer/world orchestration risk. It mixes legacy hand-built spaces, walking/routing, interaction and lifecycle glue.

Do not decompose during M0.

Post-M0 extraction order:
1. room construction;
2. world navigation / walking;
3. interaction and selection;
4. card/presentation wiring;
5. room lifecycle / visibility;
6. legacy compatibility.

Each extraction must prove the same browser journeys and visual states before/after.

### `web/src/main.js`
~52 kB / ~835 lines.

This is a second significant monolith, centered on the older engineering viewer. It includes rendering, workshop/lab/paint, environment presets, interaction and configuration behavior.

Decision: preserve as a historical/engineering runtime for M0. After migration decide whether it becomes a reusable product-viewer engine or remains a Canyon-specific exhibit runtime. Do not merge it mechanically with the Kona world engine.

### `web/src/studio/main.js`
~30 kB / ~370 lines.

Studio is healthier architecturally than the older viewer because it already imports shared skin/profile/share/access/state contracts. It still combines product selection, stage lifecycle, setup, sharing and UI orchestration.

Post-M0: split stage/controller from product/setup/share UI only if evidence shows maintenance friction. Avoid architecture for architecture's sake.

### `web/src/ui/avatar-home.js` + `web/styles/race-self.css`

User Studio is becoming a second app inside the app: stage loading, avatar editor, focus handling, destinations, sharing, races, feed/travel and settings.

Risk: repeat of `landing.js` growth.

Post-M0 target seams:
- studio shell;
- stage controller;
- avatar editor;
- destinations;
- share drawer.

Keep one route and one state authority.

## CSS / styling assessment

Measured high-risk files include:
- `web/styles/system.css`: ~38.4 kB / 407 lines;
- `web/styles/entry.css`: ~30.0 kB / 287 lines;
- `web/styles/hall-mobile.css`: ~16.4 kB / 254 lines;
- `web/styles/race-self.css`: ~15.8 kB / 155 lines;
- `web/styles/studio.css`: ~15.4 kB / 148 lines.

The most visible cascade-debt signal is `hall-mobile.css`, with roughly **108 `!important` declarations**. This is not automatically broken: the file is explicitly a compatibility/phone override layer over old hall CSS. But it means the hall's mobile presentation is expensive to reason about and should not become Kona.m's general styling pattern.

By contrast:
- `brand/tokens.css` is a good semantic token authority;
- `brand/typography.css` is small and role-based;
- `web/styles/components.css` is a good start for canonical controls/layout primitives;
- `shell-mobile.css` is comparatively bounded.

### CSS migration rule

Do not "clean up" the cascade during M0.

After M0:
1. generate selector ownership/conflict evidence;
2. choose one owner for each shared shell/component selector;
3. move only repeated primitives into `components.css`;
4. keep room/stage geometry local;
5. reduce `!important` only when visual evidence proves the same behavior on phone portrait, phone landscape, desktop and desktop-view-phone modes.

A new automated CSS audit now reports:
- file size;
- `!important` count;
- media-query count;
- custom-property definitions;
- exact selectors defined across multiple files;
- same selector/property with conflicting values;
- global rules inside feature CSS;
- ownership of critical shell selectors.

## Rendering / WebGL assessment

There is no single renderer architecture yet. There are several purpose-built renderers:
- main museum/world;
- Studio;
- User Studio avatar stage;
- collectible stage;
- admin preview;
- heritage viewers;
- standalone experiences;
- older engineering viewer.

That is acceptable if lifecycle and performance rules are consistent.

### Strong patterns already present

**User Studio stage**
- low-power preference;
- DPR capped around 1.5;
- ResizeObserver;
- hidden/settings guard;
- explicit disposal;
- context loss on teardown.

This is close to the desired embedded-renderer standard.

**Studio**
- ResizeObserver;
- hidden/settings pause;
- profile-controlled quality/shadow/DPR policy.

**Landing/world**
- explicitly skips expensive work when document is hidden or the 2D panel/settings cover the world.

**Admin previews**
- reuse one renderer rather than creating dozens of WebGL contexts;
- fixed DPR 1;
- lazy IntersectionObserver behavior;
- dispose each temporary model.

These are good patterns to preserve.

### Inconsistencies

**Collectible stage**
- low-power;
- DPR capped;
- explicit disposal;
- but its animation loop has no explicit `document.hidden` guard.

**Hall / Heritage standalone viewers**
- continuous animation loops;
- no explicit hidden-tab guard detected.

**Standalone experience engine**
- high-performance renderer;
- continuous animation loop;
- no explicit hidden guard;
- no component-style dispose lifecycle because it is currently page-lifetime scoped.

These are not P0 migration blockers, because browser scheduling and page lifetime mitigate some cost. They are nevertheless inconsistent with the better newer lifecycle pattern.

### Rendering standard for Kona.m

Embedded renderer:
1. lazy-load only after intent;
2. DPR cap;
3. low-power preference unless evidence requires high-performance;
4. pause/no-op while hidden or occluded;
5. explicit resize lifecycle;
6. explicit controls/material/geometry/texture/renderer cleanup;
7. context release for repeatedly mounted views where safe.

Persistent world:
1. device/profile quality policy;
2. pause under 2D surfaces and background tabs;
3. no duplicate full-resolution model clones;
4. LOD/culling/visibility policy;
5. draw-call/triangle/memory evidence on representative physical phones;
6. thermal/session-duration testing before declaring mobile certification.

## Bundle-size review

The known-good build around this audit reports approximately:
- KONA core: 221 kB;
- Race Self stage: 665 kB;
- collectible stage: 650 kB;
- admin preview: 628 kB;
- museum data: 155 kB;
- hall: 952 kB;
- Studio: 785 kB;
- Experiences: 799 kB.

These are deploy bundle sizes, not equivalent to transfer or parse cost, but they are useful regression sentinels.

The audit branch adds modest headroom budgets. A future PR exceeding them must explain the increase rather than silently raising the threshold.

## CI / dependency quality

The dependency surface is intentionally small, which is a strength.

One avoidable inconsistency remains: workflows use different explicit Node majors, including Node 20 and Node 22.

Decision:
- do not change CI runtime and dependencies inside M0;
- after migration converge to one supported Node major unless a documented tool constraint requires otherwise.

Recent GitHub logs also warn that older action runtime internals are being forced forward by the runner. This is another reason to audit action versions after migration rather than freezing assumptions indefinitely.

## Past mistakes / patterns to stop repeating

1. **Treating a source edit as complete before generated outputs are synchronized.**
   The #160 experiment proved the gate catches this. Keep that gate.

2. **Letting new features create a new state authority.**
   Passport, progression, Finds, RaceIdentity and collection logic grew at different times. New Kona.m features must project over canonical state rather than invent another store.

3. **Solving responsive problems with increasingly local overrides.**
   The hall mobile cascade works, but its `!important` density shows the cost. Future Kona.m shell/UI should solve layout in shared primitives first.

4. **Building large orchestration files because the product was moving quickly.**
   `landing.js`, `main.js` and now User Studio show the same gravity. New work should have explicit module ownership before it reaches similar size.

5. **Duplicating deployment identity in runtime and generated files.**
   Kona.m migration must make origin/name metadata source-driven.

6. **Assuming emulator/browser evidence equals physical-device proof.**
   It does not. Physical Android and iPhone acceptance remain separate gates.

## Added automated audits

This branch adds read-only evidence tools:
- `tools/audit_konam_code.mjs`
- `tools/audit_konam_css.mjs`
- `tools/audit_konam_rendering.mjs`
- `tools/audit_konam_ci.mjs`
- `tools/audit_konam_budgets.mjs`

and a dedicated CI workflow that uploads their JSON reports.

No consumer source, dependencies, generated bundle, state schema or visual runtime is changed by this branch.

## Migration recommendation

When the new `konam` repository exists:

### M0
Copy history/source behavior and exact release machinery.

### M0 acceptance
- same generated build;
- same dependencies;
- same route IDs;
- same state readability;
- same P0/browser interactions;
- same security gates;
- same visuals;
- same bundle-size class;
- physical-device proof retained as a separate unresolved/verified fact, never inferred.

### M1
Centralize product/origin/package metadata and perform the deliberate Kona.m rename with redirects/compatibility.

### M2+
Begin state consolidation, room-engine convergence, CSS ownership cleanup and renderer lifecycle convergence one bounded subsystem at a time.

The target is not "clean code" in the abstract. It is a codebase where **each fact, state, selector, renderer and generated artifact has one obvious owner**.

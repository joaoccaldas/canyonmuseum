# KONA: later PRs and ideas

Preserve useful proposals without expanding today's stabilization release. Every PR needs behavioral evidence and a frozen artifact.

| Order | Separate PR | Acceptance |
|---|---|---|
| 1 | Auth lifecycle and reproducible backend | Live delivery/callback, expired link, refresh, sign-out, two-account isolation, backup/restore, disposable full schema/RLS baseline and account deletion/retention scope |
| 2 | Reward materialization and evolution | Every advertised reward has a usable visual/item; persisted idempotent collections/spending; no reward for affiliate clicks or share taps |
| 3 | Return journey | Optional questions, useful next action, fresh discoveries and accessible nudges; retain fast entry/local use |
| 4 | Resource/navigation lifecycle | Cancel stale work; first-failure retry; coherent old-tab/new-release handling; no reload during editing |
| 5 | World performance/accessibility | Minimum-device frame/thermal evidence, room visibility budgets, stable memory, reduced motion, focus and keyboard paths |
| 6 | Native distribution | Validated staged assets, signed artifact, emulator and physical offline/update checks; no APK advertised before publication |
| 7 | CSS/build delivery | Measure bundling against actual first-paint/network cost; keep one source owner and route isolation |
| 8 | Explicit lifecycle states | Consolidate initialization/loading/ready/world transitions where races justify it; avoid a framework rewrite under launch pressure |
| 9 | More rooms/brands/assets | Current schemas, provenance, capacity/layout checks, finite transforms and asset budgets; integrate overlapping branches individually |
| 10 | Social visuals/comparison | Exportable identity/collectible visuals, honest missing facts, receiver journey and cancellation tests |
| 11 | Companion services | Supported in-app travel providers, wider feeds, preference sync, bounded cache/request/abuse budgets |
| 12 | Repository consolidation | Archive stale handovers; retire duplicate output after consumers migrate; controlled raw reference storage with hashes |

## Architecture review disposition

Useful points: explicit state ownership, bounded public data access, brand authority and deterministic delivery. Current external viewport ownership, scoped styles and database ownership controls already cover part of the review. Platform-specific install metadata can remain where needed. A public publishable key is expected. A service worker is not a suitable nonce factory. Do not replace a functioning install controller solely to reduce DOM nodes. Measure CSS bundling before adding a dependency.

Do not merge older styling branches wholesale. Rebase one final candidate, build/seal it and require all checks on its exact commit. Content expansion follows dependable core flows.

## Designer review disposition

Apply now: entry-owned shortcut visibility, readable hero captions, 48px controls, mobile sign-in parity, narrow-phone/tablet checks, no stale navigation, catalog-based lightweight preview rotation and anonymous secret silhouettes.

Retain the existing typography and palette. Heuristic scores are opinions, not proof of contrast or accessibility compliance. The reviewed entry stylesheet name is retired; edit the current owner. Do not add a second stylesheet or hide overflow to conceal oversized controls. Broad accessibility certification, richer collection artwork, progression reward materialization and further visual polish require separate evidence-driven PRs.

The subsequent critical review correctly requires a visible Me tab and unclipped Collection controls. Current consumer styles already define five bounded navigation columns; the fix removes native borders and tests every tab’s rectangle. Collection receives its own wrapping header/control layout. The preview error handler uses a truthful silhouette and unavailable status. A generic alternate bike image would misrepresent the selected product. Performance hitch estimates and full accessibility grades require recorded device measurements; they are not release certificates. Raw reference captures are excluded from public staging and remain cleanup candidates pending dependency/provenance review.

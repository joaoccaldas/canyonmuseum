# KONA architecture

Static HTML boots a lightweight browser app. Personal and museum 3D loads after user intent. Extend the existing modules and pipeline.

| Responsibility | Authority |
|---|---|
| Entry/resource lifecycle | `web/src/entry.js`; failed script/style loads can retry |
| Routes/feature styles | `web/src/ui/kona-shell.js` |
| First-paint viewport | `web/src/viewport.js` → `app/viewport.js` |
| Brand/shared controls | `brand/*`, `system.css`, `components.css` |
| Feature presentation | One route stylesheet; world styles disabled outside the museum |
| Storage/migration | `web/src/engine/storage.js` |
| Compatible Passport | `web/src/engine/passport-state.js` |
| Rewards and levels | `web/src/engine/progression.js` |
| Cloud snapshot/rollback | `web/src/engine/game-state.js` |
| Equipment/identity | `web/src/engine/identity.js`; explicit setup saves only |
| Facts/representations | Canonical catalog and public projection |
| Rendering | Existing world, room, framing, paint and asset modules |
| Build | `tools/build_pages.mjs` |
| Release integrity | `tools/build_app.mjs` |
| Public artifact | `tools/stage_site.sh` and reference validation |

## Persistence

Opening Studio or a shared preview must not write personal equipment. Explicit saves preserve goals, unrelated gear and relationships. Passport normalization accepts both historical v1 shapes and preserves discoveries, stamps, badges, XP, visits and pose.

## Generated output

Static hosting currently requires committed generated HTML, bundles, projections and worker hashes. Edit their source authorities and rebuild. `web/dist` is a compatibility projection, not an independent authoring tree. The staging allowlist defines public delivery.

Full route cancellation, update atomicity, renderer budgets, resource disposal and complete backend reconstruction remain separate, verified changes in [later PRs](launch/LATER_PRS.md).

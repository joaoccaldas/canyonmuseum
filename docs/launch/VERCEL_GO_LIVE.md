# Vercel go-live gate

Active release candidate: PR #135 / `refactor/user-studio-feed-travel-20261001`.

This file binds deployment verification to the actual PR head. Do not hard-code a historical candidate SHA here: the release SHA is the current PR head and every required workflow must report that exact SHA.

## Verified source contracts

- User Studio has one persistent escape control and routes through the canonical `enterApp('me')` path.
- Standalone Bike Studio returns through `index.html?view=me`.
- Vercel static delivery keeps `index.html`, `manifest.webmanifest`, and `sw.js` revalidating.
- No catch-all Vercel rewrite shadows static assets.
- Deterministic rebuilds must leave committed generated outputs unchanged.

## Deployment shape

KONA is deployed as a static site from the repository root.

Vercel project settings:
- Framework preset: Other
- Root directory: `.`
- Build command: none
- Output directory override: none

The production hostname must be present in the Supabase Auth redirect allow-list before magic-link sign-in is treated as production-verified.

## Release rule

Do not declare production ready unless unit/asset/brand/P0, security, integration, app release seal, deterministic output verification, Visual Evidence V2 and UI interaction evidence are green on the same final PR-head SHA.

After merge/deploy, verify the production receipt and sealed file hashes against that SHA. Physical iPhone/Android install remains a separate device gate and must not be inferred from emulation.

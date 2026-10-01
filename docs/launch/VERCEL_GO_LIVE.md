# Vercel go-live gate

Release candidate: PR #132 / `refactor/rc8-go-live-final-20261001`.

This file exists to bind the final release checks to the post-generated-output tree.

## Verified source contracts

- User Studio has one persistent escape control and routes through the canonical `enterApp('me')` path.
- Standalone Bike Studio returns through `index.html?view=me`.
- Vercel static delivery keeps `index.html`, `manifest.webmanifest`, and `sw.js` revalidating.
- No catch-all Vercel rewrite shadows static assets.

## Deployment shape

KONA is deployed as a static site from the repository root.

Vercel project settings:
- Framework preset: Other
- Root directory: `.`
- Build command: none
- Output directory override: none

The first Vercel hostname must be added to the Supabase Auth redirect allow-list before magic-link sign-in is treated as production-verified.

## Release rule

Do not declare production ready unless unit/asset/brand/P0, security, integration, app release seal, deterministic output sync, and Visual Evidence V2 are green on the same final SHA. Physical mobile install remains a device gate.

## Post-sync verification trigger

Deterministic outputs were synchronized at `16646d22e56f75c8e22ce03f2eeb078b1c2c180f`. This documentation-only commit intentionally triggers the final release matrix on the sealed output tree without changing runtime source or generated assets.

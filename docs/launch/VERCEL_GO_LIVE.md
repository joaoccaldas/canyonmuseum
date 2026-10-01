# Vercel go-live gate

Release candidate: PR #135 / `refactor/user-studio-feed-travel-20261001`.

This file binds release claims to the actual launch branch and its final immutable PR head. Do not copy a candidate SHA into this document as a durable truth: the release SHA is the PR head that passes the complete certification matrix and is then verified in production.

## Verified source contracts

- User Studio has one persistent escape control and routes through the canonical `enterApp('me')` path.
- Standalone Bike Studio returns through `index.html?view=me`.
- Static delivery keeps `index.html`, `manifest.webmanifest`, and `sw.js` revalidating.
- No catch-all Vercel rewrite shadows static assets.
- Generated app/pages are rebuilt in CI and the committed deterministic outputs must remain unchanged.

## Intended Vercel deployment shape

KONA is a static site rooted at the repository root.

Expected Vercel project settings:
- Framework preset: Other
- Root directory: `.`
- Build command: none
- Output directory override: none

A Vercel deployment of the current PR #135 candidate is not production evidence until the deployed source SHA and sealed files are verified against the certified PR head.

Magic-link sign-in is not production-verified until the active production hostname is present in the Supabase Auth redirect allow-list.

## Current deployment boundary

Production must not be described as running the PR #135 candidate before that exact candidate is deployed and its receipt is checked.

The GitHub Pages environment currently permits only the authorised production branches. A rejected pre-merge branch deployment is not a product failure and is not production verification.

## Release rule

Do not declare production ready unless all of the following are green on the same final source SHA:

- unit/asset/brand/P0 and Museum checks
- release security gate
- integration contract
- app release seal
- deterministic generated-output verification
- Visual Evidence V2 across the required viewport matrix
- UI interaction evidence across phone, landscape and desktop

After CI, verify the deployed production receipt and sealed file hashes against that same SHA.

Physical iPhone/Android install, safe-area, keyboard and reopen/persistence checks remain a separate device gate and must not be inferred from browser emulation.

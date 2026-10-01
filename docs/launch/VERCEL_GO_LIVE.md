# Deployment go-live gate

Active release candidate: PR #135 / `refactor/user-studio-feed-travel-20261001`.

This file binds deployment verification to the actual PR head. Do not hard-code a historical candidate SHA here: the release SHA is the current PR head and every required workflow must report that exact SHA.

## Deployment authority

The currently proven production path is GitHub Pages:

- Workflow: `.github/workflows/pages.yml` (`Deploy KONA`).
- Trigger: push to `main`.
- The workflow requires successful certification for the exact source SHA before publishing.
- Last observed successful production deployment before this candidate: `e8b78b1a118065376fff52662fb727837aa6c483`.
- Observed Pages URL: `https://joaoccaldas.github.io/canyonmuseum/`.

The repository also contains `vercel.json` and a Vercel release-contract test. Those prove static-delivery compatibility only. The connected Vercel account currently exposes no KONA/canyonmuseum project, so a Vercel production deployment is **not verified** and must not be reported as live evidence.

If Vercel is selected as the canonical host later, connect/identify the actual project and verify its deployed SHA, release receipt, auth redirect configuration and public URL in a separate deployment step. Do not run two competing production authorities without an explicit cutover decision.

## Verified source contracts

- User Studio has one persistent escape control and routes through the canonical `enterApp('me')` path.
- Standalone Bike Studio returns through `index.html?view=me`.
- Static delivery keeps `index.html`, `manifest.webmanifest`, and `sw.js` revalidating.
- No catch-all Vercel rewrite shadows static assets.
- Deterministic rebuilds must leave committed generated outputs unchanged.

## Release rule

Do not declare production ready unless unit/asset/brand/P0, security, integration, app release seal, deterministic output verification, Visual Evidence V2 and UI interaction evidence are green on the same final PR-head SHA.

After merge to `main`, require the deployment workflow to publish that exact merged SHA and verify the production `release.json` receipt plus sealed file hashes. Physical iPhone/Android install remains a separate device gate and must not be inferred from emulation.

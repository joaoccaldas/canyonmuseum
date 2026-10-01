# Deployment go-live gate

Active release candidate: PR #135 / `refactor/user-studio-feed-travel-20261001`.

This file binds deployment verification to the actual PR head. Do not hard-code a historical candidate SHA here: the release SHA is the current PR head and every required workflow must report that exact SHA.

## Deployment authority

The currently proven production host is GitHub Pages:

- Observed Pages URL: `https://joaoccaldas.github.io/canyonmuseum/`.
- Last observed successful production deployment before this candidate: `e8b78b1a118065376fff52662fb727837aa6c483`.
- The observed successful publish for that SHA was GitHub's managed Pages/Jekyll `pages-build-deployment` pipeline.
- The repository also contains `.github/workflows/pages.yml` (`Deploy KONA`), which stages an explicit allowlisted site and, on the active launch branch, requires exact-SHA certification before publishing.
- These are two different publication models. Before the next production release, GitHub Pages settings and the repository workflow must be consolidated so exactly one pipeline owns production. Until that cutover is proven, do not describe the custom workflow as the live deployment authority.

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

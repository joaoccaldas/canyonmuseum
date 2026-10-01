# KONA launch candidate — 1 October 2026

The entry point is User Studio. Enter KONA opens it immediately; account creation is optional. Avatar, Bike Studio, museum, Discover, race week and Passport are visible destinations. Gear is explicitly marked Soon.

## Release blockers addressed

- Pages now stages `race-self.css` and the other personal-surface styles from one allowlist. A release gate verifies every service-worker core asset and its hash against the actual staged artifact.
- A single User Studio combines the compatible work from PRs 121 and 124. Entry, shared shell and personal features have separate stylesheet owners. Do not merge those older overlapping branches on top of this one.
- Portrait/landscape camera fitting uses object bounds. Bike Studio excludes its dock and heading from the render viewport. Switching models has bounded caching and disposes cloned materials.
- Landing bike art is rendered from the canonical Canyon model and WYLD liveries. Three.js and museum assets are not requested on landing. One session-stable color family gives new visitors variation; explicit appearance preferences remain available.
- Avatar geometry and stage lifecycle are separate modules. The block athlete wears a pixel-textured trisuit and detailed running shoes.
- Room presentation and prop placements are in the world registry. Four existing themed installations and shared props have reusable builders. Hidden themed-room decorations and lights are culled; architecture remains visible.
- The install controller handles late browser prompts, single-use prompts, dismissal, exceptions, installed state and keyboard focus. Entry and User Studio use the same controller. Native APK distribution is separate from browser installation.
- Authentication passes the redirect URL through the supported query parameter, suppresses duplicate requests, handles rate limits and preserves the session on transient network failures. Data exports omit authentication tokens.

## Verified locally

- 276 unit checks, including auth redirect, throttle, refresh concurrency, offline-session preservation and safe exports.
- 29 GLB asset contracts; no failing models.
- All 10 published HTML pages at phone and desktop widths: no page errors, local missing resources or horizontal overflow.
- User Studio at 360×640, 390×844, 430×932, 768×1024, 1280×800, 1440×900 and 844×390: usable controls, framed avatar, persistence, destinations and Escape/focus behavior.
- Previous stress pass: 20 Studio visits, 40 avatar changes, 24 bike switches; GPU geometry/texture counts stable across bike cycles. Re-run after visual changes.
- Staged-site worker install and offline reload; customization/navigation fallback with WebGL disabled. Re-run after final sealing.
- Supabase production project healthy; registration and email enabled. App-state ownership policies verified, including UPDATE ownership check. One authorized live email request returned HTTP 200. Inbox delivery confirmed by the user; callback exposed a production Site URL of localhost. Site URL and exact production callback allowlist were corrected in Supabase. Custom SMTP is disabled; a second live email hit HTTP 429. Public registration remains blocked on production email delivery configuration.

## Required before broad launch

1. GitHub checks must pass at the exact PR head; review the PR diff and merge only the intended release branch.
2. Deploy, compare `release.json.sha` with the intended commit, and check production CSS, service worker, entry and museum.
3. Confirm the real email arrives and its one-time callback opens the account. Verify production SMTP capacity for public traffic; a successful single request does not establish capacity.
4. Confirm a physical iPhone Add to Home Screen launch and Android native install prompt. Desktop viewport/device emulation does not establish actual installation behavior.

## Next after the launch gate

| Work | Why it follows launch-critical wiring |
|---|---|
| More reusable room props and room presets | Extend the indexed builders after measuring visibility and draw-call cost; do not add more per-room lighting by default. |
| Gear customization | Needs an equipment contract, saved ownership and accessible editing before the Soon label becomes an action. |
| Additional brands/rooms (PR 125) | Product catalog and generated output overlap; integrate separately after this release passes, with asset provenance and mobile budgets. |
| Stronger return loop | Passport, saved customizations and race badges already persist. Add source-backed race-week updates and new exhibits without promising unsupported live race data. |
| Wider device/performance lab | Physical low-end Android, iOS Safari and prolonged thermal tests go beyond Chromium emulation. |

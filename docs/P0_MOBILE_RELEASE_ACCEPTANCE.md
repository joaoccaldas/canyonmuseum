# P0 Mobile Release Acceptance

This release exists to fix the real-phone failure before further design work.

## New user
1. Open production URL in a fresh browser session.
2. First screen is readable at 320/360/390/430 widths.
3. No Three.js/GLB is requested.
4. Build my Kona self opens a visible onboarding state in the viewport.
5. Complete intent → bike → shoes → goal.
6. Reveal shows This is your Kona, reward receipt, Enter KONA, Share, Save/sign in.
7. Enter KONA reaches Home without requiring registration.
8. Save/sign in sends a magic link or reports failure without losing local identity.

## Returning user
1. Reload with local RaceIdentity.
2. Onboarding is not replayed.
3. Continue your Kona reaches Home.

## Install
1. Install app is visible on the first screen.
2. Android Chrome either shows native PWA prompt or install guidance.
3. iPhone Safari has Add to Home Screen guidance.
4. Installed name is KONA.
5. No APK is advertised unless a signed native artifact is published.

## Release evidence
Required before calling fixed:
- all CI gates green
- exact merged SHA
- GitHub Pages deploy green
- fresh-cache live URL test
- real Android screenshot + install launch
- real iPhone Safari/PWA test
- service-worker update from prior live build

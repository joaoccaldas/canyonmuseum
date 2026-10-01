# Static hosting release gate

The deployment artifact is the repository root for the existing static host, or the validated staging directory for a new static host. Use Framework preset Other, no build command and no output override when serving committed root output.

Before publishing, require unit/asset/brand/hygiene/security/integration checks, deterministic generated output, app release seal and the visual/browser journeys on the same final commit. Require live sign-in delivery and callback at the actual hostname, plus physical mobile install/return checks. Current evidence and remaining gates are in [readiness](READINESS.md).

Keep `index.html`, `manifest.webmanifest` and `sw.js` revalidating. Do not shadow static assets with a catch-all rewrite. Add any new hostname to the authentication redirect allow-list before testing account recovery. A local mocked account response cannot certify email delivery or callback.

Generated-output commits must trigger checks. Historical commit references are not approval for a newer release. Merge or deployment of this candidate is a separate release action after its gates pass.

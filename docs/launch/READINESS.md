# KONA launch stabilization — 1 October 2026

This is a release candidate, not a claim that the deployed site has received these fixes. Production approval requires all gates on the final commit and actual device/account evidence.

## Current behavior

Fresh entry: avatar/trisuit → Home → optional one-time tour. Returning entry goes to Home. Sign-in is optional; local continuation is always available. Main navigation is Home, Discover, Garage, Plan and Me. Personal 3D and the museum load only after intent.

The landing stage rotates across the eligible bike catalog without immediately repeating the previous choice. There are 46 rendered public previews and six anonymous Secret Collection silhouettes. Names and asset paths of secret bikes do not enter the hero projection. Only the selected image loads; a missing image shows a truthful silhouette and an unavailable status. The build rejects missing public previews.

Passport merges both historical schemas and namespaces, preserving discoveries, stamps, badges, XP and visits. Collectibles award their fixed reward once, independently of request IDs. Progress shows levels and the next XP target; collection cards show their real rarity/place or equipment relationship. Advanced reward materialization and richer social artwork remain separate PRs.

Studio startup and shared previews are read-only. Failed model loads cannot save the previous bike. Explicit saves preserve goals, unrelated equipment and relationships; blocked persistence reports failure. Account controls remain usable after async success/failure. Navigation ignores obsolete style loads and detaches stale render targets.

Entry owns shortcut visibility. Mobile navigation has five bounded, borderless controls. Landscape controls meet the 48px target. Collection headers/controls wrap at narrow widths. Existing typography, palette and lazy world style isolation remain the visual authority.

## Validation receipt

Local browser evidence uses disposable profiles against a staged static artifact. These are functional/stress checks, not production load or physical-device certification.

| Check | Evidence/status |
|---|---|
| Unit suite | 308 passed |
| Bike asset contract | 29 files, zero failures |
| Brand/source hygiene and integration contract | Passed |
| Dependency audits | No reported production vulnerabilities in web or native lockfiles |
| P0 journey | Fresh avatar/trisuit, tour, persistence, museum return, returning Home, mocked auth and installation controls passed |
| Additional browser regressions | Sign-in/Back repeated at four sizes; mocked 200/429/500; delayed Studio navigation; legacy Passport route round-trip; read-only Studio and failed model save passed |
| Preview audit | All 46 images decoded; six silhouettes; return non-repeat; forced 404 fallback; zero heavy 3D requests on entry |
| Direct route bounds | 15 cases across five sizes: Me, Garage and Collection; every visible Garage tab checked individually |
| Stress | 20 Studio visits, 40 avatar changes, 24 bike switches; one canvas and stable model resources |
| Offline/fallback | Cached entry/Studio and customization with WebGL unavailable passed on the final staged seal |
| Visual matrix | 315 captures, zero blocking violations; isolated Collection CSS then checked through direct-route bounds |
| Native assets | Assembly passed, source tree excluded, version shim external, unpublished identity renamed; no signed/native-device certification |
| Privacy | Tracked-file scan passed after staging new files; authored documentation sanitized; publisher is KONA |

Browser artifacts and recordings belong in ignored local output or CI artifacts. Do not put account identifiers, recipient addresses or private device/session exports into documentation. Licensing/source records remain attributable; historical Git commits are not erased by this cleanup.

## Remaining public-launch gates

1. All required CI checks green on the final PR head, including rebuilt output, seal, security and visual checks.
2. Live magic-link delivery, callback, session hydration and return at the actual deployment hostname. Automated live browser access was unavailable because its security-policy verification service failed. No sign-in mail was sent. A local mocked response does not prove email delivery.
3. Physical iPhone and Android installation, Home Screen launch, return/offline behavior and a minimum-device performance pass.
4. Deploy the approved commit and verify its release identifier. Local fixes do not change the live site automatically.

No broad production approval is implied until these gates pass. Native signing/public distribution and account deletion/retention readiness require their own release scope. Browser installation remains the day-one app route.

## Documentation and repository disposition

Current product, architecture, security and release guides are authoritative for their stated scope. Supporting historical documents carry notices and no longer provide current release approval. See [repository review](REPOSITORY_REVIEW.md) for raw captures, duplicate guides/generated mirrors, historical logs and transient artifacts that should leave the repository after dependency/provenance checks. See [later PRs](LATER_PRS.md) for useful architecture, content, reward, performance and accessibility proposals intentionally deferred today.

Compatibility paths, product names, source records, hosting URLs, signing environment keys and legacy storage aliases remain where changing them would break links, deployment or saved-user migration. Display branding and unpublished package names/identity use KONA.

## Artifact receipt

Final static seal: `b6ea928e6653`, 215 files, 24 core shell files, 53.7 MB including lazy assets. The consumer visual matrix used identical active entry/app bundles and styles before the isolated Collection stylesheet change. Direct Collection/route checks and service-worker checks cover the final staged artifact. CI must repeat the required checks against the final commit. Screenshots were inspected for representative narrow phone, phone landscape, tablet, desktop, Garage, User Studio, progress, landing rotation, secret silhouette and the full public-preview contact sheet. Automated geometry checks do not establish a universal aesthetic score or full accessibility certification.

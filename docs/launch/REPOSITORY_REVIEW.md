# Repository contents review

The documentation inventory covers root guides, feature contracts, dated audits, evidence, backend guidance and generated mirrors. Current guides now reflect the implemented entry/route contract. Supporting documents carry status notices. This review lists cleanup candidates without deleting original material.

| Path/family | Recommendation and reason |
|---|---|
| `assets/reference/cfr/product-4524-se.html`, `assets/reference/slx/product-4520-se.html`, `assets/reference/prices-se/*.html` | Move raw third-party captures to controlled research storage after checking extraction and hashes. They include unnecessary scripts/tracking markup and are excluded from public staging. Preserve concise facts and rights records. |
| Both copies of `BRAND_MUSEUM_AGENT_PROMPT.md` | Consolidate into one role-based engineering recipe after checking links; historical production guidance is not app runtime. |
| Root/reference/generated copies of `FIT_RESEARCH_AND_ROADMAP.md` | One authored guide with deliberate projections. Current build and exhibit links still consume these paths. |
| Root handovers/analysis, dated audits and `docs/evidence/*` | Eventually archive with an index. Old branches, test counts and approval claims must not be current production truth. Preserved with status notices today. |
| `web/dist/*.html` | Duplicate generated output; retain until build/native consumers migrate to the staged artifact. Never edit independently. |
| `app/*.js`, root HTML, `sw.js`, app manifest | Required static deploy artifacts: keep their deterministic source owners and integrity seal. Size alone does not justify removal. |
| APK/ZIP releases, recordings, transient captures | Keep as signed release or CI artifacts outside source control. No unpublished APK advertised. |
| `output/`, `_site/`, browser profiles, QA exports and dependency trees | Ignore local/generated artifacts; they can hold device/session context. |
| Personal names, addresses, correspondence, recipients, local paths and provider identities in docs | Remove from authored documentation. Protected configuration holds secrets; source records retain licensing attribution. Editing current files does not erase Git history. |
| Existing exhibit filenames, identifiers, source/hosting URLs and old storage aliases | Compatibility exceptions preserve inbound links, provenance and saved-user migration. Change display branding now; plan breaking identifier changes separately. |

## Removal acceptance

Check runtime/build consumers, replacement reproducibility and source/rights trail before any removal. Preserve a recoverable original outside deployment. Re-run staged-reference and user-journey checks after migration. This review deletes no original project, content or historical file.

# Batch 2 Evidence Record — 2026-09-30

Branch: `refactor/state-product-batch2-20260930`

Post-sync head before this evidence commit: `19de3f3848e261d2f217ed600b1d677f3c8dd9eb`

## Scope verified

- canonical storage key authority
- cloud/privacy state registry alignment
- Garage projected from canonical UserEquipment
- Garage as first-class 2D shell destination
- Home/Discover/Plan/Me remain usable without eagerly loading the 3D museum
- Studio is optional configuration depth from Garage
- generated-output synchronization covers the bundles validated by Museum checks

## Mobile evidence

Visual Evidence V2 passed on Batch 2 source head `14010d0cb6beef18a72e111cdac2d9278a8f661d`.

Artifact:
- name: `visual-evidence-v2`
- artifact id: `11098820695`
- digest: `sha256:a9ee2e742343d928d6443adb031cb0cb54939895d8e4150e0db84541f928cd80`

The artifact contains real-browser mobile captures at 320 px and 390 px for landing, onboarding, reveal, Home, Discover, Plan, Me, install and dark/light states.

## Defects found and repaired

1. Generated bundle sync omitted JS bundles that Museum checks validates.
2. Release visual harness required the 3D renderer before capturing 2D shell states.
3. Shell labels drifted between Home/Discover and Now/Explore.
4. Home and Me deep-linked directly to Studio instead of Garage.
5. A shell row action had an undersized touch target.
6. Home/Discover/Plan depended on museum globals, leaving the 2D shell empty before the museum bundle loaded.
7. A P0 source-contract test asserted an implementation-specific fetch spelling rather than the architectural invariant.

## Evidence from CI

On source head `01314e7821c14595f2a105857645f49e2e8f79f1`:
- App release seal: PASS
- Integration contract: PASS
- P0 browser journey: PASS, with zero heavy 3D/catalog requests on entry
- Sync deterministic generated outputs: PASS
- Unit suite after contract repair: 222 tests exercised; prior single failure was the stale source-regex contract described above
- Museum checks before sync: expected stale-generated-output failure

The successful sync created `19de3f3848e261d2f217ed600b1d677f3c8dd9eb`.

This evidence commit exists to trigger the full validation matrix on the exact post-sync generated head.

## Release rule

Do not mark Batch 2 complete until the full gate matrix is green on the post-sync head or its documentation-only descendant.

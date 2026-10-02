# Kona.m Change Contract

## Change

- Date: 2026-10-02
- Scope: audit-only pre-migration quality branch
- Purpose: measure code structure, CSS ownership/cascade risk, rendering lifecycle, CI consistency and bundle-size budgets before repository migration.

## Before

- Runtime behavior: PR #159 exact head is the behavior baseline.
- User flow: unchanged.
- State/persistence: unchanged.
- Dependencies: unchanged.
- Security/privacy: unchanged.
- Performance: known release evidence exists, but architecture/performance risks are distributed across several files and not summarized by one repeatable audit.
- Release/deployment: unchanged.

## After

- Runtime behavior: unchanged.
- User flow: unchanged.
- State/persistence: unchanged.
- Dependencies: unchanged.
- Security/privacy: unchanged.
- Performance: new read-only audit tools generate machine-readable evidence for code size, CSS cascade ownership, WebGL lifecycle, CI consistency and deploy-bundle budgets.
- Release/deployment: unchanged. A new audit workflow runs these tools but publishes nothing.

## Invariants that must not regress

- No consumer/runtime source file is modified by this audit branch.
- No package or lock file changes.
- No generated app/HTML/service-worker output changes.
- No route, state key, auth, Supabase or native identity changes.
- Existing release/security gates remain intact.
- Audit tooling must not weaken existing failures or modify production artifacts.

## Risks

- User-visible: none intended.
- Data: none.
- Security/privacy: low; tools read repository source only.
- Rendering/mobile: none at runtime.
- Deployment: none.
- Third-party/dependency: none.

## Rollback

Revert or close this audit PR. Production/runtime behavior is unaffected.

## Verification

- Existing PR #159 baseline gates: green at its exact head before this branch.
- New quality workflow: must complete and upload evidence.
- Existing standard workflows: must remain green where triggered.
- Before/after comparator: must show audit/docs/workflow-only changes and no dependency/runtime behavior delta.

## Result

Pending exact-head CI. Audit findings are advisory unless an explicit budget/contract is violated.

# KONA Production Readiness Standard V1

This is the minimum engineering gate for any Caldas Studio repository before public release.

## 1. Repository integrity
- clean working tree
- generated outputs reproducible
- no unexplained binary churn
- no stale/dead duplicate entrypoints
- clear canonical source vs generated artifacts
- branch/PR history understandable

## 2. Security
- secret scan
- dependency audit
- no client-side secrets
- no private keys/tokens in history
- no unsafe arbitrary URL execution
- CSP/security headers where applicable
- external input fails closed
- rate limits/server validation for valuable mutations

## 3. Privacy
- data inventory
- collection purpose documented
- local-first where possible
- explicit consent for analytics/cloud/external services
- export/delete coverage
- no hidden tracking
- no user identifiers in aggregate vendor outputs

## 4. Data contracts
- stable IDs
- versioned schemas
- validators
- migrations
- provenance/source refs
- duplicate detection
- no free-text foreign keys where canonical IDs exist

## 5. Architecture
- no business logic in giant UI files where avoidable
- no brand/athlete-specific production branching when data/config works
- modules have explicit ownership
- generated content has a canonical source
- adapters isolate external services

## 6. Front-end quality
- mobile-first
- 320/360/390/430 portrait
- landscape
- safe areas
- touch targets >=44px
- keyboard accessibility
- reduced motion
- loading/empty/error/offline states
- light/dark
- deep links/back navigation
- no overflow/clipping

## 7. 3D/performance
- mobile draw-call/triangle budgets
- DPR scaling
- LOD/lazy-loading strategy
- memory leak check across room changes
- no repeated heavyweight loading
- device heat/battery observation
- graceful degradation

## 8. Backend/integration
- auth boundaries
- authorization, not authentication alone
- idempotent writes
- input validation
- retry/backoff
- audit receipts
- DB constraints/indexes/retention
- migrations reversible or safely forward-only

## 9. Testing
- unit
- schema/contract
- integration
- real-browser
- mobile visual
- offline/PWA
- cross-theme
- regression screenshots
- negative/error-path tests
- migration tests

## 10. Release
- exact SHA
- all required CI green
- deterministic generated outputs committed
- security/privacy gate green
- rollback point
- live smoke after deployment
- release receipt

## Severity
P0: security/privacy/data loss/app unusable -> block release.
P1: core journey/progression/setup broken -> block broad beta.
P2: non-core UX/polish -> small beta allowed.
P3: backlog.

## Evidence rule
Never mark a capability READY because code exists. READY requires:
- implementation
- test
- visual/runtime evidence where relevant
- no known P0/P1 blocker
- production or explicitly-labelled branch state

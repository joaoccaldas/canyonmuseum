# KONA Automation Workflows V1

> Operating specification for the reusable KONA / Caldas Studio factory.  
> Branch: `ops/automation-workflows-v1-20260930`

## Why this exists

The platform should automate **repeatable evidence, asset, content, release, commercial and measurement work** while keeping consequential external actions under human control.

The source product strategy is now: one canonical asset or story should be reusable across Museum, KONA, athlete rooms, event rooms, social content, Studio, commerce and partner demos.

## Safety boundary

### Safe to automate without case-by-case approval
- read-only research from approved public sources
- schema validation
- builds, tests, screenshots and performance checks
- candidate classification and scoring
- draft creation
- data-quality checks
- deduplication
- CRM next-action suggestions
- link-health checks

### Always requires human approval
- sending email/DM/proposals
- public social publishing
- spend
- contracts/pricing commitments
- use of athlete likeness where permission is unclear
- use of brand/event marks where permission is unclear
- production data writes involving private/user data
- destructive Git/database actions
- merging a release when any gate is not green

## Agent operating model

| Agent | Responsibility |
|---|---|
| Program Orchestrator | Priorities, dependencies, weekly decisions |
| Product + QA | UX, releases, browser/mobile evidence, performance |
| Research + Evidence | Sources, specs, science, results, confidence |
| Assets + 3D | Blender/GLB, LOD, intake, visual QA, provenance |
| Content + Growth | Canonical stories and media derivatives |
| Partnerships + CRM | Targets, outreach drafts, follow-up, proposals |
| Commerce | Affiliate mapping, offer/link health, disclosures |
| Trust / Legal / Security | Rights, privacy, secrets, ship/no-ship |
| Data / KPI | Funnels, content metrics, commercial metrics |

## Workflow map

| ID | Workflow | Primary trigger | Human gate | Primary KPI |
|---|---|---|---|---|
| WF-001 | Product Intake | new product | production promotion | candidate→canonical time |
| WF-002 | Brand Room Factory | approved products + brief | publish | asset→room time |
| WF-003 | Athlete Room Factory | target/inbound athlete | outreach + likeness | partner adoption |
| WF-004 | Event Room / Race Week | target event | publish/notifications | event return visits |
| WF-005 | TRI//SIGNAL | daily | editorial publish | time-to-publish |
| WF-006 | YouTube Watchlist | new upload | derivative use | story conversion |
| WF-007 | Social Asset Factory | social-ready story | all publishing | view-through/share |
| WF-008 | Partnership Prospecting | weekly/sprint | every outbound | meeting rate |
| WF-009 | Proposal Generator | qualified lead | price/send | win rate |
| WF-010 | Affiliate Audit | weekly/catalog change | placement | revenue/1k visits |
| WF-011 | Release Train | merge candidate | ship | change failure rate |
| WF-012 | Rights Audit | new asset/pre-campaign | ambiguous rights | cleared asset % |
| WF-013 | Feedback Triage | daily/weekly | priority | time-to-triage |
| WF-014 | Weekly KPI Review | weekly | strategy changes | decisions closed |
| WF-015 | Notification Queue | eligible event/state | new categories | action completion |

## Implementation order

### P0 — automate now
1. WF-011 Release Train
2. WF-001 Product Intake
3. WF-002 Brand Room Factory
4. WF-012 Rights / Provenance Audit
5. WF-013 Feedback Triage

These protect the codebase and accelerate the current Nike/WYLD/non-bike expansion.

### P1 — next
6. WF-005 TRI//SIGNAL
7. WF-006 YouTube Watchlist
8. WF-007 Social Asset Factory
9. WF-008 Partnership Prospecting
10. WF-009 Proposal Generator

These turn product progress into distribution and business development.

### P2 — after initial demand
11. WF-010 Affiliate Audit
12. WF-004 Event Room / Race Week
13. WF-015 Notification Queue
14. WF-014 KPI Review automation

## Concrete automation hooks

### GitHub / CI
Use GitHub Actions for:
- build/test/release gates
- generated-output drift
- catalog validation
- room config validation
- source/provenance completeness
- screenshot artifacts
- asset budget thresholds

### Scheduled tasks / agents
Use scheduled agents for:
- daily TRI//SIGNAL
- YouTube/RSS watchlist
- weekly affiliate-link health
- weekly KPI brief
- CRM follow-up candidates

### Connected apps
Use:
- Gmail for **draft-only** partner follow-ups unless explicitly approved to send
- Calendar for agreed meetings
- Drive/Docs for partner deliverables
- GitHub for implementation state and evidence
- future CRM/Airtable for structured pipeline state

## Workflow state machine

Every workflow should use the same minimal state model:

```
DISCOVERED
  ↓
CANDIDATE
  ↓
EVIDENCE_READY
  ↓
BUILD_READY
  ↓
QA_READY
  ↓
APPROVAL_REQUIRED
  ↓
PUBLISHED / SENT / MERGED
  ↓
MEASURED
  ↓
LEARNED
```

A workflow must not skip `APPROVAL_REQUIRED` when external reputation, legal rights, money, or user data are involved.

## Common receipt

Every automated run should emit a machine-readable receipt:

```json
{
  "workflow_id": "WF-001",
  "run_id": "...",
  "started_at": "...",
  "inputs": [],
  "source_refs": [],
  "changes": [],
  "tests": [],
  "rights_status": "clear|blocked|review",
  "security_status": "clear|blocked",
  "approval_required": true,
  "next_action": "...",
  "kpi_delta": {}
}
```

This prevents agent work from becoming invisible or irreproducible.

## Near-term rule

No workflow is allowed to create a new product universe that bypasses the canonical catalog, provenance registry, room factory, release gates or rights review.

The metric to drive down is:

> **validated canonical asset → publishable derivative experience**

Target: **under one working day**, then eventually hours.

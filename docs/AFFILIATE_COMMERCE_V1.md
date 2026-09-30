# Affiliate Commerce Data Model V1

Affiliate monetization is a governed adapter on top of the canonical product graph.

```
Product
  ↓
AffiliateProgram
  ↓
AffiliateLink
  ↓
Placement
  ↓
click / conversion / revenue
```

## Rules
- Never hardcode tracked links inside room/product rendering logic.
- Product relevance outranks commission rate.
- Commercial placement must be disclosed at the point of interaction.
- Program terms are versioned by `last_verified_at`.
- Broken or expired links automatically pause.
- Affiliate links never change compatibility/science/editorial claims.
- Personal equipment preference is not shared with vendors unless the user explicitly opts into aggregate insights.

## Minimum database fields

AffiliateProgram:
brand, status, network, regions, commission model/rate, cookie window, application URL, product feed, last verified, source.

AffiliateLink:
program, optional product id, destination, tracking URL, placement, campaign, status, disclosure, last health check, clicks, conversions, revenue.

## Commerce Agent weekly audit
1. Verify active programs and terms.
2. Health-check destinations and tracking links.
3. Detect product retirements/out-of-stock where available.
4. Verify disclosure label is rendered.
5. Compare clicks/conversions against previous period.
6. Flag unusual conversion or attribution changes.
7. Never auto-switch brands based on commission.
8. Produce an auditable receipt.

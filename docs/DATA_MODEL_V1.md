# KONA Data Model V1

## Rule

Everything reusable is an entity with a stable id and schema version.

```
Canonical Product
      ↓
User Equipment Instance
      ↓
Race Identity / Setup
      ↓
Experience / Share / Analytics
```

Never store “Canyon Speedmax” as free text when the canonical product id exists. Never store a user’s owned/dream state on the canonical product.

## Entity split

### Canonical product
One global record shared by all users.

Example id:
`product:canyon-speedmax-cfr-axs:2027`

Contains specs, sources, assets, setup slots, commercial links and capabilities.

### User equipment
One user-specific relationship to a product.

Example:
`equipment:01k...`

Contains:
- owned / dream / try / former / borrowed / favorite
- customization
- purchase facts
- usage/mileage
- external links such as Strava gear
- visibility

### Race Identity
A shareable event-specific setup.

Example:
`race-identity:01k...`

References user-equipment ids, never duplicate product data.

### External account
Connection metadata only. OAuth secrets/tokens live server-side and are never part of browser-exported app state.

### Vendor insight
Aggregate-only derived data. No user ids. Owned, dream and try remain separate measures.

## ID policy

- Canonical ids are immutable, namespaced, human-readable where useful.
- User-owned instances use generated immutable ids (ULID/UUID recommended).
- Display names may change; ids do not.
- Existing museum ids should be retained in `legacy_ids` while migrating.

## Strava adapter

Strava is an enrichment source, not canonical truth.

Flow:

```
Connect with Strava (OAuth)
  ↓
DetailedAthlete
  ├── bikes[]
  └── shoes[]
       ↓
GET /gear/{id}
       ↓
ExternalGearLink
       ↓
matching engine
       ↓
suggest canonical Product
       ↓
USER CONFIRMS
       ↓
UserEquipment
```

Never automatically convert a Strava gear name into a canonical product with confidence 1.0. Gear names are user-entered and may be ambiguous.

Suggested MCP actions:

- `strava.get_profile`
- `strava.get_stats`
- `strava.list_activities`
- `strava.get_activity`
- `strava.list_gear`
- `strava.get_gear`
- `strava.sync_since`
- `strava.disconnect`

MCP should wrap a server-side Strava adapter. The browser should never receive client secrets or refresh tokens.

## Personalization

Use user-owned/dream/try equipment locally for personalization:
- prioritize relevant rooms
- compare owned bike against dream bike
- show compatible products
- prefill RaceIdentity
- tailor content/news
- suggest maintenance based on confirmed usage

Vendor-facing analytics require explicit opt-in and aggregation.

## Migration order

1. Introduce schemas and validators.
2. Add aliases from current museum product ids to canonical product ids.
3. Migrate RaceSetup to reference UserEquipment ids.
4. Add onboarding RaceIdentity.
5. Add Strava adapter behind ExternalAccount.
6. Add anonymous aggregate pipeline only after consent UX exists.
7. Never block offline/local-first use on external integrations.

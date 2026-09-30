# Hardcoding Policy and Register V1

## Principle
Hardcode only immutable protocol constants or deliberate design defaults. Domain content, products, athletes, rooms, rewards, affiliates, events and user progression belong in data/config/schema.

## Acceptable hardcoding
- schema versions
- supported protocol versions
- safety limits
- semantic default colours/tokens
- immutable storage-key migration aliases
- feature fallback values with documented owner

## Must migrate to data/config
- product names/specs
- athlete identities
- sponsor lists
- room geometry/theme
- event schedules
- collectible definitions
- XP/reward tables
- level names/thresholds
- affiliate URLs/commission terms
- notification copy/categories
- challenge definitions
- external source lists

## Review checklist
For each literal/conditional ask:
1. Is it a protocol/safety invariant?
2. Is it user/content/domain data?
3. Could another brand/athlete/event require another branch?
4. Does changing it require a code deploy?
5. Can a schema + config express it safely?

If 2-5 indicate domain data, move it out of runtime code.

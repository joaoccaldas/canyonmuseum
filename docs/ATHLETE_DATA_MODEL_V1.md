# Athlete / Kona Room Data Model V1

## Principle

No athlete-specific production logic.

An athlete room is composed from canonical entities:

```
Athlete
  ├── Performances
  ├── Sponsorships
  ├── Equipment snapshots
  ├── Career milestones
  ├── Media assets
  └── RoomConfig
```

## Kona roster

Each professional racing Kona should receive one canonical Athlete entity, even if the public room is not yet published.

The record may be incomplete at first, but every populated claim must carry a source.

Recommended ingest order:
1. official Kona/IRONMAN start list
2. athlete official site / team / sponsor
3. governing body profile / results
4. verified social profile
5. open-license media source
6. reputable media only when primary sources are absent

## Athlete room

Room decoration is data, not code.

`RoomConfig.theme` controls:
- palette
- lighting
- materials
- typography
- ambient audio

`RoomConfig.layout` controls:
- room template
- bounds
- stations
- navigation

`RoomConfig.content` links:
- product ids
- performance ids
- career milestones
- media ids

This lets two athlete rooms use the same renderer but feel entirely different.

## Sponsorship

Store sponsorships separately from equipment.

A sponsor relationship does not prove an athlete raced a particular product on a particular day.

For race-day equipment use an EquipmentSnapshot tied to Event + Date with per-item confidence.

## Images / media

Open-source or partner-provided imagery must be represented as MediaAsset with:
- license
- attribution
- commercial-use permission
- derivative permission
- source

Do not infer that an image is commercially usable simply because it is publicly viewable.

## Equipment confidence

Suggested confidence:
- 1.00 official athlete/brand/event equipment statement
- 0.90 clear high-resolution race photo plus known sponsor/product
- 0.75 multiple consistent reputable secondary sources
- 0.50 plausible but not fully resolved
- <0.50 do not present as fact

## Future automation

Athlete Intake Agent:
1. ingest Kona start list
2. create missing Athlete ids
3. research public profiles
4. ingest results
5. map sponsors
6. map equipment candidates
7. ingest rights-cleared media
8. propose RoomConfig
9. produce evidence report
10. human approval before public publish

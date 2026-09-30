# KONA Brand Architecture V2

## Decision

The supplied rebranding proposal is the visual benchmark.

Adopt its:
- editorial serif + restrained sans pairing
- volcanic black / warm paper / lava-orange system
- large negative space
- thin rules and precise grid
- documentary Kona photography
- monochrome technical/product imagery
- premium museum/editorial pacing
- simple outline iconography
- calm cards with dramatic hero moments

Do **not** make Canyon Museum the umbrella consumer brand unless Canyon explicitly licenses/partners for that role.

## Brand architecture

```
KONA
Race the version of yourself
│
├── Canyon Museum        flagship collection
├── Nike Running Lab     brand/category study
├── Athlete Rooms        people
├── Kona Places          local graph
├── Race Archive         events/history
├── Garage               user's equipment
├── Passport             user's progression/story
└── Challenges           playable experiences
```

This keeps the platform multi-brand and avoids implying that Canyon owns or endorses unrelated rooms.

## Product copy hierarchy

Primary:
**KONA**

Promise:
**Race the version of yourself.**

Supporting:
**Explore. Learn. Collect. Connect. Race.**

Canyon Museum may use:
**People. Machines. Stories.**

## Visual tokens

### Light
- canvas: #f5f2eb
- paper: #fbfaf6
- ink: #11171c
- graphite: #2a3136
- muted: #687179
- rule: #d9d5cc
- lava: #ff5a1f
- reef: #168f93

### Dark
- canvas: #071014
- surface: #0d171c
- raised: #121e24
- text: #f6f3ed
- muted: #aab6bd
- rule: #26343c
- lava: #ff6427
- reef: #4bc3c5

## Typography

Current open-source/runtime-safe implementation:
- display: Instrument Serif
- UI/body: Manrope

The proposal's high-fashion editorial serif is a useful art-direction reference, not a reason to introduce an unlicensed font dependency.

## Layout

- max editorial content width: 1280px
- mobile horizontal padding: 20px minimum
- desktop gutters: 32–56px
- 8px base rhythm
- cards: 18–24px radius
- touch targets: >=44px
- one primary action per surface
- avoid nested card-on-card visual noise

## Image treatment

Kona photography:
- warm dawn/sunset
- volcanic rock
- ocean
- documentary athletes
- no generic stock fitness aesthetic

Products:
- clean neutral background for inspect/garage
- dark cinematic treatment only for narrative moments
- preserve accurate geometry/materials

## Motion

Calm shell.
Dramatic moments:
- RaceIdentity reveal
- room entry
- rare collectible
- level up
- challenge completion
- product explode

Respect reduced motion.

## Navigation

Canonical mobile:
- Home
- Discover
- Garage
- Plan
- Me

Explore/3D is a destination inside Discover and contextual CTAs, not a mandatory app boot.

Desktop:
- Discover
- Collection
- Stories
- Places
- Garage
- Passport

## Acceptance

Every screen must pass:
- hierarchy in 3-second glance
- no horizontal overflow at 320/360/390/430
- safe areas
- 44px targets
- light/dark parity
- no duplicate primary CTA
- consistent nav labels
- no brand-specific global chrome
- screenshots in PR

# 3D World UI Standard V1

## Decision

The 3D museum is the visual heart of the product, but not the only product surface.

The app has two deliberately different layers:

1. **App shell** — calm, editorial, useful: Home / Discover / Garage / Plan / Me.
2. **3D world** — cinematic, spatial, emotional: rooms, artifacts, people, places and stories.

Crossing from the shell into the world should feel like crossing a threshold.

## Core principle

> The UI behaves like museum staff: present when guidance is useful, almost invisible when the visitor knows where they are going.

The world owns the screen. Chrome is contextual.

## Explicit world states

### WALK

Purpose: movement and discovery.

Visible:
- world
- movement affordance when required
- one contextual nearby cue
- minimal brand/back/menu affordance

Hidden or receded:
- room rail while actively moving
- object card
- passive toast
- secondary utilities
- unrelated projected labels

Target visual ratio:
- world 85–90%
- UI 10–15%

### INSPECT

Purpose: study one object without breaking spatial continuity.

Visible:
- live object/world
- one exhibit panel
- one dominant action
- evidence/source affordance when relevant

Receded:
- room rail
- nearby cue
- navigation chrome
- movement control on mobile

Target visual ratio:
- object/world 65%
- information 35%

Mobile:
- inspect is a bottom sheet over the live world
- no full-screen route change unless deep reading requires it
- keep essential controls >=44px

### NAVIGATE

Purpose: orientation.

Visible:
- world or map
- current location
- destinations
- close/back

Hidden:
- object labels
- object card
- passive toast
- room rail beneath the map

The map is a temporary orientation tool, not permanent HUD.

## Proximity model

Far:
- no object UI

Medium:
- one short museum label
- e.g. “Speedmax CFR · 2023”

Close:
- one verb
- “Inspect”

Selected:
- enter INSPECT state

Avoid displaying many object labels simultaneously on mobile.

## Artifact presentation

The live object stays spatially anchored.

Exhibit hierarchy:

ARTIFACT 01 / 58
Speedmax CFR
2023 · TRIATHLON · RACE MACHINE

[object]

7.8 kg · 76.5° · 465 mm

Engineered for one thing:
faster on race day.

[Inspect]

Secondary information appears progressively:
- Overview
- Engineering
- Race History
- Gallery

Compare, Garage, Share and commerce must not compete as equal primary actions.

## Engineering mode

Engineering is a transformation of the exhibit, not a separate product brand.

Sequence:
1. isolate object
2. alter lighting
3. explode only evidence-backed geometry
4. reveal a small number of component labels
5. component detail explains:
   - what it is
   - why it exists
   - what problem it solves
   - how it works
   - what changed
   - verified athlete/race context
   - source/confidence

The experience should feel like a conservation/engineering study, not CAD software.

## Room theming

Rooms may own:
- lighting
- materials
- environmental color
- ambient audio
- display plinths
- content-specific accent

Rooms may not own:
- global navigation behavior
- touch sizes
- typography hierarchy
- loading/error patterns
- evidence semantics
- consent/disclosure patterns
- accessibility rules

The shell owns identity; rooms own atmosphere.

## Spatial IA

Where practical, information architecture should be represented in architecture:

- Machines
- People
- Places
- Stories

Physical portals may lead to these domains.

Do not make a persistent category HUD mandatory when the world itself can communicate direction.

## Spectacle budget

Default:
- 90% calm
- 10% spectacle

Reserve spectacle for meaningful moments:
- first world entry
- rare artifact discovery
- collection completion
- room unlock
- time-machine transition
- engineering explode
- challenge completion

Do not spend spectacle on ordinary navigation, XP increments or routine taps.

## Desktop

Desktop is an exhibition installation, not a stretched phone layout.

At rest:
- world dominates
- chrome minimal

On pointer/keyboard activity:
- contextual controls can return

On inactivity:
- secondary chrome recedes

## Mobile

Mobile is a first-person window.

Walking:
- world
- one contextual label
- movement affordance
- minimal back/menu

Inspect:
- world remains visible
- bottom sheet rises
- movement/nav disappears

Do not keep a desktop-scale room rail permanently visible.

## Accessibility

3D is optional.

All essential artifact facts, stories, provenance, actions and navigation must exist in a non-3D accessible path.

Required:
- reduced motion
- keyboard path where applicable
- semantic controls
- focus-visible
- 44px targets
- color-independent states
- safe areas
- no hover-only essential behavior

## Acceptance tests

Every 3D UI change must provide evidence for:
- 390px portrait
- 430px portrait
- phone landscape
- desktop >=1280
- light and dark shell where applicable
- WALK
- INSPECT
- NAVIGATE
- reduced motion

Reject if:
- WALK shows rail + labels + card + toast together
- INSPECT shows navigation and movement at equal weight to the object
- NAVIGATE leaves other strong overlays visible
- 3D detail is materially obscured
- mobile control density rises
- a room creates its own global UI language

## V1 implementation

This first change is intentionally behavior-preserving.

It uses existing runtime state classes:
- `walking`
- `flowing`
- `card-open`
- `touring`
- `map-open`

V1 only changes visual hierarchy:
- active movement clears the rail and nonessential chrome
- inspect clears navigation/nearby/movement competition
- map becomes the sole strong overlay
- mobile inspect remains a world-backed bottom sheet

Future runtime work may introduce an explicit `data-world-mode="walk|inspect|navigate"` contract after visual proof confirms the model.

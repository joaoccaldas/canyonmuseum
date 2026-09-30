# Mobile World Navigation V1

## Decision

Mobile defaults to a **third-person elevated / top-down exploration camera**, not first-person.

First-person remains optional for users who explicitly choose it.

## Why

Phone users already understand:
- tap a destination
- drag to orbit/pan
- pinch to zoom
- tap an object to inspect
- follow a visible avatar/location marker

A virtual first-person joystick is game-specific language and increases cognitive/motor load for a museum/race-week product.

## Default interaction

### Explore
- camera: elevated 35–55° pitch
- visible semi-transparent humanoid proxy
- tap floor / destination to move
- drag one finger to orbit camera
- pinch to zoom
- tap artifact to select / inspect
- optional recenter button

### Accessibility / efficiency
- room/artifact list remains available
- map remains deterministic
- proximity suggests actions but never gates them
- first-person is optional, not required
- keyboard/mouse desktop controls remain supported

## Avatar roadmap

V1:
- simple neutral translucent humanoid silhouette
- no face
- no inferred body characteristics
- no personal data

V2:
- user chooses body/avatar archetype and cosmetic style
- RaceIdentity can reference avatar ID

V3:
- earned/unlocked cosmetics
- race kit / equipment visualization

Future:
- optional personalized avatar generated only from explicit user choices/uploads and consent
- never infer sensitive traits from race history or profile data

## Camera states

```
TOP-DOWN EXPLORE   default mobile
        ↓
OBJECT SELECTED
        ↓
INSPECT / ORBIT

optional:
FIRST PERSON
```

## Acceptance

- a new user can move without reading instructions
- no joystick required for primary mobile navigation
- 44px minimum controls
- one-handed basic navigation possible
- avatar location always understandable
- room list/map provides deterministic fallback
- camera never traps user behind geometry
- reduced-motion mode avoids cinematic camera sweeps

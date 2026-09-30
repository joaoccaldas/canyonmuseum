# 3D Hall Interaction States V1

## Goal

The world owns the screen. UI behaves like museum staff: present when guidance is needed, almost invisible otherwise.

## States

### WALK
Target visual ratio: world 85–90%, chrome 10–15%.

Allowed persistent UI:
- back/product mark
- one movement affordance on touch devices
- one contextual nearby label
- overflow/menu

Hidden by default:
- room rail
- tour pill
- passive chips
- passive toasts
- global share/map/sound controls
- multiple simultaneous object labels

### INSPECT
Target: object 65%, information 35%.

Allowed:
- object
- artifact identity
- 3–4 key facts
- one dominant action
- compact secondary actions
- bottom sheet on phone / exhibit panel on desktop

The world remains visible behind the information layer.

### NAVIGATE
Temporary orientation state.

Allowed:
- minimal map / room destinations
- YOU ARE HERE
- destination labels
- close/back

Navigation UI disappears after destination selection.

### READ
Deep content state.

Target: content 70%, world/context 30%.

## Proximity

Far:
- no object UI

Medium:
- one subtle label

Near:
- one Inspect affordance

Inspect:
- object-focused exhibit treatment

## Touch

Do not remove touch locomotion merely for minimalism.
The movement affordance may fade in visual weight, but must remain discoverable and usable.

## Room theming

Rooms may control:
- lighting
- accent
- materials
- atmosphere
- ambient treatment

Rooms may not redefine:
- navigation
- typography hierarchy
- accessibility
- button semantics
- error/loading patterns

## Acceptance

- WALK never shows more than one contextual object label.
- WALK never shows room rail + tour pill + detail card simultaneously.
- INSPECT preserves visible 3D context.
- NAVIGATE is temporary.
- touch movement remains >=44px and safe-area aware.
- reduced-motion path remains usable.

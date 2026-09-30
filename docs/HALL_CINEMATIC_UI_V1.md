# Hall Cinematic UI V1

## Goal

Make the 3D world the visual heart of the product while keeping the interaction model safe, discoverable and consistent with the global KONA shell.

The shell owns product identity. Rooms own atmosphere.

## Interaction modes

### WALK
Primary content: the world.

Visible:
- logo/back context;
- movement control where required;
- one nearby/context signal.

Receding:
- navigation utilities;
- room rail;
- passive labels.

### INSPECT
Primary content: one artifact inside the live world.

Visible:
- artifact card/sheet;
- one primary artifact action;
- selected engineering labels.

Hidden/receding:
- room rail;
- nearby prompt;
- movement control;
- unrelated labels;
- global navigation chrome.

### NAVIGATE / GUIDED TOUR
Primary content: orientation.

Visible:
- tour/navigation guide;
- world.

Hidden/receding:
- room rail duplication;
- nearby prompt.

## Visual hierarchy

Target ratios:
- walking: 85–90% world / 10–15% chrome;
- inspecting: ~65% object/world / 35% information;
- deep reading: content may temporarily dominate, but 3D remains visually connected.

## Color contract

Global hall chrome:
- neutral surfaces;
- lava for action/selection/progress;
- reef/info only where semantic information is needed.

Partner/room palettes are allowed in:
- environment;
- object/materials;
- lighting;
- room content thumbnails.

Partner palettes must not color generic status/update/movement controls.

## Mobile

Mobile is first-person, not a compressed desktop.

- movement control is smaller but still >=44 px at its active target;
- inspect becomes a bottom exhibit sheet;
- the 3D world remains visible behind the sheet;
- card-open suppresses navigation and nearby prompts;
- safe areas remain mandatory.

## Desktop

Desktop should feel like an exhibit installation:
- chrome recedes while moving;
- controls regain full visibility on hover/focus;
- inspection silences unrelated UI;
- no giant mobile-dashboard layout.

## Non-goals for V1

This slice does not:
- remove existing navigation features;
- change Three.js behavior;
- introduce new proximity logic;
- replace the room rail with a map;
- build a new artifact component;
- change room geometry.

Those belong in later, separately evidenced PRs.

## Acceptance

- world remains usable with all existing features;
- card-open keeps hall canvas alive;
- rail and movement chrome do not compete with artifact inspection;
- guided mode does not duplicate navigation chrome;
- global utility controls use parent accent rather than partner gradients;
- mobile 320/360/390/430 and desktop screenshots show no clipping;
- reduced-motion behavior remains functional;
- existing smoke/unit tests remain green.

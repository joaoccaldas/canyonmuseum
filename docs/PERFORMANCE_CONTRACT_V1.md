# Performance Contract V1

## Entry / Home / Plan / Me / Garage
Forbidden before explicit 3D intent:
- Three.js
- app/hall.js
- GLB
- environment maps
- animation/render loop
- full museum data

Allowed:
- HTML/CSS
- fonts
- one responsive hero image
- app/kona-core.js
- tiny entry/event configuration

## PWA caching
Core cache is the minimum offline app shell. Heavy museum data and 3D assets are verified and cached on first use, not during install.

Caching improves repeat visits; it does not justify eager loading.

## Current bundle ceilings
These are regression ceilings, not performance aspirations:
- kona-core.js <= 80 KiB
- hall.js <= 1 MiB
- studio.js <= 800 KiB
- museum-data.js <= 220 KiB

Ceilings should ratchet downward as modules are decomposed.

## World
Next phase is a single WorldStreamer using distance + visibility + intent + device/network budget and explicit disposal. No room may invent its own permanent loading policy.

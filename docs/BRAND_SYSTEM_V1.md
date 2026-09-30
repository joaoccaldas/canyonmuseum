# KONA Brand System V1

## Global rule
KONA has one global product language. Rooms may express local identity through scoped theme tokens, but navigation, hierarchy, typography, spacing, accessibility, interactions and evidence styling remain global.

## Typography
- UI/body: Manrope
- Display/editorial: Instrument Serif
- Technical/data: system monospace stack
- Global font-size tokens live in `web/styles/system.css`.

## Core light palette
- background: #f4efe7
- surface: #fbf9f5
- text: #12181d
- muted: #5f6a72
- faint: #8e979d
- accent/orange: #e85a22
- cyan/info: #1db7d8
- success: #2bbf88

## Core dark palette
- background: #071116
- surface: #0d1920
- text: #f5f3ee
- muted: #b4c0c8
- faint: #7f929e
- accent/orange: #ff6a22
- cyan/info: #39c8ef
- success: #55d6a0

## Component language
- rounded surfaces
- minimum 44px touch targets
- bottom navigation on mobile
- serif display + sans UI
- evidence labels in compact uppercase sans
- strong safe-area handling
- reduced-motion support
- theme-independent semantic states (success/warning/error/info)

## Room theming
Room identity must be data, not hardcoded conditional logic.

Each room may define:
- accent palette
- secondary palette
- lighting
- material presets
- ambient treatment
- typography overrides only when explicitly justified
- hero treatment
- display-plinth treatment

Each room may NOT redefine:
- core navigation behavior
- accessibility semantics
- touch target sizes
- data-card hierarchy
- error/loading patterns
- consent/disclosure patterns
- evidence classes

## Required design-token hierarchy
```
GLOBAL TOKENS
  typography
  spacing
  radii
  motion
  semantic colours
  navigation
  accessibility

ROOM THEME TOKENS
  accent
  materials
  lighting
  environmental colour
  display style
```

## Change control
Any global brand change must include:
1. token change, not scattered CSS literals
2. light/dark visual matrix
3. mobile portrait + landscape proof
4. accessibility contrast check
5. no room-specific regression
6. screenshot evidence attached to PR

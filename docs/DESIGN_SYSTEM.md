# KONA Design System

## Principle

**Quiet interface. Dramatic moments. Rich world when chosen.**

The UI should feel editorial, human and slightly unexpected: premium enough for performance detail, loose enough to leave room for handwritten notes, bright accents and real-world texture. The 3D world and photography carry drama; interface chrome stays calm.

## Typography

- UI/body: Manrope.
- Editorial/display: Instrument Serif.
- Technical/data: system monospace.
- Handwritten language is an image/illustration layer, not a replacement UI font.
- Do not introduce Inter, Arial, Helvetica or a second display family into product UI.

## Core colors

Light foundations:
- Sand: #f4efe7
- Paper: #fbf9f5
- Mist: #e6e9ed
- Blush: #fad8d6
- Ink: #12181d
- Muted: #5f6a72

Dark foundations:
- Background: #071116
- Surface: #0d1920
- Text: #f5f3ee
- Muted: #b4c0c8

Expression accents:
- Sunrise: #ff6a00
- Ember: #ff6a3d
- Ocean: #138a8f
- Aqua: #00c2c8
- Electric aqua: #00e5ff
- Hibiscus: #ff3d78
- Raspberry: #ff206d
- Lilac: #c984ff
- Cobalt: #2e68ff
- Acid: #d7ff3f
- Grape: #8b5cf6

Use accents sparingly. Sunrise/ember is the default action energy. Ocean/aqua communicates discovery and information. Pink/lilac/acid belong to playful or collectible moments, never core navigation by default.

## Shape and spacing

- Primary actions: pill geometry.
- Cards: 20–26 px radius.
- Small controls: 10–14 px radius.
- Minimum touch target: 44 px.
- Spacing rhythm: 8 / 12 / 16 / 24 / 32 / 48.
- Respect all safe-area insets.

## Interaction

- One dominant primary action per surface.
- Secondary controls remain visually quiet.
- No hover-only critical action.
- Motion uses transform/opacity where possible and must be disabled or effectively instant under reduced-motion preferences.
- 3D loads only after explicit Explore intent.
- Room themes may vary, but navigation, accessibility, evidence, error and consent patterns remain global.

## Mobile information architecture

The canonical five destinations are:
1. Home
2. Discover
3. Garage
4. Plan
5. Me

Do not create a second mobile navigation vocabulary for individual rooms.

## Brand language

Core territory:
- Race the version of yourself you haven’t met yet.
- Start somewhere.
- Same ocean. New you.
- Scared counts too.
- A braver you lives here.
- Progress looks good on you.

Voice pillars: brave, inclusive, precise, playful. Copy should be short, human and useful. Performance detail can be exact without becoming sterile.

## Visual QA

Every material UI change requires:
- phone portrait
- phone landscape where relevant
- desktop
- light/dark where relevant
- overflow/clipping check
- active navigation check
- safe-area check
- reduced-motion check
- no new 3D loading before explicit intent

# WHY route — brand, story and implementation contract

## Purpose

The WHY route is the promotional/editorial layer that explains the product without turning the core app into a marketing site. It should feel like KONA in the wild: precise enough to trust, playful enough to explore, and visually connected to the real places and artifacts already inside the product.

This document contains no biographical identifiers. The public story is intentionally anonymous and first-person.

## Design intent

The route follows the canonical KONA system already present in the repository rather than introducing a parallel style authority.

### Visual hierarchy

1. **Warm editorial canvas** — Sand is the default surface. Dark/lava is reserved for contrast, photography and destination moments.
2. **Editorial serif** — Instrument Serif carries large emotional headlines and long-form narrative.
3. **UI sans** — Manrope owns navigation, controls, labels and explanatory copy.
4. **Handwritten layer** — Caveat is used sparingly for margin thoughts, side quests and self-aware commentary.
5. **Sunrise accent** — orange marks motion, CTAs, underlines and the story's forward path.
6. **Ocean / hibiscus / lime** — remain supporting accents from the canonical palette; this route does not create new brand colors.
7. **Artifact grammar** — photography behaves like field material rather than generic rounded SaaS cards. Notes can rotate slightly; UI controls remain clean and aligned.
8. **Whitespace** — vulnerability and emotional copy are given breathing room instead of visual drama.

## Voice

The voice follows four rules:

- **Brave**: say the simple thing plainly.
- **Inclusive**: invite rather than prescribe.
- **Precise**: short sentences, concrete objects, real progression.
- **Playful**: side quests and self-aware asides are allowed, but the joke never overwhelms the story.

The narrative should demonstrate non-linearity rather than clinically explain it. The reader experiences the detour and then returns to the main route.

## Story architecture

The route exposes three depths instead of forcing one long biography-style page:

- **The Short Version** — about 15 seconds.
- **The Scenic Route** — about one minute; makes the puzzle metaphor visible.
- **The Unfiltered Version** — the full wandering version, with one deliberate side quest.
- **Final destination** — returns attention to the product with a simple invitation to explore.

The progression is intentionally object-based:

`Training → Excel → AI → Bikes → Room → Museum → Island`

This is both narrative and interaction design. The user can stop after any layer.

## Reuse and architecture

- `why.html` is a thin document shell.
- `web/src/why-story.js` owns route state, story data and rendering.
- `web/styles/why.css` owns only the WHY route.
- Canonical palette, type families, spacing and artifact semantics continue to come from:
  - `brand/tokens.css`
  - `brand/themes.css`
  - `brand/typography.css`
  - `brand/artifacts.css`
  - `web/styles/components.css`
- Existing repository imagery is reused. No duplicate photo set is introduced.
- The route uses query-state deep links:
  - `why.html`
  - `why.html?story=short`
  - `why.html?story=scenic`
  - `why.html?story=unfiltered`
  - `why.html?story=final`

## Responsive behavior

Desktop behaves like an editorial spread with a sticky lightweight header, two-column story layouts and field-note imagery.

Mobile is not a scaled desktop layout. It becomes a vertical story:
- hero image first;
- one story choice per row;
- single-column narrative;
- sticky content is removed;
- visual notes become inline;
- touch targets remain at least 44–48 px;
- horizontal image strips use scroll snapping rather than compression.

## Accessibility and performance

- Semantic headings and navigation landmarks.
- Keyboard focus is moved to the new story heading after in-page routing.
- Back/forward browser navigation works through history state.
- Reduced-motion preference disables decorative movement.
- Existing compressed imagery is reused.
- No 3D runtime is loaded by the WHY page.
- No tracking, profile state or account data is read.
- No new global CSS authority is introduced.

## Non-goals

- Do not duplicate the app navigation shell.
- Do not turn the WHY route into a training dashboard.
- Do not add new palette or font definitions.
- Do not add personal names, contact details, account identifiers or private biographical details.
- Do not make the narrative responsible for product configuration or authentication.

## Acceptance criteria

- The page visually reads as the same KONA brand as the current approved system.
- All three story depths and the final CTA are directly reachable.
- Layout works from narrow mobile through large desktop.
- Route-specific CSS does not leak into the museum, Studio, Home or race surfaces.
- Existing brand tokens remain the single source of truth.

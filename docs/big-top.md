# Big Top theme

**Big Top** is the production Daylight theme for aitamer.news: bright-but-soft candy-shop poster editorial — pastel desk chips, warm blurred shadows, geometric house covers. Not SaaS glass. No gradients.

Canonical token extract: `/workspace/atn-design-options/bigtop-tokens.md` (from the Claude artifact).

## Daylight tokens

| Token | Value |
|-------|--------|
| paper | `#fff8f0` |
| paper-raised | `#ffffff` |
| paper-sunk | `#fdf0e4` |
| ink | `#241c30` |
| ink-muted | `#6b6078` |
| line | `#e6dde9` |
| shadow-tint | `#e7d9ea` (soft blur shadows, not hard offsets) |
| highlight | `#ffe8b0` |
| correction | `#ce2556` |
| human-fill | `#ffd6c2` |
| bot-fill | `#c7ead9` |

Fonts: **Bricolage Grotesque** (display), **Instrument Sans** (reading), **Martian Mono** (machine).

Night show tokens live under `[data-theme="night"]` in `global.css` but are not shipped as the default.

## Section covers

House-owned SVGs at `public/covers/{slug}.svg` for every `ALL_SECTIONS` desk.

| slug | motif |
|------|--------|
| top | rings |
| models | stacked layers |
| tools | modular blocks |
| image | overlapping lenses |
| video | film + play |
| data | bars |
| databases | cylinders |
| rust | hex nuts |
| policy | columns |
| opinion | speech bubbles |

**Legal:** original house SVG art — not stock photos, not third-party logos. Caption: “Generated cover art (X motif). Not a photo.”

Regenerate: `python3 scripts/generate-covers.py`

`src/lib/covers.ts` maps sections → paths; `postCover(post)` prefers custom `heroImage`.

## Scope

`/design-lab/` keeps its own scoped theme CSS. Big Top applies to the main site shell only.

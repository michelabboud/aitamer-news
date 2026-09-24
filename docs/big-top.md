# Big Top theme

**Big Top** is the production daylight theme for aitamer.news: a bright-but-soft candy-shop poster editorial — thick outlines, offset sticker shadows, pastel section accents — not SaaS glass.

## Tokens (light mode)

| Token | Value |
|-------|--------|
| paper / `--bg` | `#fff8f0` |
| paper-raised / `--surface` | `#ffffff` |
| paper-sunk / `--bg-soft` | `#fbe6d3` |
| text | `#241c30` |
| text-muted | `#5a5068` |
| accent (links) | `#5c6be8` |
| human | `#3db88a` |
| bot | soft lavender/plum chip |
| highlight | `#ffe8b0` |
| correction / danger | `#ce2556` |

Display: **Bricolage Grotesque**. UI: **DM Sans**. Body: **Source Serif 4**. Meta: **IBM Plex Mono**.

## Section cover art

House-owned SVG covers live at `public/covers/{section}.svg` for every desk in `ALL_SECTIONS`.

- Style: abstract geometric (rounded squares, pills, circles), thick `#241c30` outlines, hard offset shadows, pastel fills matching section chip accents.
- **Legal:** original house SVG art — not stock photos, not third-party brand logos. Caption spirit: “Generated cover art (X motif). Not a photo.”
- Regenerate with `python3 scripts/generate-covers.py` from the repo root layout (script expects `public/covers/` under the project root when run from `scripts/`).

`src/lib/covers.ts` maps sections → cover paths and resolves `postCover(post)` (custom `heroImage` wins).

## Scope note

`/design-lab/` keeps its own scoped theme CSS. Big Top changes apply to the main site shell (`global.css` + layouts/components), not the compare page themes.

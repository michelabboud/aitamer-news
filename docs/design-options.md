# Design theme options

Three **mutually exclusive** bright theme candidates for aitamer.news. Each lives on its own branch / PR — **pick one** and merge only that PR. Do not merge all three.

| Option | Branch | Vibe |
| --- | --- | --- |
| **A — Daylight Editorial** | `design/option-a` | Soft cream paper newsroom, sky accent, serif heads |
| **B — Aurora Desk** | `design/option-b` | Cool aurora glass, lavender/mint, geometric sans |
| **C — Citrus Signal** | `design/option-c` | Warm paper, teal + citrus, assertive sans heads / serif body |

Tokens and 3D notes were remapped onto existing Astro selectors in `src/styles/global.css` (`.site-header`, `.post-card`, `.chip`, `.badge`, `.article`, etc.) so templates keep working.

Accessibility (all options): skip link, visible `:focus-visible`, Human/Bot badges with text labels, `prefers-reduced-motion` disables transforms.

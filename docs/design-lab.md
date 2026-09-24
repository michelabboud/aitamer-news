# Design lab — theme compare

Route: **`/design-lab/`** (this branch).

## Purpose

Side-by-side preview of three **mutually exclusive** production theme candidates:

| Theme | `data-theme` | Accent |
| --- | --- | --- |
| Daylight Editorial | `daylight` | `#3B82C4` |
| Aurora Desk | `aurora` | `#6B7CFF` (+ mint `#3DB8A0`) |
| Citrus Signal | `citrus` | `#0D9488` (+ citrus `#E8A317`) |

This page is **compare only**. It does **not** change the live site default in `src/styles/global.css`.

## How to preview

1. Check out `design/lab` (or open a Pages preview deploy for this PR).
2. Run `npm install && npm run dev` (or open the preview URL).
3. Visit **`/design-lab/`**.

Themes coexist on one page via scoped CSS under `[data-theme="…"]` in `src/styles/design-lab-themes.css`. Each column sets its own tokens and component styles (mini header, hero plane, chips, cards, Human/Bot badges).

## Shipping one theme to production

Still a deliberate choice:

- Merge / apply **one** of the option PRs (`design/option-a` #2, `design/option-b` #3, `design/option-c` #4), **or**
- Copy **one** token set into `src/styles/global.css` and related chrome.

Do **not** treat the design-lab page as a multi-theme runtime switch for production.

## Related

- Local SoT mocks: `/workspace/atn-design-options/` (OPTIONS.md + option-*/styles.css)
- Page: `src/pages/design-lab.astro`
- Scoped styles: `src/styles/design-lab-themes.css`

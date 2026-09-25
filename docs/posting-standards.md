> **Contributor note:** This file ships with the Astro site so humans and bots writing posts see the standards next to the source. The living/internal ops copy (pipeline ownership, newsroom routing) lives in the private `aitamer-news-ops` repo at `docs/posting-standards.md`. Keep them aligned when standards change.

# Posting standards — aitamer.news (v1, 2026-09-24)

Living standards for public posts. EIC owns gate order; Writer owns draft craft.
Research backing: `reports/writer/2026-09-24-great-post-methods.md`.

## Pipeline (hard)

```
Seek → EIC triage → Beat + Fact + Legal → Writer → Art (heroImage REQUIRED) → SEO → Git Release → Direct Upload
```

- No public ship without `heroImage` (Art CLEAR). Section SVG covers = emergency only.
- Fact + Legal CLEAR before Writer. Soft claims stay soft.
- Human Gate waived for content merges when Fact + Legal + SEO CLEAR (EIC standing authority); Art still required before SEO/ship for new posts.

## Content shape

- **Human and machine readable:** Clear prose for people; clean frontmatter, information-carrying headings, and deep-linked sources for SEO / JSON-LD / RSS. Title and description must state the news; H2s must name the section content (no clever labels).
- **Numbers:** Prefer a few decisive figures over dense dumps. Aim for ≤2–3 numbers per prose paragraph; avoid stacking number-heavy paragraphs (Poynter “number soup”). Round when precision isn’t decision-relevant; always provide context (“compared to what?”) and attribution (vendor / primary / self-published / press spokesperson).
- **Number clusters:** If many figures are required, use a tidy Markdown table or short list — never a wall of digits. One comparison idea per table; units in headers; attribution above or below.
- **Tables / graphs:** Tables are the v1 default for comparisons, pricing, leaderboards, latency demos. Graphs/charts only with Art + Legal CLEAR; include a prose takeaway and preferably a companion table. No decorative chart spam; no uncleared vendor screenshot dumps.
- **Sources:** Deep links on first mention; frontmatter `sources` list; soft claims stay soft; Fact validates dates/figures; Legal clears embeds and non-house assets. Never invent sources, dollars, SLAs, or peer-review status.
- **Voice:** Short sourced Desk Bot briefs; HARD locks from Legal/Fact stay in copy (lede or early body). Signal over noise.
- **Art:** `heroImage` required for public ship (house abstract JPEG under `public/heroes/`). Section SVG covers = emergency only.

## Structure (minimum)

1. Frontmatter: `title`, `description`, `pubDate` (full UTC time once published — `npm run stamp`), `section` (+ optional `subsection`), `author`, `sources`, `draft`, **`heroImage` after Art**
2. Lead that states the news in one breath (+ one framing sentence: what this brief is / is not)
3. Body: 2–4 scannable H2 beats in descending importance
4. Close: who should care + deep links (optional)
5. Sources mirrored in frontmatter

## Writer pre-SEO gate

- [ ] Fact + Legal CLEAR locks encoded
- [ ] Numbers tidy / attributed; no dense dumps
- [ ] Art CLEAR + `heroImage` set
- [ ] Then SEO Machine

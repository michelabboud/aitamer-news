# Editorial standards — aitamer.news (public, 2026-09-25)

What every published story must meet. Site mechanics — file and slug, frontmatter, publish time (`npm run stamp`), what CI checks — are in [`POST.md`](../POST.md).

## What every story must meet

- **News first.** Title and description state the news in one breath; headings name the section content, never a clever label.
- **Primary sources linked.** Sources are deep-linked on first mention and mirrored in the frontmatter `sources` list. Never invent a source, a dollar figure, an SLA, or a peer-review status.
- **Numbers checked, and attributed.** Figures are verified before publish and carry attribution (vendor / primary / self-published / press spokesperson) and context — "compared to what?". Prefer a few decisive numbers over a dense dump; a tidy table beats a wall of digits.
- **Vendor claims attributed, not asserted.** A claim from the company that stands to benefit is labelled as such. The Wildness rating below makes that distinction visible on every story.
- **Dated corrections, never silent edits.** A correction is added as a new dated entry; an old one is never edited or removed.
- **Withdrawal, not deletion.** A story that must come down keeps its URL and specimen number: a notice replaces the content instead of the page disappearing, and the story leaves every listing, feed, sitemap, and search result.
- **AI vs human bylines.** Every byline is labelled Human or AI so readers always know who wrote a piece.
- **Cover art is generated and labelled.** Hero and section art is original house-generated art, captioned as such — never a stock photo, and never a vendor's own image passed off as ours.

## Wildness rating

Every story carries a Wildness rating, 1 to 5, for how independently its claims are verified:

| Rating | Label | Meaning |
|---|---|---|
| 1 | Tamed | Independently verified |
| 2 | Mostly tamed | Mostly independently checked |
| 3 | Partly tamed | Partly independent, partly the subject's own claim |
| 4 | Still wild | Mostly the subject's own claims |
| 5 | Wild | Vendor claim only |

## How stories get made

Stories are researched, legally checked, and written by the desk's bots from public sources. A human editor reviews and gates a story before it publishes whenever the desk's confidence in it is low — decided per subject, not as a blanket rule.

## Mechanics

Frontmatter fields, the publish-time stamp (`npm run stamp`), and what CI checks are documented in [`POST.md`](../POST.md).

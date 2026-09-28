# Headlines are set in Newsreader; Gloock stays for the brand

## Context

The Bestiary redesign (0.2.0) set every headline in **Gloock**, a single-weight display serif. The reading-typography change of 0.2.47 (`docs/reports/2026-09-28-reading-typography.md`) raised card titles from 24 to 28 px and set their letter-spacing to 0 to help Gloock's thin strokes. On the live site Michel still found the headline letters dense: "the characters are dense, almost touch each other; not very sure about the font".

We measured it. On a canvas with the real fonts, over the 1,570 letter pairs of the 36 home-page card titles and the agentgateway review's title, we took the clear space between the ink of neighbouring letters, and the thickness of the thinnest and thickest strokes of "o". "Touching" means less than half a pixel of clear space, where antialiasing merges two letters on screen.

| Treatment | Mean gap | Pairs touching | Thinnest stroke | Thickest stroke |
|---|---|---|---|---|
| A: Gloock, card 28 px, letter-spacing 0 (0.2.47 as built) | −0.06 px | 74% | 0.35 px | 4.5 px |
| B: Gloock, card 28 px, +0.01em | +0.21 px | 59% | 0.35 px | 4.5 px |
| C: Newsreader 600, card 28 px, optical size 28 | +0.83 px | 23% | 1.19 px | 3.6 px |
| A: Gloock, article title 52 px, −0.015em | −1.44 px | 86% | 0.65 px | 8.3 px |
| B: Gloock, article title 52 px, +0.005em | −0.40 px | 62% | 0.65 px | 8.3 px |
| C: Newsreader 500, article title 52 px, optical size 52 | +0.02 px | 45% | 1.30 px | 6.5 px |
| A: Gloock, article title 36 px (phone), −0.015em | −1.00 px | 90% | 0.45 px | 5.8 px |
| C: Newsreader 500, article title 36 px (phone) | +0.86 px | 24% | 1.35 px | 4.0 px |

Gloock is drawn tight, with serifs that nearly meet, and its stroke contrast is 12.8:1: at card size its hairlines are a third of a pixel. Michel compared screenshots of A, B and C (home cards and an article title, at 1280 and 390 px) and chose C on 2026-09-28.

## Decision

1. **Every headline is Newsreader** (Production Type for Google Fonts; SIL Open Font License), through one token, `--font-headline`: the `h1`–`h4` default, card, lead, article, page and About titles, section heads, and the smaller named labels that read as headings (the verdict label, writer and tamer names, month names, the wildness scale's names, the vocabulary terms, search result titles, video titles). `font-optical-sizing: auto` (the browser default, stated) lets the optical-size axis pick a sturdier cut at card sizes and a finer one at 52 px.
2. **Weights:** 600 for card titles and the front-page lead title (so the lead is not lighter than the cards beside it), 500 for everything else. Only 500–600 is loaded: `Newsreader:opsz,wght@6..72,500..600`, one variable file of about 132 KB for Latin. Letter-spacing is 0 on every Newsreader heading; Gloock's negative tracking is gone with it.
3. **Sizes:** card titles 29 px, 27 px where cards sit three across. Newsreader's lowercase is shorter than Gloock's (x-height 0.450 against 0.510 of the size) but its letters are narrower (0.443 against 0.459 per character), and at 29/27 the titles wrap as the approved Gloock 28/26 did: identically at 1280 px (on `/news/`, 17 three-line and 2 four-line titles in both; on the home page, 27 and 5), within one title on `/news/` at 1100, 1024, 820 and 390 px, and with three more four-line titles on the home page at 820 px (12 against 9). 30/28 wrapped visibly more. Other sizes are unchanged.
4. **Gloock (`--font-display`) stays for the brand only:** the wordmark (`.wordmark__name`), the footer name (`.site-footer__name`), the paper specimen tag's name (`.specimen-tag__name`), the big figures (`.stats dd`, `.watch-item__big`) and the writer monogram (`.writer__initials`). These are marks and numerals, read at a glance, not headlines read word by word.

## Alternatives rejected

- **A, keep Gloock as built.** 74% of letter pairs in card titles, and 86% in the article title, sit closer than half a pixel; the hairlines stay at 0.35 px on a dark ground. It does not answer the complaint.
- **B, Gloock with slight positive tracking** (+0.01em on cards, +0.005em on larger titles). It moves the letters apart by 0.28 px at card size: still 59% touching, 62% in the article title, and the strokes are exactly as thin. Tracking large enough to separate Gloock's letters would look like loosely set display type.
- **Other text serifs** (Literata, Source Serif 4) were weighed in the research report (§2.3) for body text, not headlines; Newsreader was its headline option because it was drawn for news streams and has an optical-size axis. Not measured separately here.

## Consequences

- One more font download, about 132 KB, from the Google Fonts hosts the Content-Security-Policy already allows (`fonts.googleapis.com`, `fonts.gstatic.com`); `check:csp` passes unchanged.
- The site now shows two serifs: Gloock in the brand marks, Newsreader in the headlines. The wordmark carries the Bestiary identity; the headlines carry the news.
- A heading that asks for another family must set its own weight: the `h1`–`h4` default is now 500, and IBM Plex Mono and Hanken Grotesk have a real 500 (`.panel__label` and `.site-footer h2` set 400).
- Italic Newsreader is not loaded; an `<em>` inside a heading gets the browser's slanted roman. Load the italic axis if headlines start using it.

## Status

Accepted, 2026-09-28 (Michel's choice of option C). Amends the Bestiary's type pairing in `docs/bestiary.md`.

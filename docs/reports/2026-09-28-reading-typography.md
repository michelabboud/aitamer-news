# Reading typography for aitamer.news — fonts, colour, size, and image-versus-headline

*Research report, 2026-09-28. Read-only on the repo; nothing was changed. Numbers marked "measured" were computed in this scratchpad (`contrast.py`, `metrics.py`, `pick.py`) from the real token values and from the font files Google Fonts serves.*

---

## The recommendation, first

**Keep both typefaces. Change size, line length, spacing, the two secondary greys, and the card layout.** The research does not show that swapping fonts would make the site easier to read. It does show that the things below help:

1. **Body text one pixel up, with more leading.** Site text 17 → 18 px at line-height 1.6; article text 18 → 19 px at 1.7.
2. **Shorter lines in articles.** Today the article column holds about **81 characters per line**. That is above the usual 45–75 range and above the 80-character ceiling in the WCAG AAA line-width rule. Setting the column to `58ch` brings it to about **70 characters**.
3. **Brighter secondary greys.** The body colour (`--bone #ece6d6`) is already about as good as it gets, so leave it. But `--ink-soft` is used for text people actually read (article lists, ledes, card descriptions), and it sits just under the recommended minimum contrast for body text. `--ink-muted` is used on 10–11 px labels, where its contrast is far too low. New values: `#d1d3c9` and `#aeb5ad`.
4. **Card headlines 24 → 28 px, with slightly looser leading.** At 24 px, Gloock's thin strokes measure **0.29 px**, less than a third of a pixel. On a dark background they break up, which is a big part of why the title looks weaker than the picture.
5. **Show the art at its real shape, and let it step back a little.** Every hero image is 1600×900 (16:9). Cards crop them to 3:2 and the lead crops them to 4:3. Showing them at 16:9 makes the image about 16% shorter on cards and stops cutting off the sides of the art. An optional slight dimming, which lifts on hover, lets the headline lead.

The exact change list, with old and new values, is in section 6.

---

## 1. What the site does today (measured)

| Element | Selector | Font | Size / line-height | Colour | Notes |
|---|---|---|---|---|---|
| Site body | `body` | Hanken Grotesk 400 | 17 px / 1.55 (16 px under 720 px) | `--bone` | |
| Article text | `.article__body` | Hanken Grotesk | 18 px / 1.65 (17 px on phones) | `--bone` | max-width `68ch` = **81.5 characters per line** (measured) |
| Article lists | `.article__body ul, ol` | Hanken Grotesk | 18 px | **`--ink-soft`** | dimmer than the paragraphs next to them |
| Lede | `.lede`, `.article__header .lede` | Hanken Grotesk | 18–19 px / 1.55 | `--ink-soft` | |
| Card title | `.card__title` | Gloock 400 (it has only one weight) | **24 px / 1.1**, tracking −0.01em (inherited) | `--bone` | |
| Lead title | `.lead__title` | Gloock | 52 px / 1.0, −0.015em; `clamp(30px, 4.6cqi, 48px)` in the front column; 30 px / 1.02 on phones | `--bone` | |
| Article title | `.article__title` | Gloock | `clamp(2.25rem, 5vw, 3.25rem)` / 1.0 | `--bone` | |
| Headings, default | `h1–h4` | Gloock | line-height 1.05, −0.01em | | |
| Card kicker | `.card__meta` | IBM Plex Mono | **10 px**, uppercase, +0.1em | `--ink-muted` / writer colour | |
| Card footer | `.card__wl`, `.card__comments` | IBM Plex Mono | **10 px** | `--ink-muted` | |
| Card description | `.card__desc` | Hanken Grotesk | 15 px / 1.5 | `--ink-soft` | |
| Card image | `.card__photo img` | — | `aspect-ratio: 3 / 2` | | the source images are 1600×900 (all 35 heroes measured) |
| Lead image | `.specimen-photo img` | — | `aspect-ratio: 4 / 3` | | same 16:9 sources, 25% of the width cropped away |

**There is no light theme.** `html { color-scheme: dark }` is the only scheme, and no `prefers-color-scheme` or `data-theme` rule exists.

### Font metrics (measured from the Google Fonts files)

| Font | x-height / em | Average character width / em | Characters in `68ch` | Stroke contrast of "o" |
|---|---|---|---|---|
| Hanken Grotesk 400 (current body) | 0.493 | 0.467 | 81.5 | low (sans) |
| **Gloock** (current display) | 0.508 | 0.484 | — | **13.5 : 1** — stem 0.162 em, hairline **0.012 em** |
| Inter | 0.546 | 0.496 | 86.4 | low |
| Noto Sans | 0.536 | 0.493 | 79.0 | low |
| Atkinson Hyperlegible Next | 0.496 | 0.459 | 96.0 | low |
| Literata (opsz 12–18) | 0.507 | 0.497 | 79.3 | ≈ 1.8 : 1 |
| Newsreader (opsz 16) | 0.441 | 0.441 | 87.3 | ≈ 2 : 1 |
| Source Serif 4 (opsz 16) | 0.486 | 0.487 | 72.5 | ≈ 2 : 1 |

What a Gloock hairline measures at each size: **24 px → 0.29 px**, 28 px → 0.34 px, 32 px → 0.38 px, 48 px → 0.58 px, 52 px → 0.62 px. Its stems are 3.9 px at 24 px. Gloock's own description on Google Fonts calls it a display face "intended for display use", and it works best at large sizes. Card titles are the one place where it is being used below its comfort range.

I checked a second-hand claim that Hanken Grotesk's lowercase "l" is a plain bar that looks like capital "I". It is false. In the font file, "l" has a tail and a different outline (10 path segments against 5 for "I"). This matters on a site full of names like "Llama 3.1": Hanken distinguishes l, I and 1, while Inter's default "l" and "I" are both plain bars.

---

## 2. Fonts: what the evidence says

### 2.1 No font is the best font for everyone, and people's favourite is not their fastest

- **Wallace et al. 2022** ([ACM TOCHI 29(4) art. 38](https://dl.acm.org/doi/10.1145/3502222); [free PDF](https://jeffhuang.com/papers/Readability_TOCHI22.pdf)). This is the Readability Consortium study (Adobe, Google, the University of Central Florida and Readability Matters): 16 fonts, sizes normalised to Times at 16 px by x-height, hundreds of participants.
  - Readers were **35% faster in their fastest font than in their slowest** (314 against 232 words per minute), with no loss of comprehension.
  - **Preference did not predict speed.** People read fastest in their favourite font only 20% of the time, which is exactly chance. 73% of them believed their favourite would be their fastest.
  - The most-preferred font was **Noto Sans**, a humanist sans with a large x-height. EB Garamond and Montserrat tended to help readers over 35.
  - The authors' conclusion: *"there was not a single font that increased reading speed for everyone."* Their practical advice is to let readers choose (individuation).
- **Serif against sans.** Arditi & Cho 2005 ([Vision Research 45(23)](https://www.sciencedirect.com/science/article/pii/S0042698905003007)) built fonts that differed only in whether they had serifs. They found no effect on reading speed, and a tiny legibility gain at threshold sizes that the extra spacing serifs add explains. Wallace et al. also found no category-level winner. **Serif against sans is not a readability decision. It is a voice decision.**
- **Size is judged by x-height, not by the nominal font size.** Legge & Bigelow 2011 ([Journal of Vision 11(5):8](https://jov.arvojournals.org/article.aspx?articleid=2191906)) is the standard review of print size and reading speed. Beier's work on letter width and spacing ([Information Design Journal 26(1), 2021](https://benjamins.com/catalog/idj.19033.bei)) and the [Readability Matters summary on x-height](https://readabilitymatters.org/articles/research-highlight-how-important-is-x-height-for-font-legibility) agree. Hanken's x-height (0.493) is mid-range: smaller than Inter (0.546) and Noto Sans (0.536), larger than Newsreader text (0.441). **That argues for setting Hanken a touch larger, not for replacing it.**

### 2.2 What this means for aitamer.news

The site's identity is the Bestiary pairing: Gloock headlines as a newspaper field guide, Hanken Grotesk for reading, IBM Plex Mono for the field data (see `docs/bestiary.md`). No study says a different body font would read measurably better for this audience. Wallace et al. say the opposite: the spread between individuals is larger than the spread between fonts. Swapping the body face would spend identity and bytes for a gain nobody can demonstrate. **The gains we can show come from size, measure, leading and contrast** (sections 3 and 4).

### 2.3 Ranked shortlist

**A — Recommended: keep Hanken Grotesk for body and Gloock for display, but give Gloock a 28 px floor.**
- *Pros:* no identity change and no new font download. It fixes the real weak spot, Gloock's sub-pixel hairlines at card size. Hanken's l/I/1 are distinct, its apertures are open, it has weights from 100 to 900, and it has real italics.
- *Cons:* Gloock still has a single weight, so title hierarchy can only come from size and space, never weight.

**B — Card and section titles in Newsreader; Gloock kept for the lead, article and page titles, and the wordmark.** ([Google Fonts](https://fonts.google.com/specimen/Newsreader), [Production Type](https://productiontype.com/font/newsreader))
- *Pros:* Google Fonts commissioned it from Production Type for "continuous on-screen reading in content-rich environments", which means news streams. It has an optical-size axis (6–72) and weights from 200 to 800. At 24–30 px the browser picks a sturdier cut automatically (`font-optical-sizing: auto`), so a 500–600 weight card title stays solid on dark.
- *Cons:* it adds a second serif voice next to Gloock, which risks muddying the Bestiary look. It adds one more variable-font download (about 60–100 KB for Latin, from Google's CDN). Its text x-height is small (0.441). I would try it only if option A still reads weak once built.

**C — Body in Literata** ([TypeTogether](https://www.type-together.com/literata-font), [Google Fonts](https://fonts.google.com/specimen/Literata)).
- *Pros:* designed for Google Play Books, "comfortable enough to read a whole digital novel", on every kind of screen. It has an optical-size axis and a strong x-height (0.507). A serif body with Gloock headlines would feel like a book.
- *Cons:* it changes the site's voice from a technical field station to literary. There is no evidence of a speed gain. It needs a second variable file. This is the pick if Michel ever wants a "long read" mode.

**D — Body in Atkinson Hyperlegible Next** ([Braille Institute](https://www.brailleinstitute.org/freefont/), [Google Fonts](https://fonts.google.com/specimen/Atkinson+Hyperlegible+Next)).
- *Pros:* built to tell similar characters apart for low-vision readers. It has seven weights, a variable version and a mono companion.
- *Cons:* a distinctive, slightly quirky texture that clashes with Gloock. It is wide (96 characters in `68ch`). It is better offered as a reader option than used as the default.

**E — Inter or Noto Sans for body.**
- *Pros:* the largest x-heights of the shortlist. Noto Sans was the most-preferred font in Wallace et al.
- *Cons:* generic: this is the look Michel's brief warns against. Inter's default "l" and "I" are both plain bars. Hanken already does the job.

**Longer-term idea (backlog, not part of this change):** a reader font switch, for example "Reading font: Grotesk / Serif (Literata)", saved in the browser's localStorage. This is the one intervention Wallace et al. actually recommend. On a static site it needs a small script and a CSP hash.

---

## 3. Text colour on the dark background

### 3.1 Evidence

- **Dark mode costs something, and warm off-white on near-black keeps the cost down.** Dark text on a light background measurably helps proofreading and acuity for young and old readers alike (Piepenbrock et al. 2013, [Ergonomics 56(7)](https://www.tandfonline.com/doi/abs/10.1080/00140139.2013.790485), [PDF](https://www.psychologie.hhu.de/fileadmin/redaktion/Oeffentliche_Medien/Fakultaeten/Mathematisch-Naturwissenschaftliche_Fakultaet/Psychologie/AAP/Publikationen/2013/Piepenbrock-2013-Positive_display_polarity_is_.pdf)). Sethi & Ziat 2023 ([Ergonomics 66(12)](https://www.tandfonline.com/doi/abs/10.1080/00140139.2022.2160879)) found that light-on-dark raised cognitive load for older adults in bright rooms and for younger adults in dim ones. The site is committed to dark, so the job is to keep that cost small.
- **Pure white on dark glows.** Material Design's dark theme sets high-emphasis text at 87% white and medium at 60%, on a #121212 surface, because bright white "vibrates" and bleeds against dark ([Material Design 2, Dark theme](https://m2.material.io/design/color/dark-theme.html)). The astigmatism "halation" explanation (wider pupils in dark mode blur bright edges) is widely repeated and physiologically plausible, but it rests mostly on reports and on the pupil evidence above, not on a controlled astigmatism study ([overview](https://stephaniewalter.design/blog/dark-mode-accessibility-myth-debunked/)). Adult astigmatism prevalence is around 40%, so the cheap precautions are worth taking: no pure white, no pure black.
- **Text hue.** Fan, Xie et al. 2024 ([Sensors 24(11):3516](https://www.ncbi.nlm.nih.gov/pmc/articles/PMC11175232/)) compared text colours on a dark background: **yellow text caused the least visual fatigue and white came next**, with red the worst. `--bone` is a warm, slightly yellow off-white, which is the right direction.
- **Contrast targets.** WCAG 2.x requires at least 4.5:1 for body text (AA) and 7:1 for AAA. The Accessible Perceptual Contrast Algorithm (APCA, the candidate method for WCAG 3; [APCA in a Nutshell](https://git.apcacontrast.com/documentation/APCA_in_a_Nutshell.html), [ARC Bronze](https://www.readtech.org/ARC/tests/bronze-simple-mode/)) scores contrast as a lightness contrast value, Lc. Its levels: **Lc 90 preferred for body text; Lc 75 minimum for body text** (18 px/400 or larger) and for any text people need to read at 15 px/400 or larger; **Lc 60** for content text that is not body text (24 px/400, or 16 px/700); **Lc 45** for headlines of 36 px/400 or larger; **Lc 30** the absolute floor for "spot readable" text; and **Lc 90 as the suggested maximum** for very large or bold text. WCAG 2's ratio overstates contrast for light-on-dark pairs, which is why APCA matters for a dark site.

### 3.2 Current pairs (measured; APCA shown as |Lc|; negative polarity)

| Pair | WCAG 2 | APCA Lc | Where it is used | Verdict |
|---|---|---|---|---|
| `--bone #ece6d6` on `--night #111513` | **14.78 : 1** | **91.0** | body, titles | **Ideal.** At the preferred body level, not white. Keep. |
| `#ffffff` on `--night` (for comparison) | 18.41 : 1 | 107.1 | — | Too hot; do not go whiter. |
| 87% white on `--night` (Material, for comparison), `#e0e1e0` | 14.04 : 1 | 87.6 | — | Bone is slightly brighter and warmer; both fine. |
| `--ink-soft #c4c9c2` on `--night` | 10.94 : 1 | **72.2** | article lists, ledes, card descriptions, footer | **Below Lc 75** for text people read as body. |
| `--ink-muted #9aa39b` on `--night` | 7.09 : 1 | **50.4** | 10–11 px mono labels, bylines, times | **Far below** what text that small needs. Passes WCAG 2 AA only on paper. |
| `--ink-muted` on `--night-raised #1a201c` | 6.38 : 1 | 49.2 | panels | same problem |
| `--ember-text #ff8a57` on `--night` | 7.91 : 1 | 55.9 | links inside body text | Acceptable as an underlined link inside text; below the body level. |
| `--bot #9cc3ff` / `--ai #f4a3c0` / `--human #f2c46b` on `--night` | 10.23 / 9.51 / 11.30 | 68.5 / 64.7 / 74.2 | writer names in 10 px kickers | fine once the kicker is 12 px |
| `--wild-5 #ff5f3d` on `--night` | 6.10 : 1 | 45.1 | danger states | fine for large or non-text use only |
| `--night` on `--bone` (the specimen tag, "paper") | 14.78 : 1 | 90.4 | tags | good; also the ready-made light-theme pair |

### 3.3 Proposed values

| Token | Old | New | WCAG 2 on `--night` | APCA Lc on `--night` | on `--night-raised` |
|---|---|---|---|---|---|
| `--bone` (body, headlines) | `#ece6d6` | **unchanged** | 14.78 | 91.0 | 89.9 |
| `--ink-soft` (secondary reading text) | `#c4c9c2` | **`#d1d3c9`** | 12.16 | **78.5** | 77.3 |
| `--ink-muted` (labels, meta) | `#9aa39b` | **`#aeb5ad`** | 8.78 | **60.5** | 59.3 |

Both new values are mixed toward the existing palette (ink-soft toward bone, ink-muted toward the old ink-soft), so the green-grey cast stays. The three steps stay clearly apart: 91, 78.5 and 60.5. Headlines stay `--bone`. Hierarchy comes from size, not from brightness, and APCA's Lc 90 ceiling for large text means a whiter headline would add glare, not clarity.

**Light theme:** none exists. The evidence above (Piepenbrock; Sethi & Ziat) says a light option would help some readers, especially older ones and people in bright rooms. That is a backlog item, not this change. If it is built, the palette already has the pair: `--night` on `--bone`, Lc 90.4.

---

## 4. Size, line-height, line length, letter-spacing

### 4.1 Evidence

- **Size.** Rello, Pielot & Marcos, CHI 2016 ([PDF](https://pielot.org/pubs/Rello2016-Fontsize.pdf)), 104 readers with eye tracking. Readability and comprehension rose steadily up to **18 pt (24 px)**, and 10–12 pt hurt understanding. At the site's normal reading distance, 18 → 19 px is a small, safe step in that direction. Because Hanken's x-height is mid-range, 19 px Hanken has a 9.4 px x-height, about what Inter shows at 17 px.
- **Line spacing.** Rello et al. found line spacing mattered only marginally, with only the extremes (0.8 and 1.8) hurting. WCAG 2.2 SC 1.4.8 (AAA) asks for at least 1.5 line spacing and paragraph spacing at least 1.5 times the line spacing ([W3C Understanding 1.4.8](https://www.w3.org/WAI/WCAG21/Understanding/visual-presentation.html)). SC 1.4.12 (AA) requires the layout to survive user overrides of 1.5 line height, 2 em after paragraphs, 0.12 em letter spacing and 0.16 em word spacing ([W3C Understanding 1.4.12](https://www.w3.org/WAI/WCAG21/Understanding/text-spacing.html)). Google Fonts' guidance: leading should grow with the measure ([Choosing a suitable line height](https://fonts.google.com/knowledge/using_type/choosing_a_suitable_line_height)). Light text on dark also reads better with a little more air, because the bright strokes visually spread. **1.6 for UI body text and 1.7 for article text** sits inside every band.
- **Line length.** Bringhurst's 45–75 characters, quoted by [Google Fonts Knowledge](https://fonts.google.com/knowledge/using_type/understanding_measure_line_length). WCAG 1.4.8: no more than 80. Dyson & Haselgrove 2001 ([IJHCS 54](https://www.sciencedirect.com/science/article/abs/pii/S1071581901904586)): 55 characters per line gave the best comprehension and was read faster than short lines; 100 was worst. Later news-reading work found longer lines read faster but no better understood. **Target: about 65–72.** Note that `ch` is the width of the digit "0" (0.560 em in Hanken), not the average character (0.467 em), so `68ch` is really 81.5 characters. Measured: `58ch` ≈ **69.6 characters**, 617 px wide at 19 px.
- **Display type.** Headline leading of about 1.0–1.3 is normal ([Semrush Intergalactic guidance](https://developer.semrush.com/intergalactic/style/typography/typography-a11y)). Tighter leading and negative tracking suit very large sizes and hurt at medium ones, which is why type systems loosen both as size falls. For Gloock: keep slight negative tracking at 48 px and above, use 0 at 20–32 px, and allow two- or three-line titles room for their descenders and accents (1.08–1.15).

### 4.2 Proposed values

| What | Selector | Old | New | Why |
|---|---|---|---|---|
| Site body | `body` | `1.0625rem / 1.55` (17 px) | **`1.125rem / 1.6`** (18 px) | Michel's "+1", with the air he asked for |
| Site body, phones | `@media (max-width: 720px) body` | `1rem` | **`1.0625rem`** (17 px) | same step on phones |
| Article text | `.article__body` | `1.125rem / 1.65` | **`1.1875rem / 1.7`** (19 px) | +1 px and more leading |
| Article text, phones | `@media (max-width: 720px) .article__body` | `1.0625rem` | **`1.125rem`** | |
| Article measure | `--measure` | `68ch` (81.5 characters) | **`58ch`** (≈ 70 characters) | inside 45–75 and under WCAG's 80 |
| Paragraph gap in articles | `.article__body p` (new rule) | `0 0 1rem` (inherited) | **`0 0 1.15em`** | clearer paragraph breaks at the larger size |
| Article lists | `.article__body ul, .article__body ol` | `color: var(--ink-soft)` | **`color: inherit`** (bone) | lists are body text; they should match the paragraphs |
| Article lede | `.article__header .lede` | `1.1875rem` / 1.55 | `1.25rem / 1.5` | stays clearly larger than 19 px body |
| Lede, general | `.lede` | `1.125rem / 1.55` | `1.1875rem / 1.55` | follows the body step |
| Card description | `.card__desc` | `0.9375rem / 1.5` (15 px) | **`1rem / 1.5`** (16 px) | APCA: 15 px is the floor for readable non-body text |
| Card title | `.card__title` | `24px / 1.1`, −0.01em | **`28px / 1.12`, `letter-spacing: 0`** | hairline 0.29 → 0.34 px; stems 3.9 → 4.5 px; the title outweighs the kicker |
| Lead title | `.lead__title` | `52px / 1`, −0.015em | `52px / 1.06`, −0.01em | room for two-line descenders |
| Lead title, front column | `.front__main .lead__title` | `clamp(30px, 4.6cqi, 48px)` | **`clamp(32px, 4.6cqi, 50px)`** | floor above the card title |
| Lead title, phones | `@media (max-width: 720px) .lead__title` | `30px / 1.02` | **`32px / 1.08`** | |
| Article title | `.article__title` | line-height `1` | **`1.06`** | |
| Headings, default | `h1, h2, h3, h4` | line-height `1.05` | **`1.1`** | every size below 48 px benefits |
| Card kicker | `.card__meta` | `0.625rem` (10 px), +0.1em | **`0.75rem` (12 px), +0.08em** | 10 px uppercase mono is below any readable threshold |
| Card footer labels | `.card__wl`, `.card__comments` | `0.625rem` | **`0.6875rem`** (11 px) | ancillary, but still read |
| Specimen number | `.card__no` | `0.625rem` | `0.6875rem` | |

**Deliberately not in this list:** the other roughly 15 labels site-wide at `0.625rem` (`.stats dt`, `.wildness__head`, `.panel__label`, `.tamer__role`, and so on). The same reasoning applies to them. I would introduce one token, `--label-size: 0.6875rem`, and sweep them in a follow-up, so this change stays reviewable. That sweep belongs in BACKLOG.

---

## 5. Keeping the image from out-shouting the headline

### 5.1 Evidence

- **Online, readers enter through text.** Poynter's Eyetrack studies found that on news sites, headlines and text, not photos, were the entry point. Eyetrack III (2004): *"Dominant headlines most often draw the eye first upon entering the page… Text rules on the PC screen—both in order viewed and in overall time spent looking at it"* ([Poynter](https://www.poynter.org/archive/2004/eyetrack-iii-what-news-websites-look-like-through-readers-eyes/)). Readers often take in only the first two or three words of a headline, so the headline has to be the easiest thing to read on the card.
- **Decorative images are skipped; information-carrying ones are studied.** Nielsen Norman Group eyetracking ([Photos as Web Content](https://www.nngroup.com/articles/photos-as-web-content/)). The cover art is atmosphere (it has `alt=""` and `aria-hidden`), so it should frame the title, not compete with it.
- **Dimming images in dark mode is what most people prefer.** In Thomas Steiner's survey for Google, 57.7% preferred toned-down images in dark mode, most at a 50% grayscale filter ([Re-Colorization for Dark Mode](https://medium.com/dev-channel/re-colorization-for-dark-mode-19e2e17b584b); [web.dev](https://web.dev/articles/prefers-color-scheme)). web.dev's theming guide shows `brightness(.8) contrast(1.2)` ([Theming](https://web.dev/learn/design/theming/)). The counterpoint is Sara Soueidan's: blanket dimming hurts images that carry text or meaning ([2025 newsletter](https://www.sarasoueidan.com/newsletter/issue-2025-10-31/)). The cards' art is decorative, so a *mild* dim is defensible. Michel likes the art, so 50% grayscale would be too much.

### 5.2 Proposed changes (strongest first)

1. **Aspect ratio 3:2 → 16:9 on cards** (`.card__photo img`). The images are 16:9 at the source. In the two-column front grid (about 376 px per card) the image drops from about 251 px to about 212 px tall, 16% less area, and the art is no longer cropped at the sides. This is the single biggest rebalancing, and it costs nothing.
2. **Bigger title** (28 px, section 4.2). With the shorter image, a two-line title goes from about 53 px to about 63 px of height. That moves the image-to-headline height ratio from roughly 4.7:1 to 3.4:1.
3. **Group the words and separate them from the picture (proximity).** Today the `.card` gap is 12 px everywhere. Make it **16 px between image and kicker** and **6 px between kicker and title**, so the kicker, title and description read as one unit under the image.
4. **Optional, mild dimming of card art, lifted on hover or focus:** `filter: saturate(.88) brightness(.9)`, restored to none on `.card:hover` and `.card:focus-within`, with no transition under reduced motion. This applies to cards only, never to the article hero, where the art is the page's picture. I would ship it and let Michel judge it on screen. It is one rule to remove.
5. **Lead image 4:3 → 16:9** (`.specimen-photo img` on the front page only, via `.lead__photo-link .specimen-photo img`). This gives the same benefit, and the lead headline, already 32–52 px, becomes the clear centre of the top story. The trade-off is a shorter image beside the lead body in the side-by-side layout. At 720 px and wider the headline column will then often be taller than the photo, which reads fine because it is top-aligned.

Not recommended: overlaying the title on the image (it hurts contrast and fights the art), or shrinking the image to a thumbnail (it loses the section identity the art carries).

---

## 6. Exact change list

`src/styles/bestiary-tokens.css`

```css
/* old → new */
--ink-soft: #c4c9c2;   →  --ink-soft: #d1d3c9;    /* WCAG 12.16:1, APCA Lc 78.5 on --night */
--ink-muted: #9aa39b;  →  --ink-muted: #aeb5ad;   /* WCAG 8.78:1,  APCA Lc 60.5 on --night */
--measure: 68ch;       →  --measure: 58ch;        /* ≈ 70 characters of Hanken Grotesk */
```

`src/styles/global.css`

```css
body { font-size: 1.0625rem; line-height: 1.55; }
  → body { font-size: 1.125rem; line-height: 1.6; }

h1, h2, h3, h4 { line-height: 1.05; }
  → h1, h2, h3, h4 { line-height: 1.1; }

.lede { font-size: 1.125rem; line-height: 1.55; }
  → .lede { font-size: 1.1875rem; line-height: 1.55; }

.lead__title { font-size: 52px; line-height: 1; letter-spacing: -0.015em; }
  → .lead__title { font-size: 52px; line-height: 1.06; letter-spacing: -0.01em; }

.card { gap: 12px; }
  → .card { gap: 12px; }                       /* unchanged; the two rules below adjust the specific gaps */
  + .card__photo { margin-bottom: 4px; }       /* 12 + 4 = 16 px image → kicker */
  + .card__meta + .card__title { margin-top: -6px; }   /* 12 − 6 = 6 px kicker → title */

.card__photo img { aspect-ratio: 3 / 2; }
  → .card__photo img { aspect-ratio: 16 / 9; }

/* optional: mild dimming of card art, lifted on hover or focus */
+ .card__photo img { filter: saturate(.88) brightness(.9); transition: filter 160ms ease-out; }
+ .card:hover .card__photo img, .card:focus-within .card__photo img { filter: none; }
+ @media (prefers-reduced-motion: reduce) { .card__photo img { transition: none; } }

.card__no { font-size: 0.625rem; }
  → .card__no { font-size: 0.6875rem; }

.card__meta { font-size: 0.625rem; letter-spacing: 0.1em; }
  → .card__meta { font-size: 0.75rem; letter-spacing: 0.08em; }

.card__title { font-size: 24px; line-height: 1.1; }
  → .card__title { font-size: 28px; line-height: 1.12; letter-spacing: 0; }

.card__desc { font-size: 0.9375rem; line-height: 1.5; }
  → .card__desc { font-size: 1rem; line-height: 1.5; }

.card__wl, .card__comments { font-size: 0.625rem; }
  → { font-size: 0.6875rem; }

.front__main .lead__title { font-size: clamp(30px, 4.6cqi, 48px); }
  → .front__main .lead__title { font-size: clamp(32px, 4.6cqi, 50px); }

+ .lead__photo-link .specimen-photo img { aspect-ratio: 16 / 9; }   /* front-page lead only */

.article__title { line-height: 1; }
  → .article__title { line-height: 1.06; }

.article__header .lede { font-size: 1.1875rem; }
  → .article__header .lede { font-size: 1.25rem; line-height: 1.5; }

.article__body { font-size: 1.125rem; line-height: 1.65; }
  → .article__body { font-size: 1.1875rem; line-height: 1.7; }

+ .article__body p { margin: 0 0 1.15em; }

.article__body ul, .article__body ol { color: var(--ink-soft); }
  → .article__body ul, .article__body ol { color: inherit; }

@media (max-width: 720px) {
  body { font-size: 1rem; }              → body { font-size: 1.0625rem; }
  .lead__title { font-size: 30px; line-height: 1.02; }
                                          → .lead__title { font-size: 32px; line-height: 1.08; }
  .article__body { font-size: 1.0625rem; }
                                          → .article__body { font-size: 1.125rem; }
}
```

No font changes. `BaseLayout.astro` keeps its Google Fonts URL as it is.

**Side effects to check when building:**
- Brighter `--ink-soft` and `--ink-muted` touch every element that uses them: the footer, bylines, log times, legends and field labels. That is the intended effect, but review the station bar and footer.
- A 28 px card title in three columns at about 1000–1100 px container width wraps to three lines more often. `text-wrap: pretty` already helps. If three lines are common, use 26 px at `@container (min-width: 1000px)`.
- Any fixed-height elements must still pass the WCAG 1.4.12 text-spacing bookmarklet.

---

## 7. How to verify after the change

1. **Contrast:** rerun `contrast.py` on the final token values and paste the lines into the pull request.
2. **Characters per line:** in Playwright, on an article at 1280 px, count characters per rendered line of `.article__body p`. The target is 62–75. Also check 390 px.
3. **Screenshots** of the home page (cards and lead) and one article at 390 px, 820 px and 1280 px, before and after. Look at the card title-to-image balance and at kicker legibility.
4. **Text-spacing bookmarklet** (WCAG 1.4.12) on the home page and an article: no clipped titles, kickers or meters.

---

## 7a. Decision addendum (2026-09-28): headlines move to Newsreader

After 0.2.47 was built, Michel looked at the site and found the headline letters dense: "the characters are dense, almost touch each other; not very sure about the font". Three headline treatments were compared in the browser, with screenshots of the home cards and the agentgateway review's title at 1280 and 390 px, and measured on a canvas with the real fonts (1,570 letter pairs from the 36 home-page card titles, plus the article title). "Touching" means less than half a pixel of clear space between the ink of two neighbouring letters.

| Treatment | Card 28 px: mean gap / touching | Article title 52 px: mean gap / touching | Thinnest stroke, card |
|---|---|---|---|
| A: Gloock as built (card 0, article −0.015em) | −0.06 px / 74% | −1.44 px / 86% | 0.35 px |
| B: Gloock +0.01em cards, +0.005em larger | +0.21 px / 59% | −0.40 px / 62% | 0.35 px |
| C: Newsreader, 600 cards, 500 larger, optical sizing | +0.83 px / 23% | +0.02 px / 45% | 1.19 px |

**Michel chose C on 2026-09-28.** This reverses the recommendation in §2.3, which kept Gloock and ranked Newsreader second: the measurements show that Gloock's tight fit and 12.8:1 stroke contrast are the problem at headline sizes, and that spacing (B) cannot fix them. As built: `--font-headline` for every headline, weights 600 (cards, lead) and 500 (the rest), letter-spacing 0, card titles 29 px (27 px three across), which wrap as Gloock did at 28/26: identically at 1280 px, within one title on `/news/` at narrower widths, and three more four-line titles on the home page at 820 px. Gloock stays for the wordmark and the brand marks. The record of the decision is ADR 0021.

## 8. Limits of this report

- I did not render the site. All pixel figures are computed from the CSS and the font files, not measured in a browser.
- The APCA "Silver" font lookup table (exact Lc for each size and weight) was not retrievable from the official page. I used the Bronze levels, which are the published conformance levels. For 10–12 px labels the conclusion (bigger and brighter) does not depend on the exact row.
- Wallace et al.'s participants were crowdsourced, mostly under 35, and read short passages. The paper says its findings for older readers are preliminary.
- The halation argument has no controlled astigmatism study behind it. It is plausible and cheap to respect, not proven.
- Newsreader's static instances from Google measured a *smaller* x-height at opsz 16 (0.441) than at opsz 72 (0.512). That is unusual for optical sizing, so check it in a browser before relying on option B.

## 9. For the visual page

### 9a. Specimen fonts: Google Fonts family names, weights and load URLs

Every URL below was checked on 2026-09-28 and returned HTTP 200. Prefix each with `https://fonts.googleapis.com/css2?family=` and end the URL with `&display=swap`. To load several families in one request, join them with `&family=`.

| Role in the report | Google Fonts family name | Weights / axes to load | `family=` value |
|---|---|---|---|
| Current display (keep) | `Gloock` | 400 only (the single style that exists) | `Gloock` |
| Current body (keep) | `Hanken Grotesk` | 400, 500, 600, 700 + italic 400 (what the site loads today) | `Hanken+Grotesk:ital,wght@0,400;0,500;0,600;0,700;1,400` |
| Current field data (keep) | `IBM Plex Mono` | 400, 500, 600 | `IBM+Plex+Mono:wght@400;500;600` |
| Option B: card titles | `Newsreader` | variable: opsz 6–72, wght 400–700, italic 400. Specimen: card title at 28 px, weight 500 and 600, with `font-optical-sizing: auto` | `Newsreader:ital,opsz,wght@0,6..72,400..700;1,6..72,400` |
| Option C: body serif | `Literata` | variable: opsz 7–72, wght 400–700, italic 400. Specimen: body at 19 px, weight 400 | `Literata:ital,opsz,wght@0,7..72,400..700;1,7..72,400` |
| Option D: body, character clarity | `Atkinson Hyperlegible Next` | variable: wght 400–700, italic 400. Specimen: body at 19 px, weight 400 | `Atkinson+Hyperlegible+Next:ital,wght@0,400..700;1,400` |
| Option E: body, large x-height | `Inter` | variable: opsz 14–32, wght 400–700. Specimen: body at 18 px, weight 400 | `Inter:opsz,wght@14..32,400..700` |
| Option E: body, most-preferred in the Wallace study | `Noto Sans` | 400, 500, 600, 700 | `Noto+Sans:wght@400;500;600;700` |
| Reference only (measured, not ranked) | `Source Serif 4` | variable: opsz 8–60, wght 400–700 | `Source+Serif+4:opsz,wght@8..60,400..700` |

Specimen tip: set every body candidate at the **same x-height**, not the same font size, or the comparison is unfair. The Wallace study normalised this way. Font size = 9.4 px ÷ the font's x-height per em: Hanken 19 px, Inter 17.2 px, Noto Sans 17.5 px, Literata 18.5 px, Atkinson 19 px, Newsreader text 21.3 px.

### 9b. Colours: exact hex values with WCAG 2 contrast ratio and APCA Lc (all measured)

APCA Lc is shown as a magnitude. Light text on a dark background gives negative Lc values, and every value below is on the dark side.

| Token / role | Hex | On background | WCAG 2 ratio | APCA Lc | Status |
|---|---|---|---|---|---|
| `--night` (page) | `#111513` | — | — | — | keep |
| `--night-raised` (panels) | `#1a201c` | — | — | — | keep |
| `--bone`: body text and all headlines | `#ece6d6` | `--night` | 14.78 : 1 | 91.0 | **keep** (preferred body level) |
| `--bone` | `#ece6d6` | `--night-raised` | 13.30 : 1 | 89.9 | keep |
| `--ink-soft` **now** | `#c4c9c2` | `--night` | 10.94 : 1 | 72.2 | below body minimum 75 |
| `--ink-soft` **proposed** | **`#d1d3c9`** | `--night` | 12.16 : 1 | 78.5 | passes body minimum |
| `--ink-soft` proposed | `#d1d3c9` | `--night-raised` | 10.95 : 1 | 77.3 | passes |
| `--ink-muted` **now** | `#9aa39b` | `--night` | 7.09 : 1 | 50.4 | too low for 10–12 px labels |
| `--ink-muted` **proposed** | **`#aeb5ad`** | `--night` | 8.78 : 1 | 60.5 | passes content-text level 60 |
| `--ink-muted` proposed | `#aeb5ad` | `--night-raised` | 7.90 : 1 | 59.3 | borderline, acceptable for labels |
| `--ember-text` (links) | `#ff8a57` | `--night` | 7.91 : 1 | 55.9 | keep, links stay underlined |
| `--bot` | `#9cc3ff` | `--night` | 10.23 : 1 | 68.5 | keep |
| `--ai` | `#f4a3c0` | `--night` | 9.51 : 1 | 64.7 | keep |
| `--human` | `#f2c46b` | `--night` | 11.30 : 1 | 74.2 | keep |
| `--wild-5` / danger | `#ff5f3d` | `--night` | 6.10 : 1 | 45.1 | large or non-text use only |
| Paper tag (possible light theme) | `#111513` | `#ece6d6` | 14.78 : 1 | 90.4 | keep |
| *Comparison: pure white* | `#ffffff` | `--night` | 18.41 : 1 | 107.1 | do not use (glare) |
| *Comparison: Material 87% white* | `#e0e1e0` | `--night` | 14.04 : 1 | 87.6 | reference only |

APCA levels for reading this table: 90 preferred for body text · 75 minimum for body text · 60 other content text · 45 headlines of 36 px or larger · 30 absolute floor.

### 9c. Card and post titles: before and after

| Title | Property | Before | After |
|---|---|---|---|
| **Card title** `.card__title` (Gloock) | font-size | 24px | **28px** |
| | line-height | 1.1 | **1.12** |
| | letter-spacing | −0.01em (inherited) | **0** |
| | Gloock hairline / stem | 0.29 px / 3.9 px | 0.34 px / 4.5 px |
| | gap above (from kicker) | 12px | **6px** |
| | image above | 3:2, ≈ 251 px tall at 376 px wide | **16:9, ≈ 212 px tall** |
| | (optional) image filter | none | `saturate(.88) brightness(.9)`, none on hover/focus |
| **Card kicker** `.card__meta` (IBM Plex Mono) | font-size / tracking / colour | 10px / 0.1em / `#9aa39b` | **12px / 0.08em / `#aeb5ad`** |
| **Card description** `.card__desc` | font-size / colour | 15px / `#c4c9c2` | **16px / `#d1d3c9`** |
| **Lead (front page) title** `.lead__title` | size / line-height / tracking | 52px / 1 / −0.015em | 52px / **1.06 / −0.01em** |
| | in front column | clamp(30px, 4.6cqi, 48px) | **clamp(32px, 4.6cqi, 50px)** |
| | phones (≤ 720 px) | 30px / 1.02 | **32px / 1.08** |
| | image | 4:3 | **16:9** |
| **Post (article) title** `.article__title` | size | clamp(2.25rem, 5vw, 3.25rem) = 36–52 px | unchanged |
| | line-height | 1 | **1.06** |
| | tracking | −0.015em | unchanged (large display size) |
| **Post lede** `.article__header .lede` | size / line-height / colour | 19px / 1.55 / `#c4c9c2` | **20px / 1.5 / `#d1d3c9`** |
| **Post body** `.article__body` | size / line-height / width | 18px / 1.65 / 68ch (≈ 81.5 characters) | **19px / 1.7 / 58ch (≈ 70 characters)** |
| | lists colour | `#c4c9c2` | **inherit (`#ece6d6`)** |
| All headings `h1–h4` default | line-height | 1.05 | **1.1** |

### 9d. Lessons learned

**What surprised me**

1. **The body colour was already right.** I expected to propose a new "reading white". `#ece6d6` on `#111513` lands at APCA Lc 91, the preferred body level, in the warm yellow-ish direction that the 2024 fatigue study favoured. The designers got that one right. The problems were the two supporting greys.
2. **`68ch` was not 68 characters.** A `ch` is the width of the digit "0", which in Hanken Grotesk is 20% wider than an average letter. The "68-character" column actually held 81.5, over WCAG's 80. Anyone setting line length in `ch` should measure it for their font.
3. **Every hero image was being cropped.** All 35 are 1600×900, and no page shows them at 16:9 except the article hero. The cards were cutting the art *and* making it taller, the exact opposite of what the headline needed.
4. **Gloock's hairline at card size is under a third of a pixel.** A display face at 24 px on a dark screen is being asked to do a text face's job. This explains Michel's "the image competes" better than the image itself does.
5. **Preference and performance come apart.** In the biggest font study, people read fastest in their favourite font only at chance level (20% of the time), and 73% of them were sure it would be their fastest. The font a design review "likes best" is weak evidence.
6. **A widely repeated claim about Hanken was false.** Several font sites say its "l" is a plain bar that looks like "I". The font file shows a tailed "l". Secondary font directories are not a source.

**What the evidence does NOT support (claims repeated without backing)**

- **"Serif is more readable for long text" (or the reverse, "sans is better on screens").** Controlled work (Arditi & Cho 2005) and the large 2022 study found no category-level difference. It is a voice choice.
- **"There is one best reading font."** The 2022 study says the opposite. The spread between individuals (35%) is bigger than any font's average advantage.
- **"Dark mode is easier on the eyes."** For reading performance, the evidence leans the other way (Piepenbrock 2013, Sethi & Ziat 2023). Dark mode is a preference and an ambience, and it has to be done carefully.
- **"Dark mode makes astigmatism worse."** Plausible optics (wider pupils) and many first-hand reports, but no controlled study with astigmatic readers. It is fair to design for it cheaply (no pure white, no pure black) and wrong to cite it as proven.
- **"Line spacing strongly affects readability."** The eye-tracking study that tested it (Rello et al. 2016) found only marginal effects, with harm only at the extremes (0.8 and 1.8). 1.5–1.7 is comfortable, but font size mattered far more.
- **"Bigger contrast is always better."** APCA sets a *maximum* (about Lc 90) for large text and large bright areas, and pure white on near-black adds glare, not legibility.
- **"WCAG 4.5:1 means readable."** On dark backgrounds WCAG 2's ratio flatters light-on-dark pairs. The old `--ink-muted` passed 7:1 (AAA) while scoring only APCA Lc 50, too low for the 10 px labels it was used on.
- **"Blanket dimming of images in dark mode is best practice."** A survey majority preferred toned-down images, but dimming harms images that carry text or meaning. It is fine for decorative card art and wrong for an informative figure.
- **"Put the picture first; people look at photos first."** That came from print-era research. Online news eyetracking (Poynter Eyetrack III, Nielsen Norman Group) found readers enter through headlines and skip decorative imagery.

## Sources

- Wallace et al. 2022, *Towards Individuated Reading Experiences*, ACM TOCHI — https://dl.acm.org/doi/10.1145/3502222 · PDF https://jeffhuang.com/papers/Readability_TOCHI22.pdf · summary https://readabilitymatters.org/articles/towards-individuated-reading-experiences
- Rello, Pielot & Marcos 2016, *Make It Big!*, CHI — https://pielot.org/pubs/Rello2016-Fontsize.pdf
- Arditi & Cho 2005, *Serifs and font legibility*, Vision Research — https://www.sciencedirect.com/science/article/pii/S0042698905003007
- Legge & Bigelow 2011, *Does print size matter for reading?*, Journal of Vision — https://jov.arvojournals.org/article.aspx?articleid=2191906
- Beier et al. 2021, letter spacing and width, Information Design Journal — https://benjamins.com/catalog/idj.19033.bei · x-height summary https://readabilitymatters.org/articles/research-highlight-how-important-is-x-height-for-font-legibility
- Dyson & Haselgrove 2001, line length on screen, IJHCS — https://www.sciencedirect.com/science/article/abs/pii/S1071581901904586
- Piepenbrock, Mayr, Mund & Buchner 2013, display polarity, Ergonomics — https://www.tandfonline.com/doi/abs/10.1080/00140139.2013.790485
- Sethi & Ziat 2023, *Dark mode vogue*, Ergonomics — https://www.tandfonline.com/doi/abs/10.1080/00140139.2022.2160879
- Fan, Xie et al. 2024, text colour and fatigue under negative polarity, Sensors — https://www.ncbi.nlm.nih.gov/pmc/articles/PMC11175232/
- Material Design 2, Dark theme — https://m2.material.io/design/color/dark-theme.html
- APCA in a Nutshell — https://git.apcacontrast.com/documentation/APCA_in_a_Nutshell.html · ARC Bronze — https://www.readtech.org/ARC/tests/bronze-simple-mode/
- W3C Understanding SC 1.4.8 — https://www.w3.org/WAI/WCAG21/Understanding/visual-presentation.html · SC 1.4.12 — https://www.w3.org/WAI/WCAG21/Understanding/text-spacing.html
- Google Fonts Knowledge: measure — https://fonts.google.com/knowledge/using_type/understanding_measure_line_length · line height — https://fonts.google.com/knowledge/using_type/choosing_a_suitable_line_height
- Poynter Eyetrack III — https://www.poynter.org/archive/2004/eyetrack-iii-what-news-websites-look-like-through-readers-eyes/
- Nielsen Norman Group, *Photos as Web Content* — https://www.nngroup.com/articles/photos-as-web-content/
- Steiner, *Re-Colorization for Dark Mode* — https://medium.com/dev-channel/re-colorization-for-dark-mode-19e2e17b584b · web.dev prefers-color-scheme — https://web.dev/articles/prefers-color-scheme · web.dev Theming — https://web.dev/learn/design/theming/ · Soueidan 2025 — https://www.sarasoueidan.com/newsletter/issue-2025-10-31/
- Type foundry and font pages: Gloock https://fonts.google.com/specimen/Gloock · Hanken Grotesk https://github.com/marcologous/hanken-grotesk · Newsreader https://productiontype.com/font/newsreader · Literata https://www.type-together.com/literata-font · Atkinson Hyperlegible Next https://www.brailleinstitute.org/freefont/

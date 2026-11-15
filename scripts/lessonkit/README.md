# Lesson kits

Branded PDFs for a lesson: a cheat sheet, a homework sheet and an answer key. They are built
locally from HTML templates with headless Chrome and committed to `public/lessonkits/`.
The site build never runs this and never needs Chrome.

## Build

```sh
npm install                                    # once; puppeteer-core does not download a browser
CHROME_PATH=/usr/bin/google-chrome npm run build:lesson-kits             # every lesson in src/lessonkits/
CHROME_PATH=/usr/bin/google-chrome npm run build:lesson-kits -- k8s-02   # one lesson
CHROME_PATH=... npm run build:lesson-kits -- k8s-02 --keep-html          # also keep the HTML, for debugging
CHROME_PATH=... npm run build:lesson-kits -- k8s-02 --preview            # stamp PREVIEW on every page; never commit these
```

On macOS, `CHROME_PATH="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"`.
The script exits non-zero if a font fails to load or a block is too tall for a page.

Output, per lesson `<slug>`:

- `public/lessonkits/aitamer-<slug>-cheatsheet.pdf`
- `public/lessonkits/aitamer-<slug>-homework.pdf`
- `public/lessonkits/aitamer-<slug>-answer-key.pdf`

## Add a lesson

1. Copy `src/lessonkits/k8s-02.json` to `src/lessonkits/<slug>.json` and rewrite it from the lesson post.
   Copy facts and commands from the post verbatim. If an answer needs something the post does not say, drop the exercise.
2. Put the lesson art (1600x900 JPEG, clean, no text) in `src/lessonkits/art/` and point `art.file` at it.
   The build stamps `art.credit` (`© https://aitamer.news`) on the art; do not bake it into the image.
3. Set `lesson.seriesSlug` and `lesson.number` to the post's `series` and `series_order`. The build looks the
   lesson up in `src/data/series.json` and prints the same label as the site badge, e.g.
   "Kubernetes from Zero · Foundations 2 of 12 · Lesson 2" (place in the arc, arc size). An open-ended arc
   prints "<series> · <arc> · Lesson <n>". The build fails if the series or the lesson's arc is missing.
   Our labels say Lesson, never Part.
4. Set `next` (`title`, `summary`, `url`). Until the next lesson is live, point `url` at the series page and
   take the summary from the post's closing "Next" line. Keep it timeless: no "tomorrow", "soon" or dates.
5. Run the build, then open every page and check it.

## How it works

| File | Job |
|---|---|
| `build.mjs` | Reads each `src/lessonkits/*.json`, renders the three documents, paginates them in Chrome, prints A4 PDFs. |
| `utm.mjs` | `withUtm(url, { campaign, content })`. Every link back to the site goes through it (`utm_source=lessonkit`, `utm_medium=pdf`, `utm_campaign=<slug>`, `utm_content=cheatsheet\|homework\|answer-key`). Swap in the site's own helper by keeping the same export. |
| `series.mjs` | `seriesLine(catalog, slug, lesson)`: the series line from `src/data/series.json`, same rules as `seriesLabel()` in `src/lib/series.ts`. |
| `shellwrap.mjs` | `wrapCommand(cmd, width)`: prints a command with `white-space: pre`, breaking only at spaces outside quotes with a trailing ` \`, so a command copied from the PDF still runs. A cheat-sheet group whose longest word does not fit a column goes full width; a word still too long shrinks that command's font, never splits. |
| `render.mjs` | A tiny template engine (`{{x}}`, `{{{x}}}`, `{{md x}}`, `{{#each}}`, `{{#if}}`, `{{> doc}}`). No dependency. |
| `templates/base.html` | Shared layout: the page shell (header, footer with link, QR code, share line and next-lesson teaser) and the first-page cover. |
| `templates/kit.css` | Print styles. Colours are the site tokens from `src/styles/bestiary-tokens.css`; fonts are the self-hosted files in `src/assets/fonts/`. |
| `templates/paginate.js` | Pours the content into fixed A4 pages so every page gets its own header and footer with a clickable link. Chrome's built-in header and footer templates cannot hold links. |
| `templates/{cheatsheet,homework,answer-key}.html` | One body template per document. |

Every page carries: the lesson link with UTM tags (as text and as a link), a QR code of the same URL,
"Free to share with credit: © aitamer.news", and the next-lesson teaser.

It reads existing repo files and does not change them: `src/data/series.json` (series and arcs),
`public/favicon.svg` (the logo mark) and the fonts in `src/assets/fonts/`.

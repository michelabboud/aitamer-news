# Lesson kits

A lesson can offer a cheat sheet, homework, an answer key, and a zip of lab files. The PDFs are built from HTML templates with headless Chrome and are not part of `npm run build`.

Art Desk owns the templates and the sample for Kubernetes from Zero, lesson 2. The builder and the template notes are in [`scripts/lessonkit/README.md`](../../scripts/lessonkit/README.md).

## Layout

| Path | What it is |
|---|---|
| `scripts/lessonkit/build.mjs` | Builds the PDFs. `npm run build:lesson-kits`. Set `CHROME_PATH` to a local Chrome or Chromium. `--preview` stamps PREVIEW on every page. |
| `scripts/lessonkit/render.mjs` | The small template engine. |
| `scripts/lessonkit/utm.mjs` | `withUtm(url, { campaign, content })`. Links back to the site get `utm_source=lessonkit`, `utm_medium=pdf`, `utm_campaign=<id>`, and `utm_content` of `cheatsheet`, `homework`, or `answer-key`. |
| `scripts/lessonkit/templates/` | `base.html`, `kit.css`, `paginate.js`, and one body template per document. |
| `src/lessonkits/<id>.json` | The lesson's kit copy. `k8s-02.json` is the lesson 2 sample. |
| `src/lessonkits/art/` | Art for the PDF cover. Lesson 2 uses `art/art-k8s-02.jpg`. |
| `src/lessonkits/<id>/lab/` | Optional files to zip as `aitamer-<id>-lab.zip`. Lesson 2 has no separate lab files, so it has no zip. |
| `public/lessonkits/` | The built PDFs: `aitamer-<id>-cheatsheet.pdf`, `aitamer-<id>-homework.pdf`, `aitamer-<id>-answer-key.pdf`. Lesson 2's three PDFs are committed. Fact cleared them: [2026-11-13 ruling](../reviews/2026-11-13-k8s-02-lessonkit-fact.md). |

The build reads `public/favicon.svg` and the fonts in `src/assets/fonts/` and does not modify them. Cloudflare Pages never runs Chrome.

## Frontmatter

```yaml
lessonKit:
  id: k8s-02
```

`id` matches the JSON file and the campaign. The story page lists a file only when it exists under `public/lessonkits/`. If none of the four possible files exist, the page shows no box and no download link.

## Build

```sh
npm install
CHROME_PATH=/usr/bin/google-chrome npm run build:lesson-kits -- k8s-02 --preview
```

`--preview` stamps PREVIEW on a local review build. Lesson 2's committed PDFs were built without that flag. The Fact ruling is [docs/reviews/2026-11-13-k8s-02-lessonkit-fact.md](../reviews/2026-11-13-k8s-02-lessonkit-fact.md).

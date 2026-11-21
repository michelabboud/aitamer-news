# Lesson 7 kit prep

Staged only. Not for merge, and not for `src/content` or `public/`.

- Rails: **20**. One explain rail on every `bash` fence. YAML manifests and `text` output fences have none.
- `parseCodeRails` accepted the draft. Prose, commands and outputs are unchanged. The only front-matter addition is `lessonKit.id: k8s-07`.
- PDFs built with `CHROME_PATH=/usr/bin/google-chrome npm run build:lesson-kits -- k8s-07` (no `--preview`). Each page has the lesson QR, the free-to-share line, and the next-lesson teaser.
- Generic rail lines, of the form "An argument of this command:", number **2**. They name the token and do not add a fact. A Fact pass may want those value tokens rewritten in the lesson 2 style.

## PDF sha256

| File | sha256 |
|---|---|
| `aitamer-k8s-07-cheatsheet.pdf` | `c6490fb82e44c5f5ab2bf70a2e43ab7057235203f72e566995b4125babdff951` |
| `aitamer-k8s-07-homework.pdf` | `f93042c3216e706dc5182927618cfecfad48062afbef1380886f631aace1f5e9` |
| `aitamer-k8s-07-answer-key.pdf` | `03ceffa79ad07d51a7b1d73eda2dc0a49c8aa568de5a32e2496afc8868cb4972` |

## Open questions for a Fact review

1. Cover art is the uploaded hero JPEG, copied here as `art-k8s-07.jpg`. That file already carries the house © stamp. Lessons 1-4 use a clean art file, and the kit template also stamps `© https://aitamer.news`. Confirm whether publication should swap in a clean crop.
2. The draft has no `series` or `series_order` (the episode STATUS says those are added at ship). The kit sets the lesson number to 7, so the PDF series line comes from `src/data/series.json`. Confirm the arc is still right on ship day.
3. Draft `pubDate` was left as written. It is a placeholder until ship.
4. The lesson URL is the slug from the draft's hero path. The post is not on main, so the QR target will 404 until ship.
5. Cover cluster: kind, from part 3. The draft does not print a cluster name. The cover says kind, from part 3.
6. The next lesson is not live, so the teaser links to the series page. The summary is the draft's closing Next line with the date words removed.
7. 2 rail lines are the short "An argument of this command" form. They are accurate as labels for those tokens, and thinner than the flag sentences in lessons 1-4.

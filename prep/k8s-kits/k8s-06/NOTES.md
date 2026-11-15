# Lesson 6 kit prep

Staged only. Not for merge, and not for `src/content` or `public/`.

- Rails: **17**. One explain rail on every `bash` fence. YAML manifests and `text` output fences have none.
- `parseCodeRails` accepted the draft. Prose, commands and outputs are unchanged. The only front-matter addition is `lessonKit.id: k8s-06`.
- PDFs built with `CHROME_PATH=/usr/bin/google-chrome npm run build:lesson-kits -- k8s-06` (no `--preview`). Each page has the lesson QR, the free-to-share line, and the next-lesson teaser.
- Generic rail lines, of the form "An argument of this command:", number **0**. They name the token and do not add a fact. A Fact pass may want those value tokens rewritten in the lesson 2 style.

## PDF sha256

| File | sha256 |
|---|---|
| `aitamer-k8s-06-cheatsheet.pdf` | `cc408369028e064b33ee6908a20d63c5e7f9a5cf926258146e5677b57971ef10` |
| `aitamer-k8s-06-homework.pdf` | `ebfb72a7d6c58dac2836bc6c725c7c2c3d001a31e06f0323ccd35696f1cdbff7` |
| `aitamer-k8s-06-answer-key.pdf` | `5d1df7a584c15b4f70d976b862c79f098cb0214dbc309fa8a58ea97b1e1bf04f` |

## Open questions for a Fact review

1. Cover art is the uploaded hero JPEG, copied here as `art-k8s-06.jpg`. That file already carries the house © stamp. Lessons 1-4 use a clean art file, and the kit template also stamps `© https://aitamer.news`. Confirm whether publication should swap in a clean crop.
2. The draft has no `series` or `series_order` (the episode STATUS says those are added at ship). The kit sets the lesson number to 6, so the PDF series line comes from `src/data/series.json`. Confirm the arc is still right on ship day.
3. Draft `pubDate` was left as written. It is a placeholder until ship.
4. The lesson URL is the slug from the draft's hero path. The post is not on main, so the QR target will 404 until ship.
5. Cover cluster: k8s-ep04. The draft names the cluster and the context: k8s-ep04 and kind-k8s-ep04.
6. The next lesson is not live, so the teaser links to the series page. The summary is the draft's closing Next line with the date words removed.
7. 0 rail lines are the short "An argument of this command" form. They are accurate as labels for those tokens, and thinner than the flag sentences in lessons 1-4.

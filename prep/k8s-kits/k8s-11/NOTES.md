# Lesson 11 kit prep

Staged only. Not for merge, and not for `src/content` or `public/`.

- Rails: **17**. One explain rail on every `bash` fence. YAML manifests and `text` output fences have none.
- `parseCodeRails` accepted the draft. Prose, commands and outputs are unchanged. The only front-matter addition is `lessonKit.id: k8s-11`.
- PDFs built with `CHROME_PATH=/usr/bin/google-chrome npm run build:lesson-kits -- k8s-11` (no `--preview`). Each page has the lesson QR, the free-to-share line, and the next-lesson teaser.
- Generic rail lines, of the form "An argument of this command:", number **18**. They name the token and do not add a fact. A Fact pass may want those value tokens rewritten in the lesson 2 style.

## PDF sha256

| File | sha256 |
|---|---|
| `aitamer-k8s-11-cheatsheet.pdf` | `2f4a84433819f23a4a3eeb0176753d956c4ba90812ecc2a3b7d978c3405756c3` |
| `aitamer-k8s-11-homework.pdf` | `bbdbf2a81c4c23d3ee74b12c1235b409d1186656acb7ba7b5c4a3f5cc1881db9` |
| `aitamer-k8s-11-answer-key.pdf` | `83f31e641b33e78d94ca38d016733661235629db25137034deb43765f7be7118` |

## Open questions for a Fact review

1. Cover art is the uploaded hero JPEG, copied here as `art-k8s-11.jpg`. That file already carries the house © stamp. Lessons 1-4 use a clean art file, and the kit template also stamps `© https://aitamer.news`. Confirm whether publication should swap in a clean crop.
2. The draft has no `series` or `series_order` (the episode STATUS says those are added at ship). The kit sets the lesson number to 11, so the PDF series line comes from `src/data/series.json`. Confirm the arc is still right on ship day.
3. Draft `pubDate` was left as written. It is a placeholder until ship.
4. The lesson URL is the slug from the draft's hero path. The post is not on main, so the QR target will 404 until ship.
5. Cover cluster: k8s-ep10. Taken from the node name k8s-ep10-control-plane. The draft also says that node has 8 CPUs and about 16 GiB.
6. The next lesson is not live, so the teaser links to the series page. The summary is the draft's closing Next line with the date words removed.
7. 18 rail lines are the short "An argument of this command" form. They are accurate as labels for those tokens, and thinner than the flag sentences in lessons 1-4.

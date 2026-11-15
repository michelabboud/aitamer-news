# Lesson 14 kit prep

Staged only. Not for merge, and not for `src/content` or `public/`.

- Rails: **14**. One explain rail on every `bash` fence. YAML manifests and `text` output fences have none.
- `parseCodeRails` accepted the draft. Prose, commands and outputs are unchanged. The only front-matter addition is `lessonKit.id: k8s-14`.
- PDFs built with `CHROME_PATH=/usr/bin/google-chrome npm run build:lesson-kits -- k8s-14` (no `--preview`). Each page has the lesson QR, the free-to-share line, and the next-lesson teaser.
- Generic rail lines, of the form "An argument of this command:", number **9**. They name the token and do not add a fact. A Fact pass may want those value tokens rewritten in the lesson 2 style.

## PDF sha256

| File | sha256 |
|---|---|
| `aitamer-k8s-14-cheatsheet.pdf` | `71cd3ecdf1efd627cfe33e5a774cd81bdb41bcd28b2fcfb6b094032a4f00061d` |
| `aitamer-k8s-14-homework.pdf` | `3de1e29b6c7b7c4a540bccc04a605927d5ab99943ae5e579d55f877b563a6cb9` |
| `aitamer-k8s-14-answer-key.pdf` | `4f80a73e23d84b0a40b5c78c2ffd9fca8a3ec355edb86785a4dfeab07f11649c` |

## Open questions for a Fact review

1. Cover art is the uploaded hero JPEG, copied here as `art-k8s-14.jpg`. That file already carries the house © stamp. Lessons 1-4 use a clean art file, and the kit template also stamps `© https://aitamer.news`. Confirm whether publication should swap in a clean crop.
2. The draft has no `series` or `series_order` (the episode STATUS says those are added at ship). The kit sets the lesson number to 14, so the PDF series line comes from `src/data/series.json`. Confirm the arc is still right on ship day.
3. Draft `pubDate` was left as written. It is a placeholder until ship.
4. The lesson URL is the slug from the draft's hero path. The post is not on main, so the QR target will 404 until ship.
5. Cover cluster: k8s-ep13. The draft says the cluster is called k8s-ep13, the same cluster as part 13.
6. The next lesson is not live, so the teaser links to the series page. The summary is the draft's closing Next line with the date words removed.
7. 9 rail lines are the short "An argument of this command" form. They are accurate as labels for those tokens, and thinner than the flag sentences in lessons 1-4.

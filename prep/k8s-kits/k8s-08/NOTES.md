# Lesson 8 kit prep

Staged only. Not for merge, and not for `src/content` or `public/`.

- Rails: **16**. One explain rail on every `bash` fence. YAML manifests and `text` output fences have none.
- `parseCodeRails` accepted the draft. Prose, commands and outputs are unchanged. The only front-matter addition is `lessonKit.id: k8s-08`.
- PDFs built with `CHROME_PATH=/usr/bin/google-chrome npm run build:lesson-kits -- k8s-08` (no `--preview`). Each page has the lesson QR, the free-to-share line, and the next-lesson teaser.
- Generic rail lines, of the form "An argument of this command:", number **19**. They name the token and do not add a fact. A Fact pass may want those value tokens rewritten in the lesson 2 style.

## PDF sha256

| File | sha256 |
|---|---|
| `aitamer-k8s-08-cheatsheet.pdf` | `5235126a230f53cad2492df8cc0f2978aca402f34827113d951a70630503fd5e` |
| `aitamer-k8s-08-homework.pdf` | `e14fa0f65f05f6702457d23ef79c220128929213e26200622506418aefa5af86` |
| `aitamer-k8s-08-answer-key.pdf` | `ace6983ecd85d213e32bf621263aee862873c71aec89e748f77574abeb908a81` |

## Open questions for a Fact review

1. Cover art is the uploaded hero JPEG, copied here as `art-k8s-08.jpg`. That file already carries the house © stamp. Lessons 1-4 use a clean art file, and the kit template also stamps `© https://aitamer.news`. Confirm whether publication should swap in a clean crop.
2. The draft has no `series` or `series_order` (the episode STATUS says those are added at ship). The kit sets the lesson number to 8, so the PDF series line comes from `src/data/series.json`. Confirm the arc is still right on ship day.
3. Draft `pubDate` was left as written. It is a placeholder until ship.
4. The lesson URL is the slug from the draft's hero path. The post is not on main, so the QR target will 404 until ship.
5. Cover cluster: k8s-ep07. Taken from the node name k8s-ep07-control-plane in the lesson output. The prose does not spell the cluster name.
6. The next lesson is not live, so the teaser links to the series page. The summary is the draft's closing Next line with the date words removed.
7. 19 rail lines are the short "An argument of this command" form. They are accurate as labels for those tokens, and thinner than the flag sentences in lessons 1-4.

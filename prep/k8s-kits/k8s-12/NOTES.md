# Lesson 12 kit prep

Staged only. Not for merge, and not for `src/content` or `public/`.

- Rails: **10**. One explain rail on every `bash` fence. YAML manifests and `text` output fences have none.
- `parseCodeRails` accepted the draft. Prose, commands and outputs are unchanged. The only front-matter addition is `lessonKit.id: k8s-12`.
- PDFs built with `CHROME_PATH=/usr/bin/google-chrome npm run build:lesson-kits -- k8s-12` (no `--preview`). Each page has the lesson QR, the free-to-share line, and the next-lesson teaser.
- Generic rail lines, of the form "An argument of this command:", number **32**. They name the token and do not add a fact. A Fact pass may want those value tokens rewritten in the lesson 2 style.

## PDF sha256

| File | sha256 |
|---|---|
| `aitamer-k8s-12-cheatsheet.pdf` | `76aca3fb77a57957e694de8f9bb69ca00bab528cb49434491577601769dfa609` |
| `aitamer-k8s-12-homework.pdf` | `a528771662e9de2004ec17aab7fca630046885a307f12c9de88eef27fe00bb4d` |
| `aitamer-k8s-12-answer-key.pdf` | `aea0d74aa01821dfae65948e248fcbaf123eb9f0742b18ae3e2bfaf52d64ee63` |

## Open questions for a Fact review

1. Cover art is the uploaded hero JPEG, copied here as `art-k8s-12.jpg`. That file already carries the house © stamp. Lessons 1-4 use a clean art file, and the kit template also stamps `© https://aitamer.news`. Confirm whether publication should swap in a clean crop.
2. The draft has no `series` or `series_order` (the episode STATUS says those are added at ship). The kit sets the lesson number to 12, so the PDF series line comes from `src/data/series.json`. Confirm the arc is still right on ship day.
3. Draft `pubDate` was left as written. It is a placeholder until ship.
4. The lesson URL is the slug from the draft's hero path. The post is not on main, so the QR target will 404 until ship.
5. Cover cluster: kind, from part 3. The draft does not print a cluster name. The grading script's explain rail is split into three buttons because one fence has more than 40 tokens, which is the rail line cap.
6. The next lesson is not live, so the teaser links to the series page. The summary is the draft's closing Next line with the date words removed.
7. 32 rail lines are the short "An argument of this command" form. They are accurate as labels for those tokens, and thinner than the flag sentences in lessons 1-4.
8. The grading script fence is longer than 40 tokens, so its rail has three Explain buttons (the cap is 40 lines per explain item).

# Lesson 5 kit prep

Staged only. Not for merge, and not for `src/content` or `public/`.

- Rails: **26**. One explain rail on every `bash` fence. YAML manifests and `text` output fences have none, matching lessons 1-4.
- `parseCodeRails` accepted the draft. Prose, commands and outputs are unchanged. The only front-matter addition is `lessonKit.id: k8s-05`.
- PDFs built with `CHROME_PATH=/usr/bin/google-chrome npm run build:lesson-kits -- k8s-05` (no `--preview`). Three pages each. Each page has the lesson QR, the free-to-share line, and the next-lesson teaser.

## PDF sha256

| File | sha256 |
|---|---|
| `aitamer-k8s-05-cheatsheet.pdf` | `e320bc736735367bb17d95fa3eac5eafce386f39a037ea61ef95801deff3de34` |
| `aitamer-k8s-05-homework.pdf` | `707a8e157dd0e4271f0abb3306ac85edc1f0a466c74b760acb451cc70be8bd63` |
| `aitamer-k8s-05-answer-key.pdf` | `7ed199241a589125d8fcf2046864785390b86f8060365e084596935ed1494cbb` |

## Open questions for a Fact review

1. Cover art is the uploaded hero `k8s-from-zero-05-kubectl-essentials-2972f763.jpg` (1600×900), copied here as `art-k8s-05.jpg`. That JPEG already carries the house © stamp. Lessons 1-4 use a clean art file, and the kit template also stamps `© https://aitamer.news`. Confirm whether publication should swap in a clean crop.
2. The draft has no `series` or `series_order` (STATUS says those are added at ship). The kit uses series `k8s-from-zero`, lesson 5, so the PDF line reads "Foundations 5 of 12 · Lesson 5". Confirm that arc is still right on ship day.
3. Draft `pubDate` is `2026-11-15T07:00:00Z`. STATUS calls it a placeholder. Left unchanged.
4. Lesson URL is `https://aitamer.news/posts/k8s-from-zero-05-kubectl-essentials/`, from STATUS.md. The post is not on main, so the QR target will 404 until ship.
5. The cover cluster name is `k8s-ep04`, taken from the node `k8s-ep04-control-plane` in the lesson output and from part 4. The lesson says to use the cluster from part 4 and does not print the cluster name as its own sentence.
6. Lesson 6 is not live, so the teaser links to the series page. The summary is the draft's closing Next line with "coming tomorrow" removed.
7. Rail sentences for `run`, `diff`, `explain`, `edit`, `label`, `patch` and `get` follow the kubectl reference pages read on 15 Nov 2026, plus sentences from this draft. Re-check those pages if they move before ship.

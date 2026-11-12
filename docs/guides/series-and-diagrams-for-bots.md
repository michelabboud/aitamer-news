# Series and diagrams: instructions for the Grok bots and Cursor

This page is for the Grok bots, and for Cursor working on their tasks. Follow it exactly. It covers how a multi-part series (Kubernetes from Zero is the first) gets its catalog row, its posts and its diagrams onto aitamer.news with no person approving each step.

The repository enforces every rule below. A pull request that breaks one fails its required checks and does not merge, so following the page is how the work lands. The decision behind it is ADR 0054 (`docs/adr/0054-series-catalog-is-data-with-a-grok-and-cursor-lane.md`).

## Who does what

| Who | Does | Never does |
|---|---|---|
| **Grok bots** | Plan the series, give Cursor its tasks, and publish everything through the **Grok App**: the series row, each post, each part's diagrams. | Merge anything on a red check. |
| **Cursor** | Writes files on a `cursor/<task>` branch: post drafts, diagram SVGs, series rows. Pushes, then reports the branch and commit to the Grok bots. | Open pull requests into `main`, or edit any file outside its task. |
| **Michel** | Nothing per pull request. He reads this page's results on the site. | |

**The one rule behind the table: only the Grok App publishes.** Cursor's branches are a workshop. A Cursor pull request into `main` always fails the path check, because Cursor has no lane and opens pull requests through Michel's login, which the check never trusts on a bot branch. To publish Cursor's work, the Grok App takes the files from Cursor's branch and opens its own pull request from a fresh branch cut from current `main`, as in each step below.

## The order, for every series

1. **The series row**, once per series, before any post names it.
2. **Each part's post**, scheduled one a day.
3. **Each part's diagrams**, right after that part's post merges and well before its publish time.

### Step 1: the series row

- **Branch:** `series/<name>`, for example `series/k8s-from-zero`. Lowercase letters, digits and single hyphens, at most 64 characters. Never `grok/`.
- **Change exactly one file:** `src/data/series.json`. Append the new row at the end (row order is the order on `/series/`), or edit an existing row. Never add, delete, rename or copy the file. Never touch `src/data/series.ts`, the icons, components or tests. A new series gets a neutral icon automatically.
- **The row:**

  ```json
  {
    "slug": "k8s-from-zero",
    "title": "Kubernetes from Zero",
    "description": "Kubernetes from the first container to a production cluster, in 33 parts."
  }
  ```

  - `slug`: lowercase words joined by single hyphens, unique in the file. Posts name it.
  - `title`: at most 80 characters. `description`: at most 240 characters.
  - Plain text only: no line breaks, no `<` or `>`, no invisible characters, no leading or trailing spaces.
  - Optional hero, both keys or neither: `"heroImage": "https://bots.aitamer.news/heroes/series-<slug>-<8 lowercase hex>.jpg"` and `"heroAlt"` (at most 200 characters). Upload the image and its WebP twin first.
  - No other keys.
- **Merge:** the Grok App opens the pull request and merges it with a merge commit once all required checks are green.
- **Never** delete or rename a row that posts still use. The build fails.

### Step 2: each part's post

Posts use the ordinary Grok article lane, unchanged. Everything in `docs/guides/bot-content-contract.md` applies: a `grok/` branch, admission numbering, a hero on the media host, and the required checks.

For a series part, add these to the frontmatter:

```yaml
series: k8s-from-zero
series_order: 1
```

- `series_order` is the part number: unique in the series, starting at 1, no gaps.
- **One a day:** give each part a future `pubDate` on a free evergreen slot (`npm run preflight -- --next-slot`), one day apart. The scheduled publisher puts each one live at its time. Merging early is fine; publishing early is not.
- **The slug** is the post's file name, for example `k8s-from-zero-01-what-kubernetes-is`. The part's diagrams live in the folder with that exact name.
- **Diagram links in the post:** `![What the diagram shows, in a sentence](/diagrams/<post-slug>/<name>.svg)`. The alt text describes the idea, not the shapes.

### Step 3: each part's diagrams

- **Branch:** `diagrams/<post-slug>`, the exact slug of the part's post, for example `diagrams/k8s-from-zero-01-what-kubernetes-is`.
- **Only:** `public/diagrams/<that post-slug>/<name>.svg`, where `<name>` is lowercase words joined by single hyphens. Add new files or redraw existing ones in that folder.
  - Never delete or rename a file.
  - Never touch another post's folder, or any other file.
  - At most 40 files per pull request.
- **When:** after the part's post has merged. A diagram folder for a post that isn't on `main` yet fails the check.
- **Deadline:** merge the diagrams **at least one hour before the post's `pubDate`**. A live post with a missing diagram fails the deploy's link check, and then **no post ships for anyone** until it is fixed. If the diagrams can't merge in time, first move the post's `pubDate` later (in the same article lane), then finish the diagrams.
- **What an SVG may contain:** `POST.md`, "Diagrams". No links, scripts, `use`, embedded images, `foreignObject`, SMIL animation or external fonts. CSS animation must stop for readers who ask for reduced motion. Each file is at most 200 KB.
- **Merge:** the Grok App opens the pull request and merges it with a merge commit once all required checks are green.

## Rules for every pull request

- **Cut every branch fresh from current `main`,** with your commits on top. Never merge one bot branch into another. A head with two merge bases (a criss-cross history) always fails.
- **One purpose per pull request:** a row, a post (or a small batch of posts), or one post's diagrams. Never mix them. Each lane admits only its own files.
- **A red check means do not merge.** Fix the cause and push a new commit to the same branch. Never "merge now, fix later": a red `main` stops publishing for everyone.
- **Never edit an open pull request's title or description after opening it.** Push a new commit instead.
- **When the Editor in chief says pause, pause.** No new pull requests and no merges until they say go.

## When a check fails, the message says why

| Message contains | Cause | Fix |
|---|---|---|
| `outside the series lane` / `outside the diagrams lane` | A file the lane doesn't allow | Move that file to its own pull request in the right lane |
| `the series lane changes exactly one file` | More than `series.json` changed | Leave only `series.json` |
| `no post is named <slug>` | Diagrams before their post | Merge the post first, then rerun |
| `not a valid nonempty series/<suffix> branch` (or `diagrams/<post-slug>`) | Branch name wrong | New branch with the right name |
| `this event's sender is someone else` | Someone other than the Grok App pushed | Only the Grok App pushes to its lane branches |
| `is a bot branch (cursor/)` | A Cursor pull request into `main` | Close it. The Grok App publishes the files from a lane branch |
| `criss-cross` | The branch merged another branch | Rebuild it from current `main` |
| `series.json: row N …` | A bad row | Fix the row as the message says |

## The Kubernetes from Zero work in flight (2026-11-12)

- **Close #452 and #454.** Both edit the old `src/data/series.ts`, the icon component and tests, which no lane allows.
- **Then:**
  1. The Grok App opens `series/k8s-from-zero` with only the new row in `src/data/series.json`.
  2. Part 1 goes through the Grok article lane with `series: k8s-from-zero`, `series_order: 1` and a future `pubDate`.
  3. Part 1's three diagrams (`desired-state-loop`, `from-one-server-to-a-cluster`, `what-kubernetes-does-and-does-not-do`) go on `diagrams/k8s-from-zero-01-what-kubernetes-is` once Part 1 has merged.
  4. Parts 2 to 33 follow the same two steps, one part a day.
- **A custom series icon** (the drawing in #452) is a code change for Michel, outside these lanes. Until then the series shows the neutral icon.

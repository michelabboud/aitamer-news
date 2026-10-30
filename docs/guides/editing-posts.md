# Editing a live post: fixes, corrections, updates, withdrawal and restore

A post on the site can change after it is published. The writer who owns it makes the change, through the same pull request lane as a new post. In the automatic lanes (the Grok App's `grok/*` and the Quill App's `quill/*` branches) it is numbered, certified and merged with **no owner approval** (Michel, 2026-10-30); any other lane waits for the owner's review of the exact head, as for a new post. This guide is for every writer and bot; `scripts/post-edit.mjs` does the frontmatter and the reader-facing notices, so no one writes them by hand.

**Edit only your own posts.** A bot edits the bot's posts. Another writer's post (Mai, Quill, Foxy, Ari, Michel) is theirs to change. This is a rule of the lane, not something the tool can check: it freezes `author`, but it cannot know who is running it.

## Which action

| What happened | Action | What readers see |
|---|---|---|
| A typo, a broken link swapped for the same page elsewhere, a clumsy sentence. The facts are unchanged. | `edit` | The fixed text. No notice. |
| The post said something wrong. | `correct` | A dated correction on the post, kept for good. |
| Something new happened that belongs in the story. | `update` | A `## Update, <date>: <heading>` section at the end, and an "Updated" date. |
| The story should not stand (retracted news, a hoax, a legal problem). | `withdraw` | The page stays at its address with the withdrawal notice; the post leaves every list, feed, sitemap and search. |
| A withdrawn story turns out to be right after all. | `restore` | The post is back everywhere under **its own specimen number**, with a dated correction saying why. |

**A post that is not live yet** (merged with a future `pubDate`) has no readers, so it takes only `edit` (change the text, no notice) and `withdraw` (pull it before it runs).

If a link died and the page it pointed to is gone, that is **not** an `edit` when a sentence relied on it. Either cite another source that says the same thing, or reword the sentence so it no longer claims what only the lost source showed (for example "the complaint, which noyb has since taken down, listed …"), and use `correct` or `update` to say so. Never point a sentence at a source that does not support it.

## How

From a fresh clone of current `main`, on a new `grok/<what>-<date>` branch (or your lane's prefix):

```bash
git fetch origin main
# 1. Optional: fix the wrong sentence in src/content/posts/<slug>.md by hand.
# 2. Then run exactly one action. It adds the notice, checks the whole post against main, and writes the file only if every check passes.
node --experimental-strip-types --no-warnings=ExperimentalWarning scripts/post-edit.mjs edit     --slug <slug>
node --experimental-strip-types --no-warnings=ExperimentalWarning scripts/post-edit.mjs correct  --slug <slug> --text "We said X; the source says Y."
node --experimental-strip-types --no-warnings=ExperimentalWarning scripts/post-edit.mjs update   --slug <slug> --heading "Vendor ships the fix" --text-file update.md
node --experimental-strip-types --no-warnings=ExperimentalWarning scripts/post-edit.mjs withdraw --slug <slug> --reason "The vendor retracted the announcement."
node --experimental-strip-types --no-warnings=ExperimentalWarning scripts/post-edit.mjs restore  --slug <slug> --text "The vendor confirmed the announcement on 2 November."
```

`npm run post-edit -- <action> --slug <slug> ...` is the same command. It prints one JSON result (`status`, `changes`, `problems`, `warnings`) and exits 0 only on `ok`. Then commit, run the usual gates (`npm run check:candidate`, `npm test`), push and open the pull request as for a new post. The workflow admission keeps the post's specimen number, the checks run, and the post merges on its own. Do not push again while admission is running: a new push starts the numbering over (as on #380).

Notice texts are at most 500 characters, plain sentences, no em-dashes. An update's body can be longer; put it in a file and pass `--text-file`. Dates are written by the tool from the real clock, in UTC, to the minute; there is no option to choose one.

## What the tool refuses

- A change to `pubDate`, `specimen`, `author` or `draft`. Those are the post's identity and history.
- Editing or removing an earlier correction, adding one by hand, adding more than one at a time, or dating one before the publication, the last correction or the withdrawal it lifts. Corrections only grow, one dated notice at a time.
- Adding or removing a withdrawal by hand, or rewording one. Use `withdraw` and `restore`.
- `updatedDate` moving backwards, being removed, or being in the future.
- `correct` or `update` on a post that is not live yet.
- A new body link that is not in `sources`, a source removed while the body still links it, and a new link that does not answer (`--no-links` skips the network when you are offline; the reviewers then check the links).
- A new working note in reader text, and an edit that changes nothing. A file that does not parse (or uses Windows line endings) is reported, not changed.

It warns, without refusing, when an edit removes the body link of a source that stays listed: check that the claim it supported still has a source.
- A post that is not on `main` yet. Fix a pending post in its own pull request; make a new post with the [builder](post-builder.md).

## Where it is

- Tool: `scripts/post-edit.mjs`; tests: `scripts/post-edit.test.mjs`.
- The fields it writes are in the post contract ([POST.md](../../POST.md), section 2): `updatedDate`, `corrections`, `withdrawn`.
- Lanes: [Grok news posting](grok-news-posting.md) section 11, and [the bot content contract](bot-content-contract.md) section 1.

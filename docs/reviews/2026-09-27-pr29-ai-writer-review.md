# Security review — PR #29, the AI writer kind and the rendered-body gate (Opus, 2026-09-27)

- **Reviewer:** Claude Opus 5.5, independent run, read-only, no network, at `8870cc4` (range `02ed242..8870cc4`).
- **Disposition:** every finding was fixed in the follow-up commit on the same branch. M1: a tested `jsonLdAuthorType`. M2: feeds use `feedAuthorName`. M3: the strings were updated. I1: author files may not set `slug:`, and a test shows the refusal fails first. I2: documented in ADR 0011.

---

**Verdict: CLEAR WITH FIXES.** The gate inversion is correct and fails closed, and nothing here blocks. Two minor fixes should land before the next Mai post: tell feed readers she is an AI, and put a test on the JSON-LD author type.

Reviewed range 02ed242..8870cc4 at commit 8870cc4. The worktree is clean after the review (`git status` shows only the untracked `node_modules` symlink).

**1. Tests:** `npm test` ran 514 tests: 514 passed, 0 failed, exit code 0.

**2. The gate inversion.** This is verified in the code and by probing temporary author files outside the repo.
- Only a `kind` value that parses to exactly the string `human` is trusted: `'human'`, `human # comment`, `!!str human` and a YAML merge key all count as human, and Astro reads them the same way.
- Everything else is gated: `Human`, `"human "`, `[human]`, a missing kind, and a file with no frontmatter.
- A duplicated key, invalid YAML, an unreadable file and a directory named `x.md` all throw. `botSetProblems` turns that into "cannot read the authors", so the check fails rather than passing.
- None of the four paths lets a machine author through:
  - `isGated` gates a post whose author field is not a string.
  - `staleGrandfatherEntries` only skips an entry whose author is now `human`.
  - `gatedPostFiles` runs only after the precondition passes.
  - `checkAgainstBuild` gates a post if either its own reading or Astro's stored author says machine.
- The publisher can only write comments and reactions (`check-publisher-paths.mjs:4`), so a bot cannot change an author's kind.
- The precondition still fails when every author is human. I confirmed this by probe and by mutation 3.

**3. Where the kind is shown or used.** Every label, byline and role goes through `author-kinds.ts`, and no two-way comparator is left in `src`. The JSON-LD author type is `isHuman ? Person : Organization`, so Mai is an `Organization`. The AI tag colour has a contrast ratio of 8.52:1 (the bot tag's is 8.55:1).

**4. Is Mai labelled an AI wherever a reader sees her?** Yes on the site:
- post cards, the homepage log, the Tamers list and the post page all say "AI writer";
- her author page says "AI writer · Featured writer", and its meta description is her bio, which says "an AI writer".

The one gap is the feeds (finding M2).

**5. Mutation checks**, each restored and confirmed restored:

| # | Mutation | Result |
|---|---|---|
| 1 | Inversion reverted: `kind === 'bot'` in `botAuthorIds` | Caught: 2 tests fail |
| 2 | JSON-LD reverted to `kind === 'bot' ? Organization : Person`, which would make Mai a `Person` | **Survived: 514/514 green** |
| 3 | Precondition disabled: `if (bots.size \|\| true)` | Caught: the "no machine author" test (G3) fails |

**Findings**

- **M1 · minor (missing test) · `src/pages/posts/[slug].astro:102`.** Nothing enforces the decision record's promise that an AI writer is never a JSON-LD `Person`. Mutation 2 put back the old two-way line and the whole suite stayed green. `author-kinds.ts` is tested, but no page that calls it is. Two ways to fix it:
  - a check after the build: every story page by a non-human author has author `@type: Organization`;
  - or a small tested helper, `jsonLdAuthorType(kind)`.
- **M2 · minor (honesty) · `src/pages/rss.xml.ts:20` and `src/pages/feed.json.ts:38`.** The RSS and JSON feeds give the author only as "Mai", with no AI label. "Desk Bot" says what it is in its own name; "Mai" reads as a person's name, so a feed reader has no disclosure at all. Fix: publish the author as "Mai (AI writer)", or build the name with `kindLabel` for every author who isn't human.
- **M3 · minor (stale docs) · `scripts/check-rendered-body.mjs`.** Several comments and messages still say "bot":
  - line 475's doc comment says "every post whose author is a bot";
  - line 708's command-line message says "bot-authored post(s)";
  - in the test file, line 163's test name is "no author marked kind: bot", and the section header is "The bot-only gate".
  
  The function names `botAuthorIds` and `storedAuthorIsBot` are kept on purpose (one comment says so); these strings are not.
- **I1 · informational · the gate's matching rule.** The gate lists the machine authors by file name and gates posts that name one. A truly fail-closed gate would do the opposite: gate every post whose author is *not* a known human (`!humanIds.has(author)`). The two differ when Astro gives an author a different id from its file name. Astro's glob loader takes the id from a `slug:` field in the frontmatter when there is one (`node_modules/astro/dist/content/loaders/glob.js:12`). Example: `evil.md` marked `kind: bot` with `slug: wiz-cat` would collide with the human `wiz-cat`, and neither the pre-build nor the post-build reading would gate a post by `wiz-cat`. Today only a human can write an author file, and `check-authors` ties post authors to file names, so this is theoretical. But the decision record claims the gate fails closed on authorship, and the change is about two lines.
- **I2 · informational · a fourth kind.** The decision record says the type system refuses a kind that lacks a label, role or rank, and that holds. Nothing forces the rest, though: the homepage counts (`index.astro:62-66`, `BaseLayout.astro:157-160`) or the CSS classes `tag--`, `by--` and `tamer__avatar--`. A fourth kind would be missing from the counts, and its tag would have no colour.

**Process notes**
- I did not run the site build. Astro writes `node_modules/.astro`, which here is the main checkout's shared `node_modules`, and the brief forbids writing to it. So findings about the built pages come from reading the source.
- I deleted my own temporary probe directory in the same command as a `git status` check, which breaks my rule of running deletions alone.
- The probe left fixture directories `(reviewer temporary fixtures, removed)`. One contains a file with permissions set to 000, so remove them with `chmod -R u+rwx (reviewer temporary fixtures, removed)` first, then `rm -r (reviewer temporary fixtures, removed)`.

Next: fix M2 in `rss.xml.ts` and `feed.json.ts`, since it is the one place a reader sees Mai without being told she is an AI.

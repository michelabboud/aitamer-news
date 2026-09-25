<!-- Review record. Target 106bdd9, base 29e1453 (batch A of docs/plans/2026-09-25-bestiary-redesign.md).
Kind: deep. Reviewer: Strong tier (Claude Opus 5.5, code-reviewer agent, read/search tools only), in-process subagent,
reading a detached worktree of 106bdd9 plus the diff and log prepared by the coordinator. Not blind (single reviewer).
Status: returned 2026-09-25; findings being ruled by the coordinator. Committed verbatim by the coordinator. -->

# Deep review: Batch A of the Bestiary plan (29e1453..106bdd9)

**Verdict: batch A should not be ruled yet.** Six Blocking findings need fixing first. Four are in the specimen-number stamper and its ledger: how it reads post headers, what state a failed run leaves behind, the documented fix for a number collision, and a text replacement that can corrupt posts. The other two are in the new post contract: `withdrawn` promises a takedown the site doesn't perform, and misspelled fields are silently dropped. Each is a small, local fix, but later tasks build on all of them: the bots, the posting tool (atn-mcp), task A6, and the machine-readable JSON Schema planned in task C6.

**What this review read:** only the frozen snapshot at `106bdd9`, plus `batchA.diff` and `batchA.log`. The range also contains `960133f` (0.1.6, the plan commit), which I reviewed as documentation. Line numbers below are at `106bdd9`, relative to the snapshot tree.

**Checks I could not run** (my tools are read, search and file-listing only; no shell):
- `npm test`, `npm run check:posts`, `npm run build`, `check:dist`
- Inspecting the built pages in `dist/`
- Testing Cloudflare's handling of `_redirects`
- Reading Astro's installed source (the snapshot has no `node_modules`)

Where a finding depends on one of these, it says so. Everything else I checked against the source and JavaScript/YAML semantics.

---

## Blocking

### B1. The stamper reads post headers with regexes, and they disagree with YAML on the repo's own template
`scripts/stamp-specimens.mjs:32-36` (`scalar`), `:50` (`draft`), `:54` (`hasSources`)

**Evidence**
- `scalar()` captures everything after `key:` to the end of the line, comments included.
- `draft` counts as a draft only when that capture is exactly `'true'`.
- `hasSources` needs `sources:` alone on its line, followed by an *indented* `- `.
- The README's post template has trailing YAML comments on these exact lines: `README.md:53` (`pubDate`), `:55` (`section`), `:58` (`draft: true               # keep true until ready`) and `:61` (`sources:                  # optional`).

**Failure scenario (the human path)**
1. An editor copies the README template, as the README tells them to.
2. YAML reads `draft` as `true`, so Astro correctly treats the post as a draft.
3. `stamp-specimens` reads `draft` as `'true               # keep true until ready'`, so it treats the post as **published**.
4. `npm run stamp` gives the draft a permanent specimen number and appends it to the append-only ledger. That number is burned for good.
5. `check:posts` then fails the deploy on a draft: `sources:   # optional` doesn't match `hasSources`, and the section reads as `'tools   # …'`, so the rule that every non-Opinion post needs sources fires.
6. The same comment on `section: opinion` also defeats the Opinion exemption.
7. `stamp-post-times` has the same blind spot: `DRAFT_TRUE` and `DATE_ONLY_PUBDATE` at `scripts/stamp-post-times.mjs:24-25` miss commented lines, so `check:times` passes a commented date-only `pubDate`. That part predates this batch.

**Failure scenario (the machine path)** Common YAML writers produce valid output these regexes reject:
- PyYAML writes lists unindented (`sources:\n- title: …`).
- Any writer set to flow style writes `sources: [{title: …, url: …}]`.
- `draft: True` is valid YAML 1.2 for true.

In each case valid posts either fail `check:posts` or get misread as published.

**Fix**
- Read the header with a real YAML parser. Astro's own parser (`js-yaml` or `yaml`) is already installed transitively. Making it a direct dependency needs the dependency-vetting report under `docs/reports/`.
- Keep the text-based *write* of the `specimen:` line, which is fine as it is.
- Share one `readFrontmatter` between both stampers.
- Add tests for:
  - trailing comments
  - `True`
  - quoted values
  - flow-style `sources`
  - unindented sequences
  - `sources: []`
  - CRLF line endings
  - a byte-order mark (BOM)

### B2. A stamp run that fails partway leaves the ledger in a state no one may legally repair
`scripts/stamp-specimens.mjs:197-203`, `:24`, `:110-117`

**Evidence**
- `main()` writes each post file inside the loop (`:199`) and appends to the ledger only after the loop (`:202-203`).
- `withSpecimen` throws on:
  - a `specimen:` line that is present but empty, `null` or `~` (`readPost` maps these to `null`, so the post is scheduled for a number, and then `withSpecimen` throws "already has a specimen line");
  - a missing or unusual `pubDate` key.
- Separately, the slug is the raw filename (`:161`), but ledger lines must match `^(\d+) ([a-z0-9][a-z0-9-]*)$` (`:24`). Nothing checks the filename before writing.

**Failure scenario**
1. A bot fills in every contract key and writes `specimen:` empty on post C, alongside two new posts A and B that sort earlier.
2. A and B get numbers 26 and 27 written into their files, then the run throws on C.
3. The ledger never receives 26 or 27.
4. A re-run after fixing C: A and B now carry numbers, so they aren't re-planned. `nextNumber` still returns 26, so C gets 26 as well.
5. `check:posts` fails with "not in the ledger" and "also on". The only repair is editing the ledger by hand, which the ledger's own header forbids.

A file named `Grok-5.md` or `gpt-5.6.md` gets its number written, and the ledger line appended, as `0026 Grok-5`. Every later run then fails with "ledger line … is not \<number\> \<slug\>", and that line can never be removed.

**Fix**
1. Validate every input first: slugs against the ledger's slug pattern, and every `withSpecimen` result computed in memory.
2. Write the ledger next, appending the numbers. Burning numbers is safe; that is exactly what the ledger is for.
3. Write the post files last.
4. Refuse to stamp an empty or non-numeric `specimen:` with a clear message.
5. Add a failure-path test in which the third of three posts throws, and assert that nothing was written.

### B3. The documented fix for a number collision can never pass the check
`POST.md:84`, `BACKLOG.md:17`, `scripts/stamp-specimens.mjs:128-131`

**Evidence**
- `POST.md` says: two parallel branches can pick the same number, "the check catches it at merge", and "re-running `npm run stamp` on the second after removing its `specimen:` line fixes it."
- Both branches append at the end of the ledger, so git always reports a conflict there.
- The natural resolution keeps both lines: `0026 slug-a`, `0026 slug-b`.
- `findProblems` then reports "ledger issues 26 twice" (`:129`) forever. Following the documented steps adds `0027 slug-b` but cannot remove the duplicate, because the ledger is append-only.
- "Catches it at merge" is also inaccurate. The only workflow that runs `check:posts` is `deploy-pages.yml`, on push to `main`; there is no pull-request check. The collision is found only *after* it lands on `main`, and it blocks every deploy until someone breaks the append-only rule.
- `findProblems` also never flags a slug that appears in the ledger twice with different numbers, although the plan (decision D9) says the check covers post/ledger disagreement.

**Fix (my recommendation first)**
- **Recommended:** assign numbers only on `main`, in a single serialized step: a CI job with its own `concurrency` group that stamps and commits, or atn-mcp as the only writer. Branches then never assign numbers, so they can't collide.
- **If branch-side stamping stays:** define a legal way to repair the ledger, such as an append-only void marker (`0026 slug-b void: collision`) that the parser and checker honour. Rewrite `POST.md:84` to describe the procedure that actually works. Add a check for "slug issued twice", plus a test that reproduces the two-branch collision end to end.

### B4. `withdrawn` is documented as a working takedown, but the page still publishes the full body and stays in the sitemap
`POST.md:36`, `src/content.config.ts:81-82`, `src/pages/posts/[slug].astro:25` and `:107-109`, `astro.config.mjs:23`

**Evidence**
- The contract (`POST.md:36`) says `withdrawn` "takes a post down … the page stays at its URL with the notice, and the post leaves every list, feed, sitemap and search result." The schema comment says the same.
- `getPostPages()` still renders withdrawn posts through the unchanged template:
  - full `<Content />`
  - sources
  - Disqus comments
  - no withdrawal notice
  - no `noindex`
- The sitemap filter (`sitemapIncludes`) removes only the retired section URLs, so withdrawn posts remain in the sitemap.
- The CHANGELOG says "nothing renders them yet", but `POST.md` is the document the bots and the posting tool write against.
- **Checked and correct:** every listing uses `getPublishedPosts` and so excludes withdrawn posts. That covers the home page, habitat pages, author pages, all three archive levels, RSS and `getSunsetPosts`.

**Failure scenario** An editor or the posting tool withdraws a post for a legal or copyright reason, the case the planned "Copyright & takedown" footer link points at. The article's full text stays public, indexable and listed in the sitemap. Only the site's own lists stop showing it.

**Fix (my recommendation first)**
- **Recommended:** before task B7, make withdrawal real at a minimum:
  - render the title and a notice instead of the body
  - add `noindex`
  - pass `noindex` through `BaseLayout`, which already supports it
  - make the sitemap filter drop withdrawn slugs (build that set at config time, or post-process the sitemap)
- **Alternative:** mark `withdrawn` in `POST.md` as "reserved, not effective until B7" and make the schema reject it until then.

### B5. The contract's new nested objects silently drop unknown keys, and adding strictness later would break the contract's own promise
`src/content.config.ts:25-54` and `:59`

**Evidence** Zod objects strip unknown keys by default, and none of the new objects is `.strict()`: `wildness`, `sunset`, `video`, `correction`, `withdrawal`, or the post schema itself.

**Failure scenarios**
- `sunset: { date: 2026-10-23, what: "grok-3 API", replacment: "grok-4-7" }` passes. The planned Extinction Watch page would then publish "No replacement listed", which is a false fact.
- `verdit:` or `heroalt:` at the top level vanish without an error.
- A writer on a future contract version publishing to a v1 site loses fields silently.
- `POST.md:38` promises the contract "only grows". Turning on strictness after posts exist would break that promise, so this has to be decided now, before the planned JSON Schema (task C6) freezes the shape.

**Fix**
- Add `.strict()` to every new nested object now. They are empty in all 25 posts, so nothing breaks.
- Decide deliberately whether the top level becomes strict too. That one is worth a short architecture decision record, since it changes how every writer is validated.
- Also tighten the dates:
  - `z.coerce.date()` on `sunset.date`, `corrections[].date` and `withdrawn.date` (`:34`, `:47`, `:51`) accepts `20261023` (a number, read as a 1970 timestamp) and `true`.
  - Use a strict `YYYY-MM-DD` / ISO regex, or a union of `z.date()` and a validated string.

### B6. Both stampers can silently corrupt a post's content through `String.replace`
`scripts/stamp-specimens.mjs:116` (`text.replace(fm, stamped)`), and the pre-existing `scripts/stamp-post-times.mjs:67`

**Evidence**
- With a string as the pattern, JavaScript still interprets `$$`, `$&`, `` $` `` and `$'` in the *replacement*.
- `stamped` is the whole header, which contains user text: titles, descriptions, verdicts.
- This site writes about prices. The `POST.md` example title itself contains `$2/$6`, which happens to be safe; `$$` or `$'` are not.

**Failure scenario** `description: "Pricing drops from $$ to $"`. Stamping rewrites it to `"from $ to $"`. A `$'` anywhere in the header inserts the rest of the file into the header. Nothing reports the change, and it lands on a published post.

**Fix**
- Use `text.replace(fm, () => stamped)`, or rebuild the text from the match index.
- Add a regression test with `$$` and `$'` in the title. It should fail on the current code first.

---

## Minor (documentation that misdescribes the code)

| # | Where | Problem |
|---|---|---|
| M1 | `POST.md:111-112` | The pre-merge checklist still says `npm run check:times` and doesn't mention the specimen number or committing the ledger. Should be `check:posts` plus "commit the ledger with the post". |
| M2 | `ARCHITECTURE.md:14`, `:24` | Says `check:times` runs "in both deploy workflows". Now it's `check:posts`, in one active workflow. |
| M3 | `ARCHITECTURE.md` content bullet | Says only `draft: true` removes a post from listings. `withdrawn` now does too, and `getPostPages` vs `getPublishedPosts` isn't described. |
| M4 | `PROGRESS.md` "Content" line | Still lists the Image, Video, Data and Databases desks and says 28 posts. The CHANGELOG says 25 published. |
| M5 | `BACKLOG.md:6` | Tells the bots the deploy stops at `check:times`. It's now `check:posts`, and the bots must also commit the ledger. |
| M6 | `BACKLOG.md:17` | "Catches it at merge": wrong, see B3. It catches it at deploy, after landing on `main`. |
| M7 | `src/styles/big-top-tokens.css:86-95` | Not documentation, but a visible regression live now, since the staging decision deploys every push to `main`. There are no `[data-section="creative"]` or `[data-section="infra"]` colour rules, so the Creative and Infra chips and cards render without their section colour (`var(--sec)` is unset). The three Creative posts are affected. Add two token lines until batch B replaces the file. |

---

## Informational

1. **The retired-section redirect pages depend on how Astro emits raw HTML (not verified, no build available).** `src/pages/section/[section].astro:67` emits the whole document through `<Fragment set:html>`. Astro prepends `<!DOCTYPE html>` when the first chunk doesn't match `/<!doctype html/i`. If an empty chunk comes first, you get a double doctype, which is harmless. The route also imports `BaseLayout`, and with it `global.css`. Check `dist/section/top/index.html` for a single doctype and for no stylesheet `<link>` or scripts before it or after `</html>`. The escaping is right, and so are `withBase` for the refresh target and `canonicalUrlFor` for the canonical.

2. **`public/_redirects` syntax is valid for Cloudflare Pages** (`/from /to 301`, `#` comments, both trailing-slash forms listed, far under the 2,000-rule limit). I believe Pages applies `_redirects` before serving a matching static file, but I couldn't verify it. After the next deploy, `curl -sI https://aitamer.news/section/top/` should return 301. The file duplicates `LEGACY_SECTIONS` by hand; add a test that parses `public/_redirects` and compares it with `LEGACY_SECTIONS`.

3. **Cache keys for the incremental build.**
   - Habitat pages: the key is built from the entry stamps of `getPublishedPosts` posts and their authors, so a post that is added, edited, moved between habitats or withdrawn changes it. Correct.
   - Redirect pages: the key `legacy:${target}` doesn't cover the stub template, the label, or the base path. The deploys use separate caches per host, so the base path is covered in practice.
   - Neither key covers code or theme changes. Before batch B, confirm that Astro 7's experimental incremental build throws the whole cache away when the build's code changes. If it doesn't, every unchanged post page would keep the old Big Top theme after the theme merge.
   - Cheap hardening now: `legacy:${target}:${SECTION_LABELS[target]}:v1`.

4. **The filename slug may not match Astro's post id.** `stamp-specimens` uses the raw filename; Astro's `glob` loader derives the id from a slugified path, or from a frontmatter `slug:` if present. I couldn't read Astro's source to confirm. Ledger slugs can then disagree with URLs. Enforce the slug pattern on filenames in `check:posts`, since `POST.md:10` states the rule but nothing checks it.

5. **Scheduled posts (task A6) will break "numbered in publish order".** A post scheduled for next week and stamped today gets a lower number than one published tomorrow. Decide before A6 whether a number is issued when the post is stamped or when it goes live.

6. **A renamed file is unrecoverable under the current checks.** The check reports "specimen N belongs to old-slug", and no procedure exists to fix it. Document the procedure, or add an append-only `renamed` ledger entry.

7. **At 10,000 posts on the free plan:**
   - About 10,000 hero JPEGs plus 10,000 post pages goes past Cloudflare's 20,000-file deploy cap. The plan already routes images to R2 in phase 2.
   - Home and habitat pages render every post, with no pagination (already in the backlog), and habitat cache keys grow to hundreds of KB.
   - RSS includes every post (the 50-item cap is in task C6).
   - Each redirect page's render also loads and resolves every post in its target habitat, then throws that work away.

8. **`heroImage` is unvalidated** (`src/content.config.ts:69`). The contract now invites `https://` URLs from machine writers. Constrain it to `^/heroes/[a-z0-9-]+\.jpg$` or `^https://`.

9. **The contract carries no version marker.** Before the posting tool validates against a published schema, consider a `contract: 1` field, or at least versioning `/contract/post.schema.json`.

10. **Magic value duplication.** The schema hard-codes `.min(1).max(5)` for wildness; `WILDNESS_MIN` and `WILDNESS_MAX` exist in `src/lib/wildness.ts`. The schema imports `HABITATS` already, so it can import these too.

11. **The disabled GitHub Pages workflow still runs `check:times` and still triggers on push** (`deploy-github-pages.yml:38`). Plan task A4 said `check:posts` goes in both workflows. The workflow is disabled in the GitHub interface, which I can't verify from here. Update it, or delete it if it stays retired.

12. **Test coverage.**
    - The tests for habitats, the redirect page, wildness and specimen formatting test real behaviour, not a copy of the implementation.
    - `stamp-specimens.test.mjs` covers only well-formed input. Missing:
      - every case in B1
      - the partial-failure path (B2)
      - the collision recovery (B3)
      - `$` in the header (B6)
    - Nothing tests the schema's rejections, such as `rating: 6`, a URL in `youtube`, or a retired section value. Plan task A3 made "rejects `rating: 6` naming the file" an acceptance check. I couldn't run the build, so that acceptance is unverified.

---

## Checked and found sound
- The seven-habitat model and the retired-value mapping:
  - `isLegacySection` guards against inherited object keys
  - the enum rejects retired values
  - the four migrated posts are correct
  - no remaining reference to the deleted covers
- The sitemap filter's base-path handling, and the redirect page's escaping and canonical.
- Every listing and feed uses `getPublishedPosts`, so withdrawn posts are excluded; post pages use `getPostPages`.
- The specimen assignment order matches the plan: the 25 ledger lines are consistent with each post's `pubDate`, ties broken by slug.
- The ledger text handles CRLF when parsing, and `withSpecimen` handles CRLF when writing.

Next: fix B2 and B6 first. Both are contained to one file and each needs one regression test.

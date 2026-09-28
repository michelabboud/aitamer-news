# Review record: the posts App's authors lane (PR #46), 2026-09-28

Two independent reviewers, each on a pinned commit in a detached checkout, each writing a cold read before reading the other's notes. Raw notes in `2026-09-28-author-lane/`.

| Round | Target | Reviewer | Verdict | Findings |
|---|---|---|---|---|
| 1 | `49236a3` | Ari (Codex, sol-deep) | BLOCKED | six: stale branch edits a now-human file; name clash against a later main; `STRASSE`/`Straße`; a copy read as an add; an unreadable author silently skipped; ARCHITECTURE wrong about installs |
| 1 | `49236a3` | Opus 5.5 | BLOCKED | B1 site/Astro frontmatter split (merge key, `+++`); B2 `slug:` moves an author id; B3 judged at the merge base only; addendum: the same split on posts |
| — | `53abdda`…`8dbcce5` | fixes | — | every finding above fixed with regression tests; ADR 0019 (one site-wide reader that must agree with Astro) |
| 2 | `8dbcce5` | Opus 5.5 | CLEAR | informational: honest `---` in an intro, non-plain YAML, CRLF/BOM now refused; nested bot author files escape the rendered-body gate (predates the PR) |
| 2 | `8dbcce5` | Ari | BLOCKED | B1 invisible characters (U+200D) beat the name clash; B2 inline YAML comments accepted |
| — | `81bf893` | fix | — | default-ignorable code points removed around the fold; whitespace-`#` refused in plain scalars; tests failed first, 655/655 |
| 3 | `81bf893` | Opus 5.5 (focused) | CLEAR | both classes closed; informational: cross-script look-alikes (Cyrillic `о`, U+2800) still distinct; unquoted ` #` in honest text refused (the MCP should always quote) |

**Ruling (coordinator, 2026-09-28):** every blocking finding is fixed and re-checked; the informational notes go to `BACKLOG.md`. Merge. After merge, and after telling the ops session: set `POSTS_ACTOR_ID`, allow `desk/authors-*` in the posts App's ruleset, and require branches to be up to date before merging.

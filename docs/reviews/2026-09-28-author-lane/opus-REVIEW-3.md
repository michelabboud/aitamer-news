# Re-check 3 — aitamer-news PR #46, `git diff 8dbcce5 81bf893` (opus lane)

Scope: Ari's two fixes at 81bf893: B1, `comparableName` strips `\p{Default_Ignorable_Code_Point}` before and after the folds; B2, `isPlainScalarText` refuses whitespace followed by `#`. For each, does it close its class, and does it break anything honest?

Method: my detached checkout `opus/tree`, moved to 81bf893, whose `node_modules` is the shared symlink. I ran plain `node` only: no astro sync, build or dev. Probe: `opus/probes/r3.mjs`, which runs the target's `comparableName` and `readAuthorFile` against both frontmatter readers.

Tests: `node --test scripts/check-publisher-paths.test.mjs scripts/frontmatter.test.mjs scripts/publisher-pr-workflow.test.mjs` → `tests 93 · pass 93 · fail 0`. All four existing author files still pass `readAuthorFile` (`ok`).

## B1: invisible characters in the name clash. Closed for its class.

Each of these, inserted into or appended to "Nova" / "Nova Lee", now **clashes** with the plain name:
- U+200D (ZWJ), U+200C (ZWNJ), U+00AD (soft hyphen), U+2060 (word joiner), U+FEFF (zero-width no-break space);
- U+FE0F and U+180B (variation selectors), U+034F (combining grapheme joiner), U+E0041 (tag character);
- U+200E and U+202E (bidi marks), U+3164 (Hangul filler);
- no-break space, ideographic space, fullwidth letters.

NFKC_Casefold maps exactly the Default_Ignorable_Code_Point set to nothing. So removing that set, before and after the folds, covers every character NFKC_CF drops. With the existing NFKC, case round-trip, and whitespace collapse steps, the class Ari found is closed. A modified author keeps its name by exact comparison, so adding an invisible character on a modify is already refused as a rename.

Honest names are unaffected:
- Zoë stays distinct from Zoe, and José from Jose.
- ZOË equals zoë.
- An emoji ZWJ sequence folds consistently: "Ada 👩‍💻" compares as "ada 👩💻", and two such names are compared the same way.

**Beyond the class (informational, pre-existing, not introduced here).** Two kinds of look-alike names still count as distinct:
- a visible look-alike from another script: "Nоva" with a Cyrillic о;
- a blank that is neither Default_Ignorable nor whitespace: U+2800 BRAILLE PATTERN BLANK in "Nova⠀Lee".

Closing that needs Unicode's confusables skeleton (UTS #39, a data table and so a dependency), or a rule that a name uses one script and printable, non-blank characters only. It is limited in two ways: every non-human author carries its "AI writer" or "bot" badge and schema.org type beside its name, and a human merges each pull request. I would put it in BACKLOG rather than block on it.

## B2: YAML comments. Closed.

Refused, each with a clear message:
- a plain value followed by ` # …`, or by a tab then `#`;
- a double-quoted or single-quoted value followed by ` # …`: the quoted patterns are anchored at both ends, so a trailing comment fails them, and a quote is not a plain start;
- a list item with a comment, plain or quoted;
- `beats: # …` on the key line;
- a whole-line comment, and a `...` document-end line (the line grammar).

Still accepted, correctly:
- a literal `#` with no space before it: `Writes C# and F#`;
- `#` anywhere inside quotes: `"Ranked #1 # really"` reads as that whole string.

With comments gone, I found no remaining way to put text in the frontmatter that neither reader reports:
- the line grammar already refuses continuations, block scalars, flow collections, anchors, aliases, tags, merge keys and document markers;
- quoted escapes such as `\x4e` or `‍` produce the value both readers judge, and the name fold covers the invisible ones.

## Honest content now refused

- **I1.** An unquoted value with a space before `#` is refused: `bio: Covers issue #42`, a name like `Agent #7`. It is correct YAML behaviour, because the comment really would cut the value. `\s` also matches a no-break space, which YAML does not treat as a comment separator, so `Writes #tag` with a no-break space before `#` is refused too: over-refusal in the safe direction. The fix belongs in the writer, not here. The posts MCP (atn-ops) should always emit double-quoted, JSON-escaped scalars for `name`, `bio`, `portraitAlt` and beats items; then no honest text is refused. Worth one line in its BACKLOG, next to the `---`-in-introduction note from re-check 2.

Nothing else honest changed. The new BACKLOG line records the nested-author gap from re-check 2, as asked.

VERDICT: CLEAR

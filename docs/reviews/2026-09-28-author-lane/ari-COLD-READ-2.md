# Cold read 2 — PR #46, target 8dbcce5

Read before opening the previous review or running its reproductions. This note is an independent first pass over the target, ADR 0018, ADR 0019, the changed reader, the authors guard, the id helper, the author check, and the privileged workflow. The checkout is detached at 8dbcce5; `node_modules` is a symlink and remains untouched.

The intended boundary is clear: the posts App may propose one plain `.md` author file, only for an AI writer or bot, while maintainers retain human profiles. The event sender, author account, action, branch shape, path, git status, mode, content at merge base and current main, names, and two frontmatter readers all participate. The publisher's comment and reaction lanes stay separate.

Initial attack questions, before comparison with earlier findings:

1. Does the frontmatter fence in `scripts/frontmatter.mjs` have any accepted text for which Astro's `extractFrontmatter` picks a different closing line, including blank lines, trailing spaces, and a second fence in the body? Deep equality of parsed data is the final defense, but scripts also use raw offsets for edits.
2. Does js-yaml's listener see every anchor, alias, or tag position, and does `NO_MERGE_SCHEMA` expose every merge-key spelling? The data equality check should still reject changed meanings; these are separate promises in ADR 0019.
3. Does `readAuthorFile`'s line grammar reject empty, quoted, or malformed values as promised, and could it reject an ordinary profile from the posts MCP? Its global body fence refusal looks stricter than Astro's own parser.
4. Does `authorEntryId` match Astro's glob entry path semantics for nested `.md` and `.mdx`, and does the duplicate check enumerate the same files? A `slug` field must have no effect on the built id.
5. Is current main actually used for both modifications and added-name clashes? The check sees event-time `BASE_SHA`; the repository ruleset still needs to keep a successful check from becoming stale before merge.
6. Does Unicode folding cover canonical and compatibility equivalents beyond the examples, including multi-code-point mappings? Does copy detection turn actual copied adds into `C` across unchanged sources?
7. Does importing Astro in the common frontmatter reader break any publisher or maintainer path that previously ran with bare Node? The workflow installs dependencies for the posts App by author id, while publisher and deploy guards import only `slug.mjs`.

These are hypotheses, not findings. The prior review has not been opened yet.

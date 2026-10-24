# `satteri` as a direct dependency · 2026-10-24

Vetting under rule 1.5 for the new direct dependency in `package.json` (`"satteri": "0.10.5"`), added by PR 330 for `src/lib/structured-data.ts`, which counts a story's prose words from the syntax tree of the same Markdown engine the site renders with.

- **Why a direct dependency:** it was already installed and in the lockfile as the engine of `@astrojs/markdown-satteri` (the site's Markdown processor, `src/lib/plain-body-markdown.ts`), which does not re-export `markdownToHast` or `mdxToHast`. Importing it undeclared would be a phantom dependency that breaks the day the tree is reshaped. `npm ls satteri` shows one copy, deduped.
- **Checked 2026-10-24 with `npm view` and `npm audit`:** installed 0.10.5 is the latest release (modified 2026-08-19, more than two weeks before this change); MIT; repository github.com/bruits/satteri; maintainer `princesseuh`, an Astro maintainer; no advisory for it in `npm audit`.
- **Pinned exactly,** like `js-yaml` and `parse5`, so the word count cannot shift under a patch release; `@astrojs/markdown-satteri` accepts `^0.10.3`, so the pin dedupes.
- **Alternatives rejected:** a hand-written Markdown stripper (a second interpretation of Markdown that drifts from the renderer), or dropping `wordCount` (a plan item).
- **Cost:** about 0.2 s over the whole library (1,031 posts); the count is computed once per story page.

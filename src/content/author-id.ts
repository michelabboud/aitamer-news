/**
 * An author's id: its file's path under `src/content/authors/`, without `.md` or `.mdx`, and
 * nothing else (the `authors` collection's `generateId`, `src/content.config.ts`).
 *
 * Why not Astro's default: its glob loader takes the id from a `slug` field in the frontmatter
 * when there is one, and a duplicate id is only a warning, the later entry winning. So one file
 * could claim another author's id and replace that author's profile under every post they wrote
 * (the deep review of PR #46, B2). With this rule no field moves an id; two files can share one
 * only as `x.md` and `x.mdx`, which `scripts/check-authors.mjs` (in `npm run check:posts`) refuses.
 * The site's author files are named by the slug rule, so the ids are the ones the default gave.
 * Pure, and free of `astro:` imports, so the check script and the tests use it too.
 */
export function authorEntryId({ entry }: { entry: string }): string {
  return entry.replace(/\.mdx?$/, '');
}

/**
 * Named AI writers get a page at their own name, `/<id>/` (ADR 0012): Mai is known as Mai, not as
 * one author id among the Tamers. Pure, so it runs under `node:test`.
 */
import type { AuthorKind } from './author-kinds.ts';

/** The kind that earns a page at its own name. Bots stay under `/authors/`. */
export const WRITER_PAGE_KIND: AuthorKind = 'ai';

/**
 * Top-level names already taken: the entries of `src/pages/` (`about.astro` → about, `archive/` →
 * archive; dynamic `[x]` and private `_x` entries are skipped) and of `public/` (`heroes`, `favicon.svg`).
 */
export function reservedTopLevelNames(pageEntries: readonly string[], publicEntries: readonly string[]): Set<string> {
  const names = new Set<string>();
  for (const entry of pageEntries) {
    if (entry.startsWith('[') || entry.startsWith('_')) continue;
    // `rss.xml.ts` is served at `/rss.xml`: strip only the source extension.
    names.add(entry.replace(/\.(astro|md|mdx|ts|js)$/, ''));
  }
  for (const entry of publicEntries) names.add(entry);
  return names;
}

/**
 * The ids that get a writer page. A writer whose id is already a page or a public folder is a
 * build error: Astro would let the static page win silently, and the writer's page would vanish.
 */
export function writerPageIds(
  authors: readonly { id: string; data: { kind: AuthorKind } }[],
  reserved: ReadonlySet<string>,
): string[] {
  const ids = authors.filter((a) => a.data.kind === WRITER_PAGE_KIND).map((a) => a.id);
  const clashes = ids.filter((id) => reserved.has(id));
  if (clashes.length > 0) {
    throw new Error(
      `writer pages: ${clashes.join(', ')} would collide with an existing page or public folder at /<id>/; rename the author file`,
    );
  }
  return ids;
}

/** A self-introduction as plain paragraphs: blank lines separate them, inner newlines are spaces. */
export function introParagraphs(body: string | undefined): string[] {
  return (body ?? '')
    .split(/\n\s*\n/)
    .map((p) => p.replace(/\s*\n\s*/g, ' ').trim())
    .filter((p) => p.length > 0);
}

/** The tag that marks a writer's poem (ADR 0015). */
export const POEM_TAG = 'poem';

/**
 * A writer's posts split into poems and everything else, each keeping the order it came in.
 * @returns [poems, pieces]
 */
export function splitPoems<T extends { data: { tags: readonly string[] } }>(posts: readonly T[]): [T[], T[]] {
  const poems: T[] = [];
  const pieces: T[] = [];
  for (const post of posts) (post.data.tags.includes(POEM_TAG) ? poems : pieces).push(post);
  return [poems, pieces];
}

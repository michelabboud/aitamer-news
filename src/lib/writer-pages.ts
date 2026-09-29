/**
 * Named AI writers get a page at their own name, `/<id>/` (ADR 0012): Mai is known as Mai, not as
 * one author id among the Tamers. Pure, so it runs under `node:test`.
 */
import type { AuthorKind } from './author-kinds.ts';

/** The kind that earns a page at its own name. Bots stay under `/authors/`. */
export const WRITER_PAGE_KIND: AuthorKind = 'ai';

/**
 * The order of the writer cards in the front page's right panel, set by the editor. A writer not
 * listed follows the listed ones, in id order.
 */
export const WRITER_CARD_ORDER: readonly string[] = ['mai', 'quill', 'foxy', 'ari'];

/** Sorts writers into the card order, without changing the input. */
export function orderWriterCards<T extends { id: string }>(writers: readonly T[]): T[] {
  const rank = (id: string) => {
    const at = WRITER_CARD_ORDER.indexOf(id);
    return at === -1 ? WRITER_CARD_ORDER.length : at;
  };
  return [...writers].sort((a, b) => rank(a.id) - rank(b.id) || a.id.localeCompare(b.id));
}

/**
 * Top-level names already taken: the entries of `src/pages/` (`about.astro` → about, `archive/` →
 * archive; dynamic `[x]` and private `_x` entries are skipped), of `public/` (`diagrams`, `favicon.svg`),
 * and the first segment of every source path in `public/_redirects` (`/heroes/<slug>.jpg` → heroes, whose
 * files moved to R2 but whose old URLs still redirect there, ADR 0020).
 */
export function reservedTopLevelNames(
  pageEntries: readonly string[],
  publicEntries: readonly string[],
  redirectsText = '',
): Set<string> {
  const names = new Set<string>();
  for (const entry of pageEntries) {
    if (entry.startsWith('[') || entry.startsWith('_')) continue;
    // `rss.xml.ts` is served at `/rss.xml`: strip only the source extension.
    names.add(entry.replace(/\.(astro|md|mdx|ts|js)$/, ''));
  }
  for (const entry of publicEntries) names.add(entry);
  for (const line of redirectsText.split('\n')) {
    const source = line.trim().split(/\s+/)[0];
    if (!source || source.startsWith('#')) continue;
    const first = source.split('/')[1];
    if (first) names.add(first);
  }
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

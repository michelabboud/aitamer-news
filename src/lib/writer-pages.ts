/** Featured writer selection and presentation, shared by all writer links (ADR 0032). */
import { kindRole, kindNoun, type AuthorKind } from './author-kinds.ts';

export interface WriterAuthor {
  id: string;
  data: {
    kind: AuthorKind;
    featured?: boolean;
    writerOrder?: number;
  };
}

/** Existing AI writers keep their card positions; integer gaps admit editorial additions. */
export const WRITER_CARD_ORDER: readonly string[] = ['mai', 'quill', 'foxy', 'ari'];
const DEFAULT_ORDER_STEP = 10;

/** AI writers default in, human writers explicitly opt in, and desk bots stay profiles. */
export function isFeaturedWriter(author: WriterAuthor): boolean {
  return author.data.kind !== 'bot' && (author.data.featured ?? author.data.kind === 'ai');
}

/** The fuller introduction for featured writers, otherwise their ordinary author profile. */
export function writerAuthorPath(author: WriterAuthor): string {
  return isFeaturedWriter(author) ? `/${author.id}/` : `/authors/${author.id}/`;
}

/** Featured human contributors are writers; unfeatured humans retain the editor role. */
export function writerRole(author: WriterAuthor): string {
  return author.data.kind === 'human' && isFeaturedWriter(author) ? 'Human writer' : kindRole(author.data.kind);
}

/** Matching noun phrase for article signoffs and machine-readable author descriptions. */
export function writerNoun(author: WriterAuthor): string {
  return author.data.kind === 'human' && isFeaturedWriter(author) ? 'a human writer' : kindNoun(author.data.kind);
}

/** Sorts cards and menu links without changing the input; tied ranks use author IDs. */
export function orderWriterCards<T extends { id: string; data?: { writerOrder?: number } }>(writers: readonly T[]): T[] {
  const rank = (writer: T) => {
    if (writer.data?.writerOrder !== undefined) return writer.data.writerOrder;
    const at = WRITER_CARD_ORDER.indexOf(writer.id);
    return at === -1 ? Number.POSITIVE_INFINITY : at * DEFAULT_ORDER_STEP;
  };
  return [...writers].sort((a, b) => {
    const aRank = rank(a);
    const bRank = rank(b);
    return (aRank === bRank ? 0 : aRank < bRank ? -1 : 1) || a.id.localeCompare(b.id);
  });
}

/** No disclosure without explicit opt-in, regardless of author kind. */
export function personalOpinionDisclosure(author: { data: { name: string; personalOpinion?: boolean } } | undefined): { label: string; disclaimer: string } | undefined {
  if (author?.data.personalOpinion !== true) return undefined;
  return {
    label: 'Personal opinion',
    disclaimer: `This article expresses ${author.data.name}’s personal views. These opinions are the author’s own and do not necessarily reflect AI Tamer’s views. Factual claims remain subject to our sourcing and correction standards.`,
  };
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
  authors: readonly WriterAuthor[],
  reserved: ReadonlySet<string>,
): string[] {
  const ids = authors.filter(isFeaturedWriter).map((a) => a.id);
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

/**
 * Facts for schema.org markup that more than one page emits: who publishes the site, what language
 * it is in, how long a story is and which outside page a writer vouches for. Pure on purpose (no
 * `astro:content`), so a plain `node:test` run covers it, like `json-ld.ts` and `site-meta.ts`.
 *
 * Only facts the site can show are here. The publisher has no `sameAs`, email, phone, address,
 * founding date or funder, because none is published anywhere a reader could check; add one the day
 * it is real, with the page that states it.
 */
import { markdownToHast, mdxToHast } from 'satteri';
import { isHuman, type AuthorKind } from './author-kinds.ts';
import { SITE } from './site-meta.ts';

/** The site is written in English; `inLanguage` on stories and the home page. */
export const SITE_LANGUAGE = 'en';

/** One id for the publisher, so the home page graph and any page that cites it name the same node. */
export const PUBLISHER_ID = `${SITE.url}/#organization`;

/** The brand mark in `public/`: the cat with the red ball, 180×180, the largest square the site has. */
const LOGO_PATH = '/apple-touch-icon.png';
const LOGO_SIZE = 180;

/** Where a reader reaches the desk: the form on the About page, the only contact the site publishes. */
const CONTACT_PATH = '/about/#contact';

/** The publisher as a full schema.org Organization, without `@context` (the caller supplies it). */
export function publisherOrganization() {
  return {
    '@type': 'Organization',
    '@id': PUBLISHER_ID,
    name: SITE.title,
    url: SITE.url,
    description: SITE.description,
    logo: {
      '@type': 'ImageObject',
      url: `${SITE.url}${LOGO_PATH}`,
      width: LOGO_SIZE,
      height: LOGO_SIZE,
    },
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'editorial',
      url: `${SITE.url}${CONTACT_PATH}`,
      availableLanguage: SITE_LANGUAGE,
    },
  } as const;
}

/**
 * `sameAs` for a writer: the writer's own website, and only for a human. A bot or an AI writer
 * has no outside identity to vouch for, and claiming one would be the invention the site avoids.
 * HTTPS only, matching the author schema's rule for `website`.
 */
export function authorSameAs(kind: AuthorKind, website: string | undefined): string[] | undefined {
  if (!isHuman(kind) || !website?.startsWith('https://')) return undefined;
  return [website];
}

/** The part of satteri's hast tree the counter reads. */
interface HastNode {
  type: string;
  value?: string;
  tagName?: string;
  properties?: Record<string, unknown>;
  children?: HastNode[];
}

/** Elements whose text is not prose: code, and what a browser never shows as words. */
const NOT_PROSE = new Set(['pre', 'code', 'script', 'style']);

/** A footnote's generated parts: the numbered reference, and the section at the end that lists them. */
function isFootnotePart(node: HastNode): boolean {
  if (node.properties?.dataFootnotes !== undefined) return true;
  return node.tagName === 'sup' && node.children?.some((c) => c.properties?.dataFootnoteRef !== undefined) === true;
}

function proseText(node: HastNode, out: string[]): void {
  if (node.type === 'text') {
    if (node.value) out.push(node.value);
    return;
  }
  // Comments, MDX import/export blocks and `{expression}`s have no children and are not text nodes.
  if (node.type === 'element' && (NOT_PROSE.has(node.tagName ?? '') || isFootnotePart(node))) return;
  for (const child of node.children ?? []) proseText(child, out);
}

/**
 * Words of prose in a story's Markdown body, for `wordCount`. The body is parsed by the site's own
 * Markdown engine (Sätteri; MDX with `mdx`) and the words are counted in the text a reader sees:
 * code blocks, inline code, scripts, comments, footnote numbering, MDX imports and expressions are
 * left out, and so are link and image URLs (attributes). A token counts only if it holds a letter or
 * a digit and is not a bare web address, so a table's pipes, a lone dash and an autolink are not
 * words. In MDX the engine decides what is code: a line starting `import` or `export` is ESM there
 * too. An approximation of reading length, not a typesetter's count.
 */
export function articleWordCount(body: string | undefined, options: { mdx?: boolean } = {}): number {
  if (!body) return 0;
  const tree = (options.mdx ? mdxToHast(body) : markdownToHast(body, { features: { rawHtml: true } })) as HastNode;
  const pieces: string[] = [];
  proseText(tree, pieces);
  return pieces
    .join(' ')
    .split(/\s+/)
    .filter((token) => /[\p{L}\p{N}]/u.test(token) && !/^https?:\/\//i.test(token)).length;
}

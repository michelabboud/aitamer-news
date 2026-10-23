/** Browser-safe batch protocol. No Node, Astro or content imports belong in this module. */
import { HOME_FEED_SCHEMA } from './home-feed.ts';

export class HomeFeedProtocolError extends Error {
  readonly stale: boolean;
  constructor(message: string, stale = false) { super(message); this.name = 'HomeFeedProtocolError'; this.stale = stale; }
}
export interface FeedTree {
  tag: string; namespace?: string; text?: string;
  attrs: { name: string; value: string }[]; children: FeedTree[];
}
export interface BatchExpectation {
  snapshot: string; index: number; offset: number; count: number; seenIds: ReadonlySet<string>; pageUrl: string;
}
/** Match the publishing slug contract, including repeated and trailing hyphens. */
export const HOME_POST_ID = /^[a-z0-9][a-z0-9-]*$/;
export const HOME_POST_ID_MAX = 120;
const HTML_NAMESPACE = 'http://www.w3.org/1999/xhtml';
const CARD_TAGS = new Set(['li', 'article', 'a', 'picture', 'source', 'img', 'span', 'div', 'h3', 'p']);
const CARD_ATTRS = new Set(['class', 'id', 'data-home-post', 'data-responsive-hero', 'href', 'tabindex', 'aria-hidden', 'aria-label', 'role', 'src', 'srcset', 'sizes', 'type', 'alt', 'width', 'height', 'loading', 'decoding', 'fetchpriority', 'style']);
const fail = (message: string): never => { throw new HomeFeedProtocolError(message); };
const meaningful = (nodes: FeedTree[]) => nodes.filter((node) => node.tag || node.text?.trim());
const attributes = (node: FeedTree) => Object.fromEntries(node.attrs.map((attr) => [attr.name, attr.value]));

export function batchUrl(prefix: string, index: number, pageUrl: string): string {
  const page = new URL(pageUrl);
  const homePath = page.pathname.endsWith('/') ? page.pathname : `${page.pathname}/`;
  if (!Number.isSafeInteger(index) || index < 1 || index > 10 || prefix !== `${homePath}home-feed/`) fail('Invalid homepage batch URL');
  const url = new URL(`${prefix}${index}/`, page);
  if (url.origin !== page.origin || url.search || url.hash) fail('Invalid homepage batch URL');
  return url.href;
}

function validateUrl(value: string, pageUrl: string, sameOrigin: boolean) {
  if (/[\u0000-\u0020\u007f]/.test(value)) fail('Invalid URL in homepage card');
  let url: URL;
  try { url = new URL(value, pageUrl); } catch { return fail('Invalid URL in homepage card'); }
  if (!['https:', 'http:'].includes(url.protocol) || url.username || url.password || (sameOrigin && url.origin !== new URL(pageUrl).origin)) fail('Unsafe URL in homepage card');
}

/** Validate all metadata and all card nodes before the caller moves any nodes into the live page. */
export function validateBatchTree(tree: FeedTree, expected: BatchExpectation): string[] {
  let template: FeedTree | undefined;
  let nodes = 0;
  function shell(node: FeedTree) {
    if (++nodes > 10000) fail('Homepage batch has too many nodes');
    if (node.tag === 'template') {
      if (template) fail('Homepage batch has more than one template');
      template = node;
      return;
    }
    if (node.tag && !['html', 'head', 'body'].includes(node.tag)) fail('Unexpected content outside homepage template');
    if (node.text?.trim() || node.attrs.length) fail('Unexpected content outside homepage template');
    node.children.forEach(shell);
  }
  shell(tree);
  if (!template) fail('Homepage batch is missing its inert template');
  const meta = attributes(template);
  const allowed = new Set(['data-home-feed-schema', 'data-home-feed-snapshot', 'data-home-feed-index', 'data-home-feed-offset', 'data-home-feed-count', 'data-home-feed-ids', 'data-pagefind-ignore']);
  if (template.attrs.some((attr) => !allowed.has(attr.name))) fail('Unexpected homepage batch metadata');
  if (meta['data-home-feed-schema'] !== String(HOME_FEED_SCHEMA)) fail('Unknown homepage batch schema');
  if (!/^[a-f0-9]{64}$/.test(meta['data-home-feed-snapshot'] ?? '')) fail('Invalid homepage snapshot');
  if (meta['data-home-feed-snapshot'] !== expected.snapshot) throw new HomeFeedProtocolError('The homepage changed. Refresh for the latest stories.', true);
  for (const [name, value] of [['index', expected.index], ['offset', expected.offset], ['count', expected.count]] as const) {
    if (meta[`data-home-feed-${name}`] !== String(value)) fail(`Incorrect homepage batch ${name}`);
  }
  let ids: unknown;
  try { ids = JSON.parse(meta['data-home-feed-ids']); } catch { return fail('Invalid homepage batch IDs'); }
  if (!Array.isArray(ids) || ids.length !== expected.count || ids.some((id) => typeof id !== 'string' || id.length > HOME_POST_ID_MAX || !HOME_POST_ID.test(id) || expected.seenIds.has(id)) || new Set(ids).size !== ids.length) fail('Invalid, repeated or already shown homepage IDs');
  const cards = meaningful(template.children);
  if (cards.length !== ids.length) fail('Incorrect homepage card count');
  function cardTree(node: FeedTree, root: boolean) {
    if (++nodes > 10000) fail('Homepage batch has too many nodes');
    if (!node.tag) { node.children.forEach((child) => cardTree(child, false)); return; }
    if (!CARD_TAGS.has(node.tag) || node.namespace !== HTML_NAMESPACE) fail('Active or unsupported content in homepage batch');
    for (const { name, value } of node.attrs) {
      if (!CARD_ATTRS.has(name) || (!root && ['id', 'data-home-post'].includes(name))) fail('Unsupported attribute in homepage card');
      if (name === 'style' && !/^background:\s*var\(--wild-(?:[1-5]|empty)\)\s*;?$/.test(value)) fail('Unsupported style in homepage card');
      if (name === 'href' || name === 'src') validateUrl(value, expected.pageUrl, name === 'href');
      if (name === 'srcset') {
        for (const candidate of value.split(',')) {
          const parts = candidate.trim().split(/\s+/);
          if (parts.length > 2 || (parts[1] && !/^\d+(?:\.\d+)?[wx]$/.test(parts[1]))) fail('Invalid image candidates');
          validateUrl(parts[0], expected.pageUrl, false);
        }
      }
    }
    node.children.forEach((child) => cardTree(child, false));
  }
  cards.forEach((card, i) => {
    const attrs = attributes(card);
    if (card.tag !== 'li' || attrs['data-home-post'] !== ids[i] || attrs.id !== `home-post-${ids[i]}`) fail('Homepage card IDs disagree with metadata');
    cardTree(card, true);
  });
  return ids as string[];
}

export function domFeedTree(node: Node): FeedTree {
  const element = node.nodeType === 1 ? node as Element : undefined;
  const children = element?.tagName === 'TEMPLATE' ? (element as HTMLTemplateElement).content.childNodes : node.childNodes;
  return {
    tag: element?.localName ?? '', namespace: element?.namespaceURI ?? undefined,
    text: node.nodeType === 3 ? node.textContent ?? '' : '',
    attrs: element ? [...element.attributes].map(({ name, value }) => ({ name, value })) : [],
    children: [...children].map(domFeedTree),
  };
}

import { getCollection, getEntry, type CollectionEntry } from 'astro:content';
import { groupByMonth, type ArchiveMonth } from './archive.ts';
import { HABITATS, habitatOf, specimenNumbers, type Habitat } from './bestiary.ts';

export { archiveMonthOf, formatArchiveMonth, type ArchiveMonth } from './archive.ts';
export {
  HABITATS,
  WILDNESS_LABELS,
  WILDNESS_MEANINGS,
  extinctionWatch,
  formatSpecimen,
  habitatBySlug,
  habitatOf,
  wildnessSegments,
  type Habitat,
  type Wildness,
} from './bestiary.ts';

export const SITE = {
  title: 'AI Tamer',
  domain: 'aitamer.news',
  description:
    'Short, sourced briefs on models, tools, and policy. Every story names a human or a bot.',
  url: 'https://aitamer.news',
} as const;

/** GA4 measurement ID. The tag loads only on aitamer.news, not on the GitHub Pages copy. */
export const ANALYTICS_ID = 'G-3X3YRW621Y';

/**
 * Where the About page form posts: the contact Worker (workers/contact). Public by nature.
 * PUBLIC_CONTACT_ENDPOINT points a local build at `wrangler dev` (http://localhost:8787/).
 */
export const CONTACT_ENDPOINT: string =
  import.meta.env.PUBLIC_CONTACT_ENDPOINT || 'https://contact.aitamer.news/';

/**
 * Cloudflare Turnstile site key for the contact form. Public (it ships in the page); empty = widget off.
 * Set it together with the Worker secret TURNSTILE_SECRET_KEY, never one without the other.
 */
export const TURNSTILE_SITE_KEY = '';

/** Disqus shortname for story comments. Threads are keyed to the aitamer.news canonical URL. */
export const DISQUS_SHORTNAME = 'ai-tamer-news';

export const ALL_SECTIONS = [
  'top',
  'models',
  'tools',
  'image',
  'video',
  'data',
  'databases',
  'rust',
  'policy',
  'opinion',
] as const;

export type Section = (typeof ALL_SECTIONS)[number];

export const SECTION_LABELS: Record<Section, string> = {
  top: 'Top',
  models: 'Models',
  tools: 'Tools',
  image: 'Image',
  video: 'Video',
  data: 'Data',
  databases: 'Databases',
  rust: 'Rust',
  policy: 'Policy',
  opinion: 'Opinion',
};

/** Changes when a content entry's body or frontmatter changes. Used as an incremental-build cache key. */
export function entryStamp(entry: { id: string; digest?: string }): string {
  return `${entry.id}@${entry.digest ?? 'no-digest'}`;
}

export function isPublished(post: CollectionEntry<'posts'>): boolean {
  return !post.data.draft;
}

export async function getPublishedPosts(): Promise<CollectionEntry<'posts'>[]> {
  const posts = await getCollection('posts', isPublished);
  // Posts merged together share a publish time; the id keeps their order stable.
  return posts.sort(
    (a, b) =>
      b.data.pubDate.valueOf() - a.data.pubDate.valueOf() || a.id.localeCompare(b.id),
  );
}

export async function getPostsBySection(
  section: Section,
): Promise<CollectionEntry<'posts'>[]> {
  const posts = await getPublishedPosts();
  return posts.filter((p) => p.data.section === section);
}

/** Published posts in one habitat, newest first. */
export async function getPostsByHabitat(habitat: Habitat): Promise<CollectionEntry<'posts'>[]> {
  const posts = await getPublishedPosts();
  return posts.filter((p) => habitat.sections.includes(p.data.section));
}

/** Published post count per habitat slug. */
export async function getHabitatCounts(): Promise<Map<string, number>> {
  const posts = await getPublishedPosts();
  return new Map(
    HABITATS.map((h) => [h.slug, posts.filter((p) => h.sections.includes(p.data.section)).length]),
  );
}

/** Specimen number for every published post id. See `specimenNumbers` in bestiary.ts. */
export async function getSpecimenNumbers(): Promise<Map<string, number>> {
  return specimenNumbers(await getPublishedPosts());
}

export async function getPostsByAuthor(
  authorId: string,
): Promise<CollectionEntry<'posts'>[]> {
  const posts = await getPublishedPosts();
  return posts.filter((p) => p.data.author.id === authorId);
}

/** Published posts grouped by month, newest month first; posts keep newest-first order. */
export async function getArchiveMonths(): Promise<ArchiveMonth<CollectionEntry<'posts'>>[]> {
  return groupByMonth(await getPublishedPosts());
}

export async function resolveAuthor(post: CollectionEntry<'posts'>) {
  return getEntry(post.data.author);
}

export function formatDate(date: Date): string {
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC',
  });
}

/** Publish date and time for the article byline, in UTC, e.g. "Sep 24, 2026, 09:15 UTC". */
export function formatDateTime(date: Date): string {
  const stamp = date.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
    timeZone: 'UTC',
  });
  return `${stamp} UTC`;
}

/** Prefix a root path with Astro's base. No-op when the site is served at `/`. */
export function withBase(path: string): string {
  if (!path.startsWith('/') || path.startsWith('//')) return path;
  const base = import.meta.env.BASE_URL;
  if (!base || base === '/') return path;
  const prefix = base.endsWith('/') ? base.slice(0, -1) : base;
  return `${prefix}${path}`;
}

/** Pathname with the deploy base removed, for the canonical aitamer.news URL. */
export function canonicalPath(pathname: string): string {
  const base = import.meta.env.BASE_URL || '/';
  const prefix = base.endsWith('/') ? base.slice(0, -1) : base;
  if (!prefix) return pathname || '/';
  if (pathname === prefix || pathname === `${prefix}/`) return '/';
  if (pathname.startsWith(`${prefix}/`)) return pathname.slice(prefix.length) || '/';
  return pathname || '/';
}

export function canonicalUrlFor(pathname: string): string {
  return new URL(canonicalPath(pathname), SITE.url).toString();
}

export function sectionHref(section: Section): string {
  return withBase(`/section/${section}/`);
}

export function postHref(post: CollectionEntry<'posts'>): string {
  return withBase(`/posts/${post.id}/`);
}

export function habitatHref(habitat: Habitat): string {
  return withBase(`/habitat/${habitat.slug}/`);
}

export function habitatOfPost(post: CollectionEntry<'posts'>): Habitat {
  return habitatOf(post.data.section);
}

/** "09:15", in UTC. */
export function formatClock(date: Date): string {
  return date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
    timeZone: 'UTC',
  });
}

/** "SEP 23", in UTC. */
export function formatShortDate(date: Date): string {
  return date
    .toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' })
    .toUpperCase();
}

/** Rough reading time from a Markdown body, at 230 words a minute. */
export function readingMinutes(body: string | undefined): number {
  const words = (body ?? '').split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 230));
}

export function archiveHref(year?: string, month?: string): string {
  if (!year) return withBase('/archive/');
  if (!month) return withBase(`/archive/${year}/`);
  return withBase(`/archive/${year}/${month}/`);
}

export function authorHref(id: string): string {
  return withBase(`/authors/${id}/`);
}

export function isSection(value: string): value is Section {
  return (ALL_SECTIONS as readonly string[]).includes(value);
}

import { getCollection, getEntry, type CollectionEntry } from 'astro:content';

export const SITE = {
  title: 'AI Tamer',
  domain: 'aitamer.news',
  description:
    'AI Tamer (aitamer.news) — concise reporting on AI models, tools, policy, and opinion.',
  url: 'https://aitamer.news',
} as const;

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
  return posts.sort(
    (a, b) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf(),
  );
}

export async function getPostsBySection(
  section: Section,
): Promise<CollectionEntry<'posts'>[]> {
  const posts = await getPublishedPosts();
  return posts.filter((p) => p.data.section === section);
}

export async function getPostsByAuthor(
  authorId: string,
): Promise<CollectionEntry<'posts'>[]> {
  const posts = await getPublishedPosts();
  return posts.filter((p) => p.data.author.id === authorId);
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

export function authorHref(id: string): string {
  return withBase(`/authors/${id}/`);
}

export function isSection(value: string): value is Section {
  return (ALL_SECTIONS as readonly string[]).includes(value);
}

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
  'policy',
  'opinion',
] as const;

export type Section = (typeof ALL_SECTIONS)[number];

export const SECTION_LABELS: Record<Section, string> = {
  top: 'Top',
  models: 'Models',
  tools: 'Tools',
  policy: 'Policy',
  opinion: 'Opinion',
};

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

export function sectionHref(section: Section): string {
  return `/section/${section}/`;
}

export function postHref(post: CollectionEntry<'posts'>): string {
  return `/posts/${post.id}/`;
}

export function authorHref(id: string): string {
  return `/authors/${id}/`;
}

export function isSection(value: string): value is Section {
  return (ALL_SECTIONS as readonly string[]) .includes(value);
}

/** The author directory uses the same editorial roster as the homepage, including new authors. */
import { orderHomeAuthors } from './front-page.ts';
import { MEDIA_ORIGINS } from './media.ts';

interface AuthoredPost {
  data: { author: { id: string } };
}

/** Call with getPublishedPosts(), so drafts, future posts and withdrawals never inflate counts. */
export function buildAuthorDirectory<T extends { id: string }>(
  authors: readonly T[],
  publishedPosts: readonly AuthoredPost[],
): { author: T; count: number }[] {
  const counts = new Map<string, number>();
  for (const post of publishedPosts) {
    const id = post.data.author.id;
    counts.set(id, (counts.get(id) ?? 0) + 1);
  }
  return orderHomeAuthors(authors).map((author) => ({ author, count: counts.get(author.id) ?? 0 }));
}

/** Existing small sibling recorded in docs/reports/2026-10-05-desk-bot-profile.md on the news site. */
const SMALL_AVATARS: ReadonlyMap<string, string> = new Map([
  ['https://bots.aitamer.news/authors/desk-bot-avatar-768-29791c2c.jpg',
    'https://bots.aitamer.news/authors/desk-bot-avatar-208-803a50f0.jpg'],
]);
const MAX_AVATAR_WIDTH = 256;
const AUTHOR_IMAGE_PATH = /^\/authors\/[a-z0-9-]+\.(?:jpg|jpeg|png|webp)$/;

/** Keep existing author avatars; missing, unsafe or explicitly oversized sources use initials. */
export function directoryAvatar(avatar: string | undefined): string | undefined {
  if (!avatar) return undefined;
  const source = SMALL_AVATARS.get(avatar) ?? avatar;
  const origin = MEDIA_ORIGINS.find((candidate) => source.startsWith(`${candidate}/`));
  const path = origin ? source.slice(origin.length) : source;
  if (!AUTHOR_IMAGE_PATH.test(path)) return undefined;
  const declaredWidth = /-avatar-(\d+)(?:-|\.)/.exec(path)?.[1];
  if (declaredWidth && Number(declaredWidth) > MAX_AVATAR_WIDTH) return undefined;
  return source;
}

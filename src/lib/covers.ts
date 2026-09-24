import type { CollectionEntry } from 'astro:content';
import { ALL_SECTIONS, type Section } from './site';

export const SECTION_COVERS: Record<Section, string> = {
  top: '/covers/top.svg',
  models: '/covers/models.svg',
  tools: '/covers/tools.svg',
  image: '/covers/image.svg',
  video: '/covers/video.svg',
  data: '/covers/data.svg',
  databases: '/covers/databases.svg',
  rust: '/covers/rust.svg',
  policy: '/covers/policy.svg',
  opinion: '/covers/opinion.svg',
};

/** Ensure every ALL_SECTIONS entry has a cover path (compile-time sanity). */
const _coversComplete: Record<(typeof ALL_SECTIONS)[number], string> = SECTION_COVERS;
void _coversComplete;

export function coverForSection(section: Section): string {
  return SECTION_COVERS[section];
}

/** Prefer a post's heroImage when set; otherwise the section house cover. */
export function postCover(post: CollectionEntry<'posts'>): string {
  return post.data.heroImage?.trim() || coverForSection(post.data.section as Section);
}

export function usesGeneratedCover(post: CollectionEntry<'posts'>): boolean {
  return !post.data.heroImage?.trim();
}

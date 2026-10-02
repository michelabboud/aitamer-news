import type { APIContext } from 'astro';
import { revDocument } from '../../lib/freshness';
import { getPublishedPosts } from '../../lib/site';

/** One tiny document per live story: an open page compares it with the `rev` it was built with (Freshness.astro). */
export async function getStaticPaths() {
  const posts = await getPublishedPosts();
  return posts.map((post) => ({ params: { slug: post.id }, props: { doc: revDocument(post) } }));
}

export function GET({ props }: APIContext) {
  return Response.json(props.doc);
}

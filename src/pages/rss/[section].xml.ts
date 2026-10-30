/** One RSS feed per habitat: /rss/<section>.xml. Same posts and filters as /rss.xml, narrowed to the habitat. */
import type { APIContext } from 'astro';
import { feedSiteUrl, rssFeed } from '../../lib/rss-feed';
import { ALL_SECTIONS, SITE, getPostsBySection, habitatOf, sectionHref, type Section } from '../../lib/site';

export function getStaticPaths() {
  return ALL_SECTIONS.map((section) => ({ params: { section } }));
}

export async function GET(context: APIContext) {
  const section = context.params.section as Section;
  const habitat = habitatOf(section);
  const posts = await getPostsBySection(section);
  return rssFeed({
    posts,
    title: `${SITE.title}: ${habitat.name}`,
    description: `Habitat ${habitat.code}: ${habitat.blurb}`,
    site: feedSiteUrl(sectionHref(section), context.site),
  });
}

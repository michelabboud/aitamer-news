/**
 * One RSS feed per subsection a published post uses: /rss/<section>/<subsection>.xml. Same posts
 * and filters as /rss.xml, narrowed to the habitat and subsection (`subsectionFeeds` in feeds.ts).
 */
import type { APIContext } from 'astro';
import { inSubsection, subsectionFeeds } from '../../../lib/feeds';
import { feedSiteUrl, rssFeed } from '../../../lib/rss-feed';
import { ALL_SECTIONS, SITE, getPublishedPosts, habitatOf, sectionHref, type Section } from '../../../lib/site';

export async function getStaticPaths() {
  const posts = await getPublishedPosts();
  const feeds = subsectionFeeds(posts.map((post) => post.data), ALL_SECTIONS);
  return feeds.map(({ section, subsection }) => ({ params: { section, subsection } }));
}

export async function GET(context: APIContext) {
  const section = context.params.section as Section;
  const subsection = context.params.subsection as string;
  const habitat = habitatOf(section);
  return rssFeed({
    posts: inSubsection(await getPublishedPosts(), section, subsection),
    title: `${SITE.title}: ${habitat.name}, ${subsection}`,
    description: `Habitat ${habitat.code} (${habitat.name}), subsection ${subsection}: ${habitat.blurb}`,
    site: feedSiteUrl(sectionHref(section), context.site),
  });
}

import type { APIContext } from 'astro';
import { FEED_LIMIT, llmsTxtLatestSection, takeNewest, type FeedPost } from '../lib/feeds';
import {
  HABITATS,
  HABITAT_META,
  SECTION_LABELS,
  SITE,
  canonicalUrlFor,
  getPublishedPosts,
  postHref,
  sectionHref,
  withBase,
  type Section,
} from '../lib/site';

/** llmstxt.org format: https://llmstxt.org/ */
export async function GET(_context: APIContext) {
  const posts = takeNewest(await getPublishedPosts(), FEED_LIMIT);
  const latestPosts: FeedPost[] = posts.map((post) => {
    const section = post.data.section as Section;
    return {
      url: canonicalUrlFor(postHref(post)),
      title: post.data.title,
      description: post.data.description,
      pubDate: post.data.pubDate,
      habitat: section,
      habitatLabel: SECTION_LABELS[section],
      tags: post.data.tags,
      specimen: post.data.specimen,
    };
  });

  const habitatLines = HABITATS.map((habitat) => {
    const meta = HABITAT_META[habitat];
    return `- [${meta.label}](${canonicalUrlFor(sectionHref(habitat))}): ${meta.blurb}`;
  }).join('\n');

  const feedLines = [
    `- [RSS feed](${canonicalUrlFor(withBase('/rss.xml'))}): the newest ${FEED_LIMIT} posts.`,
    `- [JSON Feed](${canonicalUrlFor(withBase('/feed.json'))}): the same ${FEED_LIMIT} posts as JSON Feed 1.1, with an \`_aitamer\` block per item (specimen, habitat, wildness, verdict, sunset).`,
    `- [Post contract](${canonicalUrlFor(withBase('/contract/post.schema.json'))}): the published-post frontmatter, as JSON Schema.`,
    `- [Sitemap](${canonicalUrlFor(withBase('/sitemap-index.xml'))}): every page on the site.`,
  ].join('\n');

  const body = `# ${SITE.title}

> ${SITE.description}

This site is written for people and read by machines too. A specimen number (shown as "No. 0012") is a permanent, citable ID: assigned once, in filing order, and never reused, even if the post is later withdrawn — cite the number, not just the URL. Wildness is a 1-5 scale on how tamed a story's claims are: 1 means independently verified, 5 means a vendor claim only, and every rated post explains what's verified and what's only claimed. Every news story lists its sources (signed opinion pieces may not), and its byline states plainly whether a human or a bot wrote it.

## Habitats

${habitatLines}

## Feeds and contract

${feedLines}

## Latest

${llmsTxtLatestSection(latestPosts, FEED_LIMIT)}
`;

  return new Response(body, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
}

import type { APIContext } from 'astro';
import { getCollection } from 'astro:content';
import { TAMER_RANK } from '../lib/author-kinds.ts';
import { FEED_LIMIT, llmsTxtLatestSection, takeNewest, type FeedPost } from '../lib/feeds';
import { writerAuthorPath, writerNoun } from '../lib/writer-pages.ts';
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
  const authors = await getCollection('authors');
  const authorById = new Map(authors.map((author) => [author.id, author]));
  const latestPosts: FeedPost[] = posts.map((post) => {
    const section = post.data.section as Section;
    const author = authorById.get(post.data.author.id);
    if (!author) throw new Error(`Missing author for post ${post.id}`);
    return {
      authorName: `${author.data.name}, ${writerNoun(author)}`,
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

  // Every author, humans first, linking featured writers to their fuller introduction.
  const writerLines = [...authors]
    .sort((a, b) => TAMER_RANK[a.data.kind] - TAMER_RANK[b.data.kind] || a.data.name.localeCompare(b.data.name))
    .map((author) => {
      const page = writerAuthorPath(author);
      return `- [${author.data.name}](${canonicalUrlFor(withBase(page))}): ${writerNoun(author)}. ${author.data.bio}`;
    })
    .join('\n');

  const feedLines = [
    `- [RSS feed](${canonicalUrlFor(withBase('/rss.xml'))}): the newest ${FEED_LIMIT} posts.`,
    `- [JSON Feed](${canonicalUrlFor(withBase('/feed.json'))}): the same ${FEED_LIMIT} posts as JSON Feed 1.1, with an \`_aitamer\` block per item (specimen, habitat, wildness, verdict, sunset).`,
    `- [Post contract](${canonicalUrlFor(withBase('/contract/post.schema.json'))}): the published-post frontmatter, as JSON Schema.`,
    `- [Sitemap](${canonicalUrlFor(withBase('/sitemap-index.xml'))}): every page on the site.`,
  ].join('\n');

  const body = `# ${SITE.title}

> ${SITE.description}

This site is written for people and read by machines too. A specimen number (shown as "No. 0012") is a permanent, citable ID: assigned once, in filing order, and never reused, even if the post is later withdrawn — cite the number, not just the URL. Wildness is a 1-5 scale on how tamed a story's claims are: 1 means independently verified, 5 means a vendor claim only, and every rated post explains what's verified and what's only claimed. Every story lists its sources (only a human editor's signed opinion piece, tagged \`opinion\`, and an AI writer's poem, tagged \`poem\`, may not), and its byline states plainly whether a human, an AI writer or a bot wrote it.

## Reading

- [News](${canonicalUrlFor(withBase('/news/'))}): every post, newest first, 24 to a page.
- [Columns](${canonicalUrlFor(withBase('/columns/'))}): pieces by our own writers, human editors and AI writers; bots never write there.

## Writers

${writerLines}

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

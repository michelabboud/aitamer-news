/**
 * Series gate for `npm run check:posts`: a series slug is in the catalog, `series_order` is a
 * positive integer required when `series` is set, and no two posts in one series share an order.
 * Drafts and posts that are not live yet still occupy their order.
 */
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { SERIES } from '../src/data/series.ts';
import { seriesProblems } from '../src/lib/series.ts';
import { readFrontmatter } from './frontmatter.mjs';

const dir = 'src/content/posts';
const posts = [];
for (const name of readdirSync(dir)) {
  if (!/\.mdx?$/.test(name)) continue;
  const text = readFileSync(join(dir, name), 'utf8');
  const fm = readFrontmatter(text);
  if (fm === null) {
    console.error(`series: ${join(dir, name)} has no frontmatter`);
    process.exit(1);
  }
  const data = fm.data;
  const pubDate = data.pubDate instanceof Date ? data.pubDate : new Date(data.pubDate);
  posts.push({
    id: name.replace(/\.mdx?$/, ''),
    title: typeof data.title === 'string' ? data.title : '',
    description: typeof data.description === 'string' ? data.description : '',
    pubDate,
    draft: data.draft === true,
    withdrawn: Boolean(data.withdrawn),
    series: data.series,
    seriesOrder: data.series_order,
  });
}

const problems = seriesProblems(posts, SERIES);
if (problems.length) {
  for (const problem of problems) console.error(`series: ${problem}`);
  process.exit(1);
}

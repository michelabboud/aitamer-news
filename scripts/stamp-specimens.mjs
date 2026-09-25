#!/usr/bin/env node
/**
 * Give every published post a permanent specimen number.
 *
 *   node scripts/stamp-specimens.mjs          assign numbers to published posts that have none (part of `npm run stamp`)
 *   node scripts/stamp-specimens.mjs --check  exit 1 on any numbering problem (part of `npm run check:posts`)
 *
 * The number lives in the post (`specimen: 12`) and in an append-only ledger,
 * src/content/specimen-ledger.txt (`0012 <slug>` per line). The ledger is what makes
 * "never reused" provable: a withdrawn or deleted post keeps its line, so its number is
 * never handed out again. New numbers go to posts in filing order: oldest pubDate first,
 * ties by slug. Drafts get no number until they are published.
 *
 * aitamer-news-ops and atn-mcp must run `npm run stamp` before committing a published post.
 */
import { readdirSync, readFileSync, writeFileSync, existsSync } from 'node:fs';
import { basename, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { frontmatterOf } from './stamp-post-times.mjs';

export const POSTS_DIR = 'src/content/posts';
export const LEDGER_FILE = 'src/content/specimen-ledger.txt';
const POST_FILE = /\.mdx?$/;
const LEDGER_LINE = /^(\d+) ([a-z0-9][a-z0-9-]*)$/;
const LEDGER_HEADER = [
  '# Specimen ledger: every number ever issued, and the post it went to. Append-only.',
  '# Written by `npm run stamp` (scripts/stamp-specimens.mjs). Never edit or remove a line;',
  '# a withdrawn or deleted post keeps its number here so it is never reused.',
];

/** @param {string} fm @param {string} key @returns {string | null} the raw scalar value of a top-level key */
function scalar(fm, key) {
  const match = new RegExp(`^${key}:[ \\t]*(.*?)[ \\t]*$`, 'm').exec(fm);
  if (!match) return null;
  return match[1].replace(/^(["'])(.*)\1$/, '$2');
}

/**
 * @param {string} slug file name without extension
 * @param {string} text whole post file
 * @returns {{ slug: string, draft: boolean, pubDate: string | null, specimen: number | null, section: string | null, hasSources: boolean, withdrawn: boolean }}
 */
export function readPost(slug, text) {
  const fm = frontmatterOf(text);
  if (fm === null) throw new Error(`${slug}: post has no frontmatter`);
  const specimenRaw = scalar(fm, 'specimen');
  const specimen = specimenRaw === null || specimenRaw === '' ? null : Number(specimenRaw);
  return {
    slug,
    draft: scalar(fm, 'draft') === 'true',
    pubDate: scalar(fm, 'pubDate'),
    specimen: specimen === null || Number.isNaN(specimen) ? null : specimen,
    section: scalar(fm, 'section'),
    hasSources: /^sources:[ \t]*\r?\n[ \t]+-/m.test(fm),
    withdrawn: /^withdrawn:/m.test(fm),
  };
}

/** @param {string} text @returns {{ entries: { n: number, slug: string }[], errors: string[] }} */
export function parseLedger(text) {
  const entries = [];
  const errors = [];
  text.split(/\r?\n/).forEach((line, i) => {
    if (line.trim() === '' || line.startsWith('#')) return;
    const match = LEDGER_LINE.exec(line);
    if (!match) {
      errors.push(`ledger line ${i + 1} is not "<number> <slug>": ${line}`);
      return;
    }
    entries.push({ n: Number(match[1]), slug: match[2] });
  });
  return { entries, errors };
}

/** @param {{ n: number }[]} entries @returns {number} the next unused number */
export function nextNumber(entries) {
  return entries.reduce((max, entry) => Math.max(max, entry.n), 0) + 1;
}

/** @param {{ n: number, slug: string }} entry */
export function ledgerLine(entry) {
  return `${String(entry.n).padStart(4, '0')} ${entry.slug}`;
}

/**
 * Published posts that still need a number, in the order they get one.
 * @param {ReturnType<typeof readPost>[]} posts
 */
export function needingNumbers(posts) {
  return posts
    .filter((post) => !post.draft && post.specimen === null)
    .sort((a, b) => {
      const at = Date.parse(a.pubDate ?? '');
      const bt = Date.parse(b.pubDate ?? '');
      return (Number.isNaN(at) ? Infinity : at) - (Number.isNaN(bt) ? Infinity : bt) || a.slug.localeCompare(b.slug);
    });
}

/**
 * Plan the numbers for posts that need one. Pure: returns what to write.
 * @param {ReturnType<typeof readPost>[]} posts
 * @param {{ n: number, slug: string }[]} ledger
 */
export function assignNumbers(posts, ledger) {
  let next = nextNumber(ledger);
  return needingNumbers(posts).map((post) => ({ slug: post.slug, n: next++ }));
}

/** @param {string} text @param {number} n @returns {string} text with `specimen: n` added after pubDate */
export function withSpecimen(text, n) {
  const fm = frontmatterOf(text);
  if (fm === null) throw new Error('post has no frontmatter');
  if (/^specimen:/m.test(fm)) throw new Error('post already has a specimen line');
  const stamped = fm.replace(/^(pubDate:.*)$/m, `$1\nspecimen: ${n}`);
  if (stamped === fm) throw new Error('post has no pubDate line to anchor the specimen');
  return text.replace(fm, stamped);
}

/**
 * Every contract problem that publish-state rules catch (the schema catches types).
 * @param {ReturnType<typeof readPost>[]} posts
 * @param {{ n: number, slug: string }[]} ledger
 * @returns {string[]}
 */
export function findProblems(posts, ledger) {
  const problems = [];
  const byNumber = new Map();
  for (const entry of ledger) {
    if (byNumber.has(entry.n)) problems.push(`ledger issues ${entry.n} twice (${byNumber.get(entry.n)} and ${entry.slug})`);
    else byNumber.set(entry.n, entry.slug);
  }
  const seen = new Map();
  for (const post of posts) {
    if (post.specimen !== null) {
      if (!Number.isInteger(post.specimen) || post.specimen < 1) {
        problems.push(`${post.slug}: specimen must be a positive whole number`);
        continue;
      }
      if (seen.has(post.specimen)) problems.push(`${post.slug}: specimen ${post.specimen} is also on ${seen.get(post.specimen)}`);
      seen.set(post.specimen, post.slug);
      const owner = byNumber.get(post.specimen);
      if (owner === undefined) problems.push(`${post.slug}: specimen ${post.specimen} is not in the ledger`);
      else if (owner !== post.slug) problems.push(`${post.slug}: specimen ${post.specimen} belongs to ${owner} in the ledger`);
    }
    if (post.draft) continue;
    if (post.specimen === null) problems.push(`${post.slug}: published but has no specimen number (run \`npm run stamp\`)`);
    if (!post.hasSources && post.section !== 'opinion' && !post.withdrawn) {
      problems.push(`${post.slug}: published outside Opinion with no sources`);
    }
  }
  return problems;
}

function loadPosts(dir) {
  return readdirSync(dir)
    .filter((name) => POST_FILE.test(name))
    .sort()
    .map((name) => {
      const file = join(dir, name);
      const text = readFileSync(file, 'utf8');
      return { file, text, post: readPost(basename(name).replace(POST_FILE, ''), text) };
    });
}

function loadLedger(file) {
  if (!existsSync(file)) return { entries: [], errors: [], text: '' };
  const text = readFileSync(file, 'utf8');
  return { ...parseLedger(text), text };
}

export function main(argv, { postsDir = POSTS_DIR, ledgerFile = LEDGER_FILE } = {}) {
  const check = argv.includes('--check');
  const files = loadPosts(postsDir);
  const ledger = loadLedger(ledgerFile);
  const posts = files.map((f) => f.post);

  if (check) {
    const problems = [...ledger.errors, ...findProblems(posts, ledger.entries)];
    if (problems.length === 0) {
      console.log(`check:specimens: ${posts.filter((p) => !p.draft).length} published posts numbered; ledger holds ${ledger.entries.length}.`);
      return 0;
    }
    console.error('check:specimens: fix these, then commit:');
    for (const problem of problems) console.error(`  ${problem}`);
    return 1;
  }

  if (ledger.errors.length > 0) {
    for (const error of ledger.errors) console.error(error);
    return 1;
  }
  const plan = assignNumbers(posts, ledger.entries);
  if (plan.length === 0) {
    console.log('stamp-specimens: nothing to do.');
    return 0;
  }
  for (const { slug, n } of plan) {
    const target = files.find((f) => f.post.slug === slug);
    writeFileSync(target.file, withSpecimen(target.text, n));
    console.log(`specimen ${ledgerLine({ n, slug })}`);
  }
  const body = ledger.text.trim() === '' ? LEDGER_HEADER.join('\n') + '\n' : ledger.text.replace(/\n?$/, '\n');
  writeFileSync(ledgerFile, body + plan.map(ledgerLine).join('\n') + '\n');
  return 0;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  process.exitCode = main(process.argv.slice(2));
}

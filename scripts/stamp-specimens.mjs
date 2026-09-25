#!/usr/bin/env node
/**
 * Give every published post a permanent specimen number.
 *
 *   node scripts/stamp-specimens.mjs          assign numbers to published posts that have none (part of `npm run stamp`)
 *   node scripts/stamp-specimens.mjs --check  exit 1 on any numbering problem (part of `npm run check:posts`)
 *
 * The number lives in the post (`specimen: 12`) and in an append-only ledger,
 * src/content/specimen-ledger.txt. The ledger is what makes "never reused" provable: a withdrawn
 * or deleted post keeps its line, so its number is never handed out again. New numbers go to
 * posts in filing order: oldest pubDate first, ties by slug. Drafts get no number until they
 * are published.
 *
 * Ledger lines (POST.md §4):
 *   0012 some-slug                   number 12 was issued to some-slug
 *   0012 some-slug void: <reason>    that issuance is void: some-slug may not carry 12
 * A void line is the one legal repair, and it is itself an append. It exists because numbers
 * can be issued on two branches at once and collide at merge. A voided issuance stays in the
 * ledger, so its number is never issued again. A number whose every issuance is void belongs
 * to no post. Restating a line is harmless; issuing a pair after voiding it is an error.
 *
 * A stamp run is all or nothing, in this order: read and validate every post and the ledger;
 * compute every new post text in memory; append the ledger; write the posts. If the posts'
 * write is interrupted, the ledger already holds their numbers, and the next run writes the
 * same numbers back (a post with no `specimen:` whose slug holds a live number gets that number).
 *
 * atn-ops and atn-mcp must run `npm run stamp` before committing a published post,
 * and commit the ledger with it.
 */
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  SLUG,
  SLUG_MAX_LENGTH,
  assertOnlyChanged,
  isPublishedDraftField,
  pubDateOf,
  readFrontmatter,
  topLevelLine,
  withRaw,
} from './frontmatter.mjs';
import { writeFileAtomic } from './stamp-post-times.mjs';

export const POSTS_DIR = 'src/content/posts';
export const LEDGER_FILE = 'src/content/specimen-ledger.txt';
const POST_FILE = /\.mdx?$/;
/** `<number> <slug>` or `<number> <slug> void: <reason>`. The slug part is `SLUG`. */
const LEDGER_LINE = new RegExp(`^(\\d+) (${SLUG.source.slice(1, -1)})(?: void: (\\S.*))?$`);
const LEDGER_HEADER = [
  '# Specimen ledger: every number ever issued, and the post it went to. Append-only.',
  '# Written by `npm run stamp` (scripts/stamp-specimens.mjs). Never edit or remove a line;',
  '# a withdrawn or deleted post keeps its number here so it is never reused.',
  '# The one repair is another append: `NNNN slug void: <reason>` (POST.md section 4).',
];
const COLLISION_REPAIR =
  'keep both lines; for the post that is not yet on main, append `NNNN <slug> void: collision`, delete its `specimen:` line, and run `npm run stamp` (POST.md section 4)';

/**
 * @typedef {object} Post
 * @property {string} slug file name without extension
 * @property {boolean} draft true also when `draft` is invalid, so no number is issued to it
 * @property {number | null} pubTime pubDate in ms, or null when missing or unreadable
 * @property {number | null} specimen a valid specimen number, else null
 * @property {boolean} hasSpecimenField the frontmatter has a `specimen` key at all
 * @property {string | null} section
 * @property {boolean} hasSources a non-empty `sources` list
 * @property {boolean} withdrawn
 * @property {string[]} errors problems that make the post unsafe to stamp
 */

/**
 * @param {string} slug file name without extension
 * @param {string} text whole post file
 * @returns {Post} never throws: an unreadable post comes back with `errors`
 */
export function readPost(slug, text) {
  const errors = [];
  if (!SLUG.test(slug)) {
    errors.push(`file name "${slug}" is not a slug: lowercase letters, digits and hyphens only, starting with a letter or digit (rename the file before it is published)`);
  }
  if (slug.length > SLUG_MAX_LENGTH) {
    errors.push(`file name is ${slug.length} characters; a slug is at most ${SLUG_MAX_LENGTH}, or the post could never take a comment (rename the file before it is published)`);
  }
  let fm;
  try {
    fm = readFrontmatter(text);
  } catch (error) {
    fm = undefined;
    errors.push(error.message);
  }
  if (fm === null) errors.push('post has no frontmatter');
  if (!fm) {
    return { slug, draft: true, pubTime: null, specimen: null, hasSpecimenField: false, section: null, hasSources: false, withdrawn: false, errors };
  }
  const data = fm.data;

  const published = isPublishedDraftField(data);
  if (published === null) errors.push(`draft must be true or false, found ${JSON.stringify(data.draft)}`);

  const hasSpecimenField = Object.hasOwn(data, 'specimen');
  let specimen = null;
  if (hasSpecimenField) {
    const value = data.specimen;
    if (value === null) {
      errors.push('`specimen:` is present but empty; delete the line and run `npm run stamp`');
    } else if (typeof value !== 'number' || !Number.isInteger(value) || value < 1) {
      errors.push(`specimen must be a positive whole number, found ${JSON.stringify(value)}; never write it by hand`);
    } else {
      specimen = value;
    }
  }

  let pubTime = null;
  try {
    const { date } = pubDateOf(fm);
    pubTime = date === null ? null : date.valueOf();
  } catch (error) {
    errors.push(error.message);
  }
  if (published === true && pubTime === null) errors.push('published but has no readable pubDate');

  if (Object.hasOwn(data, 'slug')) {
    errors.push('remove the `slug:` field: the file name is the slug, and Astro would use this field as the URL instead');
  }

  return {
    slug,
    draft: published !== true,
    pubTime,
    specimen,
    hasSpecimenField,
    section: typeof data.section === 'string' ? data.section : null,
    hasSources: Array.isArray(data.sources) && data.sources.length > 0,
    withdrawn: data.withdrawn !== undefined && data.withdrawn !== null,
    errors,
  };
}

/**
 * @param {string} text
 * @returns {{ entries: { n: number, slug: string, void?: string }[], errors: string[] }}
 */
export function parseLedger(text) {
  const entries = [];
  const errors = [];
  text.split(/\r?\n/).forEach((line, i) => {
    if (line.trim() === '' || line.startsWith('#')) return;
    const match = LEDGER_LINE.exec(line);
    if (!match) {
      errors.push(`ledger line ${i + 1} is not "<number> <slug>" or "<number> <slug> void: <reason>": ${line}`);
      return;
    }
    const entry = { n: Number(match[1]), slug: match[2] };
    if (match[3] !== undefined) entry.void = match[3];
    entries.push(entry);
  });
  return { entries, errors };
}

/**
 * What the ledger says, line by line, in order.
 * @param {{ n: number, slug: string, void?: string }[]} entries
 * @returns {{
 *   ownersOf: Map<number, string[]>,
 *   numbersOf: Map<string, number[]>,
 *   issued: Set<number>,
 *   max: number,
 *   problems: string[],
 * }} `ownersOf`/`numbersOf`: live (non-void) issuances; `issued`: every number ever issued
 */
export function ledgerState(entries) {
  const live = new Map(); // "n slug" -> { n, slug }, in first-issued order
  const voided = new Set(); // "n slug"
  const issued = new Set();
  const problems = [];
  let max = 0;
  for (const entry of entries) {
    const key = `${entry.n} ${entry.slug}`;
    max = Math.max(max, entry.n);
    if (entry.void !== undefined) {
      if (live.has(key)) {
        live.delete(key);
        voided.add(key);
      } else if (!voided.has(key)) {
        problems.push(`ledger voids ${entry.n} for ${entry.slug}, but no earlier line issues ${entry.n} to ${entry.slug}`);
      }
      continue;
    }
    if (voided.has(key)) {
      problems.push(`ledger issues ${entry.n} to ${entry.slug} again after voiding it; a voided number is never reissued`);
      continue;
    }
    issued.add(entry.n);
    if (!live.has(key)) live.set(key, { n: entry.n, slug: entry.slug });
  }
  const ownersOf = new Map();
  const numbersOf = new Map();
  for (const { n, slug } of live.values()) {
    ownersOf.set(n, [...(ownersOf.get(n) ?? []), slug]);
    numbersOf.set(slug, [...(numbersOf.get(slug) ?? []), n]);
  }
  for (const [n, slugs] of ownersOf) {
    if (slugs.length > 1) problems.push(`ledger issues ${n} twice (${slugs.join(' and ')}): a collision; ${COLLISION_REPAIR}`);
  }
  for (const [slug, numbers] of numbersOf) {
    if (numbers.length > 1) {
      problems.push(`ledger issues ${slug} twice (${numbers.join(' and ')}): append \`NNNN ${slug} void: <reason>\` for the number the post does not carry`);
    }
  }
  return { ownersOf, numbersOf, issued, max, problems };
}

/** @param {{ n: number }[]} entries @returns {number} the next unused number, void lines included */
export function nextNumber(entries) {
  return entries.reduce((max, entry) => Math.max(max, entry.n), 0) + 1;
}

/** @param {{ n: number, slug: string, void?: string }} entry */
export function ledgerLine(entry) {
  const line = `${String(entry.n).padStart(4, '0')} ${entry.slug}`;
  return entry.void === undefined ? line : `${line} void: ${entry.void}`;
}

/**
 * Published posts that still need a number, in the order they get one. A post with errors, or
 * with a `specimen` field in any state, never gets one here.
 * @param {Post[]} posts
 */
export function needingNumbers(posts) {
  return posts
    .filter((post) => !post.draft && !post.hasSpecimenField && post.errors.length === 0)
    .sort((a, b) => (a.pubTime ?? Infinity) - (b.pubTime ?? Infinity) || a.slug.localeCompare(b.slug));
}

/**
 * Plan the numbers for posts that need one. Pure: returns what to write. A post whose slug
 * already holds one live number in the ledger gets that number back (`restored`), with no new
 * ledger line; every other post gets the next unused number.
 * @param {Post[]} posts
 * @param {{ n: number, slug: string, void?: string }[]} ledger
 * @returns {{ slug: string, n: number, restored?: true }[]}
 */
export function assignNumbers(posts, ledger) {
  const state = ledgerState(ledger);
  let next = state.max + 1;
  return needingNumbers(posts).map((post) => {
    const held = state.numbersOf.get(post.slug);
    if (held !== undefined && held.length === 1) return { slug: post.slug, n: held[0], restored: true };
    return { slug: post.slug, n: next++ };
  });
}

/**
 * @param {string} text whole post file
 * @param {number} n
 * @returns {string} text with one line, `specimen: n`, added after the pubDate line
 * @throws {Error} when the post already has a specimen field, has no top-level pubDate line,
 *   or the edit would change anything else
 */
export function withSpecimen(text, n) {
  const fm = readFrontmatter(text);
  if (fm === null) throw new Error('post has no frontmatter');
  if (Object.hasOwn(fm.data, 'specimen')) throw new Error('post already has a specimen line');
  const line = topLevelLine(fm.raw, 'pubDate');
  if (line === null) throw new Error('post has no top-level `pubDate:` line to anchor the specimen');
  const cr = line.cr ? '\r' : '';
  const raw = `${fm.raw.slice(0, line.end)}\nspecimen: ${n}${cr}${fm.raw.slice(line.end)}`;
  const stamped = withRaw(text, fm, raw);
  assertOnlyChanged(fm.data, stamped, 'specimen', (value) => value === n);
  return stamped;
}

/**
 * Every contract problem that publish-state rules catch (the schema catches types).
 * @param {Post[]} posts
 * @param {{ n: number, slug: string, void?: string }[]} ledger
 * @returns {string[]}
 */
export function findProblems(posts, ledger) {
  const state = ledgerState(ledger);
  const problems = [...state.problems];
  const seen = new Map();
  for (const post of posts) {
    for (const error of post.errors) problems.push(`${post.slug}: ${error}`);
    if (post.specimen !== null) {
      const n = post.specimen;
      if (seen.has(n)) problems.push(`${post.slug}: specimen ${n} is also on ${seen.get(n)}`);
      seen.set(n, post.slug);
      const owners = state.ownersOf.get(n) ?? [];
      if (owners.length === 0) {
        problems.push(
          state.issued.has(n)
            ? `${post.slug}: specimen ${n} was voided in the ledger; no post may carry it (delete the line and run \`npm run stamp\`)`
            : `${post.slug}: specimen ${n} is not in the ledger`,
        );
      } else if (!owners.includes(post.slug)) {
        problems.push(`${post.slug}: specimen ${n} belongs to ${owners.join(' and ')} in the ledger`);
      }
    }
    if (post.draft) continue;
    if (post.specimen === null && !post.hasSpecimenField) {
      problems.push(`${post.slug}: published but has no specimen number (run \`npm run stamp\`)`);
    }
    if (!post.hasSources && post.section !== 'opinion' && !post.withdrawn) {
      problems.push(`${post.slug}: published outside Opinion with no sources`);
    }
  }
  return problems;
}

/**
 * Every post file under `dir`. Astro's loader reads `**\/*.{md,mdx}`, so a post in a
 * subfolder would be published under `sub/name` and never numbered here: that is a problem.
 * @returns {{ files: { file: string, text: string, post: Post }[], problems: string[] }}
 */
function loadPosts(dir) {
  const files = [];
  const problems = [];
  const walk = (folder, prefix) => {
    for (const name of readdirSync(folder).sort()) {
      const path = join(folder, name);
      if (statSync(path).isDirectory()) {
        walk(path, `${prefix}${name}/`);
      } else if (POST_FILE.test(name)) {
        if (prefix !== '') {
          problems.push(`${prefix}${name}: posts live directly in ${dir}; a subfolder changes the URL and skips numbering`);
          continue;
        }
        const text = readFileSync(path, 'utf8');
        files.push({ file: path, text, post: readPost(name.replace(POST_FILE, ''), text) });
      }
    }
  };
  walk(dir, '');
  const bySlug = new Map();
  for (const { file, post } of files) {
    if (bySlug.has(post.slug)) problems.push(`${post.slug}: two files share this slug (${bySlug.get(post.slug)} and ${file})`);
    else bySlug.set(post.slug, file);
  }
  return { files, problems };
}

function loadLedger(file) {
  if (!existsSync(file)) return { entries: [], errors: [], text: '' };
  const text = readFileSync(file, 'utf8');
  return { ...parseLedger(text), text };
}

/**
 * @param {string[]} argv
 * @param {{ postsDir?: string, ledgerFile?: string, stampPost?: typeof withSpecimen }} [options]
 *   `stampPost` is the in-memory edit, replaceable only so a test can make it fail
 */
export function main(argv, { postsDir = POSTS_DIR, ledgerFile = LEDGER_FILE, stampPost = withSpecimen } = {}) {
  const check = argv.includes('--check');
  const { files, problems: loadProblems } = loadPosts(postsDir);
  const ledger = loadLedger(ledgerFile);
  const posts = files.map((f) => f.post);

  if (check) {
    const problems = [...loadProblems, ...ledger.errors, ...findProblems(posts, ledger.entries)];
    if (problems.length === 0) {
      console.log(`check:specimens: ${posts.filter((p) => !p.draft).length} published posts numbered; ledger holds ${ledger.entries.length} lines.`);
      return 0;
    }
    console.error('check:specimens: fix these, then commit:');
    for (const problem of problems) console.error(`  ${problem}`);
    return 1;
  }

  // 1. Validate everything first. Anything unsafe stops the run before a number is issued.
  const blocking = [
    ...loadProblems,
    ...ledger.errors,
    ...ledgerState(ledger.entries).problems,
    ...posts.flatMap((post) => post.errors.map((error) => `${post.slug}: ${error}`)),
  ];
  if (blocking.length > 0) {
    console.error('stamp-specimens: nothing was stamped. Fix these first:');
    for (const problem of blocking) console.error(`  ${problem}`);
    return 1;
  }
  const plan = assignNumbers(posts, ledger.entries);
  if (plan.length === 0) {
    console.log('stamp-specimens: nothing to do.');
    return 0;
  }
  // A slug that already holds a number is either the same post after an interrupted run, or a
  // new story filed under a deleted post's slug. Only a person can tell, so restoring is opt-in
  // (docs/reviews/2026-09-25-batch-bc-deep-review.md, minor 5).
  const restoring = plan.filter((p) => p.restored);
  if (restoring.length > 0 && !argv.includes('--restore')) {
    console.error('stamp-specimens: nothing was stamped. These slugs already hold a number in the ledger:');
    for (const { slug, n } of restoring) console.error(`  ${slug}: ${ledgerLine({ n, slug })}`);
    console.error('If each is the same story (an interrupted stamp), run `npm run stamp -- --restore`.');
    console.error('If it is a new story, give it a new slug: a slug is an address and is never reused.');
    return 1;
  }
  const carried = new Map(posts.filter((p) => p.specimen !== null).map((p) => [p.specimen, p.slug]));
  for (const { slug, n, restored } of plan) {
    if (restored && carried.has(n)) {
      console.error(`stamp-specimens: nothing was stamped. ${slug} holds ${n} in the ledger, but ${carried.get(n)} carries it.`);
      return 1;
    }
  }

  // 2. Compute every new post text in memory.
  const writes = [];
  for (const { slug, n } of plan) {
    const target = files.find((f) => f.post.slug === slug);
    try {
      writes.push({ file: target.file, text: stampPost(target.text, n) });
    } catch (error) {
      console.error(`stamp-specimens: nothing was stamped. ${target.file}: ${error.message}`);
      return 1;
    }
  }

  // 3. Append the ledger. Issuing a number that no post ends up carrying is safe: it is never reused.
  const fresh = plan.filter((p) => !p.restored);
  if (fresh.length > 0) {
    const body = ledger.text.trim() === '' ? LEDGER_HEADER.join('\n') + '\n' : ledger.text.replace(/\n?$/, '\n');
    const next = body + fresh.map(ledgerLine).join('\n') + '\n';
    const kept = ledger.text.trim() === '' ? '' : ledger.text.replace(/\n?$/, '');
    if (!next.startsWith(kept)) {
      throw new Error('internal error: the ledger rewrite is not an append; nothing was written');
    }
    writeFileAtomic(ledgerFile, next);
  }

  // 4. Write the posts.
  for (const { file, text } of writes) writeFileAtomic(file, text);
  for (const { slug, n, restored } of plan) {
    console.log(`specimen ${ledgerLine({ n, slug })}${restored ? ' (restored from the ledger)' : ''}`);
  }
  return 0;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  process.exitCode = main(process.argv.slice(2));
}

#!/usr/bin/env node
/**
 * Warn when a machine author's working notes leak into the text readers see (part of `npm run check:posts`).
 *
 *   node scripts/check-reader-text.mjs           print a warning per leaked note, exit 0: it never blocks a post
 *   node scripts/check-reader-text.mjs --strict  the same list, exit 1 (for a later decision to make it a gate)
 *
 * Why this exists: on 2026-10-01 the desk bots came back and 15 of their posts shipped with lines
 * written to themselves ("HARD: keep MIT explicit", "HARD fence vs T6 ...") in the summary, the
 * headings or the body. They pass the schema and the rendered-body allowlist, because a note is
 * ordinary prose to a checker. This check names the two shapes seen so far. It gates machine
 * authors only (any author whose profile is not `kind: human`), the same line the rendered-body
 * gate draws, and it never touches the template: a bot's lane is posts and heroes
 * (`check-publisher-paths.mjs`), so it cannot edit this file either.
 *
 * Michel's rule (2026-10-01): the bots are allowed to post and must not be blocked, so this reports
 * and never fails a pull request unless `--strict` is asked for.
 */
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

export const POSTS_DIR = 'src/content/posts';
export const AUTHORS_DIR = 'src/content/authors';

/** The two shapes of a leaked note: the upper-case word HARD, and a "fence vs/from/against X" line. */
export const LEAK_PATTERNS = Object.freeze([
  { name: 'the upper-case working word "HARD"', re: /\bHARD\b/ },
  { name: 'a "fence vs/from/against" working note', re: /\bFence\s+(?:vs\.?|from|against)\b|\bfence\s*(?:≠|vs\.?\s+[A-Z])/ },
]);

/** The author ids whose profile says `kind: human` (their posts are not gated). */
export function humanAuthors(authorsDir = AUTHORS_DIR) {
  const humans = new Set();
  for (const name of readdirSync(authorsDir)) {
    if (!/\.mdx?$/.test(name)) continue;
    const text = readFileSync(join(authorsDir, name), 'utf8');
    if (/^kind:\s*["']?human["']?\s*$/m.test(text)) humans.add(name.replace(/\.mdx?$/, ''));
  }
  return humans;
}

const authorOf = (text) => /^author:\s*["']?([^"'\s]+)["']?\s*$/m.exec(text)?.[1];

/** The leak names found in one post's text. */
export function leaksIn(text) {
  return LEAK_PATTERNS.filter(({ re }) => re.test(text)).map(({ name }) => name);
}

/** Problems for the posts under `postsDir`; an empty list means the check passes. */
export function readerTextProblems(postsDir = POSTS_DIR, authorsDir = AUTHORS_DIR) {
  const humans = humanAuthors(authorsDir);
  const problems = [];
  for (const name of readdirSync(postsDir).sort()) {
    if (!/\.mdx?$/.test(name)) continue;
    const slug = name.replace(/\.mdx?$/, '');
    const text = readFileSync(join(postsDir, name), 'utf8');
    const author = authorOf(text);
    if (!author || humans.has(author)) continue;
    const found = leaksIn(text);
    if (found.length > 0) {
      problems.push(`${name}: working note in reader-facing text (${found.join('; ')}). Write the fact for readers and keep the brief out of the post.`);
    }
  }
  return problems;
}

export function main(postsDir = POSTS_DIR, authorsDir = AUTHORS_DIR, strict = false) {
  const problems = readerTextProblems(postsDir, authorsDir);
  if (problems.length === 0) {
    console.log('check-reader-text: no machine-authored post carries a leaked working note.');
    return 0;
  }
  console.warn(`check-reader-text: ${problems.length} post(s) carry a leaked working note (a warning, not a failure):`);
  for (const problem of problems) console.warn(`  ${problem}`);
  return strict ? 1 : 0;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1] && existsSync(POSTS_DIR)) {
  process.exitCode = main(POSTS_DIR, AUTHORS_DIR, process.argv.includes('--strict'));
}

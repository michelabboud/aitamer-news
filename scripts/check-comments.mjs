#!/usr/bin/env node
/**
 * Check the comment data files against the posts (part of `npm run check:posts`).
 *
 *   node scripts/check-comments.mjs   exit 1 when a comment file has no post, or is not what it says it is
 *
 * The desk's publisher writes `src/content/comments/<slug>.json` (ADR 0006); a human only ever
 * removes. This check catches what the schema cannot see, because it needs the file name and
 * the posts directory:
 *   - the file name is a slug, and the file sits directly in the directory (Astro's loader reads
 *     `*.json` there and nowhere deeper: a nested file would be silently ignored);
 *   - the file parses as JSON, and its `slug` field equals the file name;
 *   - a post with that slug exists under src/content/posts/ (draft or not: a comment file for a
 *     draft is the publisher's mistake to fix, but not an orphan). An orphan is a file for a post
 *     that was deleted or renamed; the publisher removes it, or a human deletes it.
 * Everything else about a file — every field and its rules — is the strict schema's job, at
 * `npm run build` (src/content/comment-schema.ts). This script needs nothing but Node so it
 * runs before the build, on the pull request, and names the file.
 */
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { SLUG } from './frontmatter.mjs';
import { POSTS_DIR } from './stamp-post-times.mjs';

export const COMMENTS_DIR = 'src/content/comments';
const COMMENT_FILE = /\.json$/;
const POST_FILE = /\.mdx?$/;

/**
 * The problems with one comment file. Pure: no filesystem.
 * @param {string} name the file name, e.g. `grok-4-7.json`
 * @param {string} text the file's contents
 * @param {Set<string>} postSlugs every post's slug (file name without extension), drafts included
 * @returns {string[]} problems, each naming the file; empty when the file belongs where it is
 */
export function commentFileProblems(name, text, postSlugs) {
  const slug = name.replace(COMMENT_FILE, '');
  if (!SLUG.test(slug)) {
    return [`${name}: the file name is not a slug (lowercase letters, digits and hyphens, starting with a letter or digit)`];
  }
  const problems = [];
  let data;
  try {
    data = JSON.parse(text);
  } catch (error) {
    problems.push(`${name}: not valid JSON: ${error.message}`);
  }
  if (data !== undefined) {
    if (data === null || typeof data !== 'object' || Array.isArray(data)) {
      problems.push(`${name}: the file must be a JSON object`);
    } else if (data.slug !== slug) {
      problems.push(`${name}: its slug field is ${JSON.stringify(data.slug)} but the file is named ${JSON.stringify(slug)}; a comment file is named after its post`);
    }
  }
  if (!postSlugs.has(slug)) {
    problems.push(`${name}: no post src/content/posts/${slug}.md (or .mdx) exists; an orphan comment file is removed, never kept (POST.md section 8)`);
  }
  return problems;
}

/**
 * Every post slug under `dir`, drafts included. Only files directly in the directory: a post in a
 * subfolder is already a `check:specimens` problem, and a comment file for it must not pass here.
 * @param {string} dir
 * @returns {Set<string>}
 */
export function postSlugs(dir) {
  return new Set(
    readdirSync(dir)
      .filter((name) => POST_FILE.test(name) && statSync(join(dir, name)).isFile())
      .map((name) => name.replace(POST_FILE, '')),
  );
}

/**
 * Every comment file under `dir`, and every JSON file that sits where the loader will not find it.
 * A missing directory is zero files, not an error: the directory holds only a README until the
 * first comment is published.
 * @param {string} dir
 * @returns {{ files: { name: string, text: string }[], problems: string[] }}
 */
export function loadCommentFiles(dir) {
  const files = [];
  const problems = [];
  if (!existsSync(dir)) return { files, problems };
  const walk = (folder, prefix) => {
    for (const name of readdirSync(folder).sort()) {
      const path = join(folder, name);
      if (statSync(path).isDirectory()) {
        walk(path, `${prefix}${name}/`);
      } else if (COMMENT_FILE.test(name)) {
        if (prefix !== '') {
          problems.push(`${prefix}${name}: comment files live directly in ${dir}; the build ignores a subfolder`);
          continue;
        }
        files.push({ name, text: readFileSync(path, 'utf8') });
      }
    }
  };
  walk(dir, '');
  return { files, problems };
}

/**
 * @param {string[]} _argv no options today; kept for symmetry with the other checks
 * @param {{ postsDir?: string, commentsDir?: string }} [options]
 * @returns {number} the exit code
 */
export function main(_argv, { postsDir = POSTS_DIR, commentsDir = COMMENTS_DIR } = {}) {
  const slugs = postSlugs(postsDir);
  const { files, problems } = loadCommentFiles(commentsDir);
  for (const { name, text } of files) problems.push(...commentFileProblems(name, text, slugs));
  if (problems.length === 0) {
    console.log(`check:comments: ${files.length} comment file${files.length === 1 ? '' : 's'}, each named after a post that exists.`);
    return 0;
  }
  console.error('check:comments: fix these, then commit:');
  for (const problem of problems) console.error(`  ${problem}`);
  return 1;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  process.exitCode = main(process.argv.slice(2));
}

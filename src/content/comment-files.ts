import { lstatSync, readdirSync } from 'node:fs';

/**
 * Where comment data files live, and whether there are any. Its own module, importing only
 * `node:fs`, so both the collection loader (`./comments-loader.ts`, build time) and the page-side
 * reader (`getCommentThreads` in `src/lib/site.ts`, render time) name the same place without the
 * pages pulling Astro's loader code into their bundle.
 */

/** The comment directory, relative to the project root. */
export const COMMENTS_BASE = './src/content/comments';
/** The files in {@link COMMENTS_BASE} that are comment data: `<slug>.json`. `README.md` is not. */
export const COMMENTS_PATTERN = '*.json';
/** {@link COMMENTS_PATTERN} as a test on one file name. */
export const COMMENT_FILE_EXTENSION = /\.json$/;
/**
 * A comment data file's whole name: a lowercase slug (letters, digits, hyphens, starting with a
 * letter or digit) and `.json`, exactly. The same rule as `COMMENT_FILE_NAME` in
 * `scripts/check-comments.mjs` — `src/lib/comment-files.test.ts` proves they agree — so a dotfile,
 * `X.JSON` or `a_b.json` never counts here while that check refuses it.
 */
export const COMMENT_FILE_NAME = /^[a-z0-9][a-z0-9-]*\.json$/;

/**
 * Whether the comment directory under `root` holds at least one comment data file.
 *
 * Why this exists: Astro's `getCollection()` logs "The collection "comments" does not exist or is
 * empty" whenever a collection has no entries, and zero files is this collection's normal state
 * (a post with no approved comments has no file). Asking the file system first keeps that warning
 * for real mistakes. It reads the directory at render time rather than through `import.meta.glob`
 * on purpose: a glob would put every comment file into the pages' module graph, and Astro's
 * incremental build hashes that graph, so one new comment would re-render every post instead of
 * the one it belongs to.
 *
 * Only what `scripts/check-comments.mjs` accepts counts: a **regular** file (judged by `lstat`,
 * so a symbolic link is never followed and never counts, dangling or not) whose name is
 * {@link COMMENT_FILE_NAME}. A folder named `x.json`, a link, a dotfile or `X.JSON` is not a
 * comment file.
 *
 * A missing directory counts as none (git keeps it through its `README.md`, so it only goes
 * missing in a broken checkout, and the loader warns about that itself). Any other error — a
 * permission problem, a file where the directory should be — is thrown, never read as "none".
 * @param root the project root as a `file:` URL ending in `/` (Astro's `root`)
 * @throws {TypeError} when `root` does not end in `/`: resolved against it, the comment directory
 *   would silently replace its last segment and name the wrong place
 */
export function hasCommentFiles(root: URL): boolean {
  if (!root.href.endsWith('/')) {
    throw new TypeError(`hasCommentFiles: the project root must end in "/", got ${root.href}`);
  }
  const directory = new URL(`${COMMENTS_BASE}/`, root);
  let names: string[];
  try {
    names = readdirSync(directory);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return false;
    throw error;
  }
  return names.some((name) => COMMENT_FILE_NAME.test(name) && lstatSync(new URL(name, directory)).isFile());
}

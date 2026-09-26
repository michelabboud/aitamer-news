import { lstatSync, readdirSync } from 'node:fs';

/**
 * Where the desk's data files live, and whether a directory holds any. Two directories share the
 * rules: comments (`src/content/comments/`, ADR 0006) and reactions (`src/content/reactions/`,
 * contract in `./reaction-schema.ts`). Its own module, importing only `node:fs`, so both the collection loader
 * (`./data-file-loader.ts`, build time) and the page-side readers (`getCommentThreads` and
 * `getReactionThreads` in `src/lib/site.ts`, render time) name the same places without the pages
 * pulling Astro's loader code into their bundle.
 */

/** The comment directory, relative to the project root. */
export const COMMENTS_BASE = './src/content/comments';
/** The reaction directory, relative to the project root. */
export const REACTIONS_BASE = './src/content/reactions';
/** The files in a data directory that are data: `<slug>.json`. `README.md` is not. */
export const DATA_FILES_PATTERN = '*.json';
/** {@link DATA_FILES_PATTERN} as a test on one file name. */
export const DATA_FILE_EXTENSION = /\.json$/;
/**
 * A data file's whole name: a lowercase slug (letters, digits, hyphens, starting with a letter or
 * digit) and `.json`, exactly. The same rule as `DATA_FILE_NAME` in `scripts/data-files.mjs`
 * (which `check-comments.mjs` and `check-reactions.mjs` share) — `src/lib/data-files.test.ts`
 * proves they agree — so a dotfile, `X.JSON` or `a_b.json` never counts here while that check
 * refuses it.
 */
export const DATA_FILE_NAME = /^[a-z0-9][a-z0-9-]*\.json$/;

/**
 * Whether the data directory `base` under `root` holds at least one data file.
 *
 * Why this exists: Astro's `getCollection()` logs "The collection … does not exist or is empty"
 * whenever a collection has no entries, and zero files is the normal state of both data
 * collections (a post with no approved comment, or no reaction, has no file). Asking the file
 * system first keeps that warning for real mistakes. It reads the directory at render time rather
 * than through `import.meta.glob` on purpose: a glob would put every data file into the pages'
 * module graph, and Astro's incremental build hashes that graph, so one new comment or one changed
 * count would re-render every post instead of the one it belongs to.
 *
 * Only what the directory's check accepts counts: a **regular** file (judged by `lstat`, so a
 * symbolic link is never followed and never counts, dangling or not) whose name is
 * {@link DATA_FILE_NAME}. A folder named `x.json`, a link, a dotfile or `X.JSON` is not a data file.
 *
 * A missing directory counts as none (git keeps each directory through its `README.md`, so it only
 * goes missing in a broken checkout, and the loader warns about that itself). Any other error — a
 * permission problem, a file where the directory should be — is thrown, never read as "none".
 * @param root the project root as a `file:` URL ending in `/` (Astro's `root`)
 * @param base the data directory relative to the root: {@link COMMENTS_BASE} or {@link REACTIONS_BASE}
 * @throws {TypeError} when `root` does not end in `/`: resolved against it, the data directory
 *   would silently replace its last segment and name the wrong place
 */
export function hasDataFiles(root: URL, base: string): boolean {
  if (!root.href.endsWith('/')) {
    throw new TypeError(`hasDataFiles: the project root must end in "/", got ${root.href}`);
  }
  const directory = new URL(`${base}/`, root);
  let names: string[];
  try {
    names = readdirSync(directory);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return false;
    throw error;
  }
  return names.some((name) => DATA_FILE_NAME.test(name) && lstatSync(new URL(name, directory)).isFile());
}

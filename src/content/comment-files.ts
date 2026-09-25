import { readdirSync } from 'node:fs';

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
 * A missing directory counts as none (git keeps it through its `README.md`, so it only goes
 * missing in a broken checkout, and the loader warns about that itself). Any other error — a
 * permission problem, a file where the directory should be — is thrown, never read as "none".
 * @param root the project root as a `file:` URL ending in `/` (Astro's `root`)
 */
export function hasCommentFiles(root: URL): boolean {
  const directory = new URL(`${COMMENTS_BASE}/`, root);
  try {
    return readdirSync(directory, { withFileTypes: true }).some(
      (entry) => entry.isFile() && COMMENT_FILE_EXTENSION.test(entry.name),
    );
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return false;
    throw error;
  }
}

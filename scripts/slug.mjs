/**
 * The slug rule, in a module with no dependencies at all.
 *
 * `scripts/frontmatter.mjs` re-exports it for the build scripts. It lives on its own so that
 * `scripts/check-publisher-paths.mjs`, which runs in the privileged `publisher-paths` job and in
 * the deploy's publisher guard, can import it with a bare `node` and no `npm ci`: nothing from the
 * lockfile runs where the check runs.
 */

/**
 * A slug: the post's file name without extension, its URL segment, and its name in the specimen
 * ledger. Lowercase letters, digits and hyphens, starting with a letter or digit. With this shape,
 * Astro's glob loader derives the same id from the file name (its slugger changes nothing).
 */
export const SLUG = /^[a-z0-9][a-z0-9-]*$/;

/**
 * The longest slug, in characters. The desk's comments Worker refuses a longer one, so a post
 * with a longer file name could never take a comment; `npm run check:posts` refuses it before it
 * is published, and the comment contract caps its `slug` field at the same length.
 */
export const SLUG_MAX_LENGTH = 120;

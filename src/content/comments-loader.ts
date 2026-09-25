import { glob } from 'astro/loaders';
import type { Loader, LoaderContext } from 'astro/loaders';

/**
 * The loader for the `comments` collection (`src/content.config.ts`): Astro's own glob loader
 * over `src/content/comments/*.json`, with two adjustments that the plain loader cannot make.
 *
 * 1. **The entry id is the file name.** Astro's default id for a JSON entry is the `slug` field
 *    when the data has one — and every comment file has one. Deriving the id from the file
 *    instead makes `getEntry('comments', post.id)` mean "the file named after this post", and
 *    lets the loader refuse a file whose `slug` field disagrees with its name, naming the file.
 *    The same rule runs earlier and without a build in `scripts/check-comments.mjs`.
 * 2. **An empty directory is not a warning.** The glob loader logs `No files found matching
 *    "*.json"` when its pattern matches nothing. For posts that would mean something is wrong;
 *    for comments it is the normal state until the first comment is approved and published, and
 *    again whenever every thread is empty (a post with no approved comments has no file). That
 *    one message is dropped; every other warning — a missing directory, a duplicate id — still
 *    reaches the log. If Astro ever rewords the message, the warning reappears: noise, not a
 *    failure.
 *
 * The directory itself always exists in git (it holds `README.md`, which the pattern ignores).
 */
export const COMMENTS_BASE = './src/content/comments';
export const COMMENTS_PATTERN = '*.json';
const COMMENT_FILE_EXTENSION = /\.json$/;

/** The exact warning Astro 7's glob loader emits for an empty match (`node_modules/astro/dist/content/loaders/glob.js`). */
const EMPTY_MATCH_WARNING_PREFIX = `No files found matching "${COMMENTS_PATTERN}"`;

/** @returns true only for the glob loader's empty-match warning for this collection's pattern. */
export function isEmptyCommentsWarning(message: string): boolean {
  return message.startsWith(EMPTY_MATCH_WARNING_PREFIX);
}

/**
 * The entry id for a comment file, and the one build-time rule the schema cannot express.
 * @throws {Error} naming the file when its `slug` field is not the file name
 */
export function commentEntryId({ entry, data }: { entry: string; data: Record<string, unknown> }): string {
  const id = entry.replace(COMMENT_FILE_EXTENSION, '');
  if (data.slug !== id) {
    throw new Error(
      `${COMMENTS_BASE}/${entry}: its slug field is ${JSON.stringify(data.slug)} but the file is named ${JSON.stringify(id)}; ` +
        'a comment file is named after the post it belongs to (POST.md section 8)',
    );
  }
  return id;
}

/** The same logger, minus the one expected warning. Delegation is bound to the original so its private state keeps working. */
function withoutEmptyWarning(logger: LoaderContext['logger']): LoaderContext['logger'] {
  return new Proxy(logger, {
    get(target, property, _receiver) {
      if (property === 'warn') {
        return (message: string) => {
          if (!isEmptyCommentsWarning(message)) target.warn(message);
        };
      }
      const value = Reflect.get(target, property, target);
      return typeof value === 'function' ? value.bind(target) : value;
    },
  });
}

export function commentsLoader(): Loader {
  const inner = glob({ base: COMMENTS_BASE, pattern: COMMENTS_PATTERN, generateId: commentEntryId });
  return {
    name: 'comments-loader',
    load: (context) => inner.load({ ...context, logger: withoutEmptyWarning(context.logger) }),
  };
}

import { glob } from 'astro/loaders';
import type { Loader, LoaderContext } from 'astro/loaders';
import { COMMENTS_BASE, DATA_FILES_PATTERN, DATA_FILE_EXTENSION, REACTIONS_BASE } from './data-files.ts';

/**
 * The loader for the desk's data collections (`src/content.config.ts`): `comments` over
 * `src/content/comments/*.json` and `reactions` over `src/content/reactions/*.json`. Astro's own
 * glob loader, with two adjustments that the plain loader cannot make.
 *
 * 1. **The entry id is the file name.** Astro's default id for a JSON entry is the `slug` field
 *    when the data has one — and every data file has one. Deriving the id from the file instead
 *    makes `getEntry('comments', post.id)` mean "the file named after this post", and lets the
 *    loader refuse a file whose `slug` field disagrees with its name, naming the file. The same
 *    rule runs earlier and without a build in `scripts/check-comments.mjs` and
 *    `scripts/check-reactions.mjs`.
 * 2. **An empty directory is not a warning.** The glob loader logs `No files found matching
 *    "*.json"` when its pattern matches nothing. For posts that would mean something is wrong;
 *    for these collections it is the normal state until the desk publishes a first file, and
 *    again whenever every post is back to none (a post with no approved comment, or no reaction,
 *    has no file). That one message is dropped; every other warning — a missing directory, a
 *    duplicate id — still reaches the log. If Astro ever rewords the message, the warning
 *    reappears: noise, not a failure.
 *
 * Each directory always exists in git (it holds `README.md`, which the pattern ignores).
 */
export { COMMENTS_BASE, REACTIONS_BASE, DATA_FILES_PATTERN };

/** The exact warning Astro 7's glob loader emits for an empty match (`node_modules/astro/dist/content/loaders/glob.js`). */
const EMPTY_MATCH_WARNING_PREFIX = `No files found matching "${DATA_FILES_PATTERN}"`;

/** @returns true only for the glob loader's empty-match warning for the data files' pattern. */
export function isEmptyDataFilesWarning(message: string): boolean {
  return message.startsWith(EMPTY_MATCH_WARNING_PREFIX);
}

/** One data directory: where it is, what its files are called in a message, and where their format is documented. */
interface DataLane {
  readonly base: string;
  /** "comment" or "reaction": the files are "<noun> files". */
  readonly noun: string;
  /** Where a writer reads the format, e.g. "POST.md section 8". */
  readonly docs: string;
}

const COMMENTS_LANE: DataLane = { base: COMMENTS_BASE, noun: 'comment', docs: 'POST.md section 8' };
const REACTIONS_LANE: DataLane = { base: REACTIONS_BASE, noun: 'reaction', docs: 'POST.md section 9' };

type EntryIdInput = { entry: string; data: Record<string, unknown> };

/**
 * The entry id for a data file in `lane`, and the one build-time rule the schema cannot express.
 * @throws {Error} naming the file when its `slug` field is not the file name
 */
function entryIdFor(lane: DataLane) {
  return ({ entry, data }: EntryIdInput): string => {
    const id = entry.replace(DATA_FILE_EXTENSION, '');
    if (data.slug !== id) {
      throw new Error(
        `${lane.base}/${entry}: its slug field is ${JSON.stringify(data.slug)} but the file is named ${JSON.stringify(id)}; ` +
          `a ${lane.noun} file is named after the post it belongs to (${lane.docs})`,
      );
    }
    return id;
  };
}

/** The entry id for a comment file. @throws {Error} naming the file when its `slug` field is not the file name */
export const commentEntryId = entryIdFor(COMMENTS_LANE);
/** The entry id for a reaction file. @throws {Error} naming the file when its `slug` field is not the file name */
export const reactionEntryId = entryIdFor(REACTIONS_LANE);

/** The same logger, minus the one expected warning. Delegation is bound to the original so its private state keeps working. */
function withoutEmptyWarning(logger: LoaderContext['logger']): LoaderContext['logger'] {
  return new Proxy(logger, {
    get(target, property, _receiver) {
      if (property === 'warn') {
        return (message: string) => {
          if (!isEmptyDataFilesWarning(message)) target.warn(message);
        };
      }
      const value = Reflect.get(target, property, target);
      return typeof value === 'function' ? value.bind(target) : value;
    },
  });
}

function dataFileLoader(name: string, lane: DataLane, generateId: (input: EntryIdInput) => string): Loader {
  const inner = glob({ base: lane.base, pattern: DATA_FILES_PATTERN, generateId });
  return {
    name,
    load: (context) => inner.load({ ...context, logger: withoutEmptyWarning(context.logger) }),
  };
}

/** The `comments` collection's loader: `src/content/comments/*.json`. */
export function commentsLoader(): Loader {
  return dataFileLoader('comments-loader', COMMENTS_LANE, commentEntryId);
}

/** The `reactions` collection's loader: `src/content/reactions/*.json`. */
export function reactionsLoader(): Loader {
  return dataFileLoader('reactions-loader', REACTIONS_LANE, reactionEntryId);
}

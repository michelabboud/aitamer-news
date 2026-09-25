import { z } from 'astro/zod';
import { SITE } from '../lib/site-meta.ts';

/**
 * Comment data file contract v1 (2026-09-25): `src/content/comments/<slug>.json`, one file per
 * post that has at least one approved comment. The desk's publisher writes these files
 * (docs/adr/0006-comments-are-baked-static-from-published-data-files.md); editors only ever
 * remove an entry or a file. The format is documented for writers in POST.md section 8 and in
 * `src/content/comments/README.md`. Change it additively (ADR 0004's rule applies unchanged).
 *
 * Like the post contract, this schema is the single source of the published JSON Schema
 * (`commentsFileJsonSchema` below, served at `/contract/comments.schema.json` and
 * `/contract/v1/comments.schema.json`), so what the publisher validates against before it
 * commits can never drift from what the build enforces. And like the post contract it has no
 * `astro:content` import, so `src/lib/comment-contract.test.ts` runs it under plain `node:test`.
 *
 * **v1 is frozen.** `src/content/comment-schema.v1.snapshot.json` holds the bytes
 * `/contract/v1/comments.schema.json` serves, and the test fails on any difference: an additive
 * change needs a new snapshot and a deliberate review, a breaking change needs v2 (a new
 * `COMMENT_CONTRACT_VERSION`, a sibling route, and this schema left as it is).
 *
 * Every object is `.strict()`: an unknown key fails the build naming the file. The rules that
 * need the file name (`slug` equals it) or the posts directory (the post exists) cannot live in a
 * schema; `scripts/check-comments.mjs` (part of `npm run check:posts`) and the collection loader
 * (`src/content/comments-loader.ts`) enforce those. The rules that need two fields at once
 * (unique ids, oldest first, every `at` no later than `generatedAt`) are zod refinements here
 * and prose in the JSON Schema's `description`.
 *
 * Defence in depth: the desk normalises and strips before it publishes (Unicode NFC, control
 * characters, bidirectional controls, invisible and format characters, HTML). This schema
 * refuses what the desk should have stripped, so a misbehaving publisher fails the build instead
 * of putting markup or invisible text into a page. Rendering (`src/lib/comment-text.ts`) escapes
 * everything again.
 *
 * Every pattern here is written for ECMA-262 *without* the `u` flag — that is what zod's
 * `.regex()` runs at build time and what the JSON Schema `pattern` keywords carry — and is
 * verified in both modes by the test (`new RegExp(p)` and `new RegExp(p, 'u')` over the same
 * corpus). The two modes agree on every character in the Basic Multilingual Plane and on lone
 * surrogates. They cannot agree on *ranges* of characters outside it: a range of code points
 * above U+FFFF is either a surrogate-pair alternation (which the `u` flag never matches, because
 * it sees code points, not UTF-16 units) or a `\u{…}` range (a syntax error without the flag).
 * So the patterns are exact without the flag, and with the flag they let the refused characters
 * above U+FFFF through — the build then refuses the file. `FORBIDDEN_CHARACTERS.unicodeClass`
 * is the exact `u`-mode class for a consumer that wants the same list there.
 */

/** The comment contract's version. Bump it, and add a sibling schema route, rather than editing this one in place. */
export const COMMENT_CONTRACT_VERSION = 1;

/** The routes the contract is served at, relative to the site root; `$id` is the site URL plus the route. */
export const COMMENTS_SCHEMA_ROUTES = Object.freeze({
  /** Always the newest version of the contract. */
  current: '/contract/comments.schema.json',
  /** Version 1, pinned: keeps serving v1 after a v2 exists. */
  v1: '/contract/v1/comments.schema.json',
});
export type CommentsSchemaRoute = keyof typeof COMMENTS_SCHEMA_ROUTES;

/**
 * A post slug, as the file name and the `slug` field carry it. The same shape as `SLUG` in
 * `scripts/frontmatter.mjs` (the test asserts they agree): lowercase letters, digits and
 * hyphens, starting with a letter or digit.
 */
export const COMMENT_SLUG = /^[a-z0-9][a-z0-9-]*$/;

/**
 * A ULID: 26 characters of Crockford base32, uppercase — time-ordered, so ids sort with the
 * thread. The first character is `0`–`7`: a ULID's 48-bit timestamp leaves the top bits of the
 * first base32 digit clear, so anything else is not a ULID.
 */
export const ULID = /^[0-7][0-9A-HJKMNP-TV-Z]{25}$/;

/** Display name: 1–60 characters (Unicode code points) on one line. */
export const COMMENT_NAME_MAX = 60;
/** Comment text: 1–2,000 characters (Unicode code points); paragraphs separated by blank lines. */
export const COMMENT_TEXT_MAX = 2000;
/** Comments in one file. A thread that outgrows this is a moderation problem, not a bigger file. */
export const COMMENTS_PER_FILE_MAX = 2000;

/** An inclusive range of Unicode code points and the reason it is refused. */
export type CodePointRange = readonly [first: number, last: number, what: string];

const LAST_BMP = 0xffff;
const FIRST_ASTRAL = 0x10000;
const LAST_CODE_POINT = 0x10ffff;
const PLANE_SIZE = 0x10000;
const FIRST_LEAD = 0xd800;
const FIRST_TRAIL = 0xdc00;
const LAST_TRAIL = 0xdfff;
const TRAILS_PER_LEAD = 0x400;

/** `\uXXXX` for a BMP code point or a surrogate unit. */
const u4 = (unit: number) => `\\u${unit.toString(16).toUpperCase().padStart(4, '0')}`;
/** `\u{XXXXX}` for any code point (valid only with the `u` flag). */
const uBrace = (codePoint: number) => `\\u{${codePoint.toString(16).toUpperCase()}}`;
/** A character-class member for one code point or an inclusive range, with the given escape. */
const member = (first: number, last: number, escape: (n: number) => string) =>
  first === last ? escape(first) : `${escape(first)}-${escape(last)}`;

/** The noncharacters U+nFFFE and U+nFFFF of the supplementary planes 1–13 (14–16 are refused whole). */
function supplementaryNoncharacters(): CodePointRange[] {
  const ranges: CodePointRange[] = [];
  for (let plane = 1; plane <= 13; plane++) {
    const base = plane * PLANE_SIZE;
    ranges.push([base + 0xfffe, base + 0xffff, `noncharacters of plane ${plane}`]);
  }
  return ranges;
}

/**
 * Every code point no published comment may carry, in order. Invisible or format characters
 * that can hide text, spoof a name or reverse a line; control characters; unassigned and
 * private-use blocks that render as nothing or as anything. Kept as ranges so the renderer and
 * the desk's normaliser can build their own expressions from the same list.
 */
const FORBIDDEN_RANGES: readonly CodePointRange[] = Object.freeze([
  [0x0000, 0x001f, 'C0 control characters (text allows U+000A, the newline, on its own)'],
  [0x007f, 0x009f, 'DEL and the C1 control characters'],
  [0x00ad, 0x00ad, 'soft hyphen'],
  [0x034f, 0x034f, 'combining grapheme joiner'],
  [0x061c, 0x061c, 'Arabic letter mark'],
  [0x115f, 0x1160, 'Hangul choseong and jungseong fillers'],
  [0x17b4, 0x17b5, 'Khmer inherent vowels'],
  [0x180b, 0x180f, 'Mongolian free variation selectors and vowel separator'],
  [0x200b, 0x200f, 'zero-width space, the joiners (allowed only between two other characters), left-to-right and right-to-left marks'],
  [0x2028, 0x202e, 'line and paragraph separators, bidirectional embeddings and overrides'],
  [0x2060, 0x206f, 'word joiner, invisible operators, bidirectional isolates, deprecated format characters'],
  [0x2800, 0x2800, 'Braille pattern blank'],
  [0x3164, 0x3164, 'Hangul filler'],
  [0xd800, 0xdfff, 'surrogates: a lone one is refused, a pair is one character above U+FFFF'],
  [0xe000, 0xf8ff, 'private use area'],
  [0xfdd0, 0xfdef, 'noncharacters'],
  [0xfe00, 0xfe0d, 'variation selectors 1–14 (15 and 16, U+FE0E and U+FE0F, pick text or emoji presentation and are allowed)'],
  [0xfeff, 0xfeff, 'byte-order mark, zero-width no-break space'],
  [0xffa0, 0xffa0, 'halfwidth Hangul filler'],
  [0xfff0, 0xfffb, 'unassigned specials and interlinear annotation'],
  [0xfffe, 0xffff, 'noncharacters'],
  ...supplementaryNoncharacters(),
  [0xe0000, 0xeffff, 'plane 14: tags (U+E0000–E007F), variation selectors 17–256 (U+E0100–E01EF), the rest unassigned'],
  [0xf0000, LAST_CODE_POINT, 'supplementary private use areas (planes 15 and 16)'],
]);

/** The joiners, U+200C (zero-width non-joiner) and U+200D (zero-width joiner). */
const JOINERS: readonly number[] = Object.freeze([0x200c, 0x200d]);

/** A `u`-flag character class matching one refused code point (joiners included). */
function unicodeClass(ranges: readonly CodePointRange[]): string {
  return `[${ranges.map(([first, last]) => member(first, last, (n) => (n <= LAST_BMP ? u4(n) : uBrace(n)))).join('')}]`;
}

/** The refused code points at or below U+FFFF, as a character-class body that needs no flag. */
function bmpClassBody(ranges: readonly CodePointRange[]): string {
  return ranges
    .filter(([first]) => first <= LAST_BMP)
    .map(([first, last]) => member(first, Math.min(last, LAST_BMP), u4))
    .join('');
}

/** The complement of the refused ranges above U+FFFF: every allowed code point there, as inclusive intervals. */
function allowedAstralIntervals(ranges: readonly CodePointRange[]): [number, number][] {
  const intervals: [number, number][] = [];
  let next = FIRST_ASTRAL;
  for (const [first, last] of ranges) {
    if (last < FIRST_ASTRAL) continue;
    if (first > next) intervals.push([next, first - 1]);
    next = Math.max(next, last + 1);
  }
  if (next <= LAST_CODE_POINT) intervals.push([next, LAST_CODE_POINT]);
  return intervals;
}

const leadOf = (codePoint: number) => FIRST_LEAD + Math.floor((codePoint - FIRST_ASTRAL) / TRAILS_PER_LEAD);
const trailOf = (codePoint: number) => FIRST_TRAIL + ((codePoint - FIRST_ASTRAL) % TRAILS_PER_LEAD);

/**
 * The allowed code points above U+FFFF as an alternation of surrogate pairs, for a pattern
 * without the `u` flag: one alternative per distinct trail range, each a class of lead units
 * followed by the trail class. A lead whose whole trail range is allowed goes into the
 * `[\uDC00-\uDFFF]` alternative; a lead with a partial range gets its own trail class.
 */
function allowedAstralPairs(ranges: readonly CodePointRange[]): string {
  const leadsByTrail = new Map<string, string[]>();
  const add = (trail: string, lead: string) => {
    const leads = leadsByTrail.get(trail) ?? [];
    leads.push(lead);
    leadsByTrail.set(trail, leads);
  };
  for (const [first, last] of allowedAstralIntervals(ranges)) {
    let firstFullLead = leadOf(first);
    let lastFullLead = leadOf(last);
    if (trailOf(first) !== FIRST_TRAIL) {
      const lead = leadOf(first);
      const trailEnd = lead === leadOf(last) ? trailOf(last) : LAST_TRAIL;
      add(`[${member(trailOf(first), trailEnd, u4)}]`, u4(lead));
      if (lead === leadOf(last)) continue;
      firstFullLead = lead + 1;
    }
    if (trailOf(last) !== LAST_TRAIL) {
      add(`[${member(FIRST_TRAIL, trailOf(last), u4)}]`, u4(leadOf(last)));
      lastFullLead = leadOf(last) - 1;
    }
    if (firstFullLead <= lastFullLead) add(`[${member(FIRST_TRAIL, LAST_TRAIL, u4)}]`, member(firstFullLead, lastFullLead, u4));
  }
  return [...leadsByTrail].map(([trail, leads]) => `[${leads.join('')}]${trail}`).join('|');
}

/**
 * The one list of characters a comment may not carry, in every form its consumers need: this
 * schema (patterns without the `u` flag, published as JSON Schema), the renderer
 * (`src/lib/comment-text.ts`, which strips before it escapes and can use `unicodeClass`) and
 * the desk's normaliser. All of them derive from `ranges`; the test proves the pattern forms
 * agree with the ranges at every range boundary and across every plane.
 *
 * The joiners U+200C and U+200D are in `ranges` and in every class, because a joiner on its own
 * is invisible text. A comment may still carry them **between two other allowed characters** —
 * Persian and Indic scripts and emoji sequences need them there — which is what the anchored
 * name and text patterns below allow, and nothing else: never first, never last, never a string
 * made only of joiners.
 */
export const FORBIDDEN_CHARACTERS = Object.freeze({
  /** Every refused code point, as inclusive ranges with the reason. The source the other forms derive from. */
  ranges: FORBIDDEN_RANGES,
  /** The joiners' code points, the two members of `ranges` that the string patterns let through between other characters. */
  joiners: JOINERS,
  /** A character class matching one refused code point, for a RegExp **with** the `u` flag. Exact above U+FFFF too. */
  unicodeClass: unicodeClass(FORBIDDEN_RANGES),
  /** A character class matching one allowed code point (not a joiner), for a RegExp **with** the `u` flag. */
  allowedUnicode: `[^${unicodeClass(FORBIDDEN_RANGES).slice(1)}`,
  /**
   * An alternation matching one allowed character (not a joiner), for a RegExp **without** the
   * `u` flag: a class of allowed BMP units — surrogates excluded — or one allowed surrogate pair.
   * Refuses lone surrogates. This is what the published patterns are built from.
   */
  allowedNonUnicode: `(?:[^${bmpClassBody(FORBIDDEN_RANGES)}]|${allowedAstralPairs(FORBIDDEN_RANGES)})`,
  /** A character class matching one joiner, in either mode. */
  joinerClass: `[${JOINERS.map(u4).join('')}]`,
});

const FORBIDDEN_MESSAGE = 'control, invisible, format, private-use or bidirectional characters, and no joiner first, last or alone';

/**
 * One allowed character, then any number of (optional joiners, one allowed character): so a
 * joiner sits only between two other characters. Each alternative is disjoint from the others
 * (a BMP unit, a lead surrogate, a newline), so the match is deterministic and linear.
 */
function stringOf(allowed: string): RegExp {
  return new RegExp(`^${allowed}(?:${FORBIDDEN_CHARACTERS.joinerClass}*${allowed})*$`);
}

/** One line: every character allowed, so no newline or tab either. */
const ONE_LINE = stringOf(FORBIDDEN_CHARACTERS.allowedNonUnicode);
/** Lines: every character allowed, plus `\n` (the only control character text may hold). */
const PLAIN_LINES = stringOf(`(?:\\n|${FORBIDDEN_CHARACTERS.allowedNonUnicode})`);
/**
 * HTML is not plain text: refuse `<` followed by a letter (a tag), `/` (a closing tag), `!` (a
 * comment or doctype) or `?` (a processing instruction). `a < b`, `<3` and a trailing `<` stay
 * legal. No lookahead: a run of `<` is consumed whole and the character after it decides, so the
 * match is linear.
 */
const NO_HTML = /^(?:[^<]|<+[^<A-Za-z!/?])*<*$/;
/**
 * At least one character that shows: not whitespace, not a combining mark from the generic
 * combining blocks, not a variation selector, not a joiner. A name of only fillers is refused.
 */
const HAS_VISIBLE = new RegExp(
  '[^\\s\\u0300-\\u036F\\u1AB0-\\u1AFF\\u1DC0-\\u1DFF\\u200C\\u200D\\u20D0-\\u20FF\\uFE0E\\uFE0F\\uFE20-\\uFE2F]',
);

/** The patterns the published contract carries for `name` and `text`, by field, in the order they apply. */
export const COMMENT_PATTERNS = Object.freeze({
  name: Object.freeze({ oneLine: ONE_LINE, noHtml: NO_HTML, hasVisible: HAS_VISIBLE }),
  text: Object.freeze({ plainLines: PLAIN_LINES, noHtml: NO_HTML, hasVisible: HAS_VISIBLE }),
});

/**
 * A length cap counted in Unicode code points, which is what JSON Schema's `maxLength` counts,
 * so the published contract and the build agree exactly. zod's own `.max()` counts UTF-16 code
 * units (an emoji is two), which would have made the build stricter than the contract it
 * publishes for strings near the cap. Stops counting at `max + 1`, so it costs the same for a
 * megabyte as for a line. `.meta({ maxLength })` puts the cap into the JSON Schema.
 */
function withinCodePoints(max: number) {
  return (value: string) => {
    let count = 0;
    for (const _ of value) if (++count > max) return false;
    return true;
  };
}

/**
 * The length check runs first and aborts: an over-long string reports only its length and never
 * reaches a pattern, so the patterns only ever see at most `max` code points.
 */
const boundedString = (max: number, field: string) =>
  z.string().refine(withinCodePoints(max), { message: `${field} must be at most ${max} characters`, abort: true });

const name = boundedString(COMMENT_NAME_MAX, 'name')
  .min(1, 'name must not be empty')
  .regex(ONE_LINE, `name must be one line with no ${FORBIDDEN_MESSAGE}`)
  .regex(NO_HTML, 'name must not contain HTML')
  .regex(HAS_VISIBLE, 'name must contain at least one visible character')
  .meta({ maxLength: COMMENT_NAME_MAX });

const text = boundedString(COMMENT_TEXT_MAX, 'text')
  .min(1, 'text must not be empty')
  .regex(PLAIN_LINES, `text may contain newlines but no other ${FORBIDDEN_MESSAGE}`)
  .regex(NO_HTML, 'text must not contain HTML')
  .regex(HAS_VISIBLE, 'text must contain at least one visible character')
  .meta({ maxLength: COMMENT_TEXT_MAX });

/** An ISO-8601 instant in UTC with a `Z` suffix: `2026-09-25T10:00:00Z`. An offset is refused. */
const utcInstant = () => z.iso.datetime({ error: 'must be an ISO-8601 UTC time ending in Z' });

export const commentSchema = z
  .object({
    id: z.string().regex(ULID, 'id must be a ULID: 26 uppercase Crockford base32 characters, the first 0–7'),
    name,
    text,
    /** When the comment was written, as the desk recorded it. */
    at: utcInstant(),
    /** True when the writer was signed in (batch C). Absent means anonymous. */
    signedIn: z.boolean().optional(),
  })
  .strict();

export type Comment = z.infer<typeof commentSchema>;

/** ids unique in the file; comments in the order the page shows them, oldest first. */
function uniqueIdsOldestFirst(comments: Comment[], ctx: z.RefinementCtx) {
  const firstIndexOf = new Map<string, number>();
  comments.forEach((comment, index) => {
    const earlier = firstIndexOf.get(comment.id);
    if (earlier === undefined) {
      firstIndexOf.set(comment.id, index);
    } else {
      ctx.addIssue({
        code: 'custom',
        path: [index, 'id'],
        message: `id ${comment.id} is also on comment ${earlier}; ids are unique in a file`,
      });
    }
    if (index > 0 && Date.parse(comment.at) < Date.parse(comments[index - 1].at)) {
      ctx.addIssue({
        code: 'custom',
        path: [index, 'at'],
        message: 'comments must be sorted oldest first',
      });
    }
  });
}

/**
 * No comment is written after the file that carries it. Not "not in the future": that would make
 * the build depend on the clock, and a file that was fine yesterday must be fine tomorrow. zod
 * skips this refinement when a field failed, so every value here has parsed.
 */
function nothingAfterGeneratedAt(file: { generatedAt: string; comments: Comment[] }, ctx: z.RefinementCtx) {
  const generatedAt = Date.parse(file.generatedAt);
  file.comments.forEach((comment, index) => {
    if (Date.parse(comment.at) > generatedAt) {
      ctx.addIssue({
        code: 'custom',
        path: ['comments', index, 'at'],
        message: `at ${comment.at} is later than generatedAt ${file.generatedAt}; a comment is never newer than the file`,
      });
    }
  });
}

export const commentsFileSchema = z
  .object({
    version: z.literal(COMMENT_CONTRACT_VERSION),
    /** The post's slug. Must equal the file name (checked by `npm run check:posts` and the loader). */
    slug: z.string().regex(COMMENT_SLUG, 'slug must be lowercase letters, digits and hyphens, starting with a letter or digit'),
    /** When the desk generated this file. */
    generatedAt: utcInstant(),
    /** Every approved comment, oldest first. A post with none has no file at all. */
    comments: z
      .array(commentSchema)
      .min(1, 'a file with no comments must not exist; the desk deletes it')
      .max(COMMENTS_PER_FILE_MAX, `a file holds at most ${COMMENTS_PER_FILE_MAX} comments`)
      .superRefine(uniqueIdsOldestFirst),
  })
  .strict()
  .superRefine(nothingAfterGeneratedAt);

export type CommentsFile = z.infer<typeof commentsFileSchema>;

const COMMENTS_SCHEMA_TITLE = 'AI Tamer comment data file';
const COMMENTS_SCHEMA_DESCRIPTION =
  'The contract every comment data file (src/content/comments/<slug>.json) on aitamer.news ' +
  'satisfies. Generated from the same zod schema the build validates against, so it cannot drift. ' +
  'Lengths are counted in Unicode code points. ' +
  'Six rules cannot be expressed here and the build enforces them too: ' +
  '(1) the slug equals the file name; ' +
  '(2) a post with that slug exists; ' +
  '(3) a post with no approved comments has no file, so a file is never published empty; ' +
  '(4) ids are unique within a file; ' +
  '(5) comments are sorted oldest first by at; ' +
  '(6) every at is no later than generatedAt. ' +
  'The patterns are ECMA-262 without the u flag, which is how the build runs them. Compiled with ' +
  'the u flag they agree for every character up to U+FFFF and refuse lone surrogates, but let ' +
  'refused characters above U+FFFF (plane 14, the supplementary private use areas, the ' +
  'supplementary noncharacters) through; the build refuses those, so a validator using the u ' +
  'flag should also refuse the code-point ranges in FORBIDDEN_CHARACTERS.ranges ' +
  '(src/content/comment-schema.ts). The format is documented in POST.md: ' +
  'https://github.com/michelabboud/aitamer-news/blob/main/POST.md';

/**
 * `commentsFileSchema` as JSON Schema, for `/contract/comments.schema.json` and
 * `/contract/v1/comments.schema.json` — each route gets its own `$id`. `io: 'input'` for the
 * same reason as the post contract: the shape a writer produces, before parsing. Nothing here is
 * unrepresentable (every field is a JSON string, number, boolean or array), so the converter runs
 * with no overrides; the `unrepresentable` handler is set to throw so a future field that is not
 * representable fails this function's test instead of silently publishing a looser contract.
 */
export function commentsFileJsonSchema(route: CommentsSchemaRoute = 'current'): Record<string, unknown> {
  const generated = z.toJSONSchema(commentsFileSchema, { io: 'input', unrepresentable: 'throw' });
  return {
    $id: `${SITE.url}${COMMENTS_SCHEMA_ROUTES[route]}`,
    title: COMMENTS_SCHEMA_TITLE,
    description: COMMENTS_SCHEMA_DESCRIPTION,
    'x-contract-version': COMMENT_CONTRACT_VERSION,
    ...generated,
  };
}

/** The exact bytes a route serves — and, for `v1`, the bytes the snapshot freezes. Two-space indent, one trailing newline. */
export function commentsFileJsonSchemaDocument(route: CommentsSchemaRoute = 'current'): string {
  return `${JSON.stringify(commentsFileJsonSchema(route), null, 2)}\n`;
}

/**
 * The comment contract's constants and character rules, without zod (task S3 of
 * docs/plans/2026-10-24-comments-on-r2.md). `./comment-schema.ts` builds the zod schema and the
 * published JSON Schema from these and re-exports every one of them, so its importers are
 * unchanged and no published byte moved. They live apart because the browser needs them too: the
 * client renderer (`src/lib/comment-dom.ts`) and the comments loader import this module, and a
 * module that builds zod schemas when it loads would put zod into every story page's bundle.
 * Nothing here may import zod, `astro:*` or anything that does (a test reads the imports).
 */

/** The comment contract's version. Bump it, and add a sibling schema route, rather than editing this one in place. */
export const COMMENT_CONTRACT_VERSION = 1;

/**
 * A post slug, as the file name and the `slug` field carry it. The same shape as `SLUG` in
 * `scripts/frontmatter.mjs` (the test asserts they agree): lowercase letters, digits and
 * hyphens, starting with a letter or digit.
 */
export const COMMENT_SLUG = /^[a-z0-9][a-z0-9-]*$/;
/**
 * The longest slug: 120 characters, the comments Worker's cap and `SLUG_MAX_LENGTH` in
 * `scripts/slug.mjs` (the test asserts they agree), which `npm run check:posts` applies to a
 * post's file name. A slug is ASCII, so characters and UTF-16 units count the same.
 */
export const COMMENT_SLUG_MAX = 120;

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
  // The format characters (Unicode general category Cf) above U+FFFF, as of Unicode 17.0; plane 14's
  // tags are refused with the rest of plane 14 below. The test checks every Cf code point.
  [0x110bd, 0x110bd, 'Kaithi number sign (format)'],
  [0x110cd, 0x110cd, 'Kaithi number sign above (format)'],
  [0x13430, 0x1343f, 'Egyptian hieroglyph format controls: joiners, insertions, segments, enclosures'],
  [0x1bca0, 0x1bca3, 'shorthand format controls (Duployan): letter overlap, continuing overlap, up and down step'],
  [0x1d173, 0x1d17a, 'musical symbol format controls: begin and end beam, tie, slur and phrase'],
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
 * is invisible text. A comment may still carry **one** of them **between two other allowed
 * characters** — Persian and Indic scripts and emoji sequences need one there, never two — which
 * is what the anchored name and text patterns below allow, and nothing else: never first, never
 * last, never two in a row, never a string made only of joiners.
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

/**
 * One allowed character, then any number of (at most one joiner, one allowed character): so a
 * joiner sits only between two other characters, and never next to another joiner. Each
 * alternative is disjoint from the others (a BMP unit, a lead surrogate, a newline), so the
 * match is deterministic and linear.
 */
function stringOf(allowed: string): RegExp {
  return new RegExp(`^${allowed}(?:${FORBIDDEN_CHARACTERS.joinerClass}?${allowed})*$`);
}

/** One line: every character allowed, so no newline or tab either. */
export const ONE_LINE = stringOf(FORBIDDEN_CHARACTERS.allowedNonUnicode);
/** Lines: every character allowed, plus `\n` (the only control character text may hold). */
export const PLAIN_LINES = stringOf(`(?:\\n|${FORBIDDEN_CHARACTERS.allowedNonUnicode})`);
/**
 * HTML is not plain text: refuse `<` followed by a letter (a tag), `/` (a closing tag), `!` (a
 * comment or doctype) or `?` (a processing instruction). `a < b`, `<3` and a trailing `<` stay
 * legal. No lookahead: a run of `<` is consumed whole and the character after it decides, so the
 * match is linear.
 */
export const NO_HTML = /^(?:[^<]|<+[^<A-Za-z!/?])*<*$/;
/**
 * At least one character that shows: not whitespace, not a combining mark from the generic
 * combining blocks, not a variation selector, not a joiner. A name of only fillers is refused.
 */
export const HAS_VISIBLE = new RegExp(
  '[^\\s\\u0300-\\u036F\\u1AB0-\\u1AFF\\u1DC0-\\u1DFF\\u200C\\u200D\\u20D0-\\u20FF\\uFE0E\\uFE0F\\uFE20-\\uFE2F]',
);

/** The patterns the published contract carries for `name` and `text`, by field, in the order they apply. */
export const COMMENT_PATTERNS = Object.freeze({
  name: Object.freeze({ oneLine: ONE_LINE, noHtml: NO_HTML, hasVisible: HAS_VISIBLE }),
  text: Object.freeze({ plainLines: PLAIN_LINES, noHtml: NO_HTML, hasVisible: HAS_VISIBLE }),
});

// ---- The comments index contract (`./comments-index-schema.ts`) ----

/** The index contract's version. Bump it, and add a sibling schema route, rather than editing this one in place. */
export const COMMENTS_INDEX_CONTRACT_VERSION = 1;

/** The object key the desk writes the index to, inside the version prefix of the public data bucket. */
export const COMMENTS_INDEX_KEY = 'v1/comments-index.json';

/** The newest comments site-wide the index carries ("Around the fire"). Fixed by the design, not an operator knob. */
export const COMMENTS_INDEX_RECENT_MAX = 60;
/** A recent comment's text is cut to this many Unicode code points, at a grapheme boundary, and marked `truncated`. */
export const COMMENTS_INDEX_TEXT_MAX = 400;
/** A story title, in Unicode code points: the post contract's cap. */
export const COMMENTS_INDEX_TITLE_MAX = 200;
/**
 * Stories with at least one approved comment. Ten times the site's size when the contract was
 * written (about 1,000 stories, and only some have comments): generous enough never to be the
 * limit, finite so a runaway writer cannot hand a browser an unbounded object. At about 40 bytes
 * a story the index passes 64 KiB near 800 stories with comments; sharding the counts is the
 * answer then (BACKLOG), not a bigger cap.
 */
export const COMMENTS_INDEX_STORIES_MAX = 10_000;
/** The desk's site id (`aitamer`): the same shape as a slug. */
export const COMMENTS_INDEX_SITE_MAX = 60;

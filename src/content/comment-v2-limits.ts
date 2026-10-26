/** Browser-safe v2 envelope metadata. Frozen v1 limits and baked readers stay unchanged. */
export const COMMENT_V2_CONTRACT_VERSION = 2;
export const COMMENT_V2_REVISION_MAX_DIGITS = 40;
/** The negative lookahead requires the absolute end; `$` alone also accepts a trailing newline. */
export const COMMENT_V2_REVISION_PATTERN = /^[1-9][0-9]{0,39}(?![\s\S])/;
export const COMMENTS_V2_FILE_PREFIX = 'v2/comments/';
export const COMMENTS_V2_INDEX_KEY = 'v2/comments-index.json';

/** Validate before parsing; revisions never pass through floating-point numbers. */
export function parseCommentRevision(value: unknown): bigint | null {
  return typeof value === 'string' && value.length <= COMMENT_V2_REVISION_MAX_DIGITS && COMMENT_V2_REVISION_PATTERN.test(value)
    ? BigInt(value) : null;
}

/** Same UTC calendar/time shape as the published ISO datetime fields, without zod in a browser. */
export function isCommentUtcInstant(value: unknown): value is string {
  if (typeof value !== 'string') return false;
  const parts = /^(\d{4})-(\d{2})-(\d{2})T([01]\d|2[0-3]):([0-5]\d):([0-5]\d)(?:\.\d+)?Z(?![\s\S])/.exec(value);
  if (parts === null) return false;
  const time = new Date(value);
  return Number.isFinite(time.getTime()) && time.getUTCFullYear() === Number(parts[1]) &&
    time.getUTCMonth() + 1 === Number(parts[2]) && time.getUTCDate() === Number(parts[3]);
}

/**
 * The desk's pins (plan docs/plans/2026-10-31-top-nav-and-pinning.md, "Pinned by the desk" and
 * "Pin file rules"): the strict reader for `src/data/pins.json`, the reading of `until`, and the
 * choice of which pins the homepage card shows.
 *
 * Pure on purpose: no Astro, no filesystem, no clock of its own (`now` is passed in). The pin
 * command, the pin check and the build all use this one module, so they cannot disagree about what
 * a valid pin is or which pins show. It reads no GitHub identity: `pinnedBy` is a name for the
 * record only, so the file and its rules survive the desk moving off GitHub.
 */
import { SLUG, SLUG_MAX_LENGTH } from '../../scripts/slug.mjs';

/** `auto`: the editor-in-chief pins directly. `approve`: the editor proposes and a person approves. */
export type PinMode = 'auto' | 'approve';
export type PinSource = 'auto' | 'manual';
/** Only `active` pins can show. `proposed` is the approve-mode waiting state. */
export type PinState = 'active' | 'proposed';

export interface Pin {
  slug: string;
  source: PinSource;
  state: PinState;
  /** Who asked for the pin (`michel`, `eic`, a newsroom bot's name). For the record only. */
  pinnedBy: string;
  /** ISO 8601 timestamp with an offset or `Z`. */
  pinnedAt: string;
  /** Optional end: a timestamp with an offset or `Z`, or a bare `YYYY-MM-DD` (end of that day in Israel). */
  until?: string;
}

export interface PinsFile {
  mode: PinMode;
  pins: Pin[];
}

export type DropReason = 'expired' | 'unpublished' | 'proposed';

export interface DroppedPin {
  slug: string;
  reason: DropReason;
}

/** How many posts the homepage pin card holds. */
export const PIN_CARD_CAPACITY = 2;

/** The zone a bare-date `until` is read in. An IANA name, so summer and winter time are both right. */
export const PIN_ZONE = 'Asia/Jerusalem';

export const PIN_MODES: readonly PinMode[] = ['auto', 'approve'];
export const PIN_SOURCES: readonly PinSource[] = ['auto', 'manual'];
export const PIN_STATES: readonly PinState[] = ['active', 'proposed'];

/** The keys a pin may carry, in the order the file writes them. */
export const PIN_KEYS = ['slug', 'source', 'state', 'pinnedBy', 'pinnedAt', 'until'] as const;
const FILE_KEYS = ['mode', 'pins'] as const;

/** `pinnedBy`: a lowercase name, at most 40 characters. */
export const PINNED_BY = /^[a-z0-9][a-z0-9-]{0,39}$/;

const TIMESTAMP = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})(?:\.(\d{1,9}))?(?:Z|([+-])(\d{2}):(\d{2}))$/;
const BARE_DATE = /^(\d{4})-(\d{2})-(\d{2})$/;
const DAY_MS = 86_400_000;

export class PinsFileError extends Error {
  constructor(message: string) {
    super(`pins.json: ${message}`);
    this.name = 'PinsFileError';
  }
}

/** A date at 00:00 UTC for a calendar day, or null when that day does not exist (month 13, 30 February). */
function calendarDay(year: number, month: number, day: number): Date | null {
  const date = new Date(0);
  date.setUTCFullYear(year, month - 1, day);
  const real = date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
  return real ? date : null;
}

/**
 * Read a full ISO 8601 timestamp that carries its own offset (`2026-11-05T18:00:00+02:00`, or `Z`).
 * A timestamp without an offset is refused: its meaning would depend on the build machine's clock.
 * @returns the instant, or null when the text is not such a timestamp or names an impossible moment
 */
export function parseTimestamp(value: string): Date | null {
  const match = TIMESTAMP.exec(value);
  if (!match) return null;
  const [, y, mo, d, h, mi, s, fraction, sign, offsetHours, offsetMinutes] = match;
  const day = calendarDay(Number(y), Number(mo), Number(d));
  if (day === null || Number(h) > 23 || Number(mi) > 59 || Number(s) > 59) return null;
  if (offsetHours !== undefined && (Number(offsetHours) > 23 || Number(offsetMinutes) > 59)) return null;
  const millis = Number((fraction ?? '').padEnd(3, '0').slice(0, 3));
  day.setUTCHours(Number(h), Number(mi), Number(s), millis);
  const offset = offsetHours === undefined ? 0 : (sign === '-' ? -1 : 1) * (Number(offsetHours) * 60 + Number(offsetMinutes)) * 60_000;
  return new Date(day.valueOf() - offset);
}

/** @returns the `YYYY-MM-DD` parts of a real calendar date, or null */
function parseBareDate(value: string): { year: number; month: number; day: number } | null {
  const match = BARE_DATE.exec(value);
  if (!match) return null;
  const [year, month, day] = [Number(match[1]), Number(match[2]), Number(match[3])];
  return calendarDay(year, month, day) === null ? null : { year, month, day };
}

const zoneFormat = new Intl.DateTimeFormat('en-US', {
  timeZone: PIN_ZONE,
  hourCycle: 'h23',
  year: 'numeric',
  month: 'numeric',
  day: 'numeric',
  hour: 'numeric',
  minute: 'numeric',
  second: 'numeric',
});

/** The zone's offset from UTC at an instant, in ms (+2 h in winter, +3 h in summer for Israel). */
function zoneOffsetMs(instantMs: number): number {
  const part: Record<string, number> = {};
  for (const { type, value } of zoneFormat.formatToParts(new Date(instantMs))) {
    if (type !== 'literal') part[type] = Number(value);
  }
  const wall = Date.UTC(part.year, part.month - 1, part.day, part.hour, part.minute, part.second);
  return wall - Math.floor(instantMs / 1000) * 1000;
}

/**
 * The instant at which the zone's clock reads a given wall time (the wall time written as if UTC).
 * Tries the offsets in force a day before and after, which are the only ones a transition can
 * switch between, and takes the earliest instant that really shows that wall time. A wall time that
 * does not exist (a clock jumped over it) resolves with the earlier offset.
 */
function wallTimeToInstant(wallMs: number): number {
  const offsets = [...new Set([zoneOffsetMs(wallMs - DAY_MS), zoneOffsetMs(wallMs + DAY_MS)])];
  const valid = offsets.map((offset) => wallMs - offset).filter((instant) => zoneOffsetMs(instant) === wallMs - instant);
  return valid.length > 0 ? Math.min(...valid) : wallMs - offsets[0];
}

/**
 * The last moment a pin with this `until` is still shown. A timestamp is that instant. A bare date
 * is the end of that day in {@link PIN_ZONE}, through 23:59:59.999 local time. A pin is expired
 * only when `now` is strictly after this instant.
 * @throws PinsFileError when `until` is neither form
 */
export function untilInstant(until: string): Date {
  const instant = parseTimestamp(until);
  if (instant !== null) return instant;
  const bare = parseBareDate(until);
  if (bare === null) throw new PinsFileError(`until "${until}" is neither a timestamp with an offset or Z nor a real YYYY-MM-DD date`);
  const nextMidnight = calendarDay(bare.year, bare.month, bare.day) as Date;
  nextMidnight.setUTCDate(nextMidnight.getUTCDate() + 1);
  return new Date(wallTimeToInstant(nextMidnight.valueOf()) - 1);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function rejectUnknownKeys(record: Record<string, unknown>, allowed: readonly string[], where: string): void {
  for (const key of Object.keys(record)) {
    if (!allowed.includes(key)) throw new PinsFileError(`${where}: unknown key "${key}" (allowed: ${allowed.join(', ')})`);
  }
}

function oneOf<T extends string>(value: unknown, allowed: readonly T[], where: string): T {
  if (typeof value !== 'string' || !allowed.includes(value as T)) {
    throw new PinsFileError(`${where} must be one of ${allowed.map((v) => `"${v}"`).join(', ')}, got ${JSON.stringify(value)}`);
  }
  return value as T;
}

function parsePin(raw: unknown, index: number): Pin {
  const where = `pins[${index}]`;
  if (!isRecord(raw)) throw new PinsFileError(`${where} must be an object`);
  rejectUnknownKeys(raw, PIN_KEYS, where);
  const { slug, pinnedBy, pinnedAt, until } = raw;
  if (typeof slug !== 'string' || !SLUG.test(slug) || slug.length > SLUG_MAX_LENGTH) {
    throw new PinsFileError(`${where}.slug must be a post slug (lowercase letters, digits and hyphens, at most ${SLUG_MAX_LENGTH} characters), got ${JSON.stringify(slug)}`);
  }
  const source = oneOf(raw.source, PIN_SOURCES, `${where}.source`);
  const state = oneOf(raw.state, PIN_STATES, `${where}.state`);
  if (typeof pinnedBy !== 'string' || !PINNED_BY.test(pinnedBy)) {
    throw new PinsFileError(`${where}.pinnedBy must match ${PINNED_BY}, got ${JSON.stringify(pinnedBy)}`);
  }
  if (typeof pinnedAt !== 'string' || parseTimestamp(pinnedAt) === null) {
    throw new PinsFileError(`${where}.pinnedAt must be an ISO 8601 timestamp with an offset or Z (2026-11-05T18:00:00+02:00), got ${JSON.stringify(pinnedAt)}`);
  }
  const pin: Pin = { slug, source, state, pinnedBy, pinnedAt };
  if (Object.hasOwn(raw, 'until')) {
    if (typeof until !== 'string' || (parseTimestamp(until) === null && parseBareDate(until) === null)) {
      throw new PinsFileError(`${where}.until must be a timestamp with an offset or Z, or a real YYYY-MM-DD date, got ${JSON.stringify(until)}`);
    }
    pin.until = until;
  }
  return pin;
}

/**
 * Validate a parsed `pins.json`. Strict: an unknown key at either level, a wrong type, a bad
 * `state`, a timestamp without an offset, an impossible date or a repeated slug all throw.
 * @param raw the parsed JSON
 * @returns the file with its keys in the order the file is written
 * @throws PinsFileError naming the first thing wrong
 */
export function parsePinsFile(raw: unknown): PinsFile {
  if (!isRecord(raw)) throw new PinsFileError('the file must be a JSON object with "mode" and "pins"');
  rejectUnknownKeys(raw, FILE_KEYS, 'the file');
  const mode = oneOf(raw.mode, PIN_MODES, 'mode');
  if (!Array.isArray(raw.pins)) throw new PinsFileError('"pins" must be an array');
  const pins = raw.pins.map(parsePin);
  const seen = new Set<string>();
  for (const { slug } of pins) {
    if (seen.has(slug)) throw new PinsFileError(`slug "${slug}" is pinned twice; one entry per post`);
    seen.add(slug);
  }
  return { mode, pins };
}

/**
 * Parse the text of `pins.json`.
 * @throws PinsFileError for text that is not JSON, or JSON that fails {@link parsePinsFile}
 */
export function parsePinsText(text: string): PinsFile {
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch (error) {
    throw new PinsFileError(`not valid JSON (${(error as Error).message})`);
  }
  return parsePinsFile(raw);
}

/** The canonical text of the file: two-space JSON, keys in the documented order, one trailing newline. */
export function serializePinsFile(file: PinsFile): string {
  return `${JSON.stringify(parsePinsFile(file), null, 2)}\n`;
}

const byNewest = (a: Pin, b: Pin): number =>
  (parseTimestamp(b.pinnedAt) as Date).valueOf() - (parseTimestamp(a.pinnedAt) as Date).valueOf() || a.slug.localeCompare(b.slug);

/**
 * Which pins the homepage card shows, and which were dropped and why.
 *
 * Only `active` pins can show, in both modes; a `proposed` pin is dropped as `proposed`. An active
 * pin is dropped as `unpublished` when its post is not in `publishedIds`, else as `expired` when
 * `now` is strictly after its {@link untilInstant} (a pin is still shown at exactly that instant).
 * A pin that is both unpublished and expired reports `unpublished`, the one that needs a person.
 * Of what is left, manual pins take the {@link PIN_CARD_CAPACITY} slots first, newest `pinnedAt`
 * first, and auto pins fill what remains, newest first. A pin that loses a slot is simply not shown:
 * it has no `dropped` entry. `shown` is ordered newest `pinnedAt` first. Ties break on slug.
 *
 * @param file a validated file ({@link parsePinsFile})
 * @param publishedIds ids of the posts that are live and listed
 * @param now the build's clock
 */
export function selectPinned(
  file: PinsFile,
  publishedIds: ReadonlySet<string>,
  now: Date,
): { shown: Pin[]; dropped: DroppedPin[] } {
  const dropped: DroppedPin[] = [];
  const eligible: Pin[] = [];
  for (const pin of file.pins) {
    if (pin.state !== 'active') dropped.push({ slug: pin.slug, reason: 'proposed' });
    else if (!publishedIds.has(pin.slug)) dropped.push({ slug: pin.slug, reason: 'unpublished' });
    else if (pin.until !== undefined && now.valueOf() > untilInstant(pin.until).valueOf()) dropped.push({ slug: pin.slug, reason: 'expired' });
    else eligible.push(pin);
  }
  const manual = eligible.filter((pin) => pin.source === 'manual').sort(byNewest);
  const auto = eligible.filter((pin) => pin.source === 'auto').sort(byNewest);
  const shown = [...manual, ...auto].slice(0, PIN_CARD_CAPACITY).sort(byNewest);
  return { shown, dropped };
}

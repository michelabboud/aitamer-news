/** Private causal protocol. Credentials/operation identities travel only in bounded POST bodies. */
import { DATA_FETCH_TIMEOUT_MS, dataBaseUrl } from './data-host.ts';
import { COMMENT_SLUG, COMMENT_SLUG_MAX } from '../content/comment-limits.ts';
import { isKnownReaction, isReactionV2Generation, type ReactionId } from './reactions.ts';

export const REACTION_RECEIPT_MAX_BYTES = 2048;
export const REACTION_STREAM_MAX_OPERATIONS = 256;
export const REACTION_STREAM_LIFETIME_MS = 30 * 24 * 60 * 60 * 1000;
const CLOCK_SKEW_MS = 5 * 60 * 1000;
const MAX_CHUNKS = 512;
const HEX_NONCE = /^[0-9a-f]{32}(?![\s\S])/;
const CAPABILITY = /^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]{43}(?![\s\S])/;
const ISO_INSTANT = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z(?![\s\S])/;

export interface ReactionStream {
  readonly ok: true; readonly version: 1; readonly slug: string; readonly stream: string;
  readonly capability: string; readonly expiresAt: string;
}
export interface ReactionIntent {
  readonly sequence: string; readonly operation: string; readonly reaction: ReactionId | null;
}
export interface ReactionReceipt {
  readonly ok: true; readonly version: 1; readonly slug: string; readonly stream: string;
  readonly sequence: string; readonly operation: string; readonly processedThrough: string;
  readonly generation: string; readonly expiresAt: string;
}
export type PrivateReactionAnswer<T> = { ok: true; value: T } | { ok: false; status: number | null };
export type ReactionReceiptFetch = (url: string, init: RequestInit) => Promise<Pick<Response, 'ok' | 'status' | 'headers' | 'body'>>;

export function isReactionOperation(value: unknown): value is string { return typeof value === 'string' && HEX_NONCE.test(value); }
export function reactionOperation(): string {
  const bytes = new Uint8Array(16); crypto.getRandomValues(bytes);
  return [...bytes].map(value => value.toString(16).padStart(2, '0')).join('');
}
function object(value: unknown): value is Record<string, unknown> { return value !== null && typeof value === 'object' && !Array.isArray(value); }
function keys(value: unknown, expected: string[]): value is Record<string, unknown> {
  return object(value) && Object.keys(value).length === expected.length && expected.every(key => Object.hasOwn(value, key));
}
export function validReactionExpiry(value: unknown): value is string {
  return typeof value === 'string' && ISO_INSTANT.test(value) && Number.isFinite(Date.parse(value)) && new Date(value).toISOString() === value;
}
export function validReactionSlug(value: unknown): value is string {
  return typeof value === 'string' && value.length <= COMMENT_SLUG_MAX && COMMENT_SLUG.test(value) && /^[a-z0-9-]+(?![\s\S])/.test(value);
}
export function validateReactionStream(value: unknown, slug: string, now = Date.now(), allowExpired = false): value is ReactionStream {
  if (!keys(value, ['ok', 'version', 'slug', 'stream', 'capability', 'expiresAt']) || value.ok !== true || value.version !== 1 || value.slug !== slug || !validReactionSlug(slug) || !isReactionOperation(value.stream) || typeof value.capability !== 'string' || value.capability.length > 512 || !CAPABILITY.test(value.capability) || !validReactionExpiry(value.expiresAt)) return false;
  const expiry = Date.parse(value.expiresAt);
  return (allowExpired || expiry > now) && expiry <= now + REACTION_STREAM_LIFETIME_MS + CLOCK_SKEW_MS;
}
export function validateReactionIntent(value: unknown): value is ReactionIntent {
  return keys(value, ['sequence', 'operation', 'reaction']) && isReactionV2Generation(value.sequence) && BigInt(value.sequence) <= BigInt(REACTION_STREAM_MAX_OPERATIONS) && isReactionOperation(value.operation) && (value.reaction === null || (typeof value.reaction === 'string' && isKnownReaction(value.reaction)));
}
export function validateReactionReceipt(value: unknown, stream: ReactionStream, intent: ReactionIntent): value is ReactionReceipt {
  return keys(value, ['ok', 'version', 'slug', 'stream', 'sequence', 'operation', 'processedThrough', 'generation', 'expiresAt']) && value.ok === true && value.version === 1 && value.slug === stream.slug && value.stream === stream.stream && value.sequence === intent.sequence && value.operation === intent.operation && value.expiresAt === stream.expiresAt && isReactionV2Generation(value.processedThrough) && BigInt(value.processedThrough) >= BigInt(intent.sequence) && isReactionV2Generation(value.generation);
}
export function reactionReceiptEndpoint(endpoint: string, action: 'stream' | 'intent' | 'close'): string {
  const url = new URL(endpoint);
  if (url.search || url.hash || url.username || url.password || !url.pathname.endsWith('/react')) throw new TypeError('the reaction endpoint is invalid');
  dataBaseUrl(new URL('./', url).href);
  return new URL(`react/v1/${action}`, url).href;
}

async function privatePost<T>(url: string, payload: unknown, accept: (value: unknown) => value is T, fetchImpl: ReactionReceiptFetch): Promise<PrivateReactionAnswer<T>> {
  const body = JSON.stringify(payload);
  if (new TextEncoder().encode(body).byteLength > REACTION_RECEIPT_MAX_BYTES) return { ok: false, status: null };
  const controller = new AbortController(); const timer = setTimeout(() => controller.abort(), DATA_FETCH_TIMEOUT_MS);
  let reader: ReadableStreamDefaultReader<Uint8Array> | undefined;
  try {
    const response = await fetchImpl(url, { method: 'POST', body, headers: { 'Content-Type': 'application/json', Accept: 'application/json' }, credentials: 'omit', mode: 'cors', redirect: 'error', cache: 'no-store', signal: controller.signal });
    if (!response.ok) { void response.body?.cancel().catch(() => {}); return { ok: false, status: response.status }; }
    const length = response.headers.get('content-length');
    if (!response.body || (length !== null && (!/^[0-9]+$/.test(length) || Number(length) > REACTION_RECEIPT_MAX_BYTES))) { void response.body?.cancel().catch(() => {}); return { ok: false, status: null }; }
    reader = response.body.getReader(); const decoder = new TextDecoder('utf-8', { fatal: true, ignoreBOM: true });
    let text = ''; let size = 0; let chunks = 0;
    for (;;) {
      const part = await reader.read(); if (part.done) break;
      size += part.value.byteLength;
      if (size > REACTION_RECEIPT_MAX_BYTES || ++chunks > MAX_CHUNKS) { void reader.cancel().catch(() => {}); return { ok: false, status: null }; }
      text += decoder.decode(part.value, { stream: true });
    }
    text += decoder.decode();
    const value: unknown = JSON.parse(text);
    // Exact keys are checked below; also reject duplicate object keys without constraining key order.
    const canonical = JSON.stringify(value);
    const parsedKeys = [...text.matchAll(/"((?:[^"\\]|\\.)*)"\s*:/g)].map(match => JSON.parse(`"${match[1]}"`));
    if (new Set(parsedKeys).size !== parsedKeys.length || canonical.length > REACTION_RECEIPT_MAX_BYTES || !accept(value)) return { ok: false, status: null };
    return { ok: true, value };
  } catch { return { ok: false, status: null }; }
  finally { clearTimeout(timer); reader?.releaseLock(); }
}
export function issueReactionStream(endpoint: string, slug: string, now = Date.now(), fetchImpl: ReactionReceiptFetch = (url, init) => fetch(url, init)): Promise<PrivateReactionAnswer<ReactionStream>> {
  if (!validReactionSlug(slug)) return Promise.resolve({ ok: false, status: null });
  return privatePost(reactionReceiptEndpoint(endpoint, 'stream'), { version: 1, slug }, (value): value is ReactionStream => validateReactionStream(value, slug, now), fetchImpl);
}
export function sendReactionIntent(endpoint: string, stream: ReactionStream, intent: ReactionIntent, fetchImpl: ReactionReceiptFetch = (url, init) => fetch(url, init)): Promise<PrivateReactionAnswer<ReactionReceipt>> {
  if (!validateReactionIntent(intent)) return Promise.resolve({ ok: false, status: null });
  return privatePost(reactionReceiptEndpoint(endpoint, 'intent'), { version: 1, slug: stream.slug, capability: stream.capability, ...intent }, (value): value is ReactionReceipt => validateReactionReceipt(value, stream, intent), fetchImpl);
}

export const REACTION_CLOSE_GRACE_MS = 24 * 60 * 60 * 1000;
export interface ReactionClosure {
  readonly ok: true; readonly version: 1; readonly kind: 'closed'; readonly slug: string;
  readonly stream: string; readonly processedThrough: '9223372036854775807'; readonly generation: string;
  readonly expiresAt: string; readonly recoverUntil: string;
}
export function validateReactionClosure(value: unknown, stream: ReactionStream): value is ReactionClosure {
  return keys(value, ['ok', 'version', 'kind', 'slug', 'stream', 'processedThrough', 'generation', 'expiresAt', 'recoverUntil']) && value.ok === true && value.version === 1 && value.kind === 'closed' && value.slug === stream.slug && value.stream === stream.stream && value.processedThrough === '9223372036854775807' && isReactionV2Generation(value.generation) && value.expiresAt === stream.expiresAt && validReactionExpiry(value.recoverUntil) && Date.parse(value.recoverUntil) === Date.parse(stream.expiresAt) + REACTION_CLOSE_GRACE_MS;
}
export function closeReactionStream(endpoint: string, stream: ReactionStream, fetchImpl: ReactionReceiptFetch = (url, init) => fetch(url, init)): Promise<PrivateReactionAnswer<ReactionClosure>> {
  return privatePost(reactionReceiptEndpoint(endpoint, 'close'), { version: 1, slug: stream.slug, capability: stream.capability }, (value): value is ReactionClosure => validateReactionClosure(value, stream), fetchImpl);
}

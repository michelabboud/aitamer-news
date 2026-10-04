/** Deterministic publication admission. No network, clock reads, credentials or writes. */
import { createHash } from 'node:crypto';
import { SLUG, SLUG_MAX_LENGTH } from './slug.mjs';

export const PUBLICATION_VERSION = 1;
export const PUBLICATION_INTERVAL_MS = 30 * 60_000;
const HASH = /^[a-f0-9]{64}$/;
const COMMIT = /^[a-f0-9]{40}$/;
const RUN_ID = /^[1-9][0-9]*$/;

export const sha256 = (bytes) => createHash('sha256').update(bytes).digest('hex');
export const digest = (value) => sha256(JSON.stringify(value));
const requireThat = (condition, message) => { if (!condition) throw new Error(message); };
const object = (value) => value !== null && typeof value === 'object' && !Array.isArray(value);
const validSlug = (value) => typeof value === 'string' && value.length <= SLUG_MAX_LENGTH && SLUG.test(value);
export function isoTime(value) {
  requireThat(typeof value === 'string' && /^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d(?:\.\d{3})?Z$/.test(value), 'expected a full UTC timestamp');
  const time = Date.parse(value);
  const normalized = value.includes('.') ? value : `${value.slice(0, -1)}.000Z`;
  requireThat(Number.isFinite(time) && new Date(time).toISOString() === normalized, 'invalid UTC timestamp');
  return time;
}

export function slugs(values) {
  requireThat(Array.isArray(values) && values.every(validSlug), 'invalid visible slug list');
  requireThat(new Set(values).size === values.length, 'duplicate visible slug');
  return [...values].sort();
}

export function validateQueue(raw) {
  requireThat(object(raw) && raw.version === PUBLICATION_VERSION && object(raw.baseline), 'unsupported publication queue');
  const baseline = slugs(raw.baseline.slugs);
  requireThat(baseline.length > 0 && raw.baseline.sha256 === digest(baseline), 'baseline digest does not match its slugs');
  requireThat(Array.isArray(raw.entries), 'queue entries must be an array');
  const seen = new Set(baseline), times = new Set();
  const entries = raw.entries.map((entry) => {
    requireThat(object(entry) && validSlug(entry.slug) && !seen.has(entry.slug), 'invalid or duplicate queue slug');
    requireThat(HASH.test(entry.sha256) && HASH.test(entry.reviewSha256), `missing content/review digest: ${entry.slug}`);
    const time = isoTime(entry.pubDate);
    requireThat(time % PUBLICATION_INTERVAL_MS === 0 && !times.has(time), `invalid or duplicate half-hour slot: ${entry.slug}`);
    seen.add(entry.slug); times.add(time);
    return { slug: entry.slug, sha256: entry.sha256, pubDate: new Date(time).toISOString(), reviewSha256: entry.reviewSha256 };
  }).sort((a, b) => a.pubDate.localeCompare(b.pubDate) || a.slug.localeCompare(b.slug));
  return { version: PUBLICATION_VERSION, baseline: { slugs: baseline, sha256: digest(baseline) }, entries };
}

function publicationRun(raw) {
  requireThat(object(raw) && RUN_ID.test(raw.runId) && Number.isSafeInteger(raw.attempt) && raw.attempt > 0 && COMMIT.test(raw.sourceSha), 'invalid publication run identity');
  requireThat(raw.slug === null || validSlug(raw.slug), 'invalid published slug');
  return { runId: raw.runId, attempt: raw.attempt, sourceSha: raw.sourceSha, slug: raw.slug };
}

export function sealState(raw) {
  return { ...raw, digest: digest(raw) };
}

export function validateState(raw) {
  requireThat(object(raw) && raw.version === PUBLICATION_VERSION && COMMIT.test(raw.sourceSha) && HASH.test(raw.queueSha256), 'invalid publication state');
  const visible = slugs(raw.visible);
  const state = {
    version: PUBLICATION_VERSION, sourceSha: raw.sourceSha, queueSha256: raw.queueSha256,
    visible, lastPublication: publicationRun(raw.lastPublication),
  };
  requireThat(state.lastPublication.slug === null || visible.includes(state.lastPublication.slug), 'last publication is not visible');
  requireThat(raw.digest === digest(state), 'publication state digest mismatch');
  return sealState(state);
}

/** A completed successful workflow is later than its final live verification. */
export function acknowledgedAt(run, identity) {
  if (!object(run) || String(run.id) !== identity.runId || run.run_attempt !== identity.attempt ||
      run.head_sha !== identity.sourceSha || run.head_branch !== 'main' ||
      String(run.path).split('@')[0] !== '.github/workflows/deploy-pages.yml' ||
      run.status !== 'completed' || run.conclusion !== 'success') return null;
  return isoTime(run.updated_at);
}

/**
 * Every invocation either retains visibility or admits one item. `recovery` repairs an
 * unacknowledged deployment by verifying/redeploying the same set, never adding a post.
 */
export function selectPublication({ queue: rawQueue, live: rawLive, mode = 'retain', now, sourceSha, runId, attempt = 1, acknowledgment = null, bootstrapSlugs = null, bootstrapDigest = '' }) {
  const queue = validateQueue(rawQueue);
  requireThat(['retain', 'publish', 'bootstrap'].includes(mode), 'unknown publication mode');
  requireThat(Number.isFinite(now), 'invalid selection clock');
  const currentRun = publicationRun({ runId, attempt, sourceSha, slug: null });
  let visible, lastPublication, reason = 'retained', selected = null;
  if (mode === 'bootstrap') {
    requireThat(rawLive === null, 'bootstrap refuses an existing publication manifest');
    requireThat(bootstrapDigest === queue.baseline.sha256 && digest(slugs(bootstrapSlugs)) === bootstrapDigest, 'bootstrap does not match the observed live baseline');
    visible = queue.baseline.slugs;
    lastPublication = currentRun;
    reason = 'bootstrap';
  } else {
    requireThat(rawLive !== null, 'publication state missing; explicit verified bootstrap required');
    const live = validateState(rawLive);
    visible = live.visible;
    const allowed = new Set([...queue.baseline.slugs, ...queue.entries.map((entry) => entry.slug)]);
    requireThat(visible.every((slug) => allowed.has(slug)) && queue.baseline.slugs.every((slug) => visible.includes(slug)), 'queue would remove or admit an unapproved live article');
    lastPublication = live.lastPublication;
    if (acknowledgment === null) {
      lastPublication = { ...currentRun, slug: live.lastPublication.slug };
      reason = 'recovery';
    } else {
      requireThat(Number.isFinite(acknowledgment) && acknowledgment <= now, 'invalid publication acknowledgment time');
      if (mode === 'publish') {
        if (now - acknowledgment < PUBLICATION_INTERVAL_MS) reason = 'spacing';
        else {
          selected = queue.entries.find((entry) => !visible.includes(entry.slug) && isoTime(entry.pubDate) <= now)?.slug ?? null;
          if (selected !== null) {
            visible = [...visible, selected].sort();
            lastPublication = { ...currentRun, slug: selected };
            reason = 'publish';
          } else reason = 'nothing_due';
        }
      }
    }
  }
  return { reason, selected, state: sealState({ version: PUBLICATION_VERSION, sourceSha, queueSha256: digest(queue), visible, lastPublication }) };
}

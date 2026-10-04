/** Deterministic publication admission. No network, clock reads, credentials or writes. */
import { createHash } from 'node:crypto';
import { SLUG, SLUG_MAX_LENGTH } from './slug.mjs';

export const PUBLICATION_VERSION = 1;
export const PUBLICATION_INTERVAL_MS = 30 * 60_000;
const HASH = /^[a-f0-9]{64}$/;
const COMMIT = /^[a-f0-9]{40}$/;
const RUN_ID = /^[1-9][0-9]*$/;
const REQUEST_ID = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

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
    visible, lastPublication: publicationRun(raw.lastPublication), lastDeployment: publicationRun(raw.lastDeployment),
  };
  requireThat(state.lastPublication.slug === null || visible.includes(state.lastPublication.slug), 'last publication is not visible');
  requireThat(state.lastDeployment.slug === null || visible.includes(state.lastDeployment.slug), 'last deployment slug is not visible');
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

export function validateRequestId(value) {
  requireThat(value === '' || REQUEST_ID.test(value), 'invalid publication request ID');
  return value || null;
}

/** The private pre-build selection must describe the only change in the visible set. */
export function validateSelection(selection) {
  requireThat(object(selection), 'publication selection receipt is invalid');
  const state = validateState(selection.state);
  const requestId = validateRequestId(selection.requestId ?? '');
  requireThat(selection.requestId === requestId, 'publication request identity is invalid');
  if (selection.priorState === null) {
    requireThat(selection.reason === 'bootstrap' && selection.selected === null && state.lastPublication.slug === null &&
      state.lastDeployment.runId === state.lastPublication.runId, 'invalid bootstrap receipt');
  } else {
    const prior = validateState(selection.priorState);
    const additions = state.visible.filter((slug) => !prior.visible.includes(slug));
    requireThat(prior.visible.every((slug) => state.visible.includes(slug)) && additions.length <= 1 &&
      (additions[0] ?? null) === selection.selected, 'publication receipt visible-set difference is invalid');
    if (selection.selected !== null) requireThat(selection.reason === 'publish' && state.lastPublication.slug === selection.selected &&
      state.lastPublication.runId === state.lastDeployment.runId && state.lastPublication.attempt === state.lastDeployment.attempt &&
      state.lastPublication.sourceSha === state.lastDeployment.sourceSha,
      'publication receipt selected article is invalid');
    else requireThat(['retained', 'recovery', 'spacing', 'nothing_due'].includes(selection.reason), 'publication receipt reason is invalid');
    if (selection.reason === 'retained') requireThat(digest(prior.lastPublication) === digest(state.lastPublication), 'retained publication clock changed');
    if (selection.reason === 'recovery') requireThat(state.lastPublication.slug === prior.lastPublication.slug &&
      state.lastPublication.runId === state.lastDeployment.runId && state.lastPublication.attempt === state.lastDeployment.attempt &&
      state.lastPublication.sourceSha === state.lastDeployment.sourceSha,
    'recovery publication identity is invalid');
  }
  return { state, requestId };
}

/** A recovery must re-prove the last admitted article even though it adds no new slug. */
export function expectedArticleBodySlug(selection) {
  const { state } = validateSelection(selection);
  return selection.selected ?? (selection.reason === 'recovery' ? state.lastPublication.slug : null);
}

/** Validate the archived, successful workflow's proof against the currently served state. */
export function validateReceiptBundle(bundle, rawLive) {
  requireThat(object(bundle), 'publication receipt bundle is missing');
  const { selection, artifactVerification, productionVerification, outcome } = bundle;
  requireThat(object(selection) && object(artifactVerification) && object(productionVerification) && object(outcome), 'publication receipt files are missing');
  const live = validateState(rawLive);
  const { state: selected, requestId } = validateSelection(selection);
  const built = validateState(artifactVerification.state);
  const verified = validateState(productionVerification.state);
  requireThat(selected.digest === live.digest && built.digest === live.digest && verified.digest === live.digest, 'publication receipt state differs from production');
  requireThat(artifactVerification.visibleCount === live.visible.length && artifactVerification.digest === live.digest, 'publication artifact proof differs from selection');
  requireThat(productionVerification.origin === 'https://aitamer.news' && isoTime(productionVerification.verifiedAt) >= 0, 'publication production verification is invalid');
  requireThat(typeof outcome.productionDeployment === 'string' && outcome.productionDeployment.trim().length > 0 &&
    outcome.productionDeployment === productionVerification.deploymentId, 'publication deployment identity is missing or mismatched');
  requireThat(outcome.outcome === 'success' && outcome.runId === live.lastDeployment.runId &&
    outcome.attempt === live.lastDeployment.attempt && outcome.sourceSha === live.lastDeployment.sourceSha &&
    live.sourceSha === outcome.sourceSha,
  'publication receipt workflow identity is mismatched');
  requireThat((outcome.requestId ?? null) === requestId, 'publication request identity is mismatched');
  requireThat(!['spacing', 'nothing_due'].includes(selection.reason), 'undelivered publication has no production receipt');
  const bodySlug = expectedArticleBodySlug(selection);
  if (bodySlug === null) requireThat(productionVerification.articleBody === null, 'unexpected publication body proof');
  else {
    const body = productionVerification.articleBody;
    requireThat(object(body) && body.slug === bodySlug && HASH.test(body.builtSha256) &&
      body.builtSha256 === body.servedSha256, 'publication article body was not verified');
  }
  return { state: live, deploymentId: outcome.productionDeployment, runId: outcome.runId,
    attempt: outcome.attempt, sourceSha: outcome.sourceSha, requestId };
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
  return { reason, selected, state: sealState({ version: PUBLICATION_VERSION, sourceSha, queueSha256: digest(queue), visible, lastPublication, lastDeployment: currentRun }) };
}

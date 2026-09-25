/**
 * The comment form's side of the contract with the comments Worker at `COMMENTS_ENDPOINT`
 * (phase 2 plan §5.2 and §6.3): the field names the Worker reads, the query flag it redirects
 * back with, the reader-facing messages, and whether the form can be rendered at all.
 *
 * Pure, with no `astro:content` import, so `src/lib/comment-form.test.ts` runs it under plain
 * `node:test`. `src/components/CommentForm.astro` is the only consumer.
 *
 * The Worker is the authority on every limit; the form mirrors the public ones so a reader
 * hears about a too-long comment from the browser, before a request is made.
 */
import { COMMENT_NAME_MAX, COMMENT_TEXT_MAX } from '../content/comment-schema.ts';

export { COMMENT_NAME_MAX, COMMENT_TEXT_MAX };

/**
 * The form's field names, exactly as the Worker reads them. `honeypot` must stay a name no
 * browser autofill recognises (the contact form's rule, `workers/contact/src/message.mjs`), or a
 * real reader's comment would be dropped as a bot's. `elapsed` is the whole milliseconds between
 * the form being rendered and the submit, measured by the page script as a `performance.now()`
 * difference (never a clock time, which a reader's fast or slow clock would skew); the script
 * adds the field itself, so a no-script submit does not carry it and the Worker knows which path
 * it came by. `turnstile` is the name Cloudflare's widget gives its own hidden input.
 */
export const COMMENT_FORM_FIELDS = Object.freeze({
  slug: 'slug',
  name: 'name',
  text: 'text',
  honeypot: 'desk_extra',
  elapsed: 'elapsed',
  turnstile: 'cf-turnstile-response',
});

/**
 * The Turnstile widget's `data-action`. The Worker requires this action (and the aitamer.news
 * hostname) on every token, so a token solved on the contact form cannot be spent on a comment.
 */
export const COMMENT_TURNSTILE_ACTION = 'comment';

/**
 * A plain (no-script) submit comes back as `/posts/<slug>/?commented=1#comment-held` (a 303 from
 * the Worker). The page is static, so nothing can read the query without script: the held note is
 * an element with the id `COMMENT_HELD_ANCHOR` that is always in the page and shown by CSS only
 * while it is the `:target`. With script, the page also drops the query and the fragment from the
 * address, so a reload does not show the note again.
 */
export const COMMENTED_QUERY = 'commented';
export const COMMENTED_VALUE = '1';
/** The id of the comments section on a post page. */
export const COMMENTS_ANCHOR = 'comments';
/** The id of the held note, and the fragment the Worker's no-script redirect lands on. */
export const COMMENT_HELD_ANCHOR = 'comment-held';

/** Shown after a comment is accepted, by the script and after the no-script redirect. */
export const COMMENT_HELD_MESSAGE = 'Held for the desk. It appears after a look.';
/** Shown when the Worker cannot be reached or answers without a readable reason. */
export const COMMENT_FAILED_MESSAGE = 'The desk could not take that comment. Try again in a moment.';
/** Shown when Turnstile cannot run (blocked, offline, or its own error), so the submit stays off. */
export const COMMENT_CHECK_FAILED_MESSAGE = 'The check that keeps bots out could not run. Reload the page to try again.';
/**
 * The longest reason from the Worker the form will show. The Worker's reasons are one short
 * sentence; anything longer is not one of them and the generic failure is shown instead.
 */
export const COMMENT_ERROR_MAX = 300;

/**
 * The global functions Turnstile calls, named in the widget's `data-callback`,
 * `data-expired-callback` and `data-error-callback`. The submit button is off until `ready` has
 * fired, and again after every token is used, expires or fails.
 */
export const COMMENT_TURNSTILE_CALLBACKS = Object.freeze({
  ready: 'aitamerCommentTurnstileReady',
  expired: 'aitamerCommentTurnstileExpired',
  error: 'aitamerCommentTurnstileError',
});

/**
 * The words to show for a Worker answer that is not a success: its `error` when that is a
 * non-empty string of reasonable length, otherwise the generic failure. The answer is untrusted
 * JSON; an object, a number or an overlong string never reaches the page. The page script
 * (`CommentForm.astro`, inline) applies the same rule; this is its tested statement.
 */
export function commentErrorText(payload: unknown): string {
  const reason = payload !== null && typeof payload === 'object' ? (payload as { error?: unknown }).error : undefined;
  if (typeof reason !== 'string') return COMMENT_FAILED_MESSAGE;
  const text = reason.trim();
  return text && text.length <= COMMENT_ERROR_MAX ? text : COMMENT_FAILED_MESSAGE;
}

/** Why the form cannot render: the endpoint is not a usable URL, or Turnstile has no site key. */
export type CommentFormMissing = 'endpoint' | 'turnstile';

export type CommentFormSetup =
  | { ready: true; endpoint: string; turnstileSiteKey: string }
  | { ready: false; missing: CommentFormMissing };

/** The only hosts a plain `http:` endpoint may point at: a Worker running locally (`wrangler dev`). */
export const LOCAL_HTTP_HOSTS: ReadonlySet<string> = new Set(['localhost', '127.0.0.1']);

/**
 * Whether the form can be rendered, and with what. Turnstile is mandatory for comments (plan
 * D8): without a site key the Worker would refuse every comment, so the page says commenting is
 * not set up yet instead of showing a form that cannot succeed. Likewise an endpoint that is not
 * an absolute `https:` URL — an empty override, a typo, a plain `http:` host that would send a
 * reader's comment in the clear — is reported, never posted to. `http:` is accepted only for
 * `LOCAL_HTTP_HOSTS`.
 */
export function commentFormSetup(options: { endpoint: string; turnstileSiteKey: string }): CommentFormSetup {
  const endpoint = options.endpoint.trim();
  if (!isUsableEndpoint(endpoint)) return { ready: false, missing: 'endpoint' };
  const turnstileSiteKey = options.turnstileSiteKey.trim();
  if (!turnstileSiteKey) return { ready: false, missing: 'turnstile' };
  return { ready: true, endpoint, turnstileSiteKey };
}

function isUsableEndpoint(value: string): boolean {
  if (!value) return false;
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    return false;
  }
  if (url.protocol === 'https:') return true;
  return url.protocol === 'http:' && LOCAL_HTTP_HOSTS.has(url.hostname);
}

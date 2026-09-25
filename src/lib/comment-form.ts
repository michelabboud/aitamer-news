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

/** A plain (no-script) submit comes back as `/posts/<slug>/?commented=1#comments`. */
export const COMMENTED_QUERY = 'commented';
export const COMMENTED_VALUE = '1';
/** The id of the comments section on a post page, and the fragment the Worker redirects to. */
export const COMMENTS_ANCHOR = 'comments';

/** Shown after a comment is accepted, by the script and after the no-script redirect. */
export const COMMENT_HELD_MESSAGE = 'Held for the desk. It appears after a look.';
/** Shown when the Worker cannot be reached or answers without a reason. */
export const COMMENT_FAILED_MESSAGE = 'The desk could not take that comment. Try again in a moment.';

/** Why the form cannot render: the endpoint is not a usable URL, or Turnstile has no site key. */
export type CommentFormMissing = 'endpoint' | 'turnstile';

export type CommentFormSetup =
  | { ready: true; endpoint: string; turnstileSiteKey: string }
  | { ready: false; missing: CommentFormMissing };

/**
 * Whether the form can be rendered, and with what. Turnstile is mandatory for comments (plan
 * D8): without a site key the Worker would refuse every comment, so the page says commenting is
 * not set up yet instead of showing a form that cannot succeed. Likewise an endpoint that is not
 * an absolute `http(s)` URL — an empty override, a typo — is reported, never posted to.
 */
export function commentFormSetup(options: { endpoint: string; turnstileSiteKey: string }): CommentFormSetup {
  const endpoint = options.endpoint.trim();
  if (!isHttpUrl(endpoint)) return { ready: false, missing: 'endpoint' };
  const turnstileSiteKey = options.turnstileSiteKey.trim();
  if (!turnstileSiteKey) return { ready: false, missing: 'turnstile' };
  return { ready: true, endpoint, turnstileSiteKey };
}

function isHttpUrl(value: string): boolean {
  if (!value) return false;
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    return false;
  }
  return url.protocol === 'http:' || url.protocol === 'https:';
}

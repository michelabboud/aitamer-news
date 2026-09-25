/**
 * Cloudflare Turnstile server-side check. The widget alone protects nothing; this call is the check.
 * https://developers.cloudflare.com/turnstile/get-started/server-side-validation/
 */

/** Form field the Turnstile widget fills in. */
export const TURNSTILE_FIELD = 'cf-turnstile-response';

const SITEVERIFY_URL = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';

/** Tokens are at most 2048 characters (Cloudflare docs); anything longer is not a token. */
const MAX_TOKEN_LENGTH = 2048;

/** Give up on siteverify after this long rather than hang the visitor's request. */
export const SITEVERIFY_TIMEOUT_MS = 5_000;

/**
 * The action the About page's widget declares (`data-action`, which the page takes from here).
 * The site key is shared with the comment form, whose widget says `comment`: requiring this action
 * keeps a token solved for one form from being spent on the other.
 */
export const TURNSTILE_ACTION = 'contact';

/**
 * The hostname siteverify must report: the page the widget was solved on. Anything else is the
 * widget embedded on another site (or a local page) with this site's key.
 */
export const TURNSTILE_HOSTNAME = 'aitamer.news';

/**
 * @param {string} token value of the cf-turnstile-response field
 * @param {string} secret the widget's secret key
 * @param {string | null} remoteIp visitor IP, passed along as Cloudflare recommends
 * @param {typeof fetch} fetchImpl
 * @returns {Promise<{ ok: true } | { ok: false, reason: string }>} never throws; failure to verify is a failure.
 * A token Cloudflare accepts still fails unless it was solved for {@link TURNSTILE_ACTION} on
 * {@link TURNSTILE_HOSTNAME} (reasons `wrong-action`, `wrong-hostname`).
 */
export async function verifyTurnstile(token, secret, remoteIp, fetchImpl) {
  if (!token) return { ok: false, reason: 'missing-token' };
  if (token.length > MAX_TOKEN_LENGTH) return { ok: false, reason: 'token-too-long' };

  const body = new FormData();
  body.set('secret', secret);
  body.set('response', token);
  if (remoteIp) body.set('remoteip', remoteIp);

  try {
    const response = await fetchImpl(SITEVERIFY_URL, {
      method: 'POST',
      body,
      signal: AbortSignal.timeout(SITEVERIFY_TIMEOUT_MS),
    });
    const result = await response.json();
    if (result && result.success === true) {
      if (result.action !== TURNSTILE_ACTION) return { ok: false, reason: 'wrong-action' };
      if (result.hostname !== TURNSTILE_HOSTNAME) return { ok: false, reason: 'wrong-hostname' };
      return { ok: true };
    }
    const codes = Array.isArray(result?.['error-codes']) ? result['error-codes'].join(',') : 'no-codes';
    return { ok: false, reason: codes };
  } catch (error) {
    return { ok: false, reason: error instanceof Error ? error.name : 'error' };
  }
}

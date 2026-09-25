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
 * @param {string} token value of the cf-turnstile-response field
 * @param {string} secret the widget's secret key
 * @param {string | null} remoteIp visitor IP, passed along as Cloudflare recommends
 * @param {typeof fetch} fetchImpl
 * @returns {Promise<{ ok: true } | { ok: false, reason: string }>} never throws; failure to verify is a failure
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
    if (result && result.success === true) return { ok: true };
    const codes = Array.isArray(result?.['error-codes']) ? result['error-codes'].join(',') : 'no-codes';
    return { ok: false, reason: codes };
  } catch (error) {
    return { ok: false, reason: error instanceof Error ? error.name : 'error' };
  }
}

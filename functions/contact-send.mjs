/**
 * Send one email through the Cloudflare Email Sending REST API.
 * Pages cannot hold a send_email binding, so the function calls the API with a token instead.
 * https://developers.cloudflare.com/email-service/api/send-emails/rest-api/
 */

/** The Cloudflare account that owns aitamer.news (also in .github/workflows/deploy-pages.yml). Not a secret. */
export const DEFAULT_ACCOUNT_ID = '48a3301b0d9817c1b50c2b81c36d799f';

/** Give up on the API after this long, so a visitor is never left waiting on a hung request. */
export const SEND_TIMEOUT_MS = 10_000;

const API_BASE = 'https://api.cloudflare.com/client/v4';

/**
 * @param {{ CONTACT_TO?: string, CF_EMAIL_API_TOKEN?: string, CF_ACCOUNT_ID?: string }} env
 * @returns {{ to: string, token: string, accountId: string } | null} null until every required setting exists
 */
export function emailConfigFrom(env) {
  const to = String(env.CONTACT_TO ?? '').trim();
  const token = String(env.CF_EMAIL_API_TOKEN ?? '').trim();
  const accountId = String(env.CF_ACCOUNT_ID ?? '').trim() || DEFAULT_ACCOUNT_ID;
  if (!to || !token) return null;
  return { to, token, accountId };
}

/**
 * @param {object} letter REST API body (see contactLetter)
 * @param {{ token: string, accountId: string }} config
 * @param {typeof fetch} fetchImpl
 * @returns {Promise<void>} resolves once Cloudflare delivered or queued the note; throws otherwise
 */
export async function sendEmail(letter, config, fetchImpl) {
  const response = await fetchImpl(`${API_BASE}/accounts/${config.accountId}/email/sending/send`, {
    method: 'POST',
    headers: {
      authorization: `Bearer ${config.token}`,
      'content-type': 'application/json',
    },
    body: JSON.stringify(letter),
    signal: AbortSignal.timeout(SEND_TIMEOUT_MS),
  });

  /** @type {any} */
  let body = null;
  try {
    body = await response.json();
  } catch {
    // Non-JSON error page; handled below by the status check.
  }

  if (!response.ok || !body || body.success !== true) {
    // Cloudflare error codes and messages are safe to log; the token and the note are not logged.
    const codes = Array.isArray(body?.errors)
      ? body.errors.map((e) => `${e.code} ${e.message}`).join('; ')
      : 'no error body';
    throw new Error(`Cloudflare email API ${response.status}: ${codes}`);
  }

  const bounced = body.result?.permanent_bounces ?? [];
  if (Array.isArray(bounced) && bounced.length > 0) {
    throw new Error('Cloudflare email API: the desk address bounced');
  }
}

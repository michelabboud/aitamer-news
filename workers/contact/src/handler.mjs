import { contactLetter, parseContactFields } from './message.mjs';
import { verifyTurnstile, TURNSTILE_FIELD } from './turnstile.mjs';

/** Pages allowed to post the form: the site, its www host, and the GitHub Pages copy. */
const PRODUCTION_ORIGINS = new Set([
  'https://aitamer.news',
  'https://www.aitamer.news',
  'https://michelabboud.github.io',
]);

const CANONICAL_ABOUT = 'https://aitamer.news/about/?sent=1';

/**
 * Largest request body accepted, checked before anything is read.
 * The fields allow ~4.4 KB of text; multipart framing and a Turnstile token fit well inside this.
 */
export const MAX_BODY_BYTES = 32 * 1024;

/**
 * @typedef {{ limit: (options: { key: string }) => Promise<{ success: boolean }> }} RateLimiter
 * @typedef {{
 *   EMAIL?: { send: (message: object) => Promise<unknown> },
 *   CONTACT_TO?: string,
 *   TURNSTILE_SECRET_KEY?: string,
 *   CONTACT_RATE_LIMIT?: RateLimiter,
 *   CONTACT_GLOBAL_LIMIT?: RateLimiter,
 *   ALLOW_LOCAL_ORIGINS?: string,
 * }} ContactEnv
 */

/**
 * Worker entry for the About contact form (https://contact.aitamer.news/).
 * A browser fetch sends Accept: application/json. A plain form submit does not, and gets a redirect.
 *
 * Order matters: cheap checks first, so abuse costs as little as possible —
 * method → origin → body size → per-visitor and site-wide rate limits → parse and validate
 * → Turnstile (when enabled) → send.
 *
 * @param {Request} request
 * @param {ContactEnv} env
 * @param {typeof fetch} [fetchImpl] injected by tests; production uses the global fetch
 */
export async function handleContactRequest(request, env, fetchImpl = (input, init) => fetch(input, init)) {
  const origin = request.headers.get('Origin');

  if (request.method === 'OPTIONS') {
    if (!originAllowed(request, env)) return json({ ok: false, error: 'That page cannot send this form.' }, 403, origin, env);
    return new Response(null, { status: 204, headers: corsHeaders(origin, env) });
  }

  if (request.method !== 'POST') {
    return json({ ok: false, error: 'Send the form with POST.' }, 405, origin, env);
  }

  if (!originAllowed(request, env)) {
    return json({ ok: false, error: 'That page cannot send this form.' }, 403, origin, env);
  }

  const length = Number(request.headers.get('Content-Length'));
  if (!Number.isFinite(length) || length <= 0) {
    return respond(request, env, { ok: false, error: 'The form arrived empty.' }, 411);
  }
  if (length > MAX_BODY_BYTES) {
    return respond(request, env, { ok: false, error: 'That note is too long.' }, 413);
  }

  if (!env.CONTACT_RATE_LIMIT || !env.CONTACT_GLOBAL_LIMIT) {
    // Fail closed: without rate limits the form is an open relay into the desk inbox.
    console.error('contact: rate limit bindings missing');
    return respond(request, env, { ok: false, error: 'Contact is not set up yet.' }, 503);
  }
  const visitor = rateLimitKey(request.headers.get('CF-Connecting-IP'));
  const [perVisitor, siteWide] = await Promise.all([
    env.CONTACT_RATE_LIMIT.limit({ key: visitor }),
    env.CONTACT_GLOBAL_LIMIT.limit({ key: 'all' }),
  ]);
  if (!perVisitor.success || !siteWide.success) {
    console.log('contact: rate limited', perVisitor.success ? 'site-wide' : 'per-visitor');
    return respond(request, env, { ok: false, error: 'Too many notes at once. Try again in a minute.' }, 429);
  }

  let fields;
  try {
    fields = await request.formData();
  } catch {
    return respond(request, env, { ok: false, error: 'The form could not be read.' }, 400);
  }

  const parsed = parseContactFields(fields);
  if (!parsed.ok) return respond(request, env, parsed, 400);
  if ('ignore' in parsed) {
    // Counted so a honeypot that starts catching real visitors shows up in the logs.
    console.log('contact: honeypot tripped');
    return respond(request, env, { ok: true }, 200);
  }

  const turnstileSecret = String(env.TURNSTILE_SECRET_KEY ?? '').trim();
  if (turnstileSecret) {
    const verdict = await verifyTurnstile(
      String(fields.get(TURNSTILE_FIELD) ?? ''),
      turnstileSecret,
      request.headers.get('CF-Connecting-IP'),
      fetchImpl,
    );
    if (!verdict.ok) {
      console.log('contact: turnstile rejected', verdict.reason);
      return respond(request, env, { ok: false, error: 'The spam check did not pass. Reload the page and try again.' }, 400);
    }
  }

  const to = String(env.CONTACT_TO ?? '').trim();
  if (!to || !env.EMAIL || typeof env.EMAIL.send !== 'function') {
    return respond(request, env, { ok: false, error: 'Contact is not set up yet.' }, 503);
  }

  try {
    await env.EMAIL.send(contactLetter(parsed.value, to));
  } catch (error) {
    // The binding's error code (e.g. E_SENDER_NOT_VERIFIED) is safe to log; the note is not.
    const code = error && typeof error === 'object' && 'code' in error ? String(error.code) : 'unknown';
    console.error('contact: send failed', code);
    return respond(request, env, { ok: false, error: 'The desk could not send that note. Try again in a moment.' }, 502);
  }

  return respond(request, env, { ok: true }, 200);
}

/**
 * Rate-limit key for a visitor. IPv4 is keyed by address. IPv6 is keyed by its /64 prefix, because
 * one subscriber usually holds a whole /64 and could otherwise rotate addresses to dodge the limit.
 * @param {string | null} ip the CF-Connecting-IP header (set by Cloudflare's edge in production)
 * @returns {string}
 */
export function rateLimitKey(ip) {
  const value = String(ip ?? '').trim().toLowerCase();
  if (!value) return 'ip:unknown';
  if (!value.includes(':')) return `ip:${value}`;
  const [head, tail = ''] = value.split('::');
  const left = head ? head.split(':') : [];
  const right = value.includes('::') && tail ? tail.split(':') : [];
  const groups = value.includes('::')
    ? [...left, ...Array(Math.max(0, 8 - left.length - right.length)).fill('0'), ...right]
    : left;
  const prefix = groups.slice(0, 4).map((group) => group.replace(/^0+(?=.)/, '') || '0');
  return `ip6:${prefix.join(':')}::/64`;
}

/**
 * @param {Request} request
 * @param {ContactEnv} env
 * @param {{ ok: boolean, error?: string }} payload
 * @param {number} status
 */
function respond(request, env, payload, status) {
  const origin = request.headers.get('Origin');
  if (request.headers.get('Accept')?.includes('application/json')) {
    return json(payload, status, origin, env);
  }
  if (payload.ok) {
    return new Response(null, {
      status: 303,
      headers: { ...corsHeaders(origin, env), Location: aboutUrl(origin, env) },
    });
  }
  return new Response(plainPage(payload.error ?? 'The desk could not take that note.'), {
    status,
    headers: { ...corsHeaders(origin, env), 'content-type': 'text/html; charset=utf-8' },
  });
}

/**
 * Local development only: when ALLOW_LOCAL_ORIGINS is "true" (set in workers/contact/.dev.vars, which
 * is never deployed), pages served from localhost may post, and a plain submit returns to them.
 * `wrangler dev` presents requests under the production hostname, so the request URL cannot tell.
 * @param {ContactEnv} env
 */
function localAllowed(env) {
  return String(env.ALLOW_LOCAL_ORIGINS ?? '') === 'true';
}

/** @param {string} origin */
function isLocalOrigin(origin) {
  return origin.startsWith('http://localhost:') || origin.startsWith('http://127.0.0.1:');
}

/** @param {string | null} origin @param {ContactEnv} env */
function trustedOrigin(origin, env) {
  if (!origin) return false;
  return PRODUCTION_ORIGINS.has(origin) || (localAllowed(env) && isLocalOrigin(origin));
}

/** @param {string | null} origin @param {ContactEnv} env */
function aboutUrl(origin, env) {
  if (origin && localAllowed(env) && isLocalOrigin(origin)) return new URL('/about/?sent=1', origin).toString();
  return CANONICAL_ABOUT;
}

/**
 * Browsers always send Origin on a cross-site POST, so this stops other websites.
 * It does not stop scripts, which is what the rate limits and Turnstile are for.
 * @param {Request} request
 * @param {ContactEnv} env
 */
function originAllowed(request, env) {
  const origin = request.headers.get('Origin');
  return !origin || trustedOrigin(origin, env);
}

/** @param {string | null} origin @param {ContactEnv} env */
function corsHeaders(origin, env) {
  if (!trustedOrigin(origin, env)) return { vary: 'Origin' };
  return {
    'access-control-allow-origin': /** @type {string} */ (origin),
    'access-control-allow-methods': 'POST, OPTIONS',
    vary: 'Origin',
  };
}

/**
 * @param {{ ok: boolean, error?: string }} payload
 * @param {number} status
 * @param {string | null} origin
 * @param {ContactEnv} env
 */
function json(payload, status, origin, env) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { ...corsHeaders(origin, env), 'content-type': 'application/json; charset=utf-8' },
  });
}

/** @param {string} message */
function plainPage(message) {
  const safe = message
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Contact · AI Tamer</title>
  <style>
    body { margin: 0; background: #fff8f0; color: #241c30; font: 1.125rem/1.5 "Instrument Sans", sans-serif; }
    main { width: min(100% - 2rem, 38rem); margin: 3rem auto; }
    a { color: #5c4a8a; }
  </style>
</head>
<body>
  <main>
    <h1>The note did not go through</h1>
    <p>${safe}</p>
    <p><a href="https://aitamer.news/about/#contact">Back to the form</a></p>
  </main>
</body>
</html>`;
}

import { contactLetter, parseContactFields } from './contact-message.mjs';

const PRODUCTION_ORIGINS = new Set([
  'https://aitamer.news',
  'https://www.aitamer.news',
  'https://michelabboud.github.io',
]);

const CANONICAL_ABOUT = 'https://aitamer.news/about/?sent=1';

/**
 * Pages Function entry for the About contact form.
 * A browser fetch sends Accept: application/json. A plain form submit does not, and gets a redirect.
 *
 * @param {Request} request
 * @param {{ CONTACT_TO?: string, EMAIL?: { send: (message: object) => Promise<unknown> } }} env
 */
export async function handleContactRequest(request, env) {
  const origin = request.headers.get('Origin');

  if (request.method === 'OPTIONS') {
    if (!originAllowed(request)) return json({ ok: false, error: 'That page cannot send this form.' }, 403, origin);
    return new Response(null, { status: 204, headers: corsHeaders(origin) });
  }

  if (request.method !== 'POST') {
    return json({ ok: false, error: 'Send the form with POST.' }, 405, origin);
  }

  if (!originAllowed(request)) {
    return json({ ok: false, error: 'That page cannot send this form.' }, 403, origin);
  }

  let fields;
  try {
    fields = await request.formData();
  } catch {
    return respond(request, { ok: false, error: 'The form could not be read.' }, 400);
  }

  const parsed = parseContactFields(fields);
  if (!parsed.ok) return respond(request, parsed, 400);
  if ('ignore' in parsed) {
    // Counted so a honeypot that starts catching real visitors shows up in the logs.
    console.log('contact honeypot tripped');
    return respond(request, { ok: true }, 200);
  }

  const to = String(env.CONTACT_TO ?? '').trim();
  if (!to || !env.EMAIL || typeof env.EMAIL.send !== 'function') {
    return respond(request, { ok: false, error: 'Contact is not set up yet.' }, 503);
  }

  try {
    await env.EMAIL.send(contactLetter(parsed.value, to));
  } catch (error) {
    console.error('contact send failed', error instanceof Error ? error.name : 'error');
    return respond(request, { ok: false, error: 'The desk could not send that note. Try again in a moment.' }, 502);
  }

  return respond(request, { ok: true }, 200);
}

/**
 * @param {Request} request
 * @param {{ ok: boolean, error?: string }} payload
 * @param {number} status
 */
function respond(request, payload, status) {
  const origin = request.headers.get('Origin');
  if (request.headers.get('Accept')?.includes('application/json')) {
    return json(payload, status, origin);
  }
  if (payload.ok) {
    return new Response(null, {
      status: 303,
      headers: { ...corsHeaders(origin), Location: aboutUrl(request) },
    });
  }
  return new Response(plainPage(payload.error ?? 'The desk could not take that note.'), {
    status,
    headers: { ...corsHeaders(origin), 'content-type': 'text/html; charset=utf-8' },
  });
}

/** @param {Request} request */
function aboutUrl(request) {
  const url = new URL(request.url);
  if (url.hostname === 'localhost' || url.hostname === '127.0.0.1') {
    return new URL('/about/?sent=1', url.origin).toString();
  }
  return CANONICAL_ABOUT;
}

/** @param {Request} request */
function originAllowed(request) {
  const origin = request.headers.get('Origin');
  if (!origin) return true;
  if (PRODUCTION_ORIGINS.has(origin)) return true;

  const host = new URL(request.url).hostname;
  const localRequest = host === 'localhost' || host === '127.0.0.1';
  const localOrigin = origin.startsWith('http://localhost:') || origin.startsWith('http://127.0.0.1:');
  return localRequest && localOrigin;
}

/** @param {string | null} origin */
function corsHeaders(origin) {
  if (!origin || (!PRODUCTION_ORIGINS.has(origin) && !origin.startsWith('http://localhost:') && !origin.startsWith('http://127.0.0.1:'))) {
    return { vary: 'Origin' };
  }
  return {
    'access-control-allow-origin': origin,
    'access-control-allow-methods': 'POST, OPTIONS',
    vary: 'Origin',
  };
}

/**
 * @param {{ ok: boolean, error?: string }} payload
 * @param {number} status
 * @param {string | null} origin
 */
function json(payload, status, origin) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { ...corsHeaders(origin), 'content-type': 'application/json; charset=utf-8' },
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

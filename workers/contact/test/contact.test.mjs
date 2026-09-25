import assert from 'node:assert/strict';
import test from 'node:test';
import worker from '../src/index.mjs';
import * as entry from '../src/index.mjs';
import { MAX_BODY_BYTES, handleContactRequest } from '../src/handler.mjs';
import { DESK_FROM, HONEYPOT_FIELD, contactLetter, parseContactFields } from '../src/message.mjs';
import { TURNSTILE_FIELD, verifyTurnstile } from '../src/turnstile.mjs';

const valid = {
  name: 'Ada Desk',
  email: 'ada@example.com',
  message: 'The date on the Grok brief is off by one day.',
};

const URL_PROD = 'https://contact.aitamer.news/';

/** Build a POST the way a browser would, with a Content-Length the handler can check. */
async function formRequest(fields, { origin = 'https://aitamer.news', url = URL_PROD, accept, ip = '203.0.113.7', contentLength } = {}) {
  const form = new FormData();
  for (const [key, value] of Object.entries(fields)) form.set(key, value);
  const draft = new Request(url, { method: 'POST', body: form });
  const bytes = await draft.arrayBuffer();
  const headers = new Headers(draft.headers);
  headers.set('Content-Length', String(contentLength ?? bytes.byteLength));
  if (origin) headers.set('Origin', origin);
  if (accept) headers.set('Accept', accept);
  if (ip) headers.set('CF-Connecting-IP', ip);
  return new Request(url, { method: 'POST', body: bytes, headers });
}

/** A rate limiter stand-in: allows `allow` calls per key, then refuses. */
function limiter(allow = Infinity) {
  const counts = new Map();
  return {
    keys: counts,
    async limit({ key }) {
      const n = (counts.get(key) ?? 0) + 1;
      counts.set(key, n);
      return { success: n <= allow };
    },
  };
}

function envWith({ send = async () => ({ messageId: 'm1' }), perVisitor = limiter(), siteWide = limiter(), ...rest } = {}) {
  const sent = [];
  return {
    sent,
    env: {
      CONTACT_TO: 'owner@example.com',
      EMAIL: { send: async (message) => { sent.push(message); return send(message); } },
      CONTACT_RATE_LIMIT: perVisitor,
      CONTACT_GLOBAL_LIMIT: siteWide,
      ...rest,
    },
  };
}

const json = { accept: 'application/json' };

test('a real note is accepted and a filled honeypot is ignored', () => {
  const fields = new FormData();
  fields.set('name', valid.name);
  fields.set('email', '  Ada@Example.com ');
  fields.set('message', valid.message);
  const parsed = parseContactFields(fields);
  assert.equal(parsed.ok, true);
  assert.equal(parsed.value.email, 'ada@example.com');

  fields.set(HONEYPOT_FIELD, 'Acme');
  assert.deepEqual(parseContactFields(fields), { ok: true, ignore: true });
});

test('control characters are stripped: names stay one line, notes keep only newlines and tabs', () => {
  const fields = new FormData();
  fields.set('name', 'Eve\u0000\r\nBcc: x y');
  fields.set('email', valid.email);
  fields.set('message', 'Line one\r\nLine\ttwo\u0007\u0000 end of note.');
  const parsed = parseContactFields(fields);
  assert.equal(parsed.ok, true);
  assert.equal(parsed.value.name, 'Eve Bcc: x y');
  assert.equal(parsed.value.message, 'Line one\nLine\ttwo end of note.');
});

test('addresses that could smuggle a display name or a list are rejected', () => {
  for (const email of ['not-an-email', 'a"<b>@c.de', 'a@b.co,c@d.co', 'a b@c.de', 'a@b', '<a@b.co>', 'a;b@c.de']) {
    const fields = new FormData();
    fields.set('name', valid.name);
    fields.set('email', email);
    fields.set('message', valid.message);
    const parsed = parseContactFields(fields);
    assert.equal(parsed.ok, false, email);
    assert.equal(parsed.error, 'That email address does not look right.');
  }
});

test('empty names, short notes and long notes are rejected with a clear message', () => {
  const cases = [
    [{ name: '  ', email: valid.email, message: valid.message }, 'Add your name.'],
    [{ name: 'x'.repeat(81), email: valid.email, message: valid.message }, 'That name is too long.'],
    [{ name: valid.name, email: valid.email, message: 'too short' }, 'Write a short note. Ten characters is enough.'],
    [{ name: valid.name, email: valid.email, message: 'x'.repeat(4001) }, 'That note is too long.'],
  ];
  for (const [input, error] of cases) {
    const fields = new FormData();
    for (const [key, value] of Object.entries(input)) fields.set(key, value);
    assert.deepEqual(parseContactFields(fields), { ok: false, error });
  }
});

test('the letter is from the desk, to the fixed inbox, and replies to the visitor', () => {
  const letter = contactLetter(valid, 'owner@example.com');
  assert.equal(letter.to, 'owner@example.com');
  assert.deepEqual(letter.from, { email: DESK_FROM, name: 'AI Tamer' });
  assert.deepEqual(letter.replyTo, { email: valid.email, name: valid.name });
  assert.equal(letter.text.includes(valid.message), true);
});

test('a fetch from the site sends exactly one note; a honeypot hit sends none', async () => {
  const { env, sent } = envWith();
  const ok = await handleContactRequest(await formRequest(valid, json), env);
  assert.equal(ok.status, 200);
  assert.deepEqual(await ok.json(), { ok: true });
  assert.equal(sent.length, 1);
  assert.equal(sent[0].to, 'owner@example.com');

  const bot = await handleContactRequest(await formRequest({ ...valid, [HONEYPOT_FIELD]: 'spam' }, json), env);
  assert.equal(bot.status, 200);
  assert.equal(sent.length, 1);
});

test('oversized or empty bodies are refused before the form is read', async () => {
  const { env, sent } = envWith();
  const big = await handleContactRequest(await formRequest(valid, { ...json, contentLength: MAX_BODY_BYTES + 1 }), env);
  assert.equal(big.status, 413);
  const empty = await handleContactRequest(await formRequest(valid, { ...json, contentLength: 0 }), env);
  assert.equal(empty.status, 411);
  assert.equal(sent.length, 0);
});

test('rate limits: a visitor gets 429 after their allowance, and so does everyone once the site cap is hit', async () => {
  const perVisitor = limiter(2);
  const { env, sent } = envWith({ perVisitor });
  const statuses = [];
  for (let i = 0; i < 3; i++) statuses.push((await handleContactRequest(await formRequest(valid, json), env)).status);
  assert.deepEqual(statuses, [200, 200, 429]);
  assert.equal(sent.length, 2);
  assert.equal(perVisitor.keys.has('ip:203.0.113.7'), true);

  const other = await handleContactRequest(await formRequest(valid, { ...json, ip: '198.51.100.9' }), env);
  assert.equal(other.status, 200, 'a different visitor is not blocked by the first one');

  const capped = envWith({ siteWide: limiter(0) });
  const response = await handleContactRequest(await formRequest(valid, json), capped.env);
  assert.equal(response.status, 429);
  assert.equal((await response.json()).error, 'Too many notes at once. Try again in a minute.');
  assert.equal(capped.sent.length, 0);
});

test('missing rate limit bindings fail closed', async () => {
  const { env, sent } = envWith();
  delete env.CONTACT_RATE_LIMIT;
  const response = await handleContactRequest(await formRequest(valid, json), env);
  assert.equal(response.status, 503);
  assert.equal(sent.length, 0);
});

test('a missing inbox or a failed send does not claim success, and never logs the note', async () => {
  const missing = envWith({ CONTACT_TO: '' });
  assert.equal((await handleContactRequest(await formRequest(valid, json), missing.env)).status, 503);

  const logged = [];
  const original = console.error;
  console.error = (...args) => logged.push(args.join(' '));
  try {
    const error = Object.assign(new Error(`cannot deliver ${valid.message}`), { code: 'E_SENDER_NOT_VERIFIED' });
    const failing = envWith({ send: async () => { throw error; } });
    const response = await handleContactRequest(await formRequest(valid, json), failing.env);
    assert.equal(response.status, 502);
    assert.equal((await response.json()).error, 'The desk could not send that note. Try again in a moment.');
  } finally {
    console.error = original;
  }
  assert.equal(logged.join('\n').includes('E_SENDER_NOT_VERIFIED'), true);
  assert.equal(logged.join('\n').includes(valid.message), false);
});

test('with Turnstile on, a note needs a token Cloudflare accepts', async () => {
  const calls = [];
  const siteverify = (success, codes = []) => async (url, init) => {
    calls.push({ url, secret: init.body.get('secret'), response: init.body.get('response'), ip: init.body.get('remoteip') });
    return new Response(JSON.stringify({ success, 'error-codes': codes }));
  };
  const { env, sent } = envWith({ TURNSTILE_SECRET_KEY: '1x0000000000000000000000000000000AA' });

  const noToken = await handleContactRequest(await formRequest(valid, json), env, siteverify(true));
  assert.equal(noToken.status, 400);
  assert.equal(calls.length, 0, 'no token means no network call');

  const rejected = await handleContactRequest(
    await formRequest({ ...valid, [TURNSTILE_FIELD]: 'bad-token' }, json), env, siteverify(false, ['invalid-input-response']),
  );
  assert.equal(rejected.status, 400);
  assert.equal(sent.length, 0);

  const passed = await handleContactRequest(
    await formRequest({ ...valid, [TURNSTILE_FIELD]: 'good-token' }, json), env, siteverify(true),
  );
  assert.equal(passed.status, 200);
  assert.equal(sent.length, 1);
  assert.deepEqual(calls.at(-1), {
    url: 'https://challenges.cloudflare.com/turnstile/v0/siteverify',
    secret: '1x0000000000000000000000000000000AA',
    response: 'good-token',
    ip: '203.0.113.7',
  });
});

test('Turnstile verification treats timeouts and odd answers as failures', async () => {
  assert.deepEqual(await verifyTurnstile('t', 's', null, async () => { throw new DOMException('timed out', 'TimeoutError'); }), { ok: false, reason: 'TimeoutError' });
  assert.deepEqual(await verifyTurnstile('t', 's', null, async () => new Response('<html>')), { ok: false, reason: 'SyntaxError' });
  assert.deepEqual(await verifyTurnstile('x'.repeat(2049), 's', null, async () => { throw new Error('should not call'); }), { ok: false, reason: 'token-too-long' });
});

test('another website cannot post, and a plain submit redirects back to the About page', async () => {
  const { env, sent } = envWith();
  const blocked = await handleContactRequest(await formRequest(valid, { ...json, origin: 'https://evil.example' }), env);
  assert.equal(blocked.status, 403);
  const localSpoof = await handleContactRequest(await formRequest(valid, { ...json, origin: 'http://localhost:4321' }), env);
  assert.equal(localSpoof.status, 403);
  assert.equal(sent.length, 0);

  const mirror = await handleContactRequest(await formRequest(valid, { ...json, origin: 'https://michelabboud.github.io' }), env);
  assert.equal(mirror.status, 200);
  assert.equal(mirror.headers.get('access-control-allow-origin'), 'https://michelabboud.github.io');

  const plain = await handleContactRequest(await formRequest(valid), env);
  assert.equal(plain.status, 303);
  assert.equal(plain.headers.get('Location'), 'https://aitamer.news/about/?sent=1');
});

test('local pages may post only when ALLOW_LOCAL_ORIGINS is "true" (dev only), and are sent back to themselves', async () => {
  const production = envWith();
  const refused = await handleContactRequest(await formRequest(valid, { origin: 'http://localhost:4321' }), production.env);
  assert.equal(refused.status, 403);
  assert.equal(refused.headers.get('access-control-allow-origin'), null);

  const dev = envWith({ ALLOW_LOCAL_ORIGINS: 'true' });
  const response = await handleContactRequest(await formRequest(valid, { origin: 'http://localhost:4321' }), dev.env);
  assert.equal(response.status, 303);
  assert.equal(response.headers.get('Location'), 'http://localhost:4321/about/?sent=1');
  assert.equal(dev.sent.length, 1);

  const lookalike = envWith({ ALLOW_LOCAL_ORIGINS: 'yes' });
  assert.equal((await handleContactRequest(await formRequest(valid, { origin: 'http://localhost:4321' }), lookalike.env)).status, 403);
});

test('the Worker answers only on / and 404s every other path', async () => {
  const { env } = envWith();
  const other = await worker.fetch(new Request('https://contact.aitamer.news/admin'), env);
  assert.equal(other.status, 404);
  const root = await worker.fetch(await formRequest(valid, json), env);
  assert.equal(root.status, 200);
});

test('the entry module exports only the default handler (workerd rejects any other export)', () => {
  assert.deepEqual(Object.keys(entry), ['default']);
});

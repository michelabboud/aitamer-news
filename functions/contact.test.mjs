import assert from 'node:assert/strict';
import test from 'node:test';
import { handleContactRequest } from './contact-handler.mjs';
import { DESK_FROM, HONEYPOT_FIELD, contactLetter, parseContactFields } from './contact-message.mjs';
import { DEFAULT_ACCOUNT_ID, emailConfigFrom, sendEmail } from './contact-send.mjs';

const valid = {
  name: 'Ada Desk',
  email: 'ada@example.com',
  message: 'The date on the Grok brief is off by one day.',
};

const TOKEN = 'test-token-not-real';

function formRequest(fields, { origin = 'https://aitamer.news', url = 'https://aitamer.news/api/contact', accept } = {}) {
  const body = new FormData();
  for (const [key, value] of Object.entries(fields)) body.set(key, value);
  const headers = new Headers();
  if (origin) headers.set('Origin', origin);
  if (accept) headers.set('Accept', accept);
  return new Request(url, { method: 'POST', body, headers });
}

const env = { CONTACT_TO: 'owner@example.com', CF_EMAIL_API_TOKEN: TOKEN };

/** A stand-in for Cloudflare's API that records each call and answers with `reply`. */
function fakeApi(reply = { status: 200, body: { success: true, errors: [], result: { delivered: ['owner@example.com'], permanent_bounces: [], queued: [] } } }) {
  const calls = [];
  const fetchImpl = async (url, init) => {
    calls.push({ url, init, body: JSON.parse(init.body) });
    if (reply instanceof Error) throw reply;
    return new Response(typeof reply.body === 'string' ? reply.body : JSON.stringify(reply.body), { status: reply.status });
  };
  return { calls, fetchImpl };
}

test('a real note is accepted and a filled honeypot is ignored', () => {
  const fields = new FormData();
  fields.set('name', valid.name);
  fields.set('email', '  Ada@Example.com ');
  fields.set('message', valid.message);
  const parsed = parseContactFields(fields);
  assert.equal(parsed.ok, true);
  assert.equal(parsed.value.email, 'ada@example.com');

  const bot = new FormData();
  bot.set('name', valid.name);
  bot.set('email', valid.email);
  bot.set('message', valid.message);
  bot.set(HONEYPOT_FIELD, 'Acme');
  assert.deepEqual(parseContactFields(bot), { ok: true, ignore: true });
});

test('names, addresses, and notes that cannot be mailed are rejected', () => {
  const cases = [
    [{ name: '  ', email: valid.email, message: valid.message }, 'Add your name.'],
    [{ name: 'A\r\nBcc: x', email: valid.email, message: valid.message }, null],
    [{ name: valid.name, email: 'not-an-email', message: valid.message }, 'That email address does not look right.'],
    [{ name: valid.name, email: valid.email, message: 'too short' }, 'Write a short note. Ten characters is enough.'],
    [{ name: valid.name, email: valid.email, message: 'x'.repeat(4001) }, 'That note is too long.'],
  ];
  for (const [input, error] of cases) {
    const fields = new FormData();
    for (const [key, value] of Object.entries(input)) fields.set(key, value);
    const parsed = parseContactFields(fields);
    if (error) {
      assert.equal(parsed.ok, false);
      assert.equal(parsed.error, error);
    } else {
      assert.equal(parsed.ok, true);
      assert.equal(parsed.value.name.includes('\n'), false);
      assert.equal(parsed.value.name.includes('\r'), false);
    }
  }
});

test('the letter uses the REST API field names: from the desk, reply to the visitor', () => {
  const letter = contactLetter(valid, 'owner@example.com');
  assert.equal(letter.to, 'owner@example.com');
  assert.deepEqual(letter.from, { address: DESK_FROM, name: 'AI Tamer' });
  assert.equal(letter.reply_to, valid.email);
  assert.equal('replyTo' in letter, false);
  assert.equal(letter.text.includes(valid.message), true);
});

test('the API is only called once every required setting exists', () => {
  assert.equal(emailConfigFrom({}), null);
  assert.equal(emailConfigFrom({ CONTACT_TO: 'owner@example.com' }), null);
  assert.equal(emailConfigFrom({ CF_EMAIL_API_TOKEN: TOKEN }), null);
  assert.deepEqual(emailConfigFrom(env), { to: 'owner@example.com', token: TOKEN, accountId: DEFAULT_ACCOUNT_ID });
  assert.equal(emailConfigFrom({ ...env, CF_ACCOUNT_ID: 'abc' }).accountId, 'abc');
});

test('a fetch from the site sends one note to the account endpoint with the token', async () => {
  const api = fakeApi();
  const ok = await handleContactRequest(formRequest(valid, { accept: 'application/json' }), env, api.fetchImpl);
  assert.equal(ok.status, 200);
  assert.deepEqual(await ok.json(), { ok: true });
  assert.equal(api.calls.length, 1);
  assert.equal(api.calls[0].url, `https://api.cloudflare.com/client/v4/accounts/${DEFAULT_ACCOUNT_ID}/email/sending/send`);
  assert.equal(api.calls[0].init.method, 'POST');
  assert.equal(api.calls[0].init.headers.authorization, `Bearer ${TOKEN}`);
  assert.equal(api.calls[0].body.reply_to, valid.email);

  const ignored = await handleContactRequest(
    formRequest({ ...valid, [HONEYPOT_FIELD]: 'spam' }, { accept: 'application/json' }),
    env,
    api.fetchImpl,
  );
  assert.equal(ignored.status, 200);
  assert.equal(api.calls.length, 1);
});

test('missing settings, API errors, bounces, and network failures never claim success', async () => {
  const unset = await handleContactRequest(formRequest(valid, { accept: 'application/json' }), { CONTACT_TO: 'owner@example.com' }, fakeApi().fetchImpl);
  assert.equal(unset.status, 503);
  assert.equal((await unset.json()).error, 'Contact is not set up yet.');

  const failures = [
    { status: 403, body: { success: false, errors: [{ code: 10102, message: 'email.sending.error.authentication.forbidden' }], result: null } },
    { status: 200, body: { success: true, errors: [], result: { delivered: [], permanent_bounces: ['owner@example.com'], queued: [] } } },
    { status: 502, body: '<html>bad gateway</html>' },
    new TypeError('network down'),
  ];
  for (const reply of failures) {
    const logged = [];
    const original = console.error;
    console.error = (...args) => logged.push(args.join(' '));
    try {
      const response = await handleContactRequest(formRequest(valid, { accept: 'application/json' }), env, fakeApi(reply).fetchImpl);
      assert.equal(response.status, 502);
      const body = await response.json();
      assert.equal(body.ok, false);
      assert.equal(body.error, 'The desk could not send that note. Try again in a moment.');
    } finally {
      console.error = original;
    }
    const log = logged.join('\n');
    assert.equal(log.includes(TOKEN), false, 'the API token must never be logged');
    assert.equal(log.includes(valid.message), false, 'the note must never be logged');
  }
});

test('sendEmail resolves for a queued note', async () => {
  const api = fakeApi({ status: 200, body: { success: true, errors: [], result: { delivered: [], permanent_bounces: [], queued: ['owner@example.com'] } } });
  await sendEmail(contactLetter(valid, 'owner@example.com'), { token: TOKEN, accountId: 'acct' }, api.fetchImpl);
  assert.equal(api.calls.length, 1);
});

test('another website cannot post, and a plain submit redirects home', async () => {
  const api = fakeApi();
  const blocked = await handleContactRequest(
    formRequest(valid, { origin: 'https://evil.example', accept: 'application/json' }),
    env,
    api.fetchImpl,
  );
  assert.equal(blocked.status, 403);

  const localSpoof = await handleContactRequest(
    formRequest(valid, { origin: 'http://localhost:4321', url: 'https://aitamer.news/api/contact', accept: 'application/json' }),
    env,
    api.fetchImpl,
  );
  assert.equal(localSpoof.status, 403);
  assert.equal(api.calls.length, 0);

  const plain = await handleContactRequest(formRequest(valid), env, api.fetchImpl);
  assert.equal(plain.status, 303);
  assert.equal(plain.headers.get('Location'), 'https://aitamer.news/about/?sent=1');
});

test('local wrangler is allowed to post to itself', async () => {
  const api = fakeApi();
  const response = await handleContactRequest(
    formRequest(valid, { origin: 'http://127.0.0.1:8788', url: 'http://127.0.0.1:8788/api/contact', accept: 'application/json' }),
    env,
    api.fetchImpl,
  );
  assert.equal(response.status, 200);
  assert.equal(api.calls.length, 1);
  assert.equal(response.headers.get('access-control-allow-origin'), 'http://127.0.0.1:8788');
});

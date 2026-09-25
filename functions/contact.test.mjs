import assert from 'node:assert/strict';
import test from 'node:test';
import { handleContactRequest } from './contact-handler.mjs';
import { DESK_FROM, contactLetter, parseContactFields } from './contact-message.mjs';

const valid = {
  name: 'Ada Desk',
  email: 'ada@example.com',
  message: 'The date on the Grok brief is off by one day.',
};

function formRequest(fields, { origin = 'https://aitamer.news', url = 'https://aitamer.news/api/contact', accept } = {}) {
  const body = new FormData();
  for (const [key, value] of Object.entries(fields)) body.set(key, value);
  const headers = new Headers();
  if (origin) headers.set('Origin', origin);
  if (accept) headers.set('Accept', accept);
  return new Request(url, { method: 'POST', body, headers });
}

function envWith(send) {
  return { CONTACT_TO: 'owner@example.com', EMAIL: { send } };
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
  bot.set('company', 'Acme');
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

test('the letter is from the desk and replies to the visitor', () => {
  const letter = contactLetter(valid, 'owner@example.com');
  assert.equal(letter.to, 'owner@example.com');
  assert.equal(letter.from.email, DESK_FROM);
  assert.equal(letter.replyTo.email, valid.email);
  assert.equal(letter.text.includes(valid.message), true);
  assert.equal(letter.from.email === valid.email, false);
});

test('a fetch from the site sends one letter and does not send a honeypot', async () => {
  const sent = [];
  const send = async (message) => {
    sent.push(message);
    return { messageId: 'm1' };
  };
  const ok = await handleContactRequest(
    formRequest(valid, { accept: 'application/json' }),
    envWith(send),
  );
  assert.equal(ok.status, 200);
  assert.deepEqual(await ok.json(), { ok: true });
  assert.equal(sent.length, 1);
  assert.equal(sent[0].replyTo.email, valid.email);

  const ignored = await handleContactRequest(
    formRequest({ ...valid, company: 'spam' }, { accept: 'application/json' }),
    envWith(send),
  );
  assert.equal(ignored.status, 200);
  assert.equal(sent.length, 1);
});

test('a missing inbox or a failed send does not claim success', async () => {
  const missing = await handleContactRequest(
    formRequest(valid, { accept: 'application/json' }),
    { EMAIL: { send: async () => ({}) } },
  );
  assert.equal(missing.status, 503);

  const failed = await handleContactRequest(
    formRequest(valid, { accept: 'application/json' }),
    envWith(async () => {
      throw new Error('mailbox unavailable');
    }),
  );
  assert.equal(failed.status, 502);
  const body = await failed.json();
  assert.equal(body.ok, false);
  assert.equal(body.error.includes('mailbox'), false);
});

test('another website cannot post, and a plain submit redirects home', async () => {
  const blocked = await handleContactRequest(
    formRequest(valid, { origin: 'https://evil.example', accept: 'application/json' }),
    envWith(async () => ({})),
  );
  assert.equal(blocked.status, 403);

  const localSpoof = await handleContactRequest(
    formRequest(valid, {
      origin: 'http://localhost:4321',
      url: 'https://aitamer.news/api/contact',
      accept: 'application/json',
    }),
    envWith(async () => ({})),
  );
  assert.equal(localSpoof.status, 403);

  const plain = await handleContactRequest(formRequest(valid), envWith(async () => ({ messageId: 'm2' })));
  assert.equal(plain.status, 303);
  assert.equal(plain.headers.get('Location'), 'https://aitamer.news/about/?sent=1');
});

test('local wrangler is allowed to post to itself', async () => {
  const sent = [];
  const response = await handleContactRequest(
    formRequest(valid, {
      origin: 'http://127.0.0.1:8788',
      url: 'http://127.0.0.1:8788/api/contact',
      accept: 'application/json',
    }),
    envWith(async (message) => {
      sent.push(message);
      return { messageId: 'local' };
    }),
  );
  assert.equal(response.status, 200);
  assert.equal(sent.length, 1);
  assert.equal(response.headers.get('access-control-allow-origin'), 'http://127.0.0.1:8788');
});

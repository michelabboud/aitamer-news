import { test } from 'node:test';
import assert from 'node:assert/strict';
import { COMMENT_NAME_MAX as CONTRACT_NAME_MAX, COMMENT_TEXT_MAX as CONTRACT_TEXT_MAX } from '../content/comment-schema.ts';
import { HONEYPOT_FIELD as CONTACT_HONEYPOT_FIELD } from '../../workers/contact/src/message.mjs';
import {
  COMMENTED_QUERY,
  COMMENTED_VALUE,
  COMMENTS_ANCHOR,
  COMMENT_CHECK_FAILED_MESSAGE,
  COMMENT_ERROR_MAX,
  COMMENT_FAILED_MESSAGE,
  COMMENT_FORM_FIELDS,
  COMMENT_HELD_ANCHOR,
  COMMENT_NAME_MAX,
  COMMENT_TEXT_MAX,
  COMMENT_TURNSTILE_ACTION,
  COMMENT_TURNSTILE_CALLBACKS,
  LOCAL_HTTP_HOSTS,
  commentErrorText,
  commentFormSetup,
} from './comment-form.ts';

const ENDPOINT = 'https://comments.aitamer.news/';
const SITE_KEY = '0x4AAAAAAA_site_key';

test('the form is ready with an https endpoint and a Turnstile site key', () => {
  assert.deepEqual(commentFormSetup({ endpoint: ENDPOINT, turnstileSiteKey: SITE_KEY, contactFormLive: true }), {
    ready: true,
    endpoint: ENDPOINT,
    turnstileSiteKey: SITE_KEY,
  });
});

test('a local http endpoint (wrangler dev) is accepted, and surrounding whitespace is trimmed', () => {
  const setup = commentFormSetup({ endpoint: ' http://localhost:8788/ ', turnstileSiteKey: ` ${SITE_KEY}\n`, contactFormLive: true });
  assert.deepEqual(setup, { ready: true, endpoint: 'http://localhost:8788/', turnstileSiteKey: SITE_KEY, contactFormLive: true });
  assert.equal(commentFormSetup({ endpoint: 'http://127.0.0.1:8788/', turnstileSiteKey: SITE_KEY, contactFormLive: true }).ready, true);
  assert.deepEqual([...LOCAL_HTTP_HOSTS].sort(), ['127.0.0.1', 'localhost']);
});

test('plain http to any other host is refused: a comment is never sent in the clear', () => {
  for (const endpoint of [
    'http://comments.aitamer.news/',
    'http://localhost.evil.example/',
    'http://127.0.0.2:8788/',
    'http://evil.example/?localhost',
    'http://localhost@evil.example/',
    'http://[::1]:8788/',
  ]) {
    assert.deepEqual(commentFormSetup({ endpoint, turnstileSiteKey: SITE_KEY, contactFormLive: true }), { ready: false, missing: 'endpoint' }, endpoint);
  }
});

test('without a Turnstile site key the form is not set up (Turnstile is mandatory for comments)', () => {
  assert.deepEqual(commentFormSetup({ endpoint: ENDPOINT, turnstileSiteKey: '', contactFormLive: true }), { ready: false, missing: 'turnstile' });
  assert.deepEqual(commentFormSetup({ endpoint: ENDPOINT, turnstileSiteKey: '   ', contactFormLive: true }), { ready: false, missing: 'turnstile' });
});

test('an empty or malformed endpoint is reported as missing, never posted to', () => {
  for (const endpoint of ['', '   ', 'comments.aitamer.news', '/comments/', 'ftp://comments.aitamer.news/', 'javascript:alert(1)']) {
    assert.deepEqual(
      commentFormSetup({ endpoint, turnstileSiteKey: SITE_KEY, contactFormLive: true }),
      { ready: false, missing: 'endpoint' },
      `endpoint ${JSON.stringify(endpoint)}`,
    );
  }
});

test('the endpoint is checked before the site key, so a broken override is named first', () => {
  assert.deepEqual(commentFormSetup({ endpoint: 'nope', turnstileSiteKey: '', contactFormLive: true }), { ready: false, missing: 'endpoint' });
});

test('the field names are the ones the Worker reads (plan §5.2)', () => {
  assert.deepEqual(COMMENT_FORM_FIELDS, {
    slug: 'slug',
    name: 'name',
    text: 'text',
    honeypot: 'desk_extra',
    elapsed: 'elapsed',
    turnstile: 'cf-turnstile-response',
  });
  assert.equal(Object.isFrozen(COMMENT_FORM_FIELDS), true);
});

test('the Turnstile action is "comment", a name Turnstile accepts (letters, digits, _ and -, at most 32)', () => {
  assert.equal(COMMENT_TURNSTILE_ACTION, 'comment');
  assert.match(COMMENT_TURNSTILE_ACTION, /^[A-Za-z0-9_-]{1,32}$/);
});

test('the honeypot field is the same name the contact form uses', () => {
  assert.equal(COMMENT_FORM_FIELDS.honeypot, CONTACT_HONEYPOT_FIELD);
});

test('the client-side limits are the comment contract limits', () => {
  assert.equal(COMMENT_NAME_MAX, CONTRACT_NAME_MAX);
  assert.equal(COMMENT_TEXT_MAX, CONTRACT_TEXT_MAX);
  assert.equal(COMMENT_NAME_MAX, 60);
  assert.equal(COMMENT_TEXT_MAX, 2000);
});

test('the no-script redirect is ?commented=1#comment-held, a fragment distinct from the section’s', () => {
  assert.equal(`?${COMMENTED_QUERY}=${COMMENTED_VALUE}#${COMMENT_HELD_ANCHOR}`, '?commented=1#comment-held');
  assert.equal(COMMENTS_ANCHOR, 'comments');
  assert.notEqual(COMMENT_HELD_ANCHOR, COMMENTS_ANCHOR);
  assert.match(COMMENT_HELD_ANCHOR, /^[a-z][a-z-]*$/);
});

test('a Worker failure shows its reason only when that is a short non-empty string', () => {
  assert.equal(commentErrorText({ ok: false, error: 'That comment is too long.' }), 'That comment is too long.');
  assert.equal(commentErrorText({ error: '  Slow down.  ' }), 'Slow down.');
  for (const payload of [
    null,
    undefined,
    'text',
    42,
    [],
    {},
    { error: '' },
    { error: '   ' },
    { error: { message: 'object' } },
    { error: ['a'] },
    { error: 7 },
    { error: null },
    { error: 'x'.repeat(COMMENT_ERROR_MAX + 1) },
  ]) {
    assert.equal(commentErrorText(payload), COMMENT_FAILED_MESSAGE, JSON.stringify(payload));
  }
  assert.equal(commentErrorText({ error: 'x'.repeat(COMMENT_ERROR_MAX) }), 'x'.repeat(COMMENT_ERROR_MAX));
});

test('the Turnstile callbacks are distinct global names, and the check-failed note is its own message', () => {
  const names = Object.values(COMMENT_TURNSTILE_CALLBACKS);
  assert.equal(new Set(names).size, 3);
  for (const name of names) assert.match(name, /^[A-Za-z_$][A-Za-z0-9_$]*$/);
  assert.equal(Object.isFrozen(COMMENT_TURNSTILE_CALLBACKS), true);
  assert.notEqual(COMMENT_CHECK_FAILED_MESSAGE, COMMENT_FAILED_MESSAGE);
});

test('comments stay closed until the contact form, the removal channel, is live', () => {
  assert.deepEqual(
    commentFormSetup({ endpoint: ENDPOINT, turnstileSiteKey: SITE_KEY, contactFormLive: false }),
    { ready: false, missing: 'removal-channel' },
  );
});

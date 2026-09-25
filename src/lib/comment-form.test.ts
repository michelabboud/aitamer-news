import { test } from 'node:test';
import assert from 'node:assert/strict';
import { COMMENT_NAME_MAX as CONTRACT_NAME_MAX, COMMENT_TEXT_MAX as CONTRACT_TEXT_MAX } from '../content/comment-schema.ts';
import { HONEYPOT_FIELD as CONTACT_HONEYPOT_FIELD } from '../../workers/contact/src/message.mjs';
import {
  COMMENTED_QUERY,
  COMMENTED_VALUE,
  COMMENTS_ANCHOR,
  COMMENT_FORM_FIELDS,
  COMMENT_NAME_MAX,
  COMMENT_TEXT_MAX,
  COMMENT_TURNSTILE_ACTION,
  commentFormSetup,
} from './comment-form.ts';

const ENDPOINT = 'https://comments.aitamer.news/';
const SITE_KEY = '0x4AAAAAAA_site_key';

test('the form is ready with an https endpoint and a Turnstile site key', () => {
  assert.deepEqual(commentFormSetup({ endpoint: ENDPOINT, turnstileSiteKey: SITE_KEY }), {
    ready: true,
    endpoint: ENDPOINT,
    turnstileSiteKey: SITE_KEY,
  });
});

test('a local http endpoint (wrangler dev) is accepted, and surrounding whitespace is trimmed', () => {
  const setup = commentFormSetup({ endpoint: ' http://localhost:8788/ ', turnstileSiteKey: ` ${SITE_KEY}\n` });
  assert.deepEqual(setup, { ready: true, endpoint: 'http://localhost:8788/', turnstileSiteKey: SITE_KEY });
});

test('without a Turnstile site key the form is not set up (Turnstile is mandatory for comments)', () => {
  assert.deepEqual(commentFormSetup({ endpoint: ENDPOINT, turnstileSiteKey: '' }), { ready: false, missing: 'turnstile' });
  assert.deepEqual(commentFormSetup({ endpoint: ENDPOINT, turnstileSiteKey: '   ' }), { ready: false, missing: 'turnstile' });
});

test('an empty or malformed endpoint is reported as missing, never posted to', () => {
  for (const endpoint of ['', '   ', 'comments.aitamer.news', '/comments/', 'ftp://comments.aitamer.news/', 'javascript:alert(1)']) {
    assert.deepEqual(
      commentFormSetup({ endpoint, turnstileSiteKey: SITE_KEY }),
      { ready: false, missing: 'endpoint' },
      `endpoint ${JSON.stringify(endpoint)}`,
    );
  }
});

test('the endpoint is checked before the site key, so a broken override is named first', () => {
  assert.deepEqual(commentFormSetup({ endpoint: 'nope', turnstileSiteKey: '' }), { ready: false, missing: 'endpoint' });
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

test('the no-script redirect is ?commented=1#comments', () => {
  assert.equal(`?${COMMENTED_QUERY}=${COMMENTED_VALUE}#${COMMENTS_ANCHOR}`, '?commented=1#comments');
});

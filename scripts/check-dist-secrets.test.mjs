import assert from 'node:assert/strict';
import test from 'node:test';
import { FORBIDDEN_MARKERS, devVarsValues, findLeaks } from './check-dist-secrets.mjs';

const page = (text) => ({ path: 'dist/about/index.html', text });

test('a clean page passes', () => {
  assert.deepEqual(findLeaks([page('<form action="https://contact.aitamer.news/"></form>')], FORBIDDEN_MARKERS, ['s3cret-token-value']), []);
});

test('secret names are caught', () => {
  const leaks = findLeaks([page('const to = env.CONTACT_TO; const k = env.TURNSTILE_SECRET_KEY;')], FORBIDDEN_MARKERS, []);
  const found = leaks.map((l) => l.what);
  assert.ok(found.includes('contains "CONTACT_TO"'));
  assert.ok(found.includes('contains "TURNSTILE_SECRET_KEY"'));
});

test('a story that quotes an API hostname or a bearer header does not block a deploy', () => {
  assert.deepEqual(findLeaks([page('<p>Send it to api.cloudflare.com with an Authorization: Bearer header.</p>')], FORBIDDEN_MARKERS, []), []);
});

test('a leaked secret value is caught and never echoed back', () => {
  const secret = 'cfut_abcdefghijklmnop';
  const leaks = findLeaks([page(`var t = "${secret}";`)], [], [secret]);
  assert.equal(leaks.length, 1);
  assert.equal(leaks[0].what, 'contains secret value #1');
  assert.equal(JSON.stringify(leaks).includes(secret), false);
});

test('very short values are not searched, to avoid false alarms', () => {
  assert.deepEqual(findLeaks([page('a b c 1234')], [], ['1234']), []);
});

test('.dev.vars values are read without comments or quotes', () => {
  assert.deepEqual(devVarsValues('# local\nCONTACT_TO=owner@example.com\nTURNSTILE_SECRET_KEY="abc=def"\n\n'), ['owner@example.com', 'abc=def']);
});

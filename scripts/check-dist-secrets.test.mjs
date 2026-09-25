import assert from 'node:assert/strict';
import test from 'node:test';
import { FORBIDDEN_MARKERS, devVarsValues, findLeaks } from './check-dist-secrets.mjs';

const page = (text) => ({ path: 'dist/about/index.html', text });

test('a clean page passes', () => {
  assert.deepEqual(findLeaks([page('<form action="/api/contact"></form>')], FORBIDDEN_MARKERS, ['s3cret-token-value']), []);
});

test('secret names, the bearer header, and the API address are caught', () => {
  const leaks = findLeaks(
    [page('fetch("https://api.cloudflare.com/client/v4/accounts/x/email/sending/send", { headers: { authorization: "Bearer " + env.CF_EMAIL_API_TOKEN } })')],
    FORBIDDEN_MARKERS,
    [],
  );
  const found = leaks.map((l) => l.what);
  for (const marker of ['CF_EMAIL_API_TOKEN', 'api.cloudflare.com', 'email/sending/send', 'Bearer ']) {
    assert.ok(found.includes(`contains "${marker}"`), marker);
  }
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
  assert.deepEqual(devVarsValues('# local\nCONTACT_TO=owner@example.com\nCF_EMAIL_API_TOKEN="abc=def"\n\n'), ['owner@example.com', 'abc=def']);
});

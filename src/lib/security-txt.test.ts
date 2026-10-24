import assert from 'node:assert/strict';
import { test } from 'node:test';
import { SECURITY_TXT_VALID_DAYS, securityTxt } from './security-txt.ts';

const now = new Date('2026-10-24T12:34:56.789Z');

test('the file has the fields RFC 9116 requires, each once, and only https URIs as contacts', () => {
  const text = securityTxt(now, { contactFormLive: true });
  const fields = text.trimEnd().split('\n').map((line) => line.split(': ')[0]);
  assert.deepEqual(fields, ['Contact', 'Contact', 'Expires', 'Preferred-Languages', 'Canonical', 'Policy']);
  for (const line of text.split('\n').filter((l) => l.startsWith('Contact:'))) {
    assert.match(line, /^Contact: https:\/\/\S+$/);
  }
  assert.ok(text.endsWith('\n') && !text.includes('\r'));
});

test('Expires is a UTC date-time without milliseconds, SECURITY_TXT_VALID_DAYS after the build, under a year', () => {
  assert.equal(SECURITY_TXT_VALID_DAYS, 180);
  assert.match(securityTxt(now, { contactFormLive: true }), /^Expires: 2027-04-22T12:34:56Z$/m);
  assert.ok(SECURITY_TXT_VALID_DAYS < 365);
});

test('the contact form is advertised only while it is live', () => {
  assert.doesNotMatch(securityTxt(now, { contactFormLive: false }), /about\/#contact/);
  assert.match(securityTxt(now, { contactFormLive: true }), /^Contact: https:\/\/aitamer\.news\/about\/#contact$/m);
});

test('it names the private-report page, the canonical URL and the policy, and no email address', () => {
  const text = securityTxt(now, { contactFormLive: false });
  assert.match(text, /^Contact: https:\/\/github\.com\/michelabboud\/aitamer-news\/security\/advisories\/new$/m);
  assert.match(text, /^Canonical: https:\/\/aitamer\.news\/\.well-known\/security\.txt$/m);
  assert.match(text, /^Policy: https:\/\/github\.com\/michelabboud\/aitamer-news\/blob\/main\/SECURITY\.md$/m);
  assert.doesNotMatch(text, /mailto:|@/);
});

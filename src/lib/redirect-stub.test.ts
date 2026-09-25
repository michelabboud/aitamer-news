import { test } from 'node:test';
import assert from 'node:assert/strict';
import { redirectStubHtml } from './redirect-stub.ts';

test('stub refreshes, links, sets canonical, and is not indexed', () => {
  const html = redirectStubHtml({
    to: '/aitamer-news/section/opinion/',
    canonical: 'https://aitamer.news/section/opinion/',
    label: 'Opinion',
  });
  assert.match(html, /<meta http-equiv="refresh" content="0;url=\/aitamer-news\/section\/opinion\/">/);
  assert.match(html, /<link rel="canonical" href="https:\/\/aitamer\.news\/section\/opinion\/">/);
  assert.match(html, /<meta name="robots" content="noindex">/);
  assert.match(html, /<a href="\/aitamer-news\/section\/opinion\/">Opinion<\/a>/);
});

test('stub escapes what it is given', () => {
  const html = redirectStubHtml({ to: '/a"><script>x</script>', canonical: 'https://x/"', label: '<b>' });
  assert.doesNotMatch(html, /<script>x/);
  assert.doesNotMatch(html, /<b>/);
  assert.match(html, /&quot;&gt;&lt;script&gt;/);
});

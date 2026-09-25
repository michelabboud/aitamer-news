import { test } from 'node:test';
import assert from 'node:assert/strict';
import { renderCommentHtml } from './comment-text.ts';

/**
 * Deep-review finding B1 (lane A2F): a link's visible text must never name a different host from
 * its href. These drive only `renderCommentHtml`, so they ran, and failed, against the renderer
 * that showed the typed text; they must keep passing against every later one.
 */

/** Every `<a>` in `html`: its href and its visible text, with the five escapes undone. */
function anchors(html: string): Array<{ href: string; text: string }> {
  const unescape = (value: string) =>
    value.replace(/&lt;|&gt;|&quot;|&#39;|&amp;/g, (entity) => ({ '&lt;': '<', '&gt;': '>', '&quot;': '"', '&#39;': "'", '&amp;': '&' })[entity]!);
  return [...html.matchAll(/<a href="([^"]*)"[^>]*>([^<]*)<\/a>/g)].map(([, href, text]) => ({ href: unescape(href), text: unescape(text) }));
}

/**
 * The visible text starts with the href's own `scheme://host`, whole, followed by a path, the
 * ellipsis or nothing: a reader who reads the text reads the host the link goes to.
 */
function assertHonest(input: string): void {
  const html = renderCommentHtml(input);
  for (const { href, text } of anchors(html)) {
    const { protocol, host } = new URL(href);
    const prefix = `${protocol}//${host}`;
    assert.ok(text.startsWith(prefix), `${input}: text ${JSON.stringify(text)} does not start with ${prefix}`);
    assert.match(text.slice(prefix.length), /^(?:$|[/?#…])/, `${input}: text ${JSON.stringify(text)} runs on past the host ${host}`);
  }
}

const noLink = (input: string) => assert.doesNotMatch(renderCommentHtml(input), /<a /, input);

test('B1: a fraction slash (U+2044) cannot pass userinfo off as a path: a URL with userinfo is not linked', () => {
  noLink('https://aitamer.news⁄posts@evil.example/');
  noLink('https://user:pass@example.com/');
  noLink('https://:pass@example.com/');
});

test('B1: a percent-encoded dot in the host shows the host the href goes to', () => {
  assertHonest('https://aitamer.news%2eevil.example/');
  assert.equal(anchors(renderCommentHtml('https://aitamer.news%2eevil.example/'))[0]?.text, 'https://aitamer.news.evil.example/');
});

test('B1: a long host is never cut: the old 80-character cut hid the real domain', () => {
  const input = `https://aitamer.news.${'a'.repeat(60)}.evil.example/story`;
  assertHonest(input);
  assert.ok(anchors(renderCommentHtml(input))[0]?.text.includes('.evil.example'));
});

test('B1: a backslash is a slash to the parser, so the text shows the real host first', () => {
  assertHonest('https://evil.example\\@aitamer.news');
});

test('M1: a homograph host (Cyrillic а) is shown in its punycode form', () => {
  assertHonest('https://аitamer.news');
  assert.match(anchors(renderCommentHtml('https://аitamer.news'))[0]?.text ?? '', /^https:\/\/xn--/);
});

test('I7: a host that is an IP address is not linked, in any of its forms', () => {
  for (const input of ['https://3232235777', 'https://[::1]/', 'http://127.0.0.1/', 'https://0x7f.1/', 'https://127.1/', 'https://[2001:db8::1]:8080/x']) noLink(input);
});

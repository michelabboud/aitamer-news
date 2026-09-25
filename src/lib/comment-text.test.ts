import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  COMMENT_JSON_LD_MAX,
  COMMENT_LINK_REL,
  COMMENT_LINK_TEXT_MAX,
  commentAnchor,
  commentCountLabel,
  commentsJsonLd,
  escapeHtml,
  renderCommentHtml,
  stripInvisible,
  truncateLinkText,
  type CommentLike,
} from './comment-text.ts';
import { toJsonLd } from './json-ld.ts';

const REL = `rel="${COMMENT_LINK_REL}" target="_blank"`;
const link = (href: string, text = href) => `<a href="${href}" ${REL}>${text}</a>`;

// ---- paragraphs and line breaks ----

test('blank lines make paragraphs and single newlines make <br>', () => {
  assert.equal(renderCommentHtml('One\ntwo\n\nThree'), '<p>One<br>two</p><p>Three</p>');
});

test('several blank lines, whitespace-only lines and edge newlines make no empty paragraphs', () => {
  assert.equal(renderCommentHtml('\nOne\n\n\n\n  \t\nTwo\n'), '<p>One</p><p>Two</p>');
});

test('carriage returns are treated as newlines, never emitted', () => {
  assert.equal(renderCommentHtml('One\r\ntwo\r\n\r\nThree\rfour'), '<p>One<br>two</p><p>Three<br>four</p>');
});

test('text with nothing visible renders nothing', () => {
  assert.equal(renderCommentHtml(''), '');
  assert.equal(renderCommentHtml('\n\n  \n'), '');
  assert.equal(renderCommentHtml('\u200B\u202E'), '');
});

// ---- escaping ----

test('the five HTML characters are escaped in text', () => {
  assert.equal(renderCommentHtml(`Ada & "Bob" <3 'n' a > b`), '<p>Ada &amp; &quot;Bob&quot; &lt;3 &#39;n&#39; a &gt; b</p>');
});

test('markup that slipped past the schema stays inert text', () => {
  const html = renderCommentHtml('<script>alert(1)</script><img src=x onerror=alert(1)>');
  assert.doesNotMatch(html, /<script|<img/i);
  assert.equal(html, '<p>&lt;script&gt;alert(1)&lt;/script&gt;&lt;img src=x onerror=alert(1)&gt;</p>');
});

test('entity-looking text renders literally: its ampersand is escaped, never decoded', () => {
  assert.equal(renderCommentHtml('&lt;script&gt; and &amp; and &#60;b&#62;'), '<p>&amp;lt;script&amp;gt; and &amp;amp; and &amp;#60;b&amp;#62;</p>');
});

test('text the schema allows ("<3", "a < b", quotes, ampersands) is escaped, not dropped', () => {
  assert.equal(renderCommentHtml(`<3 a < b > c "q" 'r' R&D`), '<p>&lt;3 a &lt; b &gt; c &quot;q&quot; &#39;r&#39; R&amp;D</p>');
});

test('escapeHtml leaves nothing that can open a tag or leave a quoted attribute', () => {
  assert.equal(escapeHtml(`&<>"'`), '&amp;&lt;&gt;&quot;&#39;');
  assert.equal(escapeHtml('plain'), 'plain');
});

// ---- links ----

test('an https URL becomes a link with rel and target', () => {
  assert.equal(
    renderCommentHtml('See https://example.com/a-link for more'),
    `<p>See ${link('https://example.com/a-link')} for more</p>`,
  );
});

test('http links too, and the scheme is case-insensitive', () => {
  assert.equal(renderCommentHtml('http://example.com/'), `<p>${link('http://example.com/')}</p>`);
  assert.equal(renderCommentHtml('HTTPS://Example.COM/X'), `<p>${link('https://example.com/X', 'HTTPS://Example.COM/X')}</p>`);
});

test('javascript: and data: are never linked, nor any other scheme', () => {
  for (const hostile of [
    'javascript:alert(1)',
    'JaVaScRiPt:alert(document.cookie)',
    'data:text/html;base64,PHNjcmlwdD5hbGVydCgxKTwvc2NyaXB0Pg==',
    'vbscript:msgbox(1)',
    'mailto:ada@example.com',
    'ftp://example.com/file',
    '//example.com/protocol-relative',
    'www.example.com',
  ]) {
    const html = renderCommentHtml(`click ${hostile} now`);
    assert.doesNotMatch(html, /<a /, hostile);
  }
});

test('a javascript: string that contains an https URL links only the https part', () => {
  const html = renderCommentHtml(`javascript:location='https://evil.example/x'`);
  assert.doesNotMatch(html, /href="javascript/i);
  assert.equal(html, `<p>javascript:location=&#39;${link('https://evil.example/x')}&#39;</p>`);
});

test('a scheme glued to a word is not a link, and a URL with no host is not a link', () => {
  assert.doesNotMatch(renderCommentHtml('xhttps://example.com'), /<a /);
  assert.doesNotMatch(renderCommentHtml('https:// and http:///path'), /<a /);
  assert.doesNotMatch(renderCommentHtml('https://[not-an-ip'), /<a /);
});

test('ten links all carry the full rel and target', () => {
  const text = Array.from({ length: 10 }, (_, i) => `https://example.com/${i}`).join(' and ');
  const html = renderCommentHtml(text);
  const anchors = html.match(/<a [^>]*>/g) ?? [];
  assert.equal(anchors.length, 10);
  for (const anchor of anchors) {
    assert.match(anchor, /rel="nofollow ugc noopener noreferrer"/);
    assert.match(anchor, /target="_blank"/);
  }
});

test('trailing "). " stays outside the link', () => {
  assert.equal(
    renderCommentHtml('(see https://example.com/a).'),
    `<p>(see ${link('https://example.com/a')}).</p>`,
  );
});

test('sentence punctuation after a URL stays outside; a URL keeps its own balanced parentheses', () => {
  assert.equal(renderCommentHtml('Read https://example.com/x, then!'), `<p>Read ${link('https://example.com/x')}, then!</p>`);
  assert.equal(renderCommentHtml('https://example.com/y?'), `<p>${link('https://example.com/y')}?</p>`);
  assert.equal(
    renderCommentHtml('https://en.wikipedia.org/wiki/Tamer_(film).'),
    `<p>${link('https://en.wikipedia.org/wiki/Tamer_(film)')}.</p>`,
  );
});

test('a quote ends a URL, so it can never leave the href attribute', () => {
  for (const [input, href, rest] of [
    ['https://x.example/"onmouseover=alert(1)', 'https://x.example/', '&quot;onmouseover=alert(1)'],
    ["https://x.example/'onmouseover=alert(1)", 'https://x.example/', '&#39;onmouseover=alert(1)'],
    ['https://x.example/<script>', 'https://x.example/', '&lt;script&gt;'],
    ['https://x.example/`x`', 'https://x.example/', '`x`'],
  ]) {
    assert.equal(renderCommentHtml(input), `<p>${link(href)}${rest}</p>`, input);
  }
});

test('every href and link text is escaped: nothing in the output opens a tag except p, br and a', () => {
  const html = renderCommentHtml('https://x.example/?q=<b>&r="1" https://y.example/a&b\n<i>&lt;</i>');
  const tags = html.match(/<\/?([a-z]+)/g) ?? [];
  assert.ok(tags.every((tag) => /^<\/?(p|br|a)$/.test(tag)), tags.join(' '));
  for (const [, href] of html.matchAll(/href="([^"]*)"/g)) assert.doesNotMatch(href, /[<>"']/);
});

test('an ampersand in a URL is escaped in the href and the text; a quote ends the URL', () => {
  assert.equal(
    renderCommentHtml('https://example.com/?a=1&b=2"onmouseover="alert(1)'),
    `<p>${link('https://example.com/?a=1&amp;b=2')}&quot;onmouseover=&quot;alert(1)</p>`,
  );
});

test('a URL with a non-ASCII host gets a punycode href and keeps its readable text', () => {
  assert.equal(renderCommentHtml('https://bücher.example/'), `<p>${link('https://xn--bcher-kva.example/', 'https://bücher.example/')}</p>`);
});

test('a long URL keeps its full href; its visible text is cut at 80 characters with an ellipsis', () => {
  const url = `https://example.com/${'a'.repeat(200)}`;
  const html = renderCommentHtml(url);
  const [, href, text] = html.match(/<a href="([^"]*)"[^>]*>([^<]*)<\/a>/) ?? [];
  assert.equal(href, url);
  assert.equal(Array.from(text).length, COMMENT_LINK_TEXT_MAX);
  assert.ok(text.endsWith('…'));
  assert.ok(url.startsWith(text.slice(0, -1)));
});

test('truncateLinkText counts code points, so an emoji is never split', () => {
  const exact = 'x'.repeat(COMMENT_LINK_TEXT_MAX);
  assert.equal(truncateLinkText(exact), exact);
  const emoji = '\u{1F525}'.repeat(COMMENT_LINK_TEXT_MAX + 5);
  const cut = truncateLinkText(emoji);
  assert.equal(Array.from(cut).length, COMMENT_LINK_TEXT_MAX);
  assert.ok(Array.from(cut).slice(0, -1).every((point) => point === '\u{1F525}'));
});

test('links work across lines and paragraphs', () => {
  assert.equal(
    renderCommentHtml('a https://example.com/1\nb\n\nhttps://example.com/2'),
    `<p>a ${link('https://example.com/1')}<br>b</p><p>${link('https://example.com/2')}</p>`,
  );
});

// ---- invisible characters ----

test('bidirectional controls, the zero-width space and the BOM are stripped', () => {
  const hostile = '\uFEFFsafe\u202Etxt.exe\u202C \u2066iso\u2069 zero\u200Bwidth \u202A\u202B\u202D\u2067\u2068';
  assert.equal(stripInvisible(hostile), 'safetxt.exe iso zerowidth ');
  assert.equal(renderCommentHtml(hostile), '<p>safetxt.exe iso zerowidth </p>');
});

test('the zero-width joiner and non-joiner are kept (emoji sequences and real scripts need them)', () => {
  const family = '\u{1F469}\u200D\u{1F469}\u200D\u{1F467}';
  const persian = 'می\u200Cخواهم';
  assert.equal(stripInvisible(family), family);
  assert.equal(renderCommentHtml(`${family} ${persian}`), `<p>${family} ${persian}</p>`);
});

test('a zero-width space cannot hide a scheme from the scheme check', () => {
  assert.equal(renderCommentHtml('java\u200Bscript:alert(1)'), '<p>javascript:alert(1)</p>');
});

// ---- counts and anchors ----

test('count labels', () => {
  assert.equal(commentCountLabel(0), 'No comments');
  assert.equal(commentCountLabel(1), '1 comment');
  assert.equal(commentCountLabel(51), '51 comments');
});

test('the anchor of a comment', () => {
  assert.equal(commentAnchor('01K63M4Q3ZJ8W3Y8N5V2R7T9AB'), 'c-01K63M4Q3ZJ8W3Y8N5V2R7T9AB');
});

// ---- JSON-LD ----

const thread = (count: number): CommentLike[] =>
  Array.from({ length: count }, (_, i) => ({
    id: `01K63M4Q3ZJ8W3Y8N5V2R7T${String(i).padStart(3, '0')}`,
    name: `Reader ${i}`,
    text: `Comment number ${i}`,
    at: new Date(Date.UTC(2026, 8, 25, 0, i)).toISOString().replace('.000Z', 'Z'),
  }));

test('51 comments: commentCount is 51 and the JSON-LD carries the 50 newest, newest first', () => {
  const ld = commentsJsonLd(thread(51));
  assert.equal(ld.commentCount, 51);
  assert.equal(ld.comment?.length, COMMENT_JSON_LD_MAX);
  assert.equal(ld.comment?.[0].text, 'Comment number 50');
  assert.equal(ld.comment?.at(-1)?.text, 'Comment number 1');
});

test('each JSON-LD comment is a schema.org Comment with a Person author', () => {
  const [only] = thread(1);
  assert.deepEqual(commentsJsonLd([only]), {
    commentCount: 1,
    comment: [
      { '@type': 'Comment', text: only.text, dateCreated: only.at, author: { '@type': 'Person', name: only.name } },
    ],
  });
});

test('no comments: commentCount 0 and no comment list', () => {
  assert.deepEqual(commentsJsonLd([]), { commentCount: 0 });
});

test('JSON-LD strips invisible characters from text and name', () => {
  const ld = commentsJsonLd([{ id: 'x', name: 'A\u202Eda', text: 'hi\u200B there', at: '2026-09-25T00:00:00Z' }]);
  assert.equal(ld.comment?.[0].author.name, 'Ada');
  assert.equal(ld.comment?.[0].text, 'hi there');
});

test('a comment with </script> in its text cannot close the JSON-LD block through toJsonLd', () => {
  const hostile = 'nice </script><script>alert(1)</script> <!-- & more';
  const out = toJsonLd({ '@type': 'NewsArticle', ...commentsJsonLd([{ id: 'x', name: '</script>', text: hostile, at: '2026-09-25T00:00:00Z' }]) });
  assert.doesNotMatch(out, /<\/script/i);
  assert.doesNotMatch(out, /<!--/);
  assert.equal(JSON.parse(out).comment[0].text, hostile);
});

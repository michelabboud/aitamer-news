import assert from 'node:assert/strict';
import { test } from 'node:test';
import { SITE } from './site-meta.ts';
import {
  PUBLISHER_ID,
  SITE_LANGUAGE,
  articleWordCount,
  authorSameAs,
  publisherOrganization,
} from './structured-data.ts';
import { toJsonLd } from './json-ld.ts';

test('the publisher is a full Organization: id, logo with size, and the existing contact form', () => {
  const org = publisherOrganization();
  assert.equal(org['@type'], 'Organization');
  assert.equal(org['@id'], PUBLISHER_ID);
  assert.equal(org.name, SITE.title);
  assert.equal(org.url, SITE.url);
  assert.deepEqual(org.logo, {
    '@type': 'ImageObject',
    url: `${SITE.url}/apple-touch-icon.png`,
    width: 180,
    height: 180,
  });
  assert.equal(org.contactPoint.url, `${SITE.url}/about/#contact`);
  assert.equal(org.contactPoint.contactType, 'editorial');
});

test('no invented identity: the publisher carries no sameAs, email, phone, address or founding date', () => {
  const org = publisherOrganization() as Record<string, unknown>;
  for (const key of ['sameAs', 'email', 'telephone', 'address', 'foundingDate', 'funder', 'parentOrganization']) {
    assert.equal(key in org, false, key);
  }
});

test('the publisher survives the JSON-LD serializer unchanged', () => {
  assert.deepEqual(JSON.parse(toJsonLd(publisherOrganization())), publisherOrganization());
});

test('the site language is a bare BCP 47 tag', () => {
  assert.equal(SITE_LANGUAGE, 'en');
});

test('only a human with a website gets sameAs, and only an https link', () => {
  assert.deepEqual(authorSameAs('human', 'https://example.com/me'), ['https://example.com/me']);
  assert.equal(authorSameAs('human', undefined), undefined);
  assert.equal(authorSameAs('human', ''), undefined);
  assert.equal(authorSameAs('human', 'http://example.com/me'), undefined);
  assert.equal(authorSameAs('human', 'javascript:alert(1)'), undefined);
  assert.equal(authorSameAs('ai', 'https://example.com/ai'), undefined);
  assert.equal(authorSameAs('bot', 'https://example.com/bot'), undefined);
});

test('word count counts prose words across headings, lists, links and emphasis', () => {
  const md = '# Two words\n\nOne **bold** and [a link](https://example.com/very/long/url) here.\n\n- item one\n- item two\n';
  // Two words | One bold and a link here | item one | item two
  assert.equal(articleWordCount(md), 2 + 6 + 2 + 2);
});

test('word count leaves out fenced code, inline code and URLs', () => {
  const md = 'Run `npm install --save left-pad` now.\n\n```js\nconst a = 1;\nconsole.log(a);\n```\n\nDone.\n';
  assert.equal(articleWordCount(md), 3);
});

test('word count leaves out diagram fences and raw HTML tags but keeps their text', () => {
  const md = 'Before.\n\n```mermaid\ngraph TD; A-->B;\n```\n\nAfter <em>this</em> point.\n';
  assert.equal(articleWordCount(md), 4);
});

test('word count decodes entities so AT&T is one word and symbols alone are not words', () => {
  assert.equal(articleWordCount('AT&T — said | yes'), 3);
});

test('word count leaves out scripts, styles and comments written as raw HTML', () => {
  const md = 'Start.\n\n<script>var foo = bar baz;</script>\n\n<style>.a { color: red }</style>\n\n<!-- a > b c d -->\n\nEnd.\n';
  assert.equal(articleWordCount(md), 2);
});

test('word count counts text inside block-level raw HTML', () => {
  assert.equal(articleWordCount('<div>block words here</div>\n'), 3);
});

test('word count leaves out footnote numbering and the generated footnote list, keeps ordinary superscripts', () => {
  assert.equal(articleWordCount('Claim[^1] stands.\n\n[^1]: A long note with many words.\n'), 2);
  assert.equal(articleWordCount('x<sup>2</sup> grows\n'), 3);
});

test('word count does not count a bare or autolinked web address', () => {
  assert.equal(articleWordCount('See <https://example.com/a/b> or https://example.org now.\n'), 3);
});

test('word count is zero for an empty or missing body', () => {
  assert.equal(articleWordCount(''), 0);
  assert.equal(articleWordCount(undefined), 0);
});

test('MDX: a multi-line import, code expressions and exports are not words; JSX children are', () => {
  const mdx = "import {\n  A,\n  B,\n} from './x';\n\nexport const meta = { a: 1 };\n\nHello {1 + 2} <A b=\"c\">inner words</A> end.\n";
  assert.equal(articleWordCount(mdx, { mdx: true }), 1 + 2 + 1);
});

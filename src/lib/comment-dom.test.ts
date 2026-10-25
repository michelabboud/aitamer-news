import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  COMMENT_ID_TITLE,
  COMMENT_SIGNED_IN_TITLE,
  appendCommentBlocks,
  appendCommentText,
  renderCommentList,
  validateCommentFile,
  type ClientComment,
} from './comment-dom.ts';
import { COMMENT_LINK_REL, commentTextBlocks, escapeHtml, renderCommentHtml } from './comment-text.ts';
import { COMMENTS_PER_FILE_MAX, COMMENT_NAME_MAX, COMMENT_TEXT_MAX } from '../content/comment-schema.ts';

/**
 * Plan docs/plans/2026-10-24-comments-on-r2.md, task S2: one renderer, two outputs. No DOM
 * library is a dev dependency here (rule 1.5 forbids adding one for this), so the tests run the
 * client code against a minimal DOM double. The double implements only what a safe renderer
 * needs, and every HTML-parsing entry point on it throws, so a renderer that reached for one
 * would fail here, not in a reader's browser.
 */

// ---- a minimal DOM double ----

const VOID_ELEMENTS: ReadonlySet<string> = new Set(['br']);
const HTML_SINK = 'HTML-parsing sink used';

class FakeNode {
  parentNode: FakeElement | null = null;
  readonly ownerDocument: FakeDocument;
  constructor(ownerDocument: FakeDocument) {
    this.ownerDocument = ownerDocument;
  }
}

class FakeText extends FakeNode {
  data: string;
  constructor(ownerDocument: FakeDocument, data: string) {
    super(ownerDocument);
    this.data = data;
  }
}

class FakeElement extends FakeNode {
  readonly childNodes: FakeNode[] = [];
  readonly attributes = new Map<string, string>();
  readonly localName: string;
  constructor(ownerDocument: FakeDocument, localName: string) {
    super(ownerDocument);
    this.localName = localName;
  }
  setAttribute(name: string, value: string): void {
    assert.equal(typeof value, 'string', `setAttribute(${name}) with a non-string`);
    this.attributes.set(name, value);
  }
  getAttribute(name: string): string | null {
    return this.attributes.get(name) ?? null;
  }
  appendChild<T extends FakeNode>(node: T): T {
    assert.ok(node instanceof FakeNode, 'appendChild with something that is not a node');
    assert.equal(node.ownerDocument, this.ownerDocument, 'a node from another document');
    if (VOID_ELEMENTS.has(this.localName)) throw new Error(`<${this.localName}> takes no children`);
    node.parentNode = this;
    this.childNodes.push(node);
    return node;
  }
  set textContent(value: string) {
    this.childNodes.length = 0;
    if (value !== '') this.appendChild(new FakeText(this.ownerDocument, String(value)));
  }
  get textContent(): string {
    return this.childNodes.map((node) => (node instanceof FakeText ? node.data : (node as FakeElement).textContent)).join('');
  }
  get children(): FakeElement[] {
    return this.childNodes.filter((node): node is FakeElement => node instanceof FakeElement);
  }
  set innerHTML(_: string) {
    throw new Error(HTML_SINK);
  }
  get innerHTML(): string {
    throw new Error(HTML_SINK);
  }
  set outerHTML(_: string) {
    throw new Error(HTML_SINK);
  }
  insertAdjacentHTML(): void {
    throw new Error(HTML_SINK);
  }
}

class FakeDocument {
  readonly created: FakeElement[] = [];
  createElement(tag: string): FakeElement {
    assert.match(tag, /^[a-z]+$/, `createElement(${tag})`);
    const element = new FakeElement(this, tag);
    this.created.push(element);
    return element;
  }
  createTextNode(data: string): FakeText {
    return new FakeText(this, data);
  }
  write(): void {
    throw new Error(HTML_SINK);
  }
}

/** Serialises the double as HTML, escaping text and attributes the way `renderCommentHtml` does. */
function serialize(node: FakeNode): string {
  if (node instanceof FakeText) return escapeHtml(node.data);
  const element = node as FakeElement;
  const attributes = [...element.attributes].map(([name, value]) => ` ${name}="${escapeHtml(value)}"`).join('');
  if (VOID_ELEMENTS.has(element.localName)) return `<${element.localName}${attributes}>`;
  return `<${element.localName}${attributes}>${element.childNodes.map(serialize).join('')}</${element.localName}>`;
}

/** A comment's text rendered by the client path, into a fresh container. */
function renderInDom(text: string): FakeElement {
  const document = new FakeDocument();
  const container = document.createElement('div');
  appendCommentText(container as unknown as Element, text);
  return container;
}

const innerOf = (element: FakeElement) => element.childNodes.map(serialize).join('');

/** Every element under `root` (not `root` itself). */
function descendants(root: FakeElement): FakeElement[] {
  return root.children.flatMap((child) => [child, ...descendants(child)]);
}

const TEXT_ELEMENTS: ReadonlySet<string> = new Set(['p', 'br', 'a']);
const TEXT_ATTRIBUTES: ReadonlySet<string> = new Set(['href', 'rel', 'target', 'dir']);

/** The plan's shape rule for comment text: elements p, br and a only; attributes href, rel, target and dir only; every href http(s). */
function assertTextShape(container: FakeElement, label: string): void {
  for (const element of descendants(container)) {
    assert.ok(TEXT_ELEMENTS.has(element.localName), `${label}: <${element.localName}>`);
    for (const name of element.attributes.keys()) assert.ok(TEXT_ATTRIBUTES.has(name), `${label}: attribute ${name} on <${element.localName}>`);
    if (element.localName === 'a') {
      const href = element.getAttribute('href') ?? '';
      assert.ok(URL.canParse(href), `${label}: href does not parse`);
      assert.match(new URL(href).protocol, /^https?:$/, `${label}: href scheme`);
      assert.equal(element.getAttribute('rel'), COMMENT_LINK_REL, label);
      assert.equal(element.getAttribute('target'), '_blank', label);
      assert.equal(element.getAttribute('dir'), 'ltr', label);
    } else {
      assert.equal(element.attributes.size, 0, `${label}: <${element.localName}> carries attributes`);
    }
  }
}

// ---- the golden corpus: SSR output frozen before S2 ----

interface GoldenCase {
  source: string;
  input: string;
  html: string;
}
const GOLDEN: { cases: GoldenCase[] } = JSON.parse(readFileSync(new URL('./comment-text.golden.json', import.meta.url), 'utf8'));

test('golden: the corpus covers every existing test input, the production data file and the adversarial set', () => {
  const sources = new Set(GOLDEN.cases.map((entry) => entry.source.split(' ')[0]));
  assert.deepEqual([...sources].sort(), ['adversarial', 'existing', 'production']);
  assert.ok(GOLDEN.cases.length >= 120, `${GOLDEN.cases.length} cases`);
});

test('golden: renderCommentHtml over commentTextBlocks is byte-identical to the renderer before it, for every case', () => {
  for (const { input, html } of GOLDEN.cases) assert.equal(renderCommentHtml(input), html, JSON.stringify(input.slice(0, 80)));
});

test('golden: the DOM path builds exactly what the server renders, for every case', () => {
  for (const { input, html } of GOLDEN.cases) assert.equal(innerOf(renderInDom(input)), html, JSON.stringify(input.slice(0, 80)));
});

test('the DOM output carries no element but p, br and a, and no attribute but href, rel, target and dir, for every case', () => {
  for (const { input } of GOLDEN.cases) assertTextShape(renderInDom(input), JSON.stringify(input.slice(0, 80)));
});

// ---- adversarial inputs, asserted on the DOM directly ----

test('<script> and an attribute break-out stay text: no element is created for them', () => {
  for (const hostile of ['<script>alert(1)</script>', '"><img src=x onerror=alert(1)>', "'><svg onload=alert(1)>"]) {
    const container = renderInDom(hostile);
    assert.deepEqual(descendants(container).map((element) => element.localName), ['p'], hostile);
    assert.equal(container.textContent, hostile);
  }
});

test('an attribute break-out after a URL ends the href; the rest is text', () => {
  const container = renderInDom('https://x.example/"><img src=x onerror=alert(1)>');
  const [link] = descendants(container).filter((element) => element.localName === 'a');
  assert.equal(link.getAttribute('href'), 'https://x.example/');
  assert.equal(container.textContent, 'https://x.example/"><img src=x onerror=alert(1)>');
});

test('javascript:, data: and //host are never links', () => {
  for (const hostile of ['javascript:alert(1)', 'see javascript:alert(document.domain) now', 'data:text/html,<script>alert(1)</script>', '//evil.example/path', 'go to //evil.example now']) {
    const container = renderInDom(hostile);
    assert.equal(descendants(container).filter((element) => element.localName === 'a').length, 0, hostile);
    assert.equal(container.textContent, hostile);
  }
});

test('an IDN homograph host is linked and labelled in its punycode form', () => {
  const [link] = descendants(renderInDom('https://\u0430pple.com/login')).filter((element) => element.localName === 'a');
  assert.equal(link.getAttribute('href'), 'https://xn--pple-43d.com/login');
  assert.equal(link.textContent, 'https://xn--pple-43d.com/login');
});

test('a 2,048-character URL keeps its whole href; its label is cut after the host', () => {
  const url = `https://example.com/${'a'.repeat(2048 - 'https://example.com/'.length)}`;
  assert.equal(url.length, 2048);
  const [link] = descendants(renderInDom(url)).filter((element) => element.localName === 'a');
  assert.equal(link.getAttribute('href'), url);
  assert.ok(link.textContent.endsWith('…'));
  assert.ok(Array.from(link.textContent).length <= 80);
});

test('bidi overrides, U+2028 and U+2029 are stripped from text and from links', () => {
  const container = renderInDom('abc\u202Egnp.exe \u2066x\u2069 line\u2028sep\u2029end https://example.com/\u202Eexe.txt');
  assert.doesNotMatch(container.textContent, /[\u202A-\u202E\u2066-\u2069\u2028\u2029]/);
  for (const element of descendants(container)) for (const value of element.attributes.values()) assert.doesNotMatch(value, /[\u202A-\u202E\u2066-\u2069\u2028\u2029]/);
});

test('zero-width joiners are kept in text, and appear in an href only percent-encoded', () => {
  const family = '\u{1F469}\u200D\u{1F469}\u200D\u{1F467}';
  assert.equal(renderInDom(family).textContent, family);
  const [link] = descendants(renderInDom('https://example.com/a\u200Db')).filter((element) => element.localName === 'a');
  assert.equal(link.getAttribute('href'), 'https://example.com/a%E2%80%8Db');
});

test('lone surrogates are stripped: the DOM never receives an unpaired surrogate', () => {
  for (const input of ['a\uD800b', '\uDFFF', 'https://example.com/\uD800x', 'https://exam\uD800ple.com/']) {
    const container = renderInDom(input);
    assert.ok(container.textContent.isWellFormed(), JSON.stringify(input));
    for (const element of descendants(container)) for (const value of element.attributes.values()) assert.ok(value.isWellFormed());
  }
});

test('2,000-character text renders whole; empty text appends nothing', () => {
  const long = 'x'.repeat(COMMENT_TEXT_MAX);
  assert.equal(renderInDom(long).textContent, long);
  assert.equal(renderInDom('').childNodes.length, 0);
  assert.equal(renderInDom('\n \n').childNodes.length, 0);
});

test('appendCommentText appends after what the element already holds', () => {
  const document = new FakeDocument();
  const container = document.createElement('div');
  container.appendChild(document.createElement('p'));
  appendCommentText(container as unknown as Element, 'one\n\ntwo');
  assert.equal(innerOf(container), '<p></p><p>one</p><p>two</p>');
});

test('the link wall: a hand-built block whose href is not an http(s) URL the parser accepts renders as text', () => {
  for (const href of ['javascript:alert(1)', 'data:text/html,x', '//evil.example/', 'https://user@evil.example/', 'https://127.0.0.1/', 'https://EXAMPLE.com/']) {
    const document = new FakeDocument();
    const container = document.createElement('div');
    appendCommentBlocks(container as unknown as Element, [[[{ href, label: 'click me' }]]]);
    assert.equal(innerOf(container), '<p>click me</p>', href);
  }
});

test('the link wall lets a block from commentTextBlocks through unchanged', () => {
  const blocks = commentTextBlocks('see https://example.com/a');
  const document = new FakeDocument();
  const container = document.createElement('div');
  appendCommentBlocks(container as unknown as Element, blocks);
  assert.equal(innerOf(container), renderCommentHtml('see https://example.com/a'));
});

// ---- no HTML-parsing sink in the client modules ----

test('source: the client modules use no HTML-parsing sink', () => {
  const sinks = /\binnerHTML\b|\bouterHTML\b|\binsertAdjacentHTML\b|\bdocument\s*\.\s*write(?:ln)?\b|\bDOMParser\b|\bcreateContextualFragment\b|\bsetHTML(?:Unsafe)?\b|\bparseHTMLUnsafe\b|\bsrcdoc\b/;
  // S3 adds the loader's decisions and the two browser scripts that build the thread and the index rows;
  // R4 the shared data-host loader and the reactions component, which renders totals read from it.
  for (const file of ['./comment-dom.ts', './comment-text.ts', './comments-client.ts', './date-format.ts', './data-host.ts', './reactions.ts', '../components/CommentsLive.astro', '../components/CommentIndexLive.astro', '../components/Reactions.astro']) {
    const source = readFileSync(new URL(file, import.meta.url), 'utf8');
    assert.doesNotMatch(source, sinks, file);
  }
});

test('source: the sink pattern itself catches what it is meant to', () => {
  const sinks = /\binnerHTML\b|\bouterHTML\b|\binsertAdjacentHTML\b|\bdocument\s*\.\s*write(?:ln)?\b/;
  for (const line of ['el.innerHTML = x', 'el.outerHTML=x', "el.insertAdjacentHTML('beforeend', x)", 'document.write(x)', 'document . writeln(x)']) assert.match(line, sinks, line);
});

// ---- validateCommentFile ----

const SLUG = 'the-gap-between-the-needles';
const ID = '01M3JH9AQ189W4RQ1ZPEZEPMKS';
const comment = (overrides: Record<string, unknown> = {}) => ({ id: ID, name: 'Michel', text: 'I love it :) \nnice poem Mai :)', at: '2026-09-27T22:55:32.065Z', ...overrides });
const file = (overrides: Record<string, unknown> = {}) => ({ version: 1, slug: SLUG, generatedAt: '2026-09-27T22:55:32.065Z', comments: [comment()], ...overrides });

const refused = (value: unknown, reason: RegExp) => {
  const result = validateCommentFile(value, SLUG);
  assert.equal(result.ok, false, JSON.stringify(value)?.slice(0, 120));
  if (!result.ok) assert.match(result.reason, reason);
};

test('validateCommentFile accepts the production file and returns its comments', () => {
  assert.deepEqual(validateCommentFile(file(), SLUG), {
    ok: true,
    comments: [{ id: ID, name: 'Michel', text: 'I love it :) \nnice poem Mai :)', at: '2026-09-27T22:55:32.065Z', signedIn: false }],
  });
});

test('validateCommentFile strips forbidden characters from name and text, and keeps signedIn true', () => {
  const result = validateCommentFile(file({ comments: [comment({ name: 'Ada\u202E', text: 'hi\u200B there', signedIn: true })] }), SLUG);
  assert.deepEqual(result.ok && result.comments[0], { id: ID, name: 'Ada', text: 'hi there', at: '2026-09-27T22:55:32.065Z', signedIn: true });
});

test('validateCommentFile ignores fields the page does not show (generatedAt, a later additive key)', () => {
  assert.equal(validateCommentFile(file({ generatedAt: undefined, extra: 1, comments: [comment({ future: 'x' })] }), SLUG).ok, true);
  assert.deepEqual(validateCommentFile(file({ comments: [] }), SLUG), { ok: true, comments: [] });
});

test('validateCommentFile refuses a file that is not this page\'s, or not version 1', () => {
  for (const value of [null, 'text', 42, [], undefined]) refused(value, /not a JSON object/);
  refused(file({ version: 2 }), /version/);
  refused(file({ version: '1' }), /version/);
  refused(file({ slug: 'another-story' }), /slug/);
  refused(file({ slug: undefined }), /slug/);
});

test('validateCommentFile refuses a comments field that is not an array, or too long', () => {
  refused(file({ comments: undefined }), /not an array/);
  refused(file({ comments: { 0: comment() } }), /not an array/);
  const many = Array.from({ length: COMMENTS_PER_FILE_MAX + 1 }, () => comment());
  refused(file({ comments: many }), /more than 2000/);
});

test('validateCommentFile refuses the whole file for one bad comment, naming the field and never its value', () => {
  const secretish = '<script>alert(1)</script>';
  const cases: Array<[Record<string, unknown> | unknown, RegExp]> = [
    ['not an object', /comments\[1\] is not an object/],
    [comment({ id: 'not-a-ulid' }), /comments\[1\]\.id is not a ULID/],
    [comment({ id: '81M3JH9AQ189W4RQ1ZPEZEPMKS' }), /id is not a ULID/],
    [comment({ id: 7 }), /id is not a ULID/],
    [comment(), /id is not unique/],
    [comment({ id: '01M3JH9AQ189W4RQ1ZPEZEPMKT', name: '' }), /name is not a string of 1 to 60/],
    [comment({ id: '01M3JH9AQ189W4RQ1ZPEZEPMKT', name: 'n'.repeat(COMMENT_NAME_MAX + 1) }), /name is not a string/],
    [comment({ id: '01M3JH9AQ189W4RQ1ZPEZEPMKT', name: 5 }), /name is not a string/],
    [comment({ id: '01M3JH9AQ189W4RQ1ZPEZEPMKT', name: '\u200B\u202E' }), /name has no visible character/],
    [comment({ id: '01M3JH9AQ189W4RQ1ZPEZEPMKT', text: '' }), /text is not a string of 1 to 2000/],
    [comment({ id: '01M3JH9AQ189W4RQ1ZPEZEPMKT', text: 't'.repeat(COMMENT_TEXT_MAX + 1) }), /text is not a string/],
    [comment({ id: '01M3JH9AQ189W4RQ1ZPEZEPMKT', text: ['x'] }), /text is not a string/],
    [comment({ id: '01M3JH9AQ189W4RQ1ZPEZEPMKT', text: '\uFEFF \n' }), /text has no visible character/],
    [comment({ id: '01M3JH9AQ189W4RQ1ZPEZEPMKT', at: 'yesterday' }), /at is not a time/],
    [comment({ id: '01M3JH9AQ189W4RQ1ZPEZEPMKT', at: 1_700_000_000 }), /at is not a time/],
    [comment({ id: '01M3JH9AQ189W4RQ1ZPEZEPMKT', signedIn: false }), /signedIn is neither absent nor true/],
    [comment({ id: '01M3JH9AQ189W4RQ1ZPEZEPMKT', signedIn: 'true' }), /signedIn/],
    [comment({ id: '01M3JH9AQ189W4RQ1ZPEZEPMKT', name: secretish, at: 'x' }), /at is not a time/],
  ];
  for (const [bad, reason] of cases) {
    const result = validateCommentFile(file({ comments: [comment(), bad] }), SLUG);
    assert.equal(result.ok, false, String(reason));
    if (!result.ok) {
      assert.match(result.reason, reason);
      assert.ok(!result.reason.includes(secretish));
    }
  }
});

test('validateCommentFile counts lengths in code points, as the contract does: 2,000 emoji are within the cap', () => {
  const emoji = '\u{1F98A}'.repeat(COMMENT_TEXT_MAX);
  assert.equal(validateCommentFile(file({ comments: [comment({ text: emoji, name: '\u{1F98A}'.repeat(COMMENT_NAME_MAX) })] }), SLUG).ok, true);
});

test('validateCommentFile throws on a page slug that is not a slug: a caller bug, not a bad file', () => {
  assert.throws(() => validateCommentFile(file(), '../etc'), TypeError);
  assert.throws(() => validateCommentFile(file(), ''), TypeError);
});

// ---- renderCommentList ----

const formatTime = (date: Date) => `T${date.toISOString()}`;
const LIST_ELEMENTS: ReadonlySet<string> = new Set(['ol', 'li', 'article', 'header', 'span', 'a', 'time', 'div', 'p', 'br']);
const LIST_ATTRIBUTES: ReadonlySet<string> = new Set(['class', 'id', 'aria-labelledby', 'dir', 'title', 'href', 'datetime', 'rel', 'target']);

function renderList(comments: ClientComment[]): FakeElement {
  return renderCommentList(new FakeDocument() as unknown as Document, comments, { formatTime }) as unknown as FakeElement;
}

test('renderCommentList builds the markup Comments.astro renders, from DOM nodes', () => {
  const list = renderList([
    { id: ID, name: 'Michel', text: 'hi https://example.com/x.', at: '2026-09-27T22:55:32.065Z', signedIn: true },
    { id: '01M3JH9AQ189W4RQ1ZPEZEPMKT', name: 'Ada', text: 'one', at: '2026-09-28T00:00:00Z', signedIn: false },
  ]);
  assert.equal(
    serialize(list),
    '<ol class="comment-list">' +
      `<li><article class="comment" id="c-${ID}" aria-labelledby="c-${ID}-name"><header class="comment__meta">` +
      `<span class="comment__name" id="c-${ID}-name" dir="auto">Michel</span>` +
      `<span class="comment__signed" title="${COMMENT_SIGNED_IN_TITLE}">Signed in</span>` +
      `<a class="comment__time" href="#c-${ID}" title="Link to this comment"><time datetime="2026-09-27T22:55:32.065Z">T2026-09-27T22:55:32.065Z</time></a>` +
      `<span class="comment__id" title="${escapeHtml(COMMENT_ID_TITLE)}">${ID}</span></header>` +
      `<div class="comment__text" dir="auto">${renderCommentHtml('hi https://example.com/x.')}</div></article></li>` +
      '<li><article class="comment" id="c-01M3JH9AQ189W4RQ1ZPEZEPMKT" aria-labelledby="c-01M3JH9AQ189W4RQ1ZPEZEPMKT-name"><header class="comment__meta">' +
      '<span class="comment__name" id="c-01M3JH9AQ189W4RQ1ZPEZEPMKT-name" dir="auto">Ada</span>' +
      '<a class="comment__time" href="#c-01M3JH9AQ189W4RQ1ZPEZEPMKT" title="Link to this comment"><time datetime="2026-09-28T00:00:00Z">T2026-09-28T00:00:00.000Z</time></a>' +
      `<span class="comment__id" title="${escapeHtml(COMMENT_ID_TITLE)}">01M3JH9AQ189W4RQ1ZPEZEPMKT</span></header>` +
      '<div class="comment__text" dir="auto"><p>one</p></div></article></li></ol>',
  );
});

test('renderCommentList: a hostile name is one text node, and the list carries only its own elements and attributes', () => {
  const list = renderList([{ id: ID, name: '<img src=x onerror=alert(1)>', text: '"><script>alert(1)</script> https://example.com/', at: '2026-09-27T22:55:32Z', signedIn: false }]);
  const name = descendants(list).find((element) => element.getAttribute('class') === 'comment__name');
  assert.equal(name?.childNodes.length, 1);
  assert.equal(name?.textContent, '<img src=x onerror=alert(1)>');
  for (const element of descendants(list)) {
    assert.ok(LIST_ELEMENTS.has(element.localName), element.localName);
    for (const attribute of element.attributes.keys()) assert.ok(LIST_ATTRIBUTES.has(attribute), attribute);
  }
  const text = descendants(list).find((element) => element.getAttribute('class') === 'comment__text');
  assert.ok(text);
  assertTextShape(text, 'list text');
});

test('renderCommentList of no comments is an empty list', () => {
  assert.equal(serialize(renderList([])), '<ol class="comment-list"></ol>');
});

test('end to end: a validated file renders through the list without touching an HTML sink', () => {
  const result = validateCommentFile(file({ comments: [comment({ text: 'a\u202Eb https://example.com/' })] }), SLUG);
  assert.ok(result.ok);
  const list = renderList(result.comments);
  assert.doesNotMatch(list.textContent, /\u202E/);
  assert.equal(descendants(list).filter((element) => element.localName === 'a' && element.getAttribute('rel') === COMMENT_LINK_REL).length, 1);
});

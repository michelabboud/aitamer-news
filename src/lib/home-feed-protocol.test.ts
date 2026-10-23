import assert from 'node:assert/strict';
import { test } from 'node:test';
import { parse } from 'parse5';
import { batchUrl, validateBatchTree, type FeedTree, type BatchExpectation } from './home-feed-protocol.ts';

const snapshot = 'a'.repeat(64);
const expected: BatchExpectation = { snapshot, index: 1, offset: 12, count: 2, seenIds: new Set(['lead']), pageUrl: 'https://example.com/base/' };
function tree(html: string): FeedTree {
  function convert(node: any): FeedTree {
    return { tag: node.tagName ?? '', namespace: node.namespaceURI, text: node.nodeName === '#text' ? node.value : '', attrs: node.attrs ?? [], children: (node.content?.childNodes ?? node.childNodes ?? []).map(convert) };
  }
  return convert(parse(html));
}
const card = (id: string) => `<li data-home-post="${id}" id="home-post-${id}"><article class="card"><h3><a href="/base/posts/${id}/">${id}</a></h3><picture><source type="image/webp" srcset="https://cdn.example.com/${id}.webp 480w" sizes="100vw"><img src="https://cdn.example.com/${id}.jpg" loading="lazy" width="1600" height="900" alt=""></picture><span style="background: var(--wild-2)"></span></article></li>`;
const batch = (changes: { snapshot?: string; index?: number; offset?: number; count?: number; ids?: string[]; content?: string } = {}) => `<template data-home-feed-schema="1" data-home-feed-snapshot="${changes.snapshot ?? snapshot}" data-home-feed-index="${changes.index ?? 1}" data-home-feed-offset="${changes.offset ?? 12}" data-home-feed-count="${changes.count ?? 2}" data-home-feed-ids='${JSON.stringify(changes.ids ?? ['a', 'b'])}' data-pagefind-ignore>${changes.content ?? card('a') + card('b')}</template>`;

test('exact batch URLs honor the deployment base and reject foreign or ambiguous paths', () => {
  assert.equal(batchUrl('/base/home-feed/', 2, expected.pageUrl), 'https://example.com/base/home-feed/2/');
  for (const prefix of ['https://evil.test/base/home-feed/', '//evil.test/home-feed/', '/home-feed/', '/base/x/../home-feed/', '/base/home-feed/?x=']) {
    assert.throws(() => batchUrl(prefix, 1, expected.pageUrl), /URL/);
  }
});

test('whole valid inert batch retains ordered unique post IDs', () => {
  assert.deepEqual(validateBatchTree(tree(batch()), expected), ['a', 'b']);
  assert.deepEqual(validateBatchTree(tree(batch({ ids: ['model--preview', 'trailing-'], content: card('model--preview') + card('trailing-') })), expected), ['model--preview', 'trailing-']);
  assert.deepEqual(validateBatchTree(tree(batch({ content: card('a').replace('--wild-2', '--wild-empty') + card('b') })), expected), ['a', 'b']);
});

test('metadata, duplicate IDs, existing IDs, extra content and wrong card counts fail before append', () => {
  for (const changes of [
    { snapshot: 'b'.repeat(64) }, { index: 2 }, { offset: 13 }, { count: 1 }, { ids: ['a', 'a'] }, { ids: ['lead', 'b'] },
    { content: card('a') }, { content: card('a') + card('c') },
  ]) assert.throws(() => validateBatchTree(tree(batch(changes)), expected));
  assert.throws(() => validateBatchTree(tree(batch() + batch()), expected));
  assert.throws(() => validateBatchTree(tree('<h1>unexpected</h1>' + batch()), expected));
});

test('scripts, handlers, unsafe URLs, nested templates, CSS, foreign namespaces and active embeds fail closed', () => {
  for (const active of [
    '<script>alert(1)</script>', '<img src="/x.jpg" onerror="alert(1)">', '<a href="javascript:alert(1)">x</a>',
    '<a href="https://evil.test/">x</a>', '<template>x</template>', '<svg><a href="/x">x</a></svg>',
    '<iframe src="/x"></iframe>', '<style>body{display:none}</style>', '<span style="background:url(/track)"></span>',
    '<img src="data:image/svg+xml,x">', '<img src="/x" srcset="javascript:alert(1) 1x">',
  ]) assert.throws(() => validateBatchTree(tree(batch({ content: card('a').replace('</article>', `${active}</article>`) + card('b') })), expected));
});

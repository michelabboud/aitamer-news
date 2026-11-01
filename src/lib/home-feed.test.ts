import assert from 'node:assert/strict';
import { test } from 'node:test';
import { partitionHomeFeed, validateHomeFeedSettings } from './home-feed.ts';
import { homeFeedSnapshot, renderingFingerprint } from './home-feed-snapshot.ts';

const settings = { initialPostCount: 12, nextBatchSize: 12, maxAutoBatches: 5 };
const posts = (count: number) => Array.from({ length: count }, (_, i) => ({ id: `p${i}`, data: { pubDate: new Date(100000 - Math.floor(i / 2)) } }));

for (const count of [0, 1, 3, 12, 13, 71, 72, 73]) {
  test(`homepage ${count} posts is a finite chronological prefix without duplicates or gaps`, () => {
    const input = posts(count);
    const result = partitionHomeFeed(input, settings);
    const shown = [...(result.lead ? [result.lead] : []), ...result.initialCards, ...result.batches.flatMap((batch) => batch.posts)];
    assert.deepEqual(shown, input.slice(0, 72));
    assert.equal(new Set(shown.map((post) => post.id)).size, shown.length);
    assert.deepEqual(result.log, input.slice(1, 9), 'the Field log is the newest posts after the lead');
    assert.equal(result.batches.length, Math.ceil(Math.max(0, Math.min(count, 72) - 12) / 12));
    for (const batch of result.batches) {
      assert.equal(batch.offset, 12 + (batch.index - 1) * 12);
      assert.deepEqual(batch.posts, input.slice(batch.offset, batch.offset + 12));
    }
  });
}

test('independent settings, initial one, and a zero cap preserve every boundary', () => {
  const input = posts(100);
  const different = partitionHomeFeed(input, { initialPostCount: 3, nextBatchSize: 7, maxAutoBatches: 2 });
  assert.equal(different.initialCards.length, 2);
  assert.deepEqual(different.batches.map((batch) => [batch.offset, batch.posts.length]), [[3, 7], [10, 7]]);
  assert.equal(different.log[0].id, 'p1');
  const one = partitionHomeFeed(input, { initialPostCount: 1, nextBatchSize: 2, maxAutoBatches: 1 });
  assert.deepEqual(one.initialCards, []);
  assert.deepEqual(one.batches[0].posts.map((post) => post.id), ['p1', 'p2']);
  const disabled = partitionHomeFeed(input, { ...settings, maxAutoBatches: 0 });
  assert.deepEqual(disabled.batches, []);
  assert.equal(disabled.log[0].id, 'p1');
});

test('invalid counts, duplicate IDs and out of order posts fail at the server boundary', () => {
  for (const key of ['initialPostCount', 'nextBatchSize'] as const) {
    for (const value of [0, -1, 1.5, 61, NaN, Infinity, Number.MAX_SAFE_INTEGER + 1]) {
      assert.throws(() => validateHomeFeedSettings({ ...settings, [key]: value }), /settings/);
    }
  }
  for (const value of [-1, 1.5, 11, NaN, Infinity]) assert.throws(() => validateHomeFeedSettings({ ...settings, maxAutoBatches: value }), /settings/);
  assert.throws(() => partitionHomeFeed([posts(1)[0], posts(1)[0]], settings), /duplicate/);
  assert.throws(() => partitionHomeFeed(posts(4).reverse(), settings), /sorted/);
});

test('snapshot is deterministic and changes with ordered content, authors, config and rendering source', () => {
  const input = { settings, postStamps: ['a@1', 'b@2'], authorStamps: ['z@1', 'a@2'], renderingSource: renderingFingerprint([['a.ts', 'one'], ['b.astro', 'two']]) };
  const snapshot = homeFeedSnapshot(input);
  assert.match(snapshot, /^[a-f0-9]{64}$/);
  assert.equal(snapshot, homeFeedSnapshot({ ...input, authorStamps: [...input.authorStamps].reverse() }));
  for (const change of [
    { postStamps: ['b@2', 'a@1'] }, { postStamps: ['a@3', 'b@2'] }, { authorStamps: ['a@3', 'z@1'] },
    { settings: { ...settings, nextBatchSize: 6 } }, { renderingSource: renderingFingerprint([['a.ts', 'changed'], ['b.astro', 'two']]) },
  ]) assert.notEqual(snapshot, homeFeedSnapshot({ ...input, ...change }));
  assert.equal(renderingFingerprint([['b.astro', 'two'], ['a.ts', 'one']]), input.renderingSource);
});

test('the Field log is the latest news: newest first, right after the lead, never the lead itself', () => {
  const input = posts(100);
  const result = partitionHomeFeed(input, settings);
  assert.deepEqual(result.log.map((post) => post.id), ['p1', 'p2', 'p3', 'p4', 'p5', 'p6', 'p7', 'p8']);
  for (let i = 1; i < result.log.length; i++) assert.ok(result.log[i - 1].data.pubDate >= result.log[i].data.pubDate);
  assert.ok(!result.log.includes(result.lead));
  assert.deepEqual(partitionHomeFeed(posts(1), settings).log, []);
});

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { isHomeFeedBatchPath } from './home-feed-discovery.ts';
test('batch discovery respects root and project bases', () => {
  assert.equal(isHomeFeedBatchPath('/home-feed/1/'), true);
  assert.equal(isHomeFeedBatchPath('/demo/home-feed/5/', '/demo/'), true);
  for (const path of ['/authors/', '/news/', '/posts/home-feed/', '/demo/home-feed/1/']) assert.equal(isHomeFeedBatchPath(path), false);
  assert.equal(isHomeFeedBatchPath('/home-feed/1/', '/demo/'), false);
});

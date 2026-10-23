import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createHistoryWriteGate } from './home-feed-browser.ts';

test('continuous scroll is bounded while leaving the page saves the exact final position', () => {
  let now = 0;
  const due = createHistoryWriteGate(() => now);
  let writes = 0;
  for (let frame = 0; frame < 1800; frame++) {
    now = frame * (1000 / 60);
    if (due()) writes++;
  }
  assert.ok(writes <= 30, `unexpected ${writes} writes during thirty seconds of scrolling`);
  assert.ok(writes >= 29);
  assert.equal(due(true), true, 'pagehide must bypass the scroll interval');
  assert.equal(due(), false, 'the next scroll event must not write again');
  now += 1000;
  assert.equal(due(), true);
});

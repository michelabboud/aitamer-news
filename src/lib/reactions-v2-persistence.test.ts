import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadPersistentReactionV2Totals, openReactionV2FenceStore, type PersistentReactionV2State } from './reactions-v2-persistence.ts';

const slug = 'a-story';
const base = 'https://data.aitamer.news/';

test('invalid origin, missing IndexedDB and storage getter exceptions fail closed before any fetch', async () => {
  for (const options of [
    { base: 'http://public.example/' },
    { openStore: () => { throw new DOMException('fixture blocked', 'SecurityError'); } },
    { openStore: (url: string, story: string, unavailable: () => void) => openReactionV2FenceStore(url, story, unavailable, undefined) },
  ]) {
    const states: PersistentReactionV2State[] = [];
    let calls = 0;
    const reader = loadPersistentReactionV2Totals({ base, slug, ...options, onState: state => states.push(state), fetchImpl: async () => { calls++; return new Response('{}'); } });
    await reader.initial; await reader.retry(); await reader.refresh();
    assert.equal(calls, 0); assert.equal(states.length, 1); assert.equal(states[0].fenceFailure, true);
    reader.dispose();
  }
});

test('an IndexedDB open request that never completes has a bounded deadline', async context => {
  context.mock.timers.enable({ apis: ['setTimeout'] });
  const request = {} as IDBOpenDBRequest;
  const pending = openReactionV2FenceStore(base + `v2/reactions/${slug}.json`, slug, () => {}, { open: () => request } as unknown as IDBFactory);
  const rejected = assert.rejects(pending, /IndexedDB could not be opened/);
  context.mock.timers.tick(10_000);
  await rejected;
  context.mock.timers.reset();
});

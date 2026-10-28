import { test } from 'node:test';
import assert from 'node:assert/strict';
import { issueReactionStream, sendReactionIntent, validateReactionStream, validateReactionReceipt, reactionReceiptEndpoint, type ReactionStream } from './reaction-receipts.ts';
const now = Date.parse('2026-10-28T00:00:00.000Z');
const stream: ReactionStream = { ok: true, version: 1, slug: 'a-story', stream: 'a'.repeat(32), capability: 'e30.' + 'b'.repeat(43), expiresAt: '2026-11-27T00:00:00.000Z' };
const intent = { sequence: '1', operation: 'c'.repeat(32), reaction: 'love' as const };
const receipt = { ok: true, version: 1, slug: stream.slug, stream: stream.stream, sequence: intent.sequence, operation: intent.operation, processedThrough: '1', generation: '9007199254740993', expiresAt: stream.expiresAt };

test('private wire validates scope, exact fields, nonce/expiry bounds and canonical int64 receipts', () => {
  assert.equal(validateReactionStream(stream, stream.slug, now), true);
  for (const change of [{ slug: 'other' }, { private: true }, { stream: 'A'.repeat(32) }, { capability: 'x'.repeat(513) }, { capability: stream.capability + '\n' }, { expiresAt: '2026-02-30T00:00:00.000Z' }, { expiresAt: '2026-12-28T00:00:00.000Z' }]) assert.equal(validateReactionStream({ ...stream, ...change }, stream.slug, now), false);
  assert.equal(validateReactionReceipt(receipt, stream, intent), true);
  for (const field of ['generation', 'processedThrough']) for (const value of ['0', '01', 1, '+1', '1\n', '9223372036854775808']) assert.equal(validateReactionReceipt({ ...receipt, [field]: value }, stream, intent), false);
  for (const change of [{ slug: 'other' }, { stream: 'd'.repeat(32) }, { sequence: '2' }, { operation: 'd'.repeat(32) }, { expiresAt: '2026-11-26T00:00:00.000Z' }, { reaction: 'love' }, { banned: false }]) assert.equal(validateReactionReceipt({ ...receipt, ...change }, stream, intent), false);
});

test('private requests omit credentials, keep capability out of URLs, and bind replies to issued intent', async () => {
  assert.equal(reactionReceiptEndpoint('https://comments.example/prefix/react', 'intent'), 'https://comments.example/prefix/react/v1/intent');
  for (const endpoint of ['http://public.example/react', 'https://x.example/react?q=secret', 'https://user@x.example/react']) assert.throws(() => reactionReceiptEndpoint(endpoint, 'stream'));
  const issued = await issueReactionStream('https://comments.example/react', stream.slug, now, async (url, init) => {
    assert.equal(url, 'https://comments.example/react/v1/stream'); assert.equal(init.credentials, 'omit'); assert.equal(init.redirect, 'error'); assert.equal(init.mode, 'cors');
    assert.deepEqual(JSON.parse(init.body as string), { version: 1, slug: stream.slug }); return new Response(JSON.stringify(stream));
  });
  assert.equal(issued.ok, true);
  const answer = await sendReactionIntent('https://comments.example/react', stream, intent, async (url, init) => {
    assert.equal(url.includes(stream.capability), false); assert.equal(url.includes(intent.operation), false);
    assert.deepEqual(JSON.parse(init.body as string), { version: 1, slug: stream.slug, capability: stream.capability, ...intent }); return new Response(JSON.stringify(receipt));
  });
  assert.equal(answer.ok, true);
});

test('oversize, hostile UTF8, duplicate keys, extra disclosure and failures are not receipts', async () => {
  for (const body of [' '.repeat(2049), new Uint8Array([0xc3, 0x28]), JSON.stringify(receipt).replace('"ok":true', '"ok":false,"ok":true'), JSON.stringify({ ...receipt, previousReaction: 'wow' }), JSON.stringify({ ...receipt, operation: 'd'.repeat(32) })]) {
    const answer = await sendReactionIntent('https://comments.example/react', stream, intent, async () => new Response(body)); assert.equal(answer.ok, false);
  }
  for (const status of [403, 409, 410, 429, 503]) {
    assert.deepEqual(await sendReactionIntent('https://comments.example/react', stream, intent, async () => new Response('{}', { status })), { ok: false, status });
  }
  assert.deepEqual(await sendReactionIntent('https://comments.example/react', stream, intent, async () => { throw Error('offline'); }), { ok: false, status: null });
});

test('terminal closure validates all-sequence scope and remains valid after recovery grace', async () => {
  const { validateReactionClosure, closeReactionStream } = await import('./reaction-receipts.ts');
  const closure = { ok: true, version: 1, kind: 'closed', slug: stream.slug, stream: stream.stream, processedThrough: '9223372036854775807', generation: '9007199254740994', expiresAt: stream.expiresAt, recoverUntil: '2026-11-28T00:00:00.000Z' };
  assert.equal(validateReactionClosure(closure, stream), true);
  for (const change of [{ kind: 'processed' }, { slug: 'other' }, { stream: 'd'.repeat(32) }, { processedThrough: '256' }, { generation: '9223372036854775808' }, { recoverUntil: '2026-11-29T00:00:00.000Z' }, { previousReaction: 'wow' }]) assert.equal(validateReactionClosure({ ...closure, ...change }, stream), false);
  const answer = await closeReactionStream('https://comments.example/react', stream, async (url, init) => {
    assert.equal(url, 'https://comments.example/react/v1/close'); assert.deepEqual(JSON.parse(init.body as string), { version: 1, slug: stream.slug, capability: stream.capability }); return new Response(JSON.stringify(closure));
  });
  assert.equal(answer.ok, true);
});

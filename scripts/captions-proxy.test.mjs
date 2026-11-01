// The captions proxy (functions/videos/[[path]].js): only caption paths, only GET and HEAD,
// only an upstream 200 under the size cap, and nothing from the reader's request goes upstream.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { captionSource, handleCaptions, MAX_BYTES, MEDIA_UPSTREAM, UPSTREAM } from '../functions/videos/[[path]].js';

const VTT = 'WEBVTT\n\n00:00.000 --> 00:01.000\nHello\n';
const PATH = '/videos/leann-explainer/leann-explainer-v2.en.vtt';

function fakeFetch(response) {
  const calls = [];
  const impl = async (url, init) => {
    calls.push({ url, init });
    return typeof response === 'function' ? response() : response.clone();
  };
  return { impl, calls };
}
const upstreamOk = () => new Response(VTT, { status: 200, headers: { 'content-type': 'text/plain', 'set-cookie': 'a=b', 'x-upstream': '1' } });

test('serves a caption file as text/vtt with the fixed headers only', async () => {
  const { impl, calls } = fakeFetch(upstreamOk);
  const res = await handleCaptions(new Request(`https://aitamer.news${PATH}?x=1`, { headers: { cookie: 'session=1', authorization: 'Bearer x' } }), impl);
  assert.equal(res.status, 200);
  assert.equal(await res.text(), VTT);
  assert.equal(res.headers.get('content-type'), 'text/vtt; charset=utf-8');
  assert.equal(res.headers.get('x-content-type-options'), 'nosniff');
  assert.equal(res.headers.get('cache-control'), 'public, max-age=3600');
  assert.equal(res.headers.get('set-cookie'), null);
  assert.equal(res.headers.get('x-upstream'), null);
  assert.equal(calls.length, 1);
  assert.equal(calls[0].url, UPSTREAM + PATH, 'same path, no query');
  assert.equal(calls[0].init.headers, undefined, 'no reader headers sent upstream');
  assert.equal(calls[0].init.redirect, 'manual');
});

test('HEAD gets the headers and no body', async () => {
  const { impl } = fakeFetch(upstreamOk);
  const res = await handleCaptions(new Request(`https://aitamer.news${PATH}`, { method: 'HEAD' }), impl);
  assert.equal(res.status, 200);
  assert.equal(res.headers.get('content-type'), 'text/vtt; charset=utf-8');
  assert.equal(await res.text(), '');
});

test('other methods get 405 and never reach the bucket', async () => {
  for (const method of ['POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH']) {
    const { impl, calls } = fakeFetch(upstreamOk);
    const res = await handleCaptions(new Request(`https://aitamer.news${PATH}`, { method, body: method === 'OPTIONS' ? undefined : 'x' }), impl);
    assert.equal(res.status, 405, method);
    assert.equal(res.headers.get('allow'), 'GET, HEAD');
    assert.equal(calls.length, 0);
  }
});

test('anything but a caption path is 404 and never reaches the bucket', async () => {
  const paths = [
    '/videos/a/b.mp4', '/videos/a/b.vtt', '/videos/a/b.fr.vtt', '/videos/A/b.en.vtt', '/videos/a/b/c.en.vtt',
    '/videos/a/b.en.vtt/', '/videos/', '/videos/a/', '/videos/%2e%2e/b.en.vtt', '/videos/a/..%2fb.en.vtt',
    '/videos/a_b/c.en.vtt', `/videos/${'a'.repeat(121)}/b.en.vtt`, `/videos/a/${'b'.repeat(141)}.en.vtt`,
    '/videos/x/../../etc', '/videos/a/b.en.vtt%00',
  ];
  for (const path of paths) {
    const { impl, calls } = fakeFetch(upstreamOk);
    const res = await handleCaptions(new Request(`https://aitamer.news${path}`), impl);
    assert.equal(res.status, 404, path);
    assert.equal(calls.length, 0, path);
  }
});

test('only an upstream 200 is served', async () => {
  for (const status of [204, 206, 301, 302, 304, 403, 404, 500]) {
    const { impl } = fakeFetch(() => new Response(status === 204 || status === 304 ? null : 'x', { status, headers: { location: 'https://evil.example/' } }));
    const res = await handleCaptions(new Request(`https://aitamer.news${PATH}`), impl);
    assert.equal(res.status, 404, String(status));
    assert.equal(res.headers.get('location'), null);
  }
});

test('a network failure is 502', async () => {
  const res = await handleCaptions(new Request(`https://aitamer.news${PATH}`), async () => { throw new Error('down'); });
  assert.equal(res.status, 502);
});

test('a body over the cap is refused, declared or not', async () => {
  const big = new Uint8Array(MAX_BYTES + 1);
  const declared = await handleCaptions(new Request(`https://aitamer.news${PATH}`), async () => new Response(big, { status: 200, headers: { 'content-length': String(big.byteLength) } }));
  assert.equal(declared.status, 404);
  const streamed = await handleCaptions(new Request(`https://aitamer.news${PATH}`), async () => new Response(new ReadableStream({
    start(c) { c.enqueue(new Uint8Array(MAX_BYTES)); c.enqueue(new Uint8Array(1)); c.close(); },
  }), { status: 200 }));
  assert.equal(streamed.status, 404);
  const exact = await handleCaptions(new Request(`https://aitamer.news${PATH}`), async () => new Response(new Uint8Array(MAX_BYTES), { status: 200 }));
  assert.equal(exact.status, 200);
});

test('_routes.json runs the function only under /videos/', () => {
  const routes = JSON.parse(readFileSync(new URL('../public/_routes.json', import.meta.url), 'utf8'));
  assert.deepEqual(routes, { version: 1, include: ['/videos/*'], exclude: [] });
});

test('a media-bucket caption path fetches the same file from the media bucket', async () => {
  const { impl, calls } = fakeFetch(upstreamOk);
  const res = await handleCaptions(new Request('https://aitamer.news/videos/media/desk-explainer/desk-explainer-v1.en.vtt'), impl);
  assert.equal(res.status, 200);
  assert.equal(await res.text(), VTT);
  assert.equal(calls.length, 1);
  assert.equal(calls[0].url, `${MEDIA_UPSTREAM}/videos/desk-explainer/desk-explainer-v1.en.vtt`);
});

test('each path shape has exactly one fixed upstream; nothing else is fetched', () => {
  assert.equal(captionSource('/videos/a/b.en.vtt'), `${UPSTREAM}/videos/a/b.en.vtt`);
  assert.equal(captionSource('/videos/media/b.en.vtt'), `${UPSTREAM}/videos/media/b.en.vtt`, 'a bot folder named media stays on the bot bucket');
  assert.equal(captionSource('/videos/media/a/b.en.vtt'), `${MEDIA_UPSTREAM}/videos/a/b.en.vtt`);
  for (const path of ['/videos/media/a/b/c.en.vtt', '/videos/bots/a/b.en.vtt', '/videos/media/A/b.en.vtt', '/videos/media/a/b.mp4', '/videos/media//b.en.vtt', '/videos/media/../a/b.en.vtt']) {
    assert.equal(captionSource(path), null, path);
  }
});

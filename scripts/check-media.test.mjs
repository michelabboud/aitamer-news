import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdirSync, writeFileSync } from 'node:fs';
import { createServer } from 'node:http';
import { join } from 'node:path';
import { bareEtag, judge, main, md5Hex } from './check-media.mjs';
import { quietlyAsync, tempDir } from './test-support.mjs';

const MEDIA = 'https://media.aitamer.news';
const post = (slug, { hero = `${MEDIA}/heroes/${slug}.jpg`, draft = false, pubDate = '2026-09-24T09:00:00Z' } = {}) =>
  `---\ntitle: ${slug}\npubDate: ${pubDate}\ndraft: ${draft}\nheroImage: ${hero}\n---\n\nBody.\n`;
const md5 = (text) => createHash('md5').update(text).digest('hex');

/** Posts and a local heroes folder: a and b published, c a draft; the local folder holds a and b. */
function fixture({ cHero } = {}) {
  const root = tempDir('media-');
  const postsDir = join(root, 'posts');
  const localDir = join(root, 'heroes');
  mkdirSync(postsDir);
  mkdirSync(localDir);
  writeFileSync(join(postsDir, 'a.md'), post('a'));
  writeFileSync(join(postsDir, 'b.md'), post('b'));
  writeFileSync(join(postsDir, 'c.md'), post('c', { draft: true, hero: cHero }));
  writeFileSync(join(postsDir, 'd.md'), post('d', { hero: '/heroes/d.jpg' })); // not on the media host: not requested
  writeFileSync(join(localDir, 'a.jpg'), 'AAAA');
  writeFileSync(join(localDir, 'b.jpg'), 'BBBBBB');
  return { postsDir, localDir };
}

/**
 * A stand-in for the media host. `objects` maps a key to its body; `override` bends one answer.
 * @param {Record<string, string>} objects
 * @param {(key: string, res: import('node:http').ServerResponse) => boolean} [override]
 */
async function host(objects, override = () => false) {
  const seen = [];
  const server = createServer((req, res) => {
    const key = decodeURIComponent(new URL(req.url, 'http://x').pathname.slice(1));
    seen.push(`${req.method} ${key}`);
    if (override(key, res)) return;
    if (!Object.hasOwn(objects, key)) {
      res.writeHead(404).end();
      return;
    }
    const body = objects[key];
    res.writeHead(200, { 'content-type': 'image/jpeg', 'content-length': Buffer.byteLength(body), etag: `"${md5(body)}"` }).end();
  });
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const origin = `http://127.0.0.1:${server.address().port}`;
  return { origin, seen, close: () => new Promise((resolve) => server.close(resolve)) };
}

const run = (argv, options) => quietlyAsync(() => main(argv, { attempts: 2, attemptDelayMs: 1, ...options }));
const ALL = { 'heroes/a.jpg': 'AAAA', 'heroes/b.jpg': 'BBBBBB', 'heroes/c.jpg': 'CC' };

test('every local file on the host byte for byte, and every post hero there: exit 0', async () => {
  const { postsDir, localDir } = fixture();
  const media = await host(ALL);
  try {
    const { result, output } = await run(['--local', localDir], { postsDir, origin: media.origin });
    assert.equal(result, 0, output);
    assert.match(output, /2\/2 files in .* are on .* byte for byte/);
    assert.match(output, /3\/3 post heroes on .* answer 200 image\/jpeg/);
    assert.ok(media.seen.every((line) => line.startsWith('HEAD ')), 'only HEAD requests');
    assert.ok(!media.seen.some((line) => line.includes('d.jpg')), 'a hero off the media host is not requested');
  } finally {
    await media.close();
  }
});

test('a local file whose bytes differ on the host fails, naming the size or the ETag', async () => {
  const { postsDir, localDir } = fixture();
  const media = await host({ ...ALL, 'heroes/b.jpg': 'BBBBBX' });
  try {
    const { result, output } = await run(['--local', localDir], { postsDir, origin: media.origin });
    assert.equal(result, 1);
    assert.match(output, /heroes\/b\.jpg .*ETag "[0-9a-f]+" is not the local file's MD5/);
    assert.match(output, /1\/2 files/);
  } finally {
    await media.close();
  }
  const sized = await host({ ...ALL, 'heroes/a.jpg': 'AAAAA' });
  try {
    const { result, output } = await run(['--local', localDir], { postsDir, origin: sized.origin });
    assert.equal(result, 1);
    assert.match(output, /heroes\/a\.jpg .*is 5 bytes, the local file 4/);
  } finally {
    await sized.close();
  }
});

test('a published post whose hero is missing fails; a draft\'s missing hero is only listed', async () => {
  const { postsDir } = fixture();
  const noC = await host({ 'heroes/a.jpg': 'AAAA', 'heroes/b.jpg': 'BBBBBB' });
  try {
    const { result, output } = await run([], { postsDir, origin: noC.origin });
    assert.equal(result, 0, output);
    assert.match(output, /not live yet \(a draft or scheduled\), not a finding: .*heroes\/c\.jpg .*answered 404/);
  } finally {
    await noC.close();
  }
  const noB = await host({ 'heroes/a.jpg': 'AAAA', 'heroes/c.jpg': 'CC' });
  try {
    const { result, output } = await run([], { postsDir, origin: noB.origin });
    assert.equal(result, 1);
    assert.match(output, /heroes\/b\.jpg \(.*b\.md\): answered 404, expected 200/);
  } finally {
    await noB.close();
  }
});

test('a hero served as another content type fails', async () => {
  const { postsDir } = fixture();
  const media = await host(ALL, (key, res) => {
    if (key !== 'heroes/a.jpg') return false;
    res.writeHead(200, { 'content-type': 'text/html' }).end();
    return true;
  });
  try {
    const { result, output } = await run([], { postsDir, origin: media.origin });
    assert.equal(result, 1);
    assert.match(output, /heroes\/a\.jpg .*served as "text\/html", expected image\/jpeg/);
  } finally {
    await media.close();
  }
});

test('a 5xx is retried and then reported; a request that recovers passes', async () => {
  const { postsDir } = fixture();
  let failures = 1;
  const flaky = await host(ALL, (key, res) => {
    if (key !== 'heroes/a.jpg' || failures === 0) return false;
    failures -= 1;
    res.writeHead(503).end();
    return true;
  });
  try {
    assert.equal((await run([], { postsDir, origin: flaky.origin })).result, 0);
  } finally {
    await flaky.close();
  }
  const down = await host(ALL, (key, res) => {
    if (key !== 'heroes/a.jpg') return false;
    res.writeHead(502).end();
    return true;
  });
  try {
    const { result, output } = await run([], { postsDir, origin: down.origin });
    assert.equal(result, 1);
    assert.match(output, /heroes\/a\.jpg .*answered 502 after 2 tries/);
  } finally {
    await down.close();
  }
});

test('usage errors and unreadable inputs are refused before any request', async () => {
  const { postsDir, localDir } = fixture();
  assert.equal((await run(['--local'], { postsDir, origin: 'http://127.0.0.1:9' })).result, 2);
  assert.equal((await run(['--nope'], { postsDir, origin: 'http://127.0.0.1:9' })).result, 2);
  assert.equal((await run(['--local', join(localDir, 'missing')], { postsDir, origin: 'http://127.0.0.1:9' })).result, 2);
  writeFileSync(join(localDir, 'Not A Hero.png'), 'x');
  const { result, output } = await run(['--local', localDir], { postsDir, origin: 'http://127.0.0.1:9' });
  assert.equal(result, 1);
  assert.match(output, /nothing was requested/);
  assert.match(output, /Not A Hero\.png: not a hero file name/);
});

test('a post whose pubDate cannot be read is reported as a problem, not a crash', async () => {
  const { postsDir } = fixture();
  writeFileSync(join(postsDir, 'odd-date.md'), '---\ntitle: x\npubDate: >-\n  2026-09-28\ndraft: false\nheroImage: https://media.aitamer.news/heroes/odd-date.jpg\n---\nBody.\n');
  const { result, output } = await run([], { postsDir, origin: 'http://127.0.0.1:9' });
  assert.equal(result, 1);
  assert.match(output, /odd-date\.md: pubDate/);
});

test('ETags are compared bare, and the judge reads only what matters', () => {
  assert.equal(bareEtag('"ABC"'), 'abc');
  assert.equal(bareEtag('W/"abc"'), 'abc');
  assert.equal(bareEtag(null), null);
  assert.equal(md5Hex(Buffer.from('AAAA')), md5('AAAA'));
  const headers = (h) => new Headers(h);
  const local = { size: 4, md5: md5('AAAA') };
  assert.equal(judge({ status: 200, headers: headers({ 'content-type': 'image/jpeg', 'content-length': '4', etag: `"${md5('AAAA')}"` }) }, local), null);
  assert.equal(judge({ status: 200, headers: headers({ 'content-type': 'image/jpeg; charset=binary' }) }, null), null);
  assert.match(judge({ status: 200, headers: headers({ 'content-type': 'image/jpeg', 'content-length': '4', etag: '"abc-2"' }) }, local), /multipart upload/);
  assert.match(judge({ status: 301, headers: headers({}) }, null), /answered 301/);
});

test('a scheduled post\'s missing hero is listed until its pubDate passes, then it fails', async () => {
  const { postsDir } = fixture();
  writeFileSync(join(postsDir, 'e.md'), post('e', { pubDate: '2026-10-01T09:00:00Z' }));
  const media = await host(ALL);
  try {
    const before = await run([], { postsDir, origin: media.origin, now: new Date('2026-10-01T08:59:59Z') });
    assert.equal(before.result, 0, before.output);
    assert.match(before.output, /not live yet .*heroes\/e\.jpg .*answered 404/);
    assert.match(before.output, /3\/4 post heroes .*\(2 of them live\)/);
    const after = await run([], { postsDir, origin: media.origin, now: new Date('2026-10-01T09:00:00Z') });
    assert.equal(after.result, 1);
    assert.match(after.output, /heroes\/e\.jpg \(.*e\.md\): answered 404, expected 200/);
  } finally {
    await media.close();
  }
});

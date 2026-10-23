import assert from 'node:assert/strict';
import { test } from 'node:test';
import { mkdtemp, mkdir, readFile, readdir, writeFile, symlink } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import {
  finalizeBuild, finalizeHeroHtml, planHeroTags, qualifyVariant, fetchHeroBytes,
  probeImage, decodeImage, measureSsim, runImageProcess, MAX_IMAGE_BYTES, ImageEvidenceError, OperationalError,
} from './finalize-responsive-heroes.mjs';

const JPEG = 'https://media.aitamer.news/heroes/test.jpg';
const WEBP = JPEG.replace('.jpg', '.webp');
const pair = { jpeg: JPEG, webp: WEBP, rawWidth: 960 };
const first = '/_astro/test-480.webp';
const second = '/_astro/test-720.webp';
const sourceSet = `${first} 480w, ${second} 720w, ${WEBP} 960w`;
const picture = (srcset = sourceSet, marker = ' data-responsive-hero') => `<picture${marker}><source type="image/webp" srcset='${srcset}' sizes="100vw"><img src="${JPEG}" alt="A &amp; B" width="1600" height="900"></picture>`;
const meta = (width, height, codec_name = 'webp') => ({ width, height, codec_name });
const jpegBytes = Buffer.from('jpeg original');
const webpBytes = Buffer.alloc(80, 1);
const variant = Buffer.alloc(20, 2);
const originalJpeg = meta(1600, 900, 'mjpeg');
const originalWebp = meta(960, 540);
const compareIO = (metadata = meta(480, 270), score = .99) => ({ probe: async () => metadata, decode: async () => {}, ssim: async () => score });

test('only explicitly marked pictures enter qualification; unmarked HTML is byte-identical', async () => {
  const html = `<!doctype html><main>${picture(sourceSet, '')}</main>`;
  assert.deepEqual(planHeroTags(html), []);
  assert.equal((await finalizeHeroHtml(html, () => assert.fail('unmarked image qualified'))).html, html);
  assert.equal(planHeroTags(picture()).length, 1);
});

test('malformed marked markup, duplicate attributes/descriptors and unowned paths fail closed', () => {
  const invalid = [
    picture().replace('</picture>', ''),
    picture().replace('<source ', '<source srcset="duplicate" '),
    picture().replace('<img ', '<img src="duplicate" '),
    picture().replace('<picture data-responsive-hero', '<picture data-responsive-hero data-responsive-hero'),
    picture(sourceSet.replace('720w', '480w')),
    picture(sourceSet.replace(second, first)),
    picture(sourceSet.replace(first, '/_astro/../test.webp')),
    picture(sourceSet.replace(first, '/_astro/%2e%2e%2fescape.webp')),
    picture(sourceSet.replace(first, '/_astro/test.webp?x=1&amp;y=2')),
    picture(sourceSet.replace(first, 'https://elsewhere.example/test.webp')),
    picture(sourceSet.replace(' 480w', ' 2x')),
    picture(`${first} 480w`),
    picture().replace(JPEG, 'https://media.aitamer.news.evil.example/heroes/test.jpg'),
    picture().replace(`src="${JPEG}"`, `src="${JPEG}\n"`),
    '<div data-responsive-hero></div>',
    picture().replace('<img ', '<span><img ').replace('</picture>', '</span></picture>'),
  ];
  for (const html of invalid) assert.throws(() => planHeroTags(html), /responsive hero|marked|srcset/i, html);
});

test('candidate-only rewrites preserve all unrelated HTML bytes, entities, scripts and original fallbacks', async () => {
  const before = '<!DOCTYPE html><script>const s = "srcset=\'keep & <exact>\'";</script><article data-x="&amp;">Reader  text\n';
  const middle = '</article><!-- exact whitespace -->\n';
  const html = before + picture() + middle + picture() + '<style>.x { content: "<keep>"; }</style>';
  const expectedPicture = picture(`${second} 720w, ${WEBP} 960w`).replace(`srcset='${second} 720w, ${WEBP} 960w'`, `srcset="${second} 720w, ${WEBP} 960w"`);
  const result = await finalizeHeroHtml(html, async (_pair, candidate) => ({ ok: candidate.width !== 480, reason: 'test exclusion' }));
  assert.equal(result.html, before + expectedPicture + middle + expectedPicture + '<style>.x { content: "<keep>"; }</style>');
  assert.equal(result.changedTags, 2);
  assert.equal(result.rejected.length, 2);
  assert.equal((await finalizeHeroHtml(result.html, async () => ({ ok: true, reason: 'qualified' }))).html, result.html);
});

test('all rejected candidates leave raw WebP and JPEG, and the rewritten picture is idempotent', async () => {
  const result = await finalizeHeroHtml(picture(), async () => ({ ok: false, reason: 'quality' }));
  assert.ok(result.html.includes(`srcset="${WEBP} 960w"`));
  assert.ok(result.html.includes(`src="${JPEG}"`));
  assert.equal(planHeroTags(result.html).length, 1);
  assert.equal((await finalizeHeroHtml(result.html, () => assert.fail('no derivative remains'))).html, result.html);
});

test('qualification exceptions and missing verdicts fail instead of silently removing evidence', async () => {
  await assert.rejects(finalizeHeroHtml(picture(), async () => { throw new Error('missing tool'); }), /missing tool/);
  await assert.rejects(finalizeHeroHtml(picture(), async () => undefined), /qualification|verdict/i);
});

test('larger, low-SSIM, falsely described and undecodable derivatives are excluded individually', async () => {
  const candidate = { url: first, width: 480 };
  const qualify = (bytes, io) => qualifyVariant(pair, candidate, jpegBytes, webpBytes, originalJpeg, originalWebp, bytes, io);
  assert.equal((await qualify(variant, compareIO())).ok, true);
  assert.match((await qualify(Buffer.alloc(80), compareIO())).reason, /bytes/);
  assert.match((await qualify(Buffer.alloc(81), compareIO())).reason, /bytes/);
  assert.equal((await qualify(variant, compareIO(meta(480, 270), .95))).ok, true);
  assert.match((await qualify(variant, compareIO(meta(480, 270), .94))).reason, /SSIM/);
  assert.match((await qualify(variant, compareIO(meta(479, 270)))).reason, /dimension|descriptor/);
  assert.match((await qualify(variant, compareIO(meta(480, 271)))).reason, /dimension|aspect/);
  const noUpscale = await qualifyVariant(pair, { url: first, width: 1600 }, jpegBytes, webpBytes, originalJpeg, originalWebp, variant, compareIO());
  assert.equal(noUpscale.ok, false);
  const broken = await qualifyVariant(pair, candidate, jpegBytes, webpBytes, originalJpeg, originalWebp, Buffer.from('not webp'), {
    ...compareIO(), probe: async () => { throw new ImageEvidenceError('undecodable metadata'); },
  });
  assert.equal(broken.ok, false);
  assert.match(broken.reason, /decode|metadata|ffprobe/);
});

async function buildFixture() {
  const root = await mkdtemp(join(tmpdir(), 'responsive-hero-test-'));
  const dist = join(root, 'dist');
  await mkdir(join(dist, '_astro'), { recursive: true });
  await mkdir(join(dist, 'posts'), { recursive: true });
  await writeFile(join(dist, '_astro/test-480.webp'), variant);
  await writeFile(join(dist, '_astro/test-720.webp'), Buffer.alloc(30, 3));
  await writeFile(join(dist, 'index.html'), picture());
  await writeFile(join(dist, 'posts/index.html'), picture());
  const calls = [];
  const options = {
    receiptDirectory: join(root, 'receipts'),
    toolsVersion: async () => ({ ffmpeg: 'ffmpeg fixture version', ffprobe: 'ffprobe fixture version' }),
    fetchBytes: async (url) => { calls.push(url); return url.endsWith('.jpg') ? jpegBytes : webpBytes; },
    probe: async (bytes, format) => format === 'jpg' ? originalJpeg : bytes === webpBytes ? originalWebp : bytes.length === 20 ? meta(480, 270) : meta(720, 405),
    ssim: async () => .99,
    decode: async () => {},
    retryDelay: async () => {},
  };
  return { root, dist, options, calls };
}

test('build deduplicates evidence within a run, writes a complete local receipt and requalifies the next run', async () => {
  const { dist, options, calls } = await buildFixture();
  const result = await finalizeBuild(dist, '/', options);
  assert.deepEqual(calls, [JPEG, WEBP]);
  assert.equal(result.totals.admittedCandidates, 2);
  assert.equal(result.totals.candidateOccurrences, 4);
  assert.equal(result.totals.markedPages, 2);
  const receipt = JSON.parse(await readFile(result.receiptPath, 'utf8'));
  assert.equal(receipt.status, 'passed');
  assert.match(receipt.comparator.ffmpeg, /fixture version/);
  assert.match(receipt.comparator.filter, /lanczos.*yuv444p/);
  assert.equal(receipt.pairs[0].jpeg.width, 1600);
  assert.equal(receipt.pairs[0].jpeg.bytes, jpegBytes.length);
  assert.match(receipt.pairs[0].jpeg.sha256, /^[a-f0-9]{64}$/);
  assert.equal(receipt.candidates[0].ssim, .99);
  assert.equal(receipt.candidates[0].actual.width, 480);
  assert.equal(receipt.candidates[0].pageCount, 2);
  assert.match(receipt.candidates[0].actual.sha256, /^[a-f0-9]{64}$/);
  assert.ok(receipt.elapsedMs >= 0);
  await finalizeBuild(dist, '/', options);
  assert.equal(calls.length, 4, 'no persistent qualification cache');
  assert.equal((await readdir(options.receiptDirectory)).length, 2);
});

test('build excludes one false-width derivative and preserves image files and all originals', async () => {
  const { dist, options } = await buildFixture();
  const probe = options.probe;
  options.probe = (bytes, format) => bytes.length === 20 ? Promise.resolve(meta(479, 270)) : probe(bytes, format);
  const result = await finalizeBuild(dist, '/', options);
  assert.equal(result.totals.excludedCandidates, 1);
  const html = await readFile(join(dist, 'index.html'), 'utf8');
  assert.ok(!html.includes(`${first} 480w`));
  assert.ok(html.includes(`${second} 720w`));
  assert.ok(html.includes(WEBP) && html.includes(JPEG));
  assert.deepEqual(await readFile(join(dist, '_astro/test-480.webp')), variant);
});

test('original failures retry a bounded number of times and fail the build without rewriting HTML', async () => {
  const { dist, options } = await buildFixture();
  let attempts = 0;
  options.fetchBytes = async () => { attempts++; throw new Error('offline original'); };
  await assert.rejects(finalizeBuild(dist, '/', options), /original.*offline original/i);
  assert.equal(attempts, 3);
  assert.equal(await readFile(join(dist, 'index.html'), 'utf8'), picture());
  const receipt = JSON.parse(await readFile(join(options.receiptDirectory, (await readdir(options.receiptDirectory))[0]), 'utf8'));
  assert.equal(receipt.status, 'failed');
  assert.match(receipt.error.message, /original/);
});

test('undecodable originals retry, while absent tools, missing files and escaping symlinks fail operationally', async () => {
  const undecodable = await buildFixture();
  let probes = 0;
  undecodable.options.probe = async () => { probes++; throw new Error('undecodable original'); };
  await assert.rejects(finalizeBuild(undecodable.dist, '/', undecodable.options), /original/);
  assert.equal(probes, 3);
  const absentTool = await buildFixture();
  absentTool.options.toolsVersion = async () => { throw new Error('ffmpeg ENOENT'); };
  await assert.rejects(finalizeBuild(absentTool.dist, '/', absentTool.options), /ENOENT/);
  assert.equal(absentTool.calls.length, 0);
  const missing = await buildFixture();
  await writeFile(join(missing.dist, 'index.html'), picture(sourceSet.replace(first, '/_astro/absent.webp')));
  await assert.rejects(finalizeBuild(missing.dist, '/', missing.options), /ENOENT|missing/i);
  const escaping = await buildFixture();
  await writeFile(join(escaping.root, 'outside.webp'), variant);
  await symlink(join(escaping.root, 'outside.webp'), join(escaping.dist, '_astro/escape.webp'));
  await writeFile(join(escaping.dist, 'index.html'), picture(sourceSet.replace(first, '/_astro/escape.webp')));
  await assert.rejects(finalizeBuild(escaping.dist, '/', escaping.options), /escapes dist/);
});

test('bounded fetch rejects redirects/unowned URLs and retries transient failure without accepting oversized bodies', async () => {
  let attempts = 0;
  const fetchImpl = async (_url, options) => {
    assert.equal(options.redirect, 'error');
    attempts++;
    if (attempts < 3) throw new Error('transient');
    return new Response(variant);
  };
  assert.deepEqual(await fetchHeroBytes(JPEG, { fetchImpl, retryDelay: async () => {} }), variant);
  assert.equal(attempts, 3);
  await assert.rejects(fetchHeroBytes('https://elsewhere.example/test.jpg', { fetchImpl }), /unrecognized/);
  await assert.rejects(fetchHeroBytes(WEBP, { attempts: 1, fetchImpl: async () => new Response(variant, { headers: { 'content-length': String(MAX_IMAGE_BYTES + 1) } }) }), /body limit/);
});

test('decoded-payload rejection excludes a candidate, while a comparator/tool failure aborts', async () => {
  const candidate = { url: first, width: 480 };
  const qualify = (io) => qualifyVariant(pair, candidate, jpegBytes, webpBytes, originalJpeg, originalWebp, variant, { ...compareIO(), ...io });
  assert.equal((await qualify({ decode: async () => { throw new ImageEvidenceError('truncated WebP'); } })).reasonCode, 'decode');
  await assert.rejects(qualify({ decode: async () => { throw new OperationalError('tool unavailable'); } }), /tool unavailable/);
  await assert.rejects(qualify({ ssim: async () => { throw new OperationalError('SSIM filter unavailable'); } }), /SSIM filter unavailable/);
  await assert.rejects(runImageProcess('aitamer-intentionally-absent-decoder', []), /ENOENT/);
});

test('an original decoder failure is retried, then transient recovery admits candidates', async () => {
  const { dist, options } = await buildFixture();
  let decodes = 0;
  options.decode = async (_bytes, format) => {
    if (format === 'jpg' && ++decodes < 3) throw new ImageEvidenceError('truncated original');
  };
  const report = await finalizeBuild(dist, '/', options);
  assert.equal(decodes, 3);
  assert.equal(report.totals.admittedCandidates, 2);
});

test('malformed marked build HTML fails before fetching and leaves every page unchanged', async () => {
  const { dist, options, calls } = await buildFixture();
  const invalid = picture(sourceSet.replace(second, '/_astro/../escape.webp'));
  await writeFile(join(dist, 'posts/index.html'), invalid);
  await assert.rejects(finalizeBuild(dist, '/', options), /Malformed marked/);
  assert.equal(calls.length, 0);
  assert.equal(await readFile(join(dist, 'index.html'), 'utf8'), picture());
  assert.equal(await readFile(join(dist, 'posts/index.html'), 'utf8'), invalid);
});

test('pair workers bound simultaneous original requests to four', async () => {
  const { dist, options } = await buildFixture();
  for (let index = 0; index < 6; index++) await writeFile(join(dist, `pair-${index}.html`), picture().replaceAll('/heroes/test.', `/heroes/item-${index}.`));
  let active = 0, peak = 0;
  options.fetchBytes = async (url) => {
    active++;
    peak = Math.max(peak, active);
    await new Promise((done) => setTimeout(done, 5));
    active--;
    return url.endsWith('.jpg') ? jpegBytes : webpBytes;
  };
  const report = await finalizeBuild(dist, '/', options);
  assert.equal(report.totals.uniquePairs, 7);
  assert.equal(peak, 4);
  assert.equal(active, 0);
});

test('project-site base candidates resolve within dist and receipt output cannot be public', async () => {
  const { dist, options } = await buildFixture();
  const html = picture(sourceSet.replaceAll('/_astro/', '/project/_astro/'));
  await writeFile(join(dist, 'index.html'), html);
  await writeFile(join(dist, 'posts/index.html'), html);
  assert.equal((await finalizeBuild(dist, '/project/', options)).totals.admittedCandidates, 2);
  assert.equal((await finalizeBuild(dist, '/project', options)).totals.admittedCandidates, 2);
  await assert.rejects(finalizeBuild(dist, '/', options), /configured Astro asset path/);
  await assert.rejects(finalizeBuild(dist, '/project/', { ...options, receiptDirectory: join(dist, 'receipts') }), /outside public dist/);
  await mkdir(join(dist, 'public-receipts'));
  await symlink(join(dist, 'public-receipts'), join(options.receiptDirectory, 'public-link'));
  await assert.rejects(finalizeBuild(dist, '/project/', { ...options, receiptDirectory: join(options.receiptDirectory, 'public-link') }), /outside public dist/);
});

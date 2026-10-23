import { test } from 'node:test';
import assert from 'node:assert/strict';
import { visualHeroSources } from './media.ts';
import { createHeroMetadataCache, HERO_DELIVERY_QUALITY, planResponsiveHero, type HeroMetadata, type HeroTransform } from './responsive-hero.ts';

const JPEG = 'https://media.aitamer.news/heroes/test.jpg';
const WEBP = JPEG.replace('.jpg', '.webp');
const pair = visualHeroSources(JPEG);
function fixture(jpeg: HeroMetadata, webp: HeroMetadata) {
  const calls: HeroTransform[] = [];
  return {
    calls,
    probe: async (src: string) => src.endsWith('.jpg') ? jpeg : webp,
    transform: async (options: HeroTransform) => {
      calls.push(options);
      return { src: `/_astro/test-${options.width}.webp` };
    },
  };
}
const metadata = (width: number, height: number, format = 'jpg'): HeroMetadata => ({ width, height, format });

test('16:9 delivery keeps JPEG source, creates smaller WebPs, and uses actual largest width', async () => {
  const io = fixture(metadata(1600, 900), metadata(960, 540, 'webp'));
  const result = await planResponsiveHero(pair, io);
  assert.deepEqual(result.candidates, [
    { src: '/_astro/test-480.webp', width: 480, height: 270 },
    { src: '/_astro/test-720.webp', width: 720, height: 405 },
    { src: WEBP, width: 960, height: 540 },
  ]);
  assert.ok(io.calls.every((call) => call.src === JPEG && call.quality === HERO_DELIVERY_QUALITY && call.format === 'webp' && call.fit === 'fill'));
  assert.equal(pair.src, JPEG);
});

test('4:3 originals derive uncropped heights instead of assuming 16:9', async () => {
  const io = fixture(metadata(1600, 1200), metadata(960, 720, 'webp'));
  const { candidates } = await planResponsiveHero(pair, io);
  assert.deepEqual(candidates.map(({ width, height }) => [width, height]), [[480, 360], [720, 540], [960, 720]]);
});

test('1280-wide JPEG and nonstandard 1000-wide WebP retain truthful descriptors', async () => {
  const io = fixture(metadata(1280, 720), metadata(1000, 563, 'webp'));
  const { candidates } = await planResponsiveHero(pair, io);
  assert.equal(candidates.at(-1)?.width, 1000);
  assert.equal(candidates.at(-1)?.height, 563);
  assert.ok(io.calls.every(({ width }) => width < 1000 && width < 1280));
});

test('a 720-wide WebP generates only 480, without duplicate width descriptors', async () => {
  const io = fixture(metadata(1280, 720), metadata(720, 405, 'webp'));
  const { candidates } = await planResponsiveHero(pair, io);
  assert.deepEqual(candidates.map(({ width }) => width), [480, 720]);
  assert.equal(io.calls.length, 1);
});

test('undersized sources retain the old picture rather than upscale', async () => {
  const io = fixture(metadata(480, 270), metadata(480, 270, 'webp'));
  const result = await planResponsiveHero(pair, io);
  assert.deepEqual(result.candidates, []);
  assert.match(result.diagnostic!, /too small/);
  assert.equal(io.calls.length, 0);
});

test('WebP larger than JPEG, mismatched aspects and invalid metadata retain old rendering', async () => {
  for (const [jpeg, webp] of [
    [metadata(800, 450), metadata(960, 540, 'webp')],
    [metadata(1600, 900), metadata(960, 720, 'webp')],
    [metadata(0, 900), metadata(960, 540, 'webp')],
    [metadata(NaN, 900), metadata(960, 540, 'webp')],
    [metadata(8193, 4609), metadata(960, 540, 'webp')],
    [metadata(8192, 8192), metadata(960, 960, 'webp')],
    [metadata(1600, 900), metadata(960, 540, 'png')],
  ]) {
    const io = fixture(jpeg, webp);
    const result = await planResponsiveHero(pair, io);
    assert.deepEqual(result.candidates, []);
    assert.ok(result.diagnostic);
    assert.equal(io.calls.length, 0);
  }
});

test('metadata and transform failures are explicit and never emit partial srcsets', async () => {
  const normal = fixture(metadata(1600, 900), metadata(960, 540, 'webp'));
  for (const io of [
    { ...normal, probe: async () => { throw new Error('network unavailable'); } },
    { ...normal, transform: async () => { throw new Error('image service unavailable'); } },
    { ...normal, transform: async () => ({ src: JPEG }) },
  ]) {
    const result = await planResponsiveHero(pair, io);
    assert.deepEqual(result.candidates, []);
    assert.match(result.diagnostic!, /failed/);
  }
});

test('generated SVG, media override and unrecognized URLs perform no I/O', async () => {
  const rejectIO = async (): Promise<never> => { assert.fail('unexpected remote I/O'); };
  for (const sources of [
    visualHeroSources('/covers/models.svg'),
    visualHeroSources(JPEG, '/media-local'),
    visualHeroSources('http://media.aitamer.news/heroes/test.jpg'),
    visualHeroSources('https://media.aitamer.news.evil.example/heroes/test.jpg'),
    visualHeroSources('https://user@media.aitamer.news/heroes/test.jpg'),
    { src: JPEG, webp: 'https://elsewhere.example/test.webp' },
  ]) {
    const result = await planResponsiveHero(sources, { probe: rejectIO, transform: rejectIO });
    assert.deepEqual(result.candidates, []);
    assert.ok(result.diagnostic);
  }
});

test('explicit bot WebP still generates from its original JPEG fallback', async () => {
  const sources = visualHeroSources('https://bots.aitamer.news/heroes/test-0123abcd.webp');
  const io = fixture(metadata(1600, 900), metadata(960, 540, 'webp'));
  const result = await planResponsiveHero(sources, io);
  assert.equal(result.candidates.at(-1)?.src, sources.webp);
  assert.ok(io.calls.every(({ src }) => src === sources.src && src.endsWith('.jpg')));
});

test('metadata promises deduplicate concurrent page renders, but every page registers transforms', async () => {
  const cache = createHeroMetadataCache();
  const probed: string[] = [];
  const io = fixture(metadata(1600, 900), metadata(960, 540, 'webp'));
  const probe = (src: string) => cache(src, async (url) => { probed.push(url); return io.probe(url); });
  await Promise.all([planResponsiveHero(pair, { ...io, probe }), planResponsiveHero(pair, { ...io, probe })]);
  assert.deepEqual(probed.sort(), [JPEG, WEBP].sort());
  assert.equal(io.calls.length, 4, 'both pages must invoke both transforms, including on a warm asset cache');
});

test('failed metadata is cached for this build and a new build starts a fresh cache', async () => {
  const cache = createHeroMetadataCache({ retryDelay: async () => {} });
  let calls = 0;
  const probe = async () => { calls++; throw new Error('offline'); };
  await assert.rejects(cache(JPEG, probe), /offline/);
  await assert.rejects(cache(JPEG, probe), /offline/);
  assert.equal(calls, 3);
  await assert.rejects(createHeroMetadataCache({ retryDelay: async () => {} })(JPEG, probe), /offline/);
  assert.equal(calls, 6);
});

test('metadata probes admit at most six live requests and release permits after native probes settle', async () => {
  const cache = createHeroMetadataCache();
  let active = 0, peak = 0;
  const probes = Array.from({ length: 20 }, (_, index) => cache(`${JPEG}?fixture=${index}`, async () => {
    active++;
    peak = Math.max(peak, active);
    await new Promise((done) => setTimeout(done, 5));
    active--;
    return metadata(1600, 900);
  }));
  await Promise.all(probes);
  assert.equal(peak, 6);
  assert.equal(active, 0);
});

test('metadata retries transient failures before memoizing and backoff holds no request permit', async () => {
  const calls = new Map<string, number>();
  let active = 0, peak = 0, backoffs = 0;
  const cache = createHeroMetadataCache({ retryDelay: async () => {
    backoffs++;
    assert.equal(active, 0, 'settled probes release their permit before retry backoff');
  } });
  const probe = async (src: string) => {
    active++;
    peak = Math.max(peak, active);
    const attempt = (calls.get(src) ?? 0) + 1;
    calls.set(src, attempt);
    active--;
    if (attempt < 3) throw new Error('temporary request burst');
    return metadata(1600, 900);
  };
  assert.deepEqual(await cache(JPEG, probe), metadata(1600, 900));
  assert.deepEqual(await cache(JPEG, probe), metadata(1600, 900));
  assert.equal(calls.get(JPEG), 3);
  assert.equal(backoffs, 2);
  assert.equal(peak, 1);
});

test('six probes in retry backoff leave request permits available for another URL', { timeout: 2_000 }, async () => {
  let releaseBackoff!: () => void;
  let sixBackoffsReady!: () => void;
  let backoffs = 0;
  const blockedBackoff = new Promise<void>((ready) => { releaseBackoff = ready; });
  const allBackoffsReady = new Promise<void>((ready) => { sixBackoffsReady = ready; });
  const cache = createHeroMetadataCache({ retryDelay: async () => {
    if (++backoffs === 6) sixBackoffsReady();
    await blockedBackoff;
  } });
  const attempts = new Map<string, number>();
  const retrying = Array.from({ length: 6 }, (_, index) => cache(`${JPEG}?retry=${index}`, async (url) => {
    const attempt = (attempts.get(url) ?? 0) + 1;
    attempts.set(url, attempt);
    if (attempt === 1) throw new Error('transient');
    return metadata(1600, 900);
  }));
  await allBackoffsReady;
  try {
    // If backoff holds all six permits, this independent URL cannot finish and the test times out.
    assert.deepEqual(await cache(`${JPEG}?fresh`, async () => metadata(1280, 720)), metadata(1280, 720));
  } finally { releaseBackoff(); }
  await Promise.all(retrying);
});

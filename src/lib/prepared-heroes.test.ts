import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { test } from 'node:test';
import { visualHeroSources } from './media.ts';
import { PREPARED_HERO_POLICY_SHA256, planPreparedHero, validatePreparedCatalog } from './prepared-heroes.ts';

const JPEG = 'https://media.aitamer.news/heroes/prepared-test.jpg';
const WEBP = JPEG.replace('.jpg', '.webp');
const digest = (character: string) => character.repeat(64);
const deliveryUrl = (sha256: string) => `https://media.aitamer.news/heroes/responsive-${sha256}.webp`;
function fixture() {
  return {
    schemaVersion: 1,
    recipe: { widths: [480, 720], quality: 84, minSsim: 0.95 },
    qualification: { policySha256: PREPARED_HERO_POLICY_SHA256, receiptSha256: digest('f') },
    pairs: [{
      jpeg: { url: JPEG, sha256: digest('a'), bytes: 100000, width: 1600, height: 900 },
      webp: { url: WEBP, sha256: digest('b'), bytes: 70000, width: 1280, height: 720 },
      variants: [
        { url: deliveryUrl(digest('c')), sha256: digest('c'), bytes: 17000, width: 480, height: 270, ssim: 0.97 },
        { url: deliveryUrl(digest('d')), sha256: digest('d'), bytes: 27000, width: 720, height: 405, ssim: 0.96 },
      ],
    }],
  };
}

test('prepared planning retains the original WebP after ordered qualified variants and leaves JPEG unchanged', () => {
  const input = fixture();
  input.pairs[0].variants.reverse();
  const before = structuredClone(input);
  const sources = visualHeroSources(JPEG, '');
  const result = planPreparedHero(sources, validatePreparedCatalog(input));
  assert.deepEqual(result.candidates, [
    { src: deliveryUrl(digest('c')), width: 480, height: 270 },
    { src: deliveryUrl(digest('d')), width: 720, height: 405 },
    { src: WEBP, width: 1280, height: 720 },
  ]);
  assert.equal(result.diagnostic, undefined);
  assert.equal(sources.src, JPEG);
  assert.deepEqual(input, before);
});

test('smaller original WebP and rounded original dimensions keep truthful descriptors', () => {
  const small = fixture();
  small.pairs[0].webp.width = 720;
  small.pairs[0].webp.height = 405;
  small.pairs[0].variants.pop();
  assert.deepEqual(planPreparedHero({ src: JPEG, webp: WEBP }, small).candidates.map(({ width }) => width), [480, 720]);

  const rounded = fixture();
  rounded.pairs[0].jpeg.width = 1280;
  rounded.pairs[0].jpeg.height = 720;
  rounded.pairs[0].webp.width = 1000;
  rounded.pairs[0].webp.height = 563;
  assert.deepEqual(planPreparedHero({ src: JPEG, webp: WEBP }, rounded).candidates.at(-1), { src: WEBP, width: 1000, height: 563 });
});

test('unknown, unowned, local override and mismatched source pairs retain the original rendering', () => {
  const catalog = validatePreparedCatalog(fixture());
  for (const sources of [
    visualHeroSources('https://media.aitamer.news/heroes/not-prepared.jpg', ''),
    visualHeroSources(JPEG, '/media-local'),
    visualHeroSources(JPEG, 'https://mirror.example'),
    { src: JPEG },
    { src: JPEG, webp: WEBP + '?replacement=1' },
    { src: JPEG, webp: 'https://elsewhere.example/prepared-test.webp' },
    visualHeroSources('/covers/models.svg', ''),
    visualHeroSources('https://media.aitamer.news.evil.example/heroes/prepared-test.jpg', ''),
  ]) {
    const result = planPreparedHero(sources, catalog);
    assert.deepEqual(result.candidates, []);
    assert.ok(result.diagnostic);
  }
  const empty = fixture();
  empty.pairs = [];
  assert.deepEqual(planPreparedHero({ src: JPEG, webp: WEBP }, empty).candidates, []);
  const excluded = fixture();
  excluded.pairs[0].variants = [];
  assert.deepEqual(planPreparedHero({ src: JPEG, webp: WEBP }, excluded).candidates, []);
});

test('bot JPEG and WebP originals must have the exact owned hashed twin', () => {
  const input = fixture();
  const jpeg = 'https://bots.aitamer.news/heroes/prepared-test-012abcde.jpg';
  input.pairs[0].jpeg.url = jpeg;
  input.pairs[0].webp.url = jpeg.replace('.jpg', '.webp');
  assert.equal(planPreparedHero(visualHeroSources(input.pairs[0].webp.url, ''), input).candidates.length, 3);
  input.pairs[0].jpeg.url = 'https://bots.aitamer.news/heroes/unhashed.jpg';
  input.pairs[0].webp.url = input.pairs[0].jpeg.url.replace('.jpg', '.webp');
  assert.throws(() => validatePreparedCatalog(input), /Invalid prepared hero catalog/);
});

test('qualification binds the fixed recipe and the canonical-JPEG comparison policy', () => {
  const policy = 'canonical-jpeg|480,720|webp|84|ffmpeg-lanczos-yuv444p-ssim-v1|0.95|smaller-than-original-webp';
  assert.equal(PREPARED_HERO_POLICY_SHA256, createHash('sha256').update(policy).digest('hex'));
  const mutations: Array<(value: any) => void> = [
    (v) => { v.schemaVersion = 2; }, (v) => { v.recipe.widths = [720, 480]; },
    (v) => { v.recipe.widths = [480, 720, 960]; }, (v) => { v.recipe.quality = 83; },
    (v) => { v.recipe.minSsim = 0.94; }, (v) => { v.qualification.policySha256 = digest('0'); },
    (v) => { v.qualification.receiptSha256 = 'not-a-digest'; }, (v) => { delete v.qualification; },
    (v) => { v.recipe.extra = true; }, (v) => { v.qualification.extra = true; },
    (v) => { v.extra = true; }, (v) => { v.pairs = {}; }, (v) => { v.pairs = new Array(1); },
  ];
  for (const mutate of mutations) {
    const input = fixture(); mutate(input);
    assert.throws(() => validatePreparedCatalog(input), /Invalid prepared hero catalog/);
  }
  for (const input of [null, undefined, [], 1, 'catalog']) assert.throws(() => validatePreparedCatalog(input), /Invalid prepared hero catalog/);
});

test('tampered identities, metadata and qualification cannot emit a partial prepared srcset', () => {
  const mutations: Array<(pair: any) => void> = [
    (p) => { p.jpeg.url += '\n'; }, (p) => { p.webp.url = WEBP.replace('https:', 'http:'); },
    (p) => { p.webp.url = WEBP + '?x=1'; }, (p) => { p.jpeg.sha256 = digest('a') + '\n'; },
    (p) => { p.webp.sha256 = digest('G'); }, (p) => { p.jpeg.bytes = 0; },
    (p) => { p.webp.bytes = Number.MAX_SAFE_INTEGER + 1; }, (p) => { p.jpeg.width = 8193; },
    (p) => { p.jpeg.width = 8192; p.jpeg.height = 8192; }, (p) => { p.webp.height = 0; },
    (p) => { p.webp.width = 1601; }, (p) => { p.webp.height = 722; },
    (p) => { p.jpeg.height = 900.5; }, (p) => { p.variants[0].width = 481; },
    (p) => { p.webp.width = 720; p.webp.height = 405; },
    (p) => { p.variants[0].height = 271; }, (p) => { p.variants[0].bytes = p.webp.bytes; },
    (p) => { p.variants[0].bytes = -1; }, (p) => { p.variants[0].ssim = 0.94999; },
    (p) => { p.variants[0].ssim = 1.00001; }, (p) => { p.variants[0].ssim = NaN; },
    (p) => { p.variants[0].url = deliveryUrl(digest('e')); },
    (p) => { p.variants[0].url = p.variants[0].url.replace('media.', 'bots.'); },
    (p) => { p.variants[0].url += '?x=1'; }, (p) => { p.variants[0].unexpected = true; },
    (p) => { p.jpeg.unexpected = true; }, (p) => { p.unexpected = true; },
    (p) => { p.variants = [null]; }, (p) => { p.variants = new Array(1); },
  ];
  for (const mutate of mutations) {
    const input = fixture(); mutate(input.pairs[0]);
    assert.throws(() => planPreparedHero({ src: JPEG, webp: WEBP }, input), /Invalid prepared hero catalog/);
    assert.throws(() => planPreparedHero({ src: '/covers/models.svg' }, input), /Invalid prepared hero catalog/);
  }
});

test('duplicate JPEGs and per-pair duplicate variant widths or URLs are refused', () => {
  const duplicatePair = fixture();
  duplicatePair.pairs.push(structuredClone(duplicatePair.pairs[0]));
  assert.throws(() => validatePreparedCatalog(duplicatePair), /duplicate JPEG/);
  const duplicateVariant = fixture();
  duplicateVariant.pairs[0].variants.push(structuredClone(duplicateVariant.pairs[0].variants[0]));
  assert.throws(() => validatePreparedCatalog(duplicateVariant), /duplicate variant/);
  const duplicateWidth = fixture();
  duplicateWidth.pairs[0].variants[1] = { ...duplicateWidth.pairs[0].variants[0], url: deliveryUrl(digest('d')), sha256: digest('d') };
  assert.throws(() => validatePreparedCatalog(duplicateWidth), /duplicate variant/);
  const duplicateUrl = fixture();
  duplicateUrl.pairs[0].variants[1].url = duplicateUrl.pairs[0].variants[0].url;
  duplicateUrl.pairs[0].variants[1].sha256 = duplicateUrl.pairs[0].variants[0].sha256;
  assert.throws(() => validatePreparedCatalog(duplicateUrl), /duplicate variant/);
});

test('originals and derivatives retain the existing 20 MiB image byte budget', () => {
  const limit = 20 * 1024 * 1024;
  const boundary = fixture();
  boundary.pairs[0].jpeg.bytes = limit;
  boundary.pairs[0].webp.bytes = limit;
  assert.equal(validatePreparedCatalog(boundary).pairs[0].jpeg.bytes, limit);
  for (const target of ['jpeg', 'webp', 'variant'] as const) {
    const input = fixture();
    const asset = target === 'variant' ? input.pairs[0].variants[0] : input.pairs[0][target];
    asset.bytes = limit + 1;
    assert.throws(() => validatePreparedCatalog(input), /image byte limit/);
  }
});

test('shared cross-pair derivatives require identical bytes, dimensions and digest while SSIM remains pair-specific', () => {
  const input = fixture();
  const second = structuredClone(input.pairs[0]);
  second.jpeg.url = JPEG.replace('prepared-test', 'another');
  second.webp.url = WEBP.replace('prepared-test', 'another');
  second.variants[0].ssim = 0.95;
  second.variants[1].ssim = 1;
  input.pairs.push(second);
  assert.equal(validatePreparedCatalog(input).pairs.length, 2);
  const inconsistentBytes = structuredClone(input);
  inconsistentBytes.pairs[1].variants[0].bytes++;
  assert.throws(() => validatePreparedCatalog(inconsistentBytes), /conflicting shared derivative/);
  const inconsistentDimensions = structuredClone(input);
  const changed = inconsistentDimensions.pairs[1];
  changed.jpeg.height = 1000; changed.webp.height = 800;
  changed.variants[0].height = 300; changed.variants[1].height = 450;
  assert.throws(() => validatePreparedCatalog(inconsistentDimensions), /conflicting shared derivative/);
});

test('validated snapshots and cached lookups cannot be changed through the input or a previous plan', () => {
  const input = fixture();
  const catalog = validatePreparedCatalog(input);
  assert.equal(validatePreparedCatalog(catalog), catalog);
  assert.equal(Object.isFrozen(catalog), true);
  assert.equal(Object.isFrozen(catalog.recipe.widths), true);
  assert.equal(Object.isFrozen(catalog.qualification), true);
  assert.equal(Object.isFrozen(catalog.pairs), true);
  assert.equal(Object.isFrozen(catalog.pairs[0].jpeg), true);
  assert.equal(Object.isFrozen(catalog.pairs[0].variants[0]), true);
  input.pairs[0].variants[0].url = 'https://evil.example/replacement.webp';
  const first = planPreparedHero({ src: JPEG, webp: WEBP }, catalog);
  first.candidates[0].src = 'https://evil.example/changed-result.webp';
  assert.equal(planPreparedHero({ src: JPEG, webp: WEBP }, catalog).candidates[0].src, deliveryUrl(digest('c')));
  assert.throws(() => planPreparedHero({ src: JPEG, webp: WEBP }, input), /Invalid prepared hero catalog/);
});

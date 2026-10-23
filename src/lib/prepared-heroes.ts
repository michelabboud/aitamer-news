/** Pure admission and lookup for already qualified delivery assets. No image or network I/O. */
import { MEDIA_ORIGIN, visualHeroSources } from './media.ts';

/** SHA-256 of the canonical-JPEG/widths/codec/quality/comparator/SSIM/byte-saving policy. */
export const PREPARED_HERO_POLICY_SHA256 = 'dba51fb8359c4d40465e47d35af97ea7ea0112b77e607c2771672862389e7d4e';
const WIDTHS = Object.freeze([480, 720] as const);
const QUALITY = 84;
const MIN_SSIM = 0.95;
const MAX_DIMENSION = 8192;
const MAX_PIXELS = 32_000_000;
const MAX_IMAGE_BYTES = 20 * 1024 * 1024;
const IMAGE_FIELDS = ['url', 'sha256', 'bytes', 'width', 'height'] as const;

export interface PreparedHeroAsset {
  readonly url: string; readonly sha256: string; readonly bytes: number;
  readonly width: number; readonly height: number;
}
export interface PreparedHeroVariant extends PreparedHeroAsset { readonly ssim: number }
export interface PreparedHeroPair {
  readonly jpeg: PreparedHeroAsset; readonly webp: PreparedHeroAsset;
  readonly variants: readonly PreparedHeroVariant[];
}
export interface PreparedHeroCatalog {
  readonly schemaVersion: 1;
  readonly recipe: { readonly widths: readonly [480, 720]; readonly quality: 84; readonly minSsim: 0.95 };
  readonly qualification: { readonly policySha256: string; readonly receiptSha256: string };
  readonly pairs: readonly PreparedHeroPair[];
}

// Only our deeply frozen snapshots enter this cache; caller-owned objects remain revalidatable.
const indexes = new WeakMap<object, ReadonlyMap<string, PreparedHeroPair>>();
const fail = (detail: string): never => { throw new Error(`Invalid prepared hero catalog: ${detail}`); };
function record(value: unknown, fields: readonly string[], path: string): Record<string, unknown> {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return fail(`${path} must be an object`);
  const keys = Object.keys(value);
  if (keys.length !== fields.length || fields.some((key) => !Object.hasOwn(value, key))) return fail(`${path} has missing or unexpected fields`);
  return value as Record<string, unknown>;
}
function sha256(value: unknown, path: string): string {
  if (typeof value !== 'string' || value.length !== 64 || !/^[a-f0-9]{64}$/.test(value)) return fail(`${path} must be a lowercase SHA-256 digest`);
  return value;
}
function positiveInteger(value: unknown, path: string): number {
  if (typeof value !== 'number' || !Number.isSafeInteger(value) || value <= 0) return fail(`${path} must be a positive safe integer`);
  return value;
}
function image(value: Record<string, unknown>, path: string): PreparedHeroAsset {
  if (typeof value.url !== 'string') return fail(`${path}.url must be a string`);
  const width = positiveInteger(value.width, `${path}.width`);
  const height = positiveInteger(value.height, `${path}.height`);
  const bytes = positiveInteger(value.bytes, `${path}.bytes`);
  if (width > MAX_DIMENSION || height > MAX_DIMENSION || width * height > MAX_PIXELS) return fail(`${path} exceeds image dimension limits`);
  if (bytes > MAX_IMAGE_BYTES) return fail(`${path} exceeds the image byte limit`);
  return Object.freeze({ url: value.url, sha256: sha256(value.sha256, `${path}.sha256`), bytes, width, height });
}

/** Validate the complete catalog before admitting any pair; return an immutable indexed snapshot. */
export function validatePreparedCatalog(value: unknown): PreparedHeroCatalog {
  if (typeof value === 'object' && value !== null && indexes.has(value)) return value as PreparedHeroCatalog;
  const root = record(value, ['schemaVersion', 'recipe', 'qualification', 'pairs'], 'catalog');
  if (root.schemaVersion !== 1) return fail('unsupported schemaVersion');
  const recipe = record(root.recipe, ['widths', 'quality', 'minSsim'], 'recipe');
  const recipeWidths = recipe.widths;
  if (!Array.isArray(recipeWidths) || recipeWidths.length !== WIDTHS.length || WIDTHS.some((width, i) => recipeWidths[i] !== width)
    || recipe.quality !== QUALITY || recipe.minSsim !== MIN_SSIM) return fail('recipe does not match the qualified policy');
  const qualification = record(root.qualification, ['policySha256', 'receiptSha256'], 'qualification');
  if (qualification.policySha256 !== PREPARED_HERO_POLICY_SHA256) return fail('qualification policy digest does not match');
  const receiptSha256 = sha256(qualification.receiptSha256, 'qualification.receiptSha256');
  if (!Array.isArray(root.pairs)) return fail('pairs must be an array');
  const index = new Map<string, PreparedHeroPair>();
  const shared = new Map<string, PreparedHeroVariant>();
  const pairs = Array.from(root.pairs, (entry, pairIndex) => {
    const path = `pairs[${pairIndex}]`;
    const pair = record(entry, ['jpeg', 'webp', 'variants'], path);
    const jpeg = image(record(pair.jpeg, IMAGE_FIELDS, `${path}.jpeg`), `${path}.jpeg`);
    const webp = image(record(pair.webp, IMAGE_FIELDS, `${path}.webp`), `${path}.webp`);
    // Empty override explicitly avoids the environment-dependent default in visualHeroSources.
    const owned = visualHeroSources(jpeg.url, '');
    if (owned.src !== jpeg.url || !owned.webp || owned.webp !== webp.url) return fail(`${path} is not an owned original JPEG/WebP pair`);
    if (index.has(jpeg.url)) return fail(`${path} has a duplicate JPEG`);
    if (webp.width > jpeg.width || Math.abs(webp.height - jpeg.height * webp.width / jpeg.width) > 1) return fail(`${path} has upscaled or mismatched original dimensions`);
    if (!Array.isArray(pair.variants)) return fail(`${path}.variants must be an array`);
    const widths = new Set<number>();
    const urls = new Set<string>();
    const variants = Array.from(pair.variants, (entry, variantIndex) => {
      const variantPath = `${path}.variants[${variantIndex}]`;
      const data = record(entry, [...IMAGE_FIELDS, 'ssim'], variantPath);
      const asset = image(data, variantPath);
      if (widths.has(asset.width) || urls.has(asset.url)) return fail(`${variantPath} has a duplicate variant width or URL`);
      widths.add(asset.width); urls.add(asset.url);
      if (asset.url !== `${MEDIA_ORIGIN}/heroes/responsive-${asset.sha256}.webp`) return fail(`${variantPath} URL is not bound to its digest`);
      if (!WIDTHS.some((width) => width === asset.width) || asset.width >= jpeg.width || asset.width >= webp.width
        || asset.height !== Math.round(jpeg.height * asset.width / jpeg.width)) return fail(`${variantPath} has invalid delivery dimensions`);
      if (asset.bytes >= webp.bytes) return fail(`${variantPath} is not smaller than the original WebP`);
      if (typeof data.ssim !== 'number' || !Number.isFinite(data.ssim) || data.ssim < MIN_SSIM || data.ssim > 1) return fail(`${variantPath} has an invalid SSIM score`);
      const variant = Object.freeze({ ...asset, ssim: data.ssim });
      const previous = shared.get(asset.url);
      if (previous && (previous.sha256 !== asset.sha256 || previous.bytes !== asset.bytes || previous.width !== asset.width || previous.height !== asset.height)) {
        return fail(`${variantPath} has conflicting shared derivative metadata`);
      }
      shared.set(asset.url, variant);
      return variant;
    });
    const admitted = Object.freeze({ jpeg, webp, variants: Object.freeze(variants) });
    index.set(jpeg.url, admitted);
    return admitted;
  });
  const catalog: PreparedHeroCatalog = Object.freeze({
    schemaVersion: 1,
    recipe: Object.freeze({ widths: WIDTHS, quality: QUALITY, minSsim: MIN_SSIM }),
    qualification: Object.freeze({ policySha256: PREPARED_HERO_POLICY_SHA256, receiptSha256 }),
    pairs: Object.freeze(pairs),
  });
  indexes.set(catalog, index);
  return catalog;
}

/** Unknown originals and media overrides keep existing rendering; invalid catalogs always throw. */
export function planPreparedHero(sources: { src: string; webp?: string }, value: unknown): {
  candidates: { src: string; width: number; height: number }[]; diagnostic?: string;
} {
  const catalog = validatePreparedCatalog(value);
  const owned = visualHeroSources(sources.src, '');
  if (!sources.webp || owned.src !== sources.src || owned.webp !== sources.webp) {
    return { candidates: [], diagnostic: 'source is not an owned production JPEG/WebP pair (or media override is active)' };
  }
  const pair = indexes.get(catalog)!.get(sources.src);
  if (!pair || !pair.variants.length) return { candidates: [], diagnostic: 'no qualified prepared variants are registered for this hero' };
  return {
    candidates: [...pair.variants].sort((a, b) => a.width - b.width)
      .map(({ url, width, height }) => ({ src: url, width, height }))
      .concat({ src: pair.webp.url, width: pair.webp.width, height: pair.webp.height }),
  };
}

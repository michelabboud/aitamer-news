#!/usr/bin/env node
/** Export locally qualified, byte-bound images for create-only publication. No upload credentials. */
import { readFile, realpath, stat, mkdir, writeFile } from 'node:fs/promises';
import { resolve, relative, isAbsolute } from 'node:path';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { validatePreparedCatalog, PREPARED_HERO_POLICY_SHA256 } from '../src/lib/prepared-heroes.ts';

const digest = (bytes) => createHash('sha256').update(bytes).digest('hex');
export async function exportPreparedHeroes(receiptFile, dist, out) {
  const receiptBytes = await readFile(receiptFile);
  const report = JSON.parse(receiptBytes.toString('utf8'));
  if (report.schemaVersion !== 1 || report.status !== 'passed'
    || report.recipe?.source !== 'canonical-jpeg' || report.recipe?.format !== 'webp'
    || JSON.stringify(report.recipe.widths) !== '[480,720]' || report.recipe.quality !== 84 || report.recipe.minSsim !== 0.95
    || report.comparator?.id !== 'ffmpeg-lanczos-yuv444p-ssim-v1'
    || !report.comparator.ffmpeg || !report.comparator.ffprobe) throw new Error('Expected a passed local image qualification receipt with the current recipe');
  const root = await realpath(dist), pairs = [], entries = new Map();
  for (const pair of report.pairs) {
    const original = (value) => ({ url: value.url, sha256: value.sha256, bytes: value.bytes, width: value.width, height: value.height });
    const variants = [];
    for (const candidate of report.candidates.filter((c) => c.jpeg === pair.jpeg.url && c.ok === true)) {
      if (candidate.verdict !== 'admitted' || candidate.reasonCode !== 'qualified' || candidate.rawWebp !== pair.webp.url
        || !/^\/_astro\/[A-Za-z0-9._~-]+\.webp$/.test(candidate.url)) throw new Error('Invalid qualified candidate');
      const file = await realpath(resolve(root, candidate.url.slice(1))), rel = relative(root, file);
      if (rel.startsWith('..') || isAbsolute(rel) || !(await stat(file)).isFile()) throw new Error('Candidate escapes build output');
      const bytes = await readFile(file), actual = candidate.actual;
      if (bytes.length !== actual.bytes || digest(bytes) !== actual.sha256) throw new Error('Qualified image bytes changed after measurement');
      const key = `heroes/responsive-${actual.sha256}.webp`, url = `https://media.aitamer.news/${key}`;
      variants.push({ url, sha256: actual.sha256, bytes: actual.bytes, width: actual.width, height: actual.height, ssim: candidate.ssim });
      entries.set(key, { host: 'media.aitamer.news', slug: actual.sha256, key, file, url, sha256: actual.sha256, bytes: actual.bytes, cache_control: 'public, max-age=31536000, immutable' });
    }
    if (variants.length) pairs.push({ jpeg: original(pair.jpeg), webp: original(pair.webp), variants: variants.sort((a,b) => a.width-b.width) });
  }
  const catalog = { schemaVersion: 1, recipe: { widths: [480,720], quality: 84, minSsim: 0.95 }, qualification: {policySha256: PREPARED_HERO_POLICY_SHA256, receiptSha256: digest(receiptBytes)}, pairs: pairs.sort((a,b) => a.jpeg.url.localeCompare(b.jpeg.url)) };
  validatePreparedCatalog(catalog);
  await mkdir(out, { recursive: true });
  await writeFile(resolve(out, 'prepared-heroes.json'), JSON.stringify(catalog) + '\n', { flag: 'wx' });
  await writeFile(resolve(out, 'upload-plan.json'), JSON.stringify({ entries: [...entries.values()] }, null, 2) + '\n', { flag: 'wx' });
  return { pairs: pairs.length, files: entries.size, bytes: [...entries.values()].reduce((n,e) => n+e.bytes,0) };
}
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const [receipt, dist, out] = process.argv.slice(2);
  if (!receipt || !dist || !out) throw new Error('Usage: node scripts/export-prepared-heroes.mjs RECEIPT DIST NEW_OUTPUT_DIRECTORY');
  console.log(await exportPreparedHeroes(receipt, dist, out));
}

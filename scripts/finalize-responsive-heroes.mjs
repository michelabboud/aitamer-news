#!/usr/bin/env node
/** Qualify marked hero srcsets after Astro emits assets, before search/CSP generation. */
import { spawn } from 'node:child_process';
import { createHash, randomUUID } from 'node:crypto';
import { readFile, writeFile, readdir, realpath, stat, mkdir } from 'node:fs/promises';
import { resolve, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse } from 'parse5';
import { HERO_DELIVERY_WIDTHS, HERO_DELIVERY_QUALITY, HERO_MAX_DIMENSION, HERO_MAX_PIXELS } from '../src/lib/responsive-hero.ts';

export const MIN_SSIM = 0.95;
export const MAX_IMAGE_BYTES = 20 * 1024 * 1024;
export const FETCH_TIMEOUT_MS = 20_000;
export const FETCH_ATTEMPTS = 3;
export const FETCH_RETRY_DELAY_MS = 250;
export const PROCESS_TIMEOUT_MS = 30_000;
export const QUALIFICATION_CONCURRENCY = 4;
export const MAX_DIMENSION = HERO_MAX_DIMENSION;
export const MAX_PIXELS = HERO_MAX_PIXELS;
const MAX_PROCESS_OUTPUT = 1024 * 1024;
const MARKER = 'data-responsive-hero';
const REMOTE_JPEG = /^https:\/\/(?:media\.aitamer\.news\/heroes\/[a-z0-9][a-z0-9-]*|bots\.aitamer\.news\/heroes\/[a-z0-9][a-z0-9-]*-[0-9a-f]{8})\.jpg$/;
const LOCAL_WEBP = /^\/(?:[A-Za-z0-9._~-]+\/)*_astro\/[A-Za-z0-9._~-]+\.webp$/;
const COMPARATOR_FILTER = '[1:v]scale=W:H:flags=lanczos,format=yuv444p[ref];[0:v]format=yuv444p[test];[test][ref]ssim';
const attrs = (node) => Object.fromEntries((node.attrs ?? []).map(({ name, value }) => [name, value]));
const isOwnedJpeg = (src) => typeof src === 'string' && src.endsWith('.jpg') && REMOTE_JPEG.test(src);
const isLocalWebp = (url) => url.endsWith('.webp') && LOCAL_WEBP.test(url) && !url.split('/').some((part) => part === '.' || part === '..');
const escaped = (value) => value.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const candidateKey = (pair, candidate) => JSON.stringify([pair.jpeg, pair.webp, pair.rawWidth, candidate.url, candidate.width]);
const messageOf = (error) => error instanceof Error ? error.message : String(error);
const delay = (ms) => new Promise((done) => setTimeout(done, ms));
const sha256 = (bytes) => createHash('sha256').update(bytes).digest('hex');
const evidence = (bytes, metadata) => ({ bytes: bytes.length, sha256: sha256(bytes), width: metadata?.width ?? null, height: metadata?.height ?? null, codec: metadata?.codec_name ?? null });
const inside = (root, file) => { const path = relative(root, file); return path !== '..' && !path.startsWith(`..${sep}`) && !path.startsWith(sep); };

/** A decoder rejecting image bytes is a derivative exclusion; tool/runtime failure is fatal. */
export class ImageEvidenceError extends Error {}
export class OperationalError extends Error {}
const malformed = (reason) => { throw new Error(`Malformed marked responsive hero: ${reason}`); };

/** Validate only explicitly marked pictures. Never infer ownership from a similar-looking article image. */
export function planHeroTags(html) {
  const errors = [];
  const document = parse(html, { sourceCodeLocationInfo: true, onParseError: (error) => errors.push(error) });
  const plans = [];
  const visit = (node) => {
    const attributes = attrs(node);
    if (Object.hasOwn(attributes, MARKER)) {
      if (node.tagName !== 'picture' || attributes[MARKER] !== '') malformed('marker must belong to a picture');
      const location = node.sourceCodeLocation;
      if (!location?.startTag || !location.endTag) malformed('picture has no explicit closing tag');
      if (errors.some((error) => error.code !== 'missing-doctype' && error.startOffset >= location.startOffset && error.startOffset < location.endOffset)) malformed('HTML parser error or duplicate attribute');
      const elements = (node.childNodes ?? []).filter((child) => child.tagName);
      if (elements.length !== 2 || elements[0].tagName !== 'source' || elements[1].tagName !== 'img'
        || (node.childNodes ?? []).some((child) => child.nodeName === '#text' && child.value.trim())) malformed('picture must contain one source followed by one img');
      const [source, image] = elements;
      const sourceAttrs = attrs(source);
      const jpeg = attrs(image).src;
      const attributeLocation = source.sourceCodeLocation?.attrs?.srcset;
      if (!isOwnedJpeg(jpeg) || sourceAttrs.type !== 'image/webp' || !sourceAttrs.srcset || !attributeLocation) malformed('missing owned JPEG/WebP source pair or srcset location');
      const candidates = sourceAttrs.srcset.split(',').map((part) => {
        const [url, descriptor, ...rest] = part.trim().split(/\s+/);
        const width = /^[1-9]\d*w$/.test(descriptor ?? '') ? Number(descriptor.slice(0, -1)) : NaN;
        if (rest.length || !Number.isSafeInteger(width)) malformed('srcset requires positive integer width descriptors');
        if (url !== jpeg.replace(/\.jpg$/, '.webp') && !isLocalWebp(url)) malformed('srcset contains an unowned or unsafe candidate URL');
        return { text: part.trim(), url, width };
      });
      if (new Set(candidates.map(({ url }) => url)).size !== candidates.length
        || new Set(candidates.map(({ width }) => width)).size !== candidates.length) malformed('duplicate srcset URL or width descriptor');
      const raw = candidates.filter(({ url }) => url === jpeg.replace(/\.jpg$/, '.webp'));
      if (raw.length !== 1) malformed('srcset must retain exactly one original WebP');
      plans.push({ pair: { jpeg, webp: raw[0].url, rawWidth: raw[0].width }, candidates, generated: candidates.filter(({ url }) => isLocalWebp(url)), location: attributeLocation });
    }
    for (const child of node.childNodes ?? []) visit(child);
    if (node.content) visit(node.content);
  };
  visit(document);
  return plans;
}

/** Only rejected generated entries change. Operational exceptions always abort the build. */
export async function finalizeHeroHtml(html, qualify) {
  const changes = [];
  const rejected = [];
  for (const plan of planHeroTags(html)) {
    const failures = new Set();
    for (const candidate of plan.generated) {
      const verdict = await qualify(plan.pair, candidate);
      if (!verdict || typeof verdict.ok !== 'boolean' || typeof verdict.reason !== 'string') throw new OperationalError('Missing or invalid candidate qualification verdict');
      if (!verdict.ok) {
        failures.add(candidate);
        rejected.push({ jpeg: plan.pair.jpeg, candidate: candidate.url, reason: verdict.reason });
      }
    }
    if (failures.size) {
      const srcset = plan.candidates.filter((candidate) => !failures.has(candidate)).map(({ text }) => text).join(', ');
      changes.push({ ...plan.location, text: `srcset="${escaped(srcset)}"` });
    }
  }
  let output = html;
  for (const change of changes.sort((a, b) => b.startOffset - a.startOffset)) output = output.slice(0, change.startOffset) + change.text + output.slice(change.endOffset);
  return { html: output, rejected, changedTags: changes.length };
}

/** Wait for all active workers before surfacing failure; start no further pair after a failure. */
async function concurrent(items, action) {
  let next = 0, failure;
  await Promise.all(Array.from({ length: Math.min(QUALIFICATION_CONCURRENCY, items.length) }, async () => {
    while (!failure && next < items.length) {
      try { await action(items[next++]); } catch (error) { failure ??= error; }
    }
  }));
  if (failure) throw failure;
}

async function retry(action, attempts, retryDelay) {
  for (let attempt = 1; ; attempt++) {
    try { return await action(); }
    catch (error) {
      if (attempt >= attempts || error instanceof OperationalError) throw error;
      await retryDelay(FETCH_RETRY_DELAY_MS);
    }
  }
}

/** No redirects: an owned image may never send this build's request to another origin. */
export async function fetchHeroBytes(url, { fetchImpl = fetch, attempts = FETCH_ATTEMPTS, retryDelay = delay } = {}) {
  if (!isOwnedJpeg(url.replace(/\.webp$/, '.jpg'))) throw new OperationalError('unrecognized remote hero URL');
  if (!Number.isSafeInteger(attempts) || attempts < 1 || attempts > FETCH_ATTEMPTS) throw new OperationalError('invalid hero fetch attempt limit');
  return retry(async () => {
    const response = await fetchImpl(url, { redirect: 'error', signal: AbortSignal.timeout(FETCH_TIMEOUT_MS) });
    if (!response.ok || !response.body) { await response.body?.cancel(); throw new Error(`remote image HTTP ${response.status}`); }
    const declaredSize = Number(response.headers.get('content-length'));
    if (declaredSize > MAX_IMAGE_BYTES) { await response.body.cancel(); throw new ImageEvidenceError('remote image exceeds body limit'); }
    const reader = response.body.getReader();
    const chunks = [];
    let size = 0;
    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        size += value.byteLength;
        if (size > MAX_IMAGE_BYTES) throw new ImageEvidenceError('remote image exceeds body limit');
        chunks.push(value);
      }
    } finally { await reader.cancel(); }
    if (!size) throw new ImageEvidenceError('remote image is empty');
    return Buffer.concat(chunks, size);
  }, attempts, retryDelay);
}

/** Decode only supplied bytes, with explicit image demuxers, bounded output and runtime. */
export function runImageProcess(command, args, inputs = []) {
  return new Promise((resolveResult, reject) => {
    const child = spawn(command, args, { stdio: ['ignore', 'pipe', 'pipe', ...inputs.map(() => 'pipe')] });
    const stdout = [], stderr = [];
    let outputBytes = 0, failure;
    const timer = setTimeout(() => { failure = new OperationalError(`${command} exceeded ${PROCESS_TIMEOUT_MS}ms`); child.kill('SIGKILL'); }, PROCESS_TIMEOUT_MS);
    const collect = (target) => (chunk) => {
      outputBytes += chunk.length;
      if (outputBytes > MAX_PROCESS_OUTPUT) { failure = new OperationalError(`${command} output limit exceeded`); child.kill('SIGKILL'); }
      else target.push(chunk);
    };
    child.stdout.on('data', collect(stdout));
    child.stderr.on('data', collect(stderr));
    child.on('error', (error) => { failure = new OperationalError(`${command}: ${error.message}`, { cause: error }); });
    inputs.forEach((bytes, index) => {
      child.stdio[index + 3].on('error', () => {}); // Decoder rejection can close a pipe early; exit status is authoritative.
      child.stdio[index + 3].end(bytes);
    });
    child.on('close', (code, signal) => {
      clearTimeout(timer);
      if (failure) reject(failure);
      else if (signal) reject(new OperationalError(`${command} terminated by ${signal}`));
      else if (code !== 0) reject(new ImageEvidenceError(`${command} decode exited ${code}: ${Buffer.concat(stderr).toString().slice(-600)}`));
      else resolveResult({ stdout: Buffer.concat(stdout).toString(), stderr: Buffer.concat(stderr).toString() });
    });
  });
}

export async function probeImage(bytes, format) {
  const { stdout } = await runImageProcess('ffprobe', [
    '-v', 'error', '-threads', '1', '-protocol_whitelist', 'file,pipe', '-f', format === 'jpg' ? 'mjpeg' : 'webp_pipe',
    '-i', 'pipe:3', '-show_entries', 'stream=width,height,codec_name', '-of', 'json',
  ], [bytes]);
  let streams;
  try { ({ streams } = JSON.parse(stdout)); } catch { throw new ImageEvidenceError('invalid ffprobe metadata output'); }
  const image = streams?.[0];
  if (streams?.length !== 1 || !validDimensions(image) || image.codec_name !== (format === 'jpg' ? 'mjpeg' : 'webp')) throw new ImageEvidenceError('unknown, oversized or unexpected image metadata');
  return image;
}

/** Metadata can survive a truncated payload; require one actual decoded frame before comparison. */
export async function decodeImage(bytes, format) {
  await runImageProcess('ffmpeg', [
    '-hide_banner', '-nostdin', '-loglevel', 'error', '-xerror', '-threads', '1',
    '-protocol_whitelist', 'file,pipe', '-f', format === 'jpg' ? 'mjpeg' : 'webp_pipe', '-i', 'pipe:3',
    '-threads', '1', '-frames:v', '1', '-f', 'null', '-',
  ], [bytes]);
}

function validDimensions(image) {
  return Number.isSafeInteger(image?.width) && Number.isSafeInteger(image?.height) && image.width > 0 && image.height > 0
    && image.width <= MAX_DIMENSION && image.height <= MAX_DIMENSION && image.width * image.height <= MAX_PIXELS;
}

export async function measureSsim(jpeg, candidate, width, height) {
  const filter = COMPARATOR_FILTER.replace('W:H', `${width}:${height}`);
  let stderr;
  try { ({ stderr } = await runImageProcess('ffmpeg', [
    '-hide_banner', '-nostdin', '-loglevel', 'info', '-threads', '1',
    '-protocol_whitelist', 'file,pipe', '-f', 'webp_pipe', '-i', 'pipe:3',
    '-threads', '1', '-protocol_whitelist', 'file,pipe', '-f', 'mjpeg', '-i', 'pipe:4',
    '-filter_complex_threads', '1', '-filter_complex', filter,
    '-threads', '1', '-frames:v', '1', '-f', 'null', '-',
  ], [candidate, jpeg])); }
  catch (error) {
    // Both images were decoded separately. A broken comparator/filter must never remove all variants silently.
    throw new OperationalError(`SSIM comparator failed: ${messageOf(error)}`, { cause: error });
  }
  const matches = [...stderr.matchAll(/\bAll:([0-9]+(?:\.[0-9]+)?)/g)];
  const score = Number(matches.at(-1)?.[1]);
  if (!Number.isFinite(score) || score < 0 || score > 1) throw new OperationalError('FFmpeg did not produce a valid SSIM score');
  return score;
}

export async function qualifyVariant(pair, candidate, jpegBytes, webpBytes, jpeg, webp, bytes, { probe = probeImage, decode = decodeImage, ssim = measureSsim } = {}) {
  let actual = evidence(bytes);
  const exclude = (reasonCode, reason, score = null) => ({ ok: false, verdict: 'excluded', reasonCode, reason, ssim: score, actual });
  if (!Number.isSafeInteger(candidate.width) || candidate.width <= 0 || candidate.width >= jpeg.width || candidate.width >= webp.width
    || pair.rawWidth !== webp.width || Math.abs(webp.height - jpeg.height * webp.width / jpeg.width) > 1) return exclude('dimensions', 'invalid descriptor, source dimensions or aspect ratio');
  if (bytes.length > MAX_IMAGE_BYTES) return exclude('bytes', 'generated image exceeds body limit');
  try {
    const image = await probe(bytes, 'webp');
    actual = evidence(bytes, image);
    const height = Math.round(candidate.width * jpeg.height / jpeg.width);
    if (!validDimensions(image) || image.width !== candidate.width || image.height !== height) return exclude('dimensions', 'generated dimensions disagree with descriptor or original aspect');
    if (bytes.length >= webpBytes.length) return exclude('bytes', `variant bytes ${bytes.length} are not below original WebP ${webpBytes.length}`);
    await decode(bytes, 'webp');
    const score = await ssim(jpegBytes, bytes, candidate.width, height);
    if (!Number.isFinite(score) || score < 0 || score > 1) throw new OperationalError('invalid SSIM measurement');
    return score < MIN_SSIM ? exclude('quality', `SSIM ${score} below ${MIN_SSIM}`, score)
      : { ok: true, verdict: 'admitted', reasonCode: 'qualified', reason: 'qualified', ssim: score, actual };
  } catch (error) {
    if (!(error instanceof ImageEvidenceError)) throw error;
    return exclude('decode', messageOf(error));
  }
}

async function candidateFile(dist, url, base) {
  if (!isLocalWebp(url)) throw new OperationalError('unrecognized local image URL');
  const prefix = base === '/' ? '/' : `/${base.replace(/^\/+|\/+$/g, '')}/`;
  if (!url.startsWith(prefix)) throw new OperationalError('local candidate is outside the site base');
  const assetPath = url.slice(prefix.length);
  if (!/^_astro\/[A-Za-z0-9._~-]+\.webp$/.test(assetPath)) throw new OperationalError('local candidate is outside the configured Astro asset path');
  const root = await realpath(dist);
  const file = await realpath(resolve(root, assetPath));
  if (file === root || !inside(root, file)) throw new OperationalError('local candidate escapes dist');
  const metadata = await stat(file);
  if (!metadata.isFile()) throw new OperationalError('local candidate is not a regular image file');
  if (metadata.size > MAX_IMAGE_BYTES) throw new ImageEvidenceError('generated image exceeds body limit');
  const bytes = await readFile(file);
  if (bytes.length > MAX_IMAGE_BYTES) throw new ImageEvidenceError('generated image exceeds body limit');
  return bytes;
}

async function htmlFiles(dist) {
  const files = [];
  const walk = async (dir) => {
    for (const entry of await readdir(dir, { withFileTypes: true })) {
      if (entry.isDirectory()) await walk(resolve(dir, entry.name));
      else if (entry.isFile() && entry.name.endsWith('.html')) files.push(resolve(dir, entry.name));
    }
  };
  await walk(dist);
  return files.sort();
}

async function toolsVersion() {
  const ffmpeg = await runImageProcess('ffmpeg', ['-version']);
  const ffprobe = await runImageProcess('ffprobe', ['-version']);
  return { ffmpeg: ffmpeg.stdout.split('\n')[0], ffprobe: ffprobe.stdout.split('\n')[0] };
}

/** Every invocation requalifies current emitted bytes. Receipts are local artifacts, never public assets. */
export async function finalizeBuild(dist = 'dist', base = process.env.ASTRO_BASE ?? '/', options = {}) {
  const started = performance.now();
  const root = await realpath(dist);
  const receiptDirectory = resolve(options.receiptDirectory ?? 'node_modules/.astro/responsive-heroes');
  if (inside(root, receiptDirectory)) throw new OperationalError('qualification receipt directory must be outside public dist');
  const receiptPath = resolve(receiptDirectory, `qualification-${Date.now()}-${randomUUID()}.json`);
  const report = {
    schemaVersion: 1, status: 'running', startedAt: new Date().toISOString(), receiptPath,
    recipe: { source: 'canonical-jpeg', widths: [...HERO_DELIVERY_WIDTHS], format: 'webp', quality: HERO_DELIVERY_QUALITY, minSsim: MIN_SSIM, maxDimension: MAX_DIMENSION, maxPixels: MAX_PIXELS, maxImageBytes: MAX_IMAGE_BYTES },
    comparator: { id: 'ffmpeg-lanczos-yuv444p-ssim-v1', inputs: ['generated-webp', 'canonical-jpeg'], filter: COMPARATOR_FILTER, threads: 1, ffmpeg: null, ffprobe: null },
    pairs: [], candidates: [], totals: { htmlPages: 0, markedPages: 0, markedPictures: 0, uniquePairs: 0, candidateOccurrences: 0, uniqueCandidates: 0, admittedCandidates: 0, excludedCandidates: 0, changedTags: 0, rejectedOccurrences: 0 },
  };
  let failure;
  try {
    const pages = await Promise.all((await htmlFiles(root)).map(async (file) => ({ file, html: await readFile(file, 'utf8') })));
    const pairs = new Map(), records = new Map(), results = new Map();
    report.totals.htmlPages = pages.length;
    for (const page of pages) {
      page.plans = planHeroTags(page.html);
      if (page.plans.length) report.totals.markedPages++;
      report.totals.markedPictures += page.plans.length;
      for (const plan of page.plans) {
        if (!plan.generated.length) continue; // A previous pass removed all derivatives; originals remain valid.
        const key = JSON.stringify(plan.pair);
        if (!pairs.has(key)) pairs.set(key, { pair: plan.pair, candidates: new Map() });
        for (const candidate of plan.generated) {
          const candidateId = candidateKey(plan.pair, candidate);
          pairs.get(key).candidates.set(candidateId, candidate);
          if (!records.has(candidateId)) records.set(candidateId, { jpeg: plan.pair.jpeg, rawWebp: plan.pair.webp, url: candidate.url, descriptorWidth: candidate.width, pages: new Set(), occurrenceCount: 0 });
          const record = records.get(candidateId);
          record.pages.add(relative(root, page.file));
          record.occurrenceCount++;
          report.totals.candidateOccurrences++;
        }
      }
    }
    report.totals.uniquePairs = pairs.size;
    report.totals.uniqueCandidates = records.size;
    if (pairs.size) Object.assign(report.comparator, await (options.toolsVersion ?? toolsVersion)());
    const loadOriginal = async (url, format) => {
      try {
        return await retry(async () => {
          const bytes = await (options.fetchBytes ?? fetchHeroBytes)(url, { attempts: 1 });
          if (!Buffer.isBuffer(bytes) || !bytes.length || bytes.length > MAX_IMAGE_BYTES) throw new ImageEvidenceError('original exceeds body limit or is empty');
          const metadata = await (options.probe ?? probeImage)(bytes, format);
          if (!validDimensions(metadata)) throw new ImageEvidenceError('original exceeds dimension or pixel limit');
          await (options.decode ?? decodeImage)(bytes, format);
          return { bytes, metadata };
        }, FETCH_ATTEMPTS, options.retryDelay ?? delay);
      } catch (error) { throw new OperationalError(`Unable to qualify original ${url}: ${messageOf(error)}`, { cause: error }); }
    };
    await concurrent([...pairs.values()], async ({ pair, candidates }) => {
      const pairReceipt = { jpeg: { url: pair.jpeg }, webp: { url: pair.webp } };
      report.pairs.push(pairReceipt);
      const jpeg = await loadOriginal(pair.jpeg, 'jpg');
      Object.assign(pairReceipt.jpeg, evidence(jpeg.bytes, jpeg.metadata));
      const webp = await loadOriginal(pair.webp, 'webp');
      Object.assign(pairReceipt.webp, evidence(webp.bytes, webp.metadata));
      if (pair.rawWidth !== webp.metadata.width || webp.metadata.width > jpeg.metadata.width
        || Math.abs(webp.metadata.height - jpeg.metadata.height * webp.metadata.width / jpeg.metadata.width) > 1) throw new OperationalError(`Original hero dimensions/aspect disagree with marked source: ${pair.jpeg}`);
      for (const [key, candidate] of candidates) {
        let verdict;
        try {
          const bytes = await candidateFile(root, candidate.url, base);
          verdict = await qualifyVariant(pair, candidate, jpeg.bytes, webp.bytes, jpeg.metadata, webp.metadata, bytes, { probe: options.probe, decode: options.decode, ssim: options.ssim });
        } catch (error) {
          if (!(error instanceof ImageEvidenceError)) throw error;
          verdict = { ok: false, verdict: 'excluded', reasonCode: 'bytes', reason: messageOf(error), actual: null, ssim: null };
        }
        results.set(key, verdict);
        const record = records.get(key);
        const pages = [...record.pages].sort();
        report.candidates.push({ ...record, pages, pageCount: pages.length, ...verdict });
        report.totals[verdict.ok ? 'admittedCandidates' : 'excludedCandidates']++;
      }
    });
    // Plan every rewrite before writing any page. Operational failures cannot silently publish fallbacks.
    const rewrites = [];
    for (const page of pages) {
      const result = await finalizeHeroHtml(page.html, (pair, candidate) => results.get(candidateKey(pair, candidate)));
      if (result.changedTags) rewrites.push({ file: page.file, html: result.html });
      report.totals.changedTags += result.changedTags;
      report.totals.rejectedOccurrences += result.rejected.length;
    }
    for (const page of rewrites) await writeFile(page.file, page.html);
    report.status = 'passed';
  } catch (error) {
    failure = error;
    report.status = 'failed';
    report.error = { name: error.name ?? 'Error', message: messageOf(error) };
  }
  report.pairs.sort((a, b) => a.jpeg.url.localeCompare(b.jpeg.url));
  report.candidates.sort((a, b) => a.jpeg.localeCompare(b.jpeg) || a.descriptorWidth - b.descriptorWidth || a.url.localeCompare(b.url));
  report.elapsedMs = Math.round((performance.now() - started) * 1000) / 1000;
  await mkdir(receiptDirectory, { recursive: true });
  if (inside(root, await realpath(receiptDirectory))) throw new OperationalError('qualification receipt directory must be outside public dist');
  await writeFile(receiptPath, `${JSON.stringify(report, null, 2)}\n`, { flag: 'wx' });
  console.log(`responsive-heroes: ${JSON.stringify({ status: report.status, ...report.totals, elapsedMs: report.elapsedMs, receiptPath })}`);
  if (failure) throw failure;
  return report;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  finalizeBuild(process.argv[2] ?? 'dist').catch((error) => { console.error(`responsive-heroes: ${error.stack ?? error}`); process.exitCode = 1; });
}

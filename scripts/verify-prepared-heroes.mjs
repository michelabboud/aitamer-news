#!/usr/bin/env node
/** Routine builds verify already-qualified bytes; no image generation or decoder tools. */
import { readFile, readdir } from 'node:fs/promises';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import { parse } from 'parse5';
import { validatePreparedCatalog, planPreparedHero } from '../src/lib/prepared-heroes.ts';

export const PREPARED_FETCH_TIMEOUT_MS = 20_000;
export const PREPARED_FETCH_ATTEMPTS = 3;
export const PREPARED_FETCH_CONCURRENCY = 8;
export const PREPARED_MAX_IMAGE_BYTES = 20 * 1024 * 1024;
const attrs = n => Object.fromEntries((n.attrs ?? []).map(a => [a.name,a.value]));
const digest = bytes => createHash('sha256').update(bytes).digest('hex');

export function checkPreparedBytes(bytes, image, format) {
  if (!Buffer.isBuffer(bytes) || bytes.length !== image.bytes || bytes.length > PREPARED_MAX_IMAGE_BYTES || digest(bytes) !== image.sha256) throw new Error(`Prepared image checksum/size mismatch: ${image.url}`);
  const signature = format === 'jpeg' ? bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255
    : bytes.subarray(0,4).toString() === 'RIFF' && bytes.subarray(8,12).toString() === 'WEBP';
  if (!signature) throw new Error(`Prepared image signature mismatch: ${image.url}`);
}

export async function fetchPreparedBytes(image, format, fetcher = fetch) {
  for (let attempt=1; ; attempt++) {
    const abort = new AbortController(), timer = setTimeout(() => abort.abort(), PREPARED_FETCH_TIMEOUT_MS);
    try {
      const response = await fetcher(image.url, {redirect:'error',signal:abort.signal});
      if (response.status !== 200 || response.headers.get('content-type')?.split(';')[0].trim().toLowerCase() !== `image/${format}`) throw new Error(`Prepared image unavailable or wrong MIME: ${image.url}`);
      const declared = response.headers.get('content-length');
      if (declared !== null && (!/^\d+$/.test(declared) || Number(declared) !== image.bytes)) throw new Error(`Prepared image declared size mismatch: ${image.url}`);
      const chunks=[]; let size=0;
      if (!response.body) throw new Error('Empty image response');
      for await (const chunk of response.body) {
        size += chunk.length;
        if (size > image.bytes || size > PREPARED_MAX_IMAGE_BYTES) { abort.abort(); throw new Error(`Prepared image body exceeds limit: ${image.url}`); }
        chunks.push(chunk);
      }
      const bytes = Buffer.concat(chunks); checkPreparedBytes(bytes,image,format); return bytes;
    } catch (error) {
      abort.abort();
      if (attempt >= PREPARED_FETCH_ATTEMPTS) throw error;
      await new Promise(done=>setTimeout(done,250*attempt));
    } finally { clearTimeout(timer); }
  }
}

export function preparedImagesInHtml(html, catalog) {
  const pairs = new Map(catalog.pairs.map(p=>[p.jpeg.url,p])), required=new Map(), errors=[];
  const document = parse(html,{onParseError:e=>errors.push(e.code)});
  const visit = node => {
    const a=attrs(node);
    if (Object.hasOwn(a,'data-responsive-hero')) {
      const children=(node.childNodes ?? []).filter(n=>n.tagName);
      if (node.tagName !== 'picture' || a['data-responsive-hero'] !== '' || children.length !== 2 || children[0].tagName !== 'source' || children[1].tagName !== 'img') throw new Error('Malformed prepared hero picture');
      const source=attrs(children[0]), image=attrs(children[1]), pair=pairs.get(image.src);
      if (!pair) throw new Error('Marked hero has no approved catalog entry');
      const expected=planPreparedHero({src:pair.jpeg.url,webp:pair.webp.url},catalog).candidates.map(c=>`${c.src} ${c.width}w`).join(', ');
      if (source.type !== 'image/webp' || source.srcset !== expected) throw new Error('Prepared hero srcset differs from approved catalog');
      for (const value of [pair.jpeg,pair.webp,...pair.variants]) required.set(value.url,{image:value,format:value.url.endsWith('.jpg')?'jpeg':'webp'});
    }
    // A catalog URL outside a marked picture is never an implicit approval. Other ordinary
    // body images remain governed by their existing rendered-body contract.
    if (node.tagName === 'source' && /\/heroes\/responsive-[^\s,]+/.test(a.srcset ?? '')) {
      if (!node.parentNode || !Object.hasOwn(attrs(node.parentNode),'data-responsive-hero')) throw new Error('Unmarked prepared hero source');
    }
    for (const child of node.childNodes ?? []) visit(child);
    if (node.content) visit(node.content);
  };
  visit(document);
  if (required.size && errors.includes('duplicate-attribute')) throw new Error('Duplicate attributes in prepared-image document');
  return required;
}

export async function verifyPreparedBuild(dist='dist', {catalog, fetchBytes=fetchPreparedBytes}={}) {
  catalog ??= JSON.parse(await readFile(new URL('../src/data/prepared-heroes.json',import.meta.url),'utf8'));
  catalog = validatePreparedCatalog(catalog);
  const required = new Map(); let pages=0;
  const walk = async dir => {
    for (const entry of await readdir(dir,{withFileTypes:true})) {
      const path=resolve(dir,entry.name);
      if (entry.isDirectory()) await walk(path);
      else if (entry.isFile() && entry.name.endsWith('.html')) { pages++; for(const [url,image] of preparedImagesInHtml(await readFile(path,'utf8'),catalog)) required.set(url,image); }
    }
  };
  await walk(resolve(dist));
  const queue=[...required.values()];let index=0,bytes=0;
  await Promise.all(Array.from({length:Math.min(PREPARED_FETCH_CONCURRENCY,queue.length)},async()=>{
    while(index<queue.length){const {image,format}=queue[index++];const body=await fetchBytes(image,format);checkPreparedBytes(body,image,format);bytes+=body.length;}
  }));
  const result={pages,verifiedImages:required.size,bytes};console.log(`prepared-heroes: ${JSON.stringify(result)}`);return result;
}
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) verifyPreparedBuild(process.argv[2]??'dist').catch(error=>{console.error(error.message);process.exitCode=1;});

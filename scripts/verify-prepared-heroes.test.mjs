import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {checkPreparedBytes,fetchPreparedBytes,preparedImagesInHtml,verifyPreparedBuild,PREPARED_FETCH_ATTEMPTS} from './verify-prepared-heroes.mjs';
import {validatePreparedCatalog,PREPARED_HERO_POLICY_SHA256} from '../src/lib/prepared-heroes.ts';
import {mkdtemp,mkdir,writeFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
function fixture() {
  const jpg=Buffer.concat([Buffer.from([255,216,255]),Buffer.alloc(100)]),webp=Buffer.from('RIFF'+'.'.repeat(4)+'WEBP'+'.'.repeat(60)),variant=Buffer.from('RIFF'+'.'.repeat(4)+'WEBP'+'.'.repeat(12));
  const info=(url,bytes,width,height)=>({url,sha256:sha(bytes),bytes:bytes.length,width,height});
  const pair={jpeg:info('https://media.aitamer.news/heroes/fixture.jpg',jpg,1600,900),webp:info('https://media.aitamer.news/heroes/fixture.webp',webp,960,540),variants:[{...info(`https://media.aitamer.news/heroes/responsive-${sha(variant)}.webp`,variant,480,270),ssim:.98}]};
  const catalog=validatePreparedCatalog({schemaVersion:1,recipe:{widths:[480,720],quality:84,minSsim:.95},qualification:{policySha256:PREPARED_HERO_POLICY_SHA256,receiptSha256:'a'.repeat(64)},pairs:[pair]});
  const html=`<picture data-responsive-hero><source type="image/webp" srcset="${pair.variants[0].url} 480w, ${pair.webp.url} 960w"><img src="${pair.jpeg.url}"></picture>`;
  return{catalog,pair,html,jpg,webp,variant};
}
test('prepared HTML validates catalog srcsets and traverses inert feed templates',()=>{
  const f=fixture();assert.equal(preparedImagesInHtml(`<template>${f.html}</template>`,f.catalog).size,3);
  assert.throws(()=>preparedImagesInHtml(f.html.replace('480w','720w'),f.catalog),/srcset/);
  assert.throws(()=>preparedImagesInHtml(f.html.replace(' data-responsive-hero',''),f.catalog),/Unmarked/);
  assert.throws(()=>preparedImagesInHtml(f.html.replace('fixture.jpg','other.jpg'),f.catalog),/catalog/);
});
test('current original and derivative bytes are both bound; signatures are checked',()=>{
  const f=fixture();checkPreparedBytes(f.jpg,f.pair.jpeg,'jpeg');checkPreparedBytes(f.variant,f.pair.variants[0],'webp');
  assert.throws(()=>checkPreparedBytes(Buffer.alloc(f.jpg.length),f.pair.jpeg,'jpeg'),/checksum/);
  const wrong=Buffer.alloc(f.variant.length);assert.throws(()=>checkPreparedBytes(wrong,{...f.pair.variants[0],sha256:sha(wrong)},'webp'),/signature/);
});
test('network verifier refuses redirects/MIME/overlong bodies and bounds retries',async()=>{
  const f=fixture();let calls=0;
  await assert.rejects(fetchPreparedBytes(f.pair.variants[0],'webp',async(url,options)=>{calls++;assert.equal(options.redirect,'error');return new Response(f.variant,{headers:{'content-type':'image/jpeg'}});}),/MIME/);
  assert.equal(calls,PREPARED_FETCH_ATTEMPTS);
  await assert.rejects(fetchPreparedBytes(f.pair.variants[0],'webp',async()=>new Response(Buffer.alloc(100),{headers:{'content-type':'image/webp'}})),/exceeds/);
  const bytes=await fetchPreparedBytes(f.pair.variants[0],'webp',async()=>new Response(f.variant,{headers:{'content-type':'image/webp','content-length':String(f.variant.length)}}));assert.deepEqual(bytes,f.variant);
});
test('built pages deduplicate byte verification including all originals; no decoder required',async()=>{
  const f=fixture(),root=await mkdtemp(join(tmpdir(),'prepared-build-'));await mkdir(join(root,'home-feed'));await writeFile(join(root,'index.html'),f.html);await writeFile(join(root,'home-feed','index.html'),`<template>${f.html}</template>`);
  const calls=[];const result=await verifyPreparedBuild(root,{catalog:f.catalog,fetchBytes:async(image)=>{calls.push(image.url);return image.url.endsWith('.jpg')?f.jpg:image.url.includes('responsive-')?f.variant:f.webp;}});
  assert.equal(result.pages,2);assert.equal(calls.length,3);assert.equal(new Set(calls).size,3);
  await assert.rejects(verifyPreparedBuild(root,{catalog:f.catalog,fetchBytes:async()=>Buffer.alloc(5)}),/checksum/);
});

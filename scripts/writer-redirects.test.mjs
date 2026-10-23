import assert from 'node:assert/strict';
import { test } from 'node:test';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { renderWriterRedirects, validateRedirectLimits, writeWriterRedirects } from './writer-redirects.mjs';
import { tempDir } from './test-support.mjs';

const rules = (text) => text.split('\n').filter((line) => line && !line.startsWith('#'));

test('only present historical aliases have exact query-neutral 301s for both URL spellings', () => {
  const text = renderWriterRedirects('/section/top/ /section/general/ 301\n', ['ari', 'desk-bot', 'new-author']);
  assert.deepEqual(rules(text), [
    '/ari/ /authors/ari/ 301', '/ari /authors/ari/ 301', '/section/top/ /section/general/ 301',
  ]);
  // Pages retains incoming searches when the destination has no query. The real edge is a deployment check.
  for (const line of rules(text).slice(0, 2)) {
    const [source, target, status] = line.split(' ');
    assert.doesNotMatch(source, /[?*]/);
    assert.equal(new URL(target, 'https://aitamer.news').search, '');
    assert.equal(status, '301');
  }
});

test('all historical aliases remain bounded and stale source copies are regenerated for the snapshot', () => {
  const text = renderWriterRedirects('/mai/ /authors/mai/ 301\n/ari /authors/ari/ 301\n', ['ari', 'mai', 'aviram', 'quill', 'foxy']);
  assert.equal(rules(text).length, 10);
  assert.equal(rules(text).filter((line) => line.startsWith('/mai/ ')).length, 1);
  assert.deepEqual(rules(renderWriterRedirects('/mai/ /authors/mai/ 301\n', [])), []);
  assert.doesNotMatch(text, /\*/);
});

test('unrelated pages, assets and redirects cannot be hidden behind an owned alias', () => {
  for (const entries of [{ pages: ['ari.astro'] }, { assets: ['ari'] }]) {
    assert.throws(() => renderWriterRedirects('', ['ari'], entries), /ari would collide/);
  }
  for (const redirect of ['/ari/ /elsewhere/ 301', '/ari/photo.jpg /photo.jpg 301', '/ari/ /authors/ari/ 302']) {
    assert.throws(() => renderWriterRedirects(redirect, ['ari']), /ari would collide/);
  }
});

test('Pages rule and line overflow fail before output is written', () => {
  const statics = Array.from({ length: 2000 }, (_, i) => `/old-${i} /new-${i} 301`).join('\n');
  validateRedirectLimits(statics);
  assert.throws(() => renderWriterRedirects(statics, ['ari']), /2002 static/);
  const dynamic = Array.from({ length: 100 }, (_, i) => `/old-${i}/* /new/:splat 301`).join('\n');
  validateRedirectLimits(dynamic);
  assert.throws(() => validateRedirectLimits(`${dynamic}\n/extra/* /new/:splat 301`), /101 dynamic/);
  assert.throws(() => validateRedirectLimits(`/${'x'.repeat(1000)} /new 301`), /exceeds 1000/);
});

test('generation writes only dist, is repeatable, and leaves source unchanged on success and failure', () => {
  const root = tempDir('aitamer-writer-redirects-');
  for (const name of ['src/content/authors', 'src/pages', 'public', 'dist']) mkdirSync(join(root, name), { recursive: true });
  writeFileSync(join(root, 'src/content/authors/ari.md'), 'fixture');
  writeFileSync(join(root, 'src/content/authors/desk-bot.md'), 'fixture');
  const source = '/old/ /new/ 301\n';
  const sourcePath = join(root, 'public/_redirects');
  const target = join(root, 'dist/_redirects');
  writeFileSync(sourcePath, source);
  const first = writeWriterRedirects({ root });
  assert.equal(writeWriterRedirects({ root }), first);
  assert.equal(readFileSync(sourcePath, 'utf8'), source);
  assert.equal(readFileSync(target, 'utf8'), first);
  writeFileSync(sourcePath, '/ari/ /unrelated/ 301\n');
  assert.throws(() => writeWriterRedirects({ root }), /ari would collide/);
  assert.equal(readFileSync(target, 'utf8'), first);
  assert.equal(readFileSync(sourcePath, 'utf8'), '/ari/ /unrelated/ 301\n');
  const overflow = Array.from({ length: 2000 }, (_, i) => `/old-${i} /new-${i} 301`).join('\n');
  writeFileSync(sourcePath, overflow);
  assert.throws(() => writeWriterRedirects({ root }), /2002 static/);
  assert.equal(readFileSync(target, 'utf8'), first);
  assert.equal(readFileSync(sourcePath, 'utf8'), overflow);
});

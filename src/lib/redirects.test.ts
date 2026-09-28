import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { LEGACY_SECTIONS } from './habitats.ts';
import { LEGACY_HEROES, heroUrl } from './media.ts';

/**
 * public/_redirects is written by hand from LEGACY_SECTIONS and LEGACY_HEROES (Cloudflare needs a
 * static file). This keeps them from drifting: every retired section has both trailing-slash forms,
 * pointing at the habitat it folded into; every hero that lived in the repo points at its media URL
 * (ADR 0020); all as permanent redirects, and nothing else is in there.
 */
const REDIRECTS_FILE = new URL('../../public/_redirects', import.meta.url);

function parseRedirects(text: string): { from: string; to: string; status: string }[] {
  return text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line !== '' && !line.startsWith('#'))
    .map((line) => {
      const parts = line.split(/\s+/);
      assert.equal(parts.length, 3, `"${line}" should be "<from> <to> <status>"`);
      const [from, to, status] = parts;
      return { from, to, status };
    });
}

test('public/_redirects matches LEGACY_SECTIONS and LEGACY_HEROES exactly', () => {
  const actual = parseRedirects(readFileSync(REDIRECTS_FILE, 'utf8'))
    .map((rule) => `${rule.from} ${rule.to} ${rule.status}`)
    .sort();
  const expected = Object.entries(LEGACY_SECTIONS)
    .flatMap(([old, habitat]) => [
      `/section/${old}/ /section/${habitat}/ 301`,
      `/section/${old} /section/${habitat}/ 301`,
    ])
    .concat(LEGACY_HEROES.map((slug) => `/heroes/${slug}.jpg ${heroUrl(slug)} 301`))
    .sort();
  assert.deepEqual(actual, expected);
});

test('the legacy heroes are 44 distinct slugs, each a post that still exists', () => {
  // 44 heroes were in public/heroes/ when it was removed (2026-09-28). A post deleted later would make
  // its redirect point at an image nobody links; this fails so the deletion is a decision, not drift.
  assert.equal(LEGACY_HEROES.length, 44);
  assert.equal(new Set(LEGACY_HEROES).size, LEGACY_HEROES.length);
  const posts = new Set(readdirSync(new URL('../content/posts/', import.meta.url)).map((name) => name.replace(/\.mdx?$/, '')));
  assert.deepEqual(LEGACY_HEROES.filter((slug) => !posts.has(slug)), []);
});

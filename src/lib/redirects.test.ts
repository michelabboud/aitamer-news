import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { LEGACY_SECTIONS } from './habitats.ts';

/**
 * public/_redirects is written by hand from LEGACY_SECTIONS (Cloudflare needs a static file).
 * This keeps the two from drifting: every retired section has both trailing-slash forms,
 * pointing at the habitat it folded into, as a permanent redirect, and nothing else is in there.
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

test('public/_redirects matches LEGACY_SECTIONS exactly', () => {
  const actual = parseRedirects(readFileSync(REDIRECTS_FILE, 'utf8'))
    .map((rule) => `${rule.from} ${rule.to} ${rule.status}`)
    .sort();
  const expected = Object.entries(LEGACY_SECTIONS)
    .flatMap(([old, habitat]) => [
      `/section/${old}/ /section/${habitat}/ 301`,
      `/section/${old} /section/${habitat}/ 301`,
    ])
    .sort();
  assert.deepEqual(actual, expected);
});

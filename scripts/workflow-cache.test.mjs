/**
 * The deploys restore Astro's incremental cache, which holds parsed content. Astro does not
 * re-parse an unchanged post when the content schema changes, so a cache restored across a schema
 * change serves stale values (2026-09-28: a renamed section kept its old value and failed the
 * build). Every workflow that restores the cache must key it, and its fallback, on the schema.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const WORKFLOWS = '.github/workflows';
/** The files that decide how content is parsed. A change to any of them must start a cold cache. */
const SCHEMA_FILES = ['src/content.config.ts', 'src/content/post-schema.ts', 'src/lib/habitats.ts', 'src/lib/author-kinds.ts'];

/** Each `actions/cache` step that caches node_modules/.astro: its key and restore-keys text. */
function astroCacheSteps(text) {
  const steps = [];
  for (const block of text.split(/\n\s*- name: /)) {
    if (!/uses: actions\/cache@/.test(block) || !/path: node_modules\/\.astro\b/.test(block)) continue;
    const key = /\n\s*key: (.+)/.exec(block)?.[1] ?? '';
    const restore = /restore-keys: \|\n((?:\s+.+\n?)+)/.exec(block)?.[1] ?? '';
    steps.push({ key, restore });
  }
  return steps;
}

test('every restored Astro cache is keyed, fallback included, on every content-schema file', () => {
  const files = readdirSync(WORKFLOWS).filter((f) => /\.ya?ml$/.test(f));
  const steps = files.flatMap((f) => astroCacheSteps(readFileSync(join(WORKFLOWS, f), 'utf8')).map((s) => ({ f, ...s })));
  assert.ok(steps.length >= 2, 'both deploys restore the Astro cache');
  for (const { f, key, restore } of steps) {
    for (const file of SCHEMA_FILES) {
      assert.ok(key.includes(`'${file}'`), `${f}: key misses ${file}`);
      for (const line of restore.split('\n').map((l) => l.trim()).filter(Boolean)) {
        assert.ok(line.includes(`'${file}'`), `${f}: restore key "${line}" misses ${file}`);
      }
    }
  }
});

test('the scanner finds a cache step and reads an unkeyed fallback as unkeyed', () => {
  const text = `jobs:\n  b:\n    steps:\n      - name: Restore\n        uses: actions/cache@abc # v6\n        with:\n          path: node_modules/.astro\n          key: k-\${{ github.sha }}\n          restore-keys: |\n            k-\n      - name: Build\n        run: npm run build\n`;
  const [step] = astroCacheSteps(text);
  assert.equal(step.key, 'k-${{ github.sha }}');
  assert.equal(step.restore.trim(), 'k-');
  assert.ok(!step.key.includes(`'${SCHEMA_FILES[0]}'`));
});

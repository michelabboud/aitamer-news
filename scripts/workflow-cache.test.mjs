/**
 * The deploys restore Astro's incremental cache, which holds parsed content. Astro does not
 * re-parse an unchanged post when the content schema changes, so a cache restored across a schema
 * change serves stale values (2026-09-28: a renamed section kept its old value and failed the
 * build). Every workflow that restores the cache keys it, fallback included, on a fingerprint of
 * everything the content schema can import. This test walks the schema's real import graph, so a
 * new dependency outside the fingerprint fails here instead of in a deploy.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { dirname, join, normalize } from 'node:path';

const WORKFLOWS = '.github/workflows';
const SCHEMA_ENTRY = 'src/content.config.ts';

/**
 * The fingerprint every Astro cache key must carry, byte for byte, and what each of its patterns
 * covers. `!src/lib/**\/*.test.ts` only narrows; tests never feed the schema.
 */
const FINGERPRINT =
  "${{ hashFiles('src/content.config.ts', 'src/content/*.ts', 'src/lib/**/*.ts', '!src/lib/**/*.test.ts', 'package-lock.json') }}";
const COVERED = [/^src\/content\.config\.ts$/, /^src\/content\/[^/]+\.ts$/, /^src\/lib\/.+\.ts$/];

/** Each `actions/cache` step that caches node_modules/.astro: its key and restore-keys lines. */
export function astroCacheSteps(text) {
  const steps = [];
  for (const block of text.split(/\n\s*- name: /)) {
    if (!/uses: actions\/cache@/.test(block) || !/path: node_modules\/\.astro\b/.test(block)) continue;
    const key = /\n\s*key: (.+)/.exec(block)?.[1] ?? '';
    const restore = (/restore-keys: \|\n((?:[ \t]+\S.*\n?)+)/.exec(block)?.[1] ?? '')
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean);
    steps.push({ key, restore });
  }
  return steps;
}

/** The repository files a module imports by relative path, resolved the way Vite does for `.ts`. */
function localImports(file) {
  const text = readFileSync(file, 'utf8');
  const specs = [...text.matchAll(/^\s*import\s+(?:type\s+)?(?:[^'"]*?\sfrom\s+)?['"](\.{1,2}\/[^'"]+)['"]/gm)].map((m) => m[1]);
  return specs.map((spec) => {
    const base = normalize(join(dirname(file), spec));
    const found = [base, `${base}.ts`, join(base, 'index.ts')].find((candidate) => existsSync(candidate) && candidate.endsWith('.ts'));
    assert.ok(found, `${file}: cannot resolve ${spec}`);
    return found;
  });
}

/** Every repository file reachable from the content schema's entry point. */
function schemaFiles() {
  const seen = new Set();
  const queue = [SCHEMA_ENTRY];
  while (queue.length > 0) {
    const file = queue.shift();
    if (seen.has(file)) continue;
    seen.add(file);
    queue.push(...localImports(file));
  }
  return [...seen].sort();
}

test('every file the content schema can import is inside the cache fingerprint', () => {
  const files = schemaFiles();
  assert.ok(files.includes('src/content/post-schema.ts') && files.includes('src/lib/wildness.ts'), files.join(', '));
  for (const file of files) {
    assert.ok(COVERED.some((pattern) => pattern.test(file)), `${file} feeds the content schema but is outside the cache fingerprint`);
  }
});

test('every restored Astro cache carries the fingerprint in its key and in every fallback', () => {
  const files = readdirSync(WORKFLOWS).filter((f) => /\.ya?ml$/.test(f));
  const steps = files.flatMap((f) => astroCacheSteps(readFileSync(join(WORKFLOWS, f), 'utf8')).map((s) => ({ f, ...s })));
  assert.ok(steps.length >= 2, 'both deploys restore the Astro cache');
  for (const { f, key, restore } of steps) {
    assert.ok(key.includes(FINGERPRINT), `${f}: key lacks the fingerprint`);
    assert.ok(restore.length > 0, `${f}: no restore keys found`);
    for (const line of restore) assert.ok(line.includes(FINGERPRINT), `${f}: restore key "${line}" lacks the fingerprint`);
  }
});

test('the scanner reads a cache step, and an unkeyed fallback as unkeyed', () => {
  const text = `jobs:\n  b:\n    steps:\n      - name: Restore\n        uses: actions/cache@abc # v6\n        with:\n          path: node_modules/.astro\n          key: k-\${{ github.sha }}\n          restore-keys: |\n            k-\n      - name: Build\n        run: npm run build\n`;
  const [step] = astroCacheSteps(text);
  assert.equal(step.key, 'k-${{ github.sha }}');
  assert.deepEqual(step.restore, ['k-']);
  assert.ok(!step.key.includes(FINGERPRINT));
});

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
/** The fingerprint's one exclusion. A schema file matching it would change without changing the key. */
const EXCLUDED = /\.test\.ts$/;

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

/** Module specifiers that are not repository files: Node and Astro built-ins, and installed packages. */
export function isExternal(spec) {
  if (/^(node|astro):/.test(spec)) return true;
  const name = spec.startsWith('@') ? spec.split('/').slice(0, 2).join('/') : spec.split('/')[0];
  return existsSync(join('node_modules', name, 'package.json'));
}

/**
 * Every module a file pulls in: static imports, side-effect imports, re-exports (`export … from`)
 * and dynamic `import()`. Comments are stripped first so a commented-out import is not followed.
 * A specifier that is neither relative nor an installed package (a path alias, say) fails, and so
 * does an `import()` of a computed value: either could reach schema code the walk cannot see.
 */
export function moduleSpecifiers(text, file = '<text>') {
  const code = text.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:'"`\\])\/\/.*$/gm, '$1');
  const specs = [
    ...[...code.matchAll(/\b(?:import|export)\s+(?:type\s+)?[^'"`;]*?\bfrom\s*['"]([^'"]+)['"]/g)].map((m) => m[1]),
    ...[...code.matchAll(/\bimport\s*['"]([^'"]+)['"]/g)].map((m) => m[1]),
    ...[...code.matchAll(/\bimport\s*\(\s*['"]([^'"]+)['"]\s*\)/g)].map((m) => m[1]),
  ];
  const dynamic = [...code.matchAll(/\bimport\s*\(\s*([^)'"\s][^)]*)\)/g)];
  assert.equal(dynamic.length, 0, `${file}: import() of a computed value (${dynamic[0]?.[1]}) cannot be followed`);
  return [...new Set(specs)];
}

/** The repository files a module pulls in, resolved the way Vite does for `.ts`. */
function localImports(file) {
  const found = [];
  for (const spec of moduleSpecifiers(readFileSync(file, 'utf8'), file)) {
    if (!spec.startsWith('.')) {
      assert.ok(isExternal(spec), `${file}: "${spec}" is neither a relative path nor an installed package (an alias?); the walk cannot follow it`);
      continue;
    }
    const base = normalize(join(dirname(file), spec));
    const resolved = [base, `${base}.ts`, join(base, 'index.ts')].find((candidate) => existsSync(candidate) && candidate.endsWith('.ts'));
    assert.ok(resolved, `${file}: cannot resolve ${spec}`);
    found.push(resolved);
  }
  return found;
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
    assert.ok(COVERED.some((pattern) => pattern.test(file)) && !EXCLUDED.test(file), `${file} feeds the content schema but is outside the cache fingerprint`);
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

test('the import scanner follows every form a module can pull code in by, and refuses what it cannot follow', () => {
  const text = [
    "import { a } from './a.ts';",
    "import type { B } from '../b';",
    "import './side-effect.ts';",
    "export { c } from './c.ts';",
    "export * from './d';",
    "const e = await import('./e.ts');",
    "import {\n  f,\n  g,\n} from './fg.ts';",
    "// import { h } from './commented.ts';",
    "/* export * from './blocked.ts'; */",
    "const url = 'https://example.com/x';",
  ].join('\n');
  assert.deepEqual(moduleSpecifiers(text).sort(), ['../b', './a.ts', './c.ts', './d', './e.ts', './fg.ts', './side-effect.ts'].sort());
  assert.throws(() => moduleSpecifiers("const m = await import(`./${name}.ts`);", 'x.ts'), /computed value/);
  assert.throws(() => moduleSpecifiers('const m = await import(path);', 'x.ts'), /computed value/);
});

test('built-ins and installed packages are external; an alias is not, so the walk refuses it', () => {
  for (const spec of ['node:fs', 'astro:content', 'astro/zod', 'js-yaml']) assert.equal(isExternal(spec), true, spec);
  for (const spec of ['@/lib/habitats', '~/content/post-schema', 'lib/habitats']) assert.equal(isExternal(spec), false, spec);
});

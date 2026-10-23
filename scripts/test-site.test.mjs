import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { test } from 'node:test';
import yaml from 'js-yaml';
import { tempDir } from './test-support.mjs';
import { discoverTestFiles, selectSiteTests } from './test-site.mjs';

function fixture(files) {
  const root = tempDir('aitamer-site-tests-');
  for (const directory of ['scripts', 'src/lib', 'workers/contact/test']) mkdirSync(join(root, directory), { recursive: true });
  for (const [path, source] of Object.entries(files)) {
    mkdirSync(join(root, path, '..'), { recursive: true });
    writeFileSync(join(root, path), source);
  }
  return root;
}

test('discovery follows the full suite scopes and excludes only the exact image integration paths', () => {
  const root = fixture({
    'scripts/new-feature.test.mjs': '', 'src/lib/new-feature.test.ts': '',
    'workers/contact/test/contact.test.mjs': '',
    'scripts/stamp-hero.test.mjs': '', 'scripts/image-approval-decoder.test.mjs': '',
    'scripts/finalize-responsive-heroes-integration.test.mjs': '',
    'src/lib/stamp-hero.test.ts': '', 'scripts/nested/ignored.test.mjs': '',
    'src/lib/wrong.test.mjs': '', 'scripts/support.mjs': '',
  });
  assert.deepEqual(discoverTestFiles(root), [
    'scripts/finalize-responsive-heroes-integration.test.mjs', 'scripts/image-approval-decoder.test.mjs',
    'scripts/new-feature.test.mjs', 'scripts/stamp-hero.test.mjs',
    'src/lib/new-feature.test.ts', 'src/lib/stamp-hero.test.ts', 'workers/contact/test/contact.test.mjs',
  ]);
  assert.deepEqual(selectSiteTests(discoverTestFiles(root)), [
    'scripts/new-feature.test.mjs', 'src/lib/new-feature.test.ts',
    'src/lib/stamp-hero.test.ts', 'workers/contact/test/contact.test.mjs',
  ]);
});

function runFixture(root) {
  const runner = new URL('./test-site.mjs', import.meta.url).href;
  // Node marks test children in this environment variable. The fixture is a fresh CLI invocation.
  const env = { ...process.env };
  delete env.NODE_TEST_CONTEXT;
  return spawnSync(process.execPath, ['--input-type=module', '--eval',
    `import { runSiteTests } from ${JSON.stringify(runner)}; process.exitCode = runSiteTests(${JSON.stringify(root)});`],
  { encoding: 'utf8', env });
}

test('runner executes every selected real test file and never starts the image integration files', () => {
  const root = fixture({
    'scripts/a.test.mjs': 'import { test } from "node:test"; test("script ran", () => {});',
    'src/lib/b.test.ts': 'import { test } from "node:test"; const value: number = 1; test("typed library ran", () => { if (value !== 1) throw Error(); });',
    'workers/contact/test/c.test.mjs': 'import { test } from "node:test"; test("contact worker ran", () => {});',
    'scripts/stamp-hero.test.mjs': 'throw new Error("image integration ran unexpectedly");',
    'scripts/image-approval-decoder.test.mjs': 'throw new Error("image integration ran unexpectedly");',
    'scripts/finalize-responsive-heroes-integration.test.mjs': 'throw new Error("image integration ran unexpectedly");',
  });
  const result = runFixture(root);
  assert.equal(result.status, 0, result.stdout + result.stderr);
  for (const name of ['script ran', 'typed library ran', 'contact worker ran']) assert.ok(result.stdout.includes(name));
  assert.match(result.stdout, /test:site: running 3 test files/);
  for (const image of ['stamp-hero.test.mjs', 'image-approval-decoder.test.mjs', 'finalize-responsive-heroes-integration.test.mjs']) {
    assert.ok(result.stdout.includes(image), `the exclusion is visible: ${image}`);
  }
  assert.doesNotMatch(result.stdout + result.stderr, /image integration ran unexpectedly/);
});

test('runner preserves test failures and refuses an empty suite', () => {
  const failed = runFixture(fixture({ 'scripts/failure.test.mjs': 'import { test } from "node:test"; test("expected fixture failure", () => { throw new Error("fixture assertion failed"); });' }));
  assert.equal(failed.status, 1, failed.stdout + failed.stderr);
  assert.match(failed.stdout + failed.stderr, /fixture assertion failed/);
  const empty = runFixture(fixture({}));
  assert.equal(empty.status, 1);
  assert.match(empty.stdout + empty.stderr, /no site test files/);
});

test('routine workflow jobs use the site suite while image approval retains real decoder validation', () => {
  for (const name of ['check-posts', 'deploy-pages', 'deploy-github-pages', 'deploy-contact-worker', 'specimen-admission']) {
    const workflow = yaml.load(readFileSync(new URL(`../.github/workflows/${name}.yml`, import.meta.url), 'utf8'));
    const commands = Object.values(workflow.jobs).flatMap((job) => job.steps ?? []).map((step) => step.run ?? '').join('\n');
    assert.match(commands, /\bnpm run test:site\b/, name);
    assert.doesNotMatch(commands, /\bnpm test\b|\bffmpeg\b|\bffprobe\b/, name);
  }
  const imageWorkflow = yaml.load(readFileSync(new URL('../.github/workflows/image-approval.yml', import.meta.url), 'utf8'));
  const imageCommands = Object.values(imageWorkflow.jobs).flatMap((job) => job.steps ?? []).map((step) => step.run ?? '').join('\n');
  assert.match(imageCommands, /apt-get install[^\n]*ffmpeg/);
  assert.match(imageCommands, /node scripts\/image-approval\.mjs materialize/);
  assert.match(imageCommands, /\bnpm test\b/);
});

test('the full local command retains its complete discovery and images remain explicitly runnable', () => {
  const scripts = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8')).scripts;
  assert.equal(scripts.test, 'node --experimental-strip-types --no-warnings=ExperimentalWarning --test "scripts/*.test.mjs" "src/lib/*.test.ts" "workers/contact/test/*.test.mjs"');
  const command = scripts['test:images'];
  assert.ok(command);
  assert.match(command, /--test/);
  for (const file of ['scripts/stamp-hero.test.mjs', 'scripts/image-approval-decoder.test.mjs', 'scripts/finalize-responsive-heroes-integration.test.mjs']) {
    assert.ok(command.includes(file), file);
  }
});

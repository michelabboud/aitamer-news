/** Routine CI runs every site test; image-tool integrations remain in npm test / test:images. */
import { spawnSync } from 'node:child_process';
import { readdirSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const SITE_ROOT = fileURLToPath(new URL('../', import.meta.url));
const TEST_SCOPES = [
  { directory: 'scripts', suffix: '.test.mjs' },
  { directory: 'src/lib', suffix: '.test.ts' },
  { directory: 'workers/contact/test', suffix: '.test.mjs' },
];
export const IMAGE_TEST_FILES = Object.freeze([
  'scripts/stamp-hero.test.mjs',
  'scripts/image-approval-decoder.test.mjs',
  'scripts/finalize-responsive-heroes-integration.test.mjs',
]);
const IMAGE_TEST_SET = new Set(IMAGE_TEST_FILES);

/** Match the full suite's three shallow globs, including newly added tests. */
export function discoverTestFiles(root = SITE_ROOT) {
  return TEST_SCOPES.flatMap(({ directory, suffix }) =>
    readdirSync(join(root, directory), { withFileTypes: true })
      .filter((entry) => entry.isFile() && entry.name.endsWith(suffix))
      .map((entry) => `${directory}/${entry.name}`),
  ).sort();
}

/** Exact paths only: a similarly named site test must still run. */
export function selectSiteTests(files) {
  return files.filter((file) => !IMAGE_TEST_SET.has(file));
}

export function runSiteTests(root = SITE_ROOT) {
  const files = selectSiteTests(discoverTestFiles(root));
  if (files.length === 0) throw new Error('test:site: no site test files found');
  console.log(`test:site: running ${files.length} test files`);
  console.log(`test:site: image integration files run separately with npm run test:images: ${IMAGE_TEST_FILES.join(', ')}`);
  const result = spawnSync(process.execPath, [
    '--experimental-strip-types', '--no-warnings=ExperimentalWarning', '--test', ...files,
  ], { cwd: root, stdio: 'inherit' });
  if (result.error) throw result.error;
  if (result.signal) throw new Error(`test:site: test process terminated by ${result.signal}`);
  return result.status ?? 1;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    process.exitCode = runSiteTests();
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  }
}

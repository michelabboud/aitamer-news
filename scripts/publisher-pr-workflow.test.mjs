// The `publisher-paths` workflow (`.github/workflows/check-publisher-pr.yml`) installs main's
// lockfile only for the posts App's pull requests, whose authors lane reads frontmatter with
// js-yaml (ADR 0018); every other pull request is judged by the script with a bare `node`, as
// before. This test runs that step's own shell, taken from the workflow file, with `npm` replaced
// by a stub that records its arguments, and pins what the check step is given.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { chmodSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import yaml from 'js-yaml';
import { tempDir } from './test-support.mjs';

const WORKFLOW = new URL('../.github/workflows/check-publisher-pr.yml', import.meta.url);
const INSTALL_STEP = "Install main's lockfile, for the posts App's pull requests only (no install scripts)";
const CHECK_STEP = 'Check the changed paths';
const POSTS = '9900002';

const steps = yaml.load(readFileSync(WORKFLOW, 'utf8')).jobs['publisher-paths'].steps;
const install = steps.find((step) => step.name === INSTALL_STEP);
const check = steps.find((step) => step.name === CHECK_STEP);

/** Runs the install step's shell with `npm` stubbed; returns the exit status and the npm calls. */
function runInstall(values) {
  const dir = tempDir('publisher-install-');
  const bin = join(dir, 'bin');
  mkdirSync(bin);
  const log = join(dir, 'calls.log');
  writeFileSync(join(bin, 'npm'), `#!/usr/bin/env bash\nprintf 'npm %s\\n' "$*" >> "$STUB_LOG"\nexit "\${STUB_NPM_EXIT:-0}"\n`);
  chmodSync(join(bin, 'npm'), 0o755);
  const result = spawnSync('bash', ['-c', install.run], {
    encoding: 'utf8',
    env: { PATH: `${bin}:${process.env.PATH}`, STUB_LOG: log, PR_AUTHOR_ID: '', POSTS_ACTOR_ID: '', ...values },
  });
  const calls = existsSync(log) ? readFileSync(log, 'utf8').trim().split('\n').filter(Boolean) : [];
  return { status: result.status, output: `${result.stdout}${result.stderr}`, calls };
}

test('the install step comes after setup-node and before the check, and reads ids from the environment only', () => {
  assert.ok(install, `check-publisher-pr.yml has a step named "${INSTALL_STEP}"`);
  assert.ok(check, `check-publisher-pr.yml has a step named "${CHECK_STEP}"`);
  assert.equal(steps.indexOf(install), steps.indexOf(check) - 1);
  assert.equal(install.env.PR_AUTHOR_ID, '${{ github.event.pull_request.user.id }}');
  assert.equal(install.env.POSTS_ACTOR_ID, '${{ vars.POSTS_ACTOR_ID }}');
  assert.doesNotMatch(install.run, /\$\{\{/, 'event values reach the shell only through the environment');
  assert.doesNotMatch(check.run, /\$\{\{/);
});

test('the check step is given the head branch and the posts App’s id, next to the maintainer’s', () => {
  assert.equal(check.env.PR_HEAD_REF, '${{ github.event.pull_request.head.ref }}');
  assert.equal(check.env.POSTS_ACTOR_ID, '${{ vars.POSTS_ACTOR_ID }}');
  assert.equal(check.env.MAINTAINER_ID, '${{ vars.MAINTAINER_ID }}');
  assert.equal(check.run, 'node scripts/check-publisher-paths.mjs pr --base "$BASE_SHA" --head "$HEAD_SHA"');
});

test('the posts App’s pull request installs the lockfile with no install scripts', () => {
  for (const posts of [POSTS, ` ${POSTS} `]) {
    const run = runInstall({ POSTS_ACTOR_ID: posts, PR_AUTHOR_ID: POSTS });
    assert.equal(run.status, 0, run.output);
    assert.deepEqual(run.calls, ['npm ci --ignore-scripts --no-audit --no-fund']);
  }
});

test('every other pull request installs nothing: another author, the variable unset, blank or not a number', () => {
  for (const values of [
    { POSTS_ACTOR_ID: POSTS, PR_AUTHOR_ID: '4242' },
    { POSTS_ACTOR_ID: POSTS, PR_AUTHOR_ID: `${POSTS}0` },
    { POSTS_ACTOR_ID: POSTS, PR_AUTHOR_ID: '' },
    { POSTS_ACTOR_ID: '', PR_AUTHOR_ID: POSTS },
    { POSTS_ACTOR_ID: '   ', PR_AUTHOR_ID: POSTS },
    { POSTS_ACTOR_ID: 'aitamer-desk-posts[bot]', PR_AUTHOR_ID: 'aitamer-desk-posts[bot]' },
    { POSTS_ACTOR_ID: '0', PR_AUTHOR_ID: '0' },
  ]) {
    const run = runInstall(values);
    assert.equal(run.status, 0, JSON.stringify(values));
    assert.deepEqual(run.calls, [], JSON.stringify(values));
    assert.match(run.output, /Not a posts App pull request; nothing to install\./);
  }
});

test('a failed install fails the step', () => {
  const run = runInstall({ POSTS_ACTOR_ID: POSTS, PR_AUTHOR_ID: POSTS, STUB_NPM_EXIT: '1' });
  assert.equal(run.status, 1);
});

// The deploy's publisher guard (`.github/workflows/deploy-pages.yml`, the step after checkout)
// decides who the publisher is inline, in the workflow, before anything from the pushed tree
// runs: the decision cannot come from a script in the tree it judges. So this test runs that
// step's own shell, taken from the workflow file, with `git` and `node` replaced by stubs that
// record their arguments. What it pins: the pusher is compared by numeric account id
// (`github.actor_id`) with the repository variable `PUBLISHER_ACTOR_ID`; unset skips with a
// notice; a value that is not a numeric id fails; only a publisher push reaches the path check.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { chmodSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import yaml from 'js-yaml';
import { tempDir } from './test-support.mjs';

const WORKFLOW = new URL('../.github/workflows/deploy-pages.yml', import.meta.url);
const GUARD_STEP = 'The publisher may only have changed comment files';
const PUBLISHER = '4242';
const BEFORE = 'a'.repeat(40);
const AFTER = 'b'.repeat(40);

const workflow = yaml.load(readFileSync(WORKFLOW, 'utf8'));
const steps = workflow.jobs.deploy.steps;
const guard = steps.find((step) => step.name === GUARD_STEP);

/** A stub that appends `<name> <args>` to the call log and exits with `$STUB_<NAME>_EXIT` (default 0). */
function stub(bin, name) {
  const path = join(bin, name);
  writeFileSync(
    path,
    `#!/usr/bin/env bash\nprintf '%s %s\\n' ${name} "$*" >> "$STUB_LOG"\nexit "\${STUB_${name.toUpperCase()}_EXIT:-0}"\n`,
  );
  chmodSync(path, 0o755);
}

/**
 * Runs the guard step's shell with the step's environment, as GitHub would fill it in.
 * @param {Record<string, string>} values PUBLISHER_ACTOR_ID, ACTOR_ID, EVENT_NAME, BEFORE, AFTER, STUB_*_EXIT
 */
function runGuard(values) {
  const dir = tempDir('publisher-guard-');
  const bin = join(dir, 'bin');
  mkdirSync(bin);
  stub(bin, 'git');
  stub(bin, 'node');
  const log = join(dir, 'calls.log');
  const result = spawnSync('bash', ['-c', guard.run], {
    encoding: 'utf8',
    env: {
      PATH: `${bin}:${process.env.PATH}`,
      RUNNER_TEMP: dir,
      STUB_LOG: log,
      PUBLISHER_ACTOR_ID: '',
      ACTOR_ID: '',
      EVENT_NAME: 'push',
      BEFORE,
      AFTER,
      ...values,
    },
  });
  const calls = existsSync(log) ? readFileSync(log, 'utf8').trim().split('\n').filter(Boolean) : [];
  return { status: result.status, output: `${result.stdout}${result.stderr}`, calls };
}

test('the guard is the first step after checkout, and reads the pusher by numeric id', () => {
  assert.ok(guard, `deploy-pages.yml has a step named "${GUARD_STEP}"`);
  assert.equal(steps.indexOf(guard), 1, 'it runs straight after checkout, before node, npm ci or anything from the tree');
  assert.equal(guard.env.PUBLISHER_ACTOR_ID, '${{ vars.PUBLISHER_ACTOR_ID }}');
  assert.equal(guard.env.ACTOR_ID, '${{ github.actor_id }}');
  const source = readFileSync(WORKFLOW, 'utf8');
  assert.doesNotMatch(source, /vars\.PUBLISHER_ACTOR\b/, 'the login variable is gone');
  assert.doesNotMatch(guard.run, /\$\{\{/, 'event values reach the shell only through the environment');
});

test('PUBLISHER_ACTOR_ID unset or blank: a notice, and the check is skipped', () => {
  for (const value of ['', '   ', '\n']) {
    const run = runGuard({ PUBLISHER_ACTOR_ID: value, ACTOR_ID: PUBLISHER });
    assert.equal(run.status, 0, run.output);
    assert.match(run.output, /::notice::PUBLISHER_ACTOR_ID is not set/);
    assert.deepEqual(run.calls, []);
  }
});

test('PUBLISHER_ACTOR_ID that is not a numeric account id fails the deploy', () => {
  for (const value of ['desk-publisher[bot]', '12a', '0', '042', '-5', '1.5', '4 2']) {
    const run = runGuard({ PUBLISHER_ACTOR_ID: value, ACTOR_ID: PUBLISHER });
    assert.equal(run.status, 1, `${JSON.stringify(value)}: ${run.output}`);
    assert.match(run.output, /::error::PUBLISHER_ACTOR_ID is not a numeric account id/);
    assert.deepEqual(run.calls, [], 'nothing is fetched or run');
  }
});

test('surrounding whitespace in the variable is ignored', () => {
  const run = runGuard({ PUBLISHER_ACTOR_ID: ` ${PUBLISHER}\n`, ACTOR_ID: '7' });
  assert.equal(run.status, 0, run.output);
  assert.match(run.output, /not the publisher; nothing to check/);
});

test('a pusher whose id is not the publisher\'s passes without a check, whatever their login', () => {
  for (const actor of ['7', '42', '42420', '424']) {
    const run = runGuard({ PUBLISHER_ACTOR_ID: PUBLISHER, ACTOR_ID: actor });
    assert.equal(run.status, 0, `${actor}: ${run.output}`);
    assert.match(run.output, /not the publisher; nothing to check/);
    assert.deepEqual(run.calls, []);
  }
});

test('a pusher id that is missing or not a number fails: the pusher cannot be told', () => {
  for (const actor of ['', 'octocat', '12x']) {
    const run = runGuard({ PUBLISHER_ACTOR_ID: PUBLISHER, ACTOR_ID: actor });
    assert.equal(run.status, 1, `${JSON.stringify(actor)}: ${run.output}`);
    assert.match(run.output, /::error::github\.actor_id is not a numeric account id/);
    assert.deepEqual(run.calls, []);
  }
});

test('the publisher starting anything but a push fails', () => {
  const run = runGuard({ PUBLISHER_ACTOR_ID: PUBLISHER, ACTOR_ID: PUBLISHER, EVENT_NAME: 'workflow_dispatch' });
  assert.equal(run.status, 1, run.output);
  assert.match(run.output, /::error::the publisher started a workflow_dispatch run/);
  assert.deepEqual(run.calls, []);
});

test('a publisher push with no previous commit, or a malformed commit id, fails', () => {
  const zeros = runGuard({ PUBLISHER_ACTOR_ID: PUBLISHER, ACTOR_ID: PUBLISHER, BEFORE: '0'.repeat(40) });
  assert.equal(zeros.status, 1, zeros.output);
  assert.match(zeros.output, /has no previous commit/);
  const bad = runGuard({ PUBLISHER_ACTOR_ID: PUBLISHER, ACTOR_ID: PUBLISHER, AFTER: 'main' });
  assert.equal(bad.status, 1, bad.output);
  assert.match(bad.output, /before or after is not a commit id/);
  assert.deepEqual([...zeros.calls, ...bad.calls], []);
});

test('a publisher push is judged by the script from the commit before the push', () => {
  const run = runGuard({ PUBLISHER_ACTOR_ID: PUBLISHER, ACTOR_ID: PUBLISHER });
  assert.equal(run.status, 0, run.output);
  assert.deepEqual(run.calls, [
    `git fetch --no-tags --depth=1 origin ${BEFORE}`,
    `git show ${BEFORE}:scripts/check-publisher-paths.mjs`,
    `git show ${BEFORE}:scripts/slug.mjs`,
    `node ${run.calls[3].split(' ')[1]} push --before ${BEFORE} --after ${AFTER}`,
  ]);
  assert.match(run.calls[3], /^node \S+\/publisher-judge\/check-publisher-paths\.mjs /);
});

test('the path check\'s verdict is the step\'s verdict; an unfetchable before fails', () => {
  const refused = runGuard({ PUBLISHER_ACTOR_ID: PUBLISHER, ACTOR_ID: PUBLISHER, STUB_NODE_EXIT: '1' });
  assert.equal(refused.status, 1, refused.output);
  const unfetchable = runGuard({ PUBLISHER_ACTOR_ID: PUBLISHER, ACTOR_ID: PUBLISHER, STUB_GIT_EXIT: '128' });
  assert.equal(unfetchable.status, 1, unfetchable.output);
  assert.match(unfetchable.output, /cannot be fetched/);
  assert.equal(unfetchable.calls.length, 1, 'nothing runs after a failed fetch');
});

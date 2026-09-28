// The pull-request check (check-posts.yml) keeps the media check (ADR 0020, deep review of 0.2.45):
// a live post whose hero was never uploaded fails its pull request, not the deploy of main.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import yaml from 'js-yaml';

const workflow = yaml.load(readFileSync(new URL('../.github/workflows/check-posts.yml', import.meta.url), 'utf8'));
const steps = workflow.jobs.check.steps;
const at = (run) => steps.findIndex((step) => step.run === run);

test('the pull-request check runs the media check with no argument, unconditionally', () => {
  const i = at('npm run check:media');
  assert.ok(i >= 0, 'check-posts.yml runs `npm run check:media`');
  const step = steps[i];
  assert.equal(step.if, undefined, 'a condition could skip it');
  assert.equal(step['continue-on-error'], undefined, 'a failure must fail the pull request');
  assert.equal(step.env, undefined, 'it needs no secret: safe for pull requests from forks');
  assert.ok(at('npm ci') >= 0 && at('npm ci') < i, 'it runs after the install (it reads posts with the site\'s frontmatter reader)');
  assert.ok(at('npm run check:posts') < i, 'after the post contract check, which proves every hero URL is the right one');
});

test('the pull-request check stays read-only and on every pull request', () => {
  assert.deepEqual(workflow.permissions, { contents: 'read' });
  assert.ok(Object.hasOwn(workflow.on, 'pull_request'));
});

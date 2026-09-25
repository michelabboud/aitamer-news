/**
 * Run each command-line script the way CI does, as its own process, so a broken import or a
 * crash at startup fails `npm test` instead of a scheduled job nobody watches
 * (docs/reviews/2026-09-25-batch-bc-deep-review.md, N2).
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';

const run = (script, args = []) =>
  execFileSync(process.execPath, [script, ...args], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });

test('due-posts runs and reports', () => {
  assert.match(run('scripts/due-posts.mjs'), /due-posts:/);
});

test('the post checks run and pass on the repository', () => {
  assert.match(run('scripts/stamp-post-times.mjs', ['--check']), /every published post has a publish time/);
  assert.match(run('scripts/stamp-specimens.mjs', ['--check']), /published posts numbered/);
});

/**
 * Run each command-line script the way CI does, as its own process, so a broken import or a
 * crash at startup fails `npm test` instead of a scheduled job nobody watches
 * (docs/reviews/2026-09-25-batch-bc-deep-review.md, N2).
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { tempDir } from './test-support.mjs';

const run = (script, args, cwd) =>
  execFileSync(process.execPath, [fileURLToPath(new URL(`../${script}`, import.meta.url)), ...args], {
    cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'],
    // A CLI smoke test must not write the surrounding Actions job's outputs.
    env: { ...process.env, GITHUB_OUTPUT: '' },
  });

function site(t, numbered = true) {
  const cwd = tempDir('cli-smoke-');
  t.after(() => rmSync(cwd, { recursive: true }));
  const postsDir = join(cwd, 'src/content/posts');
  mkdirSync(postsDir, { recursive: true });
  const article = join(postsDir, 'fixture.md');
  const ledger = join(cwd, 'src/content/specimen-ledger.txt');
  writeFileSync(article, `---\ntitle: Fixture\npubDate: 2000-01-01T00:00:00Z\n${numbered ? 'specimen: 1\n' : ''}section: models\ndraft: false\nauthor: desk-bot\nheroImage: https://media.aitamer.news/heroes/fixture-12345678.jpg\nsources:\n  - url: https://example.com/source\n---\n\nFixture body.\n`);
  writeFileSync(ledger, numbered ? '0001 fixture\n' : '# No allocation in this submission fixture.\n');
  const snapshot = () => [readFileSync(article, 'utf8'), readFileSync(ledger, 'utf8')];
  return { cwd, snapshot };
}

test('due-posts runs and reports', (t) => {
  const { cwd } = site(t);
  const out = run('scripts/due-posts.mjs', [], cwd);
  assert.match(out, /^(due-posts: nothing due in the last \d+ minutes\.|([a-z0-9-]+\n)+)\n?$/);
});

test('the post check CLIs accept a numbered fixture without writing it', (t) => {
  // A source PR intentionally has no numbers yet. Exercise CLI startup independently of
  // the checkout's articles; candidate and admission checks validate the real submission.
  const { cwd, snapshot } = site(t);
  const before = snapshot();
  assert.match(run('scripts/stamp-post-times.mjs', ['--check'], cwd), /every published post has a publish time/);
  assert.match(run('scripts/stamp-specimens.mjs', ['--check'], cwd), /1 published posts numbered; ledger holds 1 lines/);
  assert.deepEqual(snapshot(), before);
});

test('the strict specimen CLI still refuses an unnumbered submission without writing it', (t) => {
  const { cwd, snapshot } = site(t, false);
  const before = snapshot();
  assert.throws(
    () => run('scripts/stamp-specimens.mjs', ['--check'], cwd),
    (error) => error.status === 1 && /fixture: published but has no specimen number/.test(error.stderr),
  );
  assert.deepEqual(snapshot(), before);
});

test('the publisher path guard starts, and refuses to run without its inputs', (t) => {
  const { cwd } = site(t);
  // A crash at import would exit 1 with a stack trace; a clean refusal is exit 2 with the usage line.
  assert.throws(
    () => run('scripts/check-publisher-paths.mjs', [], cwd),
    (error) => error.status === 2 && /usage: check-publisher-paths\.mjs pr --base/.test(error.stderr),
  );
});

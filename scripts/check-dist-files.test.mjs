import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { FAIL_AT, WARN_AT, countFiles, verdict } from './check-dist-files.mjs';

test('counts files in nested folders, not folders', () => {
  const root = mkdtempSync(join(tmpdir(), 'dist-files-'));
  mkdirSync(join(root, 'posts', 'a'), { recursive: true });
  writeFileSync(join(root, 'index.html'), '');
  writeFileSync(join(root, 'posts', 'a', 'index.html'), '');
  writeFileSync(join(root, 'posts', 'a', 'hero.jpg'), '');
  assert.equal(countFiles(root), 3);
});

test('ok, then warn, then fail before the cap', () => {
  assert.equal(verdict(100).level, 'ok');
  assert.equal(verdict(WARN_AT - 1).level, 'ok');
  assert.equal(verdict(WARN_AT).level, 'warn');
  assert.equal(verdict(FAIL_AT).level, 'fail');
  assert.match(verdict(FAIL_AT).message, /R2|Workers Paid/);
});

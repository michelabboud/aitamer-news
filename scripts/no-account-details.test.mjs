// This repository is public. Cloudflare account identifiers come from Actions secrets
// (`secrets.CLOUDFLARE_ACCOUNT_ID`), never from a file in the tree.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';

/** A Cloudflare account id is 32 lowercase hex characters, written as a value of these keys. */
const ACCOUNT_ID_PATTERN = /\b(?:accountId|account_id|CLOUDFLARE_ACCOUNT_ID|CF_ACCOUNT_ID)\b\s*[:=]\s*["']?[0-9a-f]{32}\b/;

function trackedTextFiles() {
  const out = execFileSync('git', ['ls-files', '-z'], { encoding: 'utf8' });
  return out.split('\0').filter((path) => path && !path.endsWith('.jpg') && path !== 'package-lock.json');
}

export function findAccountIds(files, read = (path) => readFileSync(path, 'utf8')) {
  const hits = [];
  for (const path of files) {
    let text;
    try {
      text = read(path);
    } catch (error) {
      if (error.code === 'ENOENT' || error.code === 'EISDIR') continue; // deleted in the work tree, or a submodule
      throw error;
    }
    text.split('\n').forEach((line, index) => {
      if (ACCOUNT_ID_PATTERN.test(line)) hits.push(`${path}:${index + 1}`);
    });
  }
  return hits;
}

test('no tracked file carries a literal Cloudflare account id', () => {
  assert.deepEqual(findAccountIds(trackedTextFiles()), []);
});

test('the scan finds a literal id in the forms a workflow or wrangler.toml would use', () => {
  const id = 'a'.repeat(32);
  const files = {
    'a.yml': `          accountId: "${id}"`,
    'b.toml': `account_id = "${id}"`,
    'c.yml': `      CLOUDFLARE_ACCOUNT_ID: ${id}`,
  };
  assert.deepEqual(findAccountIds(Object.keys(files), (path) => files[path]), ['a.yml:1', 'b.toml:1', 'c.yml:1']);
});

test('the scan accepts the secret reference and unrelated hex', () => {
  const files = {
    'a.yml': '          accountId: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}',
    'b.md': `sha256 ${'b'.repeat(64)}`,
  };
  assert.deepEqual(findAccountIds(Object.keys(files), (path) => files[path]), []);
});

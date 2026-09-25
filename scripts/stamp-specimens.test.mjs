import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import {
  assignNumbers,
  findProblems,
  main,
  nextNumber,
  parseLedger,
  readPost,
  withSpecimen,
} from './stamp-specimens.mjs';

const post = (fields) =>
  `---\ntitle: "T"\npubDate: ${fields.pubDate ?? '2026-09-24T09:00:00Z'}\n${fields.extra ?? ''}section: ${fields.section ?? 'models'}\ndraft: ${fields.draft ?? false}\nauthor: desk-bot\n${fields.sources === false ? '' : 'sources:\n  - url: https://example.com\n'}---\n\nBody.\n`;

test('numbers go to published posts only, oldest first, ties by slug', () => {
  const posts = [
    readPost('b-later', post({ pubDate: '2026-09-24T10:00:00Z' })),
    readPost('z-tie', post({ pubDate: '2026-09-24T09:00:00Z' })),
    readPost('a-tie', post({ pubDate: '2026-09-24T09:00:00Z' })),
    readPost('draft', post({ draft: true })),
    readPost('numbered', post({ extra: 'specimen: 3\n' })),
  ];
  assert.deepEqual(assignNumbers(posts, [{ n: 3, slug: 'numbered' }]), [
    { slug: 'a-tie', n: 4 },
    { slug: 'z-tie', n: 5 },
    { slug: 'b-later', n: 6 },
  ]);
});

test('a number held by a deleted post is never reused', () => {
  const ledger = [{ n: 1, slug: 'gone' }, { n: 2, slug: 'kept' }];
  assert.equal(nextNumber(ledger), 3);
  assert.deepEqual(assignNumbers([readPost('fresh', post({}))], ledger), [{ slug: 'fresh', n: 3 }]);
});

test('withSpecimen adds one line after pubDate and changes nothing else', () => {
  const before = post({});
  const after = withSpecimen(before, 7);
  assert.equal(after.replace('specimen: 7\n', ''), before);
  assert.match(after, /pubDate: .*\nspecimen: 7\n/);
  assert.throws(() => withSpecimen(after, 8), /already has a specimen/);
});

test('ledger parsing reports malformed lines and skips comments', () => {
  const { entries, errors } = parseLedger('# note\n0001 alpha\n\n0002 beta-two\nnot a line\n');
  assert.deepEqual(entries, [{ n: 1, slug: 'alpha' }, { n: 2, slug: 'beta-two' }]);
  assert.equal(errors.length, 1);
});

test('check finds missing, duplicate, unledgered and mismatched numbers, and missing sources', () => {
  const posts = [
    readPost('no-number', post({})),
    readPost('dup-a', post({ extra: 'specimen: 1\n' })),
    readPost('dup-b', post({ extra: 'specimen: 1\n' })),
    readPost('unledgered', post({ extra: 'specimen: 9\n' })),
    readPost('no-sources', post({ extra: 'specimen: 2\n', sources: false })),
    readPost('opinion-ok', post({ extra: 'specimen: 3\n', section: 'opinion', sources: false })),
    readPost('draft-ok', post({ draft: true, sources: false })),
  ];
  const ledger = [{ n: 1, slug: 'dup-a' }, { n: 2, slug: 'no-sources' }, { n: 3, slug: 'opinion-ok' }];
  const problems = findProblems(posts, ledger).join('\n');
  assert.match(problems, /no-number: published but has no specimen/);
  assert.match(problems, /dup-b: specimen 1 is also on dup-a/);
  assert.match(problems, /dup-b: specimen 1 belongs to dup-a/);
  assert.match(problems, /unledgered: specimen 9 is not in the ledger/);
  assert.match(problems, /no-sources: published outside Opinion with no sources/);
  assert.doesNotMatch(problems, /opinion-ok|draft-ok/);
});

test('stamping twice is a no-op and the check passes after it', () => {
  const root = mkdtempSync(join(tmpdir(), 'specimens-'));
  const postsDir = join(root, 'posts');
  mkdirSync(postsDir);
  const ledgerFile = join(root, 'ledger.txt');
  writeFileSync(join(postsDir, 'one.md'), post({ pubDate: '2026-09-20T00:00:00Z' }));
  writeFileSync(join(postsDir, 'two.md'), post({}));
  const quiet = { log: console.log, error: console.error };
  console.log = console.error = () => {};
  try {
    assert.equal(main(['--check'], { postsDir, ledgerFile }), 1);
    assert.equal(main([], { postsDir, ledgerFile }), 0);
    const ledger = readFileSync(ledgerFile, 'utf8');
    assert.match(ledger, /^0001 one$/m);
    assert.match(ledger, /^0002 two$/m);
    assert.equal(main([], { postsDir, ledgerFile }), 0);
    assert.equal(readFileSync(ledgerFile, 'utf8'), ledger);
    assert.equal(main(['--check'], { postsDir, ledgerFile }), 0);
  } finally {
    Object.assign(console, quiet);
  }
});

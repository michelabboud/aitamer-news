import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, mkdtempSync, mkdirSync, writeFileSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import {
  assignNumbers,
  findProblems,
  ledgerLine,
  ledgerState,
  main,
  nextNumber,
  parseLedger,
  readPost,
  withSpecimen,
} from './stamp-specimens.mjs';
import { gitIn, quietly, tempDir } from './test-support.mjs';

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

/** A posts folder and a ledger path in a fresh temp directory. */
function site(posts, ledger) {
  const root = tempDir('specimens-');
  const postsDir = join(root, 'posts');
  mkdirSync(postsDir);
  for (const [name, text] of Object.entries(posts)) writeFileSync(join(postsDir, name), text);
  const ledgerFile = join(root, 'ledger.txt');
  if (ledger !== undefined) writeFileSync(ledgerFile, ledger);
  const read = (name) => readFileSync(join(postsDir, name), 'utf8');
  const readLedger = () => (existsSync(ledgerFile) ? readFileSync(ledgerFile, 'utf8') : null);
  return { root, postsDir, ledgerFile, read, readLedger };
}

// --- B1: read like YAML, not like a regex ----------------------------------------------------

test('the README template, comments and all, is a draft with sources: no number (B1)', () => {
  const template =
    '---\ntitle: "T"\ndescription: "D"\npubDate: 2026-09-25          # plain date while drafting\nsection: tools            # one habitat\n' +
    'draft: true               # keep true until ready\nauthor: desk-bot\nsources:                  # optional\n  - title: "x"\n    url: https://example.com\n---\n\nBody.\n';
  const read = readPost('template', template);
  assert.equal(read.draft, true);
  assert.equal(read.section, 'tools');
  assert.equal(read.hasSources, true);
  assert.deepEqual(assignNumbers([read], []), []);
  assert.deepEqual(findProblems([read], []), []);
});

test('comments, True, flow and unindented lists, sources: [], CRLF and BOM mean what YAML says (B1)', () => {
  const published = (fm) => readPost('p', `---\npubDate: 2026-09-24T09:00:00Z\n${fm}\n---\n`);
  assert.equal(published('draft: True').draft, true);
  assert.equal(published('draft: false   # live').draft, false);
  assert.equal(published("section: 'opinion'  # signed view").section, 'opinion');
  assert.equal(published('sources: [{title: a, url: https://a.example}]').hasSources, true);
  assert.equal(published('sources:\n- title: a\n  url: https://a.example').hasSources, true);
  assert.equal(published('sources: []').hasSources, false);
  assert.deepEqual(findProblems([published('sources: []\nsection: models\nspecimen: 1')], [{ n: 1, slug: 'p' }]), [
    'p: published outside Opinion with no sources',
  ]);
  assert.deepEqual(findProblems([published('section: opinion   # c\nspecimen: 1')], [{ n: 1, slug: 'p' }]), []);
  const crlf = readPost('p', '---\r\npubDate: 2026-09-24T09:00:00Z\r\ndraft: false\r\nspecimen: 4\r\nsources: [{url: u}]\r\n---\r\n');
  assert.equal(crlf.specimen, 4);
  assert.equal(crlf.hasSources, true);
  assert.equal(readPost('p', `\uFEFF${post({})}`).errors.length, 0);
});

test('an empty, null, quoted or non-positive specimen is refused with a clear message (B2)', () => {
  for (const [value, message] of [
    ['', /present but empty; delete the line/],
    ['~', /present but empty/],
    ['null', /present but empty/],
    ['"12"', /positive whole number, found "12"/],
    ['0', /positive whole number, found 0/],
    ['1.5', /positive whole number/],
  ]) {
    const read = readPost('p', post({ extra: `specimen: ${value}\n` }));
    assert.equal(read.specimen, null, value);
    assert.match(read.errors.join('\n'), message, value);
    assert.deepEqual(assignNumbers([read], []), [], `${value} must never be scheduled for a number`);
  }
});

test('a draft field that is not a boolean is an error and never gets a number', () => {
  const read = readPost('p', post({ draft: 'yes' }));
  assert.equal(read.draft, true);
  assert.match(read.errors.join(), /draft must be true or false/);
});

test('a file name that breaks the slug rule, or a slug: field, is a problem (Informational 4)', () => {
  for (const slug of ['Grok-5', 'gpt-5.6']) {
    assert.match(findProblems([readPost(slug, post({}))], []).join('\n'), /is not a slug/);
  }
  assert.match(readPost('p', post({ extra: 'slug: other\n' })).errors.join(), /remove the `slug:` field/);
  const s = site({ 'Grok-5.md': post({}), 'ok.md': post({}) });
  const run = quietly(() => main([], s));
  assert.equal(run.result, 1);
  assert.match(run.output, /nothing was stamped[\s\S]*Grok-5: file name "Grok-5" is not a slug/);
  assert.equal(s.readLedger(), null, 'no ledger line may be burned for a bad slug');
  assert.equal(s.read('ok.md'), post({}));
  assert.equal(quietly(() => main(['--check'], s)).result, 1);
});

test('check refuses a post in a subfolder and two files with one slug', () => {
  const s = site({ 'a.md': post({}), 'a.mdx': post({}) });
  mkdirSync(join(s.postsDir, 'sub'));
  writeFileSync(join(s.postsDir, 'sub', 'b.md'), post({}));
  const run = quietly(() => main(['--check'], s));
  assert.equal(run.result, 1);
  assert.match(run.output, /sub\/b\.md: posts live directly in/);
  assert.match(run.output, /a: two files share this slug/);
  assert.equal(quietly(() => main([], s)).result, 1);
  assert.equal(s.readLedger(), null);
});

// --- B2: validate everything, then the ledger, then the posts --------------------------------

test('when the third of three posts cannot be stamped, nothing is written (B2)', () => {
  // A frontmatter written as one flow mapping is valid YAML (Astro reads it) but has no pubDate
  // line to anchor `specimen:` on. It sorts third. Validation refuses it before any number is issued.
  const flow = '---\n{title: T, pubDate: 2026-09-26T09:00:00Z, section: models, author: desk-bot, sources: [{url: u}]}\n---\n\nBody.\n';
  const posts = {
    'a.md': post({ pubDate: '2026-09-24T09:00:00Z' }),
    'b.md': post({ pubDate: '2026-09-25T09:00:00Z' }),
    'c.md': flow,
  };
  const ledger = '# header\n0001 older\n';
  const s = site(posts, ledger);
  const run = quietly(() => main([], s));
  assert.equal(run.result, 1);
  assert.match(run.output, /nothing was stamped[\s\S]*c: pubDate must be written on its own top-level line/);
  assert.equal(s.readLedger(), ledger);
  for (const [name, text] of Object.entries(posts)) assert.equal(s.read(name), text, name);
});

test('a failure while computing any post text writes nothing, whatever the cause', () => {
  const posts = { 'a.md': post({ pubDate: '2026-09-24T09:00:00Z' }), 'b.md': post({ pubDate: '2026-09-25T09:00:00Z' }), 'c.md': post({ pubDate: '2026-09-26T09:00:00Z' }) };
  const s = site(posts);
  let calls = 0;
  const stampPost = (text, n) => {
    if (++calls === 3) throw new Error('disk full, say');
    return withSpecimen(text, n);
  };
  assert.equal(quietly(() => main([], { ...s, stampPost })).result, 1);
  assert.equal(s.readLedger(), null);
  for (const [name, text] of Object.entries(posts)) assert.equal(s.read(name), text, name);
});

test('an interrupted run is repaired with --restore: a post gets back the number the ledger holds for it', () => {
  // The ledger was appended (step 3) but the post write (step 4) never happened.
  const ledger = '# header\n0001 one\n0002 two\n';
  const s = site({ 'one.md': post({ extra: 'specimen: 1\n' }), 'two.md': post({}) }, ledger);
  assert.deepEqual(assignNumbers([readPost('two', post({}))], parseLedger(ledger).entries), [{ slug: 'two', n: 2, restored: true }]);
  // Without --restore it refuses: the same state is what a new story under a deleted slug looks like.
  assert.equal(quietly(() => main([], s)).result, 1);
  assert.doesNotMatch(s.read('two.md'), /^specimen:/m);
  assert.equal(s.readLedger(), ledger);
  assert.equal(quietly(() => main(['--restore'], s)).result, 0);
  assert.match(s.read('two.md'), /^specimen: 2$/m);
  assert.equal(s.readLedger(), ledger, 'a restored number adds no ledger line');
  assert.equal(quietly(() => main(['--check'], s)).result, 0);
});

// --- B6: `$` patterns in user text must survive -----------------------------------------------

test('dollar patterns in the header survive numbering byte for byte (B6)', () => {
  const before = post({ extra: "description: \"From $$ to $' and $& and $`\"\n" });
  const after = withSpecimen(before, 7);
  const at = before.indexOf('\n', before.indexOf('pubDate:')) + 1;
  assert.equal(after, `${before.slice(0, at)}specimen: 7\n${before.slice(at)}`);
  assert.match(after, /From \$\$ to \$' and \$& and \$`/);
});

// --- B3: collisions are repaired by appending a void line -----------------------------------

test('ledger lines: an issuance, a void, and malformed lines', () => {
  const { entries, errors } = parseLedger('0001 alpha\n0002 beta void: collision with alpha\n0003 gamma void:\n0004 Delta\n');
  assert.deepEqual(entries, [{ n: 1, slug: 'alpha' }, { n: 2, slug: 'beta', void: 'collision with alpha' }]);
  assert.equal(errors.length, 2);
  assert.equal(ledgerLine({ n: 2, slug: 'beta', void: 'collision' }), '0002 beta void: collision');
});

test('a void line retires one issuance: never reissued, never carried', () => {
  const ledger = parseLedger('0026 slug-a\n0026 slug-b\n0026 slug-b void: collision with slug-a\n0027 gone\n0027 gone void: stamped a draft by mistake\n').entries;
  const state = ledgerState(ledger);
  assert.deepEqual(state.problems, []);
  assert.deepEqual(state.ownersOf.get(26), ['slug-a']);
  assert.equal(nextNumber(ledger), 28, 'a voided number is never issued again');
  const problems = findProblems(
    [
      readPost('slug-a', post({ extra: 'specimen: 26\n' })),
      readPost('slug-b', post({ extra: 'specimen: 26\n' })),
      readPost('gone', post({ extra: 'specimen: 27\n' })),
    ],
    ledger,
  ).join('\n');
  assert.doesNotMatch(problems, /^slug-a:/m, 'the live holder of 26 is fine');
  assert.match(problems, /slug-b: specimen 26 belongs to slug-a/);
  assert.match(problems, /gone: specimen 27 was voided in the ledger; no post may carry it/);
  assert.deepEqual(assignNumbers([readPost('slug-b', post({}))], ledger), [{ slug: 'slug-b', n: 28 }]);
});

test('the ledger check catches a collision, a slug issued twice, and bad void lines', () => {
  const problems = ledgerState(
    parseLedger('0001 a\n0001 b\n0002 c\n0003 c\n0004 d void: no issuance\n0005 e\n0005 e void: x\n0005 e\n').entries,
  ).problems.join('\n');
  assert.match(problems, /ledger issues 1 twice \(a and b\): a collision; keep both lines/);
  assert.match(problems, /ledger issues c twice \(2 and 3\)/);
  assert.match(problems, /voids 4 for d, but no earlier line issues 4 to d/);
  assert.match(problems, /issues 5 to e again after voiding it/);
});

test('stamping refuses to run on a ledger with a collision or a slug issued twice', () => {
  const s = site({ 'new.md': post({}) }, '0001 a\n0001 b\n');
  const run = quietly(() => main([], s));
  assert.equal(run.result, 1);
  assert.match(run.output, /nothing was stamped[\s\S]*ledger issues 1 twice/);
  assert.equal(s.readLedger(), '0001 a\n0001 b\n');
});

test('end to end: two branches stamp the same number; the documented repair passes and stays append-only (B3)', () => {
  const repo = tempDir('specimens-git-');
  const git = gitIn(repo);
  const paths = { postsDir: join(repo, 'posts'), ledgerFile: join(repo, 'ledger.txt') };
  const stamp = (...argv) => quietly(() => main(argv, paths));
  mkdirSync(paths.postsDir);
  writeFileSync(join(paths.postsDir, 'first.md'), post({ pubDate: '2026-09-20T09:00:00Z' }));
  assert.equal(stamp().result, 0);
  git(['add', '-A']);
  git(['commit', '-q', '-m', 'first']);

  git(['checkout', '-q', '-b', 'bot-a']);
  writeFileSync(join(paths.postsDir, 'slug-a.md'), post({ pubDate: '2026-09-24T09:00:00Z' }));
  assert.equal(stamp().result, 0);
  git(['add', '-A']);
  git(['commit', '-q', '-m', 'a']);

  git(['checkout', '-q', 'main']);
  git(['checkout', '-q', '-b', 'bot-b']);
  writeFileSync(join(paths.postsDir, 'slug-b.md'), post({ pubDate: '2026-09-24T10:00:00Z' }));
  assert.equal(stamp().result, 0);
  git(['add', '-A']);
  git(['commit', '-q', '-m', 'b']);

  git(['checkout', '-q', 'main']);
  git(['merge', '-q', 'bot-a']);
  assert.throws(() => git(['merge', '-q', 'bot-b']), 'both branches appended to the ledger: git reports a conflict');
  // The natural resolution keeps both appended lines.
  const conflicted = readFileSync(paths.ledgerFile, 'utf8');
  assert.match(conflicted, /^<<<<<<< /m);
  const resolved = conflicted.replace(/^(<<<<<<<|=======|>>>>>>>).*\n/gm, '');
  assert.match(resolved, /^0002 slug-a\n0002 slug-b\n$/m);
  writeFileSync(paths.ledgerFile, resolved);
  git(['add', '-A']);
  git(['commit', '-q', '--no-edit']);

  const caught = stamp('--check');
  assert.equal(caught.result, 1);
  assert.match(caught.output, /ledger issues 2 twice \(slug-a and slug-b\): a collision/);

  // The repair in POST.md section 4: void slug-b's issuance, delete its specimen line, stamp.
  writeFileSync(paths.ledgerFile, `${resolved}0002 slug-b void: collision with slug-a\n`);
  const bFile = join(paths.postsDir, 'slug-b.md');
  writeFileSync(bFile, readFileSync(bFile, 'utf8').replace(/^specimen: 2\n/m, ''));
  assert.equal(stamp().result, 0);
  assert.equal(stamp('--check').result, 0);

  const repaired = readFileSync(paths.ledgerFile, 'utf8');
  assert.ok(repaired.startsWith(resolved), 'the repair only appends to the merged ledger');
  assert.match(repaired, /0002 slug-b void: collision with slug-a\n0003 slug-b\n$/);
  assert.match(readFileSync(join(paths.postsDir, 'slug-a.md'), 'utf8'), /^specimen: 2$/m);
  assert.match(readFileSync(bFile, 'utf8'), /^specimen: 3$/m);
  git(['add', '-A']);
  git(['commit', '-q', '-m', 'repair']);
  assert.equal(git(['diff', 'HEAD~1', '--', 'ledger.txt']).split('\n').filter((l) => /^-[^-]/.test(l)).length, 0, 'no ledger line removed');
});

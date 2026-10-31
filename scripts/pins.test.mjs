import assert from 'node:assert/strict';
import test from 'node:test';
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { PINS_PATH, POSTS_DIR, classifyPost, loadPublishedIds, main, pinPost, unpinPost, writeFileAtomic } from './pins.mjs';
import { tempDir } from './test-support.mjs';

const NOW = new Date('2026-10-31T12:00:00Z');

const post = (extra = '') => `---
title: "A story"
pubDate: "2026-10-01T08:00:00Z"
${extra}---

Body.
`;
const POSTS = {
  'live-one': post(),
  'live-two': post(),
  'live-three': post(),
  'a-draft': post('draft: true\n'),
  'not-yet': `---\ntitle: "Later"\npubDate: "2026-12-01T08:00:00Z"\n---\n\nBody.\n`,
  'was-withdrawn': post('withdrawn:\n  date: 2026-10-20T08:00:00Z\n  reason: "Wrong"\n'),
  'broken-yaml': '---\ntitle: [unclosed\n---\n\nBody.\n',
};

/** A temp site root with a posts directory and a pins file; never the real one. */
function site(pins = { mode: 'auto', pins: [] }) {
  const cwd = tempDir('pins-test-');
  mkdirSync(join(cwd, POSTS_DIR), { recursive: true });
  mkdirSync(join(cwd, 'src/data'), { recursive: true });
  for (const [slug, text] of Object.entries(POSTS)) writeFileSync(join(cwd, POSTS_DIR, `${slug}.md`), text);
  const pinsPath = join(cwd, PINS_PATH);
  writeFileSync(pinsPath, typeof pins === 'string' ? pins : `${JSON.stringify(pins, null, 2)}\n`);
  return { cwd, pinsPath, postsDir: join(cwd, POSTS_DIR) };
}
const read = (pinsPath) => readFileSync(pinsPath, 'utf8');
const run = (cwd, argv, now = NOW) => {
  const out = [];
  const err = [];
  const code = main(argv, { cwd, now, stdout: (l) => out.push(l), stderr: (l) => err.push(l) });
  return { code, out: out.join('\n'), err: err.join('\n') };
};

// ---------- classifyPost / loadPublishedIds ----------

test('classifyPost follows the site rule: draft, not yet live, withdrawn, unreadable, published', () => {
  assert.equal(classifyPost(POSTS['live-one'], NOW), 'published');
  assert.equal(classifyPost(POSTS['a-draft'], NOW), 'draft');
  assert.equal(classifyPost(POSTS['not-yet'], NOW), 'scheduled');
  assert.equal(classifyPost(POSTS['was-withdrawn'], NOW), 'withdrawn');
  assert.equal(classifyPost(POSTS['broken-yaml'], NOW), 'unreadable');
  assert.equal(classifyPost('no frontmatter at all\n', NOW), 'unreadable');
  assert.equal(classifyPost(post('draft: maybe\n'), NOW), 'unreadable');
  assert.equal(classifyPost(`---\ntitle: x\n---\n`, NOW), 'unreadable', 'no pubDate');
  // The pubDate boundary: live at exactly pubDate, not a millisecond before.
  assert.equal(classifyPost(POSTS['live-one'], new Date('2026-10-01T08:00:00Z')), 'published');
  assert.equal(classifyPost(POSTS['live-one'], new Date('2026-10-01T07:59:59.999Z')), 'scheduled');
});

test('loadPublishedIds lists only published posts and names unreadable files', () => {
  const { postsDir } = site();
  writeFileSync(join(postsDir, 'README.txt'), 'not a post');
  const { ids, unreadable } = loadPublishedIds(postsDir, NOW);
  assert.deepEqual([...ids].sort(), ['live-one', 'live-three', 'live-two']);
  assert.deepEqual(unreadable, ['broken-yaml.md']);
});

// ---------- pin ----------

test('pin adds a manual, active entry with the time, the name and a bare-date until', () => {
  const { cwd, pinsPath } = site();
  const { code, out, err } = run(cwd, ['pin', 'live-one', '--by', 'michel', '--until', '2026-11-05']);
  assert.equal(code, 0, err);
  assert.equal(
    read(pinsPath),
    '{\n  "mode": "auto",\n  "pins": [\n    {\n      "slug": "live-one",\n      "source": "manual",\n      "state": "active",\n      "pinnedBy": "michel",\n      "pinnedAt": "2026-10-31T12:00:00Z",\n      "until": "2026-11-05"\n    }\n  ]\n}\n',
  );
  assert.match(out, /^pinned live-one/);
  assert.match(out, /homepage pin card now shows 1 of 2/);
  assert.match(out, /live-one {2}\(manual, by michel, until 2026-11-05\)/);
});

test('--auto and --proposed set the source and the state; a proposed pin is reported as not shown', () => {
  const { cwd, pinsPath } = site();
  const { code, out } = run(cwd, ['pin', 'live-one', '--by', 'eic', '--auto', '--proposed']);
  assert.equal(code, 0);
  assert.deepEqual(JSON.parse(read(pinsPath)).pins[0], { slug: 'live-one', source: 'auto', state: 'proposed', pinnedBy: 'eic', pinnedAt: '2026-10-31T12:00:00Z' });
  assert.match(out, /shows 0 of 2/);
  assert.match(out, /not shown: live-one \(proposed\)/);
});

test('a timestamp until with an offset is accepted as written', () => {
  const { cwd, pinsPath } = site();
  assert.equal(run(cwd, ['pin', 'live-one', '--by', 'michel', '--until', '2026-11-05T18:00:00+02:00']).code, 0);
  assert.equal(JSON.parse(read(pinsPath)).pins[0].until, '2026-11-05T18:00:00+02:00');
});

test('re-pinning a slug UPDATES its entry in place instead of adding a duplicate or failing', () => {
  const { cwd, pinsPath } = site();
  run(cwd, ['pin', 'live-one', '--by', 'michel', '--until', '2026-11-05']);
  run(cwd, ['pin', 'live-two', '--by', 'michel']);
  const { code, out } = run(cwd, ['pin', 'live-one', '--by', 'eic', '--auto'], new Date('2026-10-31T13:00:00Z'));
  assert.equal(code, 0);
  assert.match(out, /^updated live-one/);
  const { pins } = JSON.parse(read(pinsPath));
  assert.deepEqual(pins.map((p) => p.slug), ['live-one', 'live-two'], 'position kept, no duplicate');
  assert.deepEqual(pins[0], { slug: 'live-one', source: 'auto', state: 'active', pinnedBy: 'eic', pinnedAt: '2026-10-31T13:00:00Z' }, 'every field restated; the old until is gone');
});

test('the card preview ranks manual over auto, reports a slot loss and keeps the mode', () => {
  // An approved auto pin in approve mode: active, but still behind manual pins.
  const { cwd, pinsPath } = site({ mode: 'approve', pins: [] });
  run(cwd, ['pin', 'live-one', '--by', 'eic', '--auto', '--proposed'], new Date('2026-10-31T10:00:00Z'));
  run(cwd, ['approve', 'live-one'], new Date('2026-10-31T10:30:00Z'));
  run(cwd, ['pin', 'live-two', '--by', 'michel'], new Date('2026-10-31T11:00:00Z'));
  const { out } = run(cwd, ['pin', 'live-three', '--by', 'michel'], new Date('2026-10-31T12:00:00Z'));
  const lines = out.split('\n');
  assert.ok(lines.findIndex((l) => l.includes('live-three')) < lines.findIndex((l) => l.includes('live-two  (')), 'newest first');
  assert.match(out, /not shown: live-one \(no free slot\)/);
  assert.equal(JSON.parse(read(pinsPath)).mode, 'approve');
});

test('pin refuses a post that is missing, a draft, scheduled, withdrawn or unreadable, and writes nothing', () => {
  const { cwd, pinsPath } = site();
  const before = read(pinsPath);
  const cases = [
    ['no-such-post', /no post "no-such-post"/],
    ['a-draft', /it is a draft/],
    ['not-yet', /pubDate has not passed/],
    ['was-withdrawn', /withdrawn/],
    ['broken-yaml', /frontmatter cannot be read/],
  ];
  for (const [slug, pattern] of cases) {
    const { code, err } = run(cwd, ['pin', slug, '--by', 'michel']);
    assert.equal(code, 1, slug);
    assert.match(err, pattern, slug);
  }
  assert.equal(read(pinsPath), before);
});

test('pin refuses a slug that is not a slug, before touching the filesystem', () => {
  const { cwd, pinsPath } = site();
  const before = read(pinsPath);
  for (const slug of ['../live-one', 'Live-One', 'live/one', 'a'.repeat(121)]) {
    const { code, err } = run(cwd, ['pin', slug, '--by', 'michel']);
    assert.equal(code, 1, slug);
    assert.match(err, /is not a post slug/);
  }
  assert.equal(read(pinsPath), before);
});

test('pin refuses a bad --until or --by and leaves the old file byte for byte', () => {
  const { cwd, pinsPath, postsDir } = site();
  run(cwd, ['pin', 'live-two', '--by', 'michel']);
  const before = read(pinsPath);
  const files = readdirSync(dirname(pinsPath));
  const attempts = [
    [['--until', '2026-11-05T18:00:00'], /timestamp without an offset is refused/],
    [['--until', '2026-02-30'], /--until "2026-02-30"/],
    [['--until', 'soon'], /--until "soon"/],
    [['--until', '2026-10-30'], /already past/],
    [['--until', '2026-10-31T11:59:59Z'], /already past/],
    [['--by', 'Michel'], /--by "Michel" must match/],
  ];
  for (const [flags, pattern] of attempts) {
    const argv = ['pin', 'live-one', ...(flags[0] === '--by' ? [] : ['--by', 'michel']), ...flags];
    const { code, err } = run(cwd, argv);
    assert.equal(code, 1, flags.join(' '));
    assert.match(err, pattern, flags.join(' '));
  }
  assert.equal(read(pinsPath), before, 'old file intact');
  assert.deepEqual(readdirSync(dirname(pinsPath)), files, 'no temp file left behind');
  assert.ok(existsSync(postsDir));
});

test('an until of today (bare date) is still allowed; the pin shows through the end of the day', () => {
  const { cwd } = site();
  assert.equal(run(cwd, ['pin', 'live-one', '--by', 'michel', '--until', '2026-10-31']).code, 0);
});

test('pin refuses to write over a broken pins file and says so', () => {
  for (const broken of ['{ not json', '{"mode":"auto","pins":[],"extra":1}', '{"mode":"auto","pins":[{"slug":"live-two","source":"auto","state":"pending","pinnedBy":"eic","pinnedAt":"2026-10-31T10:00:00Z"}]}']) {
    const { cwd, pinsPath } = site(broken);
    const { code, err } = run(cwd, ['pin', 'live-one', '--by', 'michel']);
    assert.equal(code, 1);
    assert.match(err, /is broken, nothing was changed/);
    assert.equal(read(pinsPath), broken);
  }
});

test('pin reports a missing pins file', () => {
  const { cwd, pinsPath } = site();
  writeFileSync(pinsPath, '{"mode":"auto","pins":[]}');
  const empty = tempDir('pins-test-empty-');
  mkdirSync(join(empty, POSTS_DIR), { recursive: true });
  writeFileSync(join(empty, POSTS_DIR, 'live-one.md'), POSTS['live-one']);
  const { code, err } = run(empty, ['pin', 'live-one', '--by', 'michel']);
  assert.equal(code, 1);
  assert.match(err, /cannot read .*pins\.json: ENOENT/);
  assert.ok(cwd);
});

// ---------- unpin ----------

test('unpin removes the entry, keeps the rest and prints the new card', () => {
  const { cwd, pinsPath } = site();
  run(cwd, ['pin', 'live-one', '--by', 'michel']);
  run(cwd, ['pin', 'live-two', '--by', 'michel']);
  const { code, out } = run(cwd, ['unpin', 'live-one']);
  assert.equal(code, 0);
  assert.deepEqual(JSON.parse(read(pinsPath)).pins.map((p) => p.slug), ['live-two']);
  assert.match(out, /^unpinned live-one/);
  assert.match(out, /shows 1 of 2/);
});

test('unpin works for a post that is no longer published (a dangling pin can be removed)', () => {
  const { cwd, pinsPath } = site({ mode: 'auto', pins: [{ slug: 'deleted-post', source: 'auto', state: 'active', pinnedBy: 'eic', pinnedAt: '2026-10-30T10:00:00Z' }] });
  assert.equal(run(cwd, ['unpin', 'deleted-post']).code, 0);
  assert.deepEqual(JSON.parse(read(pinsPath)).pins, []);
});

test('unpin of a slug that is not pinned exits 1 and leaves the file alone', () => {
  const { cwd, pinsPath } = site();
  run(cwd, ['pin', 'live-two', '--by', 'michel']);
  const before = read(pinsPath);
  const { code, err } = run(cwd, ['unpin', 'live-one']);
  assert.equal(code, 1);
  assert.match(err, /"live-one" is not pinned/);
  assert.equal(read(pinsPath), before);
});

test('unpin refuses a broken pins file', () => {
  const { cwd, pinsPath } = site('[]');
  const { code, err } = run(cwd, ['unpin', 'live-one']);
  assert.equal(code, 1);
  assert.match(err, /is broken/);
  assert.equal(read(pinsPath), '[]');
});

// ---------- usage ----------

test('usage errors exit 2: no command, no slug, two slugs, unknown flag, no --by', () => {
  const { cwd } = site();
  for (const argv of [[], ['frobnicate'], ['pin'], ['pin', 'a', 'b', '--by', 'x'], ['pin', 'live-one'], ['pin', 'live-one', '--by', 'x', '--bogus'], ['unpin'], ['unpin', 'a', 'b'], ['unpin', 'a', '--by', 'x']]) {
    const { code, err } = run(cwd, argv);
    assert.equal(code, 2, JSON.stringify(argv));
    assert.match(err, /usage:/, JSON.stringify(argv));
  }
});

test('run as a program, a usage error sets a non-zero exit status and touches no file', () => {
  const script = join(dirname(fileURLToPath(import.meta.url)), 'pins.mjs');
  assert.throws(
    () => execFileSync(process.execPath, ['--experimental-strip-types', '--no-warnings=ExperimentalWarning', script, 'pin'], { stdio: 'pipe' }),
    (error) => error.status === 2 && /usage:/.test(String(error.stderr)),
  );
});

// ---------- writeFileAtomic ----------

test('writeFileAtomic replaces the file and leaves no temp file', () => {
  const dir = tempDir('pins-atomic-');
  const path = join(dir, 'pins.json');
  writeFileSync(path, 'old');
  writeFileAtomic(path, 'new\n');
  assert.equal(read(path), 'new\n');
  assert.deepEqual(readdirSync(dir), ['pins.json']);
});

test('writeFileAtomic cleans its temp file when the rename fails, and the target is untouched', () => {
  const dir = tempDir('pins-atomic-');
  const target = join(dir, 'pins.json');
  mkdirSync(target); // a rename of a file over a directory fails
  mkdirSync(join(target, 'keep'));
  assert.throws(() => writeFileAtomic(target, 'new'));
  assert.deepEqual(readdirSync(dir), ['pins.json']);
  assert.deepEqual(readdirSync(target), ['keep']);
});

test('writeFileAtomic into a missing directory throws and creates nothing', () => {
  const dir = tempDir('pins-atomic-');
  assert.throws(() => writeFileAtomic(join(dir, 'nope', 'pins.json'), 'x'), /ENOENT/);
  assert.deepEqual(readdirSync(dir), []);
});

// ---------- direct API ----------

test('pinPost and unpinPost round-trip to the exact bytes of the starting file', () => {
  const { pinsPath, postsDir } = site();
  const start = read(pinsPath);
  assert.equal(start, '{\n  "mode": "auto",\n  "pins": []\n}\n');
  pinPost({ slug: 'live-one', by: 'michel', pinsPath, postsDir, now: NOW });
  unpinPost({ slug: 'live-one', pinsPath });
  assert.equal(read(pinsPath), start);
});

test('pinPost reads an .mdx post too', () => {
  const { pinsPath, postsDir } = site();
  writeFileSync(join(postsDir, 'an-mdx.mdx'), post());
  assert.equal(pinPost({ slug: 'an-mdx', by: 'michel', pinsPath, postsDir, now: NOW }).action, 'pinned');
});

// ---------- approve ----------

test('approve turns a proposed auto pin active and keeps it an auto pin behind manual ones', () => {
  const { cwd, pinsPath } = site();
  run(cwd, ['pin', 'live-one', '--by', 'eic', '--auto', '--proposed']);
  const { code, out } = run(cwd, ['approve', 'live-one']);
  assert.equal(code, 0);
  const [entry] = JSON.parse(read(pinsPath)).pins;
  assert.equal(entry.state, 'active');
  assert.equal(entry.source, 'auto');
  assert.equal(entry.pinnedBy, 'eic');
  assert.match(out, /^approved live-one/);
});

test('approve refuses a pin that is missing, already active, or names a post that is not live, and writes nothing', () => {
  const { cwd, pinsPath } = site({ mode: 'approve', pins: [
    { slug: 'live-two', source: 'manual', state: 'active', pinnedBy: 'michel', pinnedAt: '2026-10-30T10:00:00Z' },
    { slug: 'was-withdrawn', source: 'auto', state: 'proposed', pinnedBy: 'eic', pinnedAt: '2026-10-30T10:00:00Z' },
  ] });
  const before = read(pinsPath);
  for (const [slug, reason] of [['live-one', /is not pinned/], ['live-two', /already active/], ['was-withdrawn', /not a published post/]]) {
    const { code, err } = run(cwd, ['approve', slug]);
    assert.equal(code, 1, slug);
    assert.match(err, reason);
  }
  assert.equal(read(pinsPath), before);
});

// ---------- approve mode and pruning ----------

test('in approve mode an automatic pin must be proposed; a manual pin is still direct', () => {
  const { cwd, pinsPath } = site({ mode: 'approve', pins: [] });
  const refused = run(cwd, ['pin', 'live-one', '--by', 'eic', '--auto']);
  assert.equal(refused.code, 1);
  assert.match(refused.err, /approve mode/);
  assert.deepEqual(JSON.parse(read(pinsPath)).pins, []);
  assert.equal(run(cwd, ['pin', 'live-one', '--by', 'eic', '--auto', '--proposed']).code, 0);
  assert.equal(run(cwd, ['pin', 'live-two', '--by', 'michel']).code, 0);
  assert.deepEqual(JSON.parse(read(pinsPath)).pins.map((p) => [p.slug, p.state]), [['live-one', 'proposed'], ['live-two', 'active']]);
});

test('pinning removes active pins whose post is no longer published, and says so', () => {
  const { cwd, pinsPath } = site({ mode: 'auto', pins: [
    { slug: 'was-withdrawn', source: 'auto', state: 'active', pinnedBy: 'eic', pinnedAt: '2026-10-30T10:00:00Z' },
    { slug: 'live-two', source: 'manual', state: 'active', pinnedBy: 'michel', pinnedAt: '2026-10-30T09:00:00Z' },
  ] });
  const { code, out } = run(cwd, ['pin', 'live-one', '--by', 'eic', '--auto']);
  assert.equal(code, 0);
  assert.match(out, /removed the pin on was-withdrawn/);
  assert.deepEqual(JSON.parse(read(pinsPath)).pins.map((p) => p.slug), ['live-two', 'live-one']);
});

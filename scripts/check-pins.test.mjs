import assert from 'node:assert/strict';
import test from 'node:test';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { main } from './check-pins.mjs';
import { PINS_PATH, POSTS_DIR } from './pins.mjs';
import { tempDir } from './test-support.mjs';

const NOW = new Date('2026-10-31T12:00:00Z');
const published = '---\ntitle: "A"\npubDate: "2026-10-01T08:00:00Z"\n---\n\nBody.\n';
const draft = '---\ntitle: "A"\npubDate: "2026-10-01T08:00:00Z"\ndraft: true\n---\n\nBody.\n';

const entry = (over = {}) => ({ slug: 'live-one', source: 'manual', state: 'active', pinnedBy: 'michel', pinnedAt: '2026-10-30T10:00:00Z', ...over });

function site(pinsText, posts = { 'live-one': published, 'a-draft': draft }) {
  const cwd = tempDir('check-pins-');
  mkdirSync(join(cwd, POSTS_DIR), { recursive: true });
  mkdirSync(join(cwd, 'src/data'), { recursive: true });
  for (const [slug, text] of Object.entries(posts)) writeFileSync(join(cwd, POSTS_DIR, `${slug}.md`), text);
  if (pinsText !== null) writeFileSync(join(cwd, PINS_PATH), typeof pinsText === 'string' ? pinsText : JSON.stringify(pinsText));
  return cwd;
}
const run = (cwd, argv = []) => {
  const out = [];
  const err = [];
  const code = main(argv, { cwd, now: NOW, stdout: (l) => out.push(l), stderr: (l) => err.push(l) });
  return { code, out: out.join('\n'), err: err.join('\n') };
};

test('an empty file and a file of published pins pass, with and without --strict', () => {
  for (const pins of [[], [entry()]]) {
    for (const argv of [[], ['--strict']]) {
      const { code, out, err } = run(site({ mode: 'auto', pins }), argv);
      assert.equal(code, 0, err);
      assert.match(out, /is valid \(mode auto, \d pins?\)/);
    }
  }
});

test('a schema error exits 1 with and without --strict, and names the problem', () => {
  const broken = [
    ['{ nope', /not valid JSON/],
    [{ mode: 'auto', pins: [], extra: 1 }, /unknown key "extra"/],
    [{ mode: 'auto', pins: [entry({ state: 'pending' })] }, /state must be one of/],
    [{ mode: 'auto', pins: [entry({ pinnedAt: '2026-10-30T10:00:00' })] }, /pinnedAt must be an ISO 8601 timestamp with an offset/],
    [{ mode: 'auto', pins: [entry({ until: '2026-02-30' })] }, /until must be/],
    [{ mode: 'auto', pins: [entry(), entry()] }, /pinned twice/],
  ];
  for (const [pins, pattern] of broken) {
    for (const argv of [[], ['--strict']]) {
      const { code, err } = run(site(pins), argv);
      assert.equal(code, 1);
      assert.match(err, pattern);
    }
  }
});

test('a missing pins file exits 1', () => {
  const { code, err } = run(site(null));
  assert.equal(code, 1);
  assert.match(err, /file is missing/);
});

test('an active pin on an unpublished post is a warning by default, an error with --strict', () => {
  for (const slug of ['no-such-post', 'a-draft']) {
    const cwd = site({ mode: 'auto', pins: [entry({ slug })] });
    const normal = run(cwd);
    assert.equal(normal.code, 0);
    assert.match(normal.err, new RegExp(`warning: active pin "${slug}" names a post that is not published`));
    assert.match(normal.out, /1 dangling/);
    const strict = run(cwd, ['--strict']);
    assert.equal(strict.code, 1);
    assert.match(strict.err, new RegExp(`error: active pin "${slug}"`));
  }
});

test('a proposed pin on an unpublished post is not dangling: the site never shows it', () => {
  const cwd = site({ mode: 'approve', pins: [entry({ slug: 'no-such-post', state: 'proposed', source: 'auto' })] });
  assert.equal(run(cwd, ['--strict']).code, 0);
});

test('an expired pin on a published post is only a note', () => {
  const cwd = site({ mode: 'auto', pins: [entry({ until: '2026-10-30' })] });
  const { code, out } = run(cwd, ['--strict']);
  assert.equal(code, 0);
  assert.match(out, /note: pin "live-one" expired/);
});

test('an unknown argument is a usage error', () => {
  const { code, err } = run(site({ mode: 'auto', pins: [] }), ['--stricter']);
  assert.equal(code, 2);
  assert.match(err, /unknown argument --stricter/);
});

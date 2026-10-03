import assert from 'node:assert/strict';
import test from 'node:test';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { heroProblems, main, nextFreeSlots, preflight, slotProblems, styleNotes, styleProblems, takenSlots } from './bot-preflight.mjs';
import { quietly, tempDir } from './test-support.mjs';

const good = (extra = {}) => ({
  section: 'tools',
  title: 'LiteLLM Lens reads gateway traces',
  description: 'LiteLLM says Lens lets agents investigate traces stored in your own ClickHouse.',
  sources: [{ title: 'Docs', url: 'https://docs.litellm.ai/' }],
  wildness: { rating: 3, verified: 'Docs read', claimed: 'Vendor says it works' },
  ...extra,
});

test('a post written our way has no style problems', () => {
  assert.deepEqual(styleProblems(good(), '## Setup\n\nRun the container. It stores traces locally.\n'), []);
});

test('a section that is not a habitat fails the run', () => {
  assert.match(styleProblems({ ...good(), section: 'news' }, 'Plain.\n').join('\n'), /section "news" is not a habitat/);
  assert.deepEqual(styleProblems({ ...good(), section: 'rust' }, 'Plain.\n'), []);
});

test('an em-dash fails the run; the softer patterns are only noted', () => {
  const body = 'It works—really well. It is not slow, but fast.\n\n## Is it good?\n\nThis powerful, seamless tool will unlock value.\n';
  assert.match(styleProblems(good(), body).join('\n'), /em-dash/);
  const notes = styleNotes(body).join('\n');
  assert.match(notes, /not X, but Y/);
  assert.match(notes, /question heading/);
  assert.match(notes, /hype word\(s\): powerful, seamless, unlock/);
  assert.deepEqual(styleProblems(good(), 'It is not slow, but fast.\n'), []);
});

test('code fences are not judged as prose', () => {
  assert.deepEqual(styleProblems(good(), '```sh\necho "a — b is not x, but y"\n```\n'), []);
  assert.deepEqual(styleNotes('```sh\necho "not x, but y"\n```\n'), []);
});

test('long title, description and wildness lines, and missing sources, are named', () => {
  const found = styleProblems(good({ title: 'T'.repeat(121), description: 'D'.repeat(261), sources: [], wildness: { verified: 'v'.repeat(111), claimed: 'c'.repeat(111) } }), 'x').join('\n');
  assert.match(found, /title is 121/);
  assert.match(found, /description is 261/);
  assert.match(found, /wildness.verified is 111/);
  assert.match(found, /wildness.claimed is 111/);
  assert.match(found, /no sources/);
});

test('every post needs a hero on the media host with alt text', () => {
  assert.deepEqual(heroProblems({ heroImage: 'https://media.aitamer.news/heroes/a-0123abcd.jpg', heroAlt: 'A paper-cut room.' }), []);
  assert.match(heroProblems({}).join(), /no heroImage/);
  assert.match(heroProblems({ heroImage: '/heroes/a.jpg', heroAlt: 'x' }).join(), /repository path/);
  assert.match(heroProblems({ heroImage: 'https://media.aitamer.news/heroes/a.jpg' }).join(), /no heroAlt/);
});

test('the publish time must be on the half hour and free', () => {
  const taken = new Set(['2026-10-03T04:30']);
  assert.deepEqual(slotProblems('2026-10-03T05:00:00Z', taken), []);
  assert.match(slotProblems('2026-10-03T05:10:00Z', taken).join(), /off the 30-minute grid/);
  assert.match(slotProblems('2026-10-03T04:30:00Z', taken).join(), /already taken/);
  assert.match(slotProblems(undefined, taken).join(), /no readable pubDate/);
  assert.deepEqual(slotProblems(new Date('2026-10-03T05:30:00Z'), taken), []);
});

test('next free slots skip taken half hours and start after now', () => {
  const taken = new Set(['2026-10-03T04:30', '2026-10-03T05:00']);
  assert.deepEqual(nextFreeSlots(taken, new Date('2026-10-03T04:10:00Z'), 2), ['2026-10-03T05:30:00Z', '2026-10-03T06:00:00Z']);
  assert.deepEqual(nextFreeSlots(new Set(), new Date('2026-10-03T04:30:00Z')), ['2026-10-03T04:30:00Z']);
});

function repo(files) {
  const dir = tempDir('bot-preflight-');
  const postsDir = join(dir, 'posts');
  mkdirSync(postsDir);
  for (const [name, text] of Object.entries(files)) writeFileSync(join(postsDir, name), text);
  return { dir, postsDir };
}
const file = (pub, extra = '', body = 'Plain text.') => `---
section: tools
title: T
description: A plain sentence.
pubDate: "${pub}"
author: desk-bot
heroImage: https://media.aitamer.news/heroes/x-0123abcd.jpg
heroAlt: "A picture."
sources:
  - title: S
    url: https://example.com/
${extra}---

${body}
`;

test('preflight passes a clean post and ignores its own file when checking for a taken slot', () => {
  const { dir, postsDir } = repo({ 'a.md': file('2026-10-03T04:30:00Z'), 'b.md': file('2026-10-03T05:00:00Z') });
  assert.deepEqual(preflight([join(postsDir, 'a.md')], { postsDir, heroesDir: join(dir, 'none') }), []);
});

test('preflight reports a clash with another writer, and a clash inside the same pull request', () => {
  const { dir, postsDir } = repo({ 'a.md': file('2026-10-03T04:30:00Z'), 'mine.md': file('2026-10-03T04:30:00Z'), 'also.md': file('2026-10-03T06:00:00Z'), 'also2.md': file('2026-10-03T06:00:00Z') });
  const clash = preflight([join(postsDir, 'mine.md')], { postsDir, heroesDir: join(dir, 'none') });
  assert.match(clash[0].problems.join(), /already taken/);
  const same = preflight([join(postsDir, 'also.md'), join(postsDir, 'also2.md')], { postsDir, heroesDir: join(dir, 'none') });
  assert.ok(same.length >= 1);
});

test('preflight rejects a repository hero folder', () => {
  const { dir, postsDir } = repo({ 'a.md': file('2026-10-03T04:30:00Z') });
  const heroes = join(dir, 'heroes');
  mkdirSync(heroes);
  const found = preflight([join(postsDir, 'a.md')], { postsDir, heroesDir: heroes });
  assert.match(found.at(-1).problems.join(), /must not exist/);
});

test('--files exits 1 with the reasons and 0 when clean; --next-slot prints a slot', () => {
  const { postsDir } = repo({ 'bad.md': file('2026-10-03T04:10:00Z', '', 'It works—well.'), 'ok.md': file('2026-10-03T05:00:00Z'), 'noted.md': file('2026-10-03T06:30:00Z', '', 'It is not slow, but fast.') });
  const bad = quietly(() => main(['--files', join(postsDir, 'bad.md')]));
  assert.equal(bad.result, 1);
  assert.match(bad.output, /em-dash/);
  assert.match(bad.output, /off the 30-minute grid/);
  const noted = quietly(() => main(['--files', join(postsDir, 'noted.md')]));
  assert.equal(noted.result, 0);
  assert.match(noted.output, /not X, but Y/);
  const ok = quietly(() => main(['--files', join(postsDir, 'ok.md')]));
  assert.equal(ok.result, 0);
  const slot = quietly(() => main(['--next-slot', '2'], new Date('2026-10-03T04:00:00Z')));
  assert.equal(slot.result, 0);
  assert.equal(slot.output.split('\n').length, 2);
  assert.ok(takenSlots(postsDir).has('2026-10-03T05:00'));
});

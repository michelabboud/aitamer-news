import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import yaml from 'js-yaml';
import { appendCorrection, checkEdit, editPost, houseDate, main, setKey, splitPost, stamp } from './post-edit.mjs';

const NOW = new Date('2026-10-30T08:00:00Z');
const ok200 = async () => ({ status: 200 });
const dead = async () => ({ status: 404 });
const post = ({ extraFm = '', body = 'Vendor says [the API](https://a.example/post) is out.\n\n## Why it matters\n\nIt is cheaper.\n' } = {}) => `---
title: "Vendor ships an API"
description: "One line."
pubDate: "2026-10-27T13:07:00Z"
specimen: 1084
section: dev
tags:
  - api
draft: false
heroImage: https://media.aitamer.news/heroes/x-0123abcd.jpg
heroAlt: "A drawer."
author: desk-bot
wildness:
  rating: 3
  verified: "The page was read"
  claimed: "Prices are vendor claims"
verdict: "Cheaper calls."
${extraFm}sources:
  - title: "Vendor blog"
    url: https://a.example/post
---

${body}`;
const fm = (text) => yaml.load(splitPost(text).fm);
const run = (o) => editPost({ baseText: post(), currentText: post(), now: NOW, fetcher: ok200, ...o });

test('stamps and house dates are UTC, to the minute, in the house formats', () => {
  assert.equal(stamp(new Date('2026-10-30T07:45:31.900Z')), '2026-10-30T07:45:00Z');
  assert.equal(houseDate(new Date('2026-10-09T23:59:00Z')), '9 October 2026');
});

test('correct appends a dated entry and leaves every other frontmatter byte alone', async () => {
  const r = await run({ action: 'correct', text: 'We said 5 percent; the paper says 0.5 percent.' });
  assert.equal(r.status, 'ok', JSON.stringify(r.problems));
  assert.deepEqual(fm(r.file).corrections, [{ date: '2026-10-30T08:00:00Z', text: 'We said 5 percent; the paper says 0.5 percent.' }]);
  assert.equal(r.file.replace(/corrections:\n(?: {2}.*\n)+/, ''), post());
  assert.ok(r.file.indexOf('corrections:') < r.file.indexOf('sources:'));
});

test('a second correction keeps the first exactly as written and uses its indent', () => {
  const first = 'corrections:\n- date: 2026-10-28\n  text: First.\n';
  const out = appendCorrection(splitPost(post({ extraFm: first })).fm, { date: '2026-10-30T08:00:00Z', text: 'Second.' });
  assert.match(out, /corrections:\n- date: 2026-10-28\n {2}text: First\.\n- date: "2026-10-30T08:00:00Z"\n {2}text: "Second\."\n/);
});

test('an empty flow list may become a block list; a filled one is refused rather than rewritten', () => {
  assert.match(appendCorrection('corrections: []', { date: 'd', text: 't' }), /^corrections:\n {2}- date: "d"\n {4}text: "t"$/);
  assert.throws(() => appendCorrection('corrections: [{date: 2026-10-28, text: x}]', { date: 'd', text: 't' }), /flow style/);
});

test('update appends a house-style section and sets updatedDate after the specimen', async () => {
  const r = await run({ action: 'update', heading: 'noyb pulls the complaint PDF', text: 'noyb removed the PDF from its site.' });
  assert.equal(r.status, 'ok', JSON.stringify(r.problems));
  assert.match(r.file, /\n\n## Update, 30 October 2026: noyb pulls the complaint PDF\n\nnoyb removed the PDF from its site\.\n$/);
  assert.match(r.file, /specimen: 1084\nupdatedDate: "2026-10-30T08:00:00Z"\n/);
  const again = await editPost({ baseText: r.file, currentText: r.file, now: new Date('2026-10-31T09:00:00Z'), fetcher: ok200, action: 'update', heading: 'More', text: 'Later news.' });
  assert.equal(again.status, 'ok', JSON.stringify(again.problems));
  assert.equal(fm(again.file).updatedDate, '2026-10-31T09:00:00Z');
  assert.equal((again.file.match(/^updatedDate:/gm) ?? []).length, 1);
});

test('withdraw adds the notice; restore removes it and records why the post is back', async () => {
  const w = await run({ action: 'withdraw', reason: 'The vendor retracted the announcement.' });
  assert.equal(w.status, 'ok', JSON.stringify(w.problems));
  assert.deepEqual(fm(w.file).withdrawn, { date: '2026-10-30T08:00:00Z', reason: 'The vendor retracted the announcement.' });
  const later = new Date('2026-11-02T10:00:00Z');
  const r = await editPost({ baseText: w.file, currentText: w.file, now: later, fetcher: ok200, action: 'restore', text: 'The vendor confirmed the announcement after all.' });
  assert.equal(r.status, 'ok', JSON.stringify(r.problems));
  assert.equal(fm(r.file).withdrawn, undefined);
  assert.equal(fm(r.file).specimen, 1084, 'a restored post keeps its own number');
  assert.equal(fm(r.file).corrections.at(-1).text, 'The vendor confirmed the announcement after all.');
});

test('edit accepts a checked hand copy edit and adds no notice', async () => {
  const fixed = post({ body: 'Vendor says [the API](https://a.example/post) is out.\n\n## Why it matters\n\nIt is cheaper now.\n' });
  const r = await run({ action: 'edit', currentText: fixed });
  assert.equal(r.status, 'ok', JSON.stringify(r.problems));
  assert.equal(r.file, fixed);
  assert.deepEqual(r.changes, []);
});

test('a correction can carry the hand fix of the wrong sentence in the same edit', async () => {
  const fixed = post({ body: 'Vendor says [the API](https://a.example/post) is in beta.\n\n## Why it matters\n\nIt is cheaper.\n' });
  const r = await run({ action: 'correct', currentText: fixed, text: 'The API is in beta, not generally available.' });
  assert.equal(r.status, 'ok', JSON.stringify(r.problems));
  assert.match(r.file, /is in beta\./);
});

test('refuses to change identity or history: pubDate, specimen, author, draft', async () => {
  for (const [from, to] of [['pubDate: "2026-10-27T13:07:00Z"', 'pubDate: "2026-10-30T07:00:00Z"'], ['specimen: 1084', 'specimen: 1085'], ['author: desk-bot', 'author: wiz-cat'], ['draft: false', 'draft: true']]) {
    const r = await run({ action: 'edit', currentText: post().replace(from, to) });
    assert.equal(r.status, 'failed');
    assert.ok(r.problems.some((p) => p.code === 'frozen'), `${to}: ${JSON.stringify(r.problems)}`);
    assert.equal(r.file, null);
  }
});

test('refuses an edited or removed earlier correction', async () => {
  const base = post({ extraFm: 'corrections:\n  - date: "2026-10-28T10:00:00Z"\n    text: "First."\n' });
  for (const current of [base.replace('"First."', '"Changed."'), base.replace(/corrections:\n.*\n.*\n/, '')]) {
    const r = await editPost({ baseText: base, currentText: current, now: NOW, fetcher: ok200, action: 'edit' });
    assert.ok(r.problems.some((p) => p.code === 'corrections-history'), JSON.stringify(r.problems));
  }
});

test('a withdrawal comes and goes only through withdraw and restore, and is never edited', async () => {
  const withdrawn = post({ extraFm: 'withdrawn:\n  date: "2026-10-28T10:00:00Z"\n  reason: "Retracted."\n' });
  const hand = await run({ action: 'edit', currentText: withdrawn });
  assert.ok(hand.problems.some((p) => p.code === 'withdrawn'), 'a hand-added withdrawal');
  const unhand = await editPost({ baseText: withdrawn, currentText: post(), now: NOW, fetcher: ok200, action: 'edit' });
  assert.ok(unhand.problems.some((p) => p.code === 'withdrawn' && p.field === 'withdrawn'), 'a hand-removed withdrawal');
  assert.ok(unhand.problems.some((p) => p.code === 'withdrawn' && p.field === 'corrections'), 'and no reinstatement note');
  const reworded = await editPost({ baseText: withdrawn, currentText: withdrawn.replace('Retracted.', 'Wrong.'), now: NOW, fetcher: ok200, action: 'edit' });
  assert.ok(reworded.problems.some((p) => p.code === 'withdrawn'));
  assert.equal((await run({ action: 'restore', text: 'Back.' })).status, 'error', 'restore on a live post is a usage error');
  assert.equal((await editPost({ baseText: withdrawn, currentText: withdrawn, now: NOW, fetcher: ok200, action: 'withdraw', reason: 'Again.' })).status, 'error');
});

test('notice dates sit between pubDate and now; updatedDate only moves forward and is never removed', async () => {
  const early = await editPost({ baseText: post(), currentText: post(), now: new Date('2026-10-01T00:00:00Z'), fetcher: ok200, action: 'correct', text: 'Before publication.' });
  assert.ok(early.problems.some((p) => p.code === 'notice-date'));
  const future = await run({ action: 'edit', currentText: post({ extraFm: 'updatedDate: "2027-01-01T00:00:00Z"\n' }) });
  assert.ok(future.problems.some((p) => p.code === 'notice-date' && p.field === 'updatedDate'));
  const withUpdate = post({ extraFm: 'updatedDate: "2026-10-29T00:00:00Z"\n' });
  const removed = await editPost({ baseText: withUpdate, currentText: post(), now: NOW, fetcher: ok200, action: 'edit' });
  assert.ok(removed.problems.some((p) => p.field === 'updatedDate'));
  const backwards = await editPost({ baseText: withUpdate, currentText: withUpdate.replace('2026-10-29', '2026-10-28'), now: NOW, fetcher: ok200, action: 'edit' });
  assert.ok(backwards.problems.some((p) => p.field === 'updatedDate'));
});

test('links: a new body link must be a source and answer; a source still linked may not be dropped', async () => {
  const unsourced = await run({ action: 'edit', currentText: post({ body: 'See [new](https://b.example/x).\n\nVendor says [the API](https://a.example/post) is out.\n' }) });
  assert.ok(unsourced.problems.some((p) => p.code === 'link-not-in-sources' && p.message.includes('b.example')));
  const dropped = await run({ action: 'edit', currentText: post().replace(/sources:\n[\s\S]*?---/, 'sources: []\n---') });
  assert.ok(dropped.problems.some((p) => p.code === 'link-not-in-sources' && p.field === 'sources'), JSON.stringify(dropped.problems));
  const added = post().replace('sources:\n', 'sources:\n  - title: "New"\n    url: https://b.example/x\n').replace('is out.', 'is out ([more](https://b.example/x)).');
  assert.equal((await run({ action: 'edit', currentText: added })).status, 'ok');
  const deadLink = await run({ action: 'edit', currentText: added, fetcher: dead });
  assert.ok(deadLink.problems.some((p) => p.code === 'dead-link'));
  assert.equal((await run({ action: 'edit', currentText: added, fetcher: dead, noLinks: true })).status, 'ok', '--no-links skips the network');
});

test('a link the post on main already left unsourced is not this edit\'s problem', async () => {
  const legacy = post({ body: 'Old [link](https://old.example/) and [the API](https://a.example/post).\n' });
  const r = await editPost({ baseText: legacy, currentText: legacy.replace('Old', 'Older'), now: NOW, fetcher: ok200, action: 'edit' });
  assert.equal(r.status, 'ok', JSON.stringify(r.problems));
});

test('refuses no change, schema breaks, working notes, em-dashes and oversize notices', async () => {
  assert.ok((await run({ action: 'edit' })).problems.some((p) => p.code === 'no-change'));
  assert.ok((await run({ action: 'edit', currentText: post().replace('section: dev', 'section: nowhere') })).problems.some((p) => p.code === 'schema'));
  assert.ok((await run({ action: 'edit', currentText: post().replace('It is cheaper.', 'It is cheaper. Do not invent prices.') })).problems.some((p) => p.code === 'leak'));
  assert.equal((await run({ action: 'correct', text: 'It was wrong — badly.' })).status, 'error');
  assert.equal((await run({ action: 'correct', text: 'x'.repeat(501) })).status, 'error');
  assert.equal((await run({ action: 'correct', text: '   ' })).status, 'error');
  assert.equal((await run({ action: 'update', heading: 'Only a heading' })).status, 'error');
  assert.equal((await run({ action: 'publish' })).status, 'error');
});

test('setKey keeps other keys byte for byte and removes a key cleanly', () => {
  const f = splitPost(post()).fm;
  assert.equal(setKey(setKey(f, 'updatedDate', 'x', ['specimen']), 'updatedDate', undefined), f);
});

test('the CLI edits a post on main in a git checkout and refuses one that is not there', async () => {
  const dir = mkdtempSync(join(tmpdir(), 'post-edit-'));
  mkdirSync(join(dir, 'src/content/posts'), { recursive: true });
  const git = (...a) => execFileSync('git', a, { cwd: dir, stdio: 'pipe' });
  git('init', '-q', '-b', 'main'); git('config', 'user.email', 't@example.com'); git('config', 'user.name', 't');
  writeFileSync(join(dir, 'src/content/posts/vendor-api.md'), post());
  git('add', '.'); git('commit', '-qm', 'base');
  const log = console.log; const err = console.error; const lines = [];
  console.log = (s) => lines.push(s); console.error = () => {};
  try {
    assert.equal(await main(['correct', '--slug', 'vendor-api', '--base', 'main', '--now', NOW.toISOString(), '--text', 'Fixed a number.'], { cwd: dir, fetcher: ok200 }), 0);
    assert.equal(fm(readFileSync(join(dir, 'src/content/posts/vendor-api.md'), 'utf8')).corrections.length, 1);
    writeFileSync(join(dir, 'src/content/posts/new-post.md'), post());
    assert.equal(await main(['edit', '--slug', 'new-post', '--base', 'main'], { cwd: dir, fetcher: ok200 }), 1);
    assert.match(lines.at(-1), /not-on-main/);
    assert.equal(await main(['edit', '--slug', '../etc/passwd'], { cwd: dir }), 2);
    assert.equal(await main(['publish', '--slug', 'vendor-api'], { cwd: dir }), 2);
  } finally { console.log = log; console.error = err; }
});

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { shareTargets } from './share.ts';

const STORY = {
  url: 'https://aitamer.news/posts/codex-cloud/',
  title: 'Codex cloud & the “sandbox”: 100% new?',
  summary: 'What changed, what it costs.',
};

const byId = (id: string) => shareTargets(STORY).find((t) => t.id === id)!;

test('six targets in a fixed order, every web one external and the e-mail one not', () => {
  const targets = shareTargets(STORY);
  assert.deepEqual(targets.map((t) => t.id), ['x', 'linkedin', 'bluesky', 'whatsapp', 'telegram', 'email']);
  assert.deepEqual(targets.filter((t) => !t.external).map((t) => t.id), ['email']);
});

test('the canonical URL travels untouched and fully encoded, with no tracking parameter', () => {
  for (const t of shareTargets(STORY)) {
    assert.ok(t.href.includes(encodeURIComponent(STORY.url)), `${t.id} carries the story URL`);
    assert.ok(!/utm_|fbclid|ref=/.test(t.href), `${t.id} adds no tracking`);
  }
});

test('titles with &, quotes and percent signs cannot break out of their query value', () => {
  const x = new URL(byId('x').href);
  assert.equal(x.searchParams.get('text'), STORY.title);
  assert.equal(x.searchParams.get('url'), STORY.url);
  const telegram = new URL(byId('telegram').href);
  assert.equal(telegram.searchParams.get('text'), STORY.title);
  assert.equal(telegram.searchParams.get('url'), STORY.url);
});

test('bluesky and whatsapp put the title and the URL in one text; LinkedIn takes the URL only', () => {
  assert.equal(new URL(byId('bluesky').href).searchParams.get('text'), `${STORY.title} ${STORY.url}`);
  assert.equal(new URL(byId('whatsapp').href).searchParams.get('text'), `${STORY.title}\n${STORY.url}`);
  assert.equal(new URL(byId('linkedin').href).searchParams.get('url'), STORY.url);
});

test('the e-mail carries the title as subject and the summary and URL as body', () => {
  const mail = byId('email').href;
  assert.ok(mail.startsWith('mailto:?subject='));
  const params = new URLSearchParams(mail.slice('mailto:?'.length));
  assert.equal(params.get('subject'), STORY.title);
  assert.equal(params.get('body'), `${STORY.summary}\n\n${STORY.url}`);
});

test('a non-https story URL and an empty title are refused', () => {
  assert.throws(() => shareTargets({ ...STORY, url: 'http://aitamer.news/x/' }), /must be https/);
  assert.throws(() => shareTargets({ ...STORY, url: 'not a url' }));
  assert.throws(() => shareTargets({ ...STORY, title: '  ' }), /needs a title/);
});

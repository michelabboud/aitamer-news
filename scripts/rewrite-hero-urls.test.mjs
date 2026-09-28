import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { main, slugOf, withMediaHero } from './rewrite-hero-urls.mjs';
import { quietly, tempDir } from './test-support.mjs';

const post = (frontmatter, body = 'Body mentions heroImage: /heroes/a.jpg in prose.\n') => `---\n${frontmatter}\n---\n\n${body}`;
const MEDIA = 'https://media.aitamer.news/heroes/a.jpg';

test('the heroImage line is the only thing that changes, body included', () => {
  const before = post('title: "Costs $$ and $\'"\nheroImage: /heroes/a.jpg\ndraft: false');
  const after = withMediaHero(before, 'a');
  assert.equal(after, before.replace('heroImage: /heroes/a.jpg\n', () => `heroImage: ${MEDIA}\n`));
  assert.ok(after.endsWith('Body mentions heroImage: /heroes/a.jpg in prose.\n'), 'the body is untouched');
});

test('idempotent: an already-moved hero and a post with no hero need nothing', () => {
  assert.equal(withMediaHero(post(`heroImage: ${MEDIA}`), 'a'), null);
  assert.equal(withMediaHero(post('title: A'), 'a'), null);
  assert.equal(withMediaHero('no frontmatter\n', 'a'), null);
});

test('a hero that is not the post\'s own file is refused', () => {
  assert.throws(() => withMediaHero(post('heroImage: /heroes/b.jpg'), 'a'), /not \/heroes\/a\.jpg/);
  assert.throws(() => withMediaHero(post('heroImage: https://elsewhere.example/a.jpg'), 'a'), /only a post's own hero/);
  assert.throws(() => withMediaHero(post('heroImage: https://media.aitamer.news/heroes/b.jpg'), 'a'), /only a post's own hero/);
});

test('a hero written in any other spelling is refused, not guessed at', () => {
  assert.throws(() => withMediaHero(post('heroImage: "/heroes/a.jpg"'), 'a'), /plain `heroImage: \/heroes\/a\.jpg` line/);
  assert.throws(() => withMediaHero(post('heroImage: /heroes/a.jpg # old'), 'a'), /plain/);
});

test('the slug is the file name without its extension', () => {
  assert.equal(slugOf('src/content/posts/grok-4-7.md'), 'grok-4-7');
  assert.equal(slugOf('x/y.mdx'), 'y');
});

test('main rewrites every post, or none when one is refused; --check writes nothing', () => {
  const dir = tempDir('heroes-');
  const a = post('title: A\nheroImage: /heroes/a.jpg');
  const b = post('title: B\nheroImage: /heroes/b.jpg');
  writeFileSync(join(dir, 'a.md'), a);
  writeFileSync(join(dir, 'b.md'), b);
  writeFileSync(join(dir, 'c.md'), post('title: C\nheroImage: /heroes/a.jpg'));
  const refused = quietly(() => main([], { postsDir: dir }));
  assert.equal(refused.result, 1);
  assert.match(refused.output, /c\.md: heroImage is "\/heroes\/a\.jpg", not \/heroes\/c\.jpg/);
  assert.equal(readFileSync(join(dir, 'a.md'), 'utf8'), a, 'nothing written when one post is refused');

  writeFileSync(join(dir, 'c.md'), post('title: C'));
  const dry = quietly(() => main(['--check'], { postsDir: dir }));
  assert.equal(dry.result, 1);
  assert.match(dry.output, /2 of 3 post\(s\) would change/);
  assert.equal(readFileSync(join(dir, 'b.md'), 'utf8'), b);

  assert.equal(quietly(() => main([], { postsDir: dir })).result, 0);
  assert.equal(readFileSync(join(dir, 'b.md'), 'utf8'), b.replace('/heroes/b.jpg', 'https://media.aitamer.news/heroes/b.jpg'));
  const again = quietly(() => main(['--check'], { postsDir: dir }));
  assert.equal(again.result, 0);
  assert.match(again.output, /0 of 3 post\(s\) would change/);
});

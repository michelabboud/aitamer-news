import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { chooseStamp, dateOnlyPubDate, gitPublishTime, isoUtcSeconds, main, withStamp } from './stamp-post-times.mjs';
import { gitIn, quietly, tempDir } from './test-support.mjs';

const post = (frontmatter, body = 'Body mentions pubDate: 2026-01-01 in prose.\n') =>
  `---\n${frontmatter}\n---\n\n${body}`;

test('a published post with a date-only pubDate needs a stamp; drafts and timed posts do not', () => {
  assert.equal(dateOnlyPubDate(post('title: A\npubDate: 2026-09-24\ndraft: false')), '2026-09-24');
  assert.equal(dateOnlyPubDate(post('title: A\npubDate: "2026-09-24"')), '2026-09-24');
  assert.equal(dateOnlyPubDate(post("pubDate: '2026-09-24'")), '2026-09-24');
  assert.equal(dateOnlyPubDate(post('pubDate: 2026-09-24\ndraft: true')), null);
  assert.equal(dateOnlyPubDate(post('pubDate: 2026-09-24T09:15:12Z')), null);
  assert.equal(dateOnlyPubDate('no frontmatter\npubDate: 2026-09-24\n'), null);
});

test('only a pubDate inside the frontmatter counts', () => {
  const body = 'pubDate: 2026-09-24\n';
  assert.equal(dateOnlyPubDate(post('title: A\npubDate: 2026-09-24T09:15:12Z', body)), null);
});

test('the time is kept when it falls on the editorial day, in UTC', () => {
  // 12:15 at +03:00 is 09:15 UTC, same day.
  assert.deepEqual(chooseStamp('2026-09-24', new Date('2026-09-24T12:15:12+03:00')), {
    value: '2026-09-24T09:15:12Z',
    exact: true,
  });
});

test('a time on another UTC day never moves the editorial date', () => {
  // 01:30 at +03:00 is still the previous UTC day.
  assert.deepEqual(chooseStamp('2026-09-24', new Date('2026-09-24T01:30:00+03:00')), {
    value: '2026-09-24T00:00:00Z',
    exact: false,
  });
  assert.deepEqual(chooseStamp('2026-09-20', new Date('2026-09-23T11:54:23Z')), {
    value: '2026-09-20T00:00:00Z',
    exact: false,
  });
});

test('stamping rewrites the pubDate line and nothing else', () => {
  const before = post('title: A\npubDate: 2026-09-24\nupdatedDate: 2026-09-25\ndraft: false');
  const after = withStamp(before, '2026-09-24T09:15:12Z');
  assert.equal(after, before.replace('pubDate: 2026-09-24\n', 'pubDate: 2026-09-24T09:15:12Z\n'));
  assert.equal(dateOnlyPubDate(after), null);
  assert.throws(() => withStamp(after, '2026-09-24T09:15:12Z'), /no date-only pubDate/);
});

test('stamps have second precision and a Z suffix', () => {
  assert.equal(isoUtcSeconds(new Date('2026-09-24T09:15:12.987Z')), '2026-09-24T09:15:12Z');
});

// --- B1: read like YAML, not like a regex ----------------------------------------------------

test('trailing comments, True and quoted values are read as YAML (B1)', () => {
  // A commented date-only pubDate still needs a time (the old regex let check:times pass it).
  assert.equal(dateOnlyPubDate(post('pubDate: 2026-09-24   # plain date while drafting\ndraft: false  # live')), '2026-09-24');
  // A commented or capitalised draft stays a draft.
  assert.equal(dateOnlyPubDate(post('pubDate: 2026-09-24\ndraft: true               # keep true until ready')), null);
  assert.equal(dateOnlyPubDate(post('pubDate: 2026-09-24\ndraft: True')), null);
  assert.throws(() => dateOnlyPubDate(post('title: "unclosed\npubDate: 2026-09-24')), /not valid YAML/);
});

test('stamping keeps a trailing comment, CRLF line endings and a byte-order mark', () => {
  const commented = post('title: A\npubDate: 2026-09-24   # draft date\ndraft: false');
  assert.equal(
    withStamp(commented, '2026-09-24T09:15:12Z'),
    commented.replace('pubDate: 2026-09-24   # draft date', 'pubDate: 2026-09-24T09:15:12Z # draft date'),
  );
  const crlf = '---\r\ntitle: A\r\npubDate: 2026-09-24\r\ndraft: false\r\n---\r\n\r\nBody\r\n';
  assert.equal(withStamp(crlf, '2026-09-24T09:15:12Z'), crlf.replace('pubDate: 2026-09-24\r\n', 'pubDate: 2026-09-24T09:15:12Z\r\n'));
  const bom = `\uFEFF${post('pubDate: "2026-09-24"')}`;
  assert.equal(withStamp(bom, '2026-09-24T09:15:12Z'), bom.replace('pubDate: "2026-09-24"', 'pubDate: 2026-09-24T09:15:12Z'));
});

// --- B6: `$` patterns in user text must survive -----------------------------------------------

test('dollar patterns in the header survive stamping byte for byte (B6)', () => {
  // With String.replace(string, string), `$$` became `$` and `$'` pasted the rest of the file into the header.
  const before = post("title: \"Pricing drops from $$ to $' and $& and $`\"\npubDate: 2026-09-24\ndraft: false");
  const after = withStamp(before, '2026-09-24T09:15:12Z');
  assert.equal(after, before.replace('pubDate: 2026-09-24\n', () => 'pubDate: 2026-09-24T09:15:12Z\n'));
  assert.match(after, /from \$\$ to \$' and \$& and \$`/);
});

// --- all or nothing ---------------------------------------------------------------------------

test('one unreadable post stops the run and nothing is written; check mode reports it', () => {
  const dir = tempDir('times-');
  const good = post('title: A\npubDate: 2026-09-24\ndraft: false');
  writeFileSync(join(dir, 'a.md'), good);
  writeFileSync(join(dir, 'b.md'), post('title: "unclosed\npubDate: 2026-09-24'));
  const options = { postsDir: dir, now: new Date('2026-09-24T09:00:00Z'), publishTime: () => null };
  const stamp = quietly(() => main([], options));
  assert.equal(stamp.result, 1);
  assert.match(stamp.output, /b\.md: frontmatter is not valid YAML/);
  assert.equal(readFileSync(join(dir, 'a.md'), 'utf8'), good);
  const check = quietly(() => main(['--check'], options));
  assert.equal(check.result, 1);
  assert.match(check.output, /nothing was changed/);
});

test('main stamps a pending post with its git time when that falls on the editorial day', () => {
  const dir = tempDir('times-');
  writeFileSync(join(dir, 'a.md'), post('pubDate: 2026-09-24 # c'));
  const options = { postsDir: dir, now: new Date('2026-09-30T00:00:00Z'), publishTime: () => new Date('2026-09-24T10:11:12Z') };
  assert.equal(quietly(() => main([], options)).result, 0);
  assert.match(readFileSync(join(dir, 'a.md'), 'utf8'), /^pubDate: 2026-09-24T10:11:12Z # c$/m);
  assert.equal(quietly(() => main(['--check'], options)).result, 0);
});

test('the git publish time is the first commit carrying draft: false, in any YAML spelling', () => {
  const repo = tempDir('times-git-');
  const git = gitIn(repo);
  writeFileSync(join(repo, 'p.md'), post('pubDate: 2026-09-24\ndraft: true'));
  git(['add', 'p.md']);
  git(['commit', '-q', '-m', 'draft'], { GIT_COMMITTER_DATE: '2026-09-23T08:00:00Z' });
  writeFileSync(join(repo, 'p.md'), post('pubDate: 2026-09-24\ndraft: False   # live'));
  git(['commit', '-q', '-am', 'publish'], { GIT_COMMITTER_DATE: '2026-09-24T09:30:00Z' });
  writeFileSync(join(repo, 'p.md'), post('pubDate: 2026-09-24\ndraft: false'));
  git(['commit', '-q', '-am', 'respell'], { GIT_COMMITTER_DATE: '2026-09-25T09:30:00Z' });
  assert.equal(gitPublishTime('p.md', { cwd: repo }).toISOString(), '2026-09-24T09:30:00.000Z');
});

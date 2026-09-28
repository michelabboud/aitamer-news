import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseFrontmatter } from '@astrojs/internal-helpers/frontmatter';
import { FrontmatterError, SLUG, SLUG_MAX_LENGTH, assertOnlyChanged, isPublishedDraftField, pubDateOf, readFrontmatter } from './frontmatter.mjs';
import { SLUG as DEPENDENCY_FREE_SLUG, SLUG_MAX_LENGTH as DEPENDENCY_FREE_SLUG_MAX_LENGTH } from './slug.mjs';

const BOM = '\uFEFF';

test('reads the YAML the way Astro does, on the shapes the regexes got wrong (B1)', () => {
  const cases = [
    // The README template: trailing comments on the lines that decide publish state.
    'title: "A"\npubDate: 2026-09-25          # plain date while drafting\nsection: tools   # one habitat\ndraft: true               # keep true until ready\nsources:                  # optional\n  - title: "x"\n    url: https://example.com',
    'draft: True\npubDate: "2026-09-25"',
    "section: 'opinion'\npubDate: 2026-09-25T09:15:12Z",
    'sources: [{title: a, url: https://a.example}, {url: https://b.example}]\npubDate: 2026-09-25',
    'sources:\n- title: a\n  url: https://a.example\npubDate: 2026-09-25',
    'sources: []\npubDate: 2026-09-25',
  ];
  for (const fm of cases) {
    const text = `---\n${fm}\n---\n\nBody.\n`;
    assert.deepEqual(readFrontmatter(text).data, parseFrontmatter(text).frontmatter, fm);
  }
});

test('comments, True, flow and unindented lists mean what YAML says', () => {
  const template = readFrontmatter('---\npubDate: 2026-09-25   # c\nsection: tools   # c\ndraft: true   # keep\nsources:   # optional\n---\n');
  assert.equal(template.data.draft, true);
  assert.equal(template.data.section, 'tools');
  assert.equal(template.data.sources, null);
  assert.equal(isPublishedDraftField(readFrontmatter('---\ndraft: True\n---\n').data), false);
  assert.equal(isPublishedDraftField(readFrontmatter('---\ndraft: false # live\n---\n').data), true);
  assert.equal(isPublishedDraftField(readFrontmatter('---\ntitle: no draft line\n---\n').data), true);
  assert.equal(isPublishedDraftField(readFrontmatter('---\ndraft: yes\n---\n').data), null);
  assert.equal(readFrontmatter('---\nsources: [{url: u}]\n---\n').data.sources.length, 1);
  assert.equal(readFrontmatter('---\nsources:\n- url: u\n---\n').data.sources.length, 1);
});

test('CRLF and a byte-order mark are refused (review of PR #46, B1); the raw block is located exactly', () => {
  assert.throws(() => readFrontmatter('---\r\ntitle: A\r\npubDate: 2026-09-25\r\n---\r\n\r\nBody\r\n'), /carriage return; use LF line ends only/);
  assert.throws(() => readFrontmatter('---\ntitle: A\n---\nBody\r\n'), /carriage return/, 'in the body too');
  assert.throws(() => readFrontmatter(`${BOM}---\ntitle: B\n---\nBody\n`), /byte-order mark/);
  const text = '\n---\ntitle: B\n---\nBody\n';
  const fm = readFrontmatter(text);
  assert.equal(fm.data.title, 'B');
  assert.equal(text.slice(fm.start, fm.end), 'title: B');
});

test('a file without frontmatter is null; broken YAML or a non-mapping is an error, not a guess', () => {
  assert.equal(readFrontmatter('no fence\npubDate: 2026-09-25\n'), null);
  assert.throws(() => readFrontmatter('---\ntitle: "unclosed\n---\n'), FrontmatterError);
  assert.throws(() => readFrontmatter('---\ntitle: a\ntitle: b\n---\n'), /duplicated mapping key/);
  assert.throws(() => readFrontmatter('---\n- a list\n---\n'), /mapping/);
});

test('pubDateOf tells a date-only value from a timed one, quoted or commented', () => {
  const read = (line) => pubDateOf(readFrontmatter(`---\n${line}\n---\n`));
  assert.deepEqual(read('pubDate: 2026-09-25'), { date: new Date('2026-09-25T00:00:00Z'), day: '2026-09-25', comment: null });
  assert.equal(read('pubDate: "2026-09-25"').day, '2026-09-25');
  assert.equal(read("pubDate: '2026-09-25'   # draft date").comment, '# draft date');
  assert.deepEqual(read('pubDate: 2026-09-25T00:00:00Z'), { date: new Date('2026-09-25T00:00:00Z'), day: null, comment: null });
  assert.equal(read('pubDate: "2026-09-25T09:15:12Z"').date.toISOString(), '2026-09-25T09:15:12.000Z');
  assert.deepEqual(read('title: none'), { date: null, day: null, comment: null });
  // A date-only value the stamper could not rewrite is refused, never skipped.
  assert.throws(() => pubDateOf(readFrontmatter('---\npubDate: >-\n  2026-09-25\n---\n')), /cannot rewrite/);
  // Without its own line, a date-only value and midnight UTC are the same Date: refused, not guessed.
  assert.throws(() => pubDateOf(readFrontmatter('---\n"pubDate": 2026-09-25\n---\n')), /own top-level line/);
  assert.throws(() => pubDateOf(readFrontmatter('---\n{title: T, pubDate: 2026-09-25}\n---\n')), /own top-level line/);
});

test('assertOnlyChanged refuses an edit that touched another field', () => {
  const before = readFrontmatter('---\ntitle: A\nspecimen: 1\n---\n').data;
  assert.doesNotThrow(() => assertOnlyChanged(before, '---\ntitle: A\nspecimen: 2\n---\n', 'specimen', (v) => v === 2));
  assert.throws(() => assertOnlyChanged(before, '---\ntitle: B\nspecimen: 2\n---\n', 'specimen', (v) => v === 2), /changed other fields/);
  assert.throws(() => assertOnlyChanged(before, '---\ntitle: A\nspecimen: 3\n---\n', 'specimen', (v) => v === 2), /unexpected value/);
});

test('the slug rule accepts the real slugs and refuses what Astro or the ledger would change', () => {
  for (const ok of ['grok-4-7', 'gpt-6-sol-luna-api-pricing', '0day']) assert.match(ok, SLUG);
  for (const bad of ['Grok-5', 'gpt-5.6', 'a b', '-lead', 'under_score', '']) assert.doesNotMatch(bad, SLUG);
});

test('the slug rule is the one in the dependency-free scripts/slug.mjs, re-exported', () => {
  assert.equal(SLUG, DEPENDENCY_FREE_SLUG);
  assert.equal(SLUG_MAX_LENGTH, DEPENDENCY_FREE_SLUG_MAX_LENGTH);
});

// ---- the deep review of PR #46 (B1, and its addendum): the site's scripts and Astro read one frontmatter ----

/** The reviewer's split: `<<` hides one value from Astro's shorter cut, a `+++` line ends Astro's block. */
const split = (field, astroValue, siteValue, before = 'title: T') =>
  `---\n${before}\n<<: {${field}: ${astroValue}}\n+++: x\n${field}: ${siteValue}\n---\nbody\n`;
const astroRead = (text) => parseFrontmatter(text, { frontmatter: 'empty-with-spaces' }).frontmatter;

test('review B1: a post that reads one way to the site and another to Astro is refused (the addendum’s payload)', () => {
  const payload = '---\ntitle: T\ntags: [opinion]\n<<: {author: desk-bot}\n+++: x\nauthor: wiz-cat\n---\nbody\n';
  assert.equal(astroRead(payload).author, 'desk-bot', 'the premise: Astro reads the bot');
  assert.throws(() => readFrontmatter(payload), FrontmatterError);
});

test('review B1: author, kind, draft, pubDate, specimen and tags can no longer read differently', () => {
  for (const [field, astroValue, siteValue] of [
    ['author', 'desk-bot', 'wiz-cat'],
    ['kind', 'human', 'ai'],
    ['draft', 'true', 'false'],
    ['pubDate', '2030-01-01T00:00:00Z', '2026-09-28T00:00:00Z'],
    ['specimen', '99', '7'],
    ['tags', '[opinion]', '[news]'],
    ['name', 'Wiz Cat', 'Quill'],
  ]) {
    const text = split(field, astroValue, siteValue);
    let site;
    try {
      site = readFrontmatter(text).data;
    } catch (error) {
      assert.ok(error instanceof FrontmatterError, `${field}: ${error}`);
      continue;
    }
    assert.fail(`${field}: read as ${JSON.stringify(site[field])} by the site and ${JSON.stringify(astroRead(text)[field])} by Astro`);
  }
});

test('review B1: the author-file payloads are refused by the site reader too', () => {
  for (const text of [
    '---\n<<: {kind: human}\nname: Quill\nbio: hi\n+++: filler\nkind: ai\n---\nbody\n',
    '---\n<<: {kind: human}\nname: Quill\nbio: hi\n---x: filler\nkind: ai\n---\nbody\n',
    '---\nname: Quill\n<<: {kind: human}\nbio: I write.\n+++: x\nkind: ai\n---\nIntro\n',
  ]) {
    assert.throws(() => readFrontmatter(text), FrontmatterError, text);
  }
});

test('review B1: every form the two readers could read differently is refused, naming what to remove', () => {
  for (const [label, text, message] of [
    ['a TOML fence', '+++\ntitle = "T"\n+++\nbody\n', /Astro reads a frontmatter block here that the site's scripts do not/],
    ['text after the opening fence', '---title: T\nauthor: x\n---\n', /Astro reads a frontmatter block here/],
    ['a +++ line inside', '---\ntitle: T\n+++: x\n---\n', /line 3 starts with --- or \+\+\+/],
    ['a ---x line inside', '---\ntitle: T\n---x: y\nauthor: a\n---\n', /line 3 starts with --- or \+\+\+/],
    ['a merge key', '---\n<<: {author: desk-bot}\ntitle: T\n---\n', /a YAML merge key \(<<\)/],
    ['a nested merge key', '---\nsources:\n  - <<: {url: u}\n    title: t\n---\n', /a YAML merge key/],
    ['an anchor', '---\ntitle: &t T\n---\n', /uses an anchor/],
    ['an alias', '---\ntitle: &t T\nsummary: *t\n---\n', /uses an anchor and an alias/],
    ['a tag', '---\ndraft: !!bool false\n---\n', /uses a tag/],
    ['a tagged list item', '---\ntags:\n  - !!str news\n---\n', /uses a tag/],
    ['an anchored mapping', '---\nsources: &s\n  - url: u\n---\n', /uses an anchor/],
    ['a flow anchor', '---\ntags: [&a news, *a]\n---\n', /anchor and an alias/],
    ['a duplicated key', '---\nauthor: a\nauthor: b\n---\n', /duplicated mapping key/],
  ]) {
    assert.throws(() => readFrontmatter(text), (error) => error instanceof FrontmatterError && message.test(error.message), label);
  }
});

test('review B1: ordinary YAML the site uses still reads, and reads as Astro reads it', () => {
  for (const text of [
    '---\ntitle: "R&D is fun!"\nsummary: Hello! & welcome * to it\ntags: [news, "*star*"]\n---\nBody.\n',
    '---\ntitle: T # a comment\npubDate: 2026-09-25T09:15:12Z\ndraft: false\nsources:\n  - title: "a"\n    url: https://a.example\n---\n\n---\n\nA body with a rule above.\n',
    '---\n---\nEmpty frontmatter.\n',
  ]) {
    assert.deepEqual(readFrontmatter(text).data, astroRead(text), text);
  }
});

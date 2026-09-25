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

test('CRLF and a byte-order mark are read, and the raw block is located exactly', () => {
  const crlf = '---\r\ntitle: A\r\npubDate: 2026-09-25\r\n---\r\n\r\nBody\r\n';
  const fm = readFrontmatter(crlf);
  assert.equal(fm.data.title, 'A');
  assert.equal(crlf.slice(fm.start, fm.end), fm.raw);
  const bom = `${BOM}---\ntitle: B\n---\nBody\n`;
  const withBom = readFrontmatter(bom);
  assert.equal(withBom.data.title, 'B');
  assert.equal(bom.slice(withBom.start, withBom.end), 'title: B');
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

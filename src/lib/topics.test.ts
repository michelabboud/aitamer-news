import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  TOPIC_MIN_STORIES,
  TOPIC_SUMMARY_MAX,
  buildTopics,
  parseTopicDetails,
  topicDescription,
  topicKey,
} from './topics.ts';

const post = (id: string, ...tags: string[]) => ({ id, tags });
const many = (tag: string, n: number, prefix = tag) => Array.from({ length: n }, (_, i) => post(`${prefix}-${i}`, tag));

test('the floor is five distinct stories', () => {
  assert.equal(TOPIC_MIN_STORIES, 5);
  assert.equal(buildTopics(many('openai', 4)).length, 0);
  assert.equal(buildTopics(many('openai', 5)).length, 1);
});

test('a tag repeated inside one story counts that story once', () => {
  const posts = [post('a', 'openai', 'OpenAI', ' openai '), ...many('openai', 3, 'b')];
  assert.equal(buildTopics(posts).length, 0);
  assert.equal(buildTopics([...posts, post('e', 'openai')])[0]?.postIds.length, 5);
});

test('tags that differ only in case, spacing or accents are one topic, labelled by the commonest form', () => {
  const posts = [post('1', 'OpenAI'), post('2', 'openai'), post('3', 'openai'), post('4', ' OpenAI '), post('5', 'Openai'), post('6', 'openai')];
  const [topic] = buildTopics(posts);
  assert.equal(topic.postIds.length, 6);
  assert.equal(topic.slug, 'openai');
  assert.equal(topic.label, 'openai');
  assert.equal(topicKey('  Café   Society '), 'cafe society');
});

test('the label tie-breaks alphabetically, so the build is deterministic', () => {
  const posts = [post('1', 'B Tag'), post('2', 'b tag'), post('3', 'B Tag'), post('4', 'b tag'), post('5', 'b tag'), post('6', 'B Tag')];
  assert.equal(buildTopics(posts)[0].label, 'B Tag');
});

test('a tag already written as a slug owns that address; any other tag carries a hash of itself', () => {
  assert.equal(buildTopics(many('grok-4-7', 5))[0].slug, 'grok-4-7');
  const [odd] = buildTopics(many('Grok 4.7 / xAI!', 5));
  assert.match(odd.slug, /^grok-4-7-xai-[0-9a-f]{8}$/);
  assert.match(odd.slug, /^[a-z0-9]+(?:-[a-z0-9]+)*$/);
});

test('an address never moves: a new tag, a different floor or another story order leaves every slug alone', () => {
  const cpp = many('c++', 5, 'a');
  const c = many('c', 5, 'b');
  const slugOf = (posts: ReturnType<typeof many>, key: string) => buildTopics(posts).find((t) => t.key === key)?.slug;
  const before = slugOf(cpp, 'c++');
  assert.match(before ?? '', /^c-[0-9a-f]{8}$/);
  // "c" appears, in either order, and "c++" keeps its address while "c" gets the plain one.
  assert.equal(slugOf([...cpp, ...c], 'c++'), before);
  assert.equal(slugOf([...c, ...cpp], 'c++'), before);
  assert.equal(slugOf([...cpp, ...c], 'c'), 'c');
  // Withdrawing all of "c" (it drops out of the input) changes nothing for "c++".
  assert.equal(slugOf(cpp, 'c++'), before);
  // A story-count floor of 1 lists "c" at the same address as the floor of 5.
  assert.equal(buildTopics([...cpp, ...c], 1).find((t) => t.key === 'c')?.slug, 'c');
});

test('every slug in a library is unique, even for hostile tags', () => {
  const posts = [
    ...many('c', 5, 'a'),
    ...many('c++', 5, 'b'),
    ...many('C#', 5, 'c'),
    ...many('c.', 5, 'd'),
    ...many('c-cedb1bac', 5, 'e'),
    ...many('???', 5, 'f'),
    ...many('!!!', 5, 'g'),
  ];
  const slugs = buildTopics(posts).map((t) => t.slug);
  assert.equal(slugs.length, 7);
  assert.equal(new Set(slugs).size, 7);
  for (const slug of slugs) assert.match(slug, /^[a-z0-9]+(?:-[a-z0-9]+)*$/);
});

test('a tag with no letters or digits still gets a safe, unique slug', () => {
  const [t] = buildTopics(many('???', 5));
  assert.match(t.slug, /^topic-[0-9a-f]{8}$/);
});

test('topics are ordered by story count, then label; stories keep the caller order', () => {
  const posts = [...many('beta', 6), ...many('alpha', 6), ...many('big', 9)];
  assert.deepEqual(buildTopics(posts).map((t) => t.label), ['big', 'alpha', 'beta']);
  assert.deepEqual(buildTopics(posts)[0].postIds.slice(0, 2), ['big-0', 'big-1']);
});

test('the description is factual and falls back when there is no summary', () => {
  assert.equal(topicDescription('openai', 7, undefined), '7 stories tagged openai on AI Tamer, newest first.');
  assert.equal(topicDescription('openai', 1, undefined), '1 story tagged openai on AI Tamer, newest first.');
  assert.equal(topicDescription('openai', 7, 'A lab.'), 'A lab.');
});

test('details: an empty file is fine, and a good entry keeps its fields', () => {
  assert.deepEqual(parseTopicDetails({}), new Map());
  const details = parseTopicDetails({
    openai: { summary: 'An AI lab.', sameAs: ['https://en.wikipedia.org/wiki/OpenAI', 'https://www.wikidata.org/wiki/Q21708200'] },
  });
  assert.equal(details.get('openai')?.summary, 'An AI lab.');
  assert.equal(details.get('openai')?.sameAs.length, 2);
});

test('details refuse anything that is not plain, bounded text and a Wikipedia or Wikidata https page', () => {
  const bad = (entry: unknown) => assert.throws(() => parseTopicDetails({ openai: entry }), /openai/);
  bad({ summary: 'x'.repeat(TOPIC_SUMMARY_MAX + 1) });
  bad({ summary: '' });
  bad({ summary: 'bell\u0007 char' });
  bad({ sameAs: ['http://en.wikipedia.org/wiki/OpenAI'] });
  bad({ sameAs: ['https://example.com/openai'] });
  bad({ sameAs: ['https://en.wikipedia.org.evil.com/wiki/OpenAI'] });
  bad({ sameAs: ['https://user@en.wikipedia.org/wiki/OpenAI'] });
  bad({ sameAs: ['javascript:alert(1)'] });
  bad({ unknownField: 1 });
  bad('a string');
  assert.throws(() => parseTopicDetails([]), /object/);
  assert.throws(() => parseTopicDetails({ 'Not A Slug': {} }), /Not A Slug/);
});

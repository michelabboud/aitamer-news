import test from 'node:test';
import assert from 'node:assert/strict';
import { editorialDigest, planAdmission, stripSpecimen } from './specimen-admission-data.mjs';
import { readFrontmatter } from './frontmatter.mjs';
const article = ({ number = '', date = '2026-10-05T12:00:00Z', draft = false } = {}) => `---\ntitle: A useful story\npubDate: "${date}"\n${number}section: models\ndraft: ${draft}\nsources:\n  - https://example.com/primary\n---\n\n## Evidence\nBody bytes, specimen: 999 stays here.\n`;
const baseline = () => ({ basePosts: new Map([['old', article({ number: 'specimen: 7\n' })]]), ledgerText: '# Historical ledger\n0007 old\n0009 gone\n0009 gone void: withdrawn\n' });
const run = (candidatePosts, trusted = baseline()) => planAdmission({ ...trusted, candidatePosts: new Map(candidatePosts) });

test('allocates solely from historical maximum, retaining exact ledger prefix and editorial bytes', () => {
  const text = article({ number: 'specimen: 999999999999999999999999999\n' });
  const result = run([['new', text]]);
  assert.equal(readFrontmatter(result.posts.get('new')).data.specimen, 10);
  assert.equal(result.ledgerText, baseline().ledgerText + '0010 new\n');
  assert.equal(stripSpecimen(result.posts.get('new')).text, stripSpecimen(text).text);
});

test('batch assignment orders by pubDate then slug, independently of Map order', () => {
  const result = run([['z', article()], ['a', article()], ['early', article({ date: '2026-10-04T12:00:00Z' })]]);
  assert.equal(result.ledgerText.slice(baseline().ledgerText.length), '0010 early\n0011 a\n0012 z\n');
});

for (const number of ['specimen: -10\n', 'specimen: "not a number"\n', 'specimen:\n', 'specimen: 20\nspecimen: "fake"\n', '']) {
  test(`restores published number despite submitted ${JSON.stringify(number)}`, () => {
    const text = article({ number });
    const result = run([['old', text]]);
    assert.equal(readFrontmatter(result.posts.get('old')).data.specimen, 7);
    assert.equal(result.ledgerText, baseline().ledgerText);
    assert.equal(result.editorialDigest, editorialDigest(new Map([['old', text]])));
  });
}

test('concurrent branches recompute against newest main without collision', () => {
  const first = run([['one', article({ number: 'specimen: 393\n' })]]);
  const base = new Map([...baseline().basePosts, ...first.posts]);
  const second = run([['two', article({ number: 'specimen: 393\n' })]], { basePosts: base, ledgerText: first.ledgerText });
  assert.equal(readFrontmatter(second.posts.get('two')).data.specimen, 11);
  assert.equal(second.ledgerText, first.ledgerText + '0011 two\n');
});

test('retry after merge restores same number and never appends another issuance', () => {
  const first = run([['new', article()]]);
  const retry = run([['new', article()]], { basePosts: new Map([...baseline().basePosts, ...first.posts]), ledgerText: first.ledgerText });
  assert.equal(retry.posts.get('new'), first.posts.get('new'));
  assert.equal(retry.ledgerText, first.ledgerText);
});

test('new drafts remove fake numbers without issuance', () => {
  const result = run([['draft', article({ draft: true, number: 'specimen: 123\n' })]]);
  assert.equal(Object.hasOwn(readFrontmatter(result.posts.get('draft')).data, 'specimen'), false);
  assert.equal(result.ledgerText, baseline().ledgerText);
});

test('published draft transition gets its first permanent number', () => {
  const trusted = baseline();
  trusted.basePosts.set('draft', article({ draft: true }));
  const result = run([['draft', article()]], trusted);
  assert.equal(readFrontmatter(result.posts.get('draft')).data.specimen, 10);
});

test('missing final ledger newline is appended without replacing a trusted byte', () => {
  const trusted = baseline();
  trusted.ledgerText = trusted.ledgerText.trimEnd();
  assert.equal(run([['new', article()]], trusted).ledgerText, trusted.ledgerText + '\n0010 new\n');
});

for (const number of ['specimen: |\n  author: spoof\n', 'specimen: [1, 2]\n', 'specimen: &a 8\n', 'specimen: "unterminated\n', 'specimen: x\n  continuation\n', '"specimen": 7\n']) {
  test(`rejects ambiguous ownership boundary ${JSON.stringify(number)}`, () => assert.throws(() => run([['new', article({ number })]])));
}

test('strict parser rejects editorial duplicates even when specimen duplicates can be repaired', () => {
  assert.throws(() => run([['new', article({ number: 'specimen: 1\nspecimen: 2\ntitle: Forged\n' })]]), /valid YAML/);
});

test('does not treat body or block scalar mentions as top-level specimen keys', () => {
  const text = article().replace('title: A useful story', 'title: |\n  specimen: editorial text');
  assert.equal(stripSpecimen(text).text, text);
  assert.match(run([['new', text]]).posts.get('new'), /  specimen: editorial text/);
});

for (const ledgerText of ['bogus\n', '0007 old\n0007 other\n', '0000 zero\n', '999999999999999999999 huge\n', '0007 old void: no issuance\n']) {
  test(`rejects malformed trusted ledger ${JSON.stringify(ledgerText)}`, () => assert.throws(() => run([['new', article()]], { ...baseline(), ledgerText })));
}

test('rejects historical slug reuse even after the old issuance was voided', () => assert.throws(() => run([['gone', article()]]), /historical slug/));
test('rejects unnumbered published trusted baseline', () => assert.throws(() => run([], { ...baseline(), basePosts: new Map([['old', article()]]) }), /trusted baseline/));
test('rejects exhausted safe-integer allocation range', () => assert.throws(() => run([['new', article()]], { basePosts: new Map(), ledgerText: `${Number.MAX_SAFE_INTEGER} past\n` }), /range exhausted/));
test('bounds untrusted bytes, batch size and paths', () => {
  assert.throws(() => run([['new', 'x'.repeat(1024 * 1024 + 1)]]), /input limit/);
  assert.throws(() => run([['../escape', article()]]), /unsafe post slug/);
  assert.throws(() => run(Array.from({ length: 101 }, (_, i) => [`post-${i}`, article()])), /bounded Map/);
});

test('approval digest ignores numbering, but binds all editorial bytes and slug identity', () => {
  const plain = article();
  const digest = editorialDigest(new Map([['new', plain], ['other', plain]]));
  assert.equal(digest, editorialDigest(new Map([['other', article({ number: 'specimen: 90\n' })], ['new', article({ number: 'specimen: 1\nspecimen: 2\n' })]])));
  assert.notEqual(digest, editorialDigest(new Map([['new', plain.replace('Body bytes', 'Changed bytes')], ['other', plain]])));
  assert.notEqual(digest, editorialDigest(new Map([['renamed', plain], ['other', plain]])));
});

 test('never removes specimen-looking text inside a multiline quoted editorial scalar', () => {
  const text = article().replace('title: A useful story', 'title: "hello\nspecimen: 8\nworld"');
  assert.throws(() => run([['new', text]]), /editorial scalar/);
 });

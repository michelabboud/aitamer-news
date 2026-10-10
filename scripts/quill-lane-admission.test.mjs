import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { approvalStillValid, discoverApprovedRequests, independentLane, laneActors, quillAdmissionProblems } from './specimen-admission.mjs';
import { readFrontmatter } from './frontmatter.mjs';

const REPO = 'owner/site';
const GROK = 337850229;
const QUILL = 555000111;
const OWNER = 42;
const DATE = '2026-10-12T11:00:00Z';
const article = ({ author = 'quill', specimen = '', body = 'Original editorial bytes' } = {}) =>
  `---\ntitle: A useful story\npubDate: "${DATE}"\n${specimen}section: models\nauthor: ${author}\ndraft: false\nsources:\n  - https://example.com/primary\n---\n\n${body}\n`;
const prOf = (over = {}) => ({
  number: 7, state: 'open', draft: false, created_at: '2026-10-11T12:00:00Z',
  user: { id: QUILL, type: 'Bot' }, head: { sha: 'a'.repeat(40), ref: 'quill/article', repo: { full_name: REPO } },
  base: { ref: 'main', repo: { full_name: REPO } }, ...over,
});

test('the Quill lane is inert while its identity is not pinned, and the pin is the only thing that opens it', () => {
  assert.equal(laneActors.quill, null, 'production ships with the Quill lane unpinned');
  const actors = { grok: GROK, quill: null };
  assert.equal(independentLane(prOf(), REPO, actors), null);
  for (const quill of [0, -1, 1.5, '555000111', undefined, NaN]) assert.equal(independentLane(prOf(), REPO, { grok: GROK, quill }), null, String(quill));
  assert.equal(independentLane(prOf(), REPO, { grok: GROK, quill: QUILL }), 'quill');
});

test('each lane answers only to its own identity and branch prefix, in this repository, as a bot, not a draft, into main', () => {
  const actors = { grok: GROK, quill: QUILL };
  assert.equal(independentLane(prOf({ user: { id: GROK, type: 'Bot' }, head: { sha: 'b'.repeat(40), ref: 'grok/x', repo: { full_name: REPO } } }), REPO, actors), 'grok');
  for (const over of [
    { user: { id: GROK, type: 'Bot' } },                                   // Grok on a quill/ branch
    { user: { id: QUILL, type: 'Bot' }, head: { sha: 'b'.repeat(40), ref: 'grok/x', repo: { full_name: REPO } } }, // Quill on a grok/ branch
    { user: { id: QUILL, type: 'User' } }, { user: { id: 999, type: 'Bot' } }, { draft: true },
    { head: { sha: 'b'.repeat(40), ref: 'quill/', repo: { full_name: REPO } } },
    { head: { sha: 'b'.repeat(40), ref: 'quill/../x', repo: { full_name: REPO } } },
    { head: { sha: 'b'.repeat(40), ref: 'quill/x', repo: { full_name: 'fork/site' } } },
    { base: { ref: 'feature', repo: { full_name: REPO } } }, { base: { ref: 'main', repo: { full_name: 'fork/site' } } },
  ]) assert.equal(independentLane(prOf(over), REPO, actors), null, JSON.stringify(over));
});

test('quillAdmissionProblems: the byline rule over article texts, with a reader that must agree', () => {
  const read = readFrontmatter;
  const mine = article();
  assert.deepEqual(quillAdmissionProblems({ candidatePosts: new Map([['new', mine]]), existingPosts: new Map() }, read), []);
  assert.deepEqual(quillAdmissionProblems({ candidatePosts: new Map([['old', mine]]), existingPosts: new Map([['old', { ancestor: mine, main: mine }]]) }, read), []);
  const human = article({ author: 'michel' });
  for (const [candidate, existing] of [
    [human, undefined],                                           // a new human byline
    [mine, { ancestor: human, main: human }],                     // claiming a human's article
    [mine, { ancestor: mine, main: human }],                      // main gave it away since the branch was cut
    [human, { ancestor: mine, main: mine }],                      // handing its own article away
    ['no frontmatter at all\n', undefined],
    [article({ author: '[quill, michel]' }), undefined],
  ]) {
    const existingPosts = new Map(existing ? [['story', existing]] : []);
    assert.equal(quillAdmissionProblems({ candidatePosts: new Map([['story', candidate]]), existingPosts }, read).length > 0, true, JSON.stringify([candidate.slice(0, 60), existing && Object.keys(existing)]));
  }
  assert.equal(quillAdmissionProblems({ candidatePosts: new Map([['story', mine]]) }, () => { throw new Error('reader down'); }).length, 1);
});

// A real Git repository behind a minimal GitHub transport: discovery reads the trees, never the network.
function repository(t, { baseAuthor = 'quill', sourceAuthor = 'quill', modify = false } = {}) {
  const cwd = mkdtempSync(join(tmpdir(), 'quill-lane-admission-'));
  const git = (...args) => execFileSync('git', args, { cwd, encoding: 'utf8' }).trim();
  git('init', '-q', '-b', 'main'); git('config', 'user.name', 'Fixture'); git('config', 'user.email', 'fixture@example.invalid');
  mkdirSync(join(cwd, 'src/content/posts'), { recursive: true });
  writeFileSync(join(cwd, 'src/content/specimen-ledger.txt'), '# Retained history\n0007 old\n');
  writeFileSync(join(cwd, 'src/content/posts/old.md'), article({ author: baseAuthor, specimen: 'specimen: 7\n' }));
  git('add', '.'); git('commit', '-qm', 'baseline');
  const base = git('rev-parse', 'HEAD');
  git('switch', '-q', '-c', 'quill/article');
  if (modify) writeFileSync(join(cwd, 'src/content/posts/old.md'), article({ author: sourceAuthor, specimen: 'specimen: 7\n', body: 'A sourced correction' }));
  else writeFileSync(join(cwd, 'src/content/posts/new.md'), article({ author: sourceAuthor, body: 'A newly researched article' }));
  git('add', '.'); git('commit', '-qm', 'source');
  const source = git('rev-parse', 'HEAD');
  git('switch', '-q', 'main');
  const oldcwd = process.cwd(); process.chdir(cwd); t.after(() => process.chdir(oldcwd));
  const dispatched = [];
  const pr = prOf({ head: { sha: source, ref: 'quill/article', repo: { full_name: REPO } } });
  const api = {
    repo: REPO,
    async list(path) { return path.startsWith('/pulls?state=open') ? [pr] : []; },
    async request(path, method = 'GET', body) {
      if (path === '/git/ref/heads/main') return { object: { sha: base } };
      if (path === '/pulls/7') return pr;
      if (method === 'POST' && path.endsWith('/dispatches')) { dispatched.push(body); return null; }
      throw new Error(`unexpected request ${method} ${path}`);
    },
  };
  return { api, dispatched, base, source, env: { MAINTAINER_ID: String(OWNER) } };
}
const dependencies = { fetchCommits: () => {} };
const withQuillPinned = (t) => { laneActors.quill = QUILL; t.after(() => { laneActors.quill = null; }); };

test('a pinned Quill PR whose articles are all by quill is dispatched for numbering, with no editorial review', async (t) => {
  withQuillPinned(t);
  const f = repository(t);
  assert.equal(await discoverApprovedRequests(f.api, f.env, dependencies), 'dispatched');
  assert.deepEqual(f.dispatched, [{ ref: 'main', inputs: { pr_number: '7', head_sha: f.source, review_id: '0', same_pr: 'true', recovery_run: '0' } }]);
});

test('an unpinned Quill identity gets nothing: the same PR is not dispatched and, with no owner review, stays idle', async (t) => {
  const f = repository(t);
  f.api.list = async (path) => (path.startsWith('/pulls?state=open') ? [prOf({ head: { sha: f.source, ref: 'quill/article', repo: { full_name: REPO } } })] : path.includes('/reviews') ? [] : []);
  assert.equal(await discoverApprovedRequests(f.api, f.env, dependencies), 'idle');
  assert.deepEqual(f.dispatched, []);
});

test('a pinned Quill PR with a non-quill byline is held, never dispatched, and does not abort discovery', async (t) => {
  withQuillPinned(t);
  const f = repository(t, { sourceAuthor: 'michel' });
  const result = await discoverApprovedRequests(f.api, f.env, dependencies);
  assert.equal(result, 'idle');
  assert.deepEqual(f.dispatched, []);
});

test('a pinned Quill PR that edits a human\'s article is held, whatever byline it writes', async (t) => {
  withQuillPinned(t);
  for (const sourceAuthor of ['quill', 'michel']) {
    const f = repository(t, { baseAuthor: 'michel', sourceAuthor, modify: true });
    assert.equal(await discoverApprovedRequests(f.api, f.env, dependencies), 'idle', sourceAuthor);
    assert.deepEqual(f.dispatched, [], sourceAuthor);
  }
});

test('a pinned Quill PR that corrects its own earlier article is dispatched', async (t) => {
  withQuillPinned(t);
  const f = repository(t, { modify: true });
  assert.equal(await discoverApprovedRequests(f.api, f.env, dependencies), 'dispatched');
});

test('certification re-checks the byline: an already-requested Quill head with a non-quill article is refused at the validity gate', async (t) => {
  withQuillPinned(t);
  for (const [options, expected] of [[{}, null], [{ sourceAuthor: 'michel' }, /Quill lane byline/], [{ baseAuthor: 'michel', modify: true }, /Quill lane byline/]]) {
    const f = repository(t, options);
    const request = { pr: 7, source: f.source, independent: true, samePR: true, review: 0, approvedBase: f.base };
    const check = approvalStillValid(f.api, request, OWNER, { current: f.base, digest: 'unused', fetchCommits: () => {} });
    if (expected === null) assert.equal((await check).number, 7);
    else await assert.rejects(check, expected);
  }
});

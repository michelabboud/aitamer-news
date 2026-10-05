import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { execFileSync } from 'node:child_process';
import { inspectSpecimenChanges, verifyAdmissionProof, ADMISSION_WORKFLOW } from './specimen-integrity.mjs';

const A = 'a'.repeat(40), B = 'b'.repeat(40), DIGEST = 'c'.repeat(64);
function fixture() {
  const cwd = mkdtempSync(join(tmpdir(), 'specimen-policy-'));
  const git = (...args) => execFileSync('git', args, { cwd, encoding: 'utf8' }).trim();
  git('init', '-q'); git('config', 'user.email', 'fixture@example.invalid'); git('config', 'user.name', 'Fixture');
  mkdirSync(join(cwd, 'src/content/posts'), { recursive: true });
  const write = (path, text) => writeFileSync(join(cwd, path), text);
  const commit = () => { git('add', '.'); git('commit', '-qm', 'fixture'); return git('rev-parse', 'HEAD'); };
  write('src/content/specimen-ledger.txt', '0001 old\n');
  write('src/content/posts/old.md', '---\nspecimen: 1\ndraft: false\n---\nBody\n');
  const base = commit();
  return { cwd, git, write, commit, base };
}

test('unrelated files and ordinary editorial edits need no allocation', async () => {
  const f = fixture(); f.write('notes.md', 'Docs');
  f.write('src/content/posts/old.md', '---\nspecimen: 1\ndraft: false\n---\nUpdated body\n');
  const result = await inspectSpecimenChanges({ ...f, head: f.commit() });
  assert.equal(result.requiresAdmission, false); assert.deepEqual(result.problems, []);
});
test('new published posts require workflow regardless of supplied number', async () => {
  for (const specimen of ['', 'specimen: 99\n']) {
    const f = fixture(); f.write('src/content/posts/new.md', `---\n${specimen}draft: false\n---\nNews\n`);
    assert.equal((await inspectSpecimenChanges({ ...f, head: f.commit() })).requiresAdmission, true);
  }
});
test('existing number removal, mutation and ledger forgery require admission', async () => {
  for (const extra of ['', 'specimen: -9\n', 'specimen: "1"\n']) {
    const f = fixture(); f.write('src/content/posts/old.md', `---\n${extra}draft: false\n---\nBody\n`);
    assert.equal((await inspectSpecimenChanges({ ...f, head: f.commit() })).requiresAdmission, true);
  }
  const f = fixture(); f.write('src/content/specimen-ledger.txt', '9999 fake\n');
  assert.equal((await inspectSpecimenChanges({ ...f, head: f.commit() })).ledgerChanged, true);
});
test('duplicate YAML, executable files and renamed articles cannot quietly pass', async () => {
  const f = fixture(); f.write('src/content/posts/old.md', '---\nspecimen: 1\nspecimen: 2\n---\nBody\n');
  assert.equal((await inspectSpecimenChanges({ ...f, head: f.commit() })).requiresAdmission, true);
  const executable = fixture(); executable.git('update-index', '--chmod=+x', 'src/content/posts/old.md');
  executable.git('commit', '-qm', 'mode');
  assert.match((await inspectSpecimenChanges({ ...executable, head: executable.git('rev-parse', 'HEAD') })).problems.join(), /plain/);
  const renamed = fixture(); renamed.git('mv', 'src/content/posts/old.md', 'src/content/posts/renamed.md');
  assert.match((await inspectSpecimenChanges({ ...renamed, head: renamed.commit() })).problems.join(), /deletion/);
});
function receipt() {
  return {
    expectedHead: B, expectedBase: A, repository: 'owner/repo', allocatorActorId: 42,
    proof: { repository: 'owner/repo', base: A, head: B, runId: 100, editorialDigest: DIGEST },
    run: { id: 100, repository: { full_name: 'owner/repo' }, path: ADMISSION_WORKFLOW, event: 'workflow_dispatch', head_branch: 'main', head_sha: A, actor: { id: 42 }, status: 'completed', conclusion: 'success' },
    check: { name: 'specimen-integrity', app: { id: 15368 }, head_sha: B, status: 'completed', conclusion: 'success', external_id: `owner/repo:${A}:${B}:${DIGEST}:100` },
  };
}
test('trusted exact-head and exact-base receipt passes', () => assert.equal(verifyAdmissionProof(receipt()).valid, true));
test('forged, stale, wrong-actor and non-main checks fail closed', () => {
  const mutations = [
    r => r.proof.head = A, r => r.proof.base = B, r => r.proof.runId++,
    r => r.run.actor.id++, r => r.run.head_branch = 'grok/news', r => r.run.event = 'pull_request_target',
    r => r.run.path = '.github/workflows/fake.yml', r => r.run.head_sha = B,
    r => r.run.repository.full_name = 'attacker/repo', r => r.run.conclusion = 'failure',
    r => r.check.app.id = 1, r => r.check.head_sha = A, r => r.check.external_id = 'fake',
    r => r.check.conclusion = 'failure', r => r.allocatorActorId = undefined,
  ];
  for (const mutate of mutations) { const r = receipt(); mutate(r); assert.equal(verifyAdmissionProof(r).valid, false); }
  assert.equal(verifyAdmissionProof({}).valid, false);
});

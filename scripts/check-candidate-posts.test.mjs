import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { execFileSync } from 'node:child_process';
import { requireCommittedArticles } from './check-candidate-posts.mjs';
test('candidate gate rejects untracked, staged and modified article bytes, accepts committed bytes and unrelated work', () => {
 const cwd=mkdtempSync(join(tmpdir(),'candidate-committed-'));
 const git=(...args)=>execFileSync('git',args,{cwd,stdio:'pipe'});
 try {
  git('init'); git('config','user.name','Fixture');git('config','user.email','fixture@example.invalid');
  mkdirSync(join(cwd,'src/content/posts'),{recursive:true});
  writeFileSync(join(cwd,'src/content/posts/test.md'),'body');
  assert.throws(()=>requireCommittedArticles(cwd),/must be committed/);
  git('add','.');assert.throws(()=>requireCommittedArticles(cwd),/must be committed/);
  git('commit','-m','fixture');assert.doesNotThrow(()=>requireCommittedArticles(cwd));
  writeFileSync(join(cwd,'README.md'),'unrelated');assert.doesNotThrow(()=>requireCommittedArticles(cwd));
  writeFileSync(join(cwd,'src/content/posts/test.md'),'changed');assert.throws(()=>requireCommittedArticles(cwd),/must be committed/);
  git('add','src/content/posts/test.md');git('commit','-m','update');
  writeFileSync(join(cwd,'src/content/specimen-ledger.txt'),'bad ledger');assert.throws(()=>requireCommittedArticles(cwd),/must be committed/);
 } finally {rmSync(cwd,{recursive:true,force:true});}
});

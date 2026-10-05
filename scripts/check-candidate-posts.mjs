/** Candidate article checks, without allocating or writing specimen numbers. */
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { inspectSpecimenChanges } from './specimen-integrity.mjs';
import { stripSpecimen } from './specimen-admission-data.mjs';
import { readPost } from './stamp-specimens.mjs';
import { readFrontmatter } from './frontmatter.mjs';
import { readFileSync } from 'node:fs';
export function requireCommittedArticles(cwd = process.cwd()) {
  const dirty = execFileSync('git', ['status', '--porcelain=v1', '--untracked-files=all', '--', 'src/content/posts', 'src/content/specimen-ledger.txt'], { cwd, encoding: 'utf8' });
  if (dirty.trim()) throw new Error('candidate article and ledger bytes must be committed before checking; do not push until checks pass');
}
export async function main(args) {
  const position = args.indexOf('--base');
  if (position < 0 || !args[position + 1]) throw new Error('candidate check requires --base <trusted-main-sha>');
  const base = args[position + 1];
  if (!/^[a-f0-9]{40}$/.test(base)) throw new Error('candidate base must be a full SHA');
  requireCommittedArticles();
  const head = execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim();
  const inspection = await inspectSpecimenChanges({cwd:process.cwd(),base,head});
  const unsafe = inspection.problems.filter(problem => /only plain non-executable|invalid article path|article deletion/.test(problem));
  if (unsafe.length) throw new Error(unsafe.join('; '));
  for(const path of inspection.changedPosts) {
    const clean=stripSpecimen(readFileSync(path,'utf8')).text;
    const post=readPost(path.slice('src/content/posts/'.length,-3),clean);
    if(post.errors.length) throw new Error(post.errors.join('; '));
    const before=execFileSync('git',['ls-tree',base,'--',path],{encoding:'utf8'}).trim();
    if(before) {
      const original=readFrontmatter(execFileSync('git',['show',`${base}:${path}`],{encoding:'utf8'}));
      if(original?.data.specimen!==undefined) console.log(`${path}: existing permanent identity belongs to the workflow.`);
    }
  }
  // No numbering writes, and no relaxation of main's strict specimen check.
  for(const command of ['stamp-post-times.mjs','stamp-specimens.mjs']) if(command==='stamp-post-times.mjs') execFileSync('node',[`scripts/${command}`,'--check'],{stdio:'inherit'});
  for(const command of ['check-comments.mjs','check-reactions.mjs','check-authors.mjs','check-diagrams.mjs','check-rendered-body.mjs','check-reader-text.mjs']) execFileSync('node',[`scripts/${command}`],{stdio:'inherit'});
  console.log(`candidate: ${inspection.changedPosts.length} article(s) checked; numbering/ledger require workflow admission. No number was assigned.`);
}
if(process.argv[1]===fileURLToPath(import.meta.url)) main(process.argv.slice(2)).catch(error=>{console.error(`candidate: ${error.message}`);process.exitCode=1;});

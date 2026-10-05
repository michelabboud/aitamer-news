/** Read-only specimen admission policy. All Git reads use immutable commit objects. */
import { execFileSync } from 'node:child_process';
import { isDeepStrictEqual } from 'node:util';
import { SLUG, SLUG_MAX_LENGTH } from './slug.mjs';

export const SPECIMEN_LEDGER = 'src/content/specimen-ledger.txt';
export const ADMISSION_WORKFLOW = '.github/workflows/specimen-admission.yml';
export const ACTIONS_APP_ID = 15368;
const SHA = /^[a-f0-9]{40}$/;
const POST_PREFIX = 'src/content/posts/';

function git(cwd, ...args) {
  return execFileSync('git', args, { cwd, encoding: 'utf8', maxBuffer: 16 * 1024 * 1024 });
}
function object(cwd, sha, path) {
  const line = git(cwd, 'ls-tree', '-z', sha, '--', path).split('\0')[0];
  if (!line) return null;
  const match = /^(\d+) (\w+) ([a-f0-9]{40})\t/.exec(line);
  if (!match) throw new Error(`invalid Git tree entry for ${path}`);
  return { mode: match[1], type: match[2], oid: match[3] };
}

/** Unsafe or ambiguous input is reported as blocking, never silently admitted. */
export async function inspectSpecimenChanges({ cwd, base, head }) {
  if (!SHA.test(base ?? '') || !SHA.test(head ?? '')) throw new Error('base and head must be full commit SHAs');
  const changed = git(cwd, 'diff', '--name-only', '--no-renames', '-z', base, head).split('\0').filter(Boolean);
  const result = { requiresAdmission: false, changedPosts: [], ledgerChanged: changed.includes(SPECIMEN_LEDGER), problems: [] };
  result.requiresAdmission = result.ledgerChanged;
  const { readFrontmatter } = await import('./frontmatter.mjs');
  for (const path of changed) {
    if (path !== SPECIMEN_LEDGER && !path.startsWith(POST_PREFIX)) continue;
    const before = object(cwd, base, path);
    const after = object(cwd, head, path);
    if ([before, after].some(entry => entry && (entry.mode !== '100644' || entry.type !== 'blob'))) {
      result.problems.push(`${path}: only plain non-executable files are permitted`);
      result.requiresAdmission = true;
      continue;
    }
    if (path === SPECIMEN_LEDGER) continue;
    const slug = path.slice(POST_PREFIX.length, -3);
    if (!path.endsWith('.md') || !SLUG.test(slug) || slug.length > SLUG_MAX_LENGTH) {
      result.problems.push(`${path}: invalid article path`);
      result.requiresAdmission = true;
      continue;
    }
    result.changedPosts.push(path);
    if (!after) {
      result.problems.push(`${path}: article deletion requires operator review`);
      result.requiresAdmission = true;
      continue;
    }
    try {
      const read = entry => {
        if (!entry) return null;
        const parsed = readFrontmatter(git(cwd, 'cat-file', 'blob', entry.oid));
        if (!parsed) throw new Error('missing frontmatter');
        return parsed.data;
      };
      const oldData = read(before);
      const newData = read(after);
      if ((!oldData && newData.draft !== true) || (oldData?.draft === true && newData.draft !== true)) result.requiresAdmission = true;
      if (!isDeepStrictEqual(oldData?.specimen, newData.specimen)) result.requiresAdmission = true;
    } catch (error) {
      result.problems.push(`${path}: ${error.message}`);
      result.requiresAdmission = true;
    }
  }
  return result;
}

/** Proofs are claims until matched against independent GitHub API run/check data.
 * allocatorActorId is the authorized trusted dispatch actor, not the push App.
 */
export function verifyAdmissionProof({ proof, expectedHead, expectedBase, repository, allocatorActorId, run, check }) {
  const problems = [];
  const require = (condition, message) => { if (!condition) problems.push(message); };
  require(SHA.test(expectedHead ?? '') && SHA.test(expectedBase ?? ''), 'invalid expected commit binding');
  require(typeof repository === 'string' && /^[^/:\s]+\/[^/:\s]+$/.test(repository), 'invalid repository');
  require(Number.isSafeInteger(allocatorActorId) && allocatorActorId > 0, 'invalid allocator actor');
  require(proof?.repository === repository && proof?.base === expectedBase && proof?.head === expectedHead, 'proof commit/repository binding mismatch');
  require(/^[a-f0-9]{64}$/.test(proof?.editorialDigest ?? ''), 'invalid editorial digest');
  require(Number.isSafeInteger(proof?.runId) && proof.runId > 0 && proof.runId === run?.id, 'proof run binding mismatch');
  require(run?.repository?.full_name === repository, 'run repository mismatch');
  require([ADMISSION_WORKFLOW, `${ADMISSION_WORKFLOW}@main`].includes(run?.path) && run?.event === 'workflow_dispatch' && run?.head_branch === 'main', 'run is not trusted main admission');
  require(run?.head_sha === expectedBase, 'run trusted source SHA mismatch');
  require(run?.actor?.id === allocatorActorId, 'run actor mismatch');
  require(run?.status === 'completed' && run?.conclusion === 'success', 'admission run did not succeed');
  require(check?.name === 'specimen-integrity' && check?.app?.id === ACTIONS_APP_ID, 'check identity mismatch');
  require(check?.head_sha === expectedHead && check?.status === 'completed' && check?.conclusion === 'success', 'check is not successful for this head');
  require(check?.external_id === `${repository}:${expectedBase}:${expectedHead}:${proof?.editorialDigest}:${proof?.runId}`, 'check receipt binding mismatch');
  return { valid: problems.length === 0, problems };
}

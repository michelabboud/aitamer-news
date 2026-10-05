/** Trusted-main admission orchestration. Never executes code from a submitted tree. */
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { appendFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { editorialDigest, planAdmission } from './specimen-admission-data.mjs';
import { inspectSpecimenChanges, verifyAdmissionProof, SPECIMEN_LEDGER } from './specimen-integrity.mjs';
import { parseNameStatus, parseHeadModes, isGrokBranch } from './check-publisher-paths.mjs';
const SHA = /^[a-f0-9]{40}$/;
const DIGEST = /^[a-f0-9]{64}$/;
const POST = /^src\/content\/posts\/([a-z0-9]+(?:-[a-z0-9]+)*)\.md$/;
const ACTIONS_ACTOR = 41898282;
const ALLOCATOR_ACTOR = 334982782;
const ALLOCATOR_APP = 5107739;
// grok-bots-app (App 5189850): the same numeric identity as the publisher's
// GROK_ACTOR_ID. Trusted main pins automatic admission authority, never a login.
const GROK_ACTOR = 337850229;
const STATE_BRANCH = 'specimens/state';
const STATE_PATH = 'specimen-state.json';
const STATE_SCHEMA = 1;
// Owner verified this server snapshot with administration access. The timestamp
// detects policy drift; it is not a cryptographic revision. Keep the pin in trusted
// main code because repository variables can be changed by other collaborators.
const STATE_RULESET_SNAPSHOT = Object.freeze({ id:24488522, updatedAt:'2026-10-05T10:59:20.822+03:00' });
const STATE_CHECK = 'specimen-control-state';
const FINALIZER_PATH = '.github/workflows/specimen-finalize.yml';
const MAX_STATE_BYTES = 1024 * 1024;
const MAX_PENDING_RUNS = 10000;
const PAGE_SIZE = 100;
const MAX_BLOB_BYTES = 1024 * 1024;
const MAX_RECOVERY_ATTEMPTS = 3;
const MAX_RECOVERY_DEPTH = 8;
const MAX_NUMBERING_DESCENDANTS = 32;
const RETRY_COOLDOWN_MS = 5 * 60 * 1000;
const REQUEST_NAME = /^Specimen request pr=(\d+) head=([a-f0-9]{40}) recovery=(\d+)$/;
const SINGLE_REQUEST_NAME = /^Specimen same-pr pr=(\d+) head=([a-f0-9]{40}) review=(\d+) recovery=(\d+)(?: wake=(\d+))?$/;
const REVIEW_PATH = '.github/workflows/specimen-editorial-review.yml';
const REVIEW_RECEIPT = /^Specimen review pr=(\d+) review=(\d+) action=(submitted|edited|dismissed) state=(approved|commented|changes_requested|dismissed) source=([a-f0-9]{40})$/i;
const RETRY_MARKER = 'specimen-reconciliation:';
const ADMISSION_LABEL = 'workflow-numbering';
const ADMISSION_PATH = '.github/workflows/specimen-admission.yml';
const DEPLOY_PATH = '.github/workflows/deploy-pages.yml';
const SERVER_TIMESTAMP = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?(?:Z|[+-]\d{2}:\d{2})$/;
function workflowPath(run, expected) {
  return [expected, `${expected}@main`, `${expected}@refs/heads/main`].includes(run?.path);
}
function trustedRun(run, repo, owner) {
  return workflowPath(run, ADMISSION_PATH) && run.event === 'workflow_dispatch' && run.head_branch === 'main' && run.repository?.full_name === repo && (!run.head_repository || run.head_repository.full_name === repo) && [owner, ACTIONS_ACTOR].includes(run.actor?.id);
}
function independentGrokPR(pr,repo) {
  return pr?.user?.id===GROK_ACTOR && pr.user.type==='Bot' && !pr.draft && isGrokBranch(pr.head?.ref) && pr.head?.repo?.full_name===repo && pr.base?.ref==='main' && pr.base?.repo?.full_name===repo;
}
export function requestOf(run) {
  const single = SINGLE_REQUEST_NAME.exec(run.display_title ?? '');
  const match = single ?? REQUEST_NAME.exec(run.display_title ?? '');
  if (!match) throw new Error('run lacks durable admission request');
  const recovery = Number(match[single ? 4 : 3]);
  if (!Number.isSafeInteger(recovery) || recovery < 0) throw new Error('invalid recovery run ID');
  const review=single ? Number(match[3]) : undefined;
  if (single && (!Number.isSafeInteger(review) || review<0)) throw new Error('invalid owner review ID');
  const wake=single && match[5]!==undefined ? Number(match[5]) : undefined;
  if (wake!==undefined && (!Number.isSafeInteger(wake) || wake<0)) throw new Error('invalid editorial wake ID');
  return { pr: integer(match[1]), source: sha(match[2]), recovery, ...(single ? { review, samePR:true, ...(wake!==undefined ? {wake} : {}) } : {}) };
}
async function approvedReview(api, request, owner) {
  const reviews=await api.list(`/pulls/${request.pr}/reviews`);
  const decisive=reviews.filter(review=>review.user?.id===owner && ['APPROVED','CHANGES_REQUESTED','DISMISSED'].includes(review.state)).sort((a,b)=>a.id-b.id).at(-1);
  // GitHub can move commit_id when an approved PR is updated. The durable main
  // request and owner event receipt bind the source; this live review only revokes.
  if (!decisive || decisive.id!==request.review || decisive.state!=='APPROVED') throw new Error('owner editorial approval withdrawn or changed');
  return decisive;
}
function ownerReviewWake(run, repo, owner, number) {
  // GitHub drops pull_requests after merge. The immutable event title retains
  // its PR locator; reviewReceipt separately binds review, source and code bytes.
  const receipt=REVIEW_RECEIPT.exec(run?.display_title ?? '');
  const matchesPR=run?.pull_requests?.length ? run.pull_requests.some(pr=>pr.number===number) : receipt && Number(receipt[1])===number;
  return run?.event==='pull_request_review' && run.actor?.id===owner && run.repository?.full_name===repo && run.head_repository?.full_name===repo && run.status==='completed' && run.conclusion==='success' && run.path?.split('@')[0]===REVIEW_PATH && matchesPR && SHA.test(run.head_sha ?? '');
}
/** Event-time receipt is an immutable source locator. A mutable REST review
 * commit_id, a COMMENTED wake or a PR label can never provide initial approval. */
export async function reviewReceipt(api, id, request, owner, {fetchCommits=fetchObjects,collect=collectAdmission}={}) {
  const run=await api.request(`/actions/runs/${integer(id)}`), match=REVIEW_RECEIPT.exec(run.display_title ?? '');
  if (run.id!==Number(id) || !ownerReviewWake(run,api.repo,owner,request.pr) || !match || Number(match[1])!==request.pr || Number(match[2])!==request.review || match[3].toLowerCase()!=='submitted' || match[4].toLowerCase()!=='approved' || match[5]!==request.source || run.head_sha!==request.source) throw new Error('invalid immutable owner approval receipt');
  const base=sha(request.approvedBase ?? (await api.request('/git/ref/heads/main')).object.sha);
  fetchCommits(base,request.source);
  const ancestor=git('merge-base',base,request.source).trim();
  mainHistory(ancestor,base);
  const modes=parseHeadModes(git('ls-tree','-r','-z',request.source));
  if (modes.get(REVIEW_PATH)!=='100644' || blob(request.source,REVIEW_PATH)!==blob(ancestor,REVIEW_PATH) || !blob(ancestor,REVIEW_PATH).includes('run-name: "Specimen review pr=${{ github.event.pull_request.number }} review=${{ github.event.review.id }} action=${{ github.event.action }} state=${{ github.event.review.state }} source=${{ github.event.review.commit_id }}"')) throw new Error('approval receipt workflow differs from trusted main');
  collect(base,request.source);
  return run;
}
async function earliestReviewRoot(api, request, owner, review) {
  let earliest;
  // This is a creation-time discovery boundary, never approval authority. No
  // filtered search or arbitrary history cap can drop an outstanding old root.
  const since=review.submitted_at ? serverTimestamp(review.submitted_at,'owner review submission') : null;
  for await (const run of stream(api,'/actions/workflows/specimen-admission.yml/runs','workflow_runs')) {
    if (since!==null && run.created_at && serverTimestamp(run.created_at,'admission creation')<since) break;
    if (!trustedRun(run,api.repo,owner)) continue;
    let candidate; try { candidate=requestOf(run); } catch { continue; }
    if (!candidate.samePR || candidate.pr!==request.pr || candidate.review!==request.review || candidate.recovery!==0) continue;
    if (!earliest || run.id<earliest.id) earliest=run;
  }
  return earliest;
}
export async function approvedRequest(api, run, owner) {
  integer(owner);
  const seen = new Set();
  const latest = requestOf(run);
  const independent=latest.samePR && independentGrokPR(await api.request(`/pulls/${latest.pr}`),api.repo);
  const bases = [];
  while (true) {
    if (!trustedRun(run, api.repo, owner) || seen.has(run.id) || seen.size >= MAX_RECOVERY_DEPTH) throw new Error('invalid recovery ancestry');
    seen.add(integer(run.id));
    bases.push(sha(run.head_sha));
    const request = requestOf(run);
    if (request.pr !== latest.pr || request.source !== latest.source || request.review !== latest.review || request.wake!==latest.wake) throw new Error('recovery changed approved request');
    if (request.samePR && request.recovery===0) {
      if (request.review===0) { if (run.actor.id!==owner && (!independent || request.wake)) throw new Error('owner dispatch or authorized Grok identity required without review'); }
      else {
        const review=independent ? {} : await approvedReview(api,request,owner);
        const earliest=await earliestReviewRoot(api,request,owner,review);
        if (!earliest) throw new Error('owner approval has no immutable root');
        const original=requestOf(earliest);
        if (original.source!==request.source || original.wake!==request.wake) throw new Error('owner approval source rebound; original request retained');
        // Old trusted-main roots remain readable. A new format requires the
        // event receipt; wake=0 cannot turn an Actions dispatch into approval.
        if (request.wake!==undefined && request.wake===0 && run.actor.id!==owner) throw new Error('immutable owner approval receipt required');
        if (earliest.id!==run.id) { run=earliest; bases.push(sha(run.head_sha)); }
      }
      return { ...request, ...(independent ? {independent:true} : {}), rootRun:run.id, approvedBase:sha(run.head_sha), bases };
    }
    if (run.actor.id === owner) {
      if (request.recovery !== 0) throw new Error('owner request unexpectedly claims recovery');
      return { ...request, rootRun: run.id, approvedBase: sha(run.head_sha), bases };
    }
    if (request.recovery < 1) throw new Error('recovery has no owner request');
    const predecessor = await api.request(`/actions/runs/${request.recovery}`);
    if (predecessor.id !== request.recovery || predecessor.status !== 'completed') throw new Error('recovery predecessor did not complete');
    run = predecessor;
  }
}
function assertSourceApproval(pr, repo) {
  if (pr?.state!=='open' || pr.draft || pr.head?.repo?.full_name!==repo || pr.base?.ref!=='main' || (pr.base.repo && pr.base.repo.full_name!==repo)) throw new Error('source approval withdrawn or moved');
}
async function approvalStillValid(api, request, owner, { current, digest, collect = collectAdmission, fetchCommits = fetchObjects } = {}) {
  const pr = await api.request(`/pulls/${request.pr}`);
  assertSourceApproval(pr,api.repo);
  if (request.independent && !independentGrokPR(pr,api.repo)) throw new Error('independent source identity changed');
  const head = sha(pr.head.sha);
  if (head !== request.source) {
    if (!current || !digest) throw new Error('source editorial head changed');
    fetchCommits(head);
    if (request.samePR) {
      try { git('merge-base','--is-ancestor',request.source,head); }
      catch(error) { if (error.status!==1) throw error;throw new Error('source editorial content changed outside approved ancestry'); }
    }
    const currentDigest=request.samePR ? approvedHeadDigest(current,head,request.source,collect) : collect(current,head).editorialDigest;
    if (currentDigest!==digest) throw new Error('source editorial content changed after approval');
    if (request.samePR) await verifyNumberingDescendants(api,request,head,current,owner,{collect,fetchCommits});
  }
  if (independentGrokPR(pr,api.repo)) return pr;
  const reviews = await api.list(`/pulls/${request.pr}/reviews`);
  const review = reviews.filter(r=>r.user?.id===owner && ['APPROVED','CHANGES_REQUESTED','DISMISSED'].includes(r.state)).sort((a,b)=>a.id-b.id).at(-1);
  if (review && review.state !== 'APPROVED') throw new Error('owner review revoked');
  if (request.samePR && request.review>0) await approvedReview(api,request,owner);
  return pr;
}
async function verifyNumberingDescendants(api,request,head,current,owner,{collect,fetchCommits}) {
  // Approval survives only independently authenticated deterministic workflow
  // transforms, including provisional writes whose later validation failed.
  for (let depth=0; head!==request.source; depth++) {
    if (depth>=MAX_NUMBERING_DESCENDANTS) throw new Error('numbered approval lineage exceeds bound');
    fetchCommits(head);
    const commit=await api.request(`/git/commits/${head}`);
    const match=/^Workflow admission same PR #(\d+) source ([a-f0-9]{40}) run (\d+)$/.exec(commit.message ?? '');
    if (commit.sha!==head || commit.parents?.length!==2 || !match || Number(match[1])!==request.pr) throw new Error('source editorial content changed outside trusted numbering');
    const run=await api.request(`/actions/runs/${integer(match[3])}`), actual=requestOf(run);
    const base=sha(commit.parents[0].sha), previous=sha(commit.parents[1].sha);
    if (!trustedRun(run,api.repo,owner) || run.id!==Number(match[3]) || run.head_sha!==base || !actual.samePR || actual.pr!==request.pr || actual.review!==request.review || actual.source!==match[2]) throw new Error('source editorial content changed outside trusted numbering');
    fetchCommits(base,previous,actual.source,current);
    mainHistory(base,current);
    git('merge-base','--is-ancestor',request.source,actual.source);
    const digest=collect(base,request.source).editorialDigest;
    if (collect(base,actual.source).editorialDigest!==digest) throw new Error('source editorial content changed after approval');
    materialize({GITHUB_ACTIONS:'true',GITHUB_EVENT_NAME:'workflow_dispatch',GITHUB_REF:'refs/heads/main',SAME_PR:'true',BASE_SHA:base,HEAD_SHA:head,SOURCE_SHA:actual.source,OBSERVED_HEAD:previous,EDITORIAL_DIGEST:digest},{collect,fetchCommits,write:()=>{}});
    head=previous;
  }
}
function mainHistory(base, current) {
  // A run title cannot make code from a fork or an unrelated commit trusted.
  git('merge-base', '--is-ancestor', sha(base), sha(current));
  const mode = parseHeadModes(git('ls-tree', '-r', '-z', base)).get(ADMISSION_PATH);
  if (mode !== '100644') throw new Error('approved run has no trusted workflow code');
}
async function approvalPlan(api, run, owner, { collect = collectAdmission, fetchCommits = fetchObjects, verifyBase = mainHistory } = {}) {
  const request = await approvedRequest(api, run, owner);
  // Withdrawn or merged source requests enter a durable hold before Git reads.
  // A repaired head remains eligible; the later digest/review check still binds it.
  assertSourceApproval(await api.request(`/pulls/${request.pr}`),api.repo);
  const current = sha((await api.request('/git/ref/heads/main')).object.sha);
  fetchCommits(...new Set([...request.bases, current, request.source]));
  for (const base of request.bases) verifyBase(base, current);
  if (!request.independent && request.samePR && request.review>0 && request.wake===undefined && blob(request.approvedBase,ADMISSION_PATH).includes('wake_run:')) throw new Error('immutable owner approval receipt required for new roots');
  if (!request.independent && request.wake) await reviewReceipt(api,request.wake,request,owner,{collect,fetchCommits});
  const digest = collect(request.approvedBase, request.source).editorialDigest;
  if (!DIGEST.test(digest)) throw new Error('invalid original approval digest');
  if (collect(current, request.source).editorialDigest !== digest) throw new Error('recovery changed editorial content');
  await approvalStillValid(api, request, owner, { current, digest, collect, fetchCommits });
  return { request, current, digest };
}
async function retryReceipts(api, pr) {
  return (await api.list(`/issues/${integer(pr)}/comments`)).filter(c=>c.user?.id===ALLOCATOR_ACTOR && String(c.body).startsWith(RETRY_MARKER)).map(c=>{
    try { return JSON.parse(c.body.slice(RETRY_MARKER.length)); } catch { return null; }
  }).filter(Boolean);
}
async function recordAttempt(api, pr, receipt, now) {
  await api.request(`/issues/${integer(pr)}/comments`, 'POST', { body: RETRY_MARKER + JSON.stringify({ ...receipt, time: new Date(now).toISOString() }) });
}
export async function recoverRequest(api, run, env, { now = Date.now(), ...dependencies } = {}) {
  const owner = integer(env.MAINTAINER_ID);
  const { request, digest } = await approvalPlan(api, run, owner, dependencies);
  for await (const other of stream(api, '/actions/workflows/specimen-admission.yml/runs', 'workflow_runs')) {
    if (other.id === run.id || !trustedRun(other, api.repo, owner)) continue;
    let r; try { r = requestOf(other); } catch { continue; }
    if (r.pr === request.pr && r.source === request.source && other.status !== 'completed') return 'pending';
  }
  const attempts = (await retryReceipts(api, request.pr)).filter(r=>r.kind==='admission' && r.rootRun===request.rootRun);
  if (attempts.length >= MAX_RECOVERY_ATTEMPTS) throw new Error('admission retry limit reached; owner intervention required');
  if (attempts.some(r=>Number.isFinite(Date.parse(r.time)) && now-Date.parse(r.time)<RETRY_COOLDOWN_MS)) return 'cooldown';
  // The serialized reconciler records intent before dispatch. A lost response or crash
  // cannot erase the request or permit unlimited retries. Keep original source immutable.
  await recordAttempt(api, request.pr, { kind:'admission', rootRun:request.rootRun, previousRun:run.id, source:request.source, digest }, now);
  await api.request('/actions/workflows/specimen-admission.yml/dispatches', 'POST', { ref:'main', inputs:{pr_number:String(request.pr),head_sha:request.source,recovery_run:String(run.id),same_pr:request.samePR ? 'true' : 'false',...(request.samePR ? {review_id:String(request.review),...(request.wake!==undefined ? {wake_run:String(request.wake)} : {})} : {})} });
  return 'dispatched';
}
async function containsMerge(api, merge, head) {
  sha(head);
  if (merge === head) return true;
  const comparison = await api.request(`/compare/${merge}...${head}`);
  return comparison.merge_base_commit?.sha === merge && ['ahead','identical'].includes(comparison.status);
}
function trustedDeployment(run, repo) {
  return workflowPath(run, DEPLOY_PATH) && run.head_branch==='main' && ['push','workflow_dispatch'].includes(run.event) && run.repository?.full_name===repo && (!run.head_repository || run.head_repository.full_name===repo);
}
function serverTimestamp(value, label) {
  const time=typeof value==='string' ? Date.parse(value) : NaN;
  if (!Number.isFinite(time) || !SERVER_TIMESTAMP.test(value) || /[\r\n]/.test(value)) throw new Error(`invalid ${label} server timestamp`);
  return time;
}
export async function reconcileDeployment(api, pr, { now = Date.now(), completion } = {}) {
  const merge = sha(pr.merge_commit_sha);
  const earliest=serverTimestamp(pr.created_at,'generated PR creation');
  const current = sha((await api.request('/git/ref/heads/main')).object.sha);
  if (!await containsMerge(api, merge, current)) throw new Error('admission merge is no longer in main history');
  const receipts = await retryReceipts(api, pr.number);
  // GitHub returns runs newest first. A run created before this generated PR
  // cannot have deployed its future merge. Use that server timestamp, not a Git
  // author/committer date. Keep the stream unfiltered to avoid the 1,000-search cap.
  let pending = false;
  for await (const run of stream(api, '/actions/workflows/deploy-pages.yml/runs', 'workflow_runs')) {
    if (!trustedDeployment(run, api.repo)) continue;
    if (serverTimestamp(run.created_at,'deployment creation')<earliest) break;
    if (run.status==='completed' && run.conclusion!=='success') continue;
    if (!await containsMerge(api, merge, run.head_sha)) continue;
    if (run.status==='completed') {
      if (completion && !receipts.some(r=>r.kind==='completed' && r.merge===merge && r.admissionRun===completion.admissionRun && r.deploymentRun===run.id)) {
        await recordAttempt(api, pr.number, { ...completion, kind:'completed', merge, deploymentRun:integer(run.id), deploymentHead:sha(run.head_sha) }, now);
      }
      return 'deployed';
    }
    pending = true;
  }
  if (pending) return 'pending';
  const attempts = receipts.filter(r=>r.kind==='deploy' && r.merge===merge);
  if (attempts.length >= MAX_RECOVERY_ATTEMPTS) throw new Error('deployment retry limit reached; owner intervention required');
  if (attempts.some(r=>Number.isFinite(Date.parse(r.time)) && now-Date.parse(r.time)<RETRY_COOLDOWN_MS)) return 'cooldown';
  await recordAttempt(api, pr.number, { kind:'deploy', merge, requestedHead:current }, now);
  await api.request('/actions/workflows/deploy-pages.yml/dispatches','POST',{ref:'main',inputs:{wait:'false'}});
  return 'dispatched';
}
/** A completion comment is a locator, never authority. Independently prove its
 * admitted head, actual server merge and successful deployed descendant again. */
export async function terminalCompletion(api, pr, run, request, owner) {
  if (!pr?.merged_at && !pr?.merged) return false;
  if (pr.head.repo?.full_name!==api.repo || pr.base.ref!=='main' || (request.samePR ? pr.number!==request.pr : pr.user?.id!==ALLOCATOR_ACTOR || pr.head.ref!==`specimens/run-${run.id}`)) return false;
  const merge = sha(pr.merge_commit_sha), head=sha(pr.head.sha), base=sha(run.head_sha);
  const receipts = (await retryReceipts(api, pr.number)).filter(r=>r.kind==='completed' && r.merge===merge && r.admissionRun===run.id && r.head===head && r.base===base && r.rootRun===request.rootRun && r.source===request.source && DIGEST.test(r.digest));
  if (!receipts.length) return false;
  const proof = await admissionProof(api,base,head,owner,run.id);
  const generated = await api.request(`/git/commits/${head}`);
  const merged = await api.request(`/git/commits/${merge}`);
  if (generated.sha!==head || merged.sha!==merge || generated.parents?.length!==2 || generated.parents[0].sha!==base || merged.parents.map(p=>p.sha).join(',')!==[base,head].join(',') || merged.tree.sha!==generated.tree.sha) return false;
  if (request.samePR) {
    if (generated.message!==`Workflow admission same PR #${request.pr} source ${request.source} run ${run.id}` || !await containsMerge(api,request.source,generated.parents[1].sha)) return false;
  } else if (generated.parents[1].sha!==request.source) return false;
  for (const receipt of receipts) {
    if (receipt.digest!==proof.editorialDigest || !SHA.test(receipt.deploymentHead ?? '') || !Number.isSafeInteger(receipt.deploymentRun) || receipt.deploymentRun<1) continue;
    const deployment = await api.request(`/actions/runs/${receipt.deploymentRun}`);
    if (deployment.id===receipt.deploymentRun && deployment.head_sha===receipt.deploymentHead && trustedDeployment(deployment,api.repo) && deployment.status==='completed' && deployment.conclusion==='success' && await containsMerge(api,merge,deployment.head_sha)) return true;
  }
  return false;
}
async function* stream(api, path, key) {
  if (api.iterate) yield* api.iterate(path,key);
  else yield* await api.list(path,key); // Small in-memory API fixtures use the same interface.
}
export const git = (...args) => execFileSync('git', args, { encoding: 'utf8', maxBuffer: 16 * 1024 * 1024 });
const sha = value => { if (!SHA.test(value ?? '')) throw new Error('invalid commit SHA'); return value; };
const integer = value => { const n = Number(value); if (!Number.isSafeInteger(n) || n < 1) throw new Error('invalid positive ID'); return n; };
export function repository(value) { if (!/^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/.test(value ?? '')) throw new Error('invalid repository'); return value; }
export class GitHub {
  constructor(repo, token, fetcher = fetch, writerToken) { this.repo = repository(repo); this.token = token; this.writerToken = writerToken; this.fetcher = fetcher; }
  async request(path, method = 'GET', body) {
    if (!path.startsWith('/')) throw new Error('invalid API path');
    const privileged = method!=='GET' && !path.startsWith('/actions/') && !path.startsWith('/check-runs');
    const token = privileged ? this.writerToken : this.token;
    if (privileged && !token) throw new Error('publishing App token required for repository writes');
    const response = await this.fetcher(`https://api.github.com/repos/${this.repo}${path}`, { method, redirect: 'error', signal: AbortSignal.timeout(30000), headers: { Accept: 'application/vnd.github+json', 'X-GitHub-Api-Version': '2022-11-28', ...(token ? { Authorization: `Bearer ${token}` } : {}) }, ...(body === undefined ? {} : { body: JSON.stringify(body) }) });
    if (!response.ok) { const error = new Error(`GitHub ${method} ${path.split('?')[0]} failed (${response.status})`); error.status = response.status; throw error; }
    return response.status === 204 ? null : response.json();
  }
  async *iterate(path, key) {
    let previousPage;
    for (let page = 1; ; page++) {
      const data = await this.request(`${path}${path.includes('?') ? '&' : '?'}per_page=${PAGE_SIZE}&page=${page}`);
      const items = key ? data[key] : data;
      if (!Array.isArray(items) || items.length>PAGE_SIZE) throw new Error('invalid API page');
      const identity = items.map(item=>item.id).join(',');
      if (items.length && identity===previousPage) throw new Error('API repeated a page; history discovery incomplete');
      previousPage=identity;
      yield* items;
      if (items.length<PAGE_SIZE) return;
    }
  }
  async list(path, key) {
    const all = [];
    for await (const item of this.iterate(path,key)) all.push(item);
    return all;
  }
}
function blob(commit, path) {
  const ref = `${sha(commit)}:${path}`;
  const size = Number(git('cat-file', '-s', ref));
  if (!Number.isSafeInteger(size) || size > MAX_BLOB_BYTES) throw new Error('Git blob exceeds bound');
  const raw = execFileSync('git', ['show', ref], { maxBuffer: MAX_BLOB_BYTES });
  const text = raw.toString('utf8'); if (!raw.equals(Buffer.from(text))) throw new Error('invalid UTF-8 blob'); return text;
}
export function collectAdmission(base, source, {allowEmpty=false}={}) {
  sha(base); sha(source);
  const ancestor = git('merge-base', base, source).trim(); sha(ancestor);
  const modes = parseHeadModes(git('ls-tree', '-r', '-z', source));
  const changes = parseNameStatus(git('diff', '--name-status', '--no-renames', '-z', ancestor, source));
  const basePosts = new Map();
  for (const path of parseHeadModes(git('ls-tree', '-r', '-z', base)).keys()) {
    const match = /^src\/content\/posts\/([^/]+)\.mdx?$/.exec(path);
    if (match) basePosts.set(match[1], blob(base, path));
  }
  const candidatePosts = new Map();
  for (const change of changes) {
    if (change.path === SPECIMEN_LEDGER) continue; // Never read an untrusted ledger.
    const match = POST.exec(change.path);
    if (!match || !['A', 'M'].includes(change.status) || modes.get(change.path) !== '100644') throw new Error(`outside admission lane: ${change.path}`);
    const current = basePosts.get(match[1]);
    if (ancestor !== base && current !== undefined) {
      let old; try { old = blob(ancestor, change.path); } catch { throw new Error('post was independently added on main'); }
      if (old !== current) throw new Error('existing article changed on main; refresh source before admission');
    }
    candidatePosts.set(match[1], blob(source, change.path));
  }
  if (!candidatePosts.size && !allowEmpty) throw new Error('admission needs an article');
  const plan = planAdmission({ basePosts, candidatePosts, ledgerText: blob(base, SPECIMEN_LEDGER) });
  return { ...plan, candidatePosts, changes };
}
function approvedHeadDigest(base,head,source,collect=collectAdmission) {
  const approved=collect(base,source), observed=collect(base,head,{allowEmpty:true});
  // Restoring a number may make an approved existing article byte-identical to
  // main and remove it from the diff. Bind the original approved slug set, while
  // rejecting any additional editorial changes on the observed branch.
  if ([...observed.candidatePosts.keys()].some(slug=>!approved.candidatePosts.has(slug))) throw new Error('source editorial content changed after approval');
  const modes=parseHeadModes(git('ls-tree','-r','-z',head));
  if ([...approved.candidatePosts.keys()].some(slug=>modes.get(`src/content/posts/${slug}.md`)!=='100644')) throw new Error('source editorial content changed after approval');
  return editorialDigest(new Map([...approved.candidatePosts.keys()].map(slug=>[slug,blob(head,`src/content/posts/${slug}.md`)])));
}
function fetchObjects(...commits) { for (const commit of commits) git('fetch', '--no-tags', 'origin', sha(commit)); }
function output(name, value) { if (!/^[a-z_]+$/.test(name) || /[\r\n]/.test(String(value))) throw new Error('unsafe output'); if (process.env.GITHUB_OUTPUT) appendFileSync(process.env.GITHUB_OUTPUT, `${name}=${value}\n`); }
export function receiptOf(check) {
  const parts = String(check?.external_id ?? '').split(':');
  if (parts.length !== 5) return null;
  return { repository: parts[0], base: parts[1], head: parts[2], editorialDigest: parts[3], runId: Number(parts[4]) };
}
// GitHub Actions may replace supplied details_url with the check's canonical URL.
function checkDetailsMatch(check, repo, runID) {
 return check.details_url===`https://github.com/${repo}/actions/runs/${runID}` || (Number.isSafeInteger(check.id) && check.id>0 && check.details_url===`https://github.com/${repo}/runs/${check.id}`);
}
export async function admissionProof(api, base, head, actorId, expectedRun) {
  const checks = await api.list(`/commits/${sha(head)}/check-runs`, 'check_runs');
  for (const check of checks.filter(c => c.name === 'specimen-integrity').reverse()) {
    const proof = receiptOf(check); if (!proof || (expectedRun && proof.runId !== expectedRun)) continue;
    const run = await api.request(`/actions/runs/${integer(proof.runId)}`);
    if (!checkDetailsMatch(check,api.repo,run.id)) continue;
    const result = verifyAdmissionProof({ proof, expectedHead: head, expectedBase: base, repository: api.repo, allocatorActorId: [actorId, ACTIONS_ACTOR].includes(run.actor?.id) ? run.actor.id : actorId, run, check });
    if (result.valid) return proof;
  }
  throw new Error('no successful trusted-main allocation proof for this exact base/head');
}
async function confirmNumberedHead(api, number, branch, previous, expected, pause) {
  // PR metadata can lag a successful ref write. Wait only for the exact known
  // predecessor while the branch itself still names our deterministic commit.
  const path=`/git/ref/heads/${encodeURIComponent(branch)}`;
  for (let attempt=0; attempt<6; attempt++) {
    if ((await api.request(path)).object.sha!==expected) throw new Error('source branch changed after numbering write');
    const current=await api.request(`/pulls/${number}`);
    if (current.state!=='open' || current.draft || current.head?.repo?.full_name!==api.repo || current.head.ref!==branch || current.base?.ref!=='main') throw new Error('PR/head/repository no longer matches approval');
    if ((await api.request(path)).object.sha!==expected) throw new Error('source branch changed after numbering write');
    if (current.head.sha===expected) return;
    if (current.head.sha!==previous) throw new Error('source head changed after numbering write');
    if (attempt<5) await pause((attempt+1)*1000);
  }
  throw new Error('numbered source head not visible after bounded readback');
}
export async function prepare(api, env, {collect=collectAdmission,fetchCommits=fetchObjects,verifyBase=mainHistory,pause=ms=>new Promise(resolve=>setTimeout(resolve,ms))}={}) {
  const number = integer(env.PR_NUMBER); const source = sha(env.SOURCE_SHA); const base = sha(env.GITHUB_SHA);
  if (env.GITHUB_REF !== 'refs/heads/main' || env.GITHUB_EVENT_NAME !== 'workflow_dispatch' || ![integer(env.MAINTAINER_ID), ACTIONS_ACTOR].includes(integer(env.GITHUB_ACTOR_ID))) throw new Error('admission is trusted dispatch on main only');
  if ((await api.request('/git/ref/heads/main')).object.sha !== base) throw new Error('main advanced; redispatch against current main');
  const pr = await api.request(`/pulls/${number}`);
  if (pr.state !== 'open' || pr.head.repo?.full_name !== api.repo || pr.base.ref !== 'main' || pr.draft) throw new Error('PR/head/repository no longer matches approval');
  const activeRun = await api.request(`/actions/runs/${integer(env.GITHUB_RUN_ID)}`);
  if (!trustedRun(activeRun, api.repo, integer(env.MAINTAINER_ID)) || activeRun.id !== integer(env.GITHUB_RUN_ID) || activeRun.head_sha !== base || activeRun.actor.id !== integer(env.GITHUB_ACTOR_ID)) throw new Error('prepare run identity mismatch');
  const activeRequest = requestOf(activeRun);
  if (activeRequest.pr !== number || activeRequest.source !== source || activeRequest.recovery !== Number(env.RECOVERY_RUN || 0) || Boolean(activeRequest.samePR)!==(env.SAME_PR==='true') || (activeRequest.samePR && (activeRequest.review!==Number(env.REVIEW_ID) || (activeRequest.wake!==undefined && activeRequest.wake!==Number(env.REVIEW_WAKE_RUN || 0))))) throw new Error('prepare inputs differ from durable request');
  const { digest } = await approvalPlan(api, activeRun, integer(env.MAINTAINER_ID),{collect,fetchCommits,verifyBase});
  const plan = collect(base, source);
  if (plan.editorialDigest !== digest) throw new Error('recovery would change approved content');
  if (activeRequest.samePR && (!pr.head.ref || /^(?:main$|specimens\/)/.test(pr.head.ref))) throw new Error('source branch is reserved');
  const observedHead=sha(pr.head.sha);
  fetchCommits(observedHead);
  if (activeRequest.samePR && approvedHeadDigest(base,observedHead,source,collect)!==digest) throw new Error('source editorial content changed after approval');
  const baseCommit = await api.request(`/git/commits/${base}`);
  const tree = await api.request('/git/trees', 'POST', { base_tree: baseCommit.tree.sha, tree: [...plan.posts].map(([slug, content]) => ({ path: `src/content/posts/${slug}.md`, mode: '100644', type: 'blob', content })).concat([{ path: SPECIMEN_LEDGER, mode: '100644', type: 'blob', content: plan.ledgerText }]) });
  if (activeRequest.samePR) {
    // Messages locate repeated work; matching deterministic tree and ancestry,
    // isolated validation and independent Actions proof supply its authority.
    const message=`Workflow admission same PR #${number} source ${source} run ${integer(env.GITHUB_RUN_ID)}`;
    const existing=await api.request(`/git/commits/${observedHead}`);
    let generatedHead=observedHead, parent=observedHead;
    const reusable=existing.message===message && existing.tree?.sha===tree.sha && existing.parents?.length===2 && existing.parents[0].sha===base;
    if (reusable) parent=sha(existing.parents[1].sha);
    else {
      const commit=await api.request('/git/commits','POST',{message,tree:sha(tree.sha),parents:[base,observedHead]});
      generatedHead=sha(commit.sha);
      await approvalStillValid(api,await approvedRequest(api,activeRun,integer(env.MAINTAINER_ID)),integer(env.MAINTAINER_ID),{current:base,digest,collect,fetchCommits});
      if ((await api.request(`/pulls/${number}`)).head.sha!==observedHead || (await api.request('/git/ref/heads/main')).object.sha!==base) throw new Error('source head or main changed before numbering write');
      // The label isolates automatic observation names only; it grants no lane,
      // allocation or merge permission. Add it before the synchronization event.
      await api.request(`/issues/${number}/labels`,'POST',{labels:[ADMISSION_LABEL]});
      await api.request(`/git/refs/heads/${encodeURIComponent(pr.head.ref)}`,'PATCH',{sha:generatedHead,force:false});
      await confirmNumberedHead(api,number,pr.head.ref,observedHead,generatedHead,pause);
    }
    output('head',generatedHead);output('base',base);output('pr',number);output('source_pr',number);output('source_sha',source);output('observed_head',parent);output('editorial_digest',digest);
    console.log(`Admission prepared on original PR #${number}; ${plan.repairs.length} numbering corrections recorded.`);
    return;
  }
  const commit = await api.request('/git/commits', 'POST', { message: `Workflow admission of PR #${number}\n\nNumbering and ledger updated by trusted workflow run ${env.GITHUB_RUN_ID}.`, tree: tree.sha, parents: [base, source] });
  const branch = `specimens/run-${integer(env.GITHUB_RUN_ID)}`;
  let generatedHead = commit.sha;
  try { await api.request('/git/refs', 'POST', { ref: `refs/heads/${branch}`, sha: generatedHead }); } catch(error) {
    if (error.status !== 422) throw error;
    const existing = await api.request(`/git/ref/heads/${branch}`);
    const old = await api.request(`/git/commits/${existing.object.sha}`);
    if (old.tree.sha !== tree.sha || old.parents.map(p=>p.sha).join(',') !== [base,source].join(',')) throw new Error('run branch already has a different admission');
    generatedHead = existing.object.sha;
  }
  const previousPRs = await api.list(`/pulls?state=all&head=${encodeURIComponent(api.repo.split('/')[0]+':'+branch)}`);
  if (previousPRs.length > 1) throw new Error('ambiguous run PR');
  const created = previousPRs[0] ?? await api.request('/pulls', 'POST', { title: `Workflow admission: ${pr.title}`.slice(0, 240), head: branch, base: 'main', body: `Admission of #${number}; approved source ${source}.\n\n${JSON.stringify({ sourcePR: number, sourceSHA: source, base, head: generatedHead, runId: integer(env.GITHUB_RUN_ID), editorialDigest: plan.editorialDigest, repairs: plan.repairs }, null, 2)}` });
  output('head', generatedHead); output('base', base); output('pr', created.number); output('source_pr', number); output('source_sha', source); output('editorial_digest', plan.editorialDigest);
  console.log(`Admission prepared: source #${number}, generated #${created.number}; ${plan.repairs.length} numbering corrections recorded.`);
}
export function materialize(env,{fetchCommits=fetchObjects,collect=collectAdmission,write=writeFileSync}={}) {
  if (env.GITHUB_ACTIONS !== 'true' || env.GITHUB_EVENT_NAME !== 'workflow_dispatch' || env.GITHUB_REF !== 'refs/heads/main') throw new Error('materialization is allocation-workflow only');
  const base = sha(env.BASE_SHA), head = sha(env.HEAD_SHA), source = sha(env.SOURCE_SHA);
  const observed=env.SAME_PR==='true' ? sha(env.OBSERVED_HEAD) : source;
  fetchCommits(base, head, source, observed); const plan = collect(base, source);
  if (!DIGEST.test(env.EDITORIAL_DIGEST ?? '') || plan.editorialDigest !== env.EDITORIAL_DIGEST) throw new Error('editorial binding mismatch');
  const expected = new Map([...plan.posts].map(([slug, text]) => [`src/content/posts/${slug}.md`, text])); expected.set(SPECIMEN_LEDGER, plan.ledgerText);
  const parents = git('show', '-s', '--format=%P', head).trim().split(' ');
  if (parents.length !== 2 || parents[0] !== base || parents[1] !== observed) throw new Error('generated commit ancestry mismatch');
  if (env.SAME_PR==='true' && approvedHeadDigest(base,observed,source,collect)!==plan.editorialDigest) throw new Error('observed source editorial binding mismatch');
  const changes = parseNameStatus(git('diff', '--name-status', '--no-renames', '-z', base, head));
  const modes = parseHeadModes(git('ls-tree', '-r', '-z', head));
  for (const change of changes) {
    if (!expected.has(change.path) || !['A', 'M'].includes(change.status) || modes.get(change.path) !== '100644') throw new Error('generated tree contains unexpected changes');
  }
  for (const [path, text] of expected) {
    if (blob(head, path) !== text) throw new Error('generated tree differs from deterministic allocator');
    write(path, text); // This mode is invoked only by the allocation workflow.
  }
  console.log(`Deterministic workflow tree verified and materialized: ${head}`);
}
export async function certify(api, env) {
  const base = sha(env.BASE_SHA), head = sha(env.HEAD_SHA); const runId = integer(env.GITHUB_RUN_ID);
  if (!DIGEST.test(env.EDITORIAL_DIGEST ?? '')) throw new Error('invalid editorial digest');
  const detail = `https://github.com/${api.repo}/actions/runs/${runId}`;
  for (const name of ['publisher-paths', 'check', 'specimen-integrity']) await api.request('/check-runs', 'POST', { name, head_sha: head, status: 'completed', conclusion: 'success', completed_at: new Date().toISOString(), details_url: detail, external_id: `${api.repo}:${base}:${head}:${env.EDITORIAL_DIGEST}:${runId}`, output: { title: 'Trusted workflow admission verified', summary: 'Exact deterministic allocator tree, full tests, post/media checks, build, rendered-body/CSP/link/diagram gates passed in the credential-free validation job.' } });
  console.log(`Admission checks certified for ${head}; merge awaits successful completion of this workflow.`);
}
function assertMainDispatch(env) {
  if (env.GITHUB_REF!=='refs/heads/main' || env.GITHUB_EVENT_NAME!=='workflow_dispatch' || ![integer(env.MAINTAINER_ID),ACTIONS_ACTOR].includes(integer(env.GITHUB_ACTOR_ID))) throw new Error('completion wake is trusted dispatch on main only');
}
export async function wakeFinalizer(api, env) {
  assertMainDispatch(env);
  const id=integer(env.GITHUB_RUN_ID), run=await api.request(`/actions/runs/${id}`);
  if (run.id!==id || !trustedRun(run,api.repo,integer(env.MAINTAINER_ID)) || run.head_sha!==sha(env.GITHUB_SHA) || run.actor.id!==integer(env.GITHUB_ACTOR_ID)) throw new Error('completion wake run identity mismatch');
  requestOf(run);
  await api.request('/actions/workflows/specimen-finalize.yml/dispatches','POST',{ref:'main',inputs:{admission_run:String(id)}});
  console.log(`Finalizer notified automatically for admission run ${id}.`);
}
export async function awaitAdmissionCompletion(api, env, {pause=ms=>new Promise(resolve=>setTimeout(resolve,ms))}={}) {
  assertMainDispatch(env);
  const id=integer(env.WAKE_RUN_ID), owner=integer(env.MAINTAINER_ID);
  for (let attempt=0; attempt<30; attempt++) {
    const run=await api.request(`/actions/runs/${id}`);
    if (run.id!==id || !trustedRun(run,api.repo,owner)) throw new Error('completion wake run identity mismatch');
    sha(run.head_sha);requestOf(run);
    if (run.status==='completed') {
      console.log(`Admission run ${id} completed; unchanged proof and recovery checks follow.`);
      return run.conclusion;
    }
    if (attempt<29) await pause(1000);
  }
  throw new Error('admission completion wait exceeded bound; pending evidence retained');
}
export async function finalize(api, env, { collect = collectAdmission, fetchCommits = fetchObjects, readGit = git, verifyBase = mainHistory, proofFor = admissionProof, recover = recoverRequest, deploy = reconcileDeployment } = {}) {
  const runId = integer(env.ADMISSION_RUN_ID), owner = integer(env.MAINTAINER_ID);
  const run = await api.request(`/actions/runs/${runId}`);
  if (run.id !== runId || !trustedRun(run, api.repo, owner) || run.status !== 'completed' || run.conclusion !== 'success') throw new Error('untrusted or failed admission run');
  const request = await approvedRequest(api, run, owner);
  let number=request.pr;
  if (!request.samePR) {
    const prs=await api.list(`/pulls?state=all&head=${encodeURIComponent(api.repo.split('/')[0]+`:specimens/run-${runId}`)}`);
    if (prs.length!==1) throw new Error('expected exactly one generated admission PR');
    number=integer(prs[0].number);
  }
  const pr=await api.request(`/pulls/${number}`);
  if (pr.head.repo?.full_name!==api.repo || pr.base.ref!=='main' || (pr.base.repo && pr.base.repo.full_name!==api.repo) || (!request.samePR && (pr.user?.id!==ALLOCATOR_ACTOR || pr.head.ref!==`specimens/run-${runId}`))) throw new Error('generated PR identity mismatch');
  const head = sha(pr.head.sha), base = sha(run.head_sha);
  let proof;
  try { proof=await proofFor(api,base,head,owner,runId); }
  catch(error) {
    if (!request.samePR || pr.merged || pr.state!=='open' || error.status) throw error;
    return recover(api,run,env,{collect,fetchCommits,verifyBase});
  }
  const current = sha((await api.request('/git/ref/heads/main')).object.sha);
  fetchCommits(...new Set([...request.bases, base, head, current, request.source]));
  for (const approvedBase of request.bases) verifyBase(approvedBase, current);
  if (!request.independent && request.wake) await reviewReceipt(api,request.wake,request,owner,{collect,fetchCommits});
  const parents = readGit('show', '-s', '--format=%P', head).trim().split(' ');
  if (parents.length!==2 || parents[0]!==base || (!request.samePR && parents[1]!==request.source)) throw new Error('generated parents differ from immutable approved source');
  const message=readGit('show','-s','--format=%B',head).trim();
  const originalNumber=integer((request.samePR ? /^Workflow admission same PR #(\d+) source [a-f0-9]{40} run \d+$/ : /^Workflow admission of PR #(\d+)/).exec(message)?.[1]);
  if (originalNumber !== request.pr) throw new Error('generated source PR differs from approved request');
  if (request.samePR && message!==`Workflow admission same PR #${request.pr} source ${request.source} run ${run.id}`) throw new Error('numbered commit differs from approved request');
  const digest = collect(request.approvedBase, request.source).editorialDigest;
  if (collect(base, request.source).editorialDigest !== digest || digest !== proof.editorialDigest) throw new Error('approved content changed');
  if (request.samePR) {
    fetchCommits(parents[1]);
    if (approvedHeadDigest(base,parents[1],request.source,collect)!==digest || approvedHeadDigest(base,head,request.source,collect)!==digest) throw new Error('observed source editorial content changed');
    readGit('merge-base','--is-ancestor',request.source,parents[1]);
  }
  if (pr.merged) {
    const merge = sha(pr.merge_commit_sha);
    fetchCommits(merge);
    const mergeParents = readGit('show', '-s', '--format=%P', merge).trim().split(' ');
    if (mergeParents.length !== 2 || mergeParents[0] !== base || mergeParents[1] !== head || readGit('show','-s','--format=%T',merge) !== readGit('show','-s','--format=%T',head)) throw new Error('merge does not contain the verified admission tree');
    const deployment = await deploy(api, pr, { completion:{admissionRun:runId,base,head,rootRun:request.rootRun,source:request.source,digest} });
    console.log(`Admission #${pr.number} already merged; deployment ${deployment}.`);
    return deployment;
  }
  if (pr.state !== 'open') throw new Error('generated admission is closed without merge');
  await approvalStillValid(api, request, owner, { current:base, digest, collect, fetchCommits });
  if (current !== base) {
    if (collect(current, request.source).editorialDigest !== digest) throw new Error('source editorial content changed; owner must review again');
    const recovery = await recover(api, run, env, { collect, fetchCommits, verifyBase });
    // Keep the predecessor open through dispatch, preparation failures and validation.
    // Only a verified merged successor can take its place in reconciliation.
    console.log(`Stale allocation #${pr.number} retained; recovery ${recovery}.`);
    return recovery;
  }
  const rules = await api.request('/rules/branches/main');
  if (!rules.some(r => r.type === 'required_status_checks' && r.parameters?.strict_required_status_checks_policy === true)) throw new Error('server-enforced current-base checks are required');
  const required = rules.filter(r => r.type === 'required_status_checks').flatMap(r => r.parameters?.required_status_checks ?? []);
  if (!['publisher-paths','check','specimen-integrity'].every(name => required.some(c => c.context === name && c.integration_id === 15368))) throw new Error('required admission checks are not enforced');
  if (request.samePR) {
    await approvalStillValid(api,request,owner,{current:base,digest,collect,fetchCommits});
    if ((await api.request(`/pulls/${pr.number}`)).head.sha!==head || (await api.request('/git/ref/heads/main')).object.sha!==base) throw new Error('source head or main changed before merge');
  }
  // Normal merge API, pinned head. No bypass of PR/check rules is granted to this identity.
  const merged = await api.request(`/pulls/${pr.number}/merge`, 'PUT', { merge_method: 'merge', sha: head });
  if (!merged.merged) throw new Error('server refused admission merge');
  const deployment = await deploy(api, { ...pr, merged:true, merge_commit_sha:merged.sha }, { completion:{admissionRun:runId,base,head,rootRun:request.rootRun,source:request.source,digest} });
  console.log(`Merged workflow admission #${pr.number} at ${merged.sha}; deployment ${deployment}.`);
  return deployment;
}
export async function gate(api, env) {
  const base = sha(env.ADMISSION_OBSERVATION==='true' ? git('rev-parse','HEAD').trim() : env.BASE_SHA), head = sha(env.HEAD_SHA); fetchObjects(base, head);
  if (env.ADMISSION_OBSERVATION==='true') {
    collectAdmission(base,head); // Same narrow data lane and safe repair parsing.
    try { await admissionProof(api,base,head,integer(env.MAINTAINER_ID)); }
    catch(error) {
      if (error.message!=='no successful trusted-main allocation proof for this exact base/head') throw error;
      const summary='Waiting for workflow-owned numbering validation. Authorized Grok PRs are admitted automatically; other producers retain their owner review. This observation grants no required check or merge permission.';
      console.log(`::notice::${summary}`);
      if(process.env.GITHUB_STEP_SUMMARY) appendFileSync(process.env.GITHUB_STEP_SUMMARY,summary+'\n');
      return;
    }
    console.log('Trusted numbered-head certificate is available; current-base required checks govern merge.');return;
  }
  const result = await inspectSpecimenChanges({ cwd: process.cwd(), base, head });
  if (result.problems.length) throw new Error(result.problems.join('; '));
  if (result.requiresAdmission) await admissionProof(api, base, head, integer(env.MAINTAINER_ID));
  console.log(result.requiresAdmission ? 'Workflow-owned numbering proof accepted.' : 'No workflow-owned numbering changes.');
}
export function observePaths(env,{fetchCommits=fetchObjects,collect=collectAdmission,readGit=git}={}) {
  const base=sha(readGit('rev-parse','HEAD').trim()),head=sha(env.HEAD_SHA);fetchCommits(base,head);
  collect(base,head);
  const summary='Article paths and repairable numbering checked. Waiting for trusted owner-approved admission; source observations grant no required success or merge permission.';
  console.log(`::notice::${summary}`);
  if(process.env.GITHUB_STEP_SUMMARY) appendFileSync(process.env.GITHUB_STEP_SUMMARY,summary+'\n');
}
export async function sweepHistory(api, env, { finalizeRun = finalize, recover = recoverRequest, completed = terminalCompletion } = {}) {
  if (env.GITHUB_REF !== 'refs/heads/main') throw new Error('sweep runs on main only');
  const owner = integer(env.MAINTAINER_ID);
  // Closed/merged PRs are included: a merge is not proof of deployment. Run titles
  // independently retain approved requests that failed before creating any PR.
  const byRun = new Map();
  for await (const pr of stream(api, '/pulls?state=all&sort=created&direction=desc')) {
    if (pr.user?.id!==ALLOCATOR_ACTOR || pr.head.repo?.full_name!==api.repo || pr.base.ref!=='main' || !/^specimens\/run-\d+$/.test(pr.head.ref)) continue;
    const id=integer(pr.head.ref.split('-').at(-1));
    if (byRun.has(id) && byRun.get(id).number!==pr.number) throw new Error('ambiguous generated admission PRs');
    byRun.set(id,pr);
  }
  let failed = false;
  const requests = new Map();
  const retired = new Set();
  const seenRuns = new Set();
  for await (const run of stream(api, '/actions/workflows/specimen-admission.yml/runs', 'workflow_runs')) {
    if (!trustedRun(run,api.repo,owner) || run.status!=='completed' || seenRuns.has(run.id)) continue;
    seenRuns.add(run.id);
    try {
      const request = await approvedRequest(api, run, owner);
      const key = `${request.pr}:${request.source}`;
      if (retired.has(key)) continue;
      const pr=byRun.get(run.id);
      if (run.conclusion==='success' && await completed(api,pr,run,request,owner)) {
        retired.add(key); requests.delete(key); continue;
      }
      if (!requests.has(key)) requests.set(key, []);
      requests.get(key).push({ run, request, pr });
    } catch(error) { failed=true; console.error(`Admission run ${run.id}: ${error.message}`); }
  }
  for (const candidates of requests.values()) {
    candidates.sort((a,b)=>a.run.id-b.run.id);
    // One action per immutable request. A merged successor prevents another number
    // being issued, while predecessor evidence remains present after failed retries.
    const latestRoot = Math.max(...candidates.map(c=>c.request.rootRun));
    const active = candidates.filter(c=>c.request.rootRun===latestRoot);
    const selected = candidates.findLast(c=>c.pr?.merged_at || c.pr?.merged) ?? active.findLast(c=>c.run.conclusion==='success' && c.pr?.state==='open') ?? active.at(-1);
    const { run, pr } = selected;
    try {
      if (run.conclusion==='success' && pr && (pr.state==='open' || pr.merged_at || pr.merged)) await finalizeRun(api,{...env,ADMISSION_RUN_ID:String(run.id)});
      else if (!pr || pr.state==='open') await recover(api,run,env);
      else throw new Error('generated admission was withdrawn; owner intervention required');
    } catch(error) { failed=true; console.error(`Admission run ${run.id}: ${error.message}`); }
  }
  if (failed) throw new Error('one or more admissions blocked; evidence preserved');
}
function exactKeys(value, keys) {
  return value && typeof value==='object' && !Array.isArray(value) && Object.keys(value).sort().join(',')===keys.slice().sort().join(',');
}
function heldApproval(error) {
  // Transport/API errors retain pending status. Only controller safety and
  // explicit owner-approval failures stop expensive automatic reconciliation.
  return !error.status && /approval withdrawn|approval source rebound|review revoked|editorial content changed|approved content changed|independent source identity changed|retry limit|withdrawn; owner intervention|closed without merge/.test(error.message);
}
export function validateState(state, repo) {
  if (!exactKeys(state,['schemaVersion','repository','policySHA','cursor','pending']) || state.schemaVersion!==STATE_SCHEMA || state.repository!==repo || !SHA.test(state.policySHA ?? '') || !Number.isSafeInteger(state.cursor) || state.cursor<0 || !Array.isArray(state.pending) || state.pending.length>MAX_PENDING_RUNS) throw new Error('invalid protected reconciliation state');
  const seen=new Set();
  for (const entry of state.pending) {
    if (!exactKeys(entry,['id','status','reason']) || !Number.isSafeInteger(entry.id) || entry.id<1 || seen.has(entry.id) || !['pending','held'].includes(entry.status) || typeof entry.reason!=='string' || entry.reason.length>300 || /[\r\n]/.test(entry.reason)) throw new Error('invalid pending reconciliation entry');
    seen.add(entry.id);
  }
  return state;
}
export async function verifyStateProtection(api, env) {
  const rulesetID=integer(env.SPECIMEN_STATE_RULESET_ID);
  if (rulesetID!==STATE_RULESET_SNAPSHOT.id) throw new Error('state ruleset ID differs from trusted-main snapshot');
  const ruleset=await api.request(`/rulesets/${rulesetID}`);
  const effective=await api.request(`/rules/branches/${encodeURIComponent(STATE_BRANCH)}`);
  if (ruleset.id!==rulesetID || ruleset.target!=='branch' || ruleset.enforcement!=='active' || (typeof ruleset.updated_at!=='string' || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?(?:Z|[+-]\d{2}:\d{2})$/.test(ruleset.updated_at) || Date.parse(ruleset.updated_at)!==Date.parse(STATE_RULESET_SNAPSHOT.updatedAt))) throw new Error('state protection differs from owner-verified trusted-main snapshot');
  // GitHub omits bypass_actors for callers without ruleset write access. The exact
  // owner-verified snapshot pin permits that documented omission only; explicit
  // null, malformed or unsafe lists never become a permission fallback.
  if (Object.hasOwn(ruleset,'bypass_actors')) {
    const bypass=ruleset.bypass_actors;
    if (!Array.isArray(bypass) || bypass.length!==2 || !bypass.some(a=>a?.actor_type==='Integration' && a.actor_id===ALLOCATOR_APP && a.bypass_mode==='always') || !bypass.some(a=>a?.actor_type==='RepositoryRole' && a.actor_id===5 && a.bypass_mode==='always')) throw new Error('state namespace is not restricted to publishing App and administrators');
  }
  for (const type of ['creation','update','deletion','non_fast_forward']) if (!Array.isArray(effective) || !effective.some(rule=>rule.type===type && rule.ruleset_id===rulesetID)) throw new Error(`protected state branch lacks ${type} restriction`);
}
async function verifyStateCertificate(api, head, content, state, owner) {
  const digest=createHash('sha256').update(content).digest('hex');
  const checks=await api.list(`/commits/${head}/check-runs`,'check_runs');
  for (const check of checks) {
    if (check.name!==STATE_CHECK || check.app?.id!==15368 || check.head_sha!==head || check.status!=='completed' || check.conclusion!=='success') continue;
    const parts=String(check.external_id ?? '').split(':');
    if (parts.length!==4 || parts[0]!==api.repo || parts[1]!==head || parts[2]!==digest || !/^[1-9]\d*$/.test(parts[3])) continue;
    const runID=integer(parts[3]);
    if (!checkDetailsMatch(check,api.repo,runID)) continue;
    const run=await api.request(`/actions/runs/${runID}`);
    // Each checkpoint is independently validated and certified before CAS. A later
    // unrelated failure in the same reconciler run does not undo that transition.
    if (run.id===runID && workflowPath(run,FINALIZER_PATH) && run.head_branch==='main' && run.head_sha===state.policySHA && ['schedule','workflow_dispatch','workflow_run'].includes(run.event) && run.repository?.full_name===api.repo && (!run.head_repository || run.head_repository.full_name===api.repo) && [owner,ACTIONS_ACTOR].includes(run.actor?.id)) return;
  }
  throw new Error('protected state lacks independent trusted-main Actions certificate');
}
export async function loadState(api, env) {
  await verifyStateProtection(api,env);
  let ref;
  try { ref=await api.request(`/git/ref/heads/${STATE_BRANCH}`); }
  catch(error) { if (error.status!==404) throw error; return {head:null,state:{schemaVersion:STATE_SCHEMA,repository:api.repo,policySHA:sha(env.GITHUB_SHA),cursor:0,pending:[]}}; }
  const head=sha(ref.object?.sha);
  const commit=await api.request(`/git/commits/${head}`);
  if (commit.sha!==head || commit.parents?.length!==1) throw new Error('invalid state commit ancestry');
  const tree=await api.request(`/git/trees/${sha(commit.tree?.sha)}`);
  if (tree.truncated || !Array.isArray(tree.tree) || tree.tree.length!==1 || tree.tree[0].path!==STATE_PATH || tree.tree[0].mode!=='100644' || tree.tree[0].type!=='blob') throw new Error('state tree must contain one regular state blob');
  const blob=await api.request(`/git/blobs/${sha(tree.tree[0].sha)}`);
  if (blob.encoding!=='base64' || !Number.isSafeInteger(blob.size) || blob.size<1 || blob.size>MAX_STATE_BYTES || typeof blob.content!=='string') throw new Error('invalid state blob');
  const bytes=Buffer.from(blob.content,'base64'), text=bytes.toString('utf8');
  if (bytes.length!==blob.size || !bytes.equals(Buffer.from(text))) throw new Error('invalid state encoding');
  const state=validateState(JSON.parse(text),api.repo);
  await verifyStateCertificate(api,head,bytes,state,integer(env.MAINTAINER_ID));
  const current=sha((await api.request('/git/ref/heads/main')).object.sha);
  if (!await containsMerge(api,state.policySHA,current)) throw new Error('state policy is outside trusted main history');
  return {head,state};
}
export async function saveState(api, observed, state, env) {
  state={...state,policySHA:sha(env.GITHUB_SHA)};
  validateState(state,api.repo);
  const content=JSON.stringify(state)+'\n';
  if (Buffer.byteLength(content)>MAX_STATE_BYTES) throw new Error('protected state exceeds size bound');
  const parent=observed.head ?? sha(env.GITHUB_SHA);
  const tree=await api.request('/git/trees','POST',{tree:[{path:STATE_PATH,mode:'100644',type:'blob',content}]});
  const commit=await api.request('/git/commits','POST',{message:`Specimen reconciliation state from trusted main ${state.policySHA}`,tree:sha(tree.sha),parents:[parent]});
  const head=sha(commit.sha);
  const runID=integer(env.GITHUB_RUN_ID);
  const digest=createHash('sha256').update(content).digest('hex');
  await api.request('/check-runs','POST',{name:STATE_CHECK,head_sha:head,status:'completed',conclusion:'success',external_id:`${api.repo}:${head}:${digest}:${runID}`,details_url:`https://github.com/${api.repo}/actions/runs/${runID}`,output:{title:'Protected specimen reconciliation checkpoint',summary:`Validated schema ${STATE_SCHEMA}; cursor ${state.cursor}; pending ${state.pending.length}; source ${state.policySHA}. Checkpoint completion is independent of later reconciliation outcomes.`}});
  // Each new commit descends only from the observed head. A concurrent writer's
  // different commit makes this non-force update fail instead of overwriting it.
  if (observed.head) await api.request(`/git/refs/heads/${STATE_BRANCH}`,'PATCH',{sha:head,force:false});
  else await api.request('/git/refs','POST',{ref:`refs/heads/${STATE_BRANCH}`,sha:head});
  return {head,state};
}
/** A PR-side wake conveys no authorization. Read trusted bot identity or owner reviews and
 * immutable Git objects independently; existing run/state discovery deduplicates
 * requests and retains cancelled or failed attempts for bounded recovery. */
export async function discoverApprovedRequests(api,env,{knownRuns=[],pending=[],collect=collectAdmission,fetchCommits=fetchObjects}={}) {
  const owner=integer(env.MAINTAINER_ID);
  const candidates=[];
  for await (const pr of stream(api,'/pulls?state=open&sort=created&direction=asc')) {
    if (pr.state!=='open' || pr.draft || pr.head?.repo?.full_name!==api.repo || pr.base?.ref!=='main' || (pr.base.repo && pr.base.repo.full_name!==api.repo) || !pr.head.ref || /^(?:main$|specimens\/)/.test(pr.head.ref)) continue;
    if (independentGrokPR(pr,api.repo)) { candidates.push({pr,independent:true});continue; }
    const reviews=await api.list(`/pulls/${integer(pr.number)}/reviews`);
    const review=reviews.filter(r=>r.user?.id===owner && ['APPROVED','CHANGES_REQUESTED','DISMISSED'].includes(r.state)).sort((a,b)=>a.id-b.id).at(-1);
    if (!review || review.state!=='APPROVED') continue;
    candidates.push({pr,review});
  }
  if (!candidates.length) return 'idle';
  const runs=new Map(knownRuns.map(run=>[run.id,run]));
  for (const entry of pending) if (entry.status!=='held' && !runs.has(entry.id)) runs.set(entry.id,await api.request(`/actions/runs/${entry.id}`));
  if ([...runs.values()].some(run=>trustedRun(run,api.repo,owner) && run.status!=='completed')) return 'pending';
  for (const {pr,review,independent} of candidates) {
    if (independent) {
      const base=sha((await api.request('/git/ref/heads/main')).object.sha),source=sha(pr.head.sha);
      fetchCommits(base,source);collect(base,source);
      let existing=false;
      // Include historical roots so a lost dispatch response or a numbered head
      // cannot create another request. Producer corrections get a new exact root.
      for await (const run of stream(api,'/actions/workflows/specimen-admission.yml/runs','workflow_runs')) {
        if (run.created_at && serverTimestamp(run.created_at,'admission creation')<serverTimestamp(pr.created_at,'source PR creation')) break;
        if (!trustedRun(run,api.repo,owner)) continue;
        let request;try { request=requestOf(run); } catch { continue; }
        if (!request.samePR || request.pr!==pr.number || request.review!==0) continue;
        try {
          await approvalPlan(api,run,owner,{collect,fetchCommits});
          existing=true;break;
        } catch(error) { if (error.status) throw error; }
      }
      if (existing) continue;
      const currentPR=await api.request(`/pulls/${pr.number}`);assertSourceApproval(currentPR,api.repo);
      if (!independentGrokPR(currentPR,api.repo) || currentPR.head.sha!==source) throw new Error('independent source identity or editorial head changed before automatic admission');
      await api.request('/actions/workflows/specimen-admission.yml/dispatches','POST',{ref:'main',inputs:{pr_number:String(pr.number),head_sha:source,review_id:'0',same_pr:'true',recovery_run:'0'}});
      console.log(`Authorized Grok PR #${pr.number} dispatched automatically for numbering.`);
      return 'dispatched';
    }
    if ([...runs.values()].some(run=>{
      if (!trustedRun(run,api.repo,owner)) return false;
      try { const request=requestOf(run); return request.samePR && request.pr===pr.number && request.review===review.id; } catch { return false; }
    })) continue;
    // Lost dispatch responses may fall outside the current index page. Find an
    // existing root before looking for an initial event receipt, keyed by ID.
    if (await earliestReviewRoot(api,{pr:pr.number,review:review.id},owner,review)) continue;
    const base=sha((await api.request('/git/ref/heads/main')).object.sha);
    let receipt;
    const since=serverTimestamp(review.submitted_at,'owner review submission');
    for await (const wake of stream(api,'/actions/workflows/specimen-editorial-review.yml/runs','workflow_runs')) {
      if (serverTimestamp(wake.created_at,'owner wake creation')<since) break;
      const match=REVIEW_RECEIPT.exec(wake.display_title ?? '');
      if (!match || Number(match[1])!==pr.number || Number(match[2])!==review.id || match[3].toLowerCase()!=='submitted' || match[4].toLowerCase()!=='approved') continue;
      const request={pr:pr.number,review:integer(review.id),source:match[5],approvedBase:base};
      try { await reviewReceipt(api,wake.id,request,owner,{collect,fetchCommits}); }
      catch(error) { if (error.status) throw error;console.log(`Owner approval receipt ${wake.id} refused: ${error.message}`);continue; }
      if (receipt && receipt.head_sha!==wake.head_sha) throw new Error('ambiguous immutable owner approval receipts');
      receipt=wake;
    }
    if (!receipt) continue;
    const source=sha(receipt.head_sha);
    await approvedReview(api,{pr:pr.number,source,review:integer(review.id)},owner);
    const currentPR=await api.request(`/pulls/${pr.number}`);assertSourceApproval(currentPR,api.repo);
    if (currentPR.head.sha!==source) throw new Error('source editorial head changed before automatic admission');
    await api.request('/actions/workflows/specimen-admission.yml/dispatches','POST',{ref:'main',inputs:{pr_number:String(pr.number),head_sha:source,review_id:String(review.id),same_pr:'true',recovery_run:'0',wake_run:String(receipt.id)}});
    console.log(`Owner-approved original PR #${pr.number} dispatched automatically.`);
    return 'dispatched';
  }
  return 'idle';
}
export async function sweep(api, env, { finalizeRun=finalize, recover=recoverRequest, completed=terminalCompletion, load=loadState, save=saveState,discover=discoverApprovedRequests }={}) {
  if (env.GITHUB_REF!=='refs/heads/main') throw new Error('sweep runs on main only');
  const owner=integer(env.MAINTAINER_ID);
  let observed=await load(api,env);
  const state=structuredClone(observed.state);
  const pending=new Map(state.pending.map(entry=>[entry.id,entry]));
  const knownRuns=new Map();
  let highWater=null, reached=state.cursor===0;
  // Runs are listed newest first. Queued/running trusted requests are enrolled
  // before the cursor moves, so their later completion cannot fall behind it.
  for await (const run of stream(api,'/actions/workflows/specimen-admission.yml/runs','workflow_runs')) {
    const id=integer(run.id);
    if (highWater===null) highWater=id;
    if (id===state.cursor) { reached=true; break; }
    if (!trustedRun(run,api.repo,owner)) continue;
    knownRuns.set(id,run);
    if (!pending.has(id)) {
      let status='pending', reason='';
      try { requestOf(run); } catch(error) { status='held'; reason=error.message.slice(0,300).replace(/[\r\n]/g,' '); }
      pending.set(id,{id,status,reason});
    }
    if (pending.size>MAX_PENDING_RUNS) throw new Error('pending reconciliation capacity exceeded');
  }
  if (!reached) throw new Error('workflow history did not reach discovery cursor');
  state.cursor=highWater ?? state.cursor; state.pending=[...pending.values()].sort((a,b)=>a.id-b.id);
  if (!observed.head || JSON.stringify(state)!==JSON.stringify(observed.state)) observed=await save(api,observed,state,env);
  if (env.EDITORIAL_WAKE_RUN) {
    // An owner event only wakes a held legacy lineage. It never replaces its
    // source binding, revives exhaustion, or supplies first-discovery approval.
    const wake=await api.request(`/actions/runs/${integer(env.EDITORIAL_WAKE_RUN)}`);
    if (wake.id!==Number(env.EDITORIAL_WAKE_RUN)) throw new Error('editorial wake identity mismatch');
    let changed=false;
    for (const entry of state.pending.filter(e=>e.status==='held' && e.reason==='owner editorial approval withdrawn or changed')) {
      const run=await api.request(`/actions/runs/${entry.id}`), request=requestOf(run);
      if (!request.samePR || !ownerReviewWake(wake,api.repo,owner,request.pr)) continue;
      try {
        await approvalPlan(api,run,owner);
        entry.status='pending';entry.reason='';changed=true;knownRuns.set(entry.id,run);
      } catch(error) { if (error.status) throw error; }
    }
    if (changed) observed=await save(api,observed,state,env);
  }
  const groups=new Map();
  let failed=false;
  for (const entry of state.pending.filter(entry=>entry.status==='pending')) {
    try {
      const run=await api.request(`/actions/runs/${entry.id}`);
      knownRuns.set(entry.id,run);
      if (run.id!==entry.id || !trustedRun(run,api.repo,owner)) throw new Error('pending run identity changed');
      if (run.status!=='completed') continue;
      const request=await approvedRequest(api,run,owner);
      const prs=request.samePR ? [await api.request(`/pulls/${request.pr}`)] : await api.list(`/pulls?state=all&head=${encodeURIComponent(api.repo.split('/')[0]+`:specimens/run-${run.id}`)}`);
      if (prs.length>1) throw new Error('ambiguous generated admission PRs');
      const pr=prs[0];
      const key=request.samePR && request.review ? `${request.pr}:review:${request.review}` : `${request.pr}:${request.source}:${request.review ?? 'legacy'}`;
      if (!groups.has(key)) groups.set(key,[]);
      groups.get(key).push({entry,run,request,pr});
    } catch(error) {
      // API/transient failures remain pending. Only explicit safety/approval holds
      // below are retired from hot polling; their prior state commits retain evidence.
      if (heldApproval(error)) {
        entry.status='held';entry.reason=error.message.slice(0,300).replace(/[\r\n]/g,' ');
        observed=await save(api,observed,state,env);
      }
      failed=true; console.error(`Admission run ${entry.id}: ${error.message}`);
    }
  }
  for (const candidates of groups.values()) {
    candidates.sort((a,b)=>a.run.id-b.run.id);
    const latestRoot=Math.max(...candidates.map(c=>c.request.rootRun));
    const active=candidates.filter(c=>c.request.rootRun===latestRoot);
    const selected=candidates.findLast(c=>c.run.conclusion==='success' && (c.pr?.merged_at || c.pr?.merged)) ?? active.findLast(c=>c.run.conclusion==='success' && c.pr?.state==='open') ?? active.at(-1);
    const {run,request,pr}=selected;
    try {
      let outcome;
      if (run.conclusion==='success' && pr && (pr.state==='open' || pr.merged_at || pr.merged)) {
        outcome=await completed(api,pr,run,request,owner) ? 'deployed' : await finalizeRun(api,{...env,ADMISSION_RUN_ID:String(run.id)});
      } else if (!pr || pr.state==='open') outcome=await recover(api,run,env);
      else throw new Error('generated admission was withdrawn; owner intervention required');
      if (outcome==='deployed') {
        const ids=new Set(candidates.map(c=>c.entry.id));
        state.pending=state.pending.filter(entry=>!ids.has(entry.id));
        observed=await save(api,observed,state,env);
      }
    } catch(error) {
      const held=heldApproval(error);
      if (held) {
        for (const candidate of candidates) { candidate.entry.status='held'; candidate.entry.reason=error.message.slice(0,300).replace(/[\r\n]/g,' '); }
        observed=await save(api,observed,state,env);
      }
      failed=true; console.error(`Admission run ${run.id}: ${error.message}`);
    }
  }
  await discover(api,env,{knownRuns:[...knownRuns.values()],pending:state.pending});
  if (failed) throw new Error('one or more admissions blocked; protected state retained');
}
export async function main(args, env = process.env) {
  const api = new GitHub(env.GITHUB_REPOSITORY, env.GH_TOKEN, fetch, env.SPECIMEN_WRITE_TOKEN);
  switch (args[0]) {
    case 'prepare': return prepare(api, env);
    case 'materialize': return materialize(env);
    case 'certify': return certify(api, env);
    case 'wake-finalizer': return wakeFinalizer(api, env);
    case 'await-completion': return awaitAdmissionCompletion(api, env);
    case 'finalize': return finalize(api, env);
    case 'gate': return gate(api, env);
    case 'observe-paths': return observePaths(env);
    case 'deployed-gate': {
      const head=sha(env.GITHUB_SHA); fetchObjects(head); const parents=git('show','-s','--format=%P',head).trim().split(' ');
      if(!parents[0]) throw new Error('no trusted parent for deployment');
      const base=sha(parents[0]); fetchObjects(base); const inspection=await inspectSpecimenChanges({cwd:process.cwd(),base,head});
      if(inspection.problems.length) throw new Error(inspection.problems.join('; '));
      if(inspection.requiresAdmission) {
        if(parents.length!==2) throw new Error('numbering changes require an admitted merge');
        const admitted=sha(parents[1]); fetchObjects(admitted);
        if(git('show','-s','--format=%T',head)!==git('show','-s','--format=%T',admitted)) throw new Error('merge altered the admitted tree');
        await admissionProof(api,base,admitted,integer(env.MAINTAINER_ID));
      }
      console.log('Deployment numbering integrity verified.'); return;
    }
    case 'sweep': return sweep(api, env);
    default: throw new Error('expected prepare, materialize, certify, finalize or gate');
  }
}
if (process.argv[1] === fileURLToPath(import.meta.url)) main(process.argv.slice(2)).catch(error => { console.error(`specimen-admission: ${error.message}`); process.exitCode = 1; });

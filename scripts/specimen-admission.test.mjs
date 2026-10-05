import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { approvedRequest, collectAdmission, GitHub, finalize, prepare, recoverRequest, reconcileDeployment, requestOf, sweep, terminalCompletion } from './specimen-admission.mjs';

const REPO = 'owner/site';
const OWNER = 42;
const BOT = 41898282;
const BASE = 'a'.repeat(40);
const SOURCE = 'b'.repeat(40);
const CURRENT = 'c'.repeat(40);
const HEAD = 'd'.repeat(40);
const MERGE = 'e'.repeat(40);
const DIGEST = 'f'.repeat(64);
const NOW = Date.parse('2026-10-05T12:00:00Z');
const ENV = { MAINTAINER_ID:String(OWNER), GITHUB_REF:'refs/heads/main', ADMISSION_RUN_ID:'10' };
const COMMENT_MARKER = 'specimen-reconciliation:';
const run = (id = 10, overrides = {}) => ({ id, actor:{id:OWNER}, repository:{full_name:REPO}, head_repository:{full_name:REPO}, head_sha:BASE, path:'.github/workflows/specimen-admission.yml', event:'workflow_dispatch', head_branch:'main', status:'completed', conclusion:'success', display_title:`Specimen request pr=7 head=${SOURCE} recovery=0`, ...overrides });
const sourcePR = (overrides = {}) => ({ number:7, state:'open', draft:false, head:{sha:SOURCE,repo:{full_name:REPO}}, base:{ref:'main',repo:{full_name:REPO}}, ...overrides });
const generatedPR = (overrides = {}) => ({ number:100, state:'open', merged:false, user:{id:BOT}, head:{sha:HEAD,ref:'specimens/run-10',repo:{full_name:REPO}}, base:{ref:'main',repo:{full_name:REPO}}, ...overrides });
const dependencies = { collect:()=>({editorialDigest:DIGEST}), fetchCommits:()=>{}, verifyBase:()=>{} };

class API {
  constructor() {
    this.repo = REPO;
    this.current = CURRENT;
    this.runs = [run()];
    this.prs = [generatedPR()];
    this.source = sourcePR();
    this.reviews = [];
    this.comments = new Map();
    this.deployRuns = [];
    this.checks = [];
    this.commits = new Map();
    this.calls = [];
    this.rules = [{type:'required_status_checks',parameters:{strict_required_status_checks_policy:true,required_status_checks:['publisher-paths','check','specimen-integrity'].map(context=>({context,integration_id:15368}))}}];
    this.before = null;
    this.after = null;
    this.comparisons = new Map();
  }
  async request(path, method = 'GET', body) {
    this.calls.push({path,method,body});
    if (this.before) await this.before(path,method,body);
    let result;
    if (path==='/git/ref/heads/main') result = {object:{sha:this.current}};
    else if (/^\/actions\/runs\/\d+$/.test(path)) result = [...this.runs,...this.deployRuns].find(r=>r.id===Number(path.split('/').at(-1)));
    else if (path.startsWith('/git/commits/')) result = this.commits.get(path.split('/').at(-1));
    else if (/^\/issues\/\d+\/comments$/.test(path) && method==='POST') {
      const pr = Number(path.split('/')[2]);
      const comments = this.comments.get(pr) ?? [];
      result = {id:comments.length+1,user:{id:BOT},body:body.body};
      comments.push(result); this.comments.set(pr,comments);
    } else if (path.startsWith('/actions/workflows/') && path.endsWith('/dispatches') && method==='POST') result = null;
    else if (path==='/rules/branches/main') result = this.rules;
    else if (path==='/pulls/100/merge' && method==='PUT') {
      const pr = this.prs.find(p=>p.number===100);
      pr.merged = true; pr.state = 'closed'; pr.merged_at = new Date(NOW).toISOString(); pr.merge_commit_sha = MERGE; this.current = MERGE;
      result = {merged:true,sha:MERGE};
    } else if (/^\/pulls\/\d+$/.test(path)) result = Number(path.split('/').at(-1))===7 ? this.source : this.prs.find(p=>p.number===Number(path.split('/').at(-1)));
    else if (path.startsWith('/compare/')) {
      const [base,head] = path.slice('/compare/'.length).split('...');
      result = this.comparisons.get(`${base}:${head}`) ?? {status:'ahead',merge_base_commit:{sha:base}};
    } else throw new Error(`Unexpected API request: ${method} ${path}`);
    if (result===undefined) throw new Error(`Missing API fixture: ${path}`);
    if (this.after) await this.after(path,method,body);
    return result;
  }
  async list(path) {
    this.calls.push({path,method:'LIST'});
    if (path==='/actions/workflows/specimen-admission.yml/runs') return [...this.runs];
    if (path==='/actions/workflows/deploy-pages.yml/runs') return this.deployRuns;
    if (path==='/pulls?state=all' || path==='/pulls?state=all&sort=created&direction=desc') return [...this.prs];
    if (path.startsWith('/pulls?state=all&head=')) {
      const ref = decodeURIComponent(path.split('head=')[1]).split(':')[1];
      return this.prs.filter(p=>p.head.ref===ref);
    }
    if (path==='/pulls/7/reviews') return this.reviews;
    if (path===`/commits/${HEAD}/check-runs`) return this.checks;
    const match = /^\/issues\/(\d+)\/comments$/.exec(path);
    if (match) return this.comments.get(Number(match[1])) ?? [];
    throw new Error(`Unexpected API list: ${path}`);
  }
  mutations() { return this.calls.filter(c=>!['GET','LIST'].includes(c.method)); }
}

const finalDependencies = (overrides = {}) => ({ ...dependencies,
  proofFor:async()=>({editorialDigest:DIGEST}),
  readGit: (...args) => {
    if (args.includes('--format=%P')) return args.at(-1)===MERGE ? `${BASE} ${HEAD}\n` : `${BASE} ${SOURCE}\n`;
    if (args.includes('--format=%B')) return 'Workflow admission of PR #7\n';
    if (args.includes('--format=%T')) return 'same-tree\n';
    throw new Error('Unexpected Git fixture');
  }, ...overrides });
const deployRun = (id = 200, overrides = {}) => ({ id, head_sha:MERGE, head_branch:'main', path:'.github/workflows/deploy-pages.yml', event:'workflow_dispatch', repository:{full_name:REPO}, head_repository:{full_name:REPO}, status:'completed', conclusion:'success', ...overrides });

test('durable run titles retain PR/source without API inputs and reject unsafe identifiers', () => {
  assert.deepEqual(requestOf(run()), {pr:7,source:SOURCE,recovery:0});
  for (const display_title of ['Specimen admission',`Specimen request pr=0 head=${SOURCE} recovery=0`,`Specimen request pr=7 head=${SOURCE} recovery=99999999999999999999`,`Specimen request pr=7 head=${SOURCE} recovery=0\nforged`]) assert.throws(()=>requestOf(run(10,{display_title})));
});

test('automatic recovery authenticates the full ancestry to an immutable owner request', async () => {
  const api = new API();
  const retry = run(11,{actor:{id:BOT},head_sha:CURRENT,display_title:`Specimen request pr=7 head=${SOURCE} recovery=10`});
  api.runs.push(retry);
  const approved = await approvedRequest(api,retry,OWNER);
  assert.equal((await approvedRequest(api,run(10,{path:'.github/workflows/specimen-admission.yml@main'}),OWNER)).rootRun,10);
  await assert.rejects(approvedRequest(api,run(10,{path:'.github/workflows/specimen-admission.yml@feature'}),OWNER));
  assert.equal(approved.rootRun,10); assert.equal(approved.approvedBase,BASE);
  assert.equal(approved.source,SOURCE); assert.deepEqual(approved.bases,[CURRENT,BASE]);
  for (const overrides of [{actor:{id:999}}, {repository:{full_name:'other/site'}}, {head_repository:{full_name:'fork/site'}}, {path:'.github/workflows/forged.yml'}, {event:'pull_request'}, {head_branch:'feature'}, {head_sha:'invalid'}]) await assert.rejects(approvedRequest(api,run(10,overrides),OWNER));
  api.runs[0] = run(10,{display_title:`Specimen request pr=8 head=${SOURCE} recovery=0`});
  await assert.rejects(approvedRequest(api,retry,OWNER),/changed approved request/);
});

test('forged recovery roots, cycles and incomplete predecessors fail closed', async () => {
  const api = new API();
  await assert.rejects(approvedRequest(api,run(11,{actor:{id:BOT}}),OWNER),/no owner request/);
  await assert.rejects(approvedRequest(api,run(11,{display_title:`Specimen request pr=7 head=${SOURCE} recovery=10`}),OWNER),/owner request/);
  const retry = run(11,{actor:{id:BOT},display_title:`Specimen request pr=7 head=${SOURCE} recovery=11`});
  api.runs.push(retry);
  await assert.rejects(approvedRequest(api,retry,OWNER),/ancestry/);
  api.runs[0].status='in_progress';
  await assert.rejects(approvedRequest(api,run(12,{actor:{id:BOT},display_title:`Specimen request pr=7 head=${SOURCE} recovery=10`}),OWNER),/did not complete/);
});

test('lost dispatch responses retain bounded retry intent and use the original source', async () => {
  const api = new API();
  api.after = path=>{ if (path.endsWith('/dispatches')) throw new Error('response lost'); };
  await assert.rejects(recoverRequest(api,run(),ENV,{now:NOW,...dependencies}),/response lost/);
  assert.equal(api.comments.get(7).length,1);
  const receipt = JSON.parse(api.comments.get(7)[0].body.slice(COMMENT_MARKER.length));
  assert.equal(receipt.rootRun,10); assert.equal(receipt.digest,DIGEST); assert.equal(receipt.source,SOURCE);
  assert.equal(await recoverRequest(api,run(),ENV,{now:NOW+1000,...dependencies}),'cooldown');
  api.after=null;
  api.current='9'.repeat(40);
  for (const offset of [6,12]) assert.equal(await recoverRequest(api,run(),ENV,{now:NOW+offset*60000,...dependencies}),'dispatched');
  await assert.rejects(recoverRequest(api,run(),ENV,{now:NOW+18*60000,...dependencies}),/retry limit/);
  const dispatches = api.calls.filter(c=>c.path.endsWith('/dispatches'));
  assert.equal(dispatches.length,3);
  assert.ok(dispatches.every(c=>c.body.inputs.head_sha===SOURCE && c.body.inputs.recovery_run==='10'));
});

test('crash after durable intent but before dispatch remains discoverable and cooled down', async () => {
  const api = new API();
  api.after = (path,method)=>{if (path==='/issues/7/comments' && method==='POST') throw new Error('crashed after receipt');};
  await assert.rejects(recoverRequest(api,run(),ENV,{now:NOW,...dependencies}),/crashed/);
  api.after=null;
  assert.equal(await recoverRequest(api,run(),ENV,{now:NOW+1000,...dependencies}),'cooldown');
  assert.equal(api.calls.filter(c=>c.path.endsWith('/dispatches')).length,0);
  assert.equal(await recoverRequest(api,run(),ENV,{now:NOW+6*60000,...dependencies}),'dispatched');
});

test('accepted dispatch with lost response does not dispatch again while successor is running', async () => {
  const api = new API();
  api.after = path=>{
    if (!path.endsWith('/dispatches')) return;
    api.runs.push(run(11,{actor:{id:BOT},status:'queued',conclusion:null,display_title:`Specimen request pr=7 head=${SOURCE} recovery=10`}));
    throw new Error('lost after accepted');
  };
  await assert.rejects(recoverRequest(api,run(),ENV,{now:NOW,...dependencies}),/lost after/);
  api.after=null;
  assert.equal(await recoverRequest(api,run(),ENV,{now:NOW+6*60000,...dependencies}),'pending');
  assert.equal(api.calls.filter(c=>c.path.endsWith('/dispatches')).length,1);
});

test('editorial changes and withdrawn approvals prevent recovery without mutations', async () => {
  for (const change of ['body','closed','draft','fork','base','revoked','original']) {
    const api = new API();
    let collect=dependencies.collect;
    if (change==='body') { api.source.head.sha=HEAD; collect=(base,head)=>({editorialDigest:head===HEAD ? '1'.repeat(64) : DIGEST}); }
    if (change==='closed') api.source.state='closed';
    if (change==='draft') api.source.draft=true;
    if (change==='fork') api.source.head.repo.full_name='fork/site';
    if (change==='base') api.source.base.ref='feature';
    if (change==='revoked') api.reviews=[{id:2,user:{id:OWNER},state:'CHANGES_REQUESTED'},{id:1,user:{id:OWNER},state:'APPROVED'}];
    if (change==='original') collect=(base)=>({editorialDigest:base===BASE ? DIGEST : '1'.repeat(64)});
    await assert.rejects(recoverRequest(api,run(),ENV,{now:NOW,...dependencies,collect}));
    assert.deepEqual(api.mutations(),[],change);
  }
});

test('numbering-only source head changes preserve original approval and immutable retry input', async () => {
  const api = new API(); api.source.head.sha=HEAD;
  assert.equal(await recoverRequest(api,run(),ENV,{now:NOW,...dependencies}),'dispatched');
  assert.equal(api.mutations().at(-1).body.inputs.head_sha,SOURCE);
});

test('stale finalized predecessor remains open across dispatch and replacement preparation failure', async () => {
  const api = new API();
  assert.equal(await finalize(api,ENV,finalDependencies({recover:(a,r,e,d)=>recoverRequest(a,r,e,{now:NOW,...d})})),'dispatched');
  assert.equal(api.prs[0].state,'open');
  api.runs.push(run(11,{actor:{id:BOT},conclusion:'failure',head_sha:CURRENT,display_title:`Specimen request pr=7 head=${SOURCE} recovery=10`}));
  api.current='9'.repeat(40);
  await assert.rejects(prepare(api,{...ENV,PR_NUMBER:'7',SOURCE_SHA:SOURCE,GITHUB_SHA:CURRENT,GITHUB_EVENT_NAME:'workflow_dispatch',GITHUB_ACTOR_ID:String(BOT),GITHUB_RUN_ID:'11',RECOVERY_RUN:'10'}),/main advanced/);
  let reconciled=0;
  await sweep(api,ENV,{finalizeRun:async(a,e)=>{
    reconciled++; assert.equal(e.ADMISSION_RUN_ID,'10');
    return finalize(a,e,finalDependencies({recover:(a,r,e,d)=>recoverRequest(a,r,e,{now:NOW+6*60000,...d})}));
  }});
  assert.equal(reconciled,1); assert.equal(api.prs[0].state,'open');
  assert.ok(api.mutations().every(c=>c.method!=='PATCH'));
  assert.equal(api.mutations().filter(c=>c.path.endsWith('/dispatches')).length,2);
});

test('finalization rejects a forged source parent and original digest mismatch before merge', async () => {
  const api = new API(); api.current=BASE;
  await assert.rejects(finalize(api,ENV,finalDependencies({readGit:()=>`${BASE} ${CURRENT}\n`})),/immutable approved source/);
  await assert.rejects(finalize(api,ENV,finalDependencies({proofFor:async()=>({editorialDigest:'1'.repeat(64)})})),/approved content/);
  assert.deepEqual(api.mutations(),[]);
});

test('merge followed by deployment-dispatch failure is recovered from the already merged PR', async () => {
  const api = new API(); api.current=BASE;
  api.before = path=>{if (path.endsWith('deploy-pages.yml/dispatches')) throw new Error('dispatch unavailable');};
  await assert.rejects(finalize(api,ENV,finalDependencies({deploy:(a,p)=>reconcileDeployment(a,p,{now:NOW})})),/dispatch unavailable/);
  assert.equal(api.prs[0].merged,true);
  assert.equal(api.calls.filter(c=>c.path==='/pulls/100/merge').length,1);
  api.before=null;
  assert.equal(await finalize(api,ENV,finalDependencies({deploy:(a,p)=>reconcileDeployment(a,p,{now:NOW+6*60000})})),'dispatched');
  assert.equal(api.calls.filter(c=>c.path==='/pulls/100/merge').length,1);
  api.deployRuns=[deployRun()];
  assert.equal(await finalize(api,ENV,finalDependencies()),'deployed');
});

test('merged PR fast path still authenticates the run, generated PR and exact merge tree', async () => {
  const api = new API(); api.prs[0]=generatedPR({merged:true,state:'closed',merge_commit_sha:MERGE});
  for (const mutate of [()=>{api.prs[0].user.id=99;},()=>{api.prs[0].head.ref='forged';}]) {
    api.prs[0]=generatedPR({merged:true,state:'closed',merge_commit_sha:MERGE}); mutate();
    await assert.rejects(finalize(api,ENV,finalDependencies()),/identity mismatch|exactly one/);
  }
  api.prs[0]=generatedPR({merged:true,state:'closed',merge_commit_sha:MERGE});
  await assert.rejects(finalize(api,ENV,finalDependencies({readGit:(...args)=>args.includes('--format=%P') ? (args.at(-1)===MERGE ? `${CURRENT} ${HEAD}\n` : `${BASE} ${SOURCE}\n`) : 'Workflow admission of PR #7\n'})),/merge does not contain/);
  assert.deepEqual(api.mutations(),[]);
});

test('deployment reconciliation accepts verified descendant push deploys and retries cancelled or failed runs', async () => {
  const api = new API(); const pr=generatedPR({merged:true,merge_commit_sha:MERGE});
  api.deployRuns=[deployRun(200,{head_sha:CURRENT,event:'push',path:'.github/workflows/deploy-pages.yml@main'})];
  assert.equal(await reconcileDeployment(api,pr,{now:NOW}),'deployed'); assert.deepEqual(api.mutations(),[]);
  api.deployRuns=[deployRun(201,{head_sha:CURRENT,status:'in_progress',conclusion:null})];
  assert.equal(await reconcileDeployment(api,pr,{now:NOW}),'pending');
  api.deployRuns=[deployRun(202,{head_sha:CURRENT,conclusion:'cancelled'}),deployRun(203,{conclusion:'failure'})];
  assert.equal(await reconcileDeployment(api,pr,{now:NOW}),'dispatched');
  assert.equal(api.mutations().at(-1).body.ref,'main');
});

test('wrong repository/workflow/branch/event or unrelated successful deploy cannot satisfy reconciliation', async () => {
  const api = new API(); const pr=generatedPR({merged:true,merge_commit_sha:MERGE});
  api.deployRuns=[deployRun(200,{repository:{full_name:'fork/site'}}),deployRun(201,{path:'.github/workflows/forged.yml'}),deployRun(202,{head_branch:'feature'}),deployRun(203,{event:'pull_request'}),deployRun(204,{head_repository:{full_name:'fork/site'}}),deployRun(205,{head_sha:HEAD})];
  api.comparisons.set(`${MERGE}:${HEAD}`,{status:'diverged',merge_base_commit:{sha:BASE}});
  assert.equal(await reconcileDeployment(api,pr,{now:NOW}),'dispatched');
  const invalid = new API(); invalid.comparisons.set(`${MERGE}:${CURRENT}`,{status:'diverged',merge_base_commit:{sha:BASE}});
  await assert.rejects(reconcileDeployment(invalid,pr,{now:NOW}),/no longer in main/);
  assert.deepEqual(invalid.mutations(),[]);
});

test('sweep discovers failed/cancelled/no-PR requests and reconciles one action per source', async () => {
  const api = new API(); api.prs=[];
  api.runs=[run(10,{conclusion:'failure'}),run(11,{actor:{id:BOT},conclusion:'cancelled',display_title:`Specimen request pr=7 head=${SOURCE} recovery=10`}),run(12,{conclusion:'failure',display_title:`Specimen request pr=8 head=${HEAD} recovery=0`}),run(13,{actor:{id:999}})];
  const recovered=[];
  await sweep(api,ENV,{recover:async(_api,r)=>recovered.push(r.id),finalizeRun:async()=>assert.fail('no generated PR')});
  assert.deepEqual(recovered,[11,12]);
});

test('an explicit new owner request restores a fresh bounded retry lineage', async () => {
  const api = new API();
  api.runs.push(run(20,{conclusion:'failure'}));
  const recovered=[];
  await sweep(api,ENV,{recover:async(_api,r)=>recovered.push(r.id),finalizeRun:async()=>assert.fail('earlier owner request must not consume fresh retry budget')});
  assert.deepEqual(recovered,[20]);
});

test('merged successor takes priority over stale predecessors and failed attempts', async () => {
  const api = new API();
  api.runs.push(run(11,{actor:{id:BOT},display_title:`Specimen request pr=7 head=${SOURCE} recovery=10`}),run(12,{actor:{id:BOT},conclusion:'failure',display_title:`Specimen request pr=7 head=${SOURCE} recovery=11`}));
  api.prs.push(generatedPR({number:101,head:{sha:HEAD,ref:'specimens/run-11',repo:{full_name:REPO}},state:'closed',merged_at:'2026-10-05T12:00:00Z',merge_commit_sha:MERGE}));
  const finalized=[];
  await sweep(api,ENV,{finalizeRun:async(_api,e)=>finalized.push(e.ADMISSION_RUN_ID),recover:async()=>assert.fail('merged admission must not allocate again')});
  assert.deepEqual(finalized,['11']);
});

function gitFixture(t) {
  const dir=mkdtempSync(join(tmpdir(),'specimen-recovery-test-'));
  const exec=(...args)=>execFileSync('git',args,{cwd:dir,encoding:'utf8'}).trim();
  exec('init','-q','-b','main'); exec('config','user.name','Test'); exec('config','user.email','test@example.invalid');
  mkdirSync(join(dir,'src/content/posts'),{recursive:true}); mkdirSync(join(dir,'.github/workflows'),{recursive:true});
  writeFileSync(join(dir,'.github/workflows/specimen-admission.yml'),'name: Trusted fixture admission\n');
  writeFileSync(join(dir,'src/content/specimen-ledger.txt'),'0001 old\n');
  const article=(number='',body='Original editorial body')=>`---\ntitle: Useful story\npubDate: "2026-10-05T12:00:00Z"\n${number}section: models\ndraft: false\n---\n\n${body}\n`;
  writeFileSync(join(dir,'src/content/posts/old.md'),article('specimen: 1\n'));
  exec('add','.'); exec('commit','-qm','baseline'); const base=exec('rev-parse','HEAD');
  exec('switch','-qc','source'); writeFileSync(join(dir,'src/content/posts/new.md'),article('specimen: 999\n')); exec('add','.'); exec('commit','-qm','source'); const source=exec('rev-parse','HEAD');
  exec('switch','-q','main'); writeFileSync(join(dir,'README.md'),'independent main change\n'); exec('add','.'); exec('commit','-qm','main advance'); const current=exec('rev-parse','HEAD');
  const previous=process.cwd(); process.chdir(dir); t.after(()=>process.chdir(previous));
  // Retain disposable fixture bytes as evidence; never remove shared repository data.
  return {dir,exec,base,source,current,article};
}

test('isolated Git: concurrent main changes recompute safely while immutable editorial approval stays bound', async t => {
  const fixture=gitFixture(t);
  const original=collectAdmission(fixture.base,fixture.source);
  const recomputed=collectAdmission(fixture.current,fixture.source);
  assert.equal(original.editorialDigest,recomputed.editorialDigest);
  const api = new API(); api.current=fixture.current; api.runs=[run(10,{head_sha:fixture.base,display_title:`Specimen request pr=7 head=${fixture.source} recovery=0`})]; api.source=sourcePR({head:{sha:fixture.source,repo:{full_name:REPO}}});
  assert.equal(await recoverRequest(api,api.runs[0],ENV,{now:NOW,fetchCommits:()=>{}}),'dispatched');
  assert.equal(api.mutations().at(-1).body.inputs.head_sha,fixture.source);
  fixture.exec('switch','-q','source'); writeFileSync(join(fixture.dir,'src/content/posts/new.md'),fixture.article('specimen: 1000\n','Changed editorial body')); fixture.exec('add','.'); fixture.exec('commit','-qm','changed editorial body'); api.source.head.sha=fixture.exec('rev-parse','HEAD');
  const count=api.mutations().length;
  await assert.rejects(recoverRequest(api,api.runs[0],ENV,{now:NOW+6*60000,fetchCommits:()=>{}}),/editorial content changed/);
  assert.equal(api.mutations().length,count);
});

test('isolated Git: request code/base outside main ancestry cannot authorize recovery', async t => {
  const fixture=gitFixture(t);
  fixture.exec('switch','--orphan','forged'); writeFileSync(join(fixture.dir,'forged.txt'),'unrelated request code\n'); fixture.exec('add','.'); fixture.exec('commit','-qm','unrelated code');
  const unrelated=fixture.exec('rev-parse','HEAD');
  const api = new API(); api.current=fixture.current; api.runs=[run(10,{head_sha:unrelated,display_title:`Specimen request pr=7 head=${fixture.source} recovery=0`})]; api.source=sourcePR({head:{sha:fixture.source,repo:{full_name:REPO}}});
  await assert.rejects(recoverRequest(api,api.runs[0],ENV,{now:NOW,fetchCommits:()=>{}}));
  assert.deepEqual(api.mutations(),[]);
});


test('GitHub history streams beyond 1,000 items and unfiltered run reads avoid the search cap', async () => {
  const calls=[];
  const client=new GitHub(REPO,'',async address=>{
    const url=new URL(address); calls.push(url);
    assert.equal(url.searchParams.has('event'),false);
    const start=(Number(url.searchParams.get('page'))-1)*100;
    const items=Array.from({length:Math.min(100,1201-start)},(_,i)=>({id:start+i+1}));
    const data=url.pathname.endsWith('/runs') ? {workflow_runs:items} : items;
    return new Response(JSON.stringify(data),{status:200});
  });
  assert.equal((await client.list('/pulls?state=all')).length,1201);
  assert.equal((await client.list('/actions/workflows/specimen-admission.yml/runs','workflow_runs')).at(-1).id,1201);
  assert.equal(calls.length,26);
  calls.length=0;
  for await (const item of client.iterate('/actions/workflows/deploy-pages.yml/runs','workflow_runs')) { assert.equal(item.id,1); break; }
  assert.equal(calls.length,1);
});

test('a repeated API page reports incomplete discovery instead of silently retiring history', async () => {
  const client=new GitHub(REPO,'',async()=>new Response(JSON.stringify(Array.from({length:100},(_,id)=>({id}))),{status:200}));
  await assert.rejects(client.list('/pulls?state=all'),/repeated a page/);
});

function completionFixture() {
  const api=new API();
  api.prs[0]=generatedPR({state:'closed',merged:true,merged_at:'2026-10-05T12:00:00Z',merge_commit_sha:MERGE});
  api.deployRuns=[deployRun(200,{head_sha:CURRENT})];
  api.checks=[{name:'specimen-integrity',head_sha:HEAD,status:'completed',conclusion:'success',app:{id:15368},external_id:`${REPO}:${BASE}:${HEAD}:${DIGEST}:10`,details_url:`https://github.com/${REPO}/actions/runs/10`}];
  api.commits.set(HEAD,{sha:HEAD,parents:[{sha:BASE},{sha:SOURCE}],tree:{sha:'1'.repeat(40)}});
  api.commits.set(MERGE,{sha:MERGE,parents:[{sha:BASE},{sha:HEAD}],tree:{sha:'1'.repeat(40)}});
  const receipt={kind:'completed',merge:MERGE,admissionRun:10,head:HEAD,base:BASE,rootRun:10,source:SOURCE,digest:DIGEST,deploymentRun:200,deploymentHead:CURRENT,time:new Date(NOW).toISOString()};
  api.comments.set(100,[{id:1,user:{id:BOT},body:COMMENT_MARKER+JSON.stringify(receipt)}]);
  return {api,receipt};
}

test('terminal completion comments retire expensive work only with actual admission/merge/deploy proof', async () => {
  const {api}=completionFixture();
  const request=await approvedRequest(api,api.runs[0],OWNER);
  assert.equal(await terminalCompletion(api,api.prs[0],api.runs[0],request,OWNER),true);
  await sweep(api,ENV,{finalizeRun:async()=>assert.fail('verified completed request must not rerun Git collection'),recover:async()=>assert.fail('verified completed request must not allocate again')});
  assert.deepEqual(api.mutations(),[]);
  for (const change of ['deploy-failure','deploy-fork','merge-tree','digest','comment-actor']) {
    const {api,receipt}=completionFixture();
    if (change==='deploy-failure') api.deployRuns[0].conclusion='failure';
    if (change==='deploy-fork') api.deployRuns[0].repository.full_name='fork/site';
    if (change==='merge-tree') api.commits.get(MERGE).tree.sha='2'.repeat(40);
    if (change==='digest') {receipt.digest='1'.repeat(64); api.comments.get(100)[0].body=COMMENT_MARKER+JSON.stringify(receipt);}
    if (change==='comment-actor') api.comments.get(100)[0].user.id=999;
    assert.equal(await terminalCompletion(api,api.prs[0],api.runs[0],request,OWNER),false,change);
  }
});

test('actual deployment success writes an idempotent completion locator and preserves failed receipts', async () => {
  const api=new API(); const pr=generatedPR({merged:true,merge_commit_sha:MERGE});
  api.deployRuns=[deployRun(200,{head_sha:CURRENT})];
  api.comments.set(100,[{id:1,user:{id:BOT},body:COMMENT_MARKER+JSON.stringify({kind:'deploy',merge:MERGE,time:new Date(NOW-600000).toISOString()})}]);
  const completion={admissionRun:10,base:BASE,head:HEAD,rootRun:10,source:SOURCE,digest:DIGEST};
  assert.equal(await reconcileDeployment(api,pr,{now:NOW,completion}),'deployed');
  assert.equal(await reconcileDeployment(api,pr,{now:NOW+1000,completion}),'deployed');
  assert.equal(api.comments.get(100).length,2);
  const stored=JSON.parse(api.comments.get(100)[1].body.slice(COMMENT_MARKER.length));
  assert.equal(stored.deploymentRun,200); assert.equal(stored.deploymentHead,CURRENT);
});

test('old unresolved pre-PR requests remain discoverable beyond a thousand newer runs', async () => {
  const api=new API(); api.prs=[];
  api.runs=[...Array.from({length:1200},(_,i)=>run(i+100,{actor:{id:999}})),run(10,{conclusion:'cancelled'})];
  api.iterate=async function* (path,key) { yield* await this.list(path,key); };
  const recovered=[];
  await sweep(api,ENV,{recover:async(_api,r)=>recovered.push(r.id)});
  assert.deepEqual(recovered,[10]);
});

import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { approvedRequest, admissionProof, collectAdmission, certify, discoverApprovedRequests, finalize, materialize, observePaths, prepare, recoverRequest, requestOf, sweep, terminalCompletion } from './specimen-admission.mjs';
import { stripSpecimen } from './specimen-admission-data.mjs';

const REPO='owner/site', OWNER=42, ACTIONS=41898282, BOT=334982782;
const DATE='2026-10-08T11:00:00Z';
const article=(number='',body='Original editorial bytes')=>`---\ntitle: A useful story\npubDate: "${DATE}"\n${number}section: models\ndraft: false\nsources:\n  - https://example.com/primary\n---\n\n${body}\n`;
const dependencies={fetchCommits:()=>{}};

// Real immutable Git trees/commits behind a mocked GitHub transport. These are
// run-owned fixture repositories, never application posts or permanent ledgers.
function fixture(t) {
  const cwd=mkdtempSync(join(tmpdir(),'specimen-same-pr-'));
  const git=(...args)=>execFileSync('git',args,{cwd,encoding:'utf8'}).trim();
  git('init','-q','-b','main');git('config','user.name','Fixture');git('config','user.email','fixture@example.invalid');
  mkdirSync(join(cwd,'src/content/posts'),{recursive:true});mkdirSync(join(cwd,'.github/workflows'),{recursive:true});
  writeFileSync(join(cwd,'.github/workflows/specimen-admission.yml'),'name: Trusted fixture\n');
  writeFileSync(join(cwd,'src/content/specimen-ledger.txt'),'# Retained history\n0007 old\n');
  writeFileSync(join(cwd,'src/content/posts/old.md'),article('specimen: 7\n'));
  git('add','.');git('commit','-qm','baseline');const base=git('rev-parse','HEAD');
  const oldcwd=process.cwd();process.chdir(cwd);t.after(()=>process.chdir(oldcwd));
  const f={cwd,git,base,sequence:0};
  f.tree=(baseTree,entries)=>{
    const env={...process.env,GIT_INDEX_FILE:join(cwd,`fixture-index-${++f.sequence}`)};
    const command=(args,input)=>execFileSync('git',args,{cwd,env,encoding:'utf8',input}).trim();
    if(baseTree) command(['read-tree',baseTree]);
    for(const entry of entries) {
      const hash=command(['hash-object','-w','--stdin'],entry.content);
      command(['update-index','--add','--cacheinfo',entry.mode,hash,entry.path]);
    }
    return command(['write-tree']);
  };
  f.commit=(tree,parents,message)=>execFileSync('git',['commit-tree',tree,...parents.flatMap(parent=>['-p',parent]),'-m',message],{cwd,encoding:'utf8'}).trim();
  f.source=f.commit(f.tree(git('rev-parse',`${base}^{tree}`),[
    {path:'src/content/posts/old.md',mode:'100644',content:article('specimen: -999\n')},
    {path:'src/content/posts/new.md',mode:'100644',content:article('specimen: "fake"\n')},
    {path:'src/content/specimen-ledger.txt',mode:'100644',content:'9999 invented\n'},
  ]),[base],'producer submission');
  f.run=(id=10,overrides={})=>({id,path:'.github/workflows/specimen-admission.yml',event:'workflow_dispatch',head_branch:'main',head_sha:base,actor:{id:ACTIONS},repository:{full_name:REPO},head_repository:{full_name:REPO},status:'completed',conclusion:'success',display_title:`Specimen same-pr pr=7 head=${f.source} review=1 recovery=0`,...overrides});
  f.env={GITHUB_SHA:base,GITHUB_REF:'refs/heads/main',GITHUB_EVENT_NAME:'workflow_dispatch',GITHUB_ACTOR_ID:String(ACTIONS),GITHUB_RUN_ID:'10',MAINTAINER_ID:String(OWNER),PR_NUMBER:'7',SOURCE_SHA:f.source,SAME_PR:'true',REVIEW_ID:'1'};
  f.api=new API(f);
  return f;
}
class API {
  constructor(f) {
    this.f=f;this.repo=REPO;this.current=f.base;this.calls=[];this.runs=[f.run()];this.checks=[];this.comments=[];
    this.pr={number:7,state:'open',draft:false,created_at:'2026-10-05T12:00:00Z',head:{sha:f.source,ref:'grok/article',repo:{full_name:REPO}},base:{ref:'main',repo:{full_name:REPO}}};
    this.reviews=[{id:1,user:{id:OWNER},state:'APPROVED',commit_id:f.source}];
    this.before=null;this.after=null;
  }
  async request(path,method='GET',body) {
    this.calls.push({path,method,body});if(this.before) await this.before(path,method,body);
    let result;
    if(path==='/git/ref/heads/main') result={object:{sha:this.current}};
    else if(path==='/pulls/7') result=this.pr;
    else if(path.startsWith('/actions/runs/')) result=this.runs.find(run=>run.id===Number(path.split('/').at(-1)));
    else if(path.startsWith('/git/commits/')) {
      const hash=path.split('/').at(-1);
      result={sha:hash,tree:{sha:this.f.git('show','-s','--format=%T',hash)},parents:this.f.git('show','-s','--format=%P',hash).split(' ').filter(Boolean).map(sha=>({sha})),message:this.f.git('show','-s','--format=%B',hash)};
    } else if(path==='/git/trees' && method==='POST') result={sha:this.f.tree(body.base_tree,body.tree)};
    else if(path==='/git/commits' && method==='POST') result={sha:this.f.commit(body.tree,body.parents,body.message)};
    else if(path.startsWith('/git/refs/heads/') && method==='PATCH') {
      assert.equal(body.force,false);this.f.git('merge-base','--is-ancestor',this.pr.head.sha,body.sha);this.pr.head.sha=body.sha;result={object:{sha:body.sha}};
    } else if(path==='/issues/7/labels') {this.pr.labels=body.labels.map(name=>({name}));result=this.pr.labels;}
    else if(path==='/check-runs') {result={id:this.checks.length+1,app:{id:15368},...body};this.checks.push(result);}
    else if(path==='/issues/7/comments' && method==='POST') {result={id:this.comments.length+1,user:{id:BOT},body:body.body};this.comments.push(result);}
    else if(path.endsWith('/dispatches')) result=null;
    else if(path==='/rules/branches/main') result=[{type:'required_status_checks',parameters:{strict_required_status_checks_policy:true,required_status_checks:['check','publisher-paths','specimen-integrity'].map(context=>({context,integration_id:15368}))}}];
    else if(path==='/pulls/7/merge') {
      assert.equal(body.sha,this.pr.head.sha);assert.equal(body.merge_method,'merge');
      const proof=this.checks.find(check=>check.name==='specimen-integrity' && check.head_sha===body.sha);
      assert.equal(proof.external_id.split(':')[1],this.current,'server strict base check');
      this.current=this.f.commit(this.f.git('show','-s','--format=%T',body.sha),[this.current,body.sha],'server merge');
      Object.assign(this.pr,{state:'closed',merged:true,merged_at:'2026-10-05T12:01:00Z',merge_commit_sha:this.current});result={merged:true,sha:this.current};
    } else if(path.startsWith('/compare/')) {
      const [base,head]=path.slice('/compare/'.length).split('...');
      const ancestor=this.f.git('merge-base',base,head);result={merge_base_commit:{sha:ancestor},status:ancestor===base ? 'ahead':'diverged'};
    } else throw new Error(`Unexpected fixture API ${method} ${path}`);
    if(result===undefined) throw new Error(`Missing fixture ${path}`);
    if(this.after) await this.after(path,method,body);
    return structuredClone(result);
  }
  async list(path) {
    this.calls.push({path,method:'LIST'});
    if(path==='/pulls/7/reviews') return structuredClone(this.reviews);
    if(path==='/pulls?state=open&sort=created&direction=asc') return this.pr.state==='open' ? [structuredClone(this.pr)] : [];
    if(path==='/actions/workflows/specimen-admission.yml/runs') return structuredClone(this.runs);
    if(path.startsWith('/commits/') && path.endsWith('/check-runs')) return structuredClone(this.checks.filter(check=>check.head_sha===path.split('/')[2]));
    if(path==='/issues/7/comments') return structuredClone(this.comments);
    throw new Error(`Unexpected fixture list ${path}`);
  }
  mutations() {return this.calls.filter(call=>!['GET','LIST'].includes(call.method));}
}

test('same-PR requests require actual exact owner review; forged actor, wake and label cannot authorize',async t=>{
  const f=fixture(t);
  assert.equal((await approvedRequest(f.api,f.run(),OWNER)).source,f.source);
  assert.deepEqual(requestOf(f.run()),{pr:7,source:f.source,review:1,recovery:0,samePR:true});
  for(const mutate of [api=>api.reviews[0].user.id=999,api=>api.reviews[0].commit_id=f.base,api=>api.reviews[0].state='DISMISSED',api=>api.reviews.push({id:2,user:{id:OWNER},state:'CHANGES_REQUESTED',commit_id:f.source})]) {
    const api=new API(f);mutate(api);await assert.rejects(approvedRequest(api,f.run(),OWNER),/approval/);assert.deepEqual(api.mutations(),[]);
  }
  await assert.rejects(approvedRequest(f.api,f.run(10,{event:'pull_request_review'}),OWNER),/ancestry/);
  await assert.rejects(approvedRequest(f.api,f.run(10,{actor:{id:999}}),OWNER),/ancestry/);
  const api=new API(f);api.reviews=[];api.pr.labels=[{name:'workflow-numbering'}];
  assert.equal(await discoverApprovedRequests(api,{...f.env,GITHUB_ACTOR_ID:String(OWNER),REVIEW_ID:'1',SOURCE_SHA:f.source},dependencies),'idle');assert.deepEqual(api.mutations(),[]);
});

test('automatic owner approval dispatches once and queued/cancelled attempts remain in existing recovery',async t=>{
  const f=fixture(t);f.api.runs=[];
  assert.equal(await discoverApprovedRequests(f.api,f.env,dependencies),'dispatched');
  const dispatch=f.api.mutations().at(-1);assert.deepEqual(dispatch.body.inputs,{pr_number:'7',head_sha:f.source,review_id:'1',same_pr:'true',recovery_run:'0'});
  f.api.runs=[f.run(10,{status:'queued',conclusion:null})];
  assert.equal(await discoverApprovedRequests(f.api,f.env,{...dependencies,knownRuns:f.api.runs}),'pending');
  f.api.runs[0].status='completed';f.api.runs[0].conclusion='cancelled';
  assert.equal(await discoverApprovedRequests(f.api,f.env,{...dependencies,pending:[{id:10,status:'pending',reason:''}]}),'idle');
  assert.equal(f.api.mutations().filter(call=>call.path.endsWith('/dispatches')).length,1);
  assert.equal(await recoverRequest(f.api,f.api.runs[0],f.env,{...dependencies,now:Date.parse('2026-10-05T12:00:00Z')}),'dispatched');
  assert.equal(f.api.mutations().at(-1).body.inputs.head_sha,f.source);assert.equal(f.api.mutations().at(-1).body.inputs.review_id,'1');
});

test('closed, draft, fork, moved, stale and non-owner reviews do not launch automatic admission',async t=>{
  const f=fixture(t);
  for(const mutate of [api=>api.pr.state='closed',api=>api.pr.draft=true,api=>api.pr.head.repo.full_name='fork/site',api=>api.pr.base.ref='feature',api=>api.reviews[0].commit_id=f.base,api=>api.reviews[0].user.id=999,api=>api.reviews[0].state='DISMISSED']) {
    const api=new API(f);api.runs=[];mutate(api);
    assert.equal(await discoverApprovedRequests(api,f.env,dependencies),'idle');assert.deepEqual(api.mutations(),[]);
  }
});

test('workflow numbers and repairs original bot PR only, retaining dates, editorial bytes and main ledger',async t=>{
  const f=fixture(t);await prepare(f.api,f.env,dependencies);
  const head=f.api.pr.head.sha,plan=collectAdmission(f.base,f.source);
  assert.notEqual(head,f.source);assert.equal(f.git('show','-s','--format=%P',head),`${f.base} ${f.source}`);
  assert.equal(f.git('show',`${head}:src/content/specimen-ledger.txt`),'# Retained history\n0007 old\n0008 new');
  assert.match(f.git('show',`${head}:src/content/posts/old.md`),/specimen: 7\n/);
  assert.match(f.git('show',`${head}:src/content/posts/new.md`),/specimen: 8\n/);
  for(const slug of ['old','new']) {
    assert.equal(stripSpecimen(f.git('show',`${head}:src/content/posts/${slug}.md`)+'\n').text,stripSpecimen(f.git('show',`${f.source}:src/content/posts/${slug}.md`)+'\n').text);
    assert.match(f.git('show',`${head}:src/content/posts/${slug}.md`),new RegExp(DATE));
  }
  assert.equal(f.api.mutations().some(call=>call.path==='/pulls' || call.path==='/git/refs'),false);
  assert.ok(f.api.mutations().findIndex(call=>call.path==='/issues/7/labels')<f.api.mutations().findIndex(call=>call.method==='PATCH'));
  const writes=new Map();materialize({...f.env,GITHUB_ACTIONS:'true',BASE_SHA:f.base,HEAD_SHA:head,OBSERVED_HEAD:f.source,EDITORIAL_DIGEST:plan.editorialDigest},{...dependencies,write:(path,text)=>writes.set(path,text)});
  assert.equal(writes.get('src/content/specimen-ledger.txt'),plan.ledgerText);
});

test('normal same-PR merge needs full exact certificate and deploys even after source closes',async t=>{
  const f=fixture(t);await prepare(f.api,f.env,dependencies);
  const head=f.api.pr.head.sha,digest=collectAdmission(f.base,f.source).editorialDigest;
  await assert.rejects(admissionProof(f.api,f.base,head,OWNER),/no successful/);
  await certify(f.api,{...f.env,BASE_SHA:f.base,HEAD_SHA:head,EDITORIAL_DIGEST:digest});
  assert.equal((await admissionProof(f.api,f.base,head,OWNER,10)).editorialDigest,digest);
  assert.equal(await finalize(f.api,{...f.env,ADMISSION_RUN_ID:'10'},{...dependencies,deploy:async()=> 'deployed'}),'deployed');
  assert.equal(f.api.pr.number,7);assert.equal(f.api.pr.state,'closed');
  assert.equal(f.api.mutations().filter(call=>call.path==='/pulls/7/merge').length,1);
  assert.equal(await finalize(f.api,{...f.env,ADMISSION_RUN_ID:'10'},{...dependencies,deploy:async()=> 'deployed'}),'deployed');
});

test('changed editorial body requires new review while numbering-only head retains original approval',async t=>{
  const f=fixture(t);await prepare(f.api,f.env,dependencies);const numbered=f.api.pr.head.sha;
  assert.equal((await approvedRequest(f.api,f.run(),OWNER)).source,f.source);
  const changedTree=f.tree(f.git('show','-s','--format=%T',numbered),[{path:'src/content/posts/new.md',mode:'100644',content:article('specimen: 8\n','Changed editorial bytes')}]);
  f.api.pr.head.sha=f.commit(changedTree,[numbered],'producer changed body');
  const count=f.api.mutations().length;
  await assert.rejects(recoverRequest(f.api,f.run(),f.env,dependencies),/editorial content changed/);assert.equal(f.api.mutations().length,count);
  f.api.pr.head.sha=numbered;f.api.reviews.push({id:2,user:{id:OWNER},state:'CHANGES_REQUESTED',commit_id:numbered});
  await assert.rejects(recoverRequest(f.api,f.run(),f.env,dependencies),/approval withdrawn/);
});

test('source push before numbering CAS and main advance refuse writes without force or replacement PR',async t=>{
  const f=fixture(t);
  f.api.before=(path,method)=>{if(path==='/git/commits' && method==='POST') f.api.pr.head.sha=f.base;};
  await assert.rejects(prepare(f.api,f.env,dependencies),/editorial|head or main changed/);
  assert.ok(!f.api.mutations().some(call=>call.method==='PATCH' || call.path==='/pulls'));
  f.api.before=null;f.api.pr.head.sha=f.source;
  f.api.before=(path,method)=>{if(path.startsWith('/git/refs/heads/') && method==='PATCH') {
    const tree=f.tree(f.git('show','-s','--format=%T',f.source),[{path:'README.md',mode:'100644',content:'concurrent producer push'}]);
    f.api.pr.head.sha=f.commit(tree,[f.source],'concurrent producer');
  }};
  await assert.rejects(prepare(f.api,f.env,dependencies));
  assert.ok(f.api.mutations().filter(call=>call.method==='PATCH').every(call=>call.body.force===false));
  const api=new API(f);api.current=f.source;await assert.rejects(prepare(api,f.env,dependencies),/main advanced/);assert.deepEqual(api.mutations(),[]);
});

test('lost numbering response and failed validation reuse same deterministic head without no-op commits',async t=>{
  const f=fixture(t);
  f.api.after=(path,method)=>{if(path.startsWith('/git/refs/heads/') && method==='PATCH') throw new Error('accepted write response lost');};
  await assert.rejects(prepare(f.api,f.env,dependencies),/response lost/);const head=f.api.pr.head.sha;
  f.api.after=null;const commits=f.api.mutations().filter(call=>call.path==='/git/commits').length;
  await prepare(f.api,f.env,dependencies);await prepare(f.api,f.env,dependencies);
  assert.equal(f.api.pr.head.sha,head);assert.equal(f.api.mutations().filter(call=>call.path==='/git/commits').length,commits);
  f.api.runs[0].conclusion='failure';await assert.rejects(finalize(f.api,{...f.env,ADMISSION_RUN_ID:'10'},dependencies),/failed admission/);
  assert.ok(!f.api.mutations().some(call=>call.path==='/pulls/7/merge' || call.path==='/pulls'));
});

test('stale main recovery reallocates on same original PR carrying immutable source and owner review',async t=>{
  const f=fixture(t);await prepare(f.api,f.env,dependencies);const first=f.api.pr.head.sha,digest=collectAdmission(f.base,f.source).editorialDigest;
  await certify(f.api,{...f.env,BASE_SHA:f.base,HEAD_SHA:first,EDITORIAL_DIGEST:digest});
  const otherTree=f.tree(f.git('show','-s','--format=%T',f.base),[
    {path:'src/content/posts/other.md',mode:'100644',content:article('specimen: 8\n')},
    {path:'src/content/specimen-ledger.txt',mode:'100644',content:'# Retained history\n0007 old\n0008 other\n'},
  ]);
  const current=f.commit(otherTree,[f.base],'independent approved article');f.api.current=current;
  assert.equal(await finalize(f.api,{...f.env,ADMISSION_RUN_ID:'10'},{...dependencies,recover:(api,run,env,options)=>recoverRequest(api,run,env,{...options,...dependencies,now:Date.parse('2026-10-05T12:00:00Z')})}),'dispatched');
  f.api.runs.push(f.run(11,{head_sha:current,display_title:`Specimen same-pr pr=7 head=${f.source} review=1 recovery=10`}));
  const env={...f.env,GITHUB_SHA:current,GITHUB_RUN_ID:'11',RECOVERY_RUN:'10'};
  await prepare(f.api,env,dependencies);const second=f.api.pr.head.sha;
  assert.equal(f.git('show','-s','--format=%P',second),`${current} ${first}`);
  assert.match(f.git('show',`${second}:src/content/posts/new.md`),/specimen: 9\n/);
  assert.equal(f.git('show',`${second}:src/content/specimen-ledger.txt`),'# Retained history\n0007 old\n0008 other\n0009 new');
  const writes=new Map();materialize({...env,GITHUB_ACTIONS:'true',BASE_SHA:current,HEAD_SHA:second,OBSERVED_HEAD:first,EDITORIAL_DIGEST:digest},{...dependencies,write:(path,text)=>writes.set(path,text)});
  await certify(f.api,{...env,BASE_SHA:current,HEAD_SHA:second,EDITORIAL_DIGEST:digest});
  assert.equal(await finalize(f.api,{...env,ADMISSION_RUN_ID:'11'},{...dependencies,deploy:async()=> 'deployed'}),'deployed');
  assert.ok(!f.api.mutations().some(call=>call.path==='/pulls' || call.path==='/git/refs'));
});

test('owner-authored exceptional dispatch uses same PR; an Actions actor cannot claim review zero',async t=>{
  const f=fixture(t);f.api.reviews=[];
  const ownerRun=f.run(10,{actor:{id:OWNER},display_title:`Specimen same-pr pr=7 head=${f.source} review=0 recovery=0`});
  assert.equal((await approvedRequest(f.api,ownerRun,OWNER)).source,f.source);
  await assert.rejects(approvedRequest(f.api,{...ownerRun,actor:{id:ACTIONS}},OWNER),/owner dispatch/);
});

test('untrusted source workflow/package/code changes cannot enter privileged preparation',async t=>{
  const f=fixture(t);
  for(const path of ['package.json','.github/workflows/specimen-admission.yml','scripts/malicious.mjs','src/content/posts/attack.mdx']) {
    const source=f.commit(f.tree(f.git('show','-s','--format=%T',f.base),[{path,mode:'100644',content:'malicious input'}]),[f.base],'unsafe submission');
    const api=new API(f);api.pr.head.sha=source;api.reviews[0].commit_id=source;api.runs=[f.run(10,{display_title:`Specimen same-pr pr=7 head=${source} review=1 recovery=0`})];
    await assert.rejects(prepare(api,{...f.env,SOURCE_SHA:source},dependencies),/outside admission lane/);assert.deepEqual(api.mutations(),[]);
  }
});

test('same-PR forged App checks, stale base and failed run never establish admission proof',async t=>{
  const f=fixture(t);await prepare(f.api,f.env,dependencies);const head=f.api.pr.head.sha,digest=collectAdmission(f.base,f.source).editorialDigest;
  await certify(f.api,{...f.env,BASE_SHA:f.base,HEAD_SHA:head,EDITORIAL_DIGEST:digest});
  const check=f.api.checks.find(check=>check.name==='specimen-integrity');
  check.app.id=5107739;await assert.rejects(admissionProof(f.api,f.base,head,OWNER),/no successful/);check.app.id=15368;
  await assert.rejects(admissionProof(f.api,f.source,head,OWNER),/no successful/);
  f.api.runs[0].conclusion='failure';await assert.rejects(admissionProof(f.api,f.base,head,OWNER),/no successful/);
  assert.ok(!f.api.mutations().some(call=>call.path==='/pulls/7/merge'));
});

test('same-PR indexed completion keeps legacy state schema and retires deployment once',async t=>{
  const f=fixture(t);await prepare(f.api,f.env,dependencies);const head=f.api.pr.head.sha,digest=collectAdmission(f.base,f.source).editorialDigest;
  await certify(f.api,{...f.env,BASE_SHA:f.base,HEAD_SHA:head,EDITORIAL_DIGEST:digest});
  await finalize(f.api,{...f.env,ADMISSION_RUN_ID:'10'},{...dependencies,deploy:async()=> 'deployed'});
  let state={schemaVersion:1,repository:REPO,policySHA:f.base,cursor:10,pending:[{id:10,status:'pending',reason:''}]};
  let proofs=0,writes=0;
  const index={load:async()=>({head:f.source,state:structuredClone(state)}),save:async(_api,_observed,next)=>{writes++;state=structuredClone(next);return{head:f.source,state:structuredClone(state)};}};
  await sweep(f.api,f.env,{...index,completed:async()=>{proofs++;return true;},finalizeRun:async()=>assert.fail('verified terminal witness is enough')});
  assert.equal(proofs,1);assert.equal(writes,1);assert.deepEqual(state.pending,[]);
  f.api.calls=[];await sweep(f.api,f.env,{...index,completed:async()=>assert.fail('retired proof must stay retired')});
  assert.equal(f.api.calls.length,2);assert.equal(writes,1);
});

test('revoked or superseded owner reviews become durable holds; transport failure remains pending',async t=>{
  const f=fixture(t);
  let state={schemaVersion:1,repository:REPO,policySHA:f.base,cursor:10,pending:[{id:10,status:'pending',reason:''}]};
  const index={load:async()=>({head:f.source,state:structuredClone(state)}),save:async(_api,_observed,next)=>{state=structuredClone(next);return{head:f.source,state:structuredClone(state)};}};
  f.api.reviews.push({id:2,user:{id:OWNER},state:'CHANGES_REQUESTED',commit_id:f.source});
  await assert.rejects(sweep(f.api,f.env,index),/protected state retained/);assert.equal(state.pending[0].status,'held');
  f.api.calls=[];await sweep(f.api,f.env,index);
  assert.ok(!f.api.calls.some(call=>call.path==='/actions/runs/10'),'withdrawn request skips further run proof');
  f.api.reviews.push({id:3,user:{id:OWNER},state:'APPROVED',commit_id:f.source});
  await sweep(f.api,f.env,index);assert.equal(f.api.mutations().at(-1).body.inputs.review_id,'3');
  assert.equal(state.pending[0].status,'held','fresh approval never erases obsolete evidence');
  state.pending[0].status='pending';state.pending[0].reason='';
  f.api.before=path=>{if(path==='/actions/runs/10'){const error=new Error('GitHub request unavailable');error.status=503;throw error;}};
  await assert.rejects(sweep(f.api,f.env,{...index,discover:async()=> 'idle'}),/protected state retained/);assert.equal(state.pending[0].status,'pending');
});

test('source path observations are read-only while unexpected code violations still fail',t=>{
  const f=fixture(t);const original=f.api.pr.head.sha;
  observePaths({BASE_SHA:f.base,HEAD_SHA:f.source},dependencies);
  assert.equal(f.api.pr.head.sha,original);assert.deepEqual(f.api.mutations(),[]);
  const unsafe=f.commit(f.tree(f.git('show','-s','--format=%T',f.source),[{path:'package.json',mode:'100644',content:'untrusted code'}]),[f.source],'unsafe');
  assert.throws(()=>observePaths({BASE_SHA:f.base,HEAD_SHA:unsafe},dependencies),/outside admission lane/);
});

import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { collectAdmission, independentLane, materialize, discoverApprovedRequests } from './specimen-admission.mjs';

const repo='michelabboud/aitamer-news';
const cursor={user:{id:29182417,type:'User'},draft:false,head:{ref:'cursor/lesson',repo:{full_name:repo}},base:{ref:'main',repo:{full_name:repo}}};
test('Cursor publishing is automatic only for the owner-backed same-repository branch',()=>{
  assert.equal(independentLane(cursor,repo),'cursor');
  for (const change of [{user:{id:999,type:'User'}},{draft:true},{head:{ref:'cursor/lesson',repo:{full_name:'other/fork'}}},{head:{ref:'cursor/',repo:{full_name:repo}}},{base:{ref:'dev',repo:{full_name:repo}}}]) assert.equal(independentLane({...cursor,...change},repo),null);
});
function fixture(t){
  const previous=process.cwd(),dir=mkdtempSync(join(tmpdir(),'ari-bot-publishing-'));
  const git=(...args)=>execFileSync('git',args,{cwd:dir,encoding:'utf8',stdio:['ignore','pipe','pipe']}).trim();
  git('init');git('config','user.email','test@example.com');git('config','user.name','Test');
  const write=(path,bytes)=>{mkdirSync(dirname(join(dir,path)),{recursive:true});writeFileSync(join(dir,path),bytes);};
  write('src/content/specimen-ledger.txt','');git('add','.');git('commit','-m','base');const base=git('rev-parse','HEAD');
  process.chdir(dir);t.after(()=>process.chdir(previous));
  return {git,write,base,dir};
}
test('asset-only lesson kits are admitted and every binary byte is bound to the digest',t=>{
  const f=fixture(t),path='public/lessonkits/aitamer-k8s-05-homework.pdf';
  f.write(path,Buffer.concat([Buffer.from('%PDF-1.7\n'),Buffer.from([0,255]),Buffer.from('\n%%EOF\n')]));f.write('src/lessonkits/k8s-05.json','{"slug":"k8s-05"}');
  f.git('add','.');f.git('commit','-m','kits');const source=f.git('rev-parse','HEAD'),plan=collectAdmission(f.base,source);
  assert.equal(plan.assets.size,2);assert.equal(plan.posts.size,0);
  f.write(path,Buffer.concat([Buffer.from('%PDF-1.7\n'),Buffer.from([0,254]),Buffer.from('\n%%EOF\n')]));f.git('add','.');f.git('commit','-m','changed kit');
  assert.notEqual(collectAdmission(f.base,f.git('rev-parse','HEAD')).editorialDigest,plan.editorialDigest);
});
test('admission refuses source code, path tricks and executable assets',t=>{
  const f=fixture(t);
  for(const path of ['scripts/evil.mjs','public/lessonkits/payload.html','src/lessonkits/nested/kit.json']) {
    f.git('checkout','--detach',f.base);f.write(path,'evil');f.git('add',path);f.git('commit','-m','refused');
    assert.throws(()=>collectAdmission(f.base,f.git('rev-parse','HEAD')),/outside admission lane/);
  }
  f.git('checkout','--detach',f.base);f.write('src/lessonkits/kit.json','{}');f.git('add','.');f.git('update-index','--chmod=+x','src/lessonkits/kit.json');f.git('commit','-m','executable');
  assert.throws(()=>collectAdmission(f.base,f.git('rev-parse','HEAD')),/outside admission lane/);
});
function validPDF() {
  const objects=['<< /Type /Catalog /Pages 2 0 R >>','<< /Type /Pages /Kids [3 0 R] /Count 1 >>','<< /Type /Page /Parent 2 0 R /MediaBox [0 0 100 100] >>'];
  let text='%PDF-1.4\n',offsets=[0];
  for(const [i,body] of objects.entries()){offsets.push(Buffer.byteLength(text));text+=`${i+1} 0 obj\n${body}\nendobj\n`;}
  const start=Buffer.byteLength(text);text+=`xref\n0 4\n0000000000 65535 f \n${offsets.slice(1).map(n=>`${String(n).padStart(10,'0')} 00000 n \n`).join('')}trailer\n<< /Size 4 /Root 1 0 R >>\nstartxref\n${start}\n%%EOF\n`;
  return Buffer.from(text);
}
test('materialization preserves binary assets and refuses an altered generated tree',t=>{
  const f=fixture(t),path='public/lessonkits/aitamer-kit-homework.pdf',bytes=validPDF();
  f.write(path,bytes);f.git('add','.');f.git('commit','-m','source');const source=f.git('rev-parse','HEAD'),plan=collectAdmission(f.base,source);
  const tree=f.git('rev-parse','HEAD^{tree}'),head=f.git('commit-tree',tree,'-p',f.base,'-p',source,'-m','generated');
  const env={GITHUB_ACTIONS:'true',GITHUB_EVENT_NAME:'workflow_dispatch',GITHUB_REF:'refs/heads/main',BASE_SHA:f.base,HEAD_SHA:head,SOURCE_SHA:source,EDITORIAL_DIGEST:plan.editorialDigest};
  const writes=new Map();materialize(env,{fetchCommits:()=>{},write:(p,b)=>writes.set(p,b)});assert.deepEqual(writes.get(path),bytes);
  f.write(path,'changed');f.git('add','.');const badTree=f.git('write-tree'),bad=f.git('commit-tree',badTree,'-p',f.base,'-p',source,'-m','tampered');
  assert.throws(()=>materialize({...env,HEAD_SHA:bad},{fetchCommits:()=>{},write:()=>{}}),/deterministic allocator/);
});

test('malformed PDF and JSON data cannot receive a publishing certificate',t=>{
  const f=fixture(t);
  for(const [path,bytes] of [['public/lessonkits/kit-homework.pdf','not a PDF'],['src/lessonkits/kit.json','{invalid'],['src/lessonkits/kit.json','{"slug":"different"}']]) {
    f.git('checkout','--detach',f.base);f.write(path,bytes);f.git('add','.');f.git('commit','-m','invalid content');
    assert.throws(()=>collectAdmission(f.base,f.git('rev-parse','HEAD')),/invalid (PDF|JSON) publishing asset/);
  }
});
test('stale asset submissions cannot overwrite a file independently changed on main',t=>{
  const f=fixture(t),path='src/lessonkits/kit.json';
  f.write(path,'{"slug":"kit","text":"source"}');f.git('add','.');f.git('commit','-m','source');const source=f.git('rev-parse','HEAD');
  f.git('checkout','--detach',f.base);f.write(path,'{"slug":"kit","text":"main"}');f.git('add','.');f.git('commit','-m','main changed');
  assert.throws(()=>collectAdmission(f.git('rev-parse','HEAD'),source),/asset changed on main/);
});

for (const lane of ['cursor','grok']) test(`${lane} asset-only PR dispatches automatically without reading human reviews`,async t=>{
  const f=fixture(t);f.write('src/lessonkits/kit.json','{"slug":"kit"}');f.git('add','.');f.git('commit','-m','kit');const source=f.git('rev-parse','HEAD');
  const pr={...cursor,number:7,state:'open',created_at:'2026-11-15T10:00:00Z',user:lane==='grok'?{id:337850229,type:'Bot'}:cursor.user,head:{ref:`${lane}/kit`,sha:source,repo:{full_name:repo}}};
  const dispatched=[];
  const api={repo,async list(path){assert.ok(!path.includes('/reviews'),'no human review lookup');return path.startsWith('/pulls?state=open')?[pr]:[];},async request(path,method='GET',body){
    if(path==='/git/ref/heads/main')return {object:{sha:f.base}};
    if(path==='/pulls/7')return pr;
    if(method==='POST' && path.endsWith('/dispatches')){dispatched.push(body);return null;}
    throw new Error(`unexpected ${path}`);
  }};
  assert.equal(await discoverApprovedRequests(api,{MAINTAINER_ID:'29182417'},{fetchCommits:()=>{}}),'dispatched');
  assert.equal(dispatched.length,1);assert.equal(dispatched[0].inputs.review_id,'0');assert.equal(dispatched[0].inputs.head_sha,source);
});

test('a header and EOF marker cannot fool the isolated PDF parser',{skip:process.env.PUBLISHING_PDF_INTEGRATION!=='1'},t=>{
  const f=fixture(t),path='public/lessonkits/kit-homework.pdf';
  f.write(path,'%PDF-1.7\nnot a PDF\n%%EOF\n');f.git('add','.');f.git('commit','-m','fake PDF');
  const source=f.git('rev-parse','HEAD'),plan=collectAdmission(f.base,source),head=f.git('commit-tree',f.git('rev-parse','HEAD^{tree}'),'-p',f.base,'-p',source,'-m','generated');
  assert.throws(()=>materialize({GITHUB_ACTIONS:'true',GITHUB_EVENT_NAME:'workflow_dispatch',GITHUB_REF:'refs/heads/main',BASE_SHA:f.base,HEAD_SHA:head,SOURCE_SHA:source,EDITORIAL_DIGEST:plan.editorialDigest},{fetchCommits:()=>{},validatePDFs:true,write:()=>{}}),/PDF validation failed/);
  f.write(path,validPDF());f.git('add','.');f.git('commit','-m','real PDF');const good=f.git('rev-parse','HEAD'),goodPlan=collectAdmission(f.base,good),goodHead=f.git('commit-tree',f.git('rev-parse','HEAD^{tree}'),'-p',f.base,'-p',good,'-m','valid generated');
  assert.doesNotThrow(()=>materialize({GITHUB_ACTIONS:'true',GITHUB_EVENT_NAME:'workflow_dispatch',GITHUB_REF:'refs/heads/main',BASE_SHA:f.base,HEAD_SHA:goodHead,SOURCE_SHA:good,EDITORIAL_DIGEST:goodPlan.editorialDigest},{fetchCommits:()=>{},validatePDFs:true,write:()=>{}}));
});

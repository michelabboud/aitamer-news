import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import yaml from 'js-yaml';
import {awaitAdmissionCompletion,wakeFinalizer} from './specimen-admission.mjs';

const REPO='owner/site', OWNER=42, ACTIONS=41898282, BASE='a'.repeat(40), SOURCE='b'.repeat(40);
const ENV={GITHUB_REF:'refs/heads/main',GITHUB_EVENT_NAME:'workflow_dispatch',GITHUB_ACTOR_ID:String(ACTIONS),GITHUB_RUN_ID:'10',GITHUB_SHA:BASE,MAINTAINER_ID:String(OWNER),WAKE_RUN_ID:'10'};
const run=overrides=>({id:10,path:'.github/workflows/specimen-admission.yml',event:'workflow_dispatch',head_branch:'main',head_sha:BASE,actor:{id:ACTIONS},repository:{full_name:REPO},head_repository:{full_name:REPO},display_title:`Specimen same-pr pr=7 head=${SOURCE} review=1 recovery=0`,status:'in_progress',conclusion:null,...overrides});
function transport(runs) {
  const calls=[];
  return {repo:REPO,calls,request:async(path,method='GET',body)=>{
    calls.push({path,method,body});
    if(method==='POST') return null;
    assert.equal(path,'/actions/runs/10');
    const value=runs.length>1 ? runs.shift() : runs[0];
    if(value instanceof Error) throw value;
    return structuredClone(value);
  }};
}

test('trusted certificate job automatically dispatches the existing finalizer with only an exact run hint',async()=>{
  const api=transport([run()]);await wakeFinalizer(api,ENV);
  assert.deepEqual(api.calls.at(-1),{path:'/actions/workflows/specimen-finalize.yml/dispatches',method:'POST',body:{ref:'main',inputs:{admission_run:'10'}}});
});

test('spoofed caller or admission identity cannot dispatch a completion wake',async()=>{
  for(const change of [{GITHUB_REF:'refs/heads/untrusted'},{GITHUB_EVENT_NAME:'pull_request'},{GITHUB_ACTOR_ID:'999'}]) {
    const api=transport([run()]);await assert.rejects(wakeFinalizer(api,{...ENV,...change}),/trusted dispatch/);assert.deepEqual(api.calls,[]);
  }
  for(const change of [{id:11},{actor:{id:999}},{path:'.github/workflows/other.yml'},{head_branch:'other'},{head_sha:SOURCE},{repository:{full_name:'fork/site'}},{head_repository:{full_name:'fork/site'}},{display_title:'forged'}]) {
    const api=transport([run(change)]);await assert.rejects(wakeFinalizer(api,ENV),/identity|durable/);
    assert.ok(api.calls.every(call=>call.method==='GET'));
  }
});

test('finalizer waits for exact authenticated completion; failed conclusion enters unchanged recovery',async()=>{
  const api=transport([run({status:'queued'}),run(),run({status:'completed',conclusion:'failure'})]),pauses=[];
  assert.equal(await awaitAdmissionCompletion(api,ENV,{pause:async ms=>pauses.push(ms)}),'failure');
  assert.deepEqual(pauses,[1000,1000]);
  assert.ok(api.calls.every(call=>call.method==='GET'));
});

test('every completion poll rejects changed identity before completed can be accepted',async()=>{
  for(const change of [{id:11},{actor:{id:999}},{event:'pull_request'},{path:'.github/workflows/other.yml'},{head_branch:'other'},{repository:{full_name:'fork/site'}},{head_repository:{full_name:'fork/site'}},{head_sha:'invalid'},{display_title:'forged'}]) {
    const api=transport([run(),run({status:'completed',conclusion:'success',...change})]),pauses=[];
    await assert.rejects(awaitAdmissionCompletion(api,ENV,{pause:async ms=>pauses.push(ms)}));
    assert.deepEqual(pauses,[1000]);assert.ok(api.calls.every(call=>call.method==='GET'));
  }
});

test('unfinished completion wait is bounded, malformed hints and transport errors never mutate',async()=>{
  const api=transport([run()]),pauses=[];
  await assert.rejects(awaitAdmissionCompletion(api,ENV,{pause:async ms=>pauses.push(ms)}),/exceeded bound/);
  assert.equal(api.calls.length,30);assert.equal(pauses.length,29);assert.ok(api.calls.every(call=>call.method==='GET'));
  for(const value of ['0','invalid','1; echo unsafe']) {
    const invalid=transport([run()]);await assert.rejects(awaitAdmissionCompletion(invalid,{...ENV,WAKE_RUN_ID:value}));assert.deepEqual(invalid.calls,[]);
  }
  const failed=transport([Object.assign(new Error('API unavailable'),{status:503})]);
  await assert.rejects(awaitAdmissionCompletion(failed,ENV,{pause:async()=>assert.fail('no error retry')}),/API unavailable/);
  assert.equal(failed.calls.length,1);
});

test('workflow dispatch follows certificate and read-only completion wait precedes App token mint',()=>{
  const admission=yaml.load(readFileSync(new URL('../.github/workflows/specimen-admission.yml',import.meta.url),'utf8'));
  assert.deepEqual(admission.permissions,{});
  assert.deepEqual(admission.jobs.prepare.permissions,{contents:'write','pull-requests':'write',actions:'read',checks:'read'});
  assert.deepEqual(admission.jobs.validate.permissions,{contents:'read'});
  assert.deepEqual(admission.jobs.certify.permissions,{contents:'read',checks:'write',actions:'write'});
  const steps=admission.jobs.certify.steps,certificate=steps.findIndex(step=>step.run==='node scripts/specimen-admission.mjs certify'),wake=steps.findIndex(step=>step.run==='node scripts/specimen-admission.mjs wake-finalizer');
  assert.equal(wake,certificate+1);assert.equal(wake,steps.length-1);
  assert.deepEqual(admission.jobs.certify.needs,['prepare','validate']);
  assert.doesNotMatch(JSON.stringify(admission.jobs.certify),/secrets\.|SPECIMEN_APP_PRIVATE_KEY|SPECIMEN_WRITE_TOKEN/);
  const finalizer=yaml.load(readFileSync(new URL('../.github/workflows/specimen-finalize.yml',import.meta.url),'utf8'));
  assert.deepEqual(finalizer.on.workflow_dispatch.inputs.admission_run,{description:'Exact admission completion wake; grants no approval or merge authority',required:false,default:'',type:'string'});
  const waits=finalizer.jobs.reconcile.steps,wait=waits.findIndex(step=>step.run==='node scripts/specimen-admission.mjs await-completion'),mint=waits.findIndex(step=>step.run==='node scripts/workflow-app-token.mjs');
  assert.ok(wait>=0 && wait<mint);assert.equal(waits[wait].env.WAKE_RUN_ID,'${{ inputs.admission_run }}');
  assert.doesNotMatch(waits[wait].run,/\$\{\{/);
  assert.ok(finalizer.on.workflow_run && finalizer.on.schedule);
});

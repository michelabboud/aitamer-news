import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import yaml from 'js-yaml';
import { certify } from './specimen-admission.mjs';

const workflows = [
  ['check-publisher-pr.yml','publisher-paths'],
  ['check-specimen-pr.yml','specimen-integrity'],
  ['check-posts.yml','check'],
].map(([file,key])=>({file,key,workflow:yaml.load(readFileSync(new URL(`../.github/workflows/${file}`,import.meta.url),'utf8'))}));
const required = ['publisher-paths','specimen-integrity','check'];

// These workflow expressions use GitHub's &&/|| string-selection idiom. Evaluate
// the actual YAML expression against event fixtures; startsWith is case insensitive
// in GitHub Actions. Branch values remain data and never become executable source.
function jobName(job,key,{branch,event='pull_request',author=334982782,sender=42,labels=[],repository='owner/site',headRepository=repository}) {
  if (!job.name) return key;
  const match = /^\$\{\{\s*([\s\S]+?)\s*\}\}$/.exec(job.name);
  if (!match) return job.name;
  const github={event_name:event,ref_name:event==='push' ? branch : '123/merge',repository,event:{sender:{id:sender}}};
  if (event!=='push') github.event.pull_request={head:{ref:branch,repo:{full_name:headRepository}},user:{id:author},labels:labels.map(name=>({name}))};
  // GitHub returns an empty value for absent event properties; the push fixture
  // models that property so the same fallback expression can be evaluated in JS.
  else github.event.pull_request={head:{ref:''},labels:[]};
  const expression=match[1].replaceAll('github.event.pull_request.labels.*.name','github.event.pull_request.labels.map(label=>label.name)');
  return runInNewContext(expression,{github,contains:(values,value)=>values.includes(value),startsWith:(value,prefix)=>String(value ?? '').toLowerCase().startsWith(prefix.toLowerCase())},{timeout:100});
}
const namesFor=values=>workflows.map(({workflow,key})=>jobName(workflow.jobs[key],key,values));

test('ordinary owner, author, comment and unrelated fork PRs retain required check contexts',()=>{
  for (const values of [
    {branch:'fix/site',author:42},
    {branch:'desk/authors-editor-0123456789abcdef-ari'},
    {branch:'desk/comments-editor-0123456789abcdef-post',author:999},
    {branch:'feature/post',author:999,headRepository:'fork/site'},
  ]) assert.deepEqual(namesFor(values),required,values.branch);
});

test('generated and spoofed admission prefixes emit only observations, regardless of sender or repository',()=>{
  for (const values of [
    {branch:'specimens/run-123'},
    {branch:'specimens/run-spoof',author:999},
    {branch:'specimens/run-123',author:999,headRepository:'fork/site'},
    {branch:'SPECIMENS/RUN-123',author:42},
  ]) {
    const names=namesFor(values);
    assert.deepEqual(names,['publisher-paths-observation','specimen-integrity-observation','check-observation']);
    assert.ok(required.every(name=>!names.includes(name)),'successful spoof observations cannot satisfy required contexts');
  }
});

test('push checks isolate generated refs and retain ordinary branch check names',()=>{
  const {workflow,key}=workflows.find(w=>w.file==='check-posts.yml');
  assert.equal(jobName(workflow.jobs[key],key,{branch:'specimens/run-123',event:'push'}),'check-observation');
  assert.equal(jobName(workflow.jobs[key],key,{branch:'grok/article',event:'push'}),'check-observation');
  assert.equal(jobName(workflow.jobs[key],key,{branch:'fix/site',event:'push'}),'check');
  assert.equal(jobName(workflow.jobs[key],key,{branch:'feature/manual-article',event:'push',sender:334982782}),'check-observation');
});

test('same-PR source namespaces and manual labels isolate all contexts without granting required success',()=>{
  for (const fixture of [
    {branch:'grok/article',author:999},
    {branch:'desk/posts-editor-0123456789abcdef-article'},
    {branch:'feature/manual-article',labels:['workflow-numbering']},
    {branch:'grok/spoof',headRepository:'fork/site',author:999},
    {branch:'feature/forged-label',labels:['workflow-numbering'],headRepository:'fork/site'},
  ]) assert.deepEqual(namesFor(fixture),['publisher-paths-observation','specimen-integrity-observation','check-observation']);
});

test('review wake has no checkout, secrets, API access or mutation permission',()=>{
  const wake=yaml.load(readFileSync(new URL('../.github/workflows/specimen-editorial-review.yml',import.meta.url),'utf8'));
  assert.deepEqual(wake.permissions,{});
  assert.deepEqual(wake.on.pull_request_review.types,['submitted','edited','dismissed']);
  assert.deepEqual(wake.jobs.wake.steps,[{run:"echo 'Editorial review notification; trusted main verifies approval.'"}]);
  const finalizer=yaml.load(readFileSync(new URL('../.github/workflows/specimen-finalize.yml',import.meta.url),'utf8'));
  assert.ok(finalizer.on.workflow_run.workflows.includes(wake.name));
  assert.ok(finalizer.on.workflow_run.workflows.includes('Publisher paths'),'existing trusted path observation immediately wakes automatic bot discovery');
  assert.ok(finalizer.on.schedule.length>0,'scheduled recovery remains available');
});

test('control-state pushes are excluded while generated and ordinary source branches stay checked',()=>{
  const {workflow}=workflows.find(w=>w.file==='check-posts.yml');
  assert.deepEqual(workflow.on.push['branches-ignore'],['main','specimens/state']);
  for (const branch of ['specimens/run-123','grok/article','fix/site']) assert.ok(!workflow.on.push['branches-ignore'].includes(branch));
});

test('observation naming does not add branch skips, permissions or producer exceptions',()=>{
  for (const {workflow,key} of workflows) {
    assert.doesNotMatch(String(workflow.jobs[key].if ?? ''),/specimens|startsWith/,'skipped jobs must not publish required-name success');
    assert.ok(workflow.jobs[key].steps.length>0);
  }
  assert.deepEqual(workflows[0].workflow.permissions,{contents:'read'});
  assert.deepEqual(workflows[1].workflow.permissions,{contents:'read',checks:'read',actions:'read'});
  assert.deepEqual(workflows[2].workflow.permissions,{contents:'read'});
});

test('only the trusted admission certifier supplies all required names on a generated head',async()=>{
  const checks=[];
  const api={repo:'owner/site',request:async(path,method,body)=>{assert.equal(path,'/check-runs');assert.equal(method,'POST');checks.push(body);}};
  await certify(api,{BASE_SHA:'a'.repeat(40),HEAD_SHA:'b'.repeat(40),EDITORIAL_DIGEST:'c'.repeat(64),GITHUB_RUN_ID:'123'});
  const certified=checks.map(check=>check.name);
  assert.deepEqual(certified.slice().sort(),required.slice().sort());
  const observations=namesFor({branch:'specimens/run-123'});
  assert.equal(new Set([...certified,...observations]).size,6,'automatic jobs and certificates never duplicate a required context');
  assert.ok(checks.every(check=>check.head_sha==='b'.repeat(40) && check.conclusion==='success' && check.external_id===`owner/site:${'a'.repeat(40)}:${'b'.repeat(40)}:${'c'.repeat(64)}:123`));
});

test('production admission verification receives full checkout ancestry',()=>{
 const workflow=yaml.load(readFileSync(new URL('../.github/workflows/deploy-pages.yml',import.meta.url),'utf8'));
 const checkout=workflow.jobs.deploy.steps.find(step=>String(step.uses ?? '').startsWith('actions/checkout@'));
 assert.equal(checkout.with['fetch-depth'],0);
 assert.deepEqual(workflow.jobs.deploy.concurrency,{group:'pages-production','cancel-in-progress':false});
});

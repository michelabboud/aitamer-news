/** Production setup + real IndexedDB in isolated Chromium; no server, install or build output. */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawn, spawnSync } from 'node:child_process';
import { mkdtemp, mkdir, readFile, writeFile } from 'node:fs/promises';
import { stripTypeScriptTypes } from 'node:module';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { ChromePipeHarness } from './browser-cdp-harness.ts';

const BROWSER_TIMEOUT_MS = 90_000;
const STARTUP_TIMEOUT_MS = 45_000;

test('production reactions setup fences reloads, navigation and concurrent tabs; storage faults fail closed', { timeout: BROWSER_TIMEOUT_MS }, async (context) => {
  if (spawnSync('google-chrome', ['--version'], { stdio: 'ignore' }).error) {
    context.skip('google-chrome unavailable; real IndexedDB qualification remains open'); return;
  }
  const directory = await mkdtemp(join(tmpdir(), 'aitamer-reactions-v2-persistence-'));
  context.diagnostic(`Synthetic browser profile, fixture and evidence retained at ${directory}`);
  await mkdir(join(directory, 'lib')); await mkdir(join(directory, 'content'));
  for (const file of ['lib/reactions-v2-persistence', 'lib/reactions', 'lib/data-host', 'lib/site-meta', 'content/comment-limits']) {
    const source = await readFile(new URL(`../${file}.ts`, import.meta.url), 'utf8');
    const code = stripTypeScriptTypes(source).replace(/(from\s+['"][^'"]+)\.ts(['"])/g, '$1.mjs$2');
    await writeFile(join(directory, `${file}.mjs`), code);
  }
  const fixture = join(directory, 'index.html');
  await writeFile(fixture, `<!doctype html><meta charset="utf-8"><p>Isolated public-reaction fence fixture</p>
<script type="module">
import * as persistence from './lib/reactions-v2-persistence.mjs';
window.persistence=persistence;
window.states=[];window.calls=0;window.releases=[];
const query=new URLSearchParams(location.search);window.bootQuery=location.search;
window.slug=query.get('slug')||'a-story';
window.base='https://data.aitamer.news/';window.key=base+'v2/reactions/'+slug+'.json';
window.generation=query.get('generation')||'1';window.count=Number(query.get('count')||'2');
window.status=Number(query.get('status')||'200');window.empty=query.has('empty');
window.defer=query.has('defer');window.failOnce=query.has('failOnce');
window.mutate=async(value,remove=false)=>{const db=await new Promise((resolve,reject)=>{const request=indexedDB.open(persistence.REACTION_V2_FENCE_DATABASE,persistence.REACTION_BROWSER_DATABASE_VERSION);request.onsuccess=()=>resolve(request.result);request.onerror=()=>reject(request.error)});try{await new Promise((resolve,reject)=>{const tx=db.transaction(persistence.REACTION_V2_FENCE_STORE,'readwrite');const store=tx.objectStore(persistence.REACTION_V2_FENCE_STORE);if(remove)store.delete(key);else store.put(value,key);tx.oncomplete=resolve;tx.onabort=()=>reject(tx.error)})}finally{db.close()}};
window.mount=(extra={})=>persistence.loadPersistentReactionV2Totals({slug,base,
 onState:state=>window.states.push(JSON.parse(JSON.stringify(state))),
 subscribe:persistence.subscribeReactionV2Fence,notify:persistence.notifyReactionV2Fence,
 fetchImpl:async()=>{window.calls++;if(window.failOnce){window.failOnce=false;throw new Error('fixture offline')};if(window.defer)await new Promise(resolve=>window.releases.push(resolve));return new Response(window.status===404?'':JSON.stringify({version:2,slug,generation:window.generation,reactions:window.empty?[]:[{id:'love',n:window.count}]})+'\\n',{status:window.status})},...extra});
if(query.has('prepareUpgrade')){const db=await new Promise((resolve,reject)=>{const request=indexedDB.open(persistence.REACTION_V2_FENCE_DATABASE,1);request.onupgradeneeded=()=>request.result.createObjectStore(persistence.REACTION_V2_FENCE_STORE);request.onsuccess=()=>resolve(request.result);request.onerror=()=>reject(request.error)});await new Promise((resolve,reject)=>{const tx=db.transaction(persistence.REACTION_V2_FENCE_STORE,'readwrite');tx.objectStore(persistence.REACTION_V2_FENCE_STORE).put(JSON.stringify({version:2,slug,generation:'10',reactions:[{id:'love',n:2}]})+'\\n',key);tx.oncomplete=resolve;tx.onabort=()=>reject(tx.error)});db.close()}
const originalCreate=IDBDatabase.prototype.createObjectStore;
if(query.has('failUpgrade'))IDBDatabase.prototype.createObjectStore=function(name,...args){if(name===persistence.REACTION_JOURNAL_STORE)throw new DOMException('fixture upgrade failure','QuotaExceededError');return originalCreate.call(this,name,...args)};
window.reader=mount();window.initial=reader.initial;await window.initial;IDBDatabase.prototype.createObjectStore=originalCreate;window.fixtureReady=true;
</script>`);
  const chrome = spawn('google-chrome', ['--headless=new', '--disable-gpu', '--no-first-run', '--no-default-browser-check', '--allow-file-access-from-files', '--remote-debugging-pipe', `--user-data-dir=${join(directory, 'profile')}`, 'about:blank'], { stdio: ['ignore', 'ignore', 'pipe', 'pipe', 'pipe'] });
  const harness = new ChromePipeHarness(chrome);
  const results: unknown[] = [];
  let failure: unknown;
  context.after(async () => {
    try { await harness.shutdown(); }
    finally {
      await writeFile(join(directory, 'results.json'), JSON.stringify(results, null, 2));
      await writeFile(join(directory, 'chrome-stderr.txt'), harness.stderr);
      await writeFile(join(directory, 'harness-diagnostic.txt'), `${failure instanceof Error ? failure.stack : failure ?? ''}\n${harness.diagnostics()}`);
    }
  });
  context.signal.addEventListener('abort', () => harness.abort('Reaction persistence browser qualification aborted'), { once: true });
  const call = (method: string, params: object = {}, sessionId?: string, timeoutMs?: number) => harness.call(method, params, sessionId, timeoutMs);
  const createPage = async (browserContextId?: string) => {
    const { targetId } = await call('Target.createTarget', { url: 'about:blank', ...(browserContextId ? { browserContextId } : {}) }, undefined, STARTUP_TIMEOUT_MS);
    const { sessionId } = await call('Target.attachToTarget', { targetId, flatten: true });
    await call('Runtime.enable', {}, sessionId); await call('Page.enable', {}, sessionId);
    return sessionId as string;
  };
  const evaluate = async (session: string, expression: string) => {
    const answer = await call('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true }, session);
    if (answer.exceptionDetails) throw new Error(JSON.stringify(answer.exceptionDetails));
    return answer.result.value;
  };
  let navigation = 0;
  const navigate = async (session: string, query: string, ready = true) => {
    query += '&navigation=' + (++navigation);
    await call('Page.navigate', { url: `${pathToFileURL(fixture).href}?${query}` }, session);
    if (ready) {
      for (let attempt = 0; attempt < 200; attempt++) {
        if (await evaluate(session, `!!window.fixtureReady && window.bootQuery === ${JSON.stringify('?' + query)}`)) return;
        await new Promise(resolve => setTimeout(resolve, 10));
      }
      throw new Error('Reaction persistence fixture did not initialize');
    }
  };
  const snapshot = async (session: string, label: string) => {
    const state = await evaluate(session, '({last:states.at(-1),states,calls})'); results.push({ label, ...state }); return state;
  };
  try {
    const first = await createPage();
    await navigate(first, 'prepareUpgrade=1&status=404');
    assert.equal((await snapshot(first, 'additive v1 database upgrade preserves generation10 envelope through404')).last.latest.generation, '10');
    await navigate(first, 'generation=10');
    assert.equal((await snapshot(first, 'initial 10')).last.latest.generation, '10');
    const previousTimeOrigin = await evaluate(first, 'performance.timeOrigin');
    await call('Page.reload', { ignoreCache: true }, first);
    for (let attempt = 0; attempt < 200; attempt++) {
      if (await evaluate(first, `window.fixtureReady && performance.timeOrigin !== ${previousTimeOrigin}`)) break;
      await new Promise(resolve => setTimeout(resolve, 10));
    }
    assert.notEqual(await evaluate(first, 'performance.timeOrigin'), previousTimeOrigin);
    assert.equal((await snapshot(first, 'same-generation reload')).last.latest.generation, '10');
    for (const query of ['generation=9', 'generation=10&count=99']) {
      await navigate(first, query);
      const state = await snapshot(first, query); assert.equal(state.states.some((s: any) => s.phase === 'failed'), true); assert.equal(state.last.latest.generation, '10');
      assert.equal(state.states.some((s: any) => s.phase === 'ready' && (s.latest?.generation !== '10' || s.value.reactions[0].n !== 2)), false);
    }
    await navigate(first, 'status=404');
    assert.equal((await snapshot(first, '404 keeps 10')).last.latest.generation, '10');
    await navigate(first, 'generation=11&empty=1');
    await navigate(first, 'status=404');
    const tombstone = await snapshot(first, '404 keeps empty 11');
    assert.equal(tombstone.last.latest.generation, '11'); assert.deepEqual(tombstone.last.value.reactions, []);

    await navigate(first, 'generation=12&defer=1', false);
    for (let attempt = 0; attempt < 200 && !await evaluate(first, '!!window.releases?.length'); attempt++) await new Promise(resolve => setTimeout(resolve, 10));
    const second = await createPage();
    await navigate(second, 'generation=13');
    await evaluate(first, 'releases.splice(0).forEach(resolve=>resolve());initial');
    await evaluate(first, 'reader.refresh()');
    const race = await snapshot(first, 'late 12 after competing tab commits 13');
    assert.equal(race.last.latest.generation, '13'); assert.equal(race.states.some((s: any) => s.phase === 'ready' && s.latest?.generation === '12'), false);
    await navigate(second, 'generation=13&count=99');
    assert.equal((await snapshot(second, 'same-generation tab conflict')).states.some((s: any) => s.phase === 'failed'), true);
    await navigate(second, 'status=404');
    assert.equal((await snapshot(second, 'conflict did not overwrite persistent 13')).last.value.reactions[0].n, 2);

    await evaluate(first, "localStorage.setItem('atn:react:a-story','keep-user-choice');mutate(undefined)");
    await navigate(second, 'generation=14');
    const corrupt = await snapshot(second, 'existing undefined record is corrupt');
    assert.equal(corrupt.last.fenceFailure, true); assert.equal(corrupt.calls, 0);
    assert.equal(await evaluate(first, "localStorage.getItem('atn:react:a-story')"), 'keep-user-choice');
    await evaluate(first, 'mutate(undefined,true).then(()=>reader.refresh())');
    assert.equal((await snapshot(first, 'observable fence deletion closes mounted page')).last.fenceFailure, true);
    await navigate(second, 'generation=1');
    assert.equal((await snapshot(second, 'new page after deliberate deletion is fresh trust')).last.latest.generation, '1');
    await evaluate(second, "mutate('{broken').then(()=>reader.refresh())");
    assert.equal((await snapshot(second, 'corrupt bytes close mounted page')).last.fenceFailure, true);
    await navigate(second, 'generation=2');
    const stillCorrupt = await snapshot(second, 'corrupt bytes survive reload'); assert.equal(stillCorrupt.last.fenceFailure, true); assert.equal(stillCorrupt.calls, 0);
    await evaluate(second, 'mutate(undefined,true)');
    await navigate(second, 'slug=quota-case&generation=1');
    await evaluate(second, `(async()=>{reader.dispose();states=[];window.slug='quota-write';window.key=base+'v2/reactions/'+slug+'.json';
      window.originalPut=IDBObjectStore.prototype.put;IDBObjectStore.prototype.put=function(){throw new DOMException('fixture quota','QuotaExceededError')};
      window.reader=mount();await reader.initial;IDBObjectStore.prototype.put=originalPut;})()`);
    assert.equal((await snapshot(second, 'quota abort never renders uncommitted counts')).last.fenceFailure, true);
    await evaluate(second, `(async()=>{reader.dispose();states=[];window.reader=mount({openStore:(url,slug,onUnavailable)=>persistence.openReactionV2FenceStore(url,slug,onUnavailable,{open(){throw new DOMException('fixture blocked','SecurityError')}})});await reader.initial;})()`);
    assert.equal((await snapshot(second, 'storage unavailable')).last.fenceFailure, true);
    await navigate(second, 'slug=recovery&generation=5&failOnce=1');
    assert.equal((await snapshot(second, 'network failure')).last.phase, 'failed');
    await evaluate(second, 'reader.retry()');
    const recovered = await snapshot(second, 'network retry commits 5'); assert.equal(recovered.last.latest.generation, '5'); assert.equal(recovered.calls, 2);
    await evaluate(second, `(async()=>{reader.dispose();states=[];window.originalTransaction=IDBDatabase.prototype.transaction;
      IDBDatabase.prototype.transaction=function(){throw new DOMException('fixture read failure','InvalidStateError')};
      window.callsBeforeReadFailure=calls;window.reader=mount();await reader.initial;IDBDatabase.prototype.transaction=originalTransaction;})()`);
    const readFailure = await snapshot(second, 'transaction/read unavailable'); assert.equal(readFailure.last.fenceFailure, true);
    assert.equal(readFailure.calls, await evaluate(second, 'callsBeforeReadFailure'));
    await navigate(second, 'slug=delete-boundary&generation=90');
    await evaluate(second, `new Promise((resolve,reject)=>{const request=indexedDB.deleteDatabase(persistence.REACTION_V2_FENCE_DATABASE);request.onsuccess=resolve;request.onerror=()=>reject(request.error)})`);
    assert.equal((await snapshot(second, 'database deletion invalidates mounted reader')).last.fenceFailure, true);
    await evaluate(second, 'reader.retry()');
    assert.equal((await snapshot(second, 'deleted database does not silently reopen in mounted reader')).calls, 1);
    await navigate(second, 'slug=delete-boundary&generation=1');
    assert.equal((await snapshot(second, 'fresh page after deliberate database reset starts new trust')).last.latest.generation, '1');
    await evaluate(second, '(async()=>{reader.dispose();states=[];window.reader=mount({openStore:async()=>{throw new Error("fixture open failure")}});await reader.initial})()');
    assert.equal((await snapshot(second, 'open failure')).last.fenceFailure, true);
    const { browserContextId } = await call('Target.createBrowserContext');
    const upgradeFailure = await createPage(browserContextId);
    await navigate(upgradeFailure, 'prepareUpgrade=1&failUpgrade=1&status=404');
    const failedUpgrade = await snapshot(upgradeFailure, 'failed additive upgrade does not render or fetch');
    assert.equal(failedUpgrade.last.fenceFailure, true);
    assert.equal(failedUpgrade.last.phase, 'failed'); assert.equal(failedUpgrade.calls, 0);
    assert.equal(await evaluate(upgradeFailure, `(async()=>{const db=await new Promise((resolve,reject)=>{const request=indexedDB.open(persistence.REACTION_V2_FENCE_DATABASE,1);request.onsuccess=()=>resolve(request.result);request.onerror=()=>reject(request.error)});const value=await new Promise(resolve=>{const tx=db.transaction(persistence.REACTION_V2_FENCE_STORE);const get=tx.objectStore(persistence.REACTION_V2_FENCE_STORE).get(key);get.onsuccess=()=>resolve(get.result)});db.close();return JSON.parse(value).generation})()`), '10');
    await call('Target.disposeBrowserContext', { browserContextId });
    context.diagnostic('Real Chromium: reload/navigation, persistent empty barrier, competing tabs, corrupt state, quota abort, unavailable storage, reset and retry assertions passed');
  } catch (error) { failure = error; throw error; }
});

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createReactionJournal, type ReactionJournalView } from './reaction-journal.ts';

test('missing storage and invalid origin never send intents or silently fall back to legacy POST', async () => {
  for (const base of ['https://data.aitamer.news/', 'http://public.example/']) {
    const states: ReactionJournalView[] = []; let calls = 0;
    const journal = createReactionJournal({ slug: 'a-story', base, endpoint: 'https://comments.example/react', initialChoice: 'love', onState: state => states.push(state), subscribe: () => () => {}, fetchImpl: async () => { calls++; return new Response('{}'); } });
    await journal.initial; await journal.choose('wow'); await journal.retry(); await journal.reset();
    assert.equal(calls, 0); assert.equal(states.at(-1)?.storageFailure, true); assert.equal(states.at(-1)?.known, false); assert.equal(states.at(-1)?.choice, 'love');
    journal.dispose();
  }
});

// Independent production readers exercise native IndexedDB ordering without component rendering.
// The component suite separately covers the same failure through two actual page instances.
test('journal adopts damaged replacements without trusting corrupt revisions or replaying retired intents', { timeout: 30_000 }, async context => {
  const { spawn, spawnSync } = await import('node:child_process');
  if (spawnSync('google-chrome', ['--version'], { stdio: 'ignore' }).error) { context.skip('google-chrome unavailable; journal ordering qualification remains open'); return; }
  const { mkdtemp, mkdir, readFile, writeFile } = await import('node:fs/promises');
  const { stripTypeScriptTypes } = await import('node:module');
  const { tmpdir } = await import('node:os');
  const { join } = await import('node:path');
  const { pathToFileURL } = await import('node:url');
  const { ChromePipeHarness } = await import('./browser-cdp-harness.ts');
  const directory = await mkdtemp(join(tmpdir(), 'aitamer-reaction-journal-order-'));
  context.diagnostic(`Native journal fixture/profile/evidence retained at ${directory}`);
  await mkdir(join(directory, 'lib')); await mkdir(join(directory, 'content'));
  for (const file of ['lib/reaction-journal', 'lib/reaction-receipts', 'lib/reactions-v2-persistence', 'lib/reactions', 'lib/data-host', 'lib/site-meta', 'content/comment-limits']) {
    const source = await readFile(new URL(`../${file}.ts`, import.meta.url), 'utf8');
    await writeFile(join(directory, `${file}.mjs`), stripTypeScriptTypes(source).replace(/(from\s+['"][^'"]+)\.ts(['"])/g, '$1.mjs$2'));
  }
  const fixture = join(directory, 'index.html');
  await writeFile(fixture, `<!doctype html><meta charset="utf-8"><script type="module">
import {createReactionJournal} from './lib/reaction-journal.mjs';
import {openReactionBrowserDatabase,REACTION_JOURNAL_STORE,REACTION_V2_FENCE_STORE} from './lib/reactions-v2-persistence.mjs';
const key='https://data.aitamer.news/v2/reactions/a-story.json';
const readers=[];let database;const evidence=[];
const check=(condition,message)=>{if(!condition)throw Error(message)};
const until=async(condition)=>{for(let i=0;i<300;i++){if(condition())return;await new Promise(resolve=>setTimeout(resolve,5))}throw Error('journal fixture condition timeout')};
const transact=(storeName,transform)=>new Promise((resolve,reject)=>{const tx=database.transaction(storeName,'readwrite');const store=tx.objectStore(storeName);const request=store.get(key);let value;request.onsuccess=()=>{value=transform(request.result);if(value!==undefined)store.put(value,key)};tx.oncomplete=()=>resolve(value);tx.onabort=()=>reject(Error('fixture transaction aborted'))});
const inspect=()=>new Promise((resolve,reject)=>{const tx=database.transaction([REACTION_JOURNAL_STORE,REACTION_V2_FENCE_STORE],'readonly');const own=tx.objectStore(REACTION_JOURNAL_STORE).get(key);const pub=tx.objectStore(REACTION_V2_FENCE_STORE).get(key);tx.oncomplete=()=>resolve({journal:JSON.parse(own.result),publicBytes:pub.result});tx.onabort=()=>reject(Error('fixture inspection aborted'))});
let callsA=0,callsB=0,release;const expiresAt=new Date(Date.now()+30*86400000).toISOString();
const wire=(stream,counter,hold=false)=>async(url,init)=>{counter();const body=JSON.parse(init.body);if(String(url).endsWith('/stream'))return new Response(JSON.stringify({ok:true,version:1,slug:'a-story',stream,capability:'e30.'+'a'.repeat(43),expiresAt}));if(hold)await new Promise(resolve=>release=resolve);return new Response(JSON.stringify({ok:true,version:1,slug:'a-story',stream,sequence:body.sequence,operation:body.operation,processedThrough:body.sequence,generation:'2',expiresAt}))};
const viewsA=[],viewsB=[],viewsC=[];let failOpen=false,openCalls=0;
const mount=(views,fetchImpl)=>{const reader=createReactionJournal({slug:'a-story',base:'https://data.aitamer.news/',endpoint:'https://comments.aitamer.news/react',initialChoice:'love',openDatabase:async(callback)=>{openCalls++;if(failOpen){failOpen=false;throw Error('fixture database unavailable')}return openReactionBrowserDatabase(callback)},subscribe:()=>()=>{},onState:view=>views.push(view),fetchImpl});readers.push(reader);return reader};
try{
 database=await openReactionBrowserDatabase(()=>{});
 await transact(REACTION_V2_FENCE_STORE,()=>JSON.stringify({version:2,slug:'a-story',generation:'1',reactions:[]})+'\\n');
 const a=mount(viewsA,wire('a'.repeat(32),()=>callsA++,true));await a.initial;
 const oldDelivery=a.choose('love');await until(()=>!!release);
 await transact(REACTION_JOURNAL_STORE,raw=>{const journal=JSON.parse(raw);journal.revision='12';return JSON.stringify(journal)});
 await a.refresh();check(viewsA.at(-1).choice==='love','old reader must remember Love');
 await transact(REACTION_JOURNAL_STORE,raw=>{const journal=JSON.parse(raw);journal.revision='untrusted revision';journal.stream.capability='lost';return JSON.stringify(journal)});
 const b=mount(viewsB,wire('b'.repeat(32),()=>callsB++));await b.initial;
 check(viewsB.at(-1).storageFailure&&viewsB.at(-1).canReset,'damaged journal must fail closed and offer explicit reset');
 const opensBeforeReset=openCalls;await Promise.all([b.reset(),b.reset()]);await b.refresh();
 check(openCalls===opensBeforeReset+1,'overlapping successful resets must issue one database open');
 check(!viewsB.at(-1).storageFailure,'overlapping resets must leave the winning connection usable');
 check(callsB===0,'damaged reset must not issue requests');
 const reset=await inspect();check(reset.journal.revision==='1'&&reset.journal.resetUncertain,'corrupt revision must not be inherited');
 await b.choose('angry');
 await transact(REACTION_V2_FENCE_STORE,()=>JSON.stringify({version:2,slug:'a-story',generation:'2',reactions:[{id:'angry',n:1}]})+'\\n');
 await b.refresh(true);const settled=await inspect();check(BigInt(settled.journal.revision)<12n,'replacement revision must remain below old reader revision in this fixture');
 await a.refresh(true);
 evidence.push({scenario:'missed corruption',oldRevision:'12',replacementRevision:settled.journal.revision,choice:viewsA.at(-1).choice,notice:viewsA.at(-1).notice});
 check(viewsA.at(-1).choice==='angry','reader missing corruption must adopt the new epoch');
 check(viewsA.at(-1).notice.startsWith('Local confirmation reset.'),'reader missing corruption must retain reset uncertainty');
 const beforeRetry=callsA;await a.retry();check(callsA===beforeRetry,'old reader must not resend retired intent');
 release();await oldDelivery;
 const late=await inspect();check(late.journal.epoch===settled.journal.epoch&&late.journal.selected==='angry'&&late.journal.intents.length===1,'old response must not overwrite replacement');
 check(viewsA.at(-1).choice==='angry'&&viewsA.at(-1).notice.startsWith('Local confirmation reset.'),'old response must not render stale choice or erase uncertainty');
 // Two readers observe damaged bytes. Only the first exact-byte replacement may win.
 await transact(REACTION_JOURNAL_STORE,raw=>{const journal=JSON.parse(raw);journal.stream.capability='lost again';return JSON.stringify(journal)});
 await b.refresh();const c=mount(viewsC,wire('c'.repeat(32),()=>callsB++));await c.initial;
 await c.reset();const newer=await inspect();await b.reset();const afterConflict=await inspect();
 check(afterConflict.journal.epoch===newer.journal.epoch,'stale damaged reset must not overwrite a newer record');
 check(afterConflict.publicBytes===settled.publicBytes,'damaged replacements must preserve exact public fence');
 check(callsB===2,'no reset or stale reset may send any request');
 evidence.push({scenario:'late old response and concurrent damaged reset',choice:afterConflict.journal.selected,uncertain:afterConflict.journal.resetUncertain,publicGeneration:JSON.parse(afterConflict.publicBytes).generation,callsA,callsB});
 // Open and transactional failures preserve the damaged record and release single-flight
 // state, so a later explicit reset can recover using a fresh owned connection.
 await transact(REACTION_JOURNAL_STORE,raw=>{const journal=JSON.parse(raw);journal.revision='untrusted again';return JSON.stringify(journal)});
 await c.refresh();const damagedBeforeFailures=await inspect();
 failOpen=true;const opensBeforeFailure=openCalls;await Promise.all([c.reset(),c.reset()]);
 check(openCalls===opensBeforeFailure+1,'overlapping failed resets must issue one database open');
 check(viewsC.at(-1).storageFailure&&viewsC.at(-1).canReset,'failed database open must remain explicitly retryable');
 check(JSON.stringify((await inspect()).journal)===JSON.stringify(damagedBeforeFailures.journal),'failed open must preserve damaged private bytes');
 const originalPut=IDBObjectStore.prototype.put;let failPut=true;
 IDBObjectStore.prototype.put=function(...args){if(this.name===REACTION_JOURNAL_STORE&&failPut){failPut=false;throw new DOMException('fixture quota','QuotaExceededError')}return originalPut.apply(this,args)};
 try{await Promise.all([c.reset(),c.reset()])}finally{IDBObjectStore.prototype.put=originalPut}
 check(viewsC.at(-1).storageFailure&&viewsC.at(-1).canReset,'failed reset transaction must remain retryable');
 const afterFailures=await inspect();
 check(JSON.stringify(afterFailures.journal)===JSON.stringify(damagedBeforeFailures.journal)&&afterFailures.publicBytes===damagedBeforeFailures.publicBytes,'failed reset transaction must not lose private state or public fence');
 await Promise.all([c.reset(),c.reset()]);await c.refresh();
 check(!viewsC.at(-1).storageFailure&&viewsC.at(-1).notice.startsWith('Local confirmation reset.'),'successful retry must own a usable connection');
 const afterRecovery=await inspect();check(afterRecovery.journal.epoch!==damagedBeforeFailures.journal.epoch&&afterRecovery.publicBytes===damagedBeforeFailures.publicBytes,'successful retry must reset only private epoch');
 check(callsA===2&&callsB===2,'failed or successful reset retries must never send retired intents');
 evidence.push({scenario:'overlapping reset failure and retry',openAttempts:openCalls-opensBeforeFailure,choice:viewsC.at(-1).choice,notice:viewsC.at(-1).notice,callsA,callsB});
 window.result={ok:true,evidence};
}catch(error){window.result={ok:false,message:error.message,evidence}}finally{readers.forEach(reader=>reader.dispose());database?.close()}
</script>`);
  const chrome = spawn('google-chrome', ['--headless=new', '--disable-gpu', '--no-first-run', '--no-default-browser-check', '--allow-file-access-from-files', '--remote-debugging-pipe', `--user-data-dir=${join(directory, 'profile')}`, 'about:blank'], { stdio: ['ignore', 'ignore', 'pipe', 'pipe', 'pipe'] });
  const harness = new ChromePipeHarness(chrome); let result: any;
  context.after(async () => { try { await harness.shutdown(); } finally { await writeFile(join(directory, 'results.json'), JSON.stringify(result ?? { incomplete: true }, null, 2)); await writeFile(join(directory, 'diagnostic.txt'), harness.diagnostics()); } });
  const { targetId } = await harness.call('Target.createTarget', { url: 'about:blank' });
  const { sessionId } = await harness.call('Target.attachToTarget', { targetId, flatten: true });
  await harness.call('Page.enable', {}, sessionId); await harness.call('Runtime.enable', {}, sessionId);
  await harness.call('Page.navigate', { url: pathToFileURL(fixture).href }, sessionId);
  for (let attempt = 0; attempt < 1000; attempt++) {
    const answer = await harness.call('Runtime.evaluate', { expression: 'window.result', returnByValue: true }, sessionId);
    if (answer.exceptionDetails) throw Error('journal fixture evaluation failed');
    result = answer.result.value;if (result) break;
    await new Promise(resolve => setTimeout(resolve, 10));
  }
  assert.equal(result?.ok, true, result?.message ?? 'journal fixture did not finish');
});

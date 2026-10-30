/** Actual Astro-rendered component/client, isolated Chrome and synthetic receipt/data endpoints. */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawn, spawnSync } from 'node:child_process';
import { mkdtemp, mkdir, readFile, writeFile } from 'node:fs/promises';
import { stripTypeScriptTypes } from 'node:module';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { transform } from '@astrojs/compiler-rs';
import { experimental_AstroContainer } from 'astro/container';
import { ChromePipeHarness } from './browser-cdp-harness.ts';

const TEST_TIMEOUT_MS = 90_000;

test('actual reaction component reconciles private receipts with public envelopes without double-counting', { timeout: TEST_TIMEOUT_MS }, async context => {
  if (spawnSync('google-chrome', ['--version'], { stdio: 'ignore' }).error) { context.skip('google-chrome unavailable; actual component qualification remains open'); return; }
  const directory = await mkdtemp(join(tmpdir(), 'aitamer-reactions-component-'));
  context.diagnostic(`Actual component fixture/profile/evidence retained at ${directory}`);
  await mkdir(join(directory, 'lib')); await mkdir(join(directory, 'content'));
  for (const file of ['lib/reactions-v2-persistence', 'lib/reactions', 'lib/data-host', 'lib/site-meta', 'content/comment-limits', 'lib/reaction-receipts', 'lib/reaction-journal']) {
    let source: string;
    try { source = await readFile(new URL(`../${file}.ts`, import.meta.url), 'utf8'); }
    catch (error) { if (['lib/reaction-receipts', 'lib/reaction-journal'].includes(file) && (error as NodeJS.ErrnoException).code === 'ENOENT') continue; throw error; }
    await writeFile(join(directory, `${file}.mjs`), stripTypeScriptTypes(source).replace(/(from\s+['"][^'"]+)\.ts(['"])/g, '$1.mjs$2'));
  }
  const original = await readFile(new URL('../components/Reactions.astro', import.meta.url), 'utf8');
  const imports = (source: string) => source.replace(/from '(\.\.\/lib\/[^']+)'/g, (_all, specifier: string) => `from './lib/${specifier.split('/').at(-1)}.mjs'`);
  const client = imports(stripTypeScriptTypes(original.match(/^<script>\n([\s\S]*)^<\/script>/m)![1])).replace('reactionsHostAllowed(location.hostname)', "reactionsHostAllowed('localhost')");
  await writeFile(join(directory, 'component-client.mjs'), client + '\nwindow.componentReady=true;');
  const serverSource = imports(original.replace(/^<script>\n[\s\S]*^<\/script>/m, '').replace(/import\s*\{[^}]+\}\s*from\s*['"]\.\.\/lib\/site['"];?/, "const REACTIONS_SOURCE='r2';const COMMENTS_DATA_BASE='https://data.aitamer.news/';const COMMENTS_ENDPOINT='https://comments.aitamer.news/';"));
  const compiled = transform(serverSource, { filename: 'Reactions.astro', normalizedFilename: 'Reactions.astro', resultScopedSlot: true, resolvePath: (specifier: string) => specifier, internalURL: import.meta.resolve('astro/compiler-runtime') });
  assert.equal(compiled.diagnostics.some((diagnostic: any) => diagnostic.severity === 'error'), false);
  await writeFile(join(directory, 'component-server.mjs'), stripTypeScriptTypes(compiled.code));
  const { default: Component } = await import(pathToFileURL(join(directory, 'component-server.mjs')).href);
  const container = await experimental_AstroContainer.create();
  const markup = await container.renderToString(Component, { props: { slug: 'a-story' } });
  await writeFile(join(directory, 'markup.html'), markup);
  // The site's own rules for the reaction buttons, so a control the client hides is checked as rendered,
  // not only as an attribute. Only the button rules: the rest of the stylesheet (the panel's placing and
  // the reserved summary) changes this fixture's timing enough to miss its waits on slow CI runners.
  const siteStyles = (await readFile(new URL('../styles/global.css', import.meta.url), 'utf8'))
    .split('}').filter(block => /\.reactions__(react|reset)\b/.test(block.slice(0, block.indexOf('{')))).map(block => `${block}}`).join('\n');
  const html = `<!doctype html><meta charset="utf-8"><style>${siteStyles}</style><style>[data-reserved]{visibility:hidden}</style>${markup}<button id="fixture-other-control" style="position:fixed;right:10px;top:10px">Continue reading</button><script>
window.delayNextDatabaseOpen=()=>{const nativeOpen=indexedDB.open;indexedDB.open=function(...args){indexedDB.open=nativeOpen;const request=nativeOpen.apply(this,args);request.addEventListener('success',event=>{event.stopImmediatePropagation();window.releaseReset=()=>{window.releaseReset=undefined;request.onsuccess?.call(request,event)}},{once:true});return request}};
window.postCalls=0;window.getCalls=0;window.streamCalls=0;window.intentCalls=[];window.intentResponses=0;window.urls=[];
window.generation='1';window.reactions=[];window.receiptGeneration='2';window.closeGeneration='13';window.closeStatus=200;window.closeCalls=0;window.hold=false;window.pending=[];
window.stream=localStorage.getItem('fixture-stream')||'a'.repeat(32);window.expiresAt=localStorage.getItem('fixture-expiry')||new Date(Date.now()+30*86400000).toISOString();window.receipts=JSON.parse(localStorage.getItem('fixture-receipts')||'{}');window.lostOnce=false;
window.withJournal=async(transform)=>{const p=await import('./lib/reactions-v2-persistence.mjs');const db=await new Promise((resolve,reject)=>{const r=indexedDB.open(p.REACTION_V2_FENCE_DATABASE,p.REACTION_BROWSER_DATABASE_VERSION);r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error)});try{return await new Promise((resolve,reject)=>{const tx=db.transaction(p.REACTION_JOURNAL_STORE,'readwrite');const store=tx.objectStore(p.REACTION_JOURNAL_STORE);const get=store.get('https://data.aitamer.news/v2/reactions/a-story.json');let result;get.onsuccess=()=>{const journal=JSON.parse(get.result);result=transform(journal);store.put(JSON.stringify(journal),'https://data.aitamer.news/v2/reactions/a-story.json')};tx.oncomplete=()=>resolve(result);tx.onabort=()=>reject(tx.error)})}finally{db.close()}};
window.fetch=async(url,init)=>{window.urls.push(String(url));if(init?.method==='POST'){
 if(String(url).endsWith('/stream')){window.streamCalls++;window.stream=crypto.randomUUID().replaceAll('-','');window.expiresAt=new Date(Date.now()+30*86400000).toISOString();localStorage.setItem('fixture-stream',stream);localStorage.setItem('fixture-expiry',expiresAt);return new Response(JSON.stringify({ok:true,version:1,slug:'a-story',stream,capability:'e30.'+'a'.repeat(43),expiresAt}),{status:200})}
 if(String(url).endsWith('/close')){window.closeCalls++;return new Response(window.closeStatus===200?JSON.stringify({ok:true,version:1,kind:'closed',slug:'a-story',stream,processedThrough:'9223372036854775807',generation:window.closeGeneration,expiresAt,recoverUntil:new Date(Date.parse(expiresAt)+86400000).toISOString()}):'{}',{status:window.closeStatus})}
 if(String(url).endsWith('/intent')){const body=JSON.parse(init.body);window.intentCalls.push(body);const receipt=window.receipts[body.operation]||{ok:true,version:1,slug:'a-story',stream,sequence:body.sequence,operation:body.operation,processedThrough:body.sequence,generation:window.receiptGeneration,expiresAt};window.receipts[body.operation]=receipt;localStorage.setItem('fixture-receipts',JSON.stringify(window.receipts));if(window.lostOnce){window.lostOnce=false;throw new Error('fixture response lost after processing')}if(window.hold)await new Promise(resolve=>pending.push(resolve));window.intentResponses++;return new Response(JSON.stringify(receipt),{status:200})}
 window.postCalls++;return new Response(JSON.stringify({ok:true,reaction:new URLSearchParams(init.body).get('reaction')}),{status:200})}
 window.getCalls++;return new Response(JSON.stringify({version:2,slug:'a-story',generation:window.generation,reactions:window.reactions})+'\\n',{status:200})};
</script><script type="module" src="./component-client.mjs"></script>`;
  const fixture = join(directory, 'index.html'); await writeFile(fixture, html);
  const chrome = spawn('google-chrome', ['--headless=new', '--disable-gpu', '--no-first-run', '--no-default-browser-check', '--allow-file-access-from-files', '--remote-debugging-pipe', `--user-data-dir=${join(directory, 'profile')}`, 'about:blank'], { stdio: ['ignore', 'ignore', 'pipe', 'pipe', 'pipe'] });
  const harness = new ChromePipeHarness(chrome); const results: unknown[] = []; let failure: unknown;
  context.after(async () => { try { await harness.shutdown(); } finally { await writeFile(join(directory, 'results.json'), JSON.stringify(results, null, 2)); await writeFile(join(directory, 'chrome-stderr.txt'), harness.stderr); await writeFile(join(directory, 'diagnostic.txt'), `${failure instanceof Error ? failure.stack : failure ?? ''}\n${harness.diagnostics()}`); } });
  const { targetId } = await harness.call('Target.createTarget', { url: 'about:blank' }); const { sessionId } = await harness.call('Target.attachToTarget', { targetId, flatten: true });
  await harness.call('Runtime.enable', {}, sessionId); await harness.call('Page.enable', {}, sessionId);
  const evaluate = async (expression: string) => { const answer = await harness.call('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true }, sessionId); if (answer.exceptionDetails) throw Error(JSON.stringify(answer.exceptionDetails)); return answer.result.value; };
  const poll = async (expression: string) => { for (let attempt = 0; attempt < 300; attempt++) { if (await evaluate(expression)) return; await new Promise(resolve => setTimeout(resolve, 10)); } throw Error(`Fixture did not reach ${expression}`); };
  const capture = async (scenario: string) => { const value = await evaluate(`({publicGeneration:generation,publicReactions:reactions,total:document.querySelector('.reactions__total')?.textContent,choice:document.querySelector('.reactions__word')?.textContent,label:document.querySelector('.reactions__summary')?.getAttribute('aria-label'),streamCalls,intentCount:intentCalls.length,postCalls,notice:document.querySelector('.reactions__note').textContent,activeClass:document.activeElement.className,resetHidden:document.querySelector('.reactions__reset').hidden})`); results.push({ scenario, ...value }); return value; };
  const advance = async (generation: string, reactions: { id: string; n: number }[]) => evaluate(`(async()=>{window.generation=${JSON.stringify(generation)};window.reactions=${JSON.stringify(reactions)};const persistence=await import('./lib/reactions-v2-persistence.mjs');const other=persistence.loadPersistentReactionV2Totals({slug:'a-story',base:'https://data.aitamer.news/',onState:()=>{},notify:persistence.notifyReactionV2Fence});await other.initial;other.dispose()})()`);
  try {
    await harness.call('Page.navigate', { url: pathToFileURL(fixture).href }, sessionId);
    await poll("window.componentReady && document.querySelector('.reactions__total')?.textContent==='0' && getCalls===1");
    await capture('generation 1 empty');
    assert.equal(await evaluate("(()=>{const button=document.querySelector('.reactions__reset');return button.hidden&&getComputedStyle(button).display==='none'})()"), true, 'a hidden reset control must not render');
    await evaluate("document.querySelector('[data-reaction=love]').click()");
    await poll('postCalls===1 || intentCalls.length===1');
    assert.equal((await capture('Love chosen')).total, '1');
    await advance('2', [{ id: 'love', n: 1 }]);
    await new Promise(resolve => setTimeout(resolve, 100));
    assert.equal((await capture('generation 2 already includes Love')).total, '1', 'a reflected click must not be counted twice');
    await poll("document.querySelector('.reactions__note').textContent===''");
    await evaluate("window.receiptGeneration='4';window.hold=true;document.querySelector('[data-reaction=wow]').click()");
    await poll('intentCalls.length===2 && pending.length===1');
    assert.equal((await capture('change to Wow pins generation 2')).total, '1');
    await advance('3', [{ id: 'love', n: 101 }]);
    await new Promise(resolve => setTimeout(resolve, 40));
    assert.equal((await capture('unrelated advance cannot settle held intent')).total, '1');
    await evaluate('window.hold=false;pending.splice(0).forEach(resolve=>resolve())');
    await new Promise(resolve => setTimeout(resolve, 40));
    assert.equal((await capture('receipt barrier 4 waits for publication')).total, '1');
    await advance('4', [{ id: 'love', n: 100 }, { id: 'wow', n: 1 }]);
    await poll("document.querySelector('.reactions__total').textContent==='101' && document.querySelector('.reactions__note').textContent===''");
    await capture('authoritative 101 adopted after causal coverage');
    await evaluate("window.receiptGeneration='5';document.querySelector('[data-reaction=wow]').click()");
    await poll('intentCalls.length===3');
    assert.equal((await capture('removal is immediate against pinned snapshot')).total, '100');
    await advance('4', [{ id: 'love', n: 100 }, { id: 'wow', n: 1 }]);
    assert.equal((await capture('repeated envelope does not repeat removal')).total, '100');
    await advance('5', [{ id: 'love', n: 100 }]);
    await poll("document.querySelector('.reactions__note').textContent===''");
    assert.equal((await capture('removal settled')).total, '100');
    await evaluate("window.receiptGeneration='6';document.querySelector('[data-reaction=love]').click()");
    await poll('intentCalls.length===4');
    assert.equal((await capture('shared-address or suppressed result remains provisional')).total, '101');
    await advance('6', [{ id: 'love', n: 100 }]);
    await poll("document.querySelector('.reactions__note').textContent===''");
    const anonymous = await capture('receipt never asserts personal contribution');
    assert.equal(anonymous.total, '100'); assert.equal(anonymous.choice, 'Love');
    await evaluate("window.receiptGeneration='7';window.lostOnce=true;document.querySelector('[data-reaction=wow]').click()");
    await poll('intentCalls.length===5');
    const operation = await evaluate('intentCalls.at(-1).operation');
    await advance('7', [{ id: 'love', n: 999 }, { id: 'wow', n: 1 }]);
    await new Promise(resolve => setTimeout(resolve, 40));
    assert.equal((await capture('lost response cannot settle from a public generation')).total, '100');
    await evaluate("document.querySelector('.reactions__react').click()");
    await poll('intentCalls.length>=6');
    assert.equal(await evaluate('intentCalls.at(-1).operation'), operation);
    await poll("document.querySelector('.reactions__total').textContent==='1,000' && document.querySelector('.reactions__note').textContent===''");
    await capture('same operation receipt recovery settles authoritative 1000');
    assert.equal(await evaluate("urls.filter(url=>!url.includes('/react/v1/')).some(url=>url.includes('capability')||url.includes('operation')||url.includes('e30.'))"), false);
    assert.equal(await evaluate("document.querySelector('.reactions').outerHTML.includes('capability')||document.querySelector('.reactions').outerHTML.includes('e30.')"), false);
    // A second actual page shares transactional journal state; a deliberately late old receipt
    // must not erase coverage from the newer intent issued by the first page.
    const { targetId: secondTarget } = await harness.call('Target.createTarget', { url: 'about:blank' });
    const { sessionId: secondSession } = await harness.call('Target.attachToTarget', { targetId: secondTarget, flatten: true });
    await harness.call('Runtime.enable', {}, secondSession); await harness.call('Page.enable', {}, secondSession);
    const other = async (expression: string) => { const answer = await harness.call('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true }, secondSession); if (answer.exceptionDetails) throw Error(JSON.stringify(answer.exceptionDetails)); return answer.result.value; };
    await harness.call('Page.navigate', { url: pathToFileURL(fixture).href }, secondSession);
    for (let attempt = 0; attempt < 200 && !await other('!!window.componentReady'); attempt++) await new Promise(resolve => setTimeout(resolve, 10));
    await other("window.receiptGeneration='8';window.hold=true;document.querySelector('[data-reaction=love]').click()");
    for (let attempt = 0; attempt < 200 && !await other('pending.length===1'); attempt++) await new Promise(resolve => setTimeout(resolve, 10));
    await poll("document.querySelector('.reactions__word').textContent==='Love'");
    await other("window.receiptGeneration='9'");
    await evaluate("window.receiptGeneration='9';document.querySelector('[data-reaction=angry]').click()");
    await evaluate("withJournal(journal=>{journal.lease.until=0;journal.revision=String(BigInt(journal.revision)+1n)})");
    await evaluate("document.querySelector('.reactions__react').click()");
    for (let attempt = 0; attempt < 300; attempt++) { if (await evaluate("intentCalls.some(intent=>intent.sequence==='7')") || await other("intentCalls.some(intent=>intent.sequence==='7')")) break; await new Promise(resolve => setTimeout(resolve, 10)); }
    if (await other("intentCalls.some(intent=>intent.sequence==='7')")) await other('pending.pop()()');
    await advance('9', [{ id: 'angry', n: 1 }, { id: 'love', n: 999 }]);
    await poll("document.querySelector('.reactions__note').textContent===''");
    await other('window.hold=false;pending.splice(0).forEach(resolve=>resolve())');
    await new Promise(resolve => setTimeout(resolve, 60));
    assert.equal(await evaluate('withJournal(journal=>journal.through)'), '7');
    assert.equal((await capture('late old tab receipt cannot lower coverage or change selection')).choice, 'Angry');
    assert.equal(await other("document.querySelector('.reactions__word').textContent"), 'Angry');
    await harness.call('Target.closeTarget', { targetId: secondTarget });

    // Lost response recovery survives a whole page instance, preserving the operation identity.
    await evaluate("window.receiptGeneration='10';window.lostOnce=true;document.querySelector('[data-reaction=funny]').click()");
    await poll("intentCalls.some(intent=>intent.sequence==='8')");
    const lostOperation = await evaluate('intentCalls.at(-1).operation');
    await advance('10', [{ id: 'funny', n: 42 }, { id: 'love', n: 999 }]);
    const previousOrigin = await evaluate('performance.timeOrigin');
    await harness.call('Page.reload', {}, sessionId);
    for (let attempt = 0; attempt < 300; attempt++) { if (await evaluate(`window.componentReady && performance.timeOrigin!==${previousOrigin} && intentCalls.length>0`)) break; await new Promise(resolve => setTimeout(resolve, 10)); }
    assert.equal(await evaluate('intentCalls[0].operation'), lostOperation);
    await poll("document.querySelector('.reactions__total').textContent==='1,041'");
    assert.equal((await capture('reload recovers exactly the durable lost operation')).choice, 'Funny');

    // A normal user opening the panel reloads ready public data; settlement is not dependent on
    // a test-only/manual reader refresh or another tab supplying a new envelope.
    await evaluate("window.receiptGeneration='11';document.querySelector('[data-reaction=love]').click()");
    await poll("intentCalls.some(intent=>intent.sequence==='9')");
    await evaluate("window.generation='11';window.reactions=[{id:'love',n:50}];document.querySelector('.reactions__react').click()");
    await poll("document.querySelector('.reactions__total').textContent==='50' && document.querySelector('.reactions__note').textContent===''");
    await capture('production panel reload adopts receipt-covered public file');

    // Expiry closes the old stream durably, then waits for its terminal public barrier. A
    // client-clock jump or the end of grace must never erase an already validated close proof.
    await evaluate("window.hold=true;window.receiptGeneration='12';document.querySelector('[data-reaction=wow]').click()");
    await poll('pending.length===1');
    await evaluate("window.realDateNow=Date.now;window.clock=Date.parse(expiresAt)+3600000;Date.now=()=>window.clock;document.querySelector('.reactions__react').click()");
    await poll('closeCalls===1');
    assert.equal(await evaluate('withJournal(journal=>journal.closure.kind)'), 'closed');
    const beforeClosedChoice = await evaluate('intentCalls.length');
    await evaluate("document.querySelector('[data-reaction=angry]').click()");
    assert.equal(await evaluate('intentCalls.length'), beforeClosedChoice, 'old stream remains pinned before terminal publication');
    await evaluate('window.clock=Date.parse(expiresAt)+2*86400000');
    await advance('13', [{ id: 'love', n: 50 }]);
    await poll("document.querySelector('.reactions__total').textContent==='50' && document.querySelector('.reactions__note').textContent===''");
    await evaluate('window.hold=false;pending.splice(0).forEach(resolve=>resolve())');
    await new Promise(resolve => setTimeout(resolve, 30));
    assert.equal(await evaluate('withJournal(journal=>journal.closure.kind)'), 'closed');
    await evaluate("window.receiptGeneration='14';document.querySelector('[data-reaction=angry]').click()");
    await poll('streamCalls===1');
    await poll("intentCalls.at(-1).sequence==='1'");
    await advance('14', [{ id: 'angry', n: 1 }, { id: 'love', n: 49 }]);
    await poll("document.querySelector('.reactions__note').textContent===''");

    // Outside recovery grace, preserve unknown work and offer an explicit, disclosed local reset.
    await evaluate("window.hold=true;window.receiptGeneration='15';document.querySelector('[data-reaction=funny]').click()");
    await poll('pending.length===1');
    await evaluate("window.clock=Date.parse(expiresAt)+2*86400000;document.querySelector('.reactions__react').click()");
    await poll("document.querySelector('.reactions__reset').hidden===false");
    assert.notEqual(await evaluate("getComputedStyle(document.querySelector('.reactions__reset')).display"), 'none', 'an offered reset control must render');
    assert.equal(await evaluate("document.querySelector('.reactions__note').getAttribute('role')"), 'status');
    assert.equal(await evaluate("document.querySelector('.reactions__note').getAttribute('aria-live')"), 'polite');
    assert.equal(await evaluate("document.querySelector('.reactions__note').textContent.includes('requests already sent may still finish')"), true);
    assert.equal(await evaluate("document.querySelector('.reactions__reset').getAttribute('aria-describedby')===document.querySelector('.reactions__note').id"), true);
    await evaluate(`(async()=>{const {createReactionJournal}=await import('./lib/reaction-journal.mjs');window.stale=createReactionJournal({slug:'a-story',base:'https://data.aitamer.news/',endpoint:'https://comments.aitamer.news/react',initialChoice:null,onState:()=>{},subscribe:()=>()=>{}});await stale.initial})()`);
    const callsBeforeReset = await evaluate('intentCalls.length+streamCalls');
    const oldEpoch = await evaluate('withJournal(journal=>journal.epoch)');
    await evaluate("document.querySelector('.reactions__reset').focus()");
    await capture('before keyboard reset');
    assert.equal(await evaluate("document.activeElement===document.querySelector('.reactions__reset')"), true);
    await harness.call('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Enter', code: 'Enter', windowsVirtualKeyCode: 13, text: '\r', unmodifiedText: '\r' }, sessionId);
    await harness.call('Input.dispatchKeyEvent', { type: 'keyUp', key: 'Enter', code: 'Enter', windowsVirtualKeyCode: 13 }, sessionId);
    await new Promise(resolve => setTimeout(resolve, 60));
    await capture('after keyboard reset');
    await poll("document.querySelector('.reactions__note').textContent.startsWith('Local confirmation reset.')");
    const resetEpoch = await evaluate('withJournal(journal=>journal.epoch)'); assert.notEqual(resetEpoch, oldEpoch);
    assert.equal(await evaluate('intentCalls.length+streamCalls'), callsBeforeReset, 'reset must send nothing');
    assert.equal(await evaluate("document.activeElement===document.querySelector('.reactions__react')"), true);
    await evaluate('stale.reset()');
    assert.equal(await evaluate('withJournal(journal=>journal.epoch)'), resetEpoch, 'old tab cannot clear a newer epoch');
    assert.equal(await evaluate(`withJournal(journal=>JSON.parse(journal.seen).generation==='14')`), true, 'public monotone fence survives reset');
    await capture('explicit keyboard reset preserves choice and uncertainty without sending');
    await evaluate("window.hold=false;pending.splice(0).forEach(resolve=>resolve());window.receiptGeneration='15';document.querySelector('[data-reaction=love]').click()");
    await poll('streamCalls===2');
    await advance('15', [{ id: 'love', n: 50 }]);
    await poll("document.querySelector('.reactions__total').textContent==='50'");
    await evaluate(`withJournal(journal=>{journal.intents=Array.from({length:256},(_,index)=>({sequence:String(index+1),operation:'f'.repeat(24)+index.toString(16).padStart(8,'0'),reaction:'love'}));journal.through='256';journal.attempted='256';journal.barrier='15';journal.pin=null;journal.lease=null;journal.revision=String(BigInt(journal.revision)+1n)})`);
    await evaluate("window.receiptGeneration='16';document.querySelector('[data-reaction=wow]').click()");
    await poll('streamCalls===3');
    assert.equal(await evaluate('intentCalls.at(-1).sequence'), '1');
    await advance('16', [{ id: 'love', n: 49 }, { id: 'wow', n: 1 }]);
    await poll("document.querySelector('.reactions__total').textContent==='50'");
    await capture('settled 256-operation stream rolls to sequence 1 normally');
    await evaluate(`withJournal(journal=>{journal.intents=Array.from({length:256},(_,index)=>({sequence:String(index+1),operation:'e'.repeat(24)+index.toString(16).padStart(8,'0'),reaction:'wow'}));journal.through='255';journal.attempted='256';journal.barrier='16';journal.pin={bytes:journal.seen,known:true,choice:'wow'};journal.lease=null;journal.revision=String(BigInt(journal.revision)+1n)})`);
    const callsAtCapacity = await evaluate('intentCalls.length+streamCalls');
    await evaluate("document.querySelector('[data-reaction=angry]').click()");
    await poll("document.querySelector('.reactions__note').textContent.includes('Earlier reactions are still confirming')");
    assert.equal(await evaluate('intentCalls.length+streamCalls'), callsAtCapacity);
    await evaluate("withJournal(journal=>{journal.through='256';journal.revision=String(BigInt(journal.revision)+1n)})");
    await evaluate("window.receiptGeneration='17';document.querySelector('[data-reaction=angry]').click()");
    await poll('streamCalls===4');
    assert.equal(await evaluate('intentCalls.at(-1).sequence'), '1');
    await advance('17', [{ id: 'angry', n: 1 }, { id: 'love', n: 49 }]);
    await poll("document.querySelector('.reactions__total').textContent==='50'");
    // Drop notifications/poll callbacks in a real second page after it issued Love, so it misses the damaged bytes and
    // the reset entirely. Its held old response is released only after Angry settles.
    const { targetId: staleTarget } = await harness.call('Target.createTarget', { url: 'about:blank' });
    const { sessionId: staleSession } = await harness.call('Target.attachToTarget', { targetId: staleTarget, flatten: true });
    await harness.call('Runtime.enable', {}, staleSession); await harness.call('Page.enable', {}, staleSession);
    const staleTab = async (expression: string) => { const answer = await harness.call('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true }, staleSession); if (answer.exceptionDetails) throw Error(JSON.stringify(answer.exceptionDetails)); return answer.result.value; };
    const stalePoll = async (expression: string) => { for (let attempt = 0; attempt < 300; attempt++) { if (await staleTab(expression)) return; await new Promise(resolve => setTimeout(resolve, 10)); } results.push({scenario: "stale tab condition timeout", expression, state: await staleTab("(async()=>({ready:window.componentReady,choice:document.querySelector('.reactions__word').textContent,notice:document.querySelector('.reactions__note').textContent,private:await withJournal(journal=>({selected:journal.selected,revision:journal.revision})),streams:streamCalls,intents:intentCalls.length}))()")}); throw Error(`Stale tab did not reach ${expression}`); };
    await harness.call('Page.addScriptToEvaluateOnNewDocument', { source: `Date.now=()=>${await evaluate('Date.now()')};
window.missUpdates=false;const NativeChannel=BroadcastChannel;window.BroadcastChannel=class extends NativeChannel{constructor(...args){super(...args);this.addEventListener('message',event=>{if(window.missUpdates)event.stopImmediatePropagation()})}};
for(const name of ['pageshow','focus'])window.addEventListener(name,event=>{if(window.missUpdates)event.stopImmediatePropagation()},true);
document.addEventListener('visibilitychange',event=>{if(window.missUpdates)event.stopImmediatePropagation()},true);
const nativeTimeout=setTimeout;window.setTimeout=(callback,delay,...args)=>nativeTimeout(()=>{if(delay===5000&&window.missUpdates)return;callback(...args)},delay);` }, staleSession);
    await harness.call('Page.navigate', { url: pathToFileURL(fixture).href }, staleSession);
    await stalePoll("window.componentReady && document.querySelector('.reactions__word').textContent==='Angry'");
    await staleTab("window.receiptGeneration='18';window.hold=true;document.querySelector('[data-reaction=love]').click()");
    await stalePoll('pending.length===1');
    await poll("document.querySelector('.reactions__word').textContent==='Love'");
    const beforeResetRevision = await evaluate('withJournal(journal=>journal.revision)');
    await staleTab('window.missUpdates=true');
    const beforeDamagedReset = await evaluate('intentCalls.length+streamCalls');
    await evaluate("withJournal(journal=>{journal.stream.capability='lost-capability';journal.revision=String(BigInt(journal.revision)+1n)})");
    await evaluate("(async()=>{const p=await import('./lib/reactions-v2-persistence.mjs');p.notifyReactionV2Fence()})()");
    await poll("document.querySelector('.reactions__reset').hidden===false");
    await evaluate('delayNextDatabaseOpen()');
    const pendingReset = await evaluate("(()=>{const button=document.querySelector('.reactions__reset');button.focus();button.click();button.dispatchEvent(new MouseEvent('click'));return {disabled:button.disabled,busy:button.getAttribute('aria-busy'),label:button.textContent}})()");
    assert.deepEqual(pendingReset, { disabled: true, busy: 'true', label: 'Resetting local confirmation…' });
    await poll("typeof window.releaseReset==='function'");
    const otherControl = await evaluate("(()=>{const rect=document.querySelector('#fixture-other-control').getBoundingClientRect();return {x:rect.x+rect.width/2,y:rect.y+rect.height/2}})()");
    await harness.call('Input.dispatchMouseEvent', { type: 'mousePressed', button: 'left', clickCount: 1, ...otherControl }, sessionId);
    await harness.call('Input.dispatchMouseEvent', { type: 'mouseReleased', button: 'left', clickCount: 1, ...otherControl }, sessionId);
    assert.equal(await evaluate("document.activeElement.id"), 'fixture-other-control');
    await evaluate('releaseReset()');
    await poll("!document.querySelector('.reactions__reset').disabled");
    const rapidReset = await capture('rapid delayed reset preserves intentionally moved focus');
    assert.equal(await evaluate("document.activeElement.id"), 'fixture-other-control', 'reset completion must not steal focus after the reader moved to another control');
    assert.equal(rapidReset.notice.startsWith('Local confirmation reset.'), true, 'rapid reset pair must leave the recovered journal usable');
    results.push({scenario:'damaged reset immediate database',value:await evaluate('withJournal(journal=>({revision:journal.revision,selected:journal.selected,resetUncertain:journal.resetUncertain,intents:journal.intents.length}))')});
    await poll("document.querySelector('.reactions__note').textContent.startsWith('Local confirmation reset.')");
    assert.equal(await evaluate('intentCalls.length+streamCalls'), beforeDamagedReset);
    assert.equal(await evaluate("withJournal(journal=>JSON.parse(journal.seen).generation)"), '17');
    assert.equal(await evaluate('withJournal(journal=>journal.intents.length)'), 0, 'reset discards old retry identities');
    const damagedResetEpoch = await evaluate('withJournal(journal=>journal.epoch)');
    await capture('explicit reset recovers damaged capability without clearing public fence or sending');
    await evaluate("window.receiptGeneration='18';document.querySelector('[data-reaction=angry]').click()");
    await poll('streamCalls===5');
    await advance('18', [{ id: 'angry', n: 1 }, { id: 'love', n: 49 }]);
    await poll("document.querySelector('.reactions__note').textContent.startsWith('Local confirmation reset.') && document.querySelector('.reactions__word').textContent==='Angry'");
    const replacementRevision = await evaluate('withJournal(journal=>journal.revision)');
    assert.ok(BigInt(replacementRevision) < BigInt(beforeResetRevision), 'fixture exercises revision restart across damaged replacement');
    await staleTab('window.missUpdates=false');
    await staleTab('window.hold=false;pending.splice(0).forEach(resolve=>resolve());window.dispatchEvent(new Event("focus"))');
    await stalePoll('intentResponses===1');
    // Both the resumed old delivery and foreground refresh must preserve the receipt-covered replacement.
    await stalePoll(`withJournal(journal=>journal.epoch===${JSON.stringify(damagedResetEpoch)} && journal.through==='1')`);
    await new Promise(resolve => setTimeout(resolve, 80));
    results.push({ scenario: 'missed damaged reset with held old response', beforeResetRevision, replacementRevision,
      stale: await staleTab("({choice:document.querySelector('.reactions__word').textContent,notice:document.querySelector('.reactions__note').textContent,intentCount:intentCalls.length})"),
      durable: await evaluate('withJournal(journal=>({choice:journal.selected,resetUncertain:journal.resetUncertain,intents:journal.intents.length,through:journal.through}))') });
    assert.equal(await staleTab("document.querySelector('.reactions__word').textContent"), 'Angry', 'a tab missing corruption must adopt the replacement epoch despite its lower revision');
    await stalePoll("document.querySelector('.reactions__note').textContent.startsWith('Local confirmation reset.')");
    assert.equal(await staleTab('intentCalls.length'), 1, 'old tab must not resend retired intents');
    assert.equal(await evaluate('withJournal(journal=>journal.epoch)'), damagedResetEpoch, 'late old response cannot replace reset epoch');
    assert.equal(await evaluate('withJournal(journal=>journal.intents.length)'), 1);
    assert.equal(await evaluate("withJournal(journal=>JSON.parse(journal.seen).generation)"), '18');
    await harness.call('Target.closeTarget', { targetId: staleTarget });
    // A native IndexedDB write failure during reset must restore the actionable control,
    // retain the exact damaged state/public fence, and allow an explicit keyboard retry.
    await evaluate("withJournal(journal=>{journal.stream.capability='lost before failed reset';journal.revision=String(BigInt(journal.revision)+1n)})");
    await evaluate("(async()=>{const p=await import('./lib/reactions-v2-persistence.mjs');p.notifyReactionV2Fence()})()");
    await poll("document.querySelector('.reactions__reset').hidden===false");
    const damagedState = await evaluate('withJournal(journal=>JSON.stringify(journal))');
    const callsBeforeFailedReset = await evaluate('intentCalls.length+streamCalls');
    await evaluate('delayNextDatabaseOpen()');
    await evaluate("window.resetPut=IDBObjectStore.prototype.put;window.failResetPut=true;IDBObjectStore.prototype.put=function(...args){if(this.name==='journal'&&window.failResetPut){window.failResetPut=false;throw new DOMException('fixture reset quota','QuotaExceededError')}return resetPut.apply(this,args)};const button=document.querySelector('.reactions__reset');button.focus();button.click();button.click()");
    await poll("typeof window.releaseReset==='function'");
    await evaluate('releaseReset()');
    await poll("!document.querySelector('.reactions__reset').disabled && document.querySelector('.reactions__note').textContent.includes('could not be saved')");
    assert.equal(await evaluate("document.querySelector('.reactions__reset').hasAttribute('aria-busy')"), false);
    assert.equal(await evaluate("document.activeElement===document.querySelector('.reactions__reset')"), true, 'failed reset keeps the retry control focused');
    assert.equal(await evaluate('withJournal(journal=>JSON.stringify(journal))'), damagedState, 'aborted reset preserves exact private state');
    assert.equal(await evaluate("withJournal(journal=>JSON.parse(journal.seen).generation)"), '18');
    assert.equal(await evaluate('intentCalls.length+streamCalls'), callsBeforeFailedReset);
    await capture('failed damaged reset leaves accessible retry and preserves state');
    await evaluate('IDBObjectStore.prototype.put=resetPut;delayNextDatabaseOpen()');
    await harness.call('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Enter', code: 'Enter', windowsVirtualKeyCode: 13, text: '\r', unmodifiedText: '\r' }, sessionId);
    await harness.call('Input.dispatchKeyEvent', { type: 'keyUp', key: 'Enter', code: 'Enter', windowsVirtualKeyCode: 13 }, sessionId);
    await poll("typeof window.releaseReset==='function'");
    await evaluate('releaseReset()');
    await poll("document.querySelector('.reactions__note').textContent.startsWith('Local confirmation reset.') && !document.querySelector('.reactions__reset').disabled");
    assert.equal(await evaluate("document.activeElement===document.querySelector('.reactions__react')"), true);
    assert.equal(await evaluate('intentCalls.length+streamCalls'), callsBeforeFailedReset, 'reset retry must send nothing');
    await evaluate("window.receiptGeneration='19';document.querySelector('[data-reaction=funny]').click()");
    await poll(`intentCalls.length+streamCalls===${callsBeforeFailedReset + 2}`);
    await advance('19', [{ id: 'funny', n: 1 }, { id: 'love', n: 49 }]);
    await poll("document.querySelector('.reactions__word').textContent==='Funny' && document.querySelector('.reactions__note').textContent.startsWith('Local confirmation reset.')");
    assert.equal(await evaluate("document.querySelector('.reactions__summary').hasAttribute('data-reserved')"), false);
    await capture('keyboard reset retry recovers journal and permits the next explicit choice');
    const beforeQuota = await evaluate('intentCalls.length+streamCalls');
    await evaluate("window.originalPut=IDBObjectStore.prototype.put;IDBObjectStore.prototype.put=function(...args){if(this.name==='journal')throw new DOMException('fixture quota','QuotaExceededError');return originalPut.apply(this,args)};document.querySelector('[data-reaction=funny]').click()");
    await poll("document.querySelector('.reactions__note').textContent.includes('could not be saved')");
    assert.equal(await evaluate('intentCalls.length+streamCalls'), beforeQuota, 'no request may precede durable intent commit');
    assert.equal(await evaluate("document.querySelector('.reactions__summary').hasAttribute('data-reserved')"), true);
    await evaluate('IDBObjectStore.prototype.put=originalPut');
    await capture('journal quota failure hides counts and sends nothing');

    // The baked/v1 path keeps its existing optimistic numbers and legacy POST/storage behavior.
    const bakedCompiled = transform(serverSource.replace("REACTIONS_SOURCE='r2'", "REACTIONS_SOURCE='baked'"), { filename: 'ReactionsBaked.astro', normalizedFilename: 'ReactionsBaked.astro', resultScopedSlot: true, resolvePath: (specifier: string) => specifier, internalURL: import.meta.resolve('astro/compiler-runtime') });
    await writeFile(join(directory, 'component-server-baked.mjs'), stripTypeScriptTypes(bakedCompiled.code));
    const { default: Baked } = await import(pathToFileURL(join(directory, 'component-server-baked.mjs')).href);
    const bakedMarkup = await container.renderToString(Baked, { props: { slug: 'baked-story', file: { reactions: [{ id: 'love', n: 1 }] } } });
    const bakedFixture = join(directory, 'baked.html'); await writeFile(bakedFixture, html.replace(markup, bakedMarkup));
    const beforeBaked = await evaluate('performance.timeOrigin');
    await harness.call('Page.navigate', { url: pathToFileURL(bakedFixture).href }, sessionId);
    for (let attempt = 0; attempt < 300; attempt++) { if (await evaluate(`window.componentReady && performance.timeOrigin!==${beforeBaked}`)) break; await new Promise(resolve => setTimeout(resolve, 10)); }
    await evaluate("document.querySelector('[data-reaction=wow]').click()");
    await poll('postCalls===1');
    assert.equal((await capture('baked v1 path retains optimistic totals')).total, '2');
    assert.equal(await evaluate('streamCalls+intentCalls.length+getCalls'), 0);
    assert.equal(await evaluate("JSON.parse(localStorage.getItem('atn:react:baked-story')).r"), 'wow');
    await evaluate("document.querySelector('.reactions__react').focus()");
    await harness.call('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Enter', code: 'Enter', windowsVirtualKeyCode: 13, text: '\r', unmodifiedText: '\r' }, sessionId);
    await harness.call('Input.dispatchKeyEvent', { type: 'keyUp', key: 'Enter', code: 'Enter', windowsVirtualKeyCode: 13 }, sessionId);
    await poll("document.activeElement.dataset.reaction==='wow'");
    assert.equal(await evaluate("document.activeElement.getAttribute('role')"), 'menuitemradio');
    assert.equal(await evaluate("document.activeElement.getAttribute('aria-checked')"), 'true');
    await harness.call('Input.dispatchKeyEvent', { type: 'keyDown', key: 'ArrowRight', code: 'ArrowRight', windowsVirtualKeyCode: 39 }, sessionId);
    await harness.call('Input.dispatchKeyEvent', { type: 'keyUp', key: 'ArrowRight', code: 'ArrowRight', windowsVirtualKeyCode: 39 }, sessionId);
    assert.equal(await evaluate('document.activeElement.dataset.reaction'), 'funny');
    await harness.call('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Escape', code: 'Escape', windowsVirtualKeyCode: 27 }, sessionId);
    await harness.call('Input.dispatchKeyEvent', { type: 'keyUp', key: 'Escape', code: 'Escape', windowsVirtualKeyCode: 27 }, sessionId);
    await poll("document.activeElement===document.querySelector('.reactions__react')");



  } catch (error) { failure = error; try { await capture('failure state'); } catch {} throw error; }
});

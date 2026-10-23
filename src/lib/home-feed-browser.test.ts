/** Real Chromium regression for append-induced scroll events; no shared server or build output. */
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { spawn, spawnSync } from 'node:child_process';
import { mkdtemp, readFile, writeFile } from 'node:fs/promises';
import { stripTypeScriptTypes } from 'node:module';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

test('native anchoring cannot turn one scroll into five loads; continued scrolling and suspension still work', { timeout: 20000 }, async (t) => {
  if (spawnSync('google-chrome', ['--version'], { stdio: 'ignore' }).error) {
    t.skip('google-chrome is unavailable; Chromium scroll-anchoring qualification requires this focused test');
    return;
  }
  const directory = await mkdtemp(join(tmpdir(), 'aitamer-home-feed-scroll-'));
  t.diagnostic(`Browser fixture and result retained at ${directory}`);
  for (const name of ['home-feed-browser', 'home-feed-client', 'home-feed-protocol', 'home-feed-transport', 'home-feed']) {
    const source = await readFile(new URL(`./${name}.ts`, import.meta.url), 'utf8');
    await writeFile(join(directory, `${name}.mjs`), stripTypeScriptTypes(source).replace(/(from\s+['"]\.\/[^'"]+)\.ts(['"])/g, '$1.mjs$2'));
  }
  const initial = Array.from({ length: 12 }, (_, i) => `<li id="home-post-p${i}" data-home-post="p${i}"><article><h3>Initial ${i}</h3></article></li>`).join('');
  const html = `<!doctype html><html style="overflow-anchor:auto!important;--fixture:keep"><meta charset="utf-8"><style>html,body{margin:0}li{height:200px;list-style:none}ul{margin:0;padding:0}footer{height:800px}.sentinel{height:1px}[hidden]{display:none}</style>
    <section data-home-feed data-initial-count="12" data-initial-limit="12" data-batch-size="12" data-batch-count="5" data-planned-count="72" data-max-auto-batches="5" data-snapshot="${'a'.repeat(64)}" data-initial-ids='${JSON.stringify(Array.from({ length: 12 }, (_, i) => `p${i}`))}'>
    <ul data-home-feed-cards>${initial}</ul><div class="sentinel" data-home-feed-sentinel></div><p data-home-feed-status></p><div data-home-feed-error hidden><button data-home-feed-retry>Retry</button></div><p><a id="news" href="#news">View all News</a></p></section><footer>Lower panels/footer</footer>
    <script type="module">
      import {mountHomeFeed} from './home-feed-browser.mjs';
      window.calls=[];window.delay=location.hash==='#restore-suspended'?180:10;window.scrolls=[];window.errorOnce=location.hash==='#restore-error';
      window.fetch=async(url)=>{const n=Number(url.match(/home-feed\\/(\\d+)/)[1]);window.calls.push(n);await new Promise(r=>setTimeout(r,window.delay));if(window.errorOnce){window.errorOnce=false;throw new Error('Fixture network failure')}const ids=Array.from({length:12},(_,i)=>'p'+(n*12+i));const template=document.createElement('template');Object.assign(template.dataset,{homeFeedSchema:'1',homeFeedSnapshot:'a'.repeat(64),homeFeedIndex:String(n),homeFeedOffset:String(n*12),homeFeedCount:'12',homeFeedIds:JSON.stringify(ids)});template.innerHTML=ids.map(id=>'<li id="home-post-'+id+'" data-home-post="'+id+'"><article><h3>'+id+'</h3></article></li>').join('');return new Response(template.outerHTML,{headers:{'content-type':'text/html'}})};
      const root=document.querySelector('[data-home-feed]');root.dataset.batchPrefix=location.pathname+'/home-feed/';
      window.addEventListener('scroll',()=>window.scrolls.push(scrollY));
      if(location.hash.startsWith('#restore-')){
        Object.defineProperty(performance,'getEntriesByType',{value:()=>[{type:'back_forward'}]});
        const suspendedReplay=location.hash==='#restore-suspended';
        history.replaceState({aitamerHomeFeedV1:{version:1,snapshot:'a'.repeat(64),loadedBatches:suspendedReplay?3:1,anchor:suspendedReplay?'p40':'p12',anchorOffset:suspendedReplay?-17:0,scrollY:suspendedReplay?8000:1500}},'');
      }
      if(location.hash==='#restore-queued'){
        window.queued=[];window.requestAnimationFrame=(callback)=>window.queued.push(callback);
        window.cancelAnimationFrame=(id)=>{window.queued[id-1]=null};
      }
      mountHomeFeed(root);window.fixtureReady=true;
    </script></html>`;
  const fixture = join(directory, 'index.html');
  await writeFile(fixture, html);
  const chrome = spawn('google-chrome', ['--headless=new', '--disable-gpu', '--no-first-run', '--no-default-browser-check', '--allow-file-access-from-files', '--remote-debugging-pipe', `--user-data-dir=${join(directory, 'profile')}`, 'about:blank'], { stdio: ['ignore', 'ignore', 'pipe', 'pipe', 'pipe'] });
  t.after(() => { if (chrome.exitCode === null) chrome.kill(); });
  let id = 0;
  let buffer = '';
  let stderr = '';
  const pending = new Map<number, { resolve: (value: any) => void; reject: (error: unknown) => void }>();
  chrome.stderr?.on('data', (bytes) => { stderr += bytes; });
  const input = chrome.stdio[3] as NodeJS.WritableStream;
  const output = chrome.stdio[4] as NodeJS.ReadableStream;
  output.on('data', (bytes) => {
    buffer += bytes.toString();
    let end: number;
    while ((end = buffer.indexOf('\0')) >= 0) {
      const message = JSON.parse(buffer.slice(0, end)); buffer = buffer.slice(end + 1);
      if (message.id) {
        const waiter = pending.get(message.id); pending.delete(message.id);
        if (message.error) waiter?.reject(message.error); else waiter?.resolve(message.result);
      }
    }
  });
  const call = (method: string, params: object = {}, sessionId?: string) => new Promise<any>((resolve, reject) => {
    const next = ++id; pending.set(next, { resolve, reject });
    input.write(JSON.stringify({ id: next, method, params, ...(sessionId ? { sessionId } : {}) }) + '\0');
  });
  const results: unknown[] = [];
  try {
    const { targetId } = await call('Target.createTarget', { url: 'about:blank' });
    const { sessionId } = await call('Target.attachToTarget', { targetId, flatten: true });
    await call('Runtime.enable', {}, sessionId);
    await call('Page.enable', {}, sessionId);
    const evaluate = async (expression: string) => {
      const response = await call('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true }, sessionId);
      if (response.exceptionDetails) throw new Error(JSON.stringify(response.exceptionDetails));
      return response.result.value;
    };
    const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
    const read = () => evaluate(`({calls:[...window.calls],cards:document.querySelectorAll('[data-home-post]').length,y:scrollY,scrolls:[...window.scrolls],anchor:document.documentElement.style.getPropertyValue('overflow-anchor'),priority:document.documentElement.style.getPropertyPriority('overflow-anchor'),fixture:document.documentElement.style.getPropertyValue('--fixture'),history:history.state?.aitamerHomeFeedV1,targetTop:document.getElementById('home-post-p40')?.getBoundingClientRect().top})`);
    await call('Page.navigate', { url: pathToFileURL(fixture).href }, sessionId);
    for (let i = 0; i < 100 && !await evaluate('!!window.fixtureReady'); i++) await wait(10);
    assert.equal(await evaluate('!!window.fixtureReady'), true);
    await evaluate(`document.querySelector('#news').focus({preventScroll:true});window.scrollTo(0,document.querySelector('[data-home-feed-sentinel]').offsetTop)`);
    await wait(700);
    let result = await read(); results.push(result);
    assert.deepEqual(result.calls, [1], 'append-induced scroll anchoring must not consume another batch');
    assert.equal(result.cards, 24);
    assert.equal(result.anchor, 'none');
    assert.equal(result.priority, 'important');

    // Persisted pagehide must keep suppression, abort once and remain quiet after pageshow.
    await evaluate(`window.delay=300;window.scrollTo(0,document.querySelector('[data-home-feed-sentinel]').offsetTop)`);
    for (let i = 0; i < 50 && (await read()).calls.length < 2; i++) await wait(10);
    await evaluate(`window.dispatchEvent(new PageTransitionEvent('pagehide',{persisted:true}))`);
    await wait(400);
    result = await read(); results.push(result);
    assert.deepEqual(result.calls, [1, 2]); assert.equal(result.cards, 24); assert.equal(result.anchor, 'none');
    await evaluate(`window.delay=10;window.dispatchEvent(new PageTransitionEvent('pageshow',{persisted:true}))`);
    await wait(100);
    assert.deepEqual((await read()).calls, [1, 2], 'resume must await another scroll');

    for (let batch = 2; batch <= 5; batch++) {
      // Move off and back onto the sentinel to create a new downward scroll after suspension.
      await evaluate(`window.scrollTo(0,Math.max(0,scrollY-20))`); await wait(30);
      await evaluate(`window.scrollTo(0,document.querySelector('[data-home-feed-sentinel]').offsetTop)`); await wait(180);
      result = await read(); results.push(result);
      assert.equal(result.cards, 12 + 12 * batch);
      assert.equal(result.calls.length, batch + 1, 'each continued scroll must permit exactly one request');
    }
    assert.equal(result.anchor, 'auto', 'finish restores the prior anchoring value');
    assert.equal(result.priority, 'important', 'finish restores the prior priority');
    assert.equal(result.fixture, 'keep', 'unrelated style survives');

    // A restoration failure must leave usable Retry and automatic continuation.
    const errorFixture = join(directory, 'restore-error.html');
    await writeFile(errorFixture, html);
    await call('Page.navigate', { url: pathToFileURL(errorFixture).href + '#restore-error' }, sessionId);
    for (let i = 0; i < 100 && !await evaluate(`location.pathname.endsWith('/restore-error.html') && !!window.fixtureReady && !document.querySelector('[data-home-feed-error]').hidden`); i++) await wait(10);
    assert.equal(await evaluate(`document.querySelector('[data-home-feed-error]').hidden`), false);
    assert.equal((await read()).history.loadedBatches, 1, 'active failure retains the validated replay destination');
    await evaluate(`window.dispatchEvent(new PageTransitionEvent('pagehide',{persisted:true}));window.dispatchEvent(new PageTransitionEvent('pageshow',{persisted:true}))`);
    await wait(50);
    assert.deepEqual((await read()).calls, [1], 'returning to a failed replay must not silently retry');
    await evaluate(`document.querySelector('[data-home-feed-retry]').click()`); await wait(100);
    assert.equal((await read()).cards, 24);
    await evaluate(`window.scrollTo(0,document.querySelector('[data-home-feed-sentinel]').offsetTop)`); await wait(180);
    result = await read(); results.push(result);
    assert.deepEqual(result.calls, [1, 1, 2]); assert.equal(result.cards, 36);

    // A cold Back replay paused during request 2 must retain and complete its count/anchor target.
    const suspendedFixture = join(directory, 'restore-suspended.html');
    await writeFile(suspendedFixture, html);
    await call('Page.navigate', { url: pathToFileURL(suspendedFixture).href + '#restore-suspended' }, sessionId);
    for (let i = 0; i < 100 && !await evaluate(`location.pathname.endsWith('/restore-suspended.html') && !!window.fixtureReady && window.calls.length === 2`); i++) await wait(10);
    assert.deepEqual((await read()).calls, [1, 2]);
    await evaluate(`window.dispatchEvent(new PageTransitionEvent('pagehide',{persisted:true}))`); await wait(300);
    result = await read(); results.push(result);
    assert.deepEqual(result.calls, [1, 2], 'hidden replay must not replace the cancelled request');
    assert.equal(result.cards, 24);
    assert.equal(result.history.loadedBatches, 3, 'partial replay must not overwrite the original target');
    await evaluate(`window.delay=10;window.dispatchEvent(new PageTransitionEvent('pageshow',{persisted:true}));window.dispatchEvent(new PageTransitionEvent('pageshow',{persisted:true}))`);
    await wait(180);
    result = await read(); results.push(result);
    assert.deepEqual(result.calls, [1, 2, 2, 3], 'return must resume only the remaining replay batches');
    assert.equal(result.cards, 48);
    assert.ok(Math.abs(result.targetTop - (-17)) <= 1, 'return restores the original anchor offset');
    await evaluate(`window.scrollTo(0,100)`); await wait(30);
    await evaluate(`window.dispatchEvent(new PageTransitionEvent('pagehide',{persisted:true}));window.dispatchEvent(new PageTransitionEvent('pageshow',{persisted:true}))`);
    await wait(80);
    result = await read(); results.push(result);
    assert.equal(result.y, 100, 'a consumed restoration target cannot replace a newer reading position');
    assert.deepEqual(result.calls, [1, 2, 2, 3]);

    // A completed reconstruction may have a queued position callback when the page suspends.
    const queuedFixture = join(directory, 'restore-queued.html');
    await writeFile(queuedFixture, html);
    await call('Page.navigate', { url: pathToFileURL(queuedFixture).href + '#restore-queued' }, sessionId);
    for (let i = 0; i < 100 && !await evaluate(`location.pathname.endsWith('/restore-queued.html') && !!window.fixtureReady && window.queued?.length > 0`); i++) await wait(10);
    const beforeSuspension = await read();
    await evaluate(`window.oldCallbacks=window.queued.splice(0);window.dispatchEvent(new PageTransitionEvent('pagehide',{persisted:true}));window.dispatchEvent(new PageTransitionEvent('pageshow',{persisted:true}));for(const callback of window.oldCallbacks)callback?.(performance.now())`);
    await wait(100);
    result = await read(); results.push(result);
    assert.equal(result.y, beforeSuspension.y, 'a callback queued before pagehide must not move the resumed viewport');
    assert.deepEqual(result.calls, [1], 'a late restoration callback must not create fresh scroll intent');
    await evaluate(`for(const callback of window.queued.splice(0))callback?.(performance.now())`);
    await evaluate(`for(const callback of window.queued.splice(0))callback?.(performance.now())`);
    result = await read(); results.push(result);
    assert.ok(Math.abs(await evaluate(`document.getElementById('home-post-p12').getBoundingClientRect().top`)) <= 1, 'a fresh callback completes the pending anchor once after resume');
    assert.deepEqual(result.calls, [1], 'resuming only an unapplied anchor needs no duplicate fetch');

    // Disposal also restores an originally absent declaration instead of leaving a new value.
    const absentFixture = join(directory, 'without-prior-anchor.html');
    await writeFile(absentFixture, html.replace('overflow-anchor:auto!important;', ''));
    await call('Page.navigate', { url: pathToFileURL(absentFixture).href }, sessionId);
    for (let i = 0; i < 100 && !await evaluate(`location.pathname.endsWith('/without-prior-anchor.html') && !!window.fixtureReady`); i++) await wait(10);
    assert.equal((await read()).anchor, 'none');
    await evaluate(`window.dispatchEvent(new PageTransitionEvent('pagehide',{persisted:false}))`);
    result = await read(); results.push(result);
    assert.equal(result.anchor, ''); assert.equal(result.priority, ''); assert.equal(result.fixture, 'keep');
  } finally {
    try { await call('Browser.close'); }
    finally {
      await writeFile(join(directory, 'results.json'), JSON.stringify(results, null, 2));
      await writeFile(join(directory, 'chrome-stderr.txt'), stderr);
    }
  }
});

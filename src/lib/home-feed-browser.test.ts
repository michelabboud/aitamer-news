/** Real Chromium regression for append-induced scroll events; no shared server or build output. */
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { spawn, spawnSync } from 'node:child_process';
import { mkdtemp, readFile, writeFile } from 'node:fs/promises';
import { stripTypeScriptTypes } from 'node:module';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { ChromePipeHarness } from './browser-cdp-harness.ts';

const STALE_SETTLE_TIMEOUT_MS = 2000;
const STALE_SETTLE_POLL_MS = 20;
// This aggregate qualification covers scroll loading, suspension, restoration and keyboard focus.
const BROWSER_QUALIFICATION_TIMEOUT_MS = 90_000;
const CHROME_STARTUP_TIMEOUT_MS = 45_000;

test('native anchoring cannot turn one scroll into five loads; continued scrolling and suspension still work', { timeout: BROWSER_QUALIFICATION_TIMEOUT_MS }, async (t) => {
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
  const html = `<!doctype html><html style="overflow-anchor:auto!important;scroll-behavior:smooth!important;--fixture:keep"><meta charset="utf-8"><style>html,body{margin:0}li{height:200px;list-style:none}ul{margin:0;padding:0}footer{height:800px}.sentinel{height:1px}[hidden]{display:none}</style>
    <section data-home-feed data-initial-count="12" data-initial-limit="12" data-batch-size="12" data-batch-count="5" data-planned-count="72" data-max-auto-batches="5" data-snapshot="${'a'.repeat(64)}" data-initial-ids='${JSON.stringify(Array.from({ length: 12 }, (_, i) => `p${i}`))}'>
    <ul data-home-feed-cards>${initial}</ul><div class="sentinel" data-home-feed-sentinel></div><p data-home-feed-status></p><div data-home-feed-error hidden><button data-home-feed-retry>Retry</button><a id="refresh" href="#refresh" data-home-feed-refresh>Refresh this page</a></div><p><a id="news" href="#news">View all News</a></p></section><footer>Lower panels/footer</footer>
    <script type="module">
      import {mountHomeFeed} from './home-feed-browser.mjs';
      window.calls=[];window.delay=location.hash==='#restore-suspended'?180:10;window.scrolls=[];window.errorOnce=location.hash==='#restore-error'||location.hash.startsWith('#retry-');
      window.fetch=async(url)=>{const n=Number(url.match(/home-feed\\/(\\d+)/)[1]);window.calls.push(n);await new Promise(r=>setTimeout(r,window.delay));if(window.errorOnce){window.errorOnce=false;if(location.hash.startsWith('#retry-'))return new Response('Temporary failure',{status:503,headers:{'content-type':'text/html'}});throw new Error('Fixture network failure')}const ids=Array.from({length:12},(_,i)=>'p'+(n*12+i));const template=document.createElement('template');Object.assign(template.dataset,{homeFeedSchema:'1',homeFeedSnapshot:(location.hash.startsWith('#retry-stale')?'b':'a').repeat(64),homeFeedIndex:String(n),homeFeedOffset:String(n*12),homeFeedCount:'12',homeFeedIds:JSON.stringify(ids)});template.innerHTML=ids.map(id=>'<li id="home-post-'+id+'" data-home-post="'+id+'"><article><h3><a '+(location.protocol==='https:'?'href="/posts/'+id+'/"':'tabindex="0"')+'>'+id+'</a></h3></article></li>').join('');return new Response(template.outerHTML,{headers:{'content-type':'text/html'}})};
      const root=document.querySelector('[data-home-feed]');root.dataset.batchPrefix=location.pathname+'/home-feed/';
      window.addEventListener('scroll',()=>window.scrolls.push(scrollY));
      if(location.hash.startsWith('#restore-')){
        Object.defineProperty(performance,'getEntriesByType',{value:()=>[{type:'back_forward'}]});
        const suspendedReplay=location.hash==='#restore-suspended';
        const smoothReplay=location.hash==='#restore-smooth';
        history.replaceState({aitamerHomeFeedV1:{version:1,snapshot:'a'.repeat(64),loadedBatches:suspendedReplay?3:smoothReplay?2:1,anchor:suspendedReplay?'p40':smoothReplay?'p30':'p12',anchorOffset:suspendedReplay?-17:smoothReplay?-23:0,scrollY:suspendedReplay?8000:smoothReplay?6000:1500}},'');
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
  const harness = new ChromePipeHarness(chrome);
  let handleEvent: (message: any) => void = () => {};
  harness.onEvent = (message) => handleEvent(message);
  const call = (method: string, params: object = {}, sessionId?: string, timeoutMs?: number) => harness.call(method, params, sessionId, timeoutMs);
  const results: unknown[] = [];
  let failure: unknown;
  let cleanupTask: Promise<void> | undefined;
  const cleanup = () => cleanupTask ??= (async () => {
    try { await harness.shutdown(); }
    finally {
      await Promise.all([
        writeFile(join(directory, 'results.json'), JSON.stringify(results, null, 2)),
        writeFile(join(directory, 'chrome-stderr.txt'), harness.stderr),
        writeFile(join(directory, 'harness-diagnostic.txt'), `${failure instanceof Error ? failure.stack : failure ?? ''}\n${harness.diagnostics()}`),
      ]);
    }
  })();
  t.after(cleanup);
  t.signal.addEventListener('abort', () => harness.abort('Browser qualification aborted'), { once: true });
  try {
    const { targetId } = await call('Target.createTarget', { url: 'about:blank' }, undefined, CHROME_STARTUP_TIMEOUT_MS);
    const { sessionId } = await call('Target.attachToTarget', { targetId, flatten: true });
    await call('Runtime.enable', {}, sessionId);
    await call('Page.enable', {}, sessionId);
    const evaluate = async (expression: string) => {
      const response = await call('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true }, sessionId);
      if (response.exceptionDetails) throw new Error(JSON.stringify(response.exceptionDetails));
      return response.result.value;
    };
    const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
    const press = async (key: string, code: string, virtualKey: number, modifiers = 0) => {
      await call('Input.dispatchKeyEvent', { type: 'keyDown', key, code, windowsVirtualKeyCode: virtualKey, modifiers, ...(key === 'Enter' ? { text: '\r', unmodifiedText: '\r' } : {}) }, sessionId);
      await call('Input.dispatchKeyEvent', { type: 'keyUp', key, code, windowsVirtualKeyCode: virtualKey, modifiers }, sessionId);
    };
    const read = () => evaluate(`({calls:[...window.calls],cards:document.querySelectorAll('[data-home-post]').length,y:scrollY,scrolls:[...window.scrolls],anchor:document.documentElement.style.getPropertyValue('overflow-anchor'),priority:document.documentElement.style.getPropertyPriority('overflow-anchor'),behavior:document.documentElement.style.getPropertyValue('scroll-behavior'),behaviorPriority:document.documentElement.style.getPropertyPriority('scroll-behavior'),fixture:document.documentElement.style.getPropertyValue('--fixture'),history:history.state?.aitamerHomeFeedV1,targetTop:document.getElementById('home-post-p40')?.getBoundingClientRect().top})`);
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
    assert.equal(result.behavior, 'auto', 'active automatic loading must override implicit smooth scrolling');
    assert.equal(result.behaviorPriority, 'important');

    // Persisted pagehide must keep suppression, abort once and remain quiet after pageshow.
    await evaluate(`window.delay=300;window.scrollTo(0,document.querySelector('[data-home-feed-sentinel]').offsetTop)`);
    for (let i = 0; i < 50 && (await read()).calls.length < 2; i++) await wait(10);
    await evaluate(`window.dispatchEvent(new PageTransitionEvent('pagehide',{persisted:true}))`);
    await wait(400);
    result = await read(); results.push(result);
    assert.deepEqual(result.calls, [1, 2]); assert.equal(result.cards, 24); assert.equal(result.anchor, 'none');
    assert.equal(result.behavior, 'auto', 'the scroll guard persists through suspended loading');
    assert.equal(result.behaviorPriority, 'important');
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
    assert.equal(result.behavior, 'smooth', 'finish restores the prior scroll behavior');
    assert.equal(result.behaviorPriority, 'important', 'finish restores the prior scroll priority');
    assert.equal(result.fixture, 'keep', 'unrelated style survives');

    // A restoration failure must leave usable Retry and automatic continuation.
    const errorFixture = join(directory, 'restore-error.html');
    await writeFile(errorFixture, html);
    await call('Page.navigate', { url: pathToFileURL(errorFixture).href + '#restore-error' }, sessionId);
    for (let i = 0; i < 100 && !await evaluate(`location.pathname.endsWith('/restore-error.html') && !!window.fixtureReady && !document.querySelector('[data-home-feed-error]').hidden`); i++) await wait(10);
    assert.equal(await evaluate(`document.querySelector('[data-home-feed-error]').hidden`), false);
    assert.equal((await read()).behavior, 'auto', 'a recoverable error must retain the scroll guard');
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

    // A stale retry must transfer keyboard focus only when Retry still owns it.
    for (const focusBeforeResponse of ['retry', 'refresh', 'news']) {
      const filename = `retry-stale-${focusBeforeResponse}.html`;
      const staleFixture = join(directory, filename);
      await writeFile(staleFixture, html);
      await call('Page.navigate', { url: pathToFileURL(staleFixture).href + '#retry-stale' }, sessionId);
      for (let i = 0; i < 100 && !await evaluate(`location.pathname.endsWith('/${filename}') && !!window.fixtureReady`); i++) await wait(10);
      await evaluate(`window.scrollTo(0,document.querySelector('[data-home-feed-sentinel]').offsetTop)`); await wait(80);
      assert.equal(await evaluate(`document.querySelector('[data-home-feed-error]').hidden`), false);
      await evaluate(`document.querySelector('#news').focus({preventScroll:true});window.delay=80`);
      await press('Tab', 'Tab', 9, 8); await press('Tab', 'Tab', 9, 8);
      assert.equal(await evaluate(`document.activeElement===document.querySelector('[data-home-feed-retry]')`), true);
      await press('Enter', 'Enter', 13);
      if (focusBeforeResponse === 'refresh') await press('Tab', 'Tab', 9);
      else if (focusBeforeResponse === 'news') await evaluate(`document.querySelector('#news').focus({preventScroll:true})`);
      const readFocused = () => evaluate(`({id:document.activeElement.id,tag:document.activeElement.tagName,retryHidden:document.querySelector('[data-home-feed-retry]').hidden,calls:[...window.calls],status:document.querySelector('[data-home-feed-status]').textContent,busy:document.querySelector('[data-home-feed-cards]').getAttribute('aria-busy')})`);
      const staleStatus = 'The stories changed. Refresh this page or view all News.';
      const deadline = Date.now() + STALE_SETTLE_TIMEOUT_MS;
      let focused = await readFocused();
      while (!(focused.retryHidden && focused.status === staleStatus && focused.busy === 'false') && Date.now() < deadline) {
        await wait(STALE_SETTLE_POLL_MS);
        focused = await readFocused();
      }
      results.push({ scenario: 'stale-retry-focus', focusBeforeResponse, ...focused });
      assert.equal(focused.retryHidden, true);
      assert.equal(focused.status, staleStatus);
      assert.equal(focused.busy, 'false');
      assert.deepEqual(focused.calls, [1, 1]);
      assert.equal(focused.id, focusBeforeResponse === 'news' ? 'news' : 'refresh', 'hiding Retry must retain a useful focus destination without stealing focus');
    }

    // Use the actual site's scrolling declaration so restoration cannot inherit smooth animation.
    const siteStyles = await readFile(new URL('../styles/global.css', import.meta.url), 'utf8');
    const scrollingDeclaration = siteStyles.match(/scroll-behavior\s*:[^;]+;/)?.[0];
    assert.ok(scrollingDeclaration);
    const smoothFixture = join(directory, 'restore-smooth.html');
    await writeFile(smoothFixture, html.replace('<style>', `<style>html{${scrollingDeclaration}}`));
    await call('Page.navigate', { url: pathToFileURL(smoothFixture).href + '#restore-smooth' }, sessionId);
    for (let i = 0; i < 100 && !await evaluate(`location.pathname.endsWith('/restore-smooth.html') && !!window.fixtureReady && document.querySelectorAll('[data-home-post]').length===36`); i++) await wait(10);
    await wait(80);
    const restored = await evaluate(`({y:scrollY,top:document.getElementById('home-post-p30').getBoundingClientRect().top,history:history.state.aitamerHomeFeedV1,behavior:getComputedStyle(document.documentElement).scrollBehavior})`);
    results.push({ scenario: 'smooth-restoration', ...restored });
    assert.equal(restored.behavior, 'auto', 'active guard overrides the actual site smooth-scroll declaration');
    assert.ok(Math.abs(restored.top - (-23)) <= 1, 'restoration must place the anchor immediately despite site smooth-scroll CSS');
    assert.equal(restored.history.scrollY, restored.y, 'history must record the settled restored position');
    await wait(700);
    assert.equal((await read()).y, restored.y, 'no restoration animation may continue after releasing the hold');

    // Serve a same-origin HTTPS fixture through Chromium interception so batches contain real links.
    const interceptedPages = new Map<string, string>();
    const interceptionErrors: string[] = [];
    handleEvent = (message) => {
      if (message.method !== 'Fetch.requestPaused') return;
      void (async () => {
        const { requestId, request } = message.params;
        try {
          const pathname = new URL(request.url).pathname;
          if (pathname === '/favicon.ico') { await call('Fetch.fulfillRequest', { requestId, responseCode: 204 }, sessionId); return; }
          const page = interceptedPages.get(pathname);
          const body = page ?? await readFile(join(directory, pathname.slice(1)), 'utf8');
          await call('Fetch.fulfillRequest', { requestId, responseCode: 200, responseHeaders: [{ name: 'content-type', value: page ? 'text/html' : 'text/javascript' }], body: Buffer.from(body).toString('base64') }, sessionId);
        } catch (error) {
          interceptionErrors.push(String(error));
          await call('Fetch.failRequest', { requestId, errorReason: 'Failed' }, sessionId)
            .catch((failure) => { interceptionErrors.push(String(failure)); });
        }
      })();
    };
    await call('Fetch.enable', { patterns: [{ urlPattern: 'https://home-feed.test/*', requestStage: 'Request' }] }, sessionId);
    for (const focusBeforeResponse of ['retry', 'refresh', 'news']) {
      const path = `/retry-success-${focusBeforeResponse}.html`;
      // The homepage has a separate lead and an odd initial card count in a two-column grid.
      const lead = initial.match(/^<li\b[\s\S]*?<\/li>/)?.[0] ?? '';
      const successHtml = html.replace(initial, initial.slice(lead.length))
        .replace('<section data-home-feed', '<article id="home-post-p0" data-home-post="p0" style="height:600px">Lead</article><section data-home-feed')
        .replace('<style>', `<style>html{${scrollingDeclaration}}ul[data-home-feed-cards]{display:grid;grid-template-columns:repeat(2,minmax(0,1fr))}li{min-height:700px}li h3{padding-top:240px}`);
      interceptedPages.set(path, successHtml);
      await call('Page.navigate', { url: `https://home-feed.test${path}#retry-success` }, sessionId);
      for (let i = 0; i < 100 && !await evaluate(`location.pathname===${JSON.stringify(path)} && !!window.fixtureReady`); i++) await wait(10);
      await evaluate(`window.scrollTo({top:document.querySelector('[data-home-feed-sentinel]').offsetTop,behavior:'instant'})`); await wait(80);
      assert.equal(await evaluate(`document.querySelector('[data-home-feed-error]').hidden`), false);
      await evaluate(`window.scrollTo({top:0,behavior:'instant'});document.querySelector('#news').focus({preventScroll:true});window.delay=250`);
      if (focusBeforeResponse === 'news') {
        await evaluate(`const list=document.querySelector('[data-home-feed-cards]');const append=list.append;list.append=function(...nodes){window.viewportBeforeAppend={x:scrollX,y:scrollY};return append.apply(this,nodes)}`);
      }
      await evaluate(`document.querySelector('[data-home-feed-retry]').focus()`);
      assert.equal(await evaluate(`document.activeElement===document.querySelector('[data-home-feed-retry]')`), true);
      await press('Enter', 'Enter', 13);
      if (focusBeforeResponse === 'refresh') {
        await press('Tab', 'Tab', 9);
        assert.equal(await evaluate(`document.activeElement.id`), 'refresh', 'Tab during the pending response must reach Refresh');
      } else if (focusBeforeResponse === 'news') await evaluate(`document.querySelector('#news').focus({preventScroll:true});window.outsideFocus=document.activeElement`);
      await wait(1300);
      const retried = await evaluate(`({calls:[...window.calls],cards:document.querySelectorAll('[data-home-post]').length,unique:new Set([...document.querySelectorAll('[data-home-post]')].map(node=>node.dataset.homePost)).size,x:scrollX,y:scrollY,viewportBeforeAppend:window.viewportBeforeAppend,sameOutsideFocus:document.activeElement===window.outsideFocus,tag:document.activeElement.tagName,id:document.activeElement.id,href:document.activeElement.getAttribute('href'),top:document.activeElement.getBoundingClientRect().top,bottom:document.activeElement.getBoundingClientRect().bottom,height:innerHeight})`);
      results.push({ scenario: 'smooth-successful-retry', focusBeforeResponse, ...retried });
      assert.deepEqual(retried.calls, [1, 1], 'focus scrolling must not create more batch requests after Retry succeeds');
      assert.equal(retried.cards, 24);
      assert.equal(retried.unique, 24);
      if (focusBeforeResponse === 'news') {
        assert.equal(retried.id, 'news', 'a successful retry cannot steal focus after the reader moves away');
        assert.equal(retried.sameOutsideFocus, true, 'the outside focused element must retain identity');
        assert.deepEqual({ x: retried.x, y: retried.y }, retried.viewportBeforeAppend, 'outside-focus Retry must preserve both viewport coordinates through append');
      }
      else {
        assert.equal(retried.href, '/posts/p12/');
        assert.ok(retried.bottom > 0 && retried.top < retried.height, 'the newly focused story link must remain visible');
      }
    }
    assert.deepEqual(interceptionErrors, []);
    await call('Fetch.disable', {}, sessionId);

    // Disposal restores both existing important declarations and an originally absent declaration.
    const priorFixture = join(directory, 'with-prior-effects.html');
    await writeFile(priorFixture, html);
    await call('Page.navigate', { url: pathToFileURL(priorFixture).href }, sessionId);
    for (let i = 0; i < 100 && !await evaluate(`location.pathname.endsWith('/with-prior-effects.html') && !!window.fixtureReady`); i++) await wait(10);
    assert.equal((await read()).behavior, 'auto');
    await evaluate(`window.dispatchEvent(new PageTransitionEvent('pagehide',{persisted:false}))`);
    result = await read(); results.push(result);
    assert.equal(result.anchor, 'auto'); assert.equal(result.priority, 'important');
    assert.equal(result.behavior, 'smooth'); assert.equal(result.behaviorPriority, 'important'); assert.equal(result.fixture, 'keep');
    const absentFixture = join(directory, 'without-prior-anchor.html');
    await writeFile(absentFixture, html.replace('overflow-anchor:auto!important;scroll-behavior:smooth!important;', ''));
    await call('Page.navigate', { url: pathToFileURL(absentFixture).href }, sessionId);
    for (let i = 0; i < 100 && !await evaluate(`location.pathname.endsWith('/without-prior-anchor.html') && !!window.fixtureReady`); i++) await wait(10);
    assert.equal((await read()).anchor, 'none');
    assert.equal((await read()).behavior, 'auto');
    await evaluate(`window.dispatchEvent(new PageTransitionEvent('pagehide',{persisted:false}))`);
    result = await read(); results.push(result);
    assert.equal(result.anchor, ''); assert.equal(result.priority, ''); assert.equal(result.fixture, 'keep');
    assert.equal(result.behavior, ''); assert.equal(result.behaviorPriority, '');

    // A configured zero-batch page owns neither CSS property and never fetches a batch.
    const zeroFixture = join(directory, 'zero-batches.html');
    await writeFile(zeroFixture, html.replace('data-batch-count="5"', 'data-batch-count="0"').replace('data-planned-count="72"', 'data-planned-count="12"').replace('data-max-auto-batches="5"', 'data-max-auto-batches="0"'));
    await call('Page.navigate', { url: pathToFileURL(zeroFixture).href }, sessionId);
    for (let i = 0; i < 100 && !await evaluate(`location.pathname.endsWith('/zero-batches.html') && !!window.fixtureReady`); i++) await wait(10);
    await evaluate(`window.scrollTo({top:1000,behavior:'instant'})`); await wait(60);
    result = await read(); results.push(result);
    assert.deepEqual(result.calls, []); assert.equal(result.cards, 12);
    assert.equal(result.anchor, 'auto'); assert.equal(result.priority, 'important');
    assert.equal(result.behavior, 'smooth'); assert.equal(result.behaviorPriority, 'important'); assert.equal(result.fixture, 'keep');
  } catch (error) {
    failure = error;
    await cleanup();
    throw new Error(`${error instanceof Error ? error.stack : String(error)}\n${harness.diagnostics()}`, { cause: error });
  } finally { await cleanup(); }
});

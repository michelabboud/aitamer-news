import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import { runInNewContext } from 'node:vm';
import {
  COMMENTED_QUERY, COMMENTED_VALUE, COMMENT_CHECK_FAILED_MESSAGE, COMMENT_ERROR_MAX,
  COMMENT_FAILED_MESSAGE, COMMENT_FORM_FIELDS, COMMENT_HELD_ANCHOR, COMMENT_HELD_MESSAGE,
  COMMENT_TURNSTILE_CALLBACKS,
} from '../src/lib/comment-form.ts';

const commentSource = readFileSync(new URL('../src/components/CommentForm.astro', import.meta.url), 'utf8');
const layoutSource = readFileSync(new URL('../src/layouts/BaseLayout.astro', import.meta.url), 'utf8');
const inline = (source) => source.match(/<script is:inline define:vars=\{\{[^]*?\}\}>([^]*?)<\/script>/)[1];

// Execute the shipped inline code with an inert DOM and fetch. No provider script runs and
// no request leaves this process; assertions observe the page's loading and form behavior.
class Target {
  listeners = new Map();
  addEventListener(type, listener) {
    const listeners = this.listeners.get(type) || new Set();
    listeners.add(listener);
    this.listeners.set(type, listeners);
  }
  removeEventListener(type, listener) { this.listeners.get(type)?.delete(listener); }
  emit(type, properties = {}) {
    const event = { type, isTrusted: true, preventDefault() {}, ...properties };
    for (const listener of [...(this.listeners.get(type) || [])]) listener(event);
  }
}

function comments({ present = true } = {}) {
  const disclosure = Object.assign(new Target(), { open: false });
  const retry = Object.assign(new Target(), { hidden: true });
  const submit = { textContent: 'Post the comment', disabled: false };
  const error = { textContent: '' };
  const status = { textContent: '' };
  const fields = [{ name: 'name', value: 'Reader' }, { name: 'text', value: 'A comment' }];
  const form = Object.assign(new Target(), {
    dataset: {}, action: 'https://comments.invalid/', valid: true,
    querySelector: () => submit,
    appendChild: (field) => fields.push(field),
    reportValidity() { return this.valid; },
    reset() { for (const field of fields) field.value = ''; },
  });
  const elements = { 'comment-form': form, 'comment-disclosure': disclosure, 'comment-retry': retry,
    'comment-error': error, 'comment-status': status };
  const scripts = [];
  const requests = [];
  let now = 100;
  let resets = 0;
  const window = { turnstile: { reset() { resets += 1; } } };
  const context = {
    window, URLSearchParams, performance: { now: () => now },
    heldMessage: COMMENT_HELD_MESSAGE, failedMessage: COMMENT_FAILED_MESSAGE,
    checkFailedMessage: COMMENT_CHECK_FAILED_MESSAGE,
    loadFailedMessage: 'The comment check could not load. Use the retry button to try again.',
    errorMax: COMMENT_ERROR_MAX, commentedQuery: COMMENTED_QUERY, commentedValue: COMMENTED_VALUE,
    heldAnchor: COMMENT_HELD_ANCHOR, elapsedField: COMMENT_FORM_FIELDS.elapsed,
    callbacks: COMMENT_TURNSTILE_CALLBACKS,
    location: { search: '', hash: '', pathname: '/posts/example/' },
    history: { replaceState() {} },
    document: {
      getElementById: (id) => present ? elements[id] : null,
      createElement: (tag) => ({ tagName: tag }),
      head: { appendChild(script) {
        for (const name of Object.values(COMMENT_TURNSTILE_CALLBACKS)) {
          assert.equal(typeof window[name], 'function', 'callbacks must exist before SDK insertion');
        }
        scripts.push(script);
      } },
    },
    FormData: class { constructor() { this.values = new Map(fields.map(({ name, value }) => [name, value])); } },
    fetch: (url, options) => new Promise((resolve, reject) => requests.push({ url, options, resolve, reject })),
  };
  runInNewContext(inline(commentSource), context);
  // An ordinary external script tag is already a request, even if inline code made none.
  if (present) {
    for (const [, src] of commentSource.matchAll(/<script\b[^>]*\ssrc="([^"]+)"[^>]*>/g)) scripts.push({ src });
  }
  return {
    disclosure, retry, submit, error, status, fields, scripts, requests, form,
    setNow: (value) => { now = value; }, resets: () => resets,
    ready: () => window[COMMENT_TURNSTILE_CALLBACKS.ready]('test-token'),
    expire: () => window[COMMENT_TURNSTILE_CALLBACKS.expired](),
    widgetError: () => window[COMMENT_TURNSTILE_CALLBACKS.error](),
    open() { disclosure.open = true; disclosure.emit('toggle'); },
    close() { disclosure.open = false; disclosure.emit('toggle'); },
  };
}

function analytics(hostname = 'aitamer.news', readyState = 'loading') {
  const window = new Target();
  const scripts = [];
  const timers = new Map();
  let now = 0;
  let nextTimer = 0;
  window.setTimeout = (callback, delay) => {
    const id = ++nextTimer;
    timers.set(id, { callback, due: now + delay });
    return id;
  };
  window.clearTimeout = (id) => timers.delete(id);
  const context = { window, location: { hostname }, analyticsId: 'G-TEST', encodeURIComponent,
    document: { readyState, createElement: () => ({}), head: { appendChild: (script) => scripts.push(script) } } };
  const execute = () => runInNewContext(inline(layoutSource), context);
  execute();
  return {
    window, scripts, timers, execute,
    advance(milliseconds) {
      now += milliseconds;
      for (const [id, timer] of [...timers]) {
        if (timer.due <= now && timers.delete(id)) timer.callback();
      }
    },
  };
}

test('comments request no SDK while collapsed, and missing/closed forms cannot load one', () => {
  assert.equal(comments().scripts.length, 0);
  assert.equal(comments({ present: false }).scripts.length, 0);
});

test('native disclosure opening loads the SDK once, preserving input through later toggles', () => {
  assert.match(commentSource, /<details\b[^>]*id="comment-disclosure"[^>]*>\s*<summary[^>]*>Add a comment<\/summary>/);
  const page = comments();
  // Native details emits the same toggle after Enter/Space on summary as after a pointer click.
  page.open();
  assert.equal(page.scripts.length, 1);
  assert.equal(page.scripts[0].src, 'https://challenges.cloudflare.com/turnstile/v0/api.js');
  page.close();
  page.open();
  assert.equal(page.scripts.length, 1);
  assert.equal(page.fields[1].value, 'A comment');
});

test('SDK network failure keeps posting disabled and supports one explicit retry at a time', () => {
  const page = comments();
  page.open();
  page.scripts[0].onerror();
  assert.equal(page.submit.disabled, true);
  assert.equal(page.retry.hidden, false);
  assert.match(page.error.textContent, /retry/i);
  page.close();
  page.open();
  assert.equal(page.scripts.length, 1, 'a toggle does not retry a failed request');
  page.retry.emit('click');
  page.retry.emit('click');
  assert.equal(page.scripts.length, 2);
  page.scripts[1].onload();
  assert.equal(page.retry.hidden, true);
  page.ready();
  assert.equal(page.error.textContent, '');
  assert.equal(page.submit.disabled, false);
});

test('a token is mandatory, expiry and widget error disable posting, invalid input never posts', () => {
  const page = comments();
  page.form.emit('submit');
  assert.equal(page.requests.length, 0);
  page.ready();
  assert.equal(page.submit.disabled, false);
  page.expire();
  assert.equal(page.submit.disabled, true);
  page.ready();
  page.widgetError();
  assert.equal(page.submit.disabled, true);
  assert.equal(page.error.textContent, COMMENT_CHECK_FAILED_MESSAGE);
  page.ready();
  page.form.valid = false;
  page.form.emit('submit');
  assert.equal(page.requests.length, 0);
});

const settle = () => new Promise((resolve) => setImmediate(resolve));

test('duplicate submits are suppressed and a successful attempt resets token, form and elapsed clock', async () => {
  const page = comments();
  page.ready();
  page.setNow(5100);
  page.form.emit('submit');
  page.form.emit('submit');
  assert.equal(page.requests.length, 1);
  assert.equal(page.requests[0].options.body.values.get('elapsed'), '5000');
  assert.equal(page.submit.disabled, true);
  page.requests[0].resolve({ ok: true, json: async () => ({ ok: true }) });
  await settle();
  assert.equal(page.status.textContent, COMMENT_HELD_MESSAGE);
  assert.equal(page.fields[1].value, '');
  assert.equal(page.resets(), 1);
  assert.equal(page.submit.disabled, true);
  page.form.emit('submit');
  assert.equal(page.requests.length, 1, 'single-use token cannot be reused');
  page.ready();
  page.setNow(7100);
  page.form.emit('submit');
  assert.equal(page.requests[1].options.body.values.get('elapsed'), '2000');
});

test('Worker and network failures preserve text but consume the attempted token', async () => {
  for (const mode of ['worker', 'network', 'malformed']) {
    const page = comments();
    page.ready();
    page.form.emit('submit');
    if (mode === 'network') page.requests[0].reject(new Error('offline'));
    else page.requests[0].resolve({ ok: false, json: mode === 'malformed'
      ? async () => { throw new Error('not JSON'); } : async () => ({ error: ' Please try later. ' }) });
    await settle();
    assert.equal(page.error.textContent, mode === 'worker' ? 'Please try later.' : COMMENT_FAILED_MESSAGE);
    assert.equal(page.fields[1].value, 'A comment');
    assert.equal(page.submit.disabled, true);
    assert.equal(page.resets(), 1);
    page.form.emit('submit');
    assert.equal(page.requests.length, 1);
  }
});

test('analytics waits during loading and interactive states without registering input listeners', () => {
  for (const state of ['loading', 'interactive']) {
    const page = analytics('aitamer.news', state);
    for (const type of ['pointerdown', 'keydown', 'wheel', 'touchstart', 'scroll']) {
      assert.equal(page.window.listeners.get(type)?.size || 0, 0);
      page.window.emit(type);
    }
    page.advance(4999);
    assert.equal(page.scripts.length, 0);
    assert.equal(page.window.gtag, undefined);
    assert.equal(page.window.dataLayer, undefined);
  }
});

test('window load starts analytics without input and cancels the fallback', () => {
  const page = analytics();
  page.execute();
  page.window.emit('load');
  assert.equal(page.scripts.length, 1);
  assert.equal(page.scripts[0].src, 'https://www.googletagmanager.com/gtag/js?id=G-TEST');
  assert.equal(page.scripts[0].async, true);
  assert.equal(page.window.dataLayer.length, 2);
  assert.equal(page.window.dataLayer[0][0], 'js');
  assert.equal(page.window.dataLayer[1][0], 'config');
  assert.equal(page.window.dataLayer[1][1], 'G-TEST');
  assert.equal(page.timers.size, 0);
  assert.equal(page.window.listeners.get('load')?.size || 0, 0);
  page.advance(5000);
  page.window.emit('load');
  page.execute();
  assert.equal(page.scripts.length, 1);
  assert.equal(page.window.dataLayer.length, 2);
});

test('an already-complete document starts analytics immediately without pending work', () => {
  const page = analytics('aitamer.news', 'complete');
  assert.equal(page.scripts.length, 1);
  assert.equal(page.timers.size, 0);
  assert.equal(page.window.listeners.get('load')?.size || 0, 0);
  page.execute();
  assert.equal(page.scripts.length, 1);
});

test('slow resources cannot defer analytics beyond five seconds from the first registration', () => {
  const page = analytics();
  page.advance(4000);
  page.execute();
  page.advance(999);
  assert.equal(page.scripts.length, 0);
  page.advance(1);
  assert.equal(page.scripts.length, 1);
  assert.equal(page.window.dataLayer.length, 2);
  assert.equal(page.timers.size, 0);
  assert.equal(page.window.listeners.get('load')?.size || 0, 0);
  page.window.emit('load');
  page.execute();
  assert.equal(page.scripts.length, 1);
});

for (const first of ['load', 'fallback']) {
  test(`racing load and fallback callbacks start analytics once with ${first} first`, () => {
    const page = analytics();
    const load = [...(page.window.listeners.get('load') || [])][0];
    const fallback = [...page.timers.values()][0]?.callback;
    assert.equal(typeof load, 'function');
    assert.equal(typeof fallback, 'function');
    // Model callbacks that were queued before listener removal/timer cancellation.
    if (first === 'load') { load(); fallback(); }
    else { fallback(); load(); }
    page.execute();
    assert.equal(page.scripts.length, 1);
    assert.equal(page.window.dataLayer.length, 2);
    assert.equal(page.timers.size, 0);
    assert.equal(page.window.listeners.get('load')?.size || 0, 0);
  });
}

test('analytics stays absent on preview, local and lookalike hosts', () => {
  for (const host of ['localhost', '127.0.0.1', 'preview.pages.dev', 'aitamer.news.evil.example']) {
    for (const state of ['loading', 'complete']) {
      const page = analytics(host, state);
      page.window.emit('load');
      page.advance(5000);
      assert.equal(page.scripts.length, 0);
      assert.equal(page.window.dataLayer, undefined);
      assert.equal(page.timers.size, 0);
      assert.equal(page.window.listeners.size, 0);
    }
  }
  const www = analytics('www.aitamer.news');
  www.window.emit('load');
  assert.equal(www.scripts.length, 1);
});

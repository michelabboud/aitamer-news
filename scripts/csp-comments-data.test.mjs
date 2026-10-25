import assert from 'node:assert/strict';
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';
import {
  CSP_ENFORCE,
  COMMENTS_DATA_BASE_DEFAULT,
  checkSitePolicy,
  commentsDataOrigin,
  cspHeaderName,
  endpointOrigins,
  headersFor,
  parsePolicy,
  writeSitePolicy,
} from './csp-headers.mjs';

/**
 * Plan docs/plans/2026-10-24-comments-on-r2.md, task S3: the data host joins `connect-src` only
 * when a built page reads it (a page rendered with `COMMENTS_SOURCE = 'r2'` carries
 * `data-comments-base`), its origin comes from `PUBLIC_COMMENTS_DATA_BASE` like the page's, and the
 * policy stays Report-Only.
 */

const publicHeaders = readFileSync(new URL('../public/_headers', import.meta.url), 'utf8');
const header = cspHeaderName().toLowerCase();

function site(t, pages) {
  const dist = mkdtempSync(join(tmpdir(), 'aitamer-csp-comments-'));
  t.after(() => rmSync(dist, { recursive: true }));
  for (const [path, body] of Object.entries({ _headers: publicHeaders, ...pages })) {
    const target = join(dist, path);
    mkdirSync(join(target, '..'), { recursive: true });
    writeFileSync(target, body);
  }
  return dist;
}

function connectSrc(dist, path = '/') {
  return parsePolicy(headersFor(readFileSync(join(dist, '_headers'), 'utf8'), path).get(header)).get('connect-src');
}

const baked = '<!doctype html><title>Story</title><section class="comments" id="comments"></section>';
// R4: the reactions section reads its totals from the same host, under the same attribute.
const reactionsLive = (base) => `<!doctype html><title>Story</title><section class="reactions" aria-label="Reactions" data-slug="a" data-endpoint="https://comments.aitamer.news/react" data-comments-base="${base}"></section>`;
const live = (base) => `<!doctype html><title>Story</title><section class="comments" id="comments" data-comments-base="${base}"></section>`;

test('a baked build: connect-src does not name the data host', (t) => {
  const dist = site(t, { 'index.html': baked, 'posts/a/index.html': baked });
  assert.deepEqual(writeSitePolicy(dist, { env: {} }).findings, []);
  assert.ok(!connectSrc(dist).includes(commentsDataOrigin({})));
  assert.deepEqual(checkSitePolicy(dist, { env: {} }), []);
});

test('a build that reads the data host: connect-src names exactly its origin, and only in connect-src', (t) => {
  const dist = site(t, { 'index.html': baked, 'posts/a/index.html': live(COMMENTS_DATA_BASE_DEFAULT) });
  assert.deepEqual(writeSitePolicy(dist, { env: {} }).findings, []);
  const origin = 'https://data.aitamer.news';
  assert.equal(commentsDataOrigin({}), origin);
  assert.equal(connectSrc(dist).filter((source) => source === origin).length, 1);
  const policy = parsePolicy(headersFor(readFileSync(join(dist, '_headers'), 'utf8'), '/').get(header));
  for (const [directive, sources] of policy) {
    if (directive !== 'connect-src') assert.ok(!sources.includes(origin), `${directive} must not name the data host`);
  }
  // The comments and contact Workers are still there, unchanged.
  for (const worker of Object.values(endpointOrigins({}))) assert.ok(connectSrc(dist).includes(worker), worker);
  assert.deepEqual(checkSitePolicy(dist, { env: {} }), []);
});

test('PUBLIC_COMMENTS_DATA_BASE moves the origin, the way it moves the page (a local fixture server)', (t) => {
  const env = { PUBLIC_COMMENTS_DATA_BASE: 'http://127.0.0.1:4399/' };
  const dist = site(t, { 'posts/a/index.html': live(env.PUBLIC_COMMENTS_DATA_BASE) });
  assert.deepEqual(writeSitePolicy(dist, { env }).findings, []);
  assert.ok(connectSrc(dist).includes('http://127.0.0.1:4399'));
  assert.ok(!connectSrc(dist).includes('https://data.aitamer.news'));
  assert.deepEqual(checkSitePolicy(dist, { env }), []);
});

test('the guard refuses a page that reads a data host the policy does not name', (t) => {
  const dist = site(t, { 'posts/a/index.html': live('https://data.aitamer.news/') });
  // The page was built against the default host, but the policy is written for another one.
  assert.deepEqual(writeSitePolicy(dist, { env: { PUBLIC_COMMENTS_DATA_BASE: 'https://other.example/' } }).findings, []);
  const findings = checkSitePolicy(dist, { env: { PUBLIC_COMMENTS_DATA_BASE: 'https://other.example/' } });
  assert.ok(findings.some((f) => f.includes('data-comments-base') && f.includes('connect-src does not allow')), findings.join('\n'));
});

test('the policy stays Report-Only', (t) => {
  assert.equal(CSP_ENFORCE, false);
  const dist = site(t, { 'posts/a/index.html': live(COMMENTS_DATA_BASE_DEFAULT) });
  writeSitePolicy(dist, { env: {} });
  const headers = headersFor(readFileSync(join(dist, '_headers'), 'utf8'), '/posts/a/');
  assert.ok(headers.has('content-security-policy-report-only'));
  assert.ok(!headers.has('content-security-policy'));
});

test('the data origin default matches the site\'s', () => {
  const site = readFileSync(new URL('../src/lib/site.ts', import.meta.url), 'utf8');
  assert.match(site, new RegExp(`COMMENTS_DATA_BASE_DEFAULT = '${COMMENTS_DATA_BASE_DEFAULT.replace(/[.]/g, '\\.')}'`));
});

test('R4: a story whose reactions read the data host puts it in connect-src exactly once, with the Worker still there', (t) => {
  // Reactions alone (comments still baked), and reactions beside the live thread on one page.
  const dist = site(t, {
    'posts/a/index.html': reactionsLive(COMMENTS_DATA_BASE_DEFAULT),
    'posts/b/index.html': reactionsLive(COMMENTS_DATA_BASE_DEFAULT).replace('</section>', `</section>${live(COMMENTS_DATA_BASE_DEFAULT)}`),
  });
  assert.deepEqual(writeSitePolicy(dist, { env: {} }).findings, []);
  const sources = connectSrc(dist, '/posts/a/');
  assert.equal(sources.filter((source) => source === 'https://data.aitamer.news').length, 1);
  assert.ok(sources.includes(endpointOrigins({}).comments), 'the reactions POST still reaches the comments Worker');
  assert.deepEqual(checkSitePolicy(dist, { env: {} }), []);
});

test('R4: the guard refuses a reactions section that reads a data host the policy does not name', (t) => {
  const dist = site(t, { 'posts/a/index.html': reactionsLive('https://data.aitamer.news/') });
  const env = { PUBLIC_COMMENTS_DATA_BASE: 'https://other.example/' };
  assert.deepEqual(writeSitePolicy(dist, { env }).findings, []);
  const findings = checkSitePolicy(dist, { env });
  assert.ok(findings.some((f) => f.includes('data-comments-base') && f.includes('connect-src does not allow')), findings.join('\n'));
});

test('a baked build never reads PUBLIC_COMMENTS_DATA_BASE: a malformed, file: or http value cannot fail it', (t) => {
  const dist = site(t, { 'index.html': baked, 'posts/a/index.html': baked });
  for (const value of ['not a url', 'file:///etc/passwd', 'ftp://data.example/', 'http://data.aitamer.news/', 'javascript:alert(1)']) {
    const env = { PUBLIC_COMMENTS_DATA_BASE: value };
    assert.deepEqual(writeSitePolicy(dist, { env }).findings, [], value);
    assert.ok(!connectSrc(dist).some((source) => source.includes('data.')), value);
    assert.deepEqual(checkSitePolicy(dist, { env }), [], value);
  }
});

test('a build that reads the data host fails loudly on a base it cannot use, naming the variable and never the value', (t) => {
  const dist = site(t, { 'posts/a/index.html': live(COMMENTS_DATA_BASE_DEFAULT), 'posts/b/index.html': reactionsLive(COMMENTS_DATA_BASE_DEFAULT) });
  for (const value of ['not a url', 'file:///etc/passwd', 'ftp://data.example/', 'http://data.aitamer.news/']) {
    const env = { PUBLIC_COMMENTS_DATA_BASE: value };
    const written = writeSitePolicy(dist, { env }).findings;
    assert.equal(written.length, 1, value);
    assert.match(written[0], /PUBLIC_COMMENTS_DATA_BASE/, value);
    assert.doesNotMatch(written[0], new RegExp(value.replace(/[.*+?^${}()|[\]\\/]/g, '\\$&')), 'the value is not echoed');
    const checked = checkSitePolicy(dist, { env });
    assert.ok(checked.some((f) => /PUBLIC_COMMENTS_DATA_BASE/.test(f)), `${value}: ${checked.join('\n')}`);
  }
  assert.throws(() => commentsDataOrigin({ PUBLIC_COMMENTS_DATA_BASE: 'file:///x/' }), /PUBLIC_COMMENTS_DATA_BASE/);
});

test('the data origin: https, or http on this machine only', () => {
  assert.equal(commentsDataOrigin({ PUBLIC_COMMENTS_DATA_BASE: 'https://data.example/bucket/' }), 'https://data.example');
  for (const local of ['http://127.0.0.1:4399/', 'http://localhost:4399/', 'http://[::1]:4399/']) {
    assert.equal(commentsDataOrigin({ PUBLIC_COMMENTS_DATA_BASE: local }), new URL(local).origin, local);
  }
  assert.throws(() => commentsDataOrigin({ PUBLIC_COMMENTS_DATA_BASE: 'http://example.com/' }), /PUBLIC_COMMENTS_DATA_BASE/);
});

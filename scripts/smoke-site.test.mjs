import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { createServer } from 'node:http';
import { dirname, join } from 'node:path';
import { parseArgs, parseRedirects, plan, smoke, titleOf } from './smoke-site.mjs';
import { tempDir } from './test-support.mjs';

const page = (title, extra = '') => `<!doctype html><html><head><title>${title}</title>${extra}</head><body></body></html>`;
const INLINE = 'document.documentElement.dataset.smoke = "ready";';
const INLINE_HASH = createHash('sha256').update(INLINE).digest('base64');
const SITE_POLICY = `default-src 'self'; script-src 'self' 'sha256-${INLINE_HASH}'; upgrade-insecure-requests`;
const WASM_POLICY = SITE_POLICY.replace("script-src 'self'", "script-src 'self' 'wasm-unsafe-eval'");
const DIAGRAM_POLICY = "default-src 'none'; style-src 'unsafe-inline'; sandbox";
const WORKER = 'self.onmessage = () => {};';
const authoredPage = (title, extra = '') => page(title, `${extra}<script>${INLINE}</script>`);

/** A built site: two pages, a retired section's fallback page, a hashed asset, root files, redirects. */
function fixtureDist() {
  const dist = tempDir('smoke-');
  const files = {
    'index.html': authoredPage('Home', '<link rel="stylesheet" href="/_astro/a.1b2c.css"><img src="/heroes/h.jpg">'),
    'news/index.html': authoredPage('News'),
    'search/index.html': authoredPage('Search'),
    'posts/story/index.html': authoredPage('Story'),
    'pagefind/pagefind-worker.js': WORKER,
    'section/old/index.html': page('Moved'),
    '404.html': authoredPage('Not found'),
    '_astro/a.1b2c.css': 'body{}',
    'heroes/h.jpg': 'jpg',
    'llms.txt': 'llms',
    'rss.xml': '<rss/>',
    'sitemap-index.xml': '<sitemapindex>1</sitemapindex>',
    'sitemap-0.xml': '<urlset>1</urlset>',
    'news-sitemap.xml': '<urlset>news</urlset>',
    '_headers': `/*\n  Content-Security-Policy: ${SITE_POLICY}\n/search/*\n  ! Content-Security-Policy\n  Content-Security-Policy: ${WASM_POLICY}\n/pagefind/*\n  ! Content-Security-Policy\n  Content-Security-Policy: ${WASM_POLICY}\n/diagrams/*\n  ! Content-Security-Policy\n  Content-Security-Policy: ${DIAGRAM_POLICY}\n  X-Content-Type-Options: nosniff\n`,
    '_redirects': '# retired\n/section/old/ /section/new/ 301\n/heroes/old.jpg https://media.aitamer.news/heroes/old.jpg 301\n',
    'diagrams/news/flow.svg': '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1 1"></svg>\n',
  };
  for (const [path, body] of Object.entries(files)) {
    mkdirSync(dirname(join(dist, path)), { recursive: true });
    writeFileSync(join(dist, path), body);
  }
  return dist;
}

/**
 * A stand-in for Cloudflare Pages serving that build, with one fault switched on at a time.
 * @param {{ fault?: string, faultPath?: string, flakyFirst?: number, robots?: string | null }} opts
 */
async function host({ fault = null, faultPath = null, flakyFirst = 0, robots = null } = {}) {
  let served = 0;
  const server = createServer((req, res) => {
    served += 1;
    if (served <= flakyFirst) {
      res.writeHead(503).end();
      return;
    }
    const path = new URL(req.url, 'http://x').pathname;
    const affected = faultPath === null || path === faultPath || (faultPath === '404' && path.startsWith('/smoke-check-no-such-page-'));
    const policyHeaders = () => {
      let policy = path.startsWith('/diagrams/') ? DIAGRAM_POLICY : path.startsWith('/search/') || path.startsWith('/pagefind/') ? WASM_POLICY : SITE_POLICY;
      if (affected && fault === 'wrong-csp') policy = "default-src 'none'";
      if (affected && fault === 'stale-hash') policy = policy.replace(INLINE_HASH, createHash('sha256').update('window.stale = true;').digest('base64'));
      if (affected && fault === 'worker-no-wasm') policy = policy.replace(" 'wasm-unsafe-eval'", '');
      const headers = {};
      if (!(affected && fault === 'no-csp')) headers['content-security-policy'] = policy;
      if (affected && fault === 'report-only') {
        delete headers['content-security-policy'];
        headers['content-security-policy-report-only'] = policy;
      }
      if (affected && fault === 'report-only-companion') headers['content-security-policy-report-only'] = policy;
      if (affected && fault === 'duplicate-csp') headers['content-security-policy'] = [policy, policy];
      return headers;
    };
    const html = (status, body) => {
      const headers = { 'content-type': 'text/html', ...policyHeaders() };
      if (robots) headers['x-robots-tag'] = robots;
      if (affected && fault === 'stale-inline') body = body.replace(INLINE, 'window.stale = true;');
      if (affected && fault === 'extra-inline') body += '<script>window.unapproved = true;</script>';
      res.writeHead(status, headers).end(body);
    };
    if (path === '/section/old/') {
      if (fault === 'redirect-to') res.writeHead(301, { location: '/elsewhere/' }).end();
      else if (fault === 'redirect-status') res.writeHead(302, { location: '/section/new/' }).end();
      else res.writeHead(301, { location: '/section/new/' }).end();
    } else if (path === '/heroes/old.jpg') {
      if (fault === 'redirect-other-host') res.writeHead(301, { location: 'https://elsewhere.example/heroes/old.jpg' }).end();
      else if (fault === 'redirect-same-host') res.writeHead(301, { location: '/heroes/old.jpg' }).end();
      else res.writeHead(301, { location: 'https://media.aitamer.news/heroes/old.jpg' }).end();
    } else if (path === '/') html(200, authoredPage('Home'));
    else if (path === '/news/' && fault !== 'missing-page') html(200, authoredPage(fault === 'stale' ? 'Old news' : 'News'));
    else if (path === '/search/') html(200, authoredPage('Search'));
    else if (path === '/posts/story/') html(200, authoredPage('Story'));
    else if (path === '/pagefind/pagefind-worker.js' && fault !== 'missing-worker') res.writeHead(200, { 'content-type': 'text/javascript', ...policyHeaders() }).end(fault === 'stale-worker' ? '// old worker' : WORKER);
    else if (path === '/_astro/a.1b2c.css') res.writeHead(200, { 'cache-control': fault === 'no-cache' ? 'no-cache' : 'public, max-age=31536000, immutable' }).end('body{}');
    else if (path === '/diagrams/news/flow.svg') {
      const headers = { 'content-type': fault === 'diagram-as-html' ? 'text/html' : 'image/svg+xml', 'x-content-type-options': 'nosniff', ...policyHeaders() };
      if (fault === 'diagram-no-lockdown') delete headers['content-security-policy'];
      res.writeHead(200, headers).end('<svg/>');
    } else if (path === '/sitemap-0.xml') res.writeHead(200).end(fault === 'stale-sitemap' ? '<urlset>old</urlset>' : '<urlset>1</urlset>');
    else if (path === '/sitemap-index.xml') res.writeHead(200).end('<sitemapindex>1</sitemapindex>');
    else if (path === '/news-sitemap.xml') res.writeHead(200).end('<urlset>news</urlset>');
    else if (['/heroes/h.jpg', '/llms.txt', '/rss.xml'].includes(path) && !(fault === 'missing-file' && path === '/llms.txt')) res.writeHead(200).end('x');
    else if (fault === 'soft-404') html(200, authoredPage('Home'));
    else html(404, authoredPage('Not found'));
  });
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const base = `http://127.0.0.1:${server.address().port}`;
  return { base, requests: () => served, close: () => new Promise((resolve) => server.close(resolve)) };
}

const FAST = { rounds: 1, roundDelayMs: 0, attempts: 1, attemptDelayMs: 0 };

async function run(expect, hostOpts, opts = FAST) {
  const h = await host(hostOpts);
  try {
    return await smoke(h.base, expect, fixtureDist(), opts);
  } finally {
    await h.close();
  }
}

test('the plan: every page but 404 and redirected fallbacks, root files and the home page\'s files, the redirects', () => {
  const work = plan(fixtureDist());
  assert.deepEqual(work.pages, [{ path: '/', title: 'Home' }, { path: '/news/', title: 'News' }, { path: '/search/', title: 'Search' }, { path: '/posts/story/', title: 'Story' }]);
  assert.deepEqual(work.files, ['/_astro/a.1b2c.css', '/heroes/h.jpg', '/llms.txt', '/news-sitemap.xml', '/pagefind/pagefind-worker.js', '/rss.xml', '/sitemap-0.xml', '/sitemap-index.xml']);
  assert.deepEqual([...work.sitemaps.keys()].sort(), ['/news-sitemap.xml', '/sitemap-0.xml', '/sitemap-index.xml']);
  assert.equal(work.sitemaps.get('/sitemap-0.xml'), '<urlset>1</urlset>');
  assert.deepEqual(work.redirects, [
    { from: '/section/old/', to: '/section/new/', status: 301 },
    { from: '/heroes/old.jpg', to: 'https://media.aitamer.news/heroes/old.jpg', status: 301 },
  ]);
  assert.deepEqual(work.diagrams, ['/diagrams/news/flow.svg']);
  // Key pages come first and the cap never drops them; the cap trims the rest.
  const dist = fixtureDist();
  mkdirSync(join(dist, 'topics', 'a'), { recursive: true });
  writeFileSync(join(dist, 'topics', 'a', 'index.html'), authoredPage('A'));
  assert.deepEqual(plan(dist, 1).pages.map((p) => p.path), ['/', '/news/', '/search/', '/posts/story/']);
  assert.deepEqual(plan(dist, 5).pages.map((p) => p.path), ['/', '/news/', '/search/', '/posts/story/', '/topics/a/']);
});

test('a deployment that serves the build correctly passes, as production and as a preview', async () => {
  const prod = await run('production');
  assert.deepEqual(prod.findings, []);
  assert.equal(prod.ok, true);
  const preview = await run('preview', { robots: 'noindex' });
  assert.deepEqual(preview.findings, []);
});

test('each way a deployment can be wrong is a finding', async () => {
  const cases = [
    ['missing-page', 'production', /\/news\/: answered 404, expected 200/],
    ['stale', 'production', /\/news\/: title is "Old news", this build's is "News" \(an old deployment\?\)/],
    ['missing-file', 'production', /\/llms\.txt: answered 404/],
    ['stale-sitemap', 'production', /\/sitemap-0\.xml: the deployment serves a different sitemap than this build made/],
    ['redirect-to', 'production', /redirect \/section\/old\/: points at \/elsewhere\/, expected \/section\/new\//],
    ['redirect-status', 'production', /redirect \/section\/old\/: answered 302, expected 301/],
    // A redirect to another host must land on that host, not merely on the same path (ADR 0020).
    ['redirect-other-host', 'production', /redirect \/heroes\/old\.jpg: points at https:\/\/elsewhere\.example\/heroes\/old\.jpg, expected https:\/\/media\.aitamer\.news/],
    ['redirect-same-host', 'production', /redirect \/heroes\/old\.jpg: points at \/heroes\/old\.jpg, expected https:\/\/media\.aitamer\.news/],
    ['soft-404', 'production', /does not exist answered 200, expected 404/],
    ['no-csp', 'production', /no Content-Security-Policy/],
    ['no-cache', 'production', /missing the long cache/],
    ['diagram-no-lockdown', 'production', /\/diagrams\/news\/flow\.svg: no Content-Security-Policy/],
    ['diagram-as-html', 'production', /\/diagrams\/news\/flow\.svg: served as text\/html/],
  ];
  for (const [fault, expect, pattern] of cases) {
    const result = await run(expect, { fault });
    assert.equal(result.ok, false, fault);
    assert.ok(result.findings.some((f) => pattern.test(f)), `${fault}: ${result.findings.join(' | ')}`);
  }
});

test('the candidate policy is checked on home, a story, search, the real worker, a 404 and a diagram', async () => {
  for (const faultPath of ['/', '/posts/story/', '/search/', '/pagefind/pagefind-worker.js', '404', '/diagrams/news/flow.svg']) {
    for (const fault of ['no-csp', 'report-only', 'report-only-companion', 'wrong-csp', 'duplicate-csp']) {
      const result = await run('production', { fault, faultPath });
      assert.equal(result.ok, false, `${faultPath}: ${fault}`);
      assert.ok(result.findings.some((finding) => /Content-Security-Policy/.test(finding)), `${faultPath}: ${fault}: ${result.findings.join(' | ')}`);
    }
  }
});

test('stale header hashes, changed authored scripts and broken worker responses fail deployment checks', async () => {
  for (const [fault, faultPath, pattern] of [
    ['stale-hash', '/posts/story/', /Content-Security-Policy differs from this build/],
    ['stale-inline', '/posts/story/', /authored inline script sha256-.*missing or changed/],
    ['worker-no-wasm', '/pagefind/pagefind-worker.js', /Content-Security-Policy differs from this build/],
    ['missing-worker', '/pagefind/pagefind-worker.js', /pagefind-worker\.js: answered 404/],
    ['stale-worker', '/pagefind/pagefind-worker.js', /worker differs from this build/],
  ]) {
    const result = await run('production', { fault, faultPath });
    assert.equal(result.ok, false, fault);
    assert.ok(result.findings.some((finding) => pattern.test(finding)), `${fault}: ${result.findings.join(' | ')}`);
  }
});

test('edge-added inline content does not replace the authored scripts or gain a hash exception', async () => {
  const result = await run('production', { fault: 'extra-inline', faultPath: '/' });
  assert.deepEqual(result.findings, []);
});

test('an incomplete or report-only candidate artifact cannot supply deployment expectations', async () => {
  for (const headers of [
    '/*\n  X-Test: missing-policy\n',
    `/*\n  Content-Security-Policy-Report-Only: ${SITE_POLICY}\n`,
    `/*\n  Content-Security-Policy: ${SITE_POLICY}\n  Content-Security-Policy: ${SITE_POLICY}\n`,
  ]) {
    const dist = fixtureDist();
    writeFileSync(join(dist, '_headers'), headers);
    const h = await host();
    try {
      const result = await smoke(h.base, 'production', dist, FAST);
      assert.equal(result.ok, false);
      assert.ok(result.findings.some((finding) => finding.includes('_headers')), result.findings.join(' | '));
    } finally {
      await h.close();
    }
  }
});

test('a candidate missing its authored 404 page fails before requesting a host fallback', async () => {
  const dist = fixtureDist();
  rmSync(join(dist, '404.html'));
  const work = plan(dist);
  assert.ok(work.findings.some((finding) => finding.includes('404.html') && finding.includes('missing')), work.findings.join(' | '));
  const h = await host();
  try {
    const result = await smoke(h.base, 'production', dist, FAST);
    assert.equal(result.ok, false);
    assert.equal(result.checked, 0);
    assert.equal(h.requests(), 0, 'a host-provided 404 cannot substitute for the absent candidate page');
  } finally {
    await h.close();
  }
});

test('noindex must be on a preview and must never be on production', async () => {
  const bare = await run('preview');
  assert.ok(bare.findings.some((f) => /a preview must carry X-Robots-Tag: noindex/.test(f)), bare.findings.join(' | '));
  const leaked = await run('production', { robots: 'noindex, nofollow' });
  assert.ok(leaked.findings.some((f) => /production carries X-Robots-Tag: noindex, nofollow/.test(f)), leaked.findings.join(' | '));
  // A header that merely mentions the word is not noindex.
  const other = await run('production', { robots: 'noimageindex' });
  assert.deepEqual(other.findings, []);
});

test('a 5xx is retried within a round, and a failed round is retried before the verdict', async () => {
  const withinRound = await run('production', { flakyFirst: 1 }, { ...FAST, attempts: 2 });
  assert.equal(withinRound.ok, true, withinRound.findings.join(' | '));
  const lines = [];
  const h = await host({ flakyFirst: 1 });
  try {
    const acrossRounds = await smoke(h.base, 'production', fixtureDist(), { ...FAST, rounds: 2, log: (l) => lines.push(l) });
    assert.equal(acrossRounds.ok, true, acrossRounds.findings.join(' | '));
    assert.equal(acrossRounds.round, 2);
    assert.match(lines.join('\n'), /round 1 found 1 problem/);
  } finally {
    await h.close();
  }
});

test('an unreachable host fails every check instead of passing', async () => {
  const h = await host();
  const { base } = h;
  await h.close();
  const result = await smoke(base, 'production', fixtureDist(), FAST);
  assert.equal(result.ok, false);
  assert.ok(result.findings.every((f) => /request failed/.test(f)), result.findings.join(' | '));
});

test('titles, redirects and arguments parse as written', () => {
  assert.equal(titleOf('<title>\n A &amp; B </title>'), 'A &amp; B');
  assert.equal(titleOf('<p>none</p>'), null);
  assert.deepEqual(parseRedirects('# c\n\n/a /b\n/c /d 308\n'), [{ from: '/a', to: '/b', status: 302 }, { from: '/c', to: '/d', status: 308 }]);
  const dist = fixtureDist();
  assert.deepEqual(parseArgs(['--base', 'https://x.pages.dev/some/path', '--expect', 'preview', '--dist', dist]), { base: 'https://x.pages.dev', expect: 'preview', dist });
  assert.match(String(parseArgs(['--expect', 'preview', '--dist', dist])), /--base <url> is required/);
  assert.match(String(parseArgs(['--base', 'http://aitamer.news', '--expect', 'production', '--dist', dist])), /must be https/);
  assert.match(String(parseArgs(['--base', 'https://aitamer.news', '--expect', 'staging', '--dist', dist])), /preview or production/);
  assert.match(String(parseArgs(['--base', 'https://aitamer.news', '--expect', 'production', '--dist', join(dist, 'nope')])), /run `npm run build` first/);
});

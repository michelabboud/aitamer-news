import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdirSync, writeFileSync } from 'node:fs';
import { createServer } from 'node:http';
import { dirname, join } from 'node:path';
import { parseArgs, parseRedirects, plan, smoke, titleOf } from './smoke-site.mjs';
import { tempDir } from './test-support.mjs';

const page = (title, extra = '') => `<!doctype html><html><head><title>${title}</title>${extra}</head><body></body></html>`;

/** A built site: two pages, a retired section's fallback page, a hashed asset, root files, redirects. */
function fixtureDist() {
  const dist = tempDir('smoke-');
  const files = {
    'index.html': page('Home', '<link rel="stylesheet" href="/_astro/a.1b2c.css"><img src="/heroes/h.jpg">'),
    'news/index.html': page('News'),
    'section/old/index.html': page('Moved'),
    '404.html': page('Not found'),
    '_astro/a.1b2c.css': 'body{}',
    'heroes/h.jpg': 'jpg',
    'llms.txt': 'llms',
    'rss.xml': '<rss/>',
    '_headers': '/*\n  X: 1\n',
    '_redirects': '# retired\n/section/old/ /section/new/ 301\n',
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
 * @param {{ fault?: string, flakyFirst?: number, robots?: string | null }} opts
 */
async function host({ fault = null, flakyFirst = 0, robots = null } = {}) {
  let served = 0;
  const server = createServer((req, res) => {
    served += 1;
    if (served <= flakyFirst) {
      res.writeHead(503).end();
      return;
    }
    const path = new URL(req.url, 'http://x').pathname;
    const html = (status, body) => {
      const headers = { 'content-type': 'text/html' };
      if (fault !== 'no-csp') headers['content-security-policy-report-only'] = "default-src 'self'";
      if (robots) headers['x-robots-tag'] = robots;
      res.writeHead(status, headers).end(body);
    };
    if (path === '/section/old/') {
      if (fault === 'redirect-to') res.writeHead(301, { location: '/elsewhere/' }).end();
      else if (fault === 'redirect-status') res.writeHead(302, { location: '/section/new/' }).end();
      else res.writeHead(301, { location: '/section/new/' }).end();
    } else if (path === '/') html(200, page('Home'));
    else if (path === '/news/' && fault !== 'missing-page') html(200, page(fault === 'stale' ? 'Old news' : 'News'));
    else if (path === '/_astro/a.1b2c.css') res.writeHead(200, { 'cache-control': fault === 'no-cache' ? 'no-cache' : 'public, max-age=31536000, immutable' }).end('body{}');
    else if (path === '/diagrams/news/flow.svg') {
      const headers = { 'content-type': fault === 'diagram-as-html' ? 'text/html' : 'image/svg+xml', 'x-content-type-options': 'nosniff' };
      if (fault !== 'diagram-no-lockdown') headers['content-security-policy'] = "default-src 'none'; style-src 'unsafe-inline'; sandbox";
      res.writeHead(200, headers).end('<svg/>');
    } else if (['/heroes/h.jpg', '/llms.txt', '/rss.xml'].includes(path) && !(fault === 'missing-file' && path === '/llms.txt')) res.writeHead(200).end('x');
    else if (fault === 'soft-404') html(200, page('Home'));
    else html(404, page('Not found'));
  });
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const base = `http://127.0.0.1:${server.address().port}`;
  return { base, close: () => new Promise((resolve) => server.close(resolve)) };
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
  assert.deepEqual(work.pages, [{ path: '/', title: 'Home' }, { path: '/news/', title: 'News' }]);
  assert.deepEqual(work.files, ['/_astro/a.1b2c.css', '/heroes/h.jpg', '/llms.txt', '/rss.xml']);
  assert.deepEqual(work.redirects, [{ from: '/section/old/', to: '/section/new/', status: 301 }]);
  assert.deepEqual(work.diagrams, ['/diagrams/news/flow.svg']);
  // Key pages come first and the cap never drops them; the cap trims the rest.
  const dist = fixtureDist();
  mkdirSync(join(dist, 'posts', 'a'), { recursive: true });
  writeFileSync(join(dist, 'posts', 'a', 'index.html'), page('A'));
  assert.deepEqual(plan(dist, 1).pages.map((p) => p.path), ['/', '/news/']);
  assert.deepEqual(plan(dist, 3).pages.map((p) => p.path), ['/', '/news/', '/posts/a/']);
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
    ['redirect-to', 'production', /redirect \/section\/old\/: points at \/elsewhere\/, expected \/section\/new\//],
    ['redirect-status', 'production', /redirect \/section\/old\/: answered 302, expected 301/],
    ['soft-404', 'production', /does not exist answered 200, expected 404/],
    ['no-csp', 'production', /no Content-Security-Policy/],
    ['no-cache', 'production', /missing the long cache/],
    ['diagram-no-lockdown', 'production', /\/diagrams\/news\/flow\.svg: missing the diagrams' enforced lockdown/],
    ['diagram-as-html', 'production', /\/diagrams\/news\/flow\.svg: served as text\/html/],
  ];
  for (const [fault, expect, pattern] of cases) {
    const result = await run(expect, { fault });
    assert.equal(result.ok, false, fault);
    assert.ok(result.findings.some((f) => pattern.test(f)), `${fault}: ${result.findings.join(' | ')}`);
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

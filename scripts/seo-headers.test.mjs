import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';
import {
  allows, checkSitePolicy, headersFor, parsePolicy, unmodeledRules, writeSitePolicy,
} from './csp-headers.mjs';

const publicHeaders = readFileSync(new URL('../public/_headers', import.meta.url), 'utf8');
const enforced = 'content-security-policy';
const reportOnly = 'content-security-policy-report-only';
const endpoints = {};

function builtSite(t, html = '<!doctype html><title>Reader</title>', extraFiles = {}) {
  const dist = mkdtempSync(join(tmpdir(), 'aitamer-seo-headers-'));
  t.after(() => rmSync(dist, { recursive: true }));
  for (const [path, body] of Object.entries({ '_headers': publicHeaders, 'index.html': html, ...extraFiles })) {
    const target = join(dist, path);
    mkdirSync(join(target, '..'), { recursive: true });
    writeFileSync(target, body);
  }
  return dist;
}

function generate(dist) {
  assert.deepEqual(writeSitePolicy(dist, { env: endpoints }).findings, []);
  return readFileSync(join(dist, '_headers'), 'utf8');
}

test('generated response headers deny framing on every response path', (t) => {
  const text = generate(builtSite(t));
  for (const path of ['/', '/posts/story/', '/search/', '/pagefind/pagefind-worker.js', '/diagrams/chart.svg']) {
    assert.equal(headersFor(text, path).get('x-frame-options'), 'DENY', path);
  }
});

test('generated response headers disable only unused capabilities and preserve playback defaults', (t) => {
  const text = generate(builtSite(t));
  for (const path of ['/', '/posts/story/', '/search/', '/pagefind/pagefind-worker.js', '/diagrams/chart.svg']) {
    const headers = headersFor(text, path);
    const permissions = new Map((headers.get('permissions-policy') ?? '').split(',').filter(Boolean).map((part) => {
      const [feature, value] = part.trim().split('=');
      return [feature, value];
    }));
    assert.deepEqual(Object.fromEntries(permissions), {
      camera: '()', microphone: '()', geolocation: '()', payment: '()', usb: '()',
    }, `${path}: video, fullscreen and playback capabilities must retain their defaults`);
  }
});

test('the built resource guard permits Cloudflare Insights scripts and the exact observed analytics connection', (t) => {
  const dist = builtSite(t, `<!doctype html><title>Analytics</title>
    <script src="https://static.cloudflareinsights.com/beacon.min.js" defer></script>
    <div data-endpoint="https://stats.g.doubleclick.net/g/collect?v=2"></div>`);
  const text = generate(dist);
  assert.deepEqual(checkSitePolicy(dist, { env: endpoints }), []);
  const policy = parsePolicy(headersFor(text, '/').get(enforced));
  assert.equal(allows(policy.get('script-src'), 'https://static.cloudflareinsights.com/beacon.min.js'), true);
  assert.equal(allows(policy.get('connect-src'), 'https://stats.g.doubleclick.net/g/collect'), true);
  assert.equal(allows(policy.get('script-src'), 'https://stats.g.doubleclick.net/tracker.js'), false);
  assert.equal(allows(policy.get('connect-src'), 'https://static.cloudflareinsights.com/collect'), false);
});

test('new provider exceptions reject lookalike hosts, alternate ports, subdomains and insecure URLs', (t) => {
  const text = generate(builtSite(t));
  const policy = parsePolicy(headersFor(text, '/').get(enforced));
  for (const [directive, hostname] of [
    ['script-src', 'static.cloudflareinsights.com'], ['connect-src', 'stats.g.doubleclick.net'],
  ]) {
    for (const url of [
      `https://${hostname}.evil.test/payload`, `https://evil.${hostname}/payload`,
      `https://${hostname}:444/payload`, `http://${hostname}/payload`,
      `https://${hostname}@evil.test/payload`,
    ]) assert.equal(allows(policy.get(directive), url), false, url);
  }
  assert.equal(allows(policy.get('script-src'), 'https://cloudflareinsights.com/payload'), false);
  assert.equal(allows(policy.get('connect-src'), 'https://doubleclick.net/payload'), false);
});

test('the resource scanner exposes rejected script and runtime connection lookalikes to the deploy guard', (t) => {
  const dist = builtSite(t, `<!doctype html><title>Rejected providers</title>
    <script src="https://static.cloudflareinsights.com.evil.test/beacon.min.js"></script>
    <div data-endpoint="https://stats.g.doubleclick.net.evil.test/g/collect"></div>`);
  generate(dist);
  const findings = checkSitePolicy(dist, { env: endpoints });
  assert.equal(findings.length, 2);
  assert.ok(findings.some((finding) => finding.includes('<script src> loads https://static.cloudflareinsights.com.evil.test/beacon.min.js, which script-src does not allow')));
  assert.ok(findings.some((finding) => finding.includes('<div data-endpoint> loads https://stats.g.doubleclick.net.evil.test/g/collect, which connect-src does not allow')));
});

test('existing forms, analytics, video embeds and self-hosted assets still pass the resource guard', (t) => {
  const dist = builtSite(t, `<!doctype html><title>Existing providers</title>
    <link rel="stylesheet" href="/_astro/site.css">
    <script src="https://challenges.cloudflare.com/turnstile/v0/api.js"></script>
    <script src="https://www.googletagmanager.com/gtag/js?id=test"></script>
    <form action="https://comments.aitamer.news/"></form>
    <form action="https://contact.aitamer.news/"></form>
    <div data-endpoint="https://region.google-analytics.com/g/collect"></div>
    <div data-endpoint="https://www.google.com/measurement"></div>
    <div data-embed="https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ?autoplay=1"></div>
    <iframe src="https://www.youtube.com/embed/dQw4w9WgXcQ" allowfullscreen></iframe>
    <iframe src="https://challenges.cloudflare.com/widget"></iframe>
    <img src="https://media.aitamer.news/heroes/story.webp" alt="Story">`);
  const text = generate(dist);
  assert.deepEqual(checkSitePolicy(dist, { env: endpoints }), []);
  const policy = parsePolicy(headersFor(text, '/').get(enforced));
  assert.deepEqual(policy.get('script-src').filter((source) => source.includes('*')), []);
  assert.deepEqual(policy.get('connect-src').filter((source) => source.includes('*')), [
    'https://*.google-analytics.com', 'https://*.google.com',
  ]);
});

test('inline hashes are enforced and only search and its worker can compile WebAssembly', (t) => {
  const script = 'document.documentElement.dataset.ready = "true";';
  const expectedHash = `'sha256-${createHash('sha256').update(script).digest('base64')}'`;
  const dist = builtSite(t, `<!doctype html><title>Reader</title><script>${script}</script>`, {
    'posts/story/index.html': '<!doctype html><title>Story</title>',
    '404.html': '<!doctype html><title>Not found</title>',
    'search/index.html': '<!doctype html><title>Search</title>',
    'pagefind/pagefind-worker.js': '// disposable worker response fixture',
  });
  const text = generate(dist);
  assert.deepEqual(checkSitePolicy(dist, { env: endpoints }), []);
  for (const path of ['/', '/posts/story/', '/404.html', '/search/', '/pagefind/pagefind-worker.js']) {
    const headers = headersFor(text, path);
    assert.equal(headers.has(reportOnly), false, path);
    assert.equal(headers.get(enforced).includes(','), false, path);
    const policy = parsePolicy(headers.get(enforced));
    assert.equal(policy.has('upgrade-insecure-requests'), true, path);
    const sources = policy.get('script-src');
    // The worker's fixed policy names no page hash; every page policy names each hash once.
    assert.equal(sources.filter((source) => source === expectedHash).length, path === '/pagefind/pagefind-worker.js' ? 0 : 1, path);
    assert.equal(sources.includes("'unsafe-inline'"), false, path);
    assert.equal(sources.includes("'unsafe-eval'"), false, path);
    assert.equal(sources.includes("'wasm-unsafe-eval'"), path === '/search/' || path === '/pagefind/pagefind-worker.js', path);
  }
  const diagram = headersFor(text, '/diagrams/chart.svg');
  assert.equal(diagram.has(reportOnly), false);
  assert.equal(diagram.get('content-security-policy'), "default-src 'none'; style-src 'unsafe-inline'; sandbox");
  assert.equal(diagram.get('x-content-type-options'), 'nosniff');
});

test('explicit report-only rollback preserves hashes and worker overrides while diagrams remain enforced', (t) => {
  const script = 'document.documentElement.dataset.ready = "true";';
  const expectedHash = `'sha256-${createHash('sha256').update(script).digest('base64')}'`;
  const dist = builtSite(t, `<!doctype html><title>Reader</title><script>${script}</script>`, {
    'search/index.html': '<!doctype html><title>Search</title>',
    'pagefind/pagefind-worker.js': '// disposable worker response fixture',
  });
  generate(dist);
  assert.deepEqual(writeSitePolicy(dist, { env: endpoints, enforce: false }).findings, []);
  assert.deepEqual(checkSitePolicy(dist, { env: endpoints, enforce: false }), []);
  assert.ok(checkSitePolicy(dist, { env: endpoints }).some((finding) => finding.includes('served with Content-Security-Policy-Report-Only')));
  const text = readFileSync(join(dist, '_headers'), 'utf8');
  assert.ok(text.startsWith(`${publicHeaders.trimEnd()}\n\n`));
  for (const path of ['/', '/search/', '/pagefind/pagefind-worker.js']) {
    const headers = headersFor(text, path);
    assert.equal(headers.has(enforced), false, path);
    assert.equal(headers.get(reportOnly).includes(','), false, path);
    const policy = parsePolicy(headers.get(reportOnly));
    assert.equal(policy.has('upgrade-insecure-requests'), false, path);
    const sources = policy.get('script-src');
    // The worker's fixed policy names no page hash; every page policy names each hash once.
    assert.equal(sources.filter((source) => source === expectedHash).length, path === '/pagefind/pagefind-worker.js' ? 0 : 1, path);
    assert.equal(sources.includes("'unsafe-inline'"), false, path);
    assert.equal(sources.includes("'unsafe-eval'"), false, path);
    assert.equal(sources.includes("'wasm-unsafe-eval'"), path !== '/', path);
  }
  const diagram = headersFor(text, '/diagrams/chart.svg');
  assert.equal(diagram.has(reportOnly), false);
  assert.equal(diagram.get(enforced), "default-src 'none'; style-src 'unsafe-inline'; sandbox");
  assert.equal(diagram.get('x-content-type-options'), 'nosniff');
  const restored = generate(dist);
  assert.equal(headersFor(restored, '/').has(reportOnly), false);
  assert.deepEqual(checkSitePolicy(dist, { env: endpoints }), []);
});

test('the deploy guard rejects missing and duplicate enforced site policies', (t) => {
  for (const [name, replacement, expected] of [
    ['missing', '', 'served with no Content-Security-Policy header'],
    ['duplicate', '$&$&', 'two Content-Security-Policy values reach it'],
  ]) {
    const dist = builtSite(t);
    const text = generate(dist);
    const altered = text.replace(/^  Content-Security-Policy:.*\n/m, replacement);
    assert.notEqual(altered, text, name);
    writeFileSync(join(dist, '_headers'), altered);
    const findings = checkSitePolicy(dist, { env: endpoints });
    assert.ok(findings.some((finding) => finding.includes(expected)), `${name}: ${findings.join('\n')}`);
  }
});

test('the deploy guard rejects an inline script added after the policy was built', (t) => {
  const dist = builtSite(t);
  generate(dist);
  writeFileSync(join(dist, 'index.html'), '<!doctype html><title>Changed</title><script>window.changed = true;</script>');
  const findings = checkSitePolicy(dist, { env: endpoints });
  assert.ok(findings.some((finding) => finding.includes('inline script sha256-') && finding.includes('is not in the policy')), findings.join('\n'));
});

test('the deploy guard rejects a worker policy without its WebAssembly permission', (t) => {
  const dist = builtSite(t, '<!doctype html><title>Reader</title>', {
    'pagefind/pagefind-worker.js': '// disposable worker response fixture',
  });
  const text = generate(dist);
  const altered = text.replace(/(\/pagefind\/pagefind-worker\.js\n  ! Content-Security-Policy\n  Content-Security-Policy:[^\n]*)/, (block) => block.replace(" 'wasm-unsafe-eval'", ''));
  assert.notEqual(altered, text);
  writeFileSync(join(dist, '_headers'), altered);
  const findings = checkSitePolicy(dist, { env: endpoints });
  assert.ok(findings.some((finding) => finding.includes("pagefind/pagefind-worker.js: its policy does not allow 'wasm-unsafe-eval'")), findings.join('\n'));
});

test('generated headers preserve preview exclusions and distinct asset and story cache rules', (t) => {
  const text = generate(builtSite(t));
  assert.ok(text.startsWith(`${publicHeaders.trimEnd()}\n\n`));
  assert.equal(headersFor(text, '/_astro/site.hash.css').get('cache-control'), 'public, max-age=31536000, immutable');
  assert.equal(headersFor(text, '/posts/story/').get('cache-control'), 'public, max-age=30, must-revalidate');
  for (const path of ['/', '/rev/story.json', '/latest.json']) assert.equal(headersFor(text, path).has('cache-control'), false, path);
  assert.equal(headersFor(text, '/').has('x-robots-tag'), false);
  assert.match(text, /^https:\/\/:project\.pages\.dev\/\*\n  X-Robots-Tag: noindex$/m);
  assert.match(text, /^https:\/\/:version\.:project\.pages\.dev\/\*\n  X-Robots-Tag: noindex$/m);
});

test('a policy exceeding the Pages 2000-character line limit is refused without changing copied headers', (t) => {
  const scripts = Array.from({ length: 40 }, (_, i) => `<script>window.readerFixture = ${i};</script>`).join('');
  const dist = builtSite(t, `<!doctype html><title>Many scripts</title>${scripts}`);
  const result = writeSitePolicy(dist, { env: endpoints });
  assert.ok(result.findings.length > 0);
  assert.ok(result.findings.every((finding) => finding.includes("over Cloudflare's 2000")));
  assert.equal(readFileSync(join(dist, '_headers'), 'utf8'), publicHeaders);
});

test('generated Pages headers leave HSTS to Cloudflare for every host and response path', (t) => {
  const text = generate(builtSite(t));
  assert.equal(text.split('\n').filter((line) => /^\s*Strict-Transport-Security:/i.test(line)).length, 0);
  for (const origin of ['', 'https://aitamer.news', 'https://www.aitamer.news', 'https://branch.aitamer-news.pages.dev', 'http://localhost:4329']) {
    for (const path of ['/', '/posts/story/', '/search/', '/_astro/site.hash.css', '/404.html']) {
      const request = `${origin}${path}`;
      assert.equal(headersFor(text, request).has('strict-transport-security'), false, request);
    }
  }
});

test('absolute request URLs retain path headers regardless of incoming protocol and port', (t) => {
  const text = generate(builtSite(t));
  for (const request of [
    'http://aitamer.news/', 'https://aitamer.news:8443/', 'other://aitamer.news:1234/',
    'http://aitamer.news:8080/posts/story/?reader=test',
  ]) {
    const headers = headersFor(text, request);
    assert.equal(headers.get('x-frame-options'), 'DENY', request);
    assert.equal(headers.has(enforced), true, request);
    assert.equal(headers.has(reportOnly), false, request);
  }
  assert.equal(headersFor(text, 'https://aitamer.news/_astro/site.hash.css').get('cache-control'), 'public, max-age=31536000, immutable');
  assert.equal(headersFor(text, 'https://aitamer.news/posts/story/').get('cache-control'), 'public, max-age=30, must-revalidate');
});

test('a production-host fixture header does not reach www, previews, localhost, subdomains or lookalike hosts', (t) => {
  const source = 'https://aitamer.news/*\n  X-Test-Scope: production\n/*\n  X-Frame-Options: DENY\n';
  const text = generate(builtSite(t, '<!doctype html><title>Host fixture</title>', { '_headers': source }));
  for (const origin of [
    'https://www.aitamer.news', 'https://aitamer-news.pages.dev',
    'https://branch.aitamer-news.pages.dev', 'http://localhost:4329', 'http://127.0.0.1:4329',
    'https://preview.aitamer.news', 'https://aitamer.news.evil.test',
    'https://evil-aitamer.news', 'https://aitamer.news@evil.test',
  ]) {
    for (const path of ['/', '/posts/story/', '/search/', '/_astro/site.hash.css', '/404.html']) {
      const request = `${origin}${path}`;
      const headers = headersFor(text, request);
      assert.equal(headers.has('x-test-scope'), false, request);
      assert.equal(headers.get('x-frame-options'), 'DENY', `${request}: path rules still apply`);
    }
  }
});

test('the generator and checker preserve an exact production-host fixture block', (t) => {
  const source = 'https://aitamer.news/*\n  X-Test-Scope: production\n/*\n  X-Test: shared\n';
  const dist = builtSite(t, '<!doctype html><title>Host fixture</title>', {
    '_headers': source,
    'headers-source': source,
  });
  assert.deepEqual(unmodeledRules(source), []);
  const text = generate(dist);
  assert.ok(text.startsWith(`${source.trimEnd()}\n\n`));
  assert.deepEqual(checkSitePolicy(dist, { env: endpoints, publicHeaders: join(dist, 'headers-source') }), []);
  for (const request of ['/', 'https://aitamer.news/', 'http://aitamer.news:8080/', 'other://aitamer.news:1234/']) {
    assert.equal(headersFor(text, request).get('x-test-scope'), 'production', request);
  }
});

test('unrelated or malformed absolute host rules remain refused by the generator and checker', (t) => {
  for (const rule of [
    'https://elsewhere.test/*', 'https://www.aitamer.news/*', 'https://*.aitamer.news/*',
    'http://aitamer.news/*', 'https://aitamer.news:443/*', 'https://aitamer.news',
    'https://aitamer.news/posts/*', 'https://aitamer.news/*?reader=test',
    'https://aitamer.news/*#fragment', 'https://aitamer.news@evil.test/*',
    'https://aitamer.news.evil.test/*', 'https://aitamer.news./*',
    '/posts/:slug/*', '/a/*/b', '/*.jpg',
  ]) {
    const source = `${rule}\n  X-Test: unsupported\n`;
    const dist = builtSite(t, '<!doctype html><title>Unsupported rule</title>', { '_headers': source });
    assert.deepEqual(unmodeledRules(source), [rule], rule);
    for (const findings of [writeSitePolicy(dist, { env: endpoints }).findings, checkSitePolicy(dist, { env: endpoints })]) {
      assert.equal(findings.length, 1, rule);
      assert.ok(findings[0].includes(rule) && findings[0].includes('does not model'), findings[0]);
    }
    assert.equal(readFileSync(join(dist, '_headers'), 'utf8'), source, rule);
  }
});

test('production and preview host rules cannot set or detach either CSP header', () => {
  for (const rule of ['https://aitamer.news/*', 'https://:project.pages.dev/*', 'https://:version.:project.pages.dev/*']) {
    for (const header of [
      "Content-Security-Policy: default-src 'none'", "content-security-policy-report-only: default-src 'none'",
      '! Content-Security-Policy', '! content-security-policy-report-only',
    ]) {
      const source = `${rule}\n  X-Test: earlier\n  ${header}\n  X-Test: later\n`;
      assert.deepEqual(unmodeledRules(source), [rule], `${rule}: ${header}`);
    }
  }
});

test('generated output uses unique rule patterns so Pages keeps the global security headers and policy together', (t) => {
  const text = generate(builtSite(t));
  const rules = text.split('\n').filter((line) => line.trim() && !/^\s/.test(line) && !line.startsWith('#'));
  assert.deepEqual(rules.filter((rule, i) => rules.indexOf(rule) !== i), []);
  const globalBlock = text.split(/^\/\*$/m)[1].split(/^[^\s#]/m)[0];
  assert.match(globalBlock, /^  X-Frame-Options: DENY$/m);
  assert.match(globalBlock, /^  Permissions-Policy: camera=\(\), microphone=\(\), geolocation=\(\), payment=\(\), usb=\(\)$/m);
  assert.match(globalBlock, /^  Content-Security-Policy: default-src 'self';/m);
});

test('duplicate handwritten rule patterns are refused before Pages can replace an earlier block', (t) => {
  const source = '/posts/*\n  X-Test: first\n/posts/*\n  X-Other: second\n';
  const dist = builtSite(t, '<!doctype html><title>Duplicate rules</title>', { '_headers': source });
  for (const findings of [writeSitePolicy(dist, { env: endpoints }).findings, checkSitePolicy(dist, { env: endpoints })]) {
    assert.ok(findings.some((finding) => finding.includes('duplicate rule /posts/*')), findings.join('\n'));
  }
  assert.equal(readFileSync(join(dist, '_headers'), 'utf8'), source);
});

test('a handwritten global rule before another rule is refused rather than overwritten by generated CSP', (t) => {
  const source = '/*\n  X-Test: global\n/other/*\n  X-Other: last\n';
  const dist = builtSite(t, '<!doctype html><title>Global ordering</title>', { '_headers': source });
  const result = writeSitePolicy(dist, { env: endpoints });
  assert.ok(result.findings.some((finding) => finding.includes('duplicate rule /*')), result.findings.join('\n'));
  assert.equal(readFileSync(join(dist, '_headers'), 'utf8'), source);
});

test('regenerating a shared global block preserves the handwritten prefix and exactly one copy of every rule', (t) => {
  const dist = builtSite(t);
  const once = generate(dist);
  assert.equal(generate(dist), once);
  assert.ok(once.startsWith(`${publicHeaders.trimEnd()}\n\n`));
  assert.deepEqual(checkSitePolicy(dist, { env: endpoints }), []);
});

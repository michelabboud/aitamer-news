import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import {
  CSP_ENFORCE,
  COMMENTS_ENDPOINT_DEFAULT,
  CONTACT_ENDPOINT_DEFAULT,
  GENERATED_MARKER,
  HEADER_LINE_MAX,
  PAGEFIND_WORKER,
  SITE_ROOT,
  allows,
  checkSitePolicy,
  cspHeaderName,
  endpointOrigins,
  headersFor,
  parsePolicy,
  scanPage,
  scriptIsGoverned,
  sha256,
  urlPathOf,
  writeSitePolicy,
} from './csp-headers.mjs';
import { tempDir } from './test-support.mjs';

const PUBLIC_HEADERS = `# hand-written
/_astro/*
  Cache-Control: public, max-age=31536000, immutable
`;

const page = (head, body = '') => `<!doctype html><html><head>${head}</head><body>${body}</body></html>`;

/** A small built site: the shapes of script the real build emits, plus a Pagefind worker. */
const SITE = {
  'index.html': page(
    '<script>(function(){const analyticsId = "G-TEST"; window.x = analyticsId;})();</script><script type="application/ld+json">{"@type":"WebSite"}</script>',
    '<form action="/search/" method="get"></form><script type="module">document.body.dataset.ready = "1";</script>',
  ),
  'posts/a/index.html': page(
    '<script src="https://challenges.cloudflare.com/turnstile/v0/api.js" async defer></script>',
    '<form id="comment-form" action="https://comments.aitamer.news/" method="post"></form><script>(function(){const held = "Held";})();</script><template><script>window.fromTemplate = 1;</script></template>',
  ),
  'search/index.html': page('', '<script src="/pagefind/pagefind-ui.js"></script><script>(function(){const baseUrl = "/";})();</script>'),
  '404.html': page('', '<p>Not found</p>'),
  [PAGEFIND_WORKER]: 'self.onmessage = () => {};',
};

/** @param {Record<string, string>} files @returns {{ dist: string, publicHeaders: string }} */
function fixture(files = SITE) {
  const root = tempDir('csp-');
  const dist = join(root, 'dist');
  for (const [path, text] of Object.entries(files)) {
    mkdirSync(dirname(join(dist, path)), { recursive: true });
    writeFileSync(join(dist, path), text);
  }
  const publicHeaders = join(root, 'public-headers');
  writeFileSync(publicHeaders, PUBLIC_HEADERS);
  // The build copies public/_headers into dist before this script runs.
  writeFileSync(join(dist, '_headers'), PUBLIC_HEADERS);
  return { dist, publicHeaders };
}

const ENV = {};
const built = (files = SITE, enforce = CSP_ENFORCE) => {
  const f = fixture(files);
  const result = writeSitePolicy(f.dist, { env: ENV, enforce });
  return { ...f, result, text: () => readFileSync(join(f.dist, '_headers'), 'utf8') };
};

/** @param {string} text @param {string} path */
const scriptSrc = (text, path, enforce = CSP_ENFORCE) => parsePolicy(headersFor(text, path).get(cspHeaderName(enforce).toLowerCase()) ?? '').get('script-src') ?? [];

test('sha256 is the digest a browser computes for an inline script', () => {
  // The CSP Level 3 specification's own example.
  assert.equal(sha256("alert('Hello, world.');"), 'qznLcsROx4GACP2dm0UCKCzCG+HiZ1guq6ZZDob/Tng=');
  // What Chrome named, in its violation report, for a script injected during the 2026-09-26 browser check.
  assert.equal(sha256('window.__probe = 1;'), 'BI/knjwg2Zh64YPgXvu5e2SHXPed36Pl1UIlHSTH6bU=');
});

test('every inline script in the build is hashed into the header, and nothing else is', () => {
  const { result, text, dist, publicHeaders } = built();
  assert.deepEqual(result.findings, []);
  const sources = scriptSrc(text(), '/posts/a/');
  for (const body of [
    '(function(){const analyticsId = "G-TEST"; window.x = analyticsId;})();',
    'document.body.dataset.ready = "1";',
    '(function(){const held = "Held";})();',
    'window.fromTemplate = 1;',
    '(function(){const baseUrl = "/";})();',
  ]) {
    assert.ok(sources.includes(`'sha256-${sha256(body)}'`), `missing hash for ${body}`);
  }
  // JSON-LD is a data block: it never runs, so it gets no hash.
  assert.ok(!sources.includes(`'sha256-${sha256('{"@type":"WebSite"}')}'`));
  assert.equal(sources.filter((s) => s.startsWith("'sha256-")).length, 5);
  assert.ok(!sources.includes("'unsafe-inline'"));
  assert.deepEqual(checkSitePolicy(dist, { env: ENV, publicHeaders }), []);
});

test('the guard fails a page whose inline script is not in the policy', () => {
  const { dist, publicHeaders } = built();
  writeFileSync(join(dist, 'posts/a/index.html'), page('', '<script>window.injected = 1;</script>'));
  const findings = checkSitePolicy(dist, { env: ENV, publicHeaders });
  assert.ok(findings.some((f) => f.startsWith('posts/a/index.html: inline script sha256-') && f.includes('window.injected')), findings.join('\n'));
});

test('an inline event handler is a finding: the writer refuses, and so does the guard', () => {
  const files = { ...SITE, 'posts/b/index.html': page('', '<img src="/x.jpg" onerror="alert(1)">') };
  const f = fixture(files);
  const result = writeSitePolicy(f.dist, { env: ENV });
  assert.ok(result.findings.some((x) => x.includes('posts/b/index.html') && x.includes('onerror')), result.findings.join('\n'));
  assert.equal(readFileSync(join(f.dist, '_headers'), 'utf8'), PUBLIC_HEADERS, 'nothing was written');
  const findings = checkSitePolicy(f.dist, { env: ENV, publicHeaders: f.publicHeaders });
  assert.ok(findings.some((x) => x.includes('onerror')));
});

test('a javascript: URL and an <object> are findings', () => {
  const scan = scanPage(page('', '<a href=" JavaScript:alert(1)">x</a><object data="/x.swf"></object>'));
  assert.equal(scan.refusals.length, 2);
  assert.match(scan.refusals[0].what, /javascript: URL/);
  assert.match(scan.refusals[1].what, /object-src 'none'/);
});

test('the hand-written _headers rules survive, and a changed one fails the guard', () => {
  const { text, dist, publicHeaders } = built();
  const written = text();
  assert.ok(written.startsWith(PUBLIC_HEADERS.trimEnd()));
  assert.equal(headersFor(written, '/_astro/app.js').get('cache-control'), 'public, max-age=31536000, immutable');
  assert.ok(headersFor(written, '/_astro/app.js').has(cspHeaderName().toLowerCase()));
  writeFileSync(join(dist, '_headers'), written.replace('max-age=31536000', 'max-age=60'));
  assert.ok(checkSitePolicy(dist, { env: ENV, publicHeaders }).some((f) => f.includes('did not survive')));
});

test('running the writer twice leaves one policy block', () => {
  const { dist, text } = built();
  const once = text();
  writeSitePolicy(dist, { env: ENV });
  assert.equal(text(), once);
  assert.equal(once.split(GENERATED_MARKER).length, 2);
});

test('the report-only switch names the header, and the shipped value is report-only', () => {
  assert.equal(cspHeaderName(false), 'Content-Security-Policy-Report-Only');
  assert.equal(cspHeaderName(true), 'Content-Security-Policy');
  // Enforcing is a decision (SECURITY.md, "Content-Security-Policy"): flip CSP_ENFORCE and this line together.
  assert.equal(CSP_ENFORCE, false);
  assert.equal(cspHeaderName(), 'Content-Security-Policy-Report-Only');

  const reportOnly = built(SITE, false).text();
  assert.match(reportOnly, /^ {2}Content-Security-Policy-Report-Only: /m);
  assert.doesNotMatch(reportOnly, /^ {2}Content-Security-Policy: /m);
  // Browsers ignore upgrade-insecure-requests in a report-only policy, and log an error saying so.
  assert.doesNotMatch(reportOnly, /upgrade-insecure-requests/);

  const enforced = built(SITE, true);
  assert.match(enforced.text(), /^ {2}Content-Security-Policy: .*upgrade-insecure-requests$/m);
  assert.doesNotMatch(enforced.text(), /Report-Only/);
  // A dist written one way fails a guard that expects the other.
  assert.ok(checkSitePolicy(enforced.dist, { env: ENV, publicHeaders: enforced.publicHeaders, enforce: false }).some((f) => f.includes('the switch')));
});

test("Pagefind's worker and the search page get 'wasm-unsafe-eval', each with exactly one policy", () => {
  const written = built().text();
  const name = cspHeaderName().toLowerCase();
  for (const path of [`/${PAGEFIND_WORKER}`, '/search/']) {
    assert.ok(scriptSrc(written, path).includes("'wasm-unsafe-eval'"), path);
    assert.ok(!headersFor(written, path).get(name)?.includes(','), `${path} gets one policy`);
  }
  for (const path of ['/', '/posts/a/', '/_astro/x.js']) assert.ok(!scriptSrc(written, path).includes("'wasm-unsafe-eval'"), path);
});

test('without the detach line, the search path would get two policies, and the guard says so', () => {
  const { dist, publicHeaders, text } = built();
  const name = cspHeaderName();
  writeFileSync(join(dist, '_headers'), text().replaceAll(`  ! ${name}\n`, ''));
  const findings = checkSitePolicy(dist, { env: ENV, publicHeaders });
  assert.ok(findings.some((f) => f.startsWith('search/index.html: two')), findings.join('\n'));
});

test('a worker policy without WebAssembly fails the guard', () => {
  const { dist, publicHeaders, text } = built();
  writeFileSync(join(dist, '_headers'), text().replace(/\n\/pagefind\/\*\n.*\n.*\n/, '\n'));
  assert.ok(checkSitePolicy(dist, { env: ENV, publicHeaders }).some((f) => f.startsWith(`${PAGEFIND_WORKER}:`)));
});

test('a script, frame or form endpoint the policy does not name fails the guard', () => {
  const files = {
    ...SITE,
    'posts/c/index.html': page(
      '<script src="https://cdn.example.com/x.js"></script>',
      '<iframe src="https://player.example.com/embed"></iframe><form action="https://forms.example.com/"></form><div data-embed="https://evil.example/embed"></div>',
    ),
  };
  const { dist, publicHeaders } = built(files);
  const findings = checkSitePolicy(dist, { env: ENV, publicHeaders }).filter((f) => f.startsWith('posts/c/'));
  assert.equal(findings.filter((f) => f.includes('script-src')).length, 1);
  assert.equal(findings.filter((f) => f.includes('frame-src')).length, 2);
  assert.equal(findings.filter((f) => f.includes('form-action')).length, 1);
  assert.equal(findings.filter((f) => f.includes('connect-src')).length, 1);
});

test('a policy that outgrows the header line limit is refused, never truncated', () => {
  const files = { ...SITE };
  for (let i = 0; i < 40; i++) files[`posts/p${i}/index.html`] = page('', `<script>window.n = ${i};</script>`);
  const f = fixture(files);
  const result = writeSitePolicy(f.dist, { env: ENV });
  assert.ok(result.findings.some((x) => x.includes(`over Cloudflare's ${HEADER_LINE_MAX}`)), result.findings.join('\n'));
  assert.equal(readFileSync(join(f.dist, '_headers'), 'utf8'), PUBLIC_HEADERS);
});

test("the endpoint defaults are src/lib/site.ts's, and the same environment variables move them", () => {
  const site = readFileSync(join(SITE_ROOT, 'src/lib/site.ts'), 'utf8');
  assert.ok(site.includes(`PUBLIC_COMMENTS_ENDPOINT || '${COMMENTS_ENDPOINT_DEFAULT}'`));
  assert.ok(site.includes(`PUBLIC_CONTACT_ENDPOINT || '${CONTACT_ENDPOINT_DEFAULT}'`));
  assert.deepEqual(endpointOrigins({}), { comments: 'https://comments.aitamer.news', contact: 'https://contact.aitamer.news' });
  assert.deepEqual(endpointOrigins({ PUBLIC_COMMENTS_ENDPOINT: 'http://localhost:8792/', PUBLIC_CONTACT_ENDPOINT: 'http://localhost:8787/' }), {
    comments: 'http://localhost:8792',
    contact: 'http://localhost:8787',
  });
});

test('which scripts CSP governs follows the HTML standard', () => {
  const a = (type) => (type === undefined ? [] : [{ name: 'type', value: type }]);
  for (const type of [undefined, '', 'text/javascript', ' TEXT/JavaScript ', 'module', 'importmap', 'speculationrules']) assert.ok(scriptIsGoverned(a(type)), String(type));
  for (const type of ['application/ld+json', 'application/json', 'text/template']) assert.ok(!scriptIsGoverned(a(type)), type);
  assert.ok(scriptIsGoverned([{ name: 'language', value: 'javascript' }]));
  assert.ok(!scriptIsGoverned([{ name: 'language', value: 'vbscript' }]));
});

test("headersFor applies Cloudflare's matching: every matching rule, detach, comma-join", () => {
  const text = '/*\n  A: 1\n  B: x\n/s/*\n  ! A\n  A: 2\n/s/*\n  B: y\n/exact\n  C: 3\n';
  assert.deepEqual(Object.fromEntries(headersFor(text, '/')), { a: '1', b: 'x' });
  assert.deepEqual(Object.fromEntries(headersFor(text, '/s/')), { a: '2', b: 'x, y' });
  assert.equal(headersFor(text, '/exact').get('c'), '3');
  assert.equal(headersFor(text, '/exact/more').get('c'), undefined);
});

test('allows reads the source forms the policy uses', () => {
  assert.ok(allows(["'self'"], '/search/'));
  assert.ok(!allows([], '/search/'));
  assert.ok(allows(['https://comments.aitamer.news'], 'https://comments.aitamer.news/react'));
  assert.ok(!allows(['https://comments.aitamer.news'], 'https://comments.aitamer.news.evil.example/'));
  assert.ok(allows(['https://*.google-analytics.com'], 'https://region1.google-analytics.com/g/collect'));
  assert.ok(!allows(['https://*.google-analytics.com'], 'https://google-analytics.com.evil.example/'));
  assert.ok(allows(['https:'], 'https://anything.example/x.jpg'));
  assert.ok(!allows(['https:'], 'http://anything.example/x.jpg'));
});

test('urlPathOf maps built files to the paths Cloudflare serves them at', () => {
  assert.equal(urlPathOf('index.html'), '/');
  assert.equal(urlPathOf('search/index.html'), '/search/');
  assert.equal(urlPathOf('404.html'), '/404');
});

test('every workflow that builds the site runs the guard after the build and before any upload', () => {
  const dir = join(SITE_ROOT, '.github/workflows');
  const builders = [];
  for (const name of readdirSync(dir).filter((n) => /\.ya?ml$/.test(n))) {
    const text = readFileSync(join(dir, name), 'utf8');
    const build = text.search(/npm run build\b/);
    if (build < 0) continue;
    builders.push(name);
    const guard = text.search(/run: npm run check:csp\b/);
    const ship = text.search(/upload-pages-artifact|wrangler-action|pages deploy/);
    assert.ok(guard > build, `${name}: check:csp must run after the build`);
    if (ship >= 0) assert.ok(guard < ship, `${name}: check:csp must run before the upload`);
  }
  assert.deepEqual(builders.sort(), ['check-posts.yml', 'deploy-github-pages.yml', 'deploy-pages.yml']);
});

test('the build writes the policy after Pagefind, and check:csp is the guard', () => {
  const { scripts } = JSON.parse(readFileSync(join(SITE_ROOT, 'package.json'), 'utf8'));
  assert.match(scripts.build, /pagefind --site dist && node scripts\/csp-headers\.mjs$/);
  assert.equal(scripts['check:csp'], 'node scripts/csp-headers.mjs --check');
});

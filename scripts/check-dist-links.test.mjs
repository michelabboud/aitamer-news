import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { checkLinks, pageUrls, resolves, servedPath, sitePath, srcsetUrls } from './check-dist-links.mjs';
import { tempDir } from './test-support.mjs';

const SITE = 'https://aitamer.news';

/** A tiny built site: files at the given paths, with the given contents. */
function site(files) {
  const root = tempDir('dist-links-');
  for (const [path, body] of Object.entries(files)) {
    mkdirSync(dirname(join(root, path)), { recursive: true });
    writeFileSync(join(root, path), body);
  }
  return root;
}

test('reads every kind of URL a page loads or links to, and nothing in text', () => {
  const html = `<!doctype html><html><head>
    <link rel="stylesheet" href="/_astro/a.css"><meta property="og:image" content="https://aitamer.news/h.jpg">
    <meta name="twitter:image" content="/t.jpg"><script src="/s.js"></script></head><body>
    <a href="/posts/x/">x</a><img src="/i.jpg" srcset="/i-1.jpg 1x, /i-2.jpg 2x">
    <picture><source srcset="/p.webp"></picture><form action="/search/"></form>
    <template><a href="/in-template/">t</a></template><p>/not-a-link/</p></body></html>`;
  assert.deepEqual(pageUrls(html), [
    '/_astro/a.css', 'https://aitamer.news/h.jpg', '/t.jpg', '/s.js', '/posts/x/', '/i.jpg', '/i-1.jpg', '/i-2.jpg', '/p.webp', '/search/', '/in-template/',
  ]);
  assert.deepEqual(srcsetUrls(' /a.jpg 480w , /b.jpg 960w '), ['/a.jpg', '/b.jpg']);
});

test('only same-site locations are checked; other sites, fragments and mailto are not', () => {
  assert.equal(sitePath('/about/', '/', SITE), '/about/');
  assert.equal(sitePath('https://aitamer.news/rss.xml', '/', SITE), '/rss.xml');
  assert.equal(sitePath('../b/', '/posts/a/', SITE), '/posts/b/');
  assert.equal(sitePath('/caf%C3%A9/?q=1#top', '/', SITE), '/café/');
  for (const url of ['https://example.com/', '//cdn.example.com/x.js', '#top', 'mailto:a@b.c', 'tel:+1', 'javascript:void(0)', 'data:image/png;base64,AA']) {
    assert.equal(sitePath(url, '/', SITE), null, url);
  }
});

test('resolves paths the way Cloudflare Pages serves them', () => {
  const dist = site({ 'index.html': '', 'about/index.html': '', '404.html': '', 'rss.xml': '', 'heroes/a.jpg': '' });
  const redirects = new Set(['/section/creative/']);
  for (const ok of ['/', '/about/', '/about', '/404', '/404/', '/rss.xml', '/heroes/a.jpg', '/section/creative/']) {
    assert.equal(resolves(dist, ok, redirects), true, ok);
  }
  for (const bad of ['/nope/', '/nope', '/rss.xml/', '/heroes/b.jpg', '/section/creative', '/../etc/passwd']) {
    assert.equal(resolves(dist, bad, redirects), false, bad);
  }
});

test('a built file maps to the URL it is served at', () => {
  assert.equal(servedPath('index.html'), '/');
  assert.equal(servedPath('posts/x/index.html'), '/posts/x/');
  assert.equal(servedPath('404.html'), '/404');
});

test('a clean site passes, and every broken link is reported with the page it is on', () => {
  const clean = site({
    'index.html': '<a href="/about/">a</a><a href="https://elsewhere.example/">e</a><img src="/h.jpg">',
    'about/index.html': '<a href="../">home</a><a href="/old/">old</a>',
    'h.jpg': '',
    '_redirects': '# moved\n/old/ /about/ 301\n',
  });
  assert.deepEqual(checkLinks(clean, SITE), { pages: 2, links: 4, broken: [] });

  const broken = site({
    'index.html': '<a href="/gone/">g</a><img src="/missing.jpg"><meta property="og:image" content="https://aitamer.news/og.jpg">',
    'posts/x/index.html': '<a href="../y/">y</a>',
  });
  assert.deepEqual(checkLinks(broken, SITE).broken, [
    { page: '/', url: '/gone/' },
    { page: '/', url: '/missing.jpg' },
    { page: '/', url: 'https://aitamer.news/og.jpg' },
    { page: '/posts/x/', url: '../y/' },
  ]);
});

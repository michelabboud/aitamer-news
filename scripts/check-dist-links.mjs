#!/usr/bin/env node
/**
 * Every internal link on every built page leads somewhere real.
 *
 *   npm run check:links [dist]     after `npm run build`; exit 0 clean, 1 on a broken link, 2 on a usage error
 *
 * A broken link passes the build: Astro checks nothing it did not generate, and a hand-written
 * `/section/…/` or a renamed page leaves every link to it dangling. This reads each page the way a
 * browser does (parse5, already the CSP and rendered-body gates' parser), collects every URL an
 * element loads or links to, and resolves each same-site one against `dist` the way Cloudflare Pages
 * serves it: the file itself, `<path>/index.html` (a folder URL, with or without its trailing slash,
 * because Pages redirects `/about` to `/about/`), `<path>.html` (with or without the slash, which
 * Pages redirects the other way), or a source line in `_redirects`.
 *
 * **Not checked, on purpose:** links to other sites (their outages must not block our deploys; a
 * dead source link is a correction, not a broken deploy), and `#fragment` targets inside a page.
 */
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { join, posix, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse } from 'parse5';

/** The production origin; the same default as astro.config.mjs, overridden the same way. */
export const SITE_DEFAULT = 'https://aitamer.news';

/** Element attributes that hold one URL. */
const URL_ATTRIBUTES = new Map([
  ['a', ['href']],
  ['area', ['href']],
  ['link', ['href']],
  ['script', ['src']],
  ['img', ['src']],
  ['source', ['src']],
  ['video', ['src', 'poster']],
  ['audio', ['src']],
  ['iframe', ['src']],
  ['form', ['action']],
]);
/** Element attributes that hold a srcset: comma-separated `url [descriptor]` candidates. */
const SRCSET_ATTRIBUTES = new Map([
  ['img', ['srcset']],
  ['source', ['srcset']],
]);
/** `<meta property|name=…>` whose content is a URL crawlers and link previews fetch. */
const URL_META = new Set(['og:image', 'og:url', 'twitter:image']);
/** Schemes that are never a page or a file on this site. */
const NOT_A_LOCATION = /^(?:mailto|tel|sms|javascript|data|blob|about):/i;

/** @param {string} dir @returns {string[]} every .html file under dir, as paths relative to it with `/` */
export function htmlFiles(dir) {
  const out = [];
  const walk = (at) => {
    for (const entry of readdirSync(at, { withFileTypes: true })) {
      const full = join(at, entry.name);
      if (entry.isDirectory()) walk(full);
      else if (entry.isFile() && entry.name.endsWith('.html')) out.push(relative(dir, full).split(sep).join('/'));
    }
  };
  walk(dir);
  return out.sort();
}

/** @param {string} value @returns {string[]} the URLs in a srcset value */
export function srcsetUrls(value) {
  return value
    .split(',')
    .map((candidate) => candidate.trim().split(/\s+/)[0])
    .filter(Boolean);
}

/**
 * Every URL a page loads or links to, in document order.
 * @param {string} html @returns {string[]}
 */
export function pageUrls(html) {
  const urls = [];
  const visit = (node) => {
    const attrs = node.attrs ? new Map(node.attrs.map((a) => [a.name, a.value])) : null;
    if (attrs) {
      for (const name of URL_ATTRIBUTES.get(node.tagName) ?? []) if (attrs.has(name)) urls.push(attrs.get(name));
      for (const name of SRCSET_ATTRIBUTES.get(node.tagName) ?? []) if (attrs.has(name)) urls.push(...srcsetUrls(attrs.get(name)));
      if (node.tagName === 'meta' && URL_META.has(attrs.get('property') ?? attrs.get('name') ?? '') && attrs.has('content')) {
        urls.push(attrs.get('content'));
      }
    }
    for (const child of node.childNodes ?? []) visit(child);
    if (node.content) visit(node.content); // <template>
  };
  visit(parse(html));
  return urls.map((u) => u.trim()).filter(Boolean);
}

/**
 * The site path a URL points at, or null when it is not a location on this site (another origin,
 * a fragment of the same page, mailto: and the like).
 * @param {string} url  as written in the page
 * @param {string} pagePath  the page's own URL path, e.g. `/posts/x/`, for relative URLs
 * @param {string} site  this site's origin
 * @returns {string | null}
 */
export function sitePath(url, pagePath, site) {
  if (url.startsWith('#') || NOT_A_LOCATION.test(url)) return null;
  let resolved;
  try {
    resolved = new URL(url, new URL(pagePath, site));
  } catch {
    return url; // unparseable: report it as written, a browser cannot follow it either
  }
  if (resolved.origin !== new URL(site).origin) return null;
  try {
    return decodeURIComponent(resolved.pathname);
  } catch {
    return resolved.pathname;
  }
}

/** @param {string} dist @returns {Set<string>} the source paths of `_redirects` */
export function redirectSources(dist) {
  const file = join(dist, '_redirects');
  if (!existsSync(file)) return new Set();
  return new Set(
    readFileSync(file, 'utf8')
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line && !line.startsWith('#'))
      .map((line) => line.split(/\s+/)[0]),
  );
}

/**
 * Whether Cloudflare Pages would serve something at `path` from `dist`.
 * @param {string} dist @param {string} path @param {Set<string>} redirects
 */
export function resolves(dist, path, redirects) {
  if (redirects.has(path)) return true;
  const target = join(dist, ...posix.normalize(path).split('/').filter(Boolean));
  if (!target.startsWith(join(dist))) return false;
  const isFile = (p) => existsSync(p) && statSync(p).isFile();
  if (!path.endsWith('/') && isFile(target)) return true;
  if (isFile(join(target, 'index.html'))) return true;
  // `/about` serves about.html, and `/about/` redirects there (measured on aitamer.news: /404/ → 308 → /404).
  if (isFile(`${target}.html`)) return true;
  return false;
}

/** The URL path a built page is served at: `posts/x/index.html` → `/posts/x/`, `404.html` → `/404`. */
export function servedPath(file) {
  if (file === 'index.html') return '/';
  if (file.endsWith('/index.html')) return `/${file.slice(0, -'index.html'.length)}`;
  return `/${file.slice(0, -'.html'.length)}`;
}

/**
 * @param {string} dist @param {string} site
 * @returns {{ pages: number, links: number, broken: { page: string, url: string }[] }}
 */
export function checkLinks(dist, site = SITE_DEFAULT) {
  const redirects = redirectSources(dist);
  const broken = [];
  let links = 0;
  const files = htmlFiles(dist);
  for (const file of files) {
    const page = servedPath(file);
    for (const url of pageUrls(readFileSync(join(dist, file), 'utf8'))) {
      const path = sitePath(url, page, site);
      if (path === null) continue;
      links += 1;
      if (!resolves(dist, path, redirects)) broken.push({ page, url });
    }
  }
  return { pages: files.length, links, broken };
}

function main(args) {
  const dist = args[0] ?? 'dist';
  if (!existsSync(join(dist, 'index.html'))) {
    console.error(`check:links: ${dist}/index.html not found; run \`npm run build\` first`);
    return 2;
  }
  const { pages, links, broken } = checkLinks(dist, process.env.ASTRO_SITE ?? SITE_DEFAULT);
  if (broken.length > 0) {
    for (const { page, url } of broken) console.error(`check:links: ${page} links to ${url}, which the site does not serve`);
    console.error(`check:links: ${broken.length} broken internal link(s) across ${pages} pages`);
    return 1;
  }
  console.log(`check:links: ${links} internal links on ${pages} pages, all served`);
  return 0;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  process.exitCode = main(process.argv.slice(2));
}

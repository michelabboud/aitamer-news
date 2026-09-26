#!/usr/bin/env node
/**
 * The site's Content-Security-Policy, written into `dist/_headers` after the build (SECURITY.md,
 * "Content-Security-Policy").
 *
 *   node scripts/csp-headers.mjs [dist]           after `astro build` and Pagefind: hash every inline
 *                                                 script on every built page and append the policy
 *                                                 to dist/_headers (part of `npm run build`)
 *   node scripts/csp-headers.mjs --check [dist]   the deploy guard (`npm run check:csp`): every inline
 *                                                 script on every page is in the policy, nothing on a
 *                                                 page needs what the policy refuses, and dist/_headers
 *                                                 is exactly public/_headers plus this policy
 *
 * Exit 0 when nothing was found, 1 on any finding, 2 on a usage error.
 *
 * **Why hashes.** The layout and a few components put small scripts inline (the analytics
 * bootstrap, the station clock, the Cmd/Ctrl+K and external-link helpers, the comment form's and
 * the search page's `define:vars`, Astro's inlined hoisted scripts). `'unsafe-inline'` would allow
 * them and every injected script with them, which is exactly what a CSP is for refusing. Their
 * bodies are fixed by the build, so each gets a `'sha256-…'` source: a script the build did not
 * write does not match. The hashes change whenever a script's text does, so they are computed here,
 * from the built HTML, never written by hand.
 *
 * **One policy for the site, one for Pagefind.** Pagefind compiles WebAssembly, which needs
 * `'wasm-unsafe-eval'`. It does so in a Web Worker, `/pagefind/pagefind-worker.js`, and a worker
 * loaded from a URL is governed by the policy on **its own response**, not the page's: a rule on
 * `/search/*` alone leaves the worker without it and search broken once the policy is enforced
 * (measured in a browser, 2026-09-26). So `/pagefind/*` gets the WebAssembly policy, and so does
 * `/search/*`, for Pagefind's fallback to the main thread when the worker cannot start.
 * Cloudflare Pages applies every `_headers` rule whose path matches and joins two values of one
 * header with a comma, which a browser reads as two policies that must both pass; each of those
 * rules therefore detaches the site-wide header (`! <name>`) before attaching its own. Every policy
 * lists every hash on the site, so a page served under one of those paths that is not the search
 * page (the 404 page, for one) still passes.
 *
 * **The parse.** parse5 (a WHATWG-conformant parser, already the rendered-body gate's) reads each
 * page the way a browser does, so the text hashed here is the text the browser hashes. Which
 * `<script>` elements run follows the HTML standard's rules for the `type` attribute: classic and
 * module scripts, import maps and speculation rules are hashed; data blocks (JSON-LD) never run and
 * are not.
 */
import { createHash } from 'node:crypto';
import { existsSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { join, relative, sep } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { parse } from 'parse5';

/**
 * The switch. False: the policy ships as `Content-Security-Policy-Report-Only`, which a browser
 * reports against (in its console, since there is no collector yet) and never enforces. Enforcing
 * is flipping this to true; `scripts/csp-headers.test.mjs` pins the value, so the flip is a
 * reviewed two-line change.
 */
export const CSP_ENFORCE = false;

/** @param {boolean} [enforce] @returns {string} the response header that carries the policy */
export function cspHeaderName(enforce = CSP_ENFORCE) {
  return enforce ? 'Content-Security-Policy' : 'Content-Security-Policy-Report-Only';
}

export const SITE_ROOT = fileURLToPath(new URL('..', import.meta.url));
export const DIST_DIR = 'dist';
/** The hand-written rules the build copies into dist/_headers; they must survive unchanged. */
export const PUBLIC_HEADERS = join(SITE_ROOT, 'public', '_headers');

/** Every path on the site. */
export const SITE_RULE = '/*';
/**
 * Where Pagefind compiles WebAssembly: its worker (`/pagefind/pagefind-worker.js`, the path that
 * matters) and the search page (its fallback when the worker cannot start).
 */
export const WASM_RULES = ['/search/*', '/pagefind/*'];
/** The worker script whose response must carry `'wasm-unsafe-eval'`, when the build has one. */
export const PAGEFIND_WORKER = 'pagefind/pagefind-worker.js';

/**
 * Cloudflare Pages ignores a `_headers` line longer than this, counting the indent, the name and
 * the value (https://developers.cloudflare.com/pages/configuration/headers/). A policy that would
 * outgrow it fails the build: the fix is fewer inline scripts, never a truncated policy.
 */
export const HEADER_LINE_MAX = 2000;

/** Opens the block this script appends; everything before it is public/_headers, verbatim. */
export const GENERATED_MARKER = '# --- Content-Security-Policy: written by scripts/csp-headers.mjs after the build. Do not edit dist/_headers by hand. ---';

/**
 * The comments and contact Workers. The same environment variables and defaults as
 * `src/lib/site.ts` (COMMENTS_ENDPOINT, CONTACT_ENDPOINT), read the way the build reads them
 * (`loadBuildEnv`), so the policy names the endpoints the build actually wrote into the forms; the
 * guard checks the built forms against it either way.
 */
export const COMMENTS_ENDPOINT_DEFAULT = 'https://comments.aitamer.news/';
export const CONTACT_ENDPOINT_DEFAULT = 'https://contact.aitamer.news/';

/**
 * The build's environment as Astro sees it: Astro loads it with Vite's `loadEnv` for the
 * `production` mode from `vite.envDir`, else the project root (`astro/dist/env/env-loader.js`), so
 * `.env`, `.env.local`, `.env.production` and `.env.production.local` count, and a variable already
 * in the process's environment wins. Vite is loaded from where Astro resolves it, so this is the
 * same `loadEnv` the build ran. Only `PUBLIC_` names are returned.
 * @param {string} [root] the directory holding the .env files
 * @returns {Promise<Record<string, string>>}
 */
export async function loadBuildEnv(root = SITE_ROOT) {
  const astroRequire = createRequire(join(SITE_ROOT, 'node_modules', 'astro', 'package.json'));
  const { loadEnv } = await import(pathToFileURL(astroRequire.resolve('vite')).href);
  return loadEnv('production', root, 'PUBLIC_');
}

/** @param {NodeJS.ProcessEnv} [env] @returns {{ comments: string, contact: string }} the Workers' origins */
export function endpointOrigins(env = process.env) {
  return {
    comments: new URL(env.PUBLIC_COMMENTS_ENDPOINT || COMMENTS_ENDPOINT_DEFAULT).origin,
    contact: new URL(env.PUBLIC_CONTACT_ENDPOINT || CONTACT_ENDPOINT_DEFAULT).origin,
  };
}

/**
 * Third-party origins, each with where the site uses it. Nothing else outside the site is loaded
 * as a script, a frame, a stylesheet or a font.
 */
export const ORIGINS = {
  /** Cloudflare Turnstile: `api.js` on the About page's contact form and every comment form; the widget is its iframe. */
  turnstile: 'https://challenges.cloudflare.com',
  /** Google Analytics: the layout's bootstrap injects gtag.js from here (on aitamer.news only). */
  gtag: 'https://www.googletagmanager.com',
  /**
   * Where gtag.js sends measurements, besides its own host (`gtag` above): Google's GA4 guidance
   * for the Google tag, https://developers.google.com/tag-platform/security/guides/csp (read
   * 2026-09-26), lists `*.google-analytics.com` and `*.google.com` for connect-src. The site does not
   * use the Ads features, which need more hosts.
   */
  analyticsConnect: ['https://*.google-analytics.com', 'https://*.google.com'],
  /** Google Fonts: the layout's stylesheet link, and the font files it points at. */
  fontsCss: 'https://fonts.googleapis.com',
  fontsFiles: 'https://fonts.gstatic.com',
  /** VideoEmbed's click-to-load player. */
  youtubeNoCookie: 'https://www.youtube-nocookie.com',
  /** Only the one grandfathered post that embeds raw YouTube iframes (made-on-youtube-2026-gemini-ask-studio). */
  youtube: 'https://www.youtube.com',
};

/**
 * @param {{ hashes: Iterable<string>, endpoints: { comments: string, contact: string }, wasm?: boolean, enforce?: boolean }} input
 *   `hashes` are base64 SHA-256 digests; `wasm` adds `'wasm-unsafe-eval'` for Pagefind
 * @returns {[string, string[]][]} the policy's directives, in order
 */
export function directives({ hashes, endpoints, wasm = false, enforce = CSP_ENFORCE }) {
  const hashSources = [...new Set(hashes)].sort().map((hash) => `'sha256-${hash}'`);
  return [
    ['default-src', ["'self'"]],
    ['script-src', ["'self'", ...(wasm ? ["'wasm-unsafe-eval'"] : []), ...hashSources, ORIGINS.turnstile, ORIGINS.gtag]],
    // Inline style attributes (Shiki's code blocks, table alignment, Astro's scoped styles) carry
    // no script; the rendered-body gate constrains their values in bot posts.
    ['style-src', ["'self'", "'unsafe-inline'", ORIGINS.fontsCss]],
    ['font-src', ["'self'", ORIGINS.fontsFiles]],
    // Human posts may use an image from any https host (and gtag's pixel is one).
    ['img-src', ["'self'", 'data:', 'https:']],
    ['connect-src', ["'self'", endpoints.comments, endpoints.contact, ORIGINS.gtag, ...ORIGINS.analyticsConnect]],
    ['frame-src', [ORIGINS.turnstile, ORIGINS.youtubeNoCookie, ORIGINS.youtube]],
    ['form-action', ["'self'", endpoints.comments, endpoints.contact]],
    ['object-src', ["'none'"]],
    ['base-uri', ["'none'"]],
    ['frame-ancestors', ["'none'"]],
    // Browsers ignore this in a report-only policy and log an error on every page saying so, so it
    // arrives with enforcement.
    ...(enforce ? [/** @type {[string, string[]]} */ (['upgrade-insecure-requests', []])] : []),
  ];
}

/** @param {[string, string[]][]} list @returns {string} the header value */
export function policyText(list) {
  return list.map(([name, sources]) => [name, ...sources].join(' ')).join('; ');
}

// ---- Reading a page -------------------------------------------------------------------------

/** The HTML standard's JavaScript MIME type essences: a `<script>` with one of these runs as a classic script. */
const JAVASCRIPT_MIME_TYPES = new Set([
  'application/ecmascript', 'application/javascript', 'application/x-ecmascript', 'application/x-javascript',
  'text/ecmascript', 'text/javascript', 'text/javascript1.0', 'text/javascript1.1', 'text/javascript1.2',
  'text/javascript1.3', 'text/javascript1.4', 'text/javascript1.5', 'text/jscript', 'text/livescript',
  'text/x-ecmascript', 'text/x-javascript',
]);
/** Script types that are not JavaScript but that CSP's `script-src` still governs inline. */
const OTHER_GOVERNED_TYPES = new Set(['module', 'importmap', 'speculationrules']);

/** @param {{ name: string, value: string }[]} attrs @param {string} name */
function attr(attrs, name) {
  return attrs.find((a) => a.name === name)?.value;
}

/**
 * Whether the browser runs (or CSP governs) a `<script>` with these attributes, per the HTML
 * standard's "prepare the script element": a data block (JSON-LD, say) never runs.
 * @param {{ name: string, value: string }[]} attrs
 */
export function scriptIsGoverned(attrs) {
  let type = attr(attrs, 'type');
  if (type === undefined) {
    const language = attr(attrs, 'language');
    if (language === undefined || language === '') return true;
    type = `text/${language}`;
  }
  // The part before any MIME parameter: the standard says `text/javascript; charset=utf-8` is not
  // a JavaScript MIME type and never runs, but browsers have run such scripts, and a hash too many
  // costs nothing.
  const essence = type.split(';')[0].trim().toLowerCase();
  return essence === '' || JAVASCRIPT_MIME_TYPES.has(essence) || OTHER_GOVERNED_TYPES.has(essence);
}

/** @param {string} text @returns {string} its base64 SHA-256, as CSP writes it */
export function sha256(text) {
  return createHash('sha256').update(text, 'utf8').digest('base64');
}

const SVG_NAMESPACE = 'http://www.w3.org/2000/svg';

/**
 * The URLs in a `srcset`, by the HTML standard's candidate parsing: a URL is a run of non-space
 * characters (trailing commas end the candidate), then descriptors up to a comma outside brackets.
 * @param {string} value @returns {string[]}
 */
export function srcsetUrls(value) {
  const urls = [];
  let i = 0;
  while (i < value.length) {
    while (i < value.length && /[\s,]/.test(value[i])) i++;
    if (i >= value.length) break;
    let url = '';
    while (i < value.length && !/\s/.test(value[i])) url += value[i++];
    if (/,$/.test(url)) {
      urls.push(url.replace(/,+$/, ''));
      continue;
    }
    urls.push(url);
    let depth = 0;
    while (i < value.length && !(value[i] === ',' && depth === 0)) {
      if (value[i] === '(') depth++;
      else if (value[i] === ')') depth = Math.max(0, depth - 1);
      i++;
    }
  }
  return urls.filter(Boolean);
}

/** What a `<link rel=preload>` fetches, by its `as`, to the directive that governs it. */
const PRELOAD_AS = {
  script: 'script-src', style: 'style-src', font: 'font-src', image: 'img-src', fetch: 'connect-src',
  audio: 'media-src', video: 'media-src', track: 'media-src', worker: 'worker-src',
};

/**
 * Where an element loads something from, by the directive that governs it. Only what the static
 * HTML names: the site's own scripts load a few more at run time, which `RUNTIME_ATTRIBUTES` covers.
 * @param {any} node @returns {{ directive: string, url: string, where: string }[]}
 */
function loadsOf(node) {
  const tag = node.tagName;
  const attrs = node.attrs ?? [];
  const get = (name) => attr(attrs, name);
  const out = [];
  const add = (directive, url, where) => {
    if (url !== undefined) out.push({ directive, url, where: `<${tag} ${where}>` });
  };
  const parentTag = node.parentNode?.tagName;
  switch (tag) {
    case 'script':
      // An HTML script with src, and an SVG script with href or xlink:href, is external.
      if (node.namespaceURI === SVG_NAMESPACE) add('script-src', get('href'), 'href');
      else add('script-src', get('src'), 'src');
      break;
    case 'iframe':
    case 'frame':
      add('frame-src', get('src'), 'src');
      break;
    case 'form':
      add('form-action', get('action'), 'action');
      if (get('action') !== undefined) out.push({ directive: 'connect-src', url: get('action'), where: '<form action> (the form script fetches it)' });
      break;
    case 'button':
      add('form-action', get('formaction'), 'formaction');
      break;
    case 'input':
      add('form-action', get('formaction'), 'formaction');
      if (get('type')?.toLowerCase() === 'image') add('img-src', get('src'), 'src');
      break;
    case 'img':
      add('img-src', get('src'), 'src');
      for (const url of srcsetUrls(get('srcset') ?? '')) add('img-src', url, 'srcset');
      break;
    case 'video':
      add('img-src', get('poster'), 'poster');
      add('media-src', get('src'), 'src');
      break;
    case 'audio':
    case 'track':
      add('media-src', get('src'), 'src');
      break;
    case 'source':
      if (parentTag === 'picture') for (const url of srcsetUrls(get('srcset') ?? '')) add('img-src', url, 'srcset');
      else add('media-src', get('src'), 'src');
      break;
    case 'link': {
      const rel = (get('rel') ?? '').toLowerCase().split(/\s+/).filter(Boolean);
      const href = get('href');
      if (rel.includes('stylesheet')) add('style-src', href, 'rel=stylesheet href');
      if (rel.includes('modulepreload')) add('script-src', href, 'rel=modulepreload href');
      if (rel.includes('preload')) {
        const as = (get('as') ?? '').toLowerCase();
        add(PRELOAD_AS[/** @type {keyof typeof PRELOAD_AS} */ (as)] ?? 'default-src', href, `rel=preload as=${as || '(none)'} href`);
      }
      if (rel.includes('icon') || rel.includes('apple-touch-icon')) add('img-src', href, 'rel=icon href');
      if (rel.includes('manifest')) add('manifest-src', href, 'rel=manifest href');
      break;
    }
  }
  return out;
}

/**
 * Data attributes the site's own scripts load from: Reactions posts to `data-endpoint`, and
 * VideoEmbed turns `data-embed` into an iframe when the reader presses play. The comment and
 * contact forms `fetch` their `action`, so a form's action must be allowed by `connect-src` too.
 */
const RUNTIME_ATTRIBUTES = [
  { attribute: 'data-endpoint', directive: 'connect-src' },
  { attribute: 'data-embed', directive: 'frame-src' },
];
/** Elements the policy refuses outright (`object-src 'none'`, `base-uri 'none'`). */
const REFUSED_ELEMENTS = { object: "object-src 'none'", embed: "object-src 'none'", base: "base-uri 'none'" };
/**
 * Attributes refused outright. A `srcdoc` document inherits the page's policy, so a script or a
 * handler inside it would be refused by the browser without this guard seeing it; the site uses none.
 */
const REFUSED_ATTRIBUTES = { srcdoc: "a srcdoc document inherits the page's policy, and this guard does not look inside it" };
/** Attributes whose `javascript:` URL would need `'unsafe-inline'`. */
const URL_ATTRIBUTES = new Set(['href', 'src', 'action', 'formaction', 'xlink:href']);

/**
 * @typedef {{ hash: string, preview: string }} InlineScript
 * @typedef {{ directive: string, url: string, where: string }} Load
 * @typedef {{ what: string }} Refusal something on the page the policy can never allow
 * @typedef {{ inline: InlineScript[], loads: Load[], refusals: Refusal[] }} PageScan
 */

/** @param {string} html @returns {PageScan} */
export function scanPage(html) {
  /** @type {PageScan} */
  const scan = { inline: [], loads: [], refusals: [] };
  /** @param {any} node */
  const visit = (node) => {
    const tag = node.tagName;
    const attrs = node.attrs ?? [];
    for (const { name, value } of attrs) {
      if (/^on[a-z]+$/i.test(name)) {
        scan.refusals.push({ what: `inline event handler ${name}="${value.slice(0, 60)}" on <${tag}> (needs 'unsafe-inline'; use addEventListener in a script)` });
      }
      if (URL_ATTRIBUTES.has(name) && /^javascript:/i.test(value.replace(/[\u0000- ]/g, ''))) {
        scan.refusals.push({ what: `javascript: URL in ${name} on <${tag}> (needs 'unsafe-inline')` });
      }
      if (name in REFUSED_ATTRIBUTES) {
        scan.refusals.push({ what: `${name} on <${tag}> (${REFUSED_ATTRIBUTES[/** @type {keyof typeof REFUSED_ATTRIBUTES} */ (name)]})` });
      }
      for (const runtime of RUNTIME_ATTRIBUTES) {
        if (name === runtime.attribute && value) scan.loads.push({ directive: runtime.directive, url: value, where: `<${tag} ${name}>` });
      }
    }
    if (tag in REFUSED_ELEMENTS) scan.refusals.push({ what: `<${tag}> element (the policy has ${REFUSED_ELEMENTS[/** @type {keyof typeof REFUSED_ELEMENTS} */ (tag)]})` });
    const loads = loadsOf(node);
    scan.loads.push(...loads);
    const external = tag === 'script' && loads.some((load) => load.directive === 'script-src');
    if (tag === 'script' && !external && scriptIsGoverned(attrs)) {
      const body = (node.childNodes ?? []).map((/** @type {any} */ child) => child.value ?? '').join('');
      scan.inline.push({ hash: sha256(body), preview: body.trim().slice(0, 60).replace(/\s+/g, ' ') });
    }
    for (const child of node.childNodes ?? []) visit(child);
    if (node.content) visit(node.content);
  };
  visit(parse(html));
  return scan;
}

/** The origin a relative URL resolves to; only for telling the site's own URLs from others. */
const SELF = 'https://self.invalid';

/**
 * Whether a source list allows loading `url` from a page on the site. Handles what the site's
 * policy uses: `'self'`, exact origins, `https://*.host` and the `https:` / `data:` schemes.
 * @param {string[]} sources @param {string} url
 */
export function allows(sources, url) {
  let target;
  try {
    target = new URL(url, `${SELF}/page/`);
  } catch {
    return false;
  }
  if (target.origin === SELF) return sources.includes("'self'");
  return sources.some((source) => {
    if (/^[a-z][a-z0-9+.-]*:$/i.test(source)) return target.protocol === source.toLowerCase();
    const wild = /^(https?):\/\/\*\.(.+)$/.exec(source);
    if (wild) return target.protocol === `${wild[1]}:` && target.hostname.endsWith(`.${wild[2]}`);
    return target.origin === source;
  });
}

// ---- The site ------------------------------------------------------------------------------

/** @param {string} dir @returns {string[]} every .html file under dir */
export function htmlFiles(dir) {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) return htmlFiles(path);
    return name.endsWith('.html') ? [path] : [];
  });
}

/**
 * @param {string} dist
 * @returns {{ page: string, scan: PageScan }[]} every built page, path relative to dist with `/` separators
 */
export function scanSite(dist) {
  return htmlFiles(dist)
    .sort()
    .map((file) => ({ page: relative(dist, file).split(sep).join('/'), scan: scanPage(readFileSync(file, 'utf8')) }));
}

/**
 * @param {{ page: string, scan: PageScan }[]} pages
 * @param {{ comments: string, contact: string }} endpoints
 * @param {boolean} [enforce]
 * @returns {string} the block appended to _headers
 */
export function generatedBlock(pages, endpoints, enforce = CSP_ENFORCE) {
  const hashes = pages.flatMap(({ scan }) => scan.inline.map((s) => s.hash));
  const name = cspHeaderName(enforce);
  const site = policyText(directives({ hashes, endpoints, enforce }));
  const wasm = policyText(directives({ hashes, endpoints, wasm: true, enforce }));
  return [
    GENERATED_MARKER,
    SITE_RULE,
    `  ${name}: ${site}`,
    // Cloudflare joins two values of one header with a comma (two policies, both enforced), so
    // each WebAssembly rule removes the site-wide one before adding its own.
    ...WASM_RULES.flatMap((rule) => [rule, `  ! ${name}`, `  ${name}: ${wasm}`]),
    '',
  ].join('\n');
}

/**
 * @param {string} existing the hand-written _headers (public/_headers), kept verbatim
 * @param {string} block from `generatedBlock`
 * @returns {string} the whole dist/_headers
 */
export function renderHeaders(existing, block) {
  const kept = existing.includes(GENERATED_MARKER) ? existing.slice(0, existing.indexOf(GENERATED_MARKER)) : existing;
  const head = kept.replace(/\s+$/, '');
  return head ? `${head}\n\n${block}` : block;
}

/** @param {string} text @returns {string[]} lines longer than Cloudflare reads */
export function overlongLines(text) {
  return text.split('\n').filter((line) => line.length > HEADER_LINE_MAX);
}

/**
 * The headers attached to `path` by the rules in `text`, in Cloudflare's way: every matching
 * rule in order, `! name` detaching what earlier rules attached, a repeated name joined by a comma.
 * Only the path forms this site uses: an exact path, or a prefix ending in `*`.
 * @param {string} text @param {string} path
 * @returns {Map<string, string>} lower-cased header name → value
 */
export function headersFor(text, path) {
  const out = new Map();
  let matching = false;
  for (const raw of text.split('\n')) {
    if (!raw.trim() || raw.trimStart().startsWith('#')) continue;
    if (!/^\s/.test(raw)) {
      const rule = raw.trim();
      matching = rule.endsWith('*') ? path.startsWith(rule.slice(0, -1)) : path === rule;
      continue;
    }
    if (!matching) continue;
    const line = raw.trim();
    if (line.startsWith('! ')) {
      out.delete(line.slice(2).trim().toLowerCase());
      continue;
    }
    const colon = line.indexOf(':');
    const key = line.slice(0, colon).trim().toLowerCase();
    const value = line.slice(colon + 1).trim();
    out.set(key, out.has(key) ? `${out.get(key)}, ${value}` : value);
  }
  return out;
}

/** CSP's fallback chains for the directives this guard checks; `default-src` ends every chain. */
const FALLBACKS = {
  'worker-src': ['child-src', 'script-src'],
  'frame-src': ['child-src'],
};

/** @param {Map<string, string[]>} policy @param {string} directive @returns {string[]} the sources that govern it */
export function sourcesFor(policy, directive) {
  for (const name of [directive, ...(FALLBACKS[/** @type {keyof typeof FALLBACKS} */ (directive)] ?? []), 'default-src']) {
    const sources = policy.get(name);
    if (sources) return sources;
  }
  return [];
}

/**
 * The `_headers` rule forms this script models: a path from the root with no placeholder, and at
 * most one `*`, at its end. Cloudflare also accepts `:placeholders`, a `*` mid-path and absolute
 * URLs; `headersFor` would misjudge those, so they are refused instead.
 */
const MODELED_RULE = /^\/[^*:\s]*\*?$/;

/** @param {string} text a _headers file @returns {string[]} its rule lines this script does not model */
export function unmodeledRules(text) {
  return text
    .split('\n')
    .filter((raw) => raw.trim() && !raw.trimStart().startsWith('#') && !/^\s/.test(raw))
    .map((raw) => raw.trim())
    .filter((rule) => !MODELED_RULE.test(rule));
}

/** @param {string} rule @returns {string} */
const unmodeledFinding = (rule) => `_headers: the rule ${rule} is a form this script does not model (only /exact/paths and /prefix/*); rewrite it, or teach headersFor the form and test it`;

/** @param {string} value @returns {Map<string, string[]>} directive → sources */
export function parsePolicy(value) {
  return new Map(
    value
      .split(';')
      .map((part) => part.trim().split(/\s+/))
      .filter((tokens) => tokens[0])
      .map(([name, ...sources]) => [name.toLowerCase(), sources]),
  );
}

/** @param {string} page dist-relative file @returns {string} the URL path it is served at */
export function urlPathOf(page) {
  if (page === 'index.html') return '/';
  if (page.endsWith('/index.html')) return `/${page.slice(0, -'index.html'.length)}`;
  return `/${page.replace(/\.html$/, '')}`;
}

/**
 * Write the policy into `<dist>/_headers`.
 * @param {string} dist
 * @param {{ env?: NodeJS.ProcessEnv, enforce?: boolean }} [options]
 * @returns {{ findings: string[], pages: number, hashes: number }}
 */
export function writeSitePolicy(dist, { env = process.env, enforce = CSP_ENFORCE } = {}) {
  const pages = scanSite(dist);
  const findings = pages.flatMap(({ page, scan }) => scan.refusals.map((r) => `${page}: ${r.what}`));
  const hashes = new Set(pages.flatMap(({ scan }) => scan.inline.map((s) => s.hash))).size;
  if (findings.length) return { findings, pages: pages.length, hashes };
  const target = join(dist, '_headers');
  const existing = existsSync(target) ? readFileSync(target, 'utf8') : '';
  const unmodeled = unmodeledRules(existing);
  if (unmodeled.length) return { findings: unmodeled.map(unmodeledFinding), pages: pages.length, hashes };
  const text = renderHeaders(existing, generatedBlock(pages, endpointOrigins(env), enforce));
  const long = overlongLines(text);
  if (long.length) {
    return {
      findings: long.map((line) => `_headers: a line is ${line.length} characters, over Cloudflare's ${HEADER_LINE_MAX} (${line.trim().slice(0, 40)}…); move inline scripts into bundled files`),
      pages: pages.length,
      hashes,
    };
  }
  writeFileSync(target, text);
  return { findings, pages: pages.length, hashes };
}

/**
 * The deploy guard.
 * @param {string} dist
 * @param {{ env?: NodeJS.ProcessEnv, enforce?: boolean, publicHeaders?: string }} [options]
 * @returns {string[]} findings; empty when the build and its _headers agree
 */
export function checkSitePolicy(dist, { env = process.env, enforce = CSP_ENFORCE, publicHeaders = PUBLIC_HEADERS } = {}) {
  const findings = [];
  const target = join(dist, '_headers');
  if (!existsSync(target)) return [`${target} is missing; run the build (npm run build)`];
  const text = readFileSync(target, 'utf8');
  const name = cspHeaderName(enforce).toLowerCase();
  const other = cspHeaderName(!enforce).toLowerCase();
  const pages = scanSite(dist);
  const unmodeled = unmodeledRules(text);
  if (unmodeled.length) return unmodeled.map(unmodeledFinding);

  for (const { page, scan } of pages) {
    for (const refusal of scan.refusals) findings.push(`${page}: ${refusal.what}`);
    const headers = headersFor(text, urlPathOf(page));
    if (headers.has(other)) findings.push(`${page}: served with ${cspHeaderName(!enforce)}, but the switch (CSP_ENFORCE = ${enforce}) says ${cspHeaderName(enforce)}`);
    const value = headers.get(name);
    if (!value) {
      findings.push(`${page}: served with no ${cspHeaderName(enforce)} header`);
      continue;
    }
    if (value.includes(',')) findings.push(`${page}: two ${cspHeaderName(enforce)} values reach it (Cloudflare joins them with a comma, and both would apply)`);
    const policy = parsePolicy(value);
    const scriptSources = sourcesFor(policy, 'script-src');
    for (const script of scan.inline) {
      if (!scriptSources.includes(`'sha256-${script.hash}'`)) {
        findings.push(`${page}: inline script sha256-${script.hash} is not in the policy (${script.preview}…)`);
      }
    }
    for (const load of scan.loads) {
      const sources = sourcesFor(policy, load.directive);
      if (!allows(sources, load.url)) findings.push(`${page}: ${load.where} loads ${load.url}, which ${load.directive} does not allow`);
    }
  }

  if (existsSync(join(dist, PAGEFIND_WORKER))) {
    const worker = headersFor(text, `/${PAGEFIND_WORKER}`).get(name);
    const scriptSources = worker ? (parsePolicy(worker).get('script-src') ?? []) : [];
    if (!scriptSources.includes("'wasm-unsafe-eval'")) {
      findings.push(`${PAGEFIND_WORKER}: its policy does not allow 'wasm-unsafe-eval', so search breaks once the policy is enforced`);
    }
  }

  const expected = renderHeaders(existsSync(publicHeaders) ? readFileSync(publicHeaders, 'utf8') : '', generatedBlock(pages, endpointOrigins(env), enforce));
  if (text !== expected) {
    const kept = existsSync(publicHeaders) ? readFileSync(publicHeaders, 'utf8').replace(/\s+$/, '') : '';
    if (kept && !text.startsWith(kept)) findings.push('_headers: the rules in public/_headers did not survive into dist/_headers unchanged');
    else findings.push('_headers: the policy is not the one this build calls for (stale, hand-edited, or written with other endpoints); rebuild with `npm run build`');
  }
  for (const line of overlongLines(text)) findings.push(`_headers: a line is ${line.length} characters, over Cloudflare's ${HEADER_LINE_MAX}`);
  return findings;
}

async function main(argv) {
  const check = argv.includes('--check');
  const rest = argv.filter((a) => a !== '--check');
  if (rest.length > 1 || rest.some((a) => a.startsWith('-'))) {
    console.error('usage: node scripts/csp-headers.mjs [--check] [dist]');
    return 2;
  }
  const dist = rest[0] ?? DIST_DIR;
  if (!existsSync(dist)) {
    console.error(`csp: ${dist} does not exist; run the build first`);
    return 2;
  }
  if (check) {
    const findings = checkSitePolicy(dist, { env: await loadBuildEnv() });
    for (const finding of findings) console.error(`csp: ${finding}`);
    if (findings.length) {
      console.error(`csp: ${findings.length} finding(s); SECURITY.md, "Content-Security-Policy"`);
      return 1;
    }
    console.log(`check:csp: every inline script on ${scanSite(dist).length} pages is in the ${cspHeaderName()} policy, and nothing on them needs more.`);
    return 0;
  }
  const { findings, pages, hashes } = writeSitePolicy(dist, { env: await loadBuildEnv() });
  for (const finding of findings) console.error(`csp: ${finding}`);
  if (findings.length) {
    console.error(`csp: ${findings.length} finding(s); ${join(dist, '_headers')} was not written. SECURITY.md, "Content-Security-Policy"`);
    return 1;
  }
  console.log(`csp: wrote ${cspHeaderName()} to ${join(dist, '_headers')}: ${hashes} inline script hash(es) from ${pages} pages.`);
  return 0;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  process.exitCode = await main(process.argv.slice(2));
}

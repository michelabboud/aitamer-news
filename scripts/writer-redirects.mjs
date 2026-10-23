/**
 * Append bounded, exact historical author redirects to build output only.
 * Cloudflare Pages preserves incoming query strings when the destination has no query.
 * https://developers.cloudflare.com/pages/configuration/redirects/
 * Limits: https://developers.cloudflare.com/pages/platform/limits/#redirects
 */
import { readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { isOwnedWriterRedirect, reservedTopLevelNames, writerPageIds } from '../src/lib/writer-pages.ts';

const STATIC_RULE_LIMIT = 2000;
const DYNAMIC_RULE_LIMIT = 100;
const RULE_LENGTH_LIMIT = 1000;
const GENERATED_COMMENT = '# Historical writer aliases (generated from authors present; do not edit dist).';

/** @param {string} text */
function ruleLines(text) {
  return text.split('\n').map((line) => line.trim()).filter((line) => line && !line.startsWith('#'));
}

/** Validate the final file before any write, since excess Pages rules are ignored. */
export function validateRedirectLimits(text) {
  let staticRules = 0;
  let dynamicRules = 0;
  for (const line of ruleLines(text)) {
    if (line.length > RULE_LENGTH_LIMIT) throw new Error(`writer redirects: rule exceeds ${RULE_LENGTH_LIMIT} characters`);
    const [source] = line.split(/\s+/);
    if (/[*:]/.test(source)) dynamicRules++;
    else staticRules++;
  }
  if (staticRules > STATIC_RULE_LIMIT || dynamicRules > DYNAMIC_RULE_LIMIT) {
    throw new Error(`writer redirects: ${staticRules} static / ${dynamicRules} dynamic rules exceed Pages limits (${STATIC_RULE_LIMIT}/${DYNAMIC_RULE_LIMIT})`);
  }
}

/**
 * @param {string} existing the tracked public/_redirects source, never the prior generated file
 * @param {readonly string[]} authorIds
 * @param {{pages?: readonly string[], assets?: readonly string[]}} [entries]
 */
export function renderWriterRedirects(existing, authorIds, { pages = [], assets = [] } = {}) {
  const authors = authorIds.map((id) => ({ id, data: { kind: /** @type {'ai'} */ ('ai') } }));
  const aliases = writerPageIds(authors, reservedTopLevelNames(pages, assets, existing));
  const present = new Set(authorIds);
  // Exact owned rules in source can survive a later sync, but not create dead sparse-template URLs.
  const source = existing.split('\n').filter((line) => {
    const [from, to, status, ...extra] = line.trim().split(/\s+/);
    return !(extra.length === 0 && isOwnedWriterRedirect(from, to, status));
  }).join('\n').trimEnd();
  const rules = aliases.filter((id) => present.has(id)).flatMap((id) => [
    `/${id}/ /authors/${id}/ 301`,
    `/${id} /authors/${id}/ 301`,
  ]);
  // Put exact aliases before any existing dynamic rules. Existing rules retain their relative order.
  const text = `${GENERATED_COMMENT}\n${rules.join('\n')}${rules.length ? '\n' : ''}${source}\n`;
  validateRedirectLimits(text);
  return text;
}

/** @param {{root?: string, dist?: string}} [options] */
export function writeWriterRedirects({ root = '.', dist = join(root, 'dist') } = {}) {
  const authorIds = readdirSync(join(root, 'src/content/authors'))
    .filter((name) => /\.mdx?$/.test(name)).map((name) => name.replace(/\.mdx?$/, ''));
  const text = renderWriterRedirects(readFileSync(join(root, 'public/_redirects'), 'utf8'), authorIds, {
    pages: readdirSync(join(root, 'src/pages')),
    assets: readdirSync(join(root, 'public')),
  });
  writeFileSync(join(dist, '_redirects'), text);
  return text;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const args = process.argv.slice(2);
    if (args.length > 1 || args.some((arg) => arg.startsWith('-'))) throw new Error('usage: node --experimental-strip-types scripts/writer-redirects.mjs [dist]');
    const text = writeWriterRedirects({ dist: args[0] ?? 'dist' });
    console.log(`writer redirects: wrote ${ruleLines(text).length} bounded rules to ${args[0] ?? 'dist'}/_redirects`);
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}

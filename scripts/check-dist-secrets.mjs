#!/usr/bin/env node
/**
 * Fail if the static build (dist/) contains anything that belongs only to server code.
 *
 * Secrets for the contact form (CF_EMAIL_API_TOKEN, CONTACT_TO) live as Cloudflare Pages
 * secrets and are read by functions/ at request time. The build never sees them, so they
 * cannot be in dist/ — this check proves it stays that way:
 *   1. no secret names, no bearer header, no Cloudflare API address in any published file;
 *   2. no secret *value* from the environment or from a local .dev.vars file.
 * Values are compared, never printed.
 */
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { extname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

export const DIST_DIR = 'dist';

/** Names and strings that only server code has any reason to contain. */
export const FORBIDDEN_MARKERS = [
  'CF_EMAIL_API_TOKEN',
  'CONTACT_TO',
  'CLOUDFLARE_API_TOKEN',
  'api.cloudflare.com',
  'email/sending/send',
  'Bearer ',
];

/** Environment variables whose values must never appear in a published file. */
export const SECRET_ENV_NAMES = ['CF_EMAIL_API_TOKEN', 'CONTACT_TO', 'CLOUDFLARE_API_TOKEN'];

/** Values shorter than this are too common to search for without false alarms. */
const MIN_SECRET_LENGTH = 8;

const TEXT_EXTENSIONS = new Set(['.html', '.js', '.mjs', '.css', '.xml', '.txt', '.json', '.svg', '.webmanifest', '.map']);

/** @param {string} dir @returns {string[]} every file under dir */
export function walk(dir) {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    return statSync(path).isDirectory() ? walk(path) : [path];
  });
}

/** @param {string} text contents of a .dev.vars file @returns {string[]} its values */
export function devVarsValues(text) {
  return text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith('#') && line.includes('='))
    .map((line) => line.slice(line.indexOf('=') + 1).trim().replace(/^(["'])(.*)\1$/, '$2'));
}

/**
 * @param {{ path: string, text: string }[]} files
 * @param {string[]} markers
 * @param {string[]} secretValues
 * @returns {{ path: string, what: string }[]} one entry per problem; `what` never contains a secret value
 */
export function findLeaks(files, markers, secretValues) {
  const values = secretValues.filter((value) => value.length >= MIN_SECRET_LENGTH);
  const leaks = [];
  for (const { path, text } of files) {
    for (const marker of markers) {
      if (text.includes(marker)) leaks.push({ path, what: `contains "${marker}"` });
    }
    values.forEach((value, i) => {
      if (text.includes(value)) leaks.push({ path, what: `contains secret value #${i + 1}` });
    });
  }
  return leaks;
}

function main() {
  if (!existsSync(DIST_DIR)) {
    console.error(`check:dist: ${DIST_DIR}/ does not exist. Run npm run build first.`);
    return 1;
  }
  const files = walk(DIST_DIR)
    .filter((path) => TEXT_EXTENSIONS.has(extname(path)))
    .map((path) => ({ path, text: readFileSync(path, 'utf8') }));

  const secretValues = SECRET_ENV_NAMES.map((name) => process.env[name] ?? '').filter(Boolean);
  if (existsSync('.dev.vars')) secretValues.push(...devVarsValues(readFileSync('.dev.vars', 'utf8')));

  const leaks = findLeaks(files, FORBIDDEN_MARKERS, secretValues);
  if (leaks.length > 0) {
    console.error('check:dist: server-only content found in the static build:');
    for (const { path, what } of leaks) console.error(`  ${path}: ${what}`);
    return 1;
  }
  console.log(`check:dist: ${files.length} published files, no secrets or server-only content.`);
  return 0;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  process.exitCode = main();
}

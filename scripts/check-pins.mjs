#!/usr/bin/env node
/**
 * Check `src/data/pins.json` (plan docs/plans/2026-10-31-top-nav-and-pinning.md, "A pin that names
 * a post that is not published").
 *
 *   node scripts/check-pins.mjs              schema errors fail; a dangling pin is a warning
 *   node scripts/check-pins.mjs --strict     a dangling pin fails too (the check for pin pull requests)
 *
 * A schema error (bad JSON, an unknown key, a bad state, an offset-less timestamp, a duplicate slug)
 * exits 1 always: that is a broken file. A dangling pin is an ACTIVE pin whose post is not
 * published (missing, draft, not yet live, withdrawn); it is a warning by default so a retraction
 * pull request, which cannot edit the pin file itself, is never deadlocked by it, and a failure
 * under `--strict`, which is for a pull request that changes the pin file. Proposed pins are not
 * shown by the site, so they are not checked against the posts.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { PINS_PATH, POSTS_DIR, REPO_ROOT, loadPublishedIds } from './pins.mjs';
import { parsePinsText, untilInstant } from '../src/lib/pins.ts';

/**
 * @param {string[]} argv
 * @param {{ cwd?: string, now?: Date, stdout?: (line: string) => void, stderr?: (line: string) => void }} [io]
 * @returns {number} the exit code
 */
export function main(argv, { cwd = REPO_ROOT, now = new Date(), stdout = console.log, stderr = console.error } = {}) {
  const unknown = argv.filter((arg) => arg !== '--strict');
  if (unknown.length > 0) {
    stderr(`check:pins: unknown argument ${unknown[0]}\nusage: check-pins.mjs [--strict]`);
    return 2;
  }
  const strict = argv.includes('--strict');
  const pinsPath = join(cwd, PINS_PATH);
  let file;
  try {
    file = parsePinsText(readFileSync(pinsPath, 'utf8'));
  } catch (error) {
    stderr(`check:pins: ${PINS_PATH}: ${error.code === 'ENOENT' ? 'file is missing' : error.message}`);
    return 1;
  }
  const { ids, unreadable } = loadPublishedIds(join(cwd, POSTS_DIR), now);
  for (const name of unreadable) stderr(`check:pins: warning: could not read the frontmatter of ${name}`);
  const dangling = file.pins.filter((pin) => pin.state === 'active' && !ids.has(pin.slug));
  for (const pin of dangling) {
    stderr(`check:pins: ${strict ? 'error' : 'warning'}: active pin "${pin.slug}" names a post that is not published; the build drops it`);
  }
  for (const pin of file.pins) {
    if (pin.state === 'active' && ids.has(pin.slug) && pin.until !== undefined && now > untilInstant(pin.until)) {
      stdout(`check:pins: note: pin "${pin.slug}" expired (${pin.until}); the next pin pull request can remove it`);
    }
  }
  stdout(`check:pins: ${PINS_PATH} is valid (mode ${file.mode}, ${file.pins.length} pin${file.pins.length === 1 ? '' : 's'}${dangling.length ? `, ${dangling.length} dangling` : ''})`);
  return strict && dangling.length > 0 ? 1 : 0;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) process.exitCode = main(process.argv.slice(2));

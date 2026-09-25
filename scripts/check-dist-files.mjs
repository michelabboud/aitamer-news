#!/usr/bin/env node
/**
 * Count the files a deploy uploads, against Cloudflare's per-deploy cap.
 *
 *   npm run check:files     warn from WARN_AT files, fail from FAIL_AT (run after `npm run build`)
 *
 * The free plan accepts at most 20,000 files per deploy, and every post costs about three
 * (its page, its hero image, its Pagefind fragment). A deploy over the cap is rejected outright,
 * so this fails the build first, with room to spare, and warns long before
 * (docs/adr/0005-deploy-file-budget.md).
 */
import { readdirSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

/** Cloudflare's free-plan limit on files in one Pages / Workers-assets deploy. */
export const DEPLOY_FILE_CAP = 20_000;
/** Start warning here: about 1,300 posts of headroom left at three files per post. */
export const WARN_AT = 16_000;
/** Fail here, before Cloudflare does, so the error names the cause. */
export const FAIL_AT = 19_500;

/** @param {string} dir @returns {number} regular files under dir, recursively */
export function countFiles(dir) {
  let total = 0;
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.isDirectory()) total += countFiles(join(dir, entry.name));
    else if (entry.isFile()) total += 1;
  }
  return total;
}

/** @param {number} files @returns {{ level: 'ok' | 'warn' | 'fail', message: string }} */
export function verdict(files) {
  const left = DEPLOY_FILE_CAP - files;
  const base = `${files} files in the deploy; the free plan allows ${DEPLOY_FILE_CAP} (${left} left).`;
  if (files >= FAIL_AT) {
    return { level: 'fail', message: `${base} Move hero images or the search index to R2, or move to Workers Paid (docs/adr/0005-deploy-file-budget.md).` };
  }
  if (files >= WARN_AT) return { level: 'warn', message: `${base} Plan the move in docs/adr/0005-deploy-file-budget.md now.` };
  return { level: 'ok', message: base };
}

function main(dir = 'dist') {
  const { level, message } = verdict(countFiles(dir));
  const line = `check:files: ${message}`;
  if (level === 'fail') {
    console.error(line);
    return 1;
  }
  if (level === 'warn') console.warn(`::warning::${line}`);
  else console.log(line);
  return 0;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  process.exitCode = main(process.argv[2]);
}

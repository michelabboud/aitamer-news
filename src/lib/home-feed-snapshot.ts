/** Server-only deterministic hashing; never imported by the browser protocol/controller. */
import { createHash } from 'node:crypto';
import { readdir, readFile } from 'node:fs/promises';
import { HOME_FEED_SCHEMA, validateHomeFeedSettings, type HomeFeedSettings } from './home-feed.ts';

export function renderingFingerprint(files: readonly (readonly [string, string])[]): string {
  const ordered = [...files].sort(([a], [b]) => a < b ? -1 : a > b ? 1 : 0);
  return createHash('sha256').update(JSON.stringify(ordered)).digest('hex');
}

/** Resolve from Astro's public server root, not this module's compiled chunk location. */
export async function fingerprintHomeFeedSources(root: URL): Promise<string> {
  const paths: string[] = [];
  async function visit(relative: string) {
    const entries = await readdir(new URL(relative, root), { withFileTypes: true });
    for (const entry of entries) {
      const path = `${relative}${entry.name}`;
      if (entry.isDirectory()) {
        if (path !== 'src/content' && path !== 'src/assets') await visit(`${path}/`);
      } else if (entry.isFile() && !/\.test\.[^.]+$/.test(path)) paths.push(path);
    }
  }
  await visit('src/');
  paths.push('astro.config.mjs', 'scripts/finalize-responsive-heroes.mjs', 'scripts/verify-prepared-heroes.mjs', 'package-lock.json');
  return renderingFingerprint(await Promise.all(paths.map(async (path) => [path, await readFile(new URL(path, root), 'utf8')] as const)));
}

export function homeFeedSnapshot(input: {
  settings: HomeFeedSettings; postStamps: readonly string[]; authorStamps: readonly string[]; renderingSource: string;
  renderContext?: { base: string; mediaBase: string };
}): string {
  validateHomeFeedSettings(input.settings);
  return createHash('sha256').update(JSON.stringify({
    schema: HOME_FEED_SCHEMA, settings: {
      initialPostCount: input.settings.initialPostCount, nextBatchSize: input.settings.nextBatchSize, maxAutoBatches: input.settings.maxAutoBatches,
    }, posts: input.postStamps,
    authors: [...input.authorStamps].sort(), renderingSource: input.renderingSource,
    base: input.renderContext?.base ?? '/', mediaBase: input.renderContext?.mediaBase ?? '',
  })).digest('hex');
}

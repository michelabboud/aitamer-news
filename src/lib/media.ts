/**
 * Hero images live on R2, served from media.aitamer.news (plan §5.5, §7.3). This module is the one
 * place that knows the media host and how to rewrite it for local/offline development, so every
 * consumer of `heroImage` resolves it the same way.
 */

/** Where hero images are served from in production. */
export const MEDIA_ORIGIN = 'https://media.aitamer.news';

/** The full URL a bot writes into a post's `heroImage` frontmatter for a given slug. */
export function heroUrl(slug: string): string {
  return `${MEDIA_ORIGIN}/heroes/${slug}.jpg`;
}

function isMediaUrl(value: string): boolean {
  return value === MEDIA_ORIGIN || value.startsWith(`${MEDIA_ORIGIN}/`);
}

/**
 * Reads the build-time `PUBLIC_MEDIA_BASE` var. Guarded so this module also loads under the plain
 * Node test runner (`npm test`), where `import.meta.env` (a Vite/Astro global) does not exist.
 */
function readMediaBase(): string | undefined {
  const env = (import.meta as ImportMeta & { env?: Record<string, string | undefined> }).env;
  const value = env?.PUBLIC_MEDIA_BASE?.trim();
  return value || undefined;
}

/**
 * Rewrites a URL on {@link MEDIA_ORIGIN} to `mediaBase`, for local or offline development
 * (`PUBLIC_MEDIA_BASE=/media-local`, plan §7.1). Every other value — including the pre-migration
 * `/heroes/<slug>.jpg` repo-relative path and any third-party URL — passes through unchanged.
 * Never introduces a double slash, regardless of trailing slashes on `mediaBase`.
 *
 * `mediaBase` is injectable: production call sites omit it and get the real build-time value
 * (via `readMediaBase()`); tests pass an explicit string (or `undefined`, for "no override set")
 * so they never depend on process/build env.
 */
export function resolveMedia(
  value: string,
  mediaBase: string | undefined = readMediaBase(),
): string {
  if (!mediaBase || !isMediaUrl(value)) return value;
  const suffix = value.slice(MEDIA_ORIGIN.length); // '' or e.g. '/heroes/slug.jpg'
  const base = mediaBase.replace(/\/+$/, '');
  return suffix ? `${base}${suffix}` : base;
}

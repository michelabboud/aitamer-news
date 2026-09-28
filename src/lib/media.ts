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

/**
 * The social-preview image of a page that has none of its own (home with no lead, author and writer
 * pages without a portrait): the welcome post's hero. `BaseLayout.astro` falls back to it.
 */
export const DEFAULT_SOCIAL_IMAGE = heroUrl('welcome-to-aitamer');

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

/**
 * Every hero that lived in the repo at `/heroes/<slug>.jpg` before the move to R2 (ADR 0020). Feeds,
 * social previews and other sites still hold those URLs, so `public/_redirects` sends each one to its
 * media URL with a 301 (`src/lib/redirects.test.ts` holds the two equal). Closed: a post written after
 * the move never had a repo path, so nothing is ever added here.
 */
export const LEGACY_HEROES: readonly string[] = Object.freeze([
  'a-voice-not-a-report',
  'aws-well-architected-agent',
  'burn-0-22-cubecl-0-11-pre4',
  'claude-art-phage-enzyme',
  'claude-code-agents-md-mods',
  'claude-opus-5-5-agentic-coding',
  'claude-opus-5-5-for-developers',
  'codex-cli-0-156',
  'copilot-plus-pc-brand-retired',
  'copilot-runtime-rust-migration',
  'drivingbench-gpt6-astra',
  'editing-an-ai-as-an-ai',
  'flux-3-action',
  'gemini-3-8-flash-tts',
  'gemini-managed-agents-09-2026-update',
  'gpt-6-sol-luna-api-pricing',
  'grok-4-7',
  'huggingface-tokenizers-1-0-rc2',
  'lightspeed-temporal-rust-agent-harness',
  'made-on-youtube-2026-gemini-ask-studio',
  'mistral-rs-0-9-3-fp8-nvfp4',
  'more-context-isnt-better',
  'needle-2-pi5-function-calling',
  'nvidia-cuda-rust-two-tracks',
  'open-weights-roundup',
  'openai-agents-api-public-beta',
  'openai-legacy-instruct-base-hard-remove-2026-09-28',
  'openai-medicare-eval-agent-au',
  'policy-watch-transparency',
  'qwen-audio-3-1-price-cuts',
  'routing-is-two-systems',
  'sora-videos-api-sunset',
  'the-gap-between-the-needles',
  'the-scroll-and-the-clock',
  'tools-review-agentgateway',
  'tools-review-goose',
  'vectors-plainly-1-what-a-vector-database-is',
  'vectors-plainly-2-inside-the-index',
  'vectors-plainly-3-multi-tenancy',
  'vectors-plainly-4-retrieval-quality',
  'vectors-plainly-5-rag-and-graphrag',
  'vectors-plainly-6-production',
  'welcome-to-aitamer',
  'zerodrift-anchor-3',
]);

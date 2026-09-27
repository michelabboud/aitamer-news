/**
 * Author kinds and how the site names them. `kind` lives in each author's profile under
 * `src/content/authors/` (the `authors` collection in `src/content.config.ts`).
 *
 * - `human`: a person on the desk. The only kind the rendered-body gate trusts.
 * - `bot`: a desk news bot, drafting briefs through the desk's pipeline.
 * - `ai`: a named AI writer with her own voice and long-term memory (Mai, from 2026-09-27). The
 *   site still says plainly that she is an AI, and her posts are gated exactly like a bot's
 *   (`scripts/check-rendered-body.mjs` gates every kind but `human`).
 */
export const AUTHOR_KINDS = ['human', 'bot', 'ai'] as const;
export type AuthorKind = (typeof AUTHOR_KINDS)[number];

const LABELS: Record<AuthorKind, string> = { human: 'Human', bot: 'Bot', ai: 'AI writer' };
const ROLES: Record<AuthorKind, string> = { human: 'Human editor', bot: 'News bot', ai: 'Featured writer' };

/**
 * Who writes Columns (ADR 0013): our own writers, human editors and named AI writers. Bots file
 * news briefs and never appear there. A record over every kind, so a new kind must choose.
 */
const COLUMNIST: Record<AuthorKind, boolean> = { human: true, ai: true, bot: false };

/** Whether an author of this kind writes Columns. */
export function isColumnist(kind: AuthorKind): boolean {
  return COLUMNIST[kind];
}

/** The order of the Tamers on the homepage: humans, then named AI writers, then desk bots. */
export const TAMER_RANK: Record<AuthorKind, number> = { human: 0, ai: 1, bot: 2 };

const NOUNS: Record<AuthorKind, string> = { human: 'a human editor', bot: 'a bot', ai: 'an AI writer' };

/** The kind as a noun phrase for running text read by machines (llms.txt): "a bot", "an AI writer". */
export function kindNoun(kind: AuthorKind): string {
  return NOUNS[kind];
}

/** The short byline label: "Human", "Bot", "AI writer". */
export function kindLabel(kind: AuthorKind): string {
  return LABELS[kind];
}

/** The role shown on an author's page after the kind badge: "Human editor", "News bot", "Featured writer". */
export function kindRole(kind: AuthorKind): string {
  return ROLES[kind];
}

/** The schema.org type of an author in JSON-LD: only a human is a `Person` (ADR 0011). */
export function jsonLdAuthorType(kind: AuthorKind): 'Person' | 'Organization' {
  return isHuman(kind) ? 'Person' : 'Organization';
}

/**
 * An author's name as machines outside the site show it (RSS, JSON Feed), where no badge appears:
 * a non-human author carries its kind, "Mai (AI writer)", so a feed reader is told too.
 */
export function feedAuthorName(name: string, kind: AuthorKind): string {
  return isHuman(kind) ? name : `${name} (${kindLabel(kind)})`;
}

/** Whether an author is a person. Everything else is a machine author, and says so. */
export function isHuman(kind: AuthorKind): boolean {
  return kind === 'human';
}

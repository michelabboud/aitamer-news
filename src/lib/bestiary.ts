/**
 * The Bestiary theme's view of the content: habitats as display objects, the Wildness legend,
 * and Extinction Watch. No Astro imports, so `npm test` can run it directly.
 *
 * Ported from the Claude Design hand-off branch `feat/bestiary` (9e51549) onto post contract v1:
 * habitats come from `habitats.ts` (the frontmatter `section` IS the habitat), specimen numbers
 * are stored in each post, and Wildness is the nested `{ rating, verified, claimed }` object.
 */
import { HABITATS as HABITAT_SLUGS, HABITAT_META, type Habitat as HabitatSlug } from './habitats.ts';
import type { WildnessRating } from './wildness.ts';

export interface HabitatView {
  /** URL slug and frontmatter value: /section/<slug>/. */
  slug: HabitatSlug;
  /** H1–H7. */
  code: string;
  name: string;
  blurb: string;
}

export const HABITAT_LIST: readonly HabitatView[] = HABITAT_SLUGS.map((slug) => ({
  slug,
  code: HABITAT_META[slug].code,
  name: HABITAT_META[slug].label,
  blurb: HABITAT_META[slug].blurb,
}));

export function habitatOf(section: string): HabitatView {
  const habitat = HABITAT_LIST.find((h) => h.slug === section);
  if (!habitat) throw new Error(`"${section}" is not a habitat`);
  return habitat;
}

/** What each Wildness level means. Shown in the legend and on the About page. */
export const WILDNESS_MEANINGS: Record<WildnessRating, string> = {
  1: 'Independently verified, or plain fact from official records.',
  2: 'Key facts confirmed in primary sources; minor claims rest on the vendor.',
  3: 'Facts are in the docs, but the headline benefit is a vendor claim.',
  4: 'Mostly vendor or author claims: vendor benchmarks, preprints.',
  5: 'Vendor claim or self-published result only.',
};

/**
 * Meter segments as CSS custom properties, so the theme owns the colours: the first `level`
 * segments take `--wild-<level>`, the rest `--wild-empty`.
 */
export function wildnessTokens(level: WildnessRating): string[] {
  return [1, 2, 3, 4, 5].map((i) => (i <= level ? `--wild-${level}` : '--wild-empty'));
}

export interface SunsetEntry<P> {
  post: P;
  date: Date;
  /** Whole UTC days from `now` to the shutdown; 0 on the day, negative once it has passed. */
  daysLeft: number;
}

const DAY_MS = 86_400_000;

/** Whole days between two instants, counted on UTC calendar dates. */
export function daysBetween(from: Date, to: Date): number {
  const a = Date.UTC(from.getUTCFullYear(), from.getUTCMonth(), from.getUTCDate());
  const b = Date.UTC(to.getUTCFullYear(), to.getUTCMonth(), to.getUTCDate());
  return Math.round((b - a) / DAY_MS);
}

/**
 * Posts that report a shutdown, split at `now`: upcoming ones soonest first, extinct ones most
 * recent first. `now` is the build time on the server; pages refresh the wording in the browser.
 */
export function extinctionWatch<P extends { data: { sunset?: { date: Date } } }>(
  posts: readonly P[],
  now: Date,
): { upcoming: SunsetEntry<P>[]; extinct: SunsetEntry<P>[] } {
  const entries = posts
    .filter((post) => post.data.sunset)
    .map((post) => {
      const date = post.data.sunset!.date;
      return { post, date, daysLeft: daysBetween(now, date) };
    });
  return {
    upcoming: entries.filter((e) => e.daysLeft >= 0).sort((a, b) => a.daysLeft - b.daysLeft),
    extinct: entries.filter((e) => e.daysLeft < 0).sort((a, b) => b.daysLeft - a.daysLeft),
  };
}

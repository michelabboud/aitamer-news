/**
 * The Bestiary vocabulary: habitats, specimen numbers, wildness, and Extinction Watch.
 * No Astro imports, so `npm test` can run it directly.
 */

/** A habitat groups one or more of the ten desks (`section` in frontmatter) for display. */
export interface Habitat {
  /** URL slug: /habitat/<slug>/. */
  slug: string;
  /** H1–H7. */
  code: string;
  name: string;
  /** Desks shown in this habitat. Frontmatter keeps the desk; the habitat is display only. */
  sections: readonly string[];
}

export const HABITATS: readonly Habitat[] = [
  { slug: 'models', code: 'H1', name: 'Models', sections: ['top', 'models'] },
  { slug: 'tools', code: 'H2', name: 'Tools', sections: ['tools'] },
  { slug: 'creative', code: 'H3', name: 'Creative', sections: ['image', 'video'] },
  { slug: 'infra', code: 'H4', name: 'Infra', sections: ['data', 'databases'] },
  { slug: 'rust', code: 'H5', name: 'Rust', sections: ['rust'] },
  { slug: 'policy', code: 'H6', name: 'Policy', sections: ['policy'] },
  { slug: 'opinion', code: 'H7', name: 'Opinion', sections: ['opinion'] },
];

export function habitatOf(section: string): Habitat {
  const habitat = HABITATS.find((h) => h.sections.includes(section));
  if (!habitat) throw new Error(`No habitat holds the desk "${section}"`);
  return habitat;
}

export function habitatBySlug(slug: string): Habitat | undefined {
  return HABITATS.find((h) => h.slug === slug);
}

interface Dated {
  id: string;
  data: { pubDate: Date };
}

/**
 * Specimen numbers: 1 for the oldest published post, counting up in publish order
 * (ties broken by id, like the listings). A number stays put as long as posts are not
 * backdated or unpublished, which the publish-time rules in POST.md already forbid.
 */
export function specimenNumbers<P extends Dated>(posts: readonly P[]): Map<string, number> {
  const oldestFirst = [...posts].sort(
    (a, b) => a.data.pubDate.valueOf() - b.data.pubDate.valueOf() || b.id.localeCompare(a.id),
  );
  return new Map(oldestFirst.map((post, i) => [post.id, i + 1]));
}

/** "0412". */
export function formatSpecimen(n: number): string {
  return String(n).padStart(4, '0');
}

export type Wildness = 1 | 2 | 3 | 4 | 5;

export const WILDNESS_LABELS: Record<Wildness, string> = {
  1: 'Tamed',
  2: 'Mostly tamed',
  3: 'Partly tamed',
  4: 'Still wild',
  5: 'Wild',
};

/** What each level means. Shown in the legend and on the About page. */
export const WILDNESS_MEANINGS: Record<Wildness, string> = {
  1: 'Independently verified, or plain fact from official records.',
  2: 'Key facts confirmed in primary sources; minor claims rest on the vendor.',
  3: 'Facts are in the docs, but the headline benefit is a vendor claim.',
  4: 'Mostly vendor or author claims: vendor benchmarks, preprints.',
  5: 'Vendor claim or self-published result only.',
};

/**
 * Meter segments for a rating: the first `level` segments take the level's colour token,
 * the rest stay empty. Returns CSS custom property names, e.g. `--wild-3`.
 */
export function wildnessSegments(level: number): string[] {
  return [1, 2, 3, 4, 5].map((i) => (i <= level ? `--wild-${level}` : '--wild-empty'));
}

export interface SunsetEntry<P> {
  post: P;
  date: Date;
  /** Whole UTC days from `now` to the shutdown; 0 on the day, negative once it has passed. */
  daysLeft: number;
}

/** Whole days between two instants, counted on UTC calendar dates. */
export function daysBetween(from: Date, to: Date): number {
  const day = 86_400_000;
  const a = Date.UTC(from.getUTCFullYear(), from.getUTCMonth(), from.getUTCDate());
  const b = Date.UTC(to.getUTCFullYear(), to.getUTCMonth(), to.getUTCDate());
  return Math.round((b - a) / day);
}

/**
 * Posts that report a shutdown, split at `now`: upcoming ones soonest first,
 * extinct ones most recent first.
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

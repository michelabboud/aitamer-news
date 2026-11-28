// The series line on every kit page, e.g. "Kubernetes from Zero · Foundations 2 of 12 · Lesson 2".
// Derived from the site's own catalog (src/data/series.json) with the same rules as seriesLabel()
// and seriesArcAt() in src/lib/series.ts, so the PDFs always match the badge on the lesson page.
// The place noun (kit.place) is what the cover and the answer key call the lab machine.
// Throws, rather than guessing, when the series, the lesson's arc, or the place noun cannot be found.

/** Headings for the control-plane cheat sheet. All six, or none. */
const KIT_PHRASE_KEYS = ['controlPlaneTitle', 'controlPlaneHint', 'nodesTitle', 'nodesHint', 'applyLead', 'applyHint'];

/**
 * @param {Array<{slug: string, title: string, arcs?: Array<{name: string, start: number, end?: number}>, kit?: {place?: string}}>} catalog
 * @param {string} slug   series slug, as in the post's `series` front matter
 * @param {number} lesson lesson number, as in the post's `series_order` front matter
 */
export function seriesLine(catalog, slug, lesson) {
  if (!Number.isInteger(lesson) || lesson < 1) throw new Error(`Lesson number must be a positive integer, got ${lesson}`);
  const meta = catalog.find((s) => s.slug === slug);
  if (!meta) throw new Error(`Series "${slug}" is not in src/data/series.json`);
  if (!meta.arcs?.length) throw new Error(`Series "${slug}" has no arcs in src/data/series.json`);
  const matches = meta.arcs.filter((a) => lesson >= a.start && (a.end === undefined || lesson <= a.end));
  if (matches.length !== 1) {
    throw new Error(`Lesson ${lesson} of "${slug}" is in ${matches.length} arcs in src/data/series.json; expected exactly 1`);
  }
  const place = meta.kit?.place;
  if (typeof place !== 'string' || !/^[a-z]+$/.test(place)) {
    throw new Error(`Series "${slug}" has no kit.place in src/data/series.json`);
  }
  const present = KIT_PHRASE_KEYS.filter((key) => meta.kit[key] !== undefined);
  let headings = null;
  if (present.length) {
    if (present.length !== KIT_PHRASE_KEYS.length || present.some((key) => typeof meta.kit[key] !== 'string' || meta.kit[key] === '')) {
      throw new Error(`Series "${slug}" kit control-plane headings must all be non-empty strings in src/data/series.json`);
    }
    headings = Object.fromEntries(KIT_PHRASE_KEYS.map((key) => [key, meta.kit[key]]));
  }
  const [arc] = matches;
  const label = arc.end === undefined
    ? `${meta.title} · ${arc.name} · Lesson ${lesson}`
    : `${meta.title} · ${arc.name} ${lesson - arc.start + 1} of ${arc.end - arc.start + 1} · Lesson ${lesson}`;
  return {
    label,
    seriesTitle: meta.title,
    arc: arc.name,
    place,
    placeLabel: place.charAt(0).toUpperCase() + place.slice(1),
    headings,
  };
}

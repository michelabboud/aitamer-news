// The series line on every kit page, e.g. "Kubernetes from Zero · Foundations 2 of 12 · Lesson 2".
// Derived from the site's own catalog (src/data/series.json) with the same rules as seriesLabel()
// and seriesArcAt() in src/lib/series.ts, so the PDFs always match the badge on the lesson page.
// Throws, rather than guessing, when the series or the lesson's arc cannot be found.

/**
 * @param {Array<{slug: string, title: string, arcs?: Array<{name: string, start: number, end?: number}>}>} catalog
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
  const [arc] = matches;
  const label = arc.end === undefined
    ? `${meta.title} · ${arc.name} · Lesson ${lesson}`
    : `${meta.title} · ${arc.name} ${lesson - arc.start + 1} of ${arc.end - arc.start + 1} · Lesson ${lesson}`;
  return { label, seriesTitle: meta.title, arc: arc.name };
}

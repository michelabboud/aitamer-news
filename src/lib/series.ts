/**
 * Series membership. Pure: no `astro:content` import, so `npm test` and `scripts/check-series.mjs`
 * share one implementation with the pages.
 *
 * A part is live under the same rule as the rest of the site (`isLive`): not a draft, and
 * `pubDate` has passed `now`. Withdrawn posts keep their order so the number is not reused, and
 * they leave the public lists.
 */
import { isLive } from './schedule.ts';

/** Lowercase slug: `grok-bot`, not a title. */
export const SERIES_SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/** One stretch of a series whose size is fixed in the catalog, not counted from live posts. */
export interface SeriesArc {
  name: string;
  /** First lesson number in this arc, inclusive. */
  start: number;
  /** Last lesson number in this arc, inclusive. Absent means the arc has no fixed end. */
  end?: number;
}

export interface SeriesMeta {
  slug: string;
  title: string;
  description: string;
  /** Optional `https://` hero. Absent, blank, or any other value is not shown. */
  heroImage?: string;
  heroAlt?: string;
  /** Optional fixed arc plan. Absent means the badge still counts live parts. */
  arcs?: readonly SeriesArc[];
}

/** The fields a series check needs. A content entry satisfies this. */
export interface SeriesPost {
  id: string;
  title: string;
  description: string;
  pubDate: Date;
  draft: boolean;
  withdrawn: boolean;
  /** Frontmatter `series`, unchecked until `seriesProblems`. */
  series?: unknown;
  /** Frontmatter `series_order`, unchecked until `seriesProblems`. */
  seriesOrder?: unknown;
  stamp?: string;
  /** This article's existing hero, used as a decorative part thumbnail. */
  heroImage?: string;
  heroAlt?: string;
}

export interface SeriesPart {
  id: string;
  title: string;
  description: string;
  pubDate: Date;
  order: number;
  stamp: string;
  heroImage?: string;
  heroAlt?: string;
}

export interface SeriesView {
  slug: string;
  title: string;
  description: string;
  /** Site path, before the deploy base: `/series/<slug>/`. */
  href: string;
  /** Live parts, `series_order` ascending. */
  parts: SeriesPart[];
  heroImage?: string;
  heroAlt?: string;
  /** Fixed arc plan, when this series opted in. */
  arcs?: readonly SeriesArc[];
}

export interface SeriesPlacement {
  view: SeriesView;
  /** 1-based place among live parts. */
  index: number;
  total: number;
  /** The post's `series_order`. */
  order: number;
  prev?: SeriesPart;
  next?: SeriesPart;
  /**
   * Reader label. Without arcs: `Grok Bot tutorial · Part 3 of 7` (live place and live count).
   * With arcs: `Kubernetes from Zero · Foundations 1 of 12 · Lesson 1`.
   */
  label: string;
  href: string;
}

/** The one arc that contains this lesson, or none when the plan does not cover it exactly once. */
export function seriesArcAt(arcs: readonly SeriesArc[], lesson: number): SeriesArc | undefined {
  const matches = arcs.filter((arc) => lesson >= arc.start && (arc.end === undefined || lesson <= arc.end));
  return matches.length === 1 ? matches[0] : undefined;
}

export function seriesHref(slug: string): string {
  return `/series/${slug}/`;
}

/**
 * Badge text. `index` and `total` are the place among live parts. A series with `arcs` uses the
 * lesson number (`series_order`) and the fixed plan instead, so the words do not move when a
 * later part goes live. An arc with no `end` is open: `Title · Certification · Lesson 104`.
 */
export function seriesLabel(title: string, index: number, total: number, arcs?: readonly SeriesArc[], lesson?: number): string {
  const number = lesson ?? index;
  const arc = arcs?.length ? seriesArcAt(arcs, number) : undefined;
  if (!arc) return `${title} · Part ${index} of ${total}`;
  if (arc.end === undefined) return `${title} · ${arc.name} · Lesson ${number}`;
  const within = number - arc.start + 1;
  const size = arc.end - arc.start + 1;
  return `${title} · ${arc.name} ${within} of ${size} · Lesson ${number}`;
}

/**
 * Position text on a series page, in front of the date. Series without arcs keep `Part N`
 * (the live place). A series with arcs shows the same label as the badge.
 */
export function seriesPartKicker(title: string, liveIndex: number, order: number, arcs?: readonly SeriesArc[]): string {
  if (!arcs?.length || !seriesArcAt(arcs, order)) return `Part ${liveIndex}`;
  return seriesLabel(title, liveIndex, liveIndex, arcs, order);
}

export function seriesMark(placement: SeriesPlacement | undefined): { href: string; label: string; slug: string } | undefined {
  return placement ? { href: placement.href, label: placement.label, slug: placement.view.slug } : undefined;
}

/** An `https://` hero with alt text, or null when the series has no image to show. */
export function seriesHero(series: { title: string; heroImage?: string; heroAlt?: string }): { src: string; alt: string } | null {
  const src = typeof series.heroImage === 'string' ? series.heroImage.trim() : '';
  if (!/^https:\/\/\S+$/.test(src)) return null;
  const alt = typeof series.heroAlt === 'string' && series.heroAlt.trim() ? series.heroAlt.trim() : series.title;
  return { src, alt };
}

function hasSeries(series: unknown): series is string {
  return typeof series === 'string' && series.length > 0;
}

function validOrder(order: unknown): order is number {
  return typeof order === 'number' && Number.isInteger(order) && order >= 1;
}

/**
 * Problems that should fail `check:posts` and the build. Empty when every post's series fields
 * match the catalog and no two posts in one series share an order.
 */
export function seriesProblems(posts: readonly SeriesPost[], catalog: readonly SeriesMeta[]): string[] {
  const problems: string[] = [];
  const seen = new Map<string, number>();
  for (const meta of catalog) {
    if (!SERIES_SLUG.test(meta.slug)) problems.push(`series catalog: "${meta.slug}" is not a lowercase slug`);
    if (!meta.title.trim()) problems.push(`series catalog: "${meta.slug}" has no title`);
    if (!meta.description.trim()) problems.push(`series catalog: "${meta.slug}" has no description`);
    seen.set(meta.slug, (seen.get(meta.slug) ?? 0) + 1);
  }
  for (const [slug, count] of seen) {
    if (count > 1) problems.push(`series catalog: "${slug}" is listed ${count} times`);
  }
  const known = new Set(catalog.map((meta) => meta.slug));
  const arcsBySlug = new Map<string, readonly SeriesArc[]>();
  for (const meta of catalog) {
    if (meta.arcs?.length && !arcsBySlug.has(meta.slug)) arcsBySlug.set(meta.slug, meta.arcs);
  }
  const orders = new Map<string, string[]>();

  for (const post of posts) {
    const seriesSet = post.series !== undefined && post.series !== '';
    const orderSet = post.seriesOrder !== undefined;
    if (!seriesSet && !orderSet) continue;
    if (seriesSet && !hasSeries(post.series)) {
      problems.push(`${post.id}: series must be a lowercase slug`);
    } else if (hasSeries(post.series) && !SERIES_SLUG.test(post.series)) {
      problems.push(`${post.id}: series "${post.series}" must be a lowercase slug`);
    } else if (hasSeries(post.series) && !known.has(post.series)) {
      problems.push(`${post.id}: series "${post.series}" is not in the series catalog`);
    }
    if (seriesSet && !orderSet) problems.push(`${post.id}: series_order is required when series is set`);
    if (orderSet && !seriesSet) problems.push(`${post.id}: series is required when series_order is set`);
    if (orderSet && !validOrder(post.seriesOrder)) problems.push(`${post.id}: series_order must be a positive integer`);
    if (hasSeries(post.series) && validOrder(post.seriesOrder)) {
      const arcs = arcsBySlug.get(post.series);
      if (arcs && !seriesArcAt(arcs, post.seriesOrder)) {
        problems.push(`${post.id}: series_order ${post.seriesOrder} is outside the arc plan for "${post.series}"`);
      }
    }
    if (hasSeries(post.series) && SERIES_SLUG.test(post.series) && validOrder(post.seriesOrder)) {
      const key = `${post.series}\0${post.seriesOrder}`;
      const ids = orders.get(key) ?? [];
      ids.push(post.id);
      orders.set(key, ids);
    }
  }

  for (const [key, ids] of orders) {
    if (ids.length < 2) continue;
    const [series, order] = key.split('\0');
    problems.push(`series "${series}" order ${order} is used by ${[...ids].sort().join(', ')}`);
  }
  return problems;
}

/**
 * Live parts grouped by series, in catalog order. Drafts, future `pubDate`s and withdrawn posts
 * are left out. Unknown slugs are left out (the check reports them).
 */
export function seriesPlacements(
  posts: readonly SeriesPost[],
  catalog: readonly SeriesMeta[],
  now: Date,
): Map<string, SeriesPlacement> {
  const metaBySlug = new Map(catalog.map((meta) => [meta.slug, meta]));
  const groups = new Map<string, SeriesPost[]>();
  for (const post of posts) {
    if (!hasSeries(post.series) || !validOrder(post.seriesOrder)) continue;
    if (!metaBySlug.has(post.series)) continue;
    if (post.withdrawn || !isLive({ draft: post.draft, pubDate: post.pubDate }, now)) continue;
    const list = groups.get(post.series) ?? [];
    list.push(post);
    groups.set(post.series, list);
  }

  const placements = new Map<string, SeriesPlacement>();
  for (const meta of catalog) {
    const list = groups.get(meta.slug);
    if (!list?.length) continue;
    const parts: SeriesPart[] = [...list]
      .sort((a, b) => a.seriesOrder! - b.seriesOrder! || a.id.localeCompare(b.id))
      .map((post) => ({
        id: post.id,
        title: post.title,
        description: post.description,
        pubDate: post.pubDate,
        order: post.seriesOrder!,
        stamp: post.stamp ?? post.id,
        heroImage: post.heroImage,
        heroAlt: post.heroAlt,
      }));
    const view: SeriesView = {
      slug: meta.slug,
      title: meta.title,
      description: meta.description,
      href: seriesHref(meta.slug),
      parts,
      heroImage: meta.heroImage,
      heroAlt: meta.heroAlt,
      ...(meta.arcs?.length ? { arcs: meta.arcs } : {}),
    };
    parts.forEach((part, i) => {
      placements.set(part.id, {
        view,
        index: i + 1,
        total: parts.length,
        order: part.order,
        prev: parts[i - 1],
        next: parts[i + 1],
        label: seriesLabel(meta.title, i + 1, parts.length, meta.arcs, part.order),
        href: view.href,
      });
    });
  }
  return placements;
}

/** Every value rendered by series pages, badges and sibling navigation. */
export function seriesViewCacheMark(view: SeriesView): string {
  return JSON.stringify({
    slug: view.slug, title: view.title, description: view.description, href: view.href,
    heroImage: view.heroImage ?? null, heroAlt: view.heroAlt ?? null,
    ...(view.arcs?.length
      ? { arcs: view.arcs.map((arc) => (arc.end === undefined ? { name: arc.name, start: arc.start } : { name: arc.name, start: arc.start, end: arc.end })) }
      : {}),
    parts: view.parts.map((part) => [part.id, part.order, part.stamp, part.title, part.description, part.pubDate.toISOString(), part.heroImage ?? null, part.heroAlt ?? null]),
  });
}

/**
 * Labels depend on siblings outside the current listing, including pinned posts the home feed
 * omits. Scope the dependency to series used here, with stable ordering.
 */
export function seriesCacheMark(ids: readonly string[], placements: ReadonlyMap<string, SeriesPlacement>): string {
  const views = new Map<string, SeriesView>();
  const members = [...new Set(ids)].sort().map((id) => {
    const placement = placements.get(id);
    if (!placement) return [id, null];
    views.set(placement.view.slug, placement.view);
    return [id, placement.view.slug, placement.index, placement.total, placement.order];
  });
  return JSON.stringify({
    members,
    views: [...views.values()].sort((a, b) => a.slug.localeCompare(b.slug)).map(seriesViewCacheMark),
  });
}

/** Catalog order, one view per series that has a live part. */
export function seriesViews(placements: ReadonlyMap<string, SeriesPlacement>): SeriesView[] {
  const views: SeriesView[] = [];
  const seen = new Set<string>();
  for (const placement of placements.values()) {
    if (seen.has(placement.view.slug)) continue;
    seen.add(placement.view.slug);
    views.push(placement.view);
  }
  return views;
}

/** Newest lastmod among listed parts, for the sitemap. */
export function seriesSitemapDates(
  entries: readonly { listed: boolean; lastmod: Date | null; series?: string | null }[],
): { newest?: Date; bySlug: Map<string, Date> } {
  const bySlug = new Map<string, Date>();
  for (const entry of entries) {
    if (!entry.listed || !entry.series || !entry.lastmod) continue;
    const prev = bySlug.get(entry.series);
    if (!prev || entry.lastmod > prev) bySlug.set(entry.series, entry.lastmod);
  }
  let newest: Date | undefined;
  for (const date of bySlug.values()) {
    if (!newest || date > newest) newest = date;
  }
  return { newest, bySlug };
}

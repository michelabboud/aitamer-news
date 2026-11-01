/**
 * The site's navigation (plan docs/plans/2026-10-31-top-nav-and-pinning.md, ADR 0051): one section row
 * in the top bar, a More menu for the rest, and the small utility links. No Astro imports, so
 * `npm test` can run it directly; BaseLayout renders it.
 *
 * The sections replace the old habitat row under the masthead (no link appears twice) and the
 * featured writers' names that used to lead the top bar (ADR 0032's navigation rule, superseded).
 */
import { HABITAT_LIST } from './bestiary.ts';

export interface NavLink {
  /** Stable key: what a page passes as `nav`, or a habitat slug. */
  key: string;
  /** Site-relative path, before the base is applied. */
  href: string;
  label: string;
}

/** The sections, in reading order: News, the topic habitats that carry a nav cell, then Voices. */
export const SECTION_LINKS: readonly NavLink[] = [
  { key: 'news', href: '/news/', label: 'News' },
  ...HABITAT_LIST.filter((h) => h.inNav).map((h) => ({ key: h.slug, href: `/section/${h.slug}/`, label: h.name })),
  { key: 'voices', href: '/section/voices/', label: 'Voices' },
];

/** What the More menu holds. */
export const MORE_LINKS: readonly NavLink[] = [
  { key: 'columns', href: '/columns/', label: 'Columns' },
  { key: 'general', href: '/section/general/', label: 'General' },
  { key: 'extinction-watch', href: '/extinction-watch/', label: 'Extinction Watch' },
  { key: 'archive', href: '/archive/', label: 'Archive' },
  { key: 'habitats', href: '/section/', label: 'All habitats' },
];

/** The small links at the right of the top bar. */
export const UTILITY_LINKS: readonly NavLink[] = [
  { key: 'authors', href: '/authors/', label: 'Authors' },
  { key: 'search', href: '/search/', label: 'Search' },
];

/**
 * The phone menu: the top bar is hidden on phones, so its utility links live here, with the station
 * links the footer also lists and the More menu's links (the section scroller on phones has no
 * drop-down, because a scrolling row would clip it).
 */
export const PHONE_MENU_LINKS: readonly NavLink[] = [
  ...UTILITY_LINKS,
  ...MORE_LINKS,
  { key: 'about', href: '/about/', label: 'About' },
  { key: 'campfire', href: '/campfire/', label: 'Campfire' },
  { key: 'sighting', href: '/about/?topic=sighting#contact', label: 'Report a sighting' },
  { key: 'contact', href: '/about/#contact', label: 'Contact' },
  { key: 'rss', href: '/rss.xml', label: 'RSS' },
];

export interface NavContext {
  /** The page's path with the base removed, e.g. `/section/dev/` or `/news/2/`. */
  path: string;
  /** The reading view a page declares (News or Columns pages, pagination included). */
  nav?: 'news' | 'columns';
  /** The habitat a story or desk page belongs to. */
  habitat?: string;
}

const trim = (path: string) => path.replace(/\/+$/, '') || '/';

/**
 * How a link is current on this page: `page` when it is the page itself, `true` when the page sits
 * inside it (a story in a habitat, page 2 of News), otherwise undefined. Anchored links (contact
 * forms on the About page) are never current: they point into a page, not at one.
 */
export function navCurrent(link: NavLink, context: NavContext): 'page' | 'true' | undefined {
  if (link.href.includes('#') || link.href.includes('?')) return undefined;
  const path = trim(context.path);
  if (path === trim(link.href)) return 'page';
  if (context.nav && context.nav === link.key) return 'true';
  if (context.habitat && context.habitat === link.key) return 'true';
  return undefined;
}

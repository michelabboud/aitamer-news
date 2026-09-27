/**
 * The habitats (topic sections) a sighting can live in, in reading order. The frontmatter key stays
 * `section`; "habitat" is the reader-facing word. No Astro imports, so the build scripts and tests
 * can use it.
 *
 * This list is part of the post contract that atn-ops and atn-mcp write against (POST.md).
 * Adding a habitat is additive; renaming or removing one needs a frontmatter alias below (so
 * existing writers keep working) and a legacy URL entry (so old links keep working).
 *
 * The 2026-09-28 lineup (ADR 0013): News and Columns are reading views over every post, not
 * habitats; the topics are Models, Dev, Tools, DevOps & IT and Rust. `general` holds what fits no
 * topic (policy notes, desk announcements): it has a page but no cell in the navigation, and its
 * posts are read through News.
 */
export const HABITATS = ['models', 'dev', 'tools', 'devops', 'rust', 'general'] as const;

export type Habitat = (typeof HABITATS)[number];

export interface HabitatMeta {
  /** Field code shown next to the name, in reading order. */
  code: string;
  label: string;
  /** One line for the habitat page and index. */
  blurb: string;
  /** Whether the habitat gets a cell in the navigation row. */
  inNav: boolean;
}

export const HABITAT_META: Record<Habitat, HabitatMeta> = {
  models: { code: 'H1', label: 'Models', blurb: 'New models, their prices, benchmarks, and deprecations.', inNav: true },
  dev: { code: 'H2', label: 'Dev', blurb: 'Building with AI: SDKs, APIs, agents, and coding with AI.', inNav: true },
  tools: { code: 'H3', label: 'Tools', blurb: 'AI products you use: apps, assistants, CLIs, and creative tools.', inNav: true },
  devops: { code: 'H4', label: 'DevOps & IT', blurb: 'Running AI: infrastructure, deployment, cost, security, and operations.', inNav: true },
  rust: { code: 'H5', label: 'Rust', blurb: 'Rust, AI in Rust, and Rust for AI: runtimes, kernels, and crates.', inNav: true },
  general: { code: 'H6', label: 'General', blurb: 'Policy notes, industry moves, and news from the desk.', inNav: false },
};

/**
 * Frontmatter values retired on 2026-09-28 that are still accepted, mapped to the habitat they
 * folded into. A writer that sends `section: infra` keeps working and is filed under DevOps & IT;
 * the published contract only gained values. Writers should move to the new names.
 */
export const SECTION_ALIASES = {
  creative: 'tools',
  infra: 'devops',
  policy: 'general',
  opinion: 'general',
} as const satisfies Record<string, Habitat>;

export type SectionAlias = keyof typeof SECTION_ALIASES;

/** Every value `section:` accepts in frontmatter: the habitats, then the deprecated aliases. */
export const FRONTMATTER_SECTIONS = [...HABITATS, ...(Object.keys(SECTION_ALIASES) as SectionAlias[])] as const;

/** A frontmatter `section` value as the habitat it files under. */
export function normalizeSection(value: Habitat | SectionAlias): Habitat {
  return Object.hasOwn(SECTION_ALIASES, value) ? SECTION_ALIASES[value as SectionAlias] : (value as Habitat);
}

/**
 * Retired section URLs and the habitat each one now lives in. Their old URLs (/section/<old>/)
 * are served as redirect pages, and Cloudflare answers them with a 301 from public/_redirects,
 * so links in the wild keep working. 2026-09-25: the old desks; 2026-09-28: the old habitats.
 */
export const LEGACY_SECTIONS = {
  top: 'general',
  image: 'tools',
  video: 'tools',
  data: 'devops',
  databases: 'devops',
  creative: 'tools',
  infra: 'devops',
  policy: 'general',
  opinion: 'general',
} as const satisfies Record<string, Habitat>;

export type LegacySection = keyof typeof LEGACY_SECTIONS;

export function isHabitat(value: string): value is Habitat {
  return (HABITATS as readonly string[]).includes(value);
}

export function isLegacySection(value: string): value is LegacySection {
  return Object.hasOwn(LEGACY_SECTIONS, value);
}

/**
 * Sitemap filter: drop the legacy redirect pages, keep everything else.
 * @param url absolute page URL as the sitemap integration passes it
 */
export function sitemapIncludes(url: string): boolean {
  const { pathname } = new URL(url);
  const match = /\/section\/([^/]+)\/?$/.exec(pathname);
  return !(match && isLegacySection(match[1]));
}

/**
 * The seven habitats (sections) a sighting can live in. The frontmatter key stays `section`;
 * "habitat" is the reader-facing word. No Astro imports, so the build scripts and tests can use it.
 *
 * This list is part of the post contract that atn-ops and atn-mcp write against (POST.md).
 * Adding a habitat is additive; renaming or removing one needs a legacy entry below so old URLs keep working.
 */
export const HABITATS = ['models', 'tools', 'creative', 'infra', 'rust', 'policy', 'opinion'] as const;

export type Habitat = (typeof HABITATS)[number];

export interface HabitatMeta {
  /** Field code shown next to the name, H1–H7, in reading order. */
  code: string;
  label: string;
  /** One line for the habitat page and index. */
  blurb: string;
}

export const HABITAT_META: Record<Habitat, HabitatMeta> = {
  models: { code: 'H1', label: 'Models', blurb: 'New models, their prices, and what the evals actually show.' },
  tools: { code: 'H2', label: 'Tools', blurb: 'Coding agents, CLIs, SDKs, and the APIs developers build on.' },
  creative: { code: 'H3', label: 'Creative', blurb: 'Image, video, voice, and music generation.' },
  infra: { code: 'H4', label: 'Infra', blurb: 'Data, databases, serving, and the hardware under it all.' },
  rust: { code: 'H5', label: 'Rust', blurb: 'Rust in AI: runtimes, kernels, and the crates behind them.' },
  policy: { code: 'H6', label: 'Policy', blurb: 'Law, regulation, and the rules machines are tamed by.' },
  opinion: { code: 'H7', label: 'Opinion', blurb: 'Signed views and notes from the desk.' },
};

/**
 * Sections retired on 2026-09-25 and the habitat each one folded into. Their old URLs
 * (/section/<old>/) are served as redirect pages, so links in the wild keep working.
 */
export const LEGACY_SECTIONS = {
  top: 'opinion',
  image: 'creative',
  video: 'creative',
  data: 'infra',
  databases: 'infra',
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

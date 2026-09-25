# Dependency vetting: a YAML parser for the build scripts

- **Date:** 2026-09-25
- **For:** fix lane F1, finding B1 of `docs/reviews/2026-09-25-batch-a-deep-review.md`. The stampers (`scripts/stamp-post-times.mjs`, `scripts/stamp-specimens.mjs`) and `scripts/due-posts.mjs` read post frontmatter with regexes, and disagreed with Astro on the README's own template.
- **Kind:** new direct runtime dependency of the build scripts only. It runs in CI and on editors' machines, never on a server or in the published site.

## The requirement that decides it

The scripts decide things the build must agree with: whether a post is a draft, whether it has sources, what its `pubDate` is. The only way to guarantee agreement is to parse the frontmatter **with the same library and schema Astro uses**. Astro 7 reads frontmatter in `@astrojs/internal-helpers/frontmatter` with `js-yaml`'s `load()` and its default schema. That schema differs from other parsers in ways that matter here:

- an unquoted `2026-09-25` loads as a `Date` (the timestamp type), not a string;
- `True`, `true` and `TRUE` are booleans; `yes` is a string;
- duplicate keys are an error.

## Version pinned

- **`js-yaml@4.3.2`**, pinned exactly. This is the version Astro 7.3.5 and `@astrojs/internal-helpers` 0.11.0 already resolve in `package-lock.json`, so npm dedupes it: no new code is installed.
- npm dist-tags on 2026-09-25: `latest` 5.4.2, `v4-legacy` 4.3.2, `v3-legacy` 3.15.2. **I deliberately did not take `latest`.** js-yaml 5 is a TypeScript rewrite that reworked `CORE_SCHEMA`/`JSON_SCHEMA` resolution, number parsing and the `load()` contract (it throws on empty input). Astro still uses 4.x, and a parser that disagrees with Astro is the defect being fixed. When Astro moves to 5.x, move this pin with it; the parity test in `scripts/frontmatter.test.mjs` compares our reader with Astro's own `parseFrontmatter` and will fail if the two drift.
- 4.3.2 was published 2026-08-26 on the maintained `v4-legacy` line.

## Security and health

- **Advisories on js-yaml in 2026:** GHSA-2883-xcg3-v3hh (high, `maxTotalMergeKeys` bypass with empty mappings; affects 4.0.0–4.3.1, **fixed in 4.3.2**); GHSA-5p4m-2wfm-xmqj (high, quadratic `!!omap`; affects 4.0.0–4.3.0, fixed in 4.3.1); GHSA-h67p-54hq-rp68 / CVE-2026-53550 (quadratic merge keys; fixed in 4.2.0); GHSA-pm4m-ph32-ghv5 (exponential flow collections; affects 5.0.0–5.2.1 only). Earlier: prototype pollution in merge keys fixed in 4.1.1. **4.3.2 is patched for every published advisory**, and `npm audit` reports 0 vulnerabilities after the change.
- **Exposure:** the input is our own post files, written by editors and our bots, parsed in CI and on developer machines. All advisories are denial of service (CPU) on hostile YAML; the worst case here is a slow CI job on a post that a human or bot committed.
- **License:** MIT.
- **Maintenance:** active. The 5.x line shipped ten releases between June and September 2026; the 4.x line received security backports in June, July and August 2026.
- **Adoption:** one of the most used packages on npm, and the parser Astro, ESLint and many others depend on.

## Alternatives weighed

| Option | Why not |
|---|---|
| `yaml` (eemeli/yaml) 2.9.1 | Good, spec-compliant, maintained (its 2026 advisory GHSA-48c2-rrv3-qjmp is fixed in 2.8.3). But its default YAML 1.2 core schema reads `pubDate: 2026-09-25` as a string, not a date, and it is not what Astro uses. Choosing it would re-create B1 in a subtler form: two parsers deciding the same post differently. It is also not installed today. |
| js-yaml 5.4.2 (`latest`) | Not what Astro uses; see above. |
| Import `@astrojs/internal-helpers/frontmatter` directly | Exact parity, but it is an internal, undocumented Astro package whose API can change in any minor. We use it only in a test, as the oracle. |
| Keep regexes, patch the cases | The finding is that regexes cannot match YAML. Every patched case leaves the next one (flow style, anchors, block scalars). |
| No first-party option | The fleet has no YAML parser. |

## Decision

Add `js-yaml@4.3.2` as an exact direct dependency (`npm install --save-exact`, no new install footprint), used only by `scripts/frontmatter.mjs`. Re-check advisories at every phase release (`npm audit`), and move the pin in step with Astro's own js-yaml.

## Sources

- npm registry, `npm view js-yaml dist-tags` and `npm view yaml dist-tags` (2026-09-25)
- [js-yaml changelog](https://github.com/nodeca/js-yaml/blob/master/CHANGELOG.md)
- [GitHub advisories for js-yaml](https://github.com/advisories?query=js-yaml)
- [GHSA-2883-xcg3-v3hh](https://github.com/advisories/GHSA-2883-xcg3-v3hh), [GHSA-5p4m-2wfm-xmqj](https://github.com/advisories/GHSA-5p4m-2wfm-xmqj), [GHSA-pm4m-ph32-ghv5](https://github.com/advisories/GHSA-pm4m-ph32-ghv5)
- [GHSA-48c2-rrv3-qjmp (yaml)](https://github.com/advisories/GHSA-48c2-rrv3-qjmp)
- Astro source: `node_modules/@astrojs/internal-helpers/dist/frontmatter.js` (imports `js-yaml`, calls `yaml.load`)

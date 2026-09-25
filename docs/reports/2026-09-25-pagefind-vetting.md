# Dependency vetting: Pagefind (site search)

- **Date:** 2026-09-25
- **For:** the Bestiary redesign's "look up a model, tool, or company" search (`docs/plans/2026-09-25-bestiary-redesign.md`)
- **Kind:** new direct dev dependency, build-time only. Nothing from it runs on a server.

## What it is

Pagefind indexes the built HTML in `dist/` after `astro build` and writes a static index plus a small browser search bundle into `dist/pagefind/`. Search then runs entirely in the reader's browser, fetching only the index chunks it needs. That fits the site exactly: static output, two hosts (Cloudflare Pages and GitHub Pages under `/aitamer-news`), no backend.

## Version pinned

- **`pagefind@1.5.2`**, the `latest` dist-tag on npm (checked with `npm view pagefind dist-tags`, 2026-09-25). Pinned exactly, not with a caret, because the index format and UI bundle change between minors.
- 1.5.2 (2026-04-12) fixes slow indexing on Linux musl builds introduced in 1.5.0 and makes index filenames deterministic — useful for Cloudflare's asset diffing between deploys.

## Security and health

- **Advisories:** one ever published, [GHSA-gprj-6m2f-j9hx](https://github.com/Pagefind/pagefind/security/advisories/GHSA-gprj-6m2f-j9hx) (moderate, 2024-09): DOM clobbering of `document.currentScript.src` could make the UI load scripts from another origin. Affected `< 1.1.1`; fixed in 1.1.1. 1.5.2 is well past it.
- **License:** MIT.
- **Maintenance:** active. v1.5.0 shipped 2026-04-06 (new component UI, better ranking, smaller indexes), 1.5.2 on 2026-04-12; the repository had commits in August 2026 and dependency PRs in September 2026.
- **Adoption:** Astro's own documentation framework, Starlight, uses Pagefind as its built-in search; widely used across static-site generators.
- **Install footprint:** the npm package ships a prebuilt native binary per platform (Linux x64 used in CI on `ubuntu-latest`). No postinstall network fetch beyond npm itself.

## Alternatives weighed

| Option | Why not |
|---|---|
| Fuse.js / MiniSearch over a build-time JSON of all posts | Ships the whole corpus to every reader. Fine at 25 posts, wrong at the 10,000-post target the site is being built for. |
| Lunr | Unmaintained since 2020; same whole-index download problem. |
| Algolia / hosted search | A third-party service, an API key in pages, and reader queries leaving the site; against the static, no-secrets design. |
| `astro-pagefind` integration | A thin third-party wrapper around the same binary. Calling the Pagefind CLI after `astro build` is one line and removes a dependency. |
| No first-party option | Neither Astro core nor the fleet has a static search index. |

## Decision

Adopt `pagefind@1.5.2` as a dev dependency, run as `pagefind --site dist` after `astro build` in both deploy workflows (through the `build` script), and use its UI from the generated bundle so paths honour the GitHub Pages base. Re-check advisories at every phase release (`npm audit`).

## Sources

- npm registry, `npm view pagefind` (2026-09-25)
- [Pagefind releases](https://github.com/pagefind/pagefind/releases)
- [v1.5.0 release discussion](https://github.com/Pagefind/pagefind/discussions/1095)
- [Pagefind security advisories](https://github.com/Pagefind/pagefind/security/advisories)
- [Installing and running Pagefind](https://pagefind.app/docs/installation/)

## Addendum (2026-09-25): file cost

Measured after adoption: Pagefind writes one fragment file per indexed page plus a few dozen index and runtime files (41 files for 25 posts). Against Cloudflare's 20,000-files-per-deploy free cap that makes each post cost about three files (page, hero, fragment). The budget and the migration order are recorded in `docs/adr/0005-deploy-file-budget.md`, and `npm run check:files` guards it in CI.

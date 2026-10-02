# 0022 · Fonts are self-hosted

Status: accepted 2026-10-02 (Michel's request: "download our fonts in an assets folder")

## Context

Every page load asked `fonts.googleapis.com` for a stylesheet and `fonts.gstatic.com` for the files, which sends the
reader's address to Google before the text renders. A German court fined a site for exactly this in 2022. It also cost two
extra connections on the way to first paint. ADR 0021 had noted the Google hosts as already allowed by the content security
policy, which was true and beside the point.

## Decision

The four families (Gloock, Newsreader, Hanken Grotesk, IBM Plex Mono) live in `src/assets/fonts/` as woff2, declared in
`src/styles/fonts.css` with `font-display: swap`. They are in `src/assets`, not `public`, so the build fingerprints them
under `/_astro/` and `_headers` caches them for a year. The three above-the-fold faces (logo, headlines, body) are
preloaded. The content security policy no longer lists either Google host, so a stray font link fails `check:csp`.

## Alternatives rejected

- **Keep Google Fonts, add a consent banner.** Needs a banner, still leaks before consent in practice, and still two connections.
- **An npm font package (Fontsource).** A new dependency to vet and keep updated for four files we can hold ourselves.
- **All subsets.** Cyrillic, Greek and Vietnamese add weight no post uses. They can be added file by file.

## Consequences

- About 423 KB of font files in the repository, of which a reader downloads only the faces and subsets a page uses.
- Font updates are manual, recorded in `src/assets/fonts/README.md`.
- Google Analytics still sends the reader's address to Google; this decision does not cover it.
- Licences travel with the files (SIL Open Font License, no restriction on self-hosting).

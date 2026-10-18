# 0038 · Verified WebP hero pairs

Status: accepted for implementation 2026-10-18, Michel requested all posts use WebP.

## Context

The site keeps stamped JPEG heroes on two owned media hosts. Same-name WebP twins reduce browser image transfer while JPEG remains the social image and format fallback. All 907 current heroes have verified twins. A picture element does not reliably fall back when a supported WebP returns a network error. Some future encodes may legitimately fail the quality floor and publish JPEG alone. Builds must remain independent of media-host availability.

## Decision

Keep post frontmatter and identities unchanged. Declare verified JPEG/WebP pairs in src/lib/hero-webp-catalog.ts and use a shared HeroImage component for article heroes, cards and homepage lead. The source element selects verified WebP; the img retains JPEG and existing image attributes. Explicit valid bot WebP inputs continue to work. Selection happens before local-media rewriting. Social cards, feeds, inline article images, author portraits and the default social card retain their existing URLs.

The deploy-time media check verifies both advertised objects for live posts. Unknown future JPEGs stay JPEG, preserving quality-floor fallback and article-only publisher permissions. Operators register a new pair only after uploading both files create-only and verifying public readback. The catalog is TypeScript under src/lib so the current Astro cache fingerprint includes it; no workflow or schema change is needed.

## Alternatives rejected

- Rewriting every published heroImage to WebP would require broadening original-media-host URL validation and unnecessarily changing published source data.
- Deriving a WebP for every JPEG without positive verification can render broken images for legitimate JPEG-only future submissions.
- Fetching image availability during builds would add a network dependency and make cached output depend on transient remote state.

## Consequences

All existing post heroes use their verified WebP on modern browsers and retain JPEG format fallback. A declared missing live image blocks deployment. Future original-media-host JPEG uploads require an operator catalog entry to select WebP; future explicit bot WebP submissions require no catalog edit. Existing source data and media objects remain intact.

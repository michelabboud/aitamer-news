# The navigation reads News, Columns and five topics; retired sections stay accepted as aliases

## Context

On 2026-09-28 Michel asked to refine the navigation: News as every post with pagination, a place for "our own writers' posts, humans and AI assistants, not bots", and the topics Dev, Tools, DevOps & IT and Rust, with Campfire possibly growing into forums. He asked for push-back on the wording.

The site had seven habitats: Models, Tools, Creative, Infra, Rust, Policy and Opinion. The habitat list is part of the published post contract (`/contract/post.schema.json`, version 1) that the desk bots and the posts server write against, and the posts server keeps a byte-for-byte copy of it pinned by hash.

## Decision

1. **Two reading views lead the navigation row: News and Columns.** They sort by how you read, not by topic, and a heavier rule separates them from the topics. News (`/news/`) is every post, newest first, 24 to a page. Columns (`/columns/`) is every post by a human editor or an AI writer (`isColumnist` in `src/lib/author-kinds.ts`); bots never write there.
2. **"Columns", not "Opinions".** Our writers publish analysis and explainers with sources, and the site's promise is verified versus claimed; calling that work "opinion" would undercut it. Opinion becomes a tag.
3. **Five topic habitats, plus General:** Models, Dev, Tools, DevOps & IT, Rust. Models stays: it held 11 of 29 posts. `general` holds what fits no topic (policy notes, desk announcements); it has a page but no navigation cell, and its posts are read through News.
4. **The retired habitats stay accepted as frontmatter aliases:** `creative` → tools, `infra` → devops, `policy` → general, `opinion` → general (`SECTION_ALIASES`). Parsing maps them, so the site only ever sees a habitat. The published contract only gained values and stays version 1. Their old URLs redirect (`LEGACY_SECTIONS`, `public/_redirects`).
5. **Only a human editor's piece tagged `opinion` may omit sources**, besides a withdrawn post, whose page shows only the withdrawal notice and makes no claim. The exemption used to follow the Opinion section, which any author could use; now bots and AI writers always cite.
6. **The deploys' Astro cache is keyed on everything the content schema can import** (`src/content.config.ts`, `src/content/`, `src/lib/`, and the lockfile). Astro does not re-parse an unchanged post when the schema changes, so a cache restored across this change kept an old `section` value and failed the build. The first cut named four files by hand and missed the comment and reaction schemas and `wildness.ts` (Ari's review, 2026-09-28); the test now walks the schema's real imports.

## Alternatives rejected

- **Drop Models.** It is the site's largest section and what readers come for.
- **Name the writers' view "Opinions".** See decision 2.
- **Break the contract: remove the old values and publish version 2.** Every writer would have had to change on the same day. Aliases cost one small map and keep old writers working.
- **Forums in Campfire now.** A forum needs accounts, spam defence, daily moderation, legal duties for user content and a server; the site is static. Campfire stays the comments hub; a hosted forum can plug in if comments show demand.

## Consequences

- The posts server (atn-ops, `posts-core`) must re-vendor the contract from the live site after this deploys, pin the new hash, and replace its `SECTION_WITHOUT_SOURCES = "opinion"` rule. Until then it rejects the new names (the aliases keep it working) and its sources pre-check is looser than the site's, which stays the gate.
- One post, `made-on-youtube-2026-gemini-ask-studio`, keeps `section: creative` on purpose: its rendered-body exemption holds only while the file is byte-identical, and the alias files it under Tools.
- A new author kind must say whether it writes Columns (the record in `author-kinds.ts` makes it choose).
- 2026-10-01: the older desk names (`data`, `databases`, `video`, `image`) also joined `SECTION_ALIASES` with the same targets as `LEGACY_SECTIONS`, so frontmatter using those names parses; `top` stays URL-only.

## Status

Accepted 2026-09-28 (Michel: "I agree, please implement", on the lineup proposed that day).

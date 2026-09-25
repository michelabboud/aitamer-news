# The Bestiary theme

**The Bestiary** is the production theme for aitamer.news (since 0.2.0). It takes the name literally: AI Tamer is a night-shift field station that catalogues wild machines. Each story is a **sighting** with a specimen number, a habitat, and a wildness rating. The dark field makes the cut-paper cover art stand out.

Source: Claude Design handoff, "AI Tamer Concept 2 – Bestiary" (desktop home 2a, mobile home 2b, language sheet 2s). It replaces the Big Top daylight theme (0.1.x).

## Tokens

All in `src/styles/bestiary-tokens.css`; the shell is `src/styles/global.css`.

| Token | Value | Use |
|---|---|---|
| night | `#111513` | page background |
| night-raised | `#1a201c` | panels, inputs |
| line / line-strong | `#2c3530` / `#3a443e` | rules, borders |
| bone | `#ece6d6` | text, strong rules, the specimen tag |
| ink-soft / ink-muted | `#c4c9c2` / `#9aa39b` | secondary text, mono labels |
| ember / ember-text | `#ff7a45` / `#ff8a57` | the one accent: links, kickers, Extinction Watch |
| bot / bot-field | `#9cc3ff` / `#1b2536` | "BOT" bylines |
| human / human-field | `#f2c46b` / `#2a2314` | "HUMAN" bylines |
| wild-1 … wild-5 | `#8fd4a0` `#c9d27a` `#f2c46b` `#ff9a5c` `#ff5f3d` | the wildness meter, tamed → wild |

Fonts (Google Fonts): **Gloock** for headlines, **Hanken Grotesk** for reading, **IBM Plex Mono** for the field data (codes, times, labels). Corners are 2–3px. No gradients; one drop shadow, on the paper specimen tag.

## Vocabulary

| Word | What it is | Where it comes from |
|---|---|---|
| Sighting | A story | a post |
| Specimen No. | A citable number, `0001` upward | publish order (`specimenNumbers` in `src/lib/bestiary.ts`) |
| Habitat (H1–H7) | A section | groups the ten desks, display only (`HABITATS` in `src/lib/bestiary.ts`) |
| Wildness 1–5 | How verified the claims are | `wildness`, `wildnessTamed`, `wildnessWild` frontmatter |
| Tamer's verdict | One line: so what, for whom | `verdict` frontmatter |
| Extinction Watch | Shutdowns, counted down | `sunset` frontmatter |
| The Campfire | Comments | Disqus threads under each story |

### Habitats

| Code | Habitat | Desks (`section`) |
|---|---|---|
| H1 | Models | `top`, `models` |
| H2 | Tools | `tools` |
| H3 | Creative | `image`, `video` |
| H4 | Infra | `data`, `databases` |
| H5 | Rust | `rust` |
| H6 | Policy | `policy` |
| H7 | Opinion | `opinion` |

Frontmatter keeps the ten desks, so the bots are unaffected. `/habitat/<slug>/` lists a habitat, and `/section/<desk>/` still lists one desk.

### Specimen numbers

Counted from the oldest published post, ties broken like the listings. A number stays put as long as posts are not backdated or unpublished. The publish-time rules in `POST.md` already forbid backdating. Unpublishing a post shifts every newer number by one.

### Wildness scale

1. **Tamed:** independently verified, or plain fact from official records (laws, release tags, docs).
2. **Mostly tamed:** key facts confirmed in primary sources; minor claims rest on the vendor.
3. **Partly tamed:** the facts are in the docs, but the headline benefit (speed, cost, quality) is a vendor claim.
4. **Still wild:** mostly vendor or author claims: vendor-run benchmarks, preprints.
5. **Wild:** vendor claim or self-published result only.

The rating is about the claims, not the product. It is shown on the About page (`/about/#wildness`).

## Layout

- **Station bar** (wide screens): status, the reader's current UTC time (client-side), station links.
- **Masthead:** the wordmark. On the home page, the big 148px masthead with tagline and counts.
- **Habitat nav:** seven cells plus Extinction Watch; on phones a sideways strip of chips. Only the home page shows post counts. Other pages keep no build-time counts in the shell, so the incremental build cache stays valid when an unrelated post lands.
- **Phone tab bar:** Log, Habitats, Extinction, Campfire.
- Days left on Extinction Watch are counted at build time and recounted in the browser (`ExtinctionList.astro`), because the page is static.

Not built yet (they need a backend): search (⌘K), the Morning Leash newsletter, a forum beyond Disqus.

## Section covers

House-owned SVGs at `public/covers/{slug}.svg` for every `ALL_SECTIONS` desk.

| slug | motif |
|------|--------|
| top | rings |
| models | stacked layers |
| tools | modular blocks |
| image | overlapping lenses |
| video | film + play |
| data | bars |
| databases | cylinders |
| rust | hex nuts |
| policy | columns |
| opinion | speech bubbles |

**Legal:** original house SVG art — not stock photos, not third-party logos. Caption: “Generated cover art (X motif). Not a photo.”

Regenerate: `python3 scripts/generate-covers.py`

`src/lib/covers.ts` maps sections → paths; `postCover(post)` prefers custom `heroImage`.

## Scope

The Bestiary applies to the main site. The contact Worker's fallback error page (`workers/contact/src/handler.mjs`) still uses the 0.1.x colours; see `BACKLOG.md`.

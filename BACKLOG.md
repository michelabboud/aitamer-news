# Backlog

Dated one-liners for everything deferred or spotted and not done. Format: `date · source · status — item`.

- 2026-09-25 · publish times · open — Three launch posts went live on 2026-09-23 but are dated earlier, so they carry 00:00 UTC: `welcome-to-aitamer`, `open-weights-roundup`, `policy-watch-transparency`. An editor should set the real time or correct the date.
- 2026-09-25 · publish times · open — The bot pipeline (private `aitamer-news-ops`) must run `npm run stamp` before committing a published post, or the deploy stops at `check:times`. Mirror the rule into its copy of `docs/posting-standards.md`.
- 2026-09-25 · contact form · done 2026-09-25 — the branch re-allocated to 0.1.5 when it merged.
- 2026-09-25 · archive · open — A month page lists every story that month; paginate it (and the desk and author pages) before a month holds a few hundred posts. Number archive pages oldest-first so old pages stay cached.
- 2026-09-25 · pipeline · idea — The posts MCP (new / update / remove) should implement `POST.md` exactly: immutable slug, `npm run stamp` on publish, `updatedDate` on edit, hero JPEG at `public/heroes/<slug>.jpg`.
- 2026-09-25 · CI · idea — Add Dependabot for GitHub Actions and npm so version bumps arrive as pull requests instead of by hand.
- 2026-09-25 · contact form · open — Turn on Turnstile: create a widget for aitamer.news, set `TURNSTILE_SITE_KEY` in `src/lib/site.ts` and the Worker secret `TURNSTILE_SECRET_KEY` together. The code is ready and tested.
- 2026-09-25 · contact form · open — Confirm on the first deploy that the free plan accepts the Workers rate-limit binding. If not, add a WAF rate-limiting rule on `contact.aitamer.news` and revisit the fail-closed check.
- 2026-09-25 · About page · open — `src/content/authors/desk-bot.md` says drafts go "for human review before publish", but the posting standards waive the human gate when Fact, Legal and SEO clear. Editorial should make the bio match practice.
- 2026-09-25 · layout · done 2026-09-25 (0.2.0) — On a phone the sticky header (nav + ten desk pills on four rows) covers about 45% of the screen. Make the pill row scroll sideways or collapse on small screens.
- 2026-09-25 · contact review · open — Honeypot uses `autocomplete="new-password"`; a password manager might offer to fill it and silently drop a real note. Test with 1Password/Bitwarden/Chrome and pick the attribute that no manager fills.
- 2026-09-25 · contact review · dropped 2026-09-25 (0.2.0, night theme removed) — Night theme (not shipped): the Publish node's white text on the night rose and `--bot` success text on the night card fail contrast. Fix before ever shipping night.
- 2026-09-25 · Bestiary · open — Editorial should review the drafted wildness ratings and verdicts on the 25 launch posts (0.2.0). Unsure calls: `welcome-to-aitamer` (1), `policy-watch-transparency` and `open-weights-roundup` (4, house pieces the scale does not fit well), `gpt-6-sol-luna-api-pricing` and `grok-4-7` (2, one independent eval), `zerodrift-anchor-3` (4 or 3).
- 2026-09-25 · Bestiary · open — The bot pipeline (`aitamer-news-ops`) should write `wildness`, `wildnessTamed`, `wildnessWild`, `verdict` and, for shutdowns, `sunset` on every new post; mirror the fields into its copy of `docs/posting-standards.md`.
- 2026-09-25 · Bestiary · idea — Parts of the design not built because they need a backend: ⌘K search (Pagefind would do it statically), the Morning Leash newsletter and extinction alerts by email, a real forum for the Campfire (giscus or Discourse).
- 2026-09-25 · Bestiary · idea — The design's specimen tag carries a short name ("Claude Opus 5.5"). An optional `specimen` short-name field would add it; the tag shows number and habitat meanwhile.
- 2026-09-25 · Bestiary · open — The contact Worker's fallback error page still uses the Big Top colours and fonts. Restyle it with the next Worker change (it redeploys the Worker).
- 2026-09-25 · Bestiary · idea — Footer legal column lists Terms and Privacy only. The design also shows cookie settings, an AI disclosure and a copyright/takedown page; they need real legal text first.

# Backlog

Dated one-liners for everything deferred or spotted and not done. Format: `date · source · status — item`.

- 2026-09-25 · publish times · open — Three launch posts went live on 2026-09-23 but are dated earlier, so they carry 00:00 UTC: `welcome-to-aitamer`, `open-weights-roundup`, `policy-watch-transparency`. An editor should set the real time or correct the date.
- 2026-09-25 · publish times · open — The bot pipeline (private `aitamer-news-ops`) must run `npm run stamp` before committing a published post, or the deploy stops at `check:times`. Mirror the rule into its copy of `docs/posting-standards.md`.
- 2026-09-25 · contact form · done 2026-09-25 — the branch re-allocated to 0.1.5 when it merged.
- 2026-09-25 · archive · open — A month page lists every story that month; paginate it (and the desk and author pages) before a month holds a few hundred posts. Number archive pages oldest-first so old pages stay cached.
- 2026-09-25 · pipeline · idea — The posts MCP (new / update / remove) should implement `POST.md` exactly: immutable slug, `npm run stamp` on publish, `updatedDate` on edit, hero JPEG at `public/heroes/<slug>.jpg`.
- 2026-09-25 · CI · idea — Add Dependabot for GitHub Actions and npm so version bumps arrive as pull requests instead of by hand.
- 2026-09-25 · contact form · open — Add Cloudflare Turnstile (free bot check) and a WAF rate-limiting rule on `/api/contact`. Turnstile needs a widget created in the dashboard (site key public, secret as a Pages secret).
- 2026-09-25 · About page · open — `src/content/authors/desk-bot.md` says drafts go "for human review before publish", but the posting standards waive the human gate when Fact, Legal and SEO clear. Editorial should make the bio match practice.
- 2026-09-25 · layout · open — On a phone the sticky header (nav + ten desk pills on four rows) covers about 45% of the screen. Make the pill row scroll sideways or collapse on small screens.

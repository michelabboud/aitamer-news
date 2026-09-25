# Backlog

Dated one-liners for everything deferred or spotted and not done. Format: `date · source · status — item`.

- 2026-09-25 · publish times · open — Three launch posts went live on 2026-09-23 but are dated earlier, so they carry 00:00 UTC: `welcome-to-aitamer`, `open-weights-roundup`, `policy-watch-transparency`. An editor should set the real time or correct the date.
- 2026-09-25 · publish times · open — The bot pipeline (private `aitamer-news-ops`) must run `npm run stamp` before committing a published post, or the deploy stops at `check:times`. Mirror the rule into its copy of `docs/posting-standards.md`.
- 2026-09-25 · contact form · open — `feat/contact-form` also claims VERSION 0.1.1; `main` took 0.1.1 first, so the branch re-allocates when it merges.
- 2026-09-25 · archive · open — A month page lists every story that month; paginate it (and the desk and author pages) before a month holds a few hundred posts. Number archive pages oldest-first so old pages stay cached.
- 2026-09-25 · pipeline · idea — The posts MCP (new / update / remove) should implement `POST.md` exactly: immutable slug, `npm run stamp` on publish, `updatedDate` on edit, hero JPEG at `public/heroes/<slug>.jpg`.
- 2026-09-25 · CI · idea — Add Dependabot for GitHub Actions and npm so version bumps arrive as pull requests instead of by hand.

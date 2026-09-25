# Backlog

Dated one-liners for everything deferred or spotted and not done. Format: `date · source · status — item`.

- 2026-09-25 · publish times · open — Three launch posts went live on 2026-09-23 but are dated earlier, so they carry 00:00 UTC: `welcome-to-aitamer`, `open-weights-roundup`, `policy-watch-transparency`. An editor should set the real time or correct the date.
- 2026-09-25 · publish times · open — The bot pipeline must run `npm run stamp` before committing a published post, and commit the specimen ledger with it, or the checks stop at `check:posts` (on the pull request, and again in the deploy).
- 2026-09-25 · contact form · done 2026-09-25 — the branch re-allocated to 0.1.5 when it merged.
- 2026-09-25 · archive · open — A month page lists every story that month; paginate it (and the desk and author pages) before a month holds a few hundred posts. Number archive pages oldest-first so old pages stay cached.
- 2026-09-25 · pipeline · idea — The posts MCP (new / update / remove) should implement `POST.md` exactly: immutable slug, `npm run stamp` on publish, `updatedDate` on edit, hero JPEG at `public/heroes/<slug>.jpg`.
- 2026-09-25 · CI · idea — Add Dependabot for GitHub Actions and npm so version bumps arrive as pull requests instead of by hand.
- 2026-09-25 · contact form · open — Turn on Turnstile: create a widget for aitamer.news, set `TURNSTILE_SITE_KEY` in `src/lib/site.ts` and the Worker secret `TURNSTILE_SECRET_KEY` together. The code is ready and tested.
- 2026-09-25 · contact form · open — Confirm on the first deploy that the free plan accepts the Workers rate-limit binding. If not, add a WAF rate-limiting rule on `contact.aitamer.news` and revisit the fail-closed check.
- 2026-09-25 · About page · done 2026-09-25 — `src/content/authors/desk-bot.md` said drafts go "for human review before publish", which didn't match practice. Bio now says the desk's research and legal checks run first, with a human editor reviewing only when confidence is low.
- 2026-09-25 · layout · open — On a phone the sticky header (nav + ten desk pills on four rows) covers about 45% of the screen. Make the pill row scroll sideways or collapse on small screens.
- 2026-09-25 · contact review · open — Honeypot uses `autocomplete="new-password"`; a password manager might offer to fill it and silently drop a real note. Test with 1Password/Bitwarden/Chrome and pick the attribute that no manager fills.
- 2026-09-25 · contact review · open — Night theme (not shipped): the Publish node's white text on the night rose and `--bot` success text on the night card fail contrast. Fix before ever shipping night.
- 2026-09-25 · specimens · open — Two posts stamped on separate branches can take the same number. Since fix lane F1 (2026-09-25), `check-posts.yml` catches it on the pull request, before it reaches `main`, and POST.md section 4 gives the append-only repair (a `void` ledger line). Still open: issue numbers only on `main`, in one serialised step (a CI job with its own concurrency group, or atn-mcp as the only writer), so collisions cannot happen at all.
- 2026-09-25 · specimens (fix lane F1) · open — A renamed post file has no repair procedure: the check reports "specimen N belongs to old-slug". Define one (for example an append-only rename line in the ledger) before atn-mcp can rename posts.
- 2026-09-25 · CI (fix lane F1) · open — The disabled `deploy-github-pages.yml` still runs `check:times`, not `check:posts`, and still triggers on push. Update it, or delete it if it stays retired.

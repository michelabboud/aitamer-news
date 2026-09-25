# Changelog

All notable changes to aitamer.news. The version lives in `VERSION`; each task is tagged `checkpoint/<VERSION>`.

## [0.1.1] — 2026-09-25

### Added
- Contact form on the About page. `functions/api/contact.js` (a Cloudflare Pages Function on `POST /api/contact`) validates the note and emails the desk through the `EMAIL` send_email binding; the recipient is the Pages secret `CONTACT_TO`. Nothing is stored. Decision: `docs/adr/0001-contact-form-uses-cloudflare-email.md`.
- `npm test` — seven tests for the contact function (validation, honeypot, origin checks, failed sends, redirects).
- Footer link to the contact form; privacy and terms pages describe what the form sends.

### Changed
- `wrangler.toml` is now the Pages project configuration (`pages_build_output_dir`) and declares the email binding. It replaces the old static-assets preview config.
- The Cloudflare deploy runs `npm test` before building, installs with `npm ci`, caches npm, and pins Wrangler to 4.139.0.
- `package-lock.json` is committed, so installs are reproducible.

### Fixed
- The "The desk has your note." banner no longer reappears when the About page is reloaded after a plain form submit.

 — 2026-09-25

Baseline. Versioning starts here; everything before it is in `git log` (commits up to `63e4065`).

### Added
- Standard repository files: `VERSION`, `CHANGELOG.md`, `PROGRESS.md`, `ARCHITECTURE.md`, `PLAN.md`, `HANDOFF.md`, `BACKLOG.md`, `.env.example`, `LICENSE` (all rights reserved).

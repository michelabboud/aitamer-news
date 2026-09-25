# Contact notes go out through Cloudflare Email

## Context

The About page needs a contact form. The site is a static Astro build uploaded to Cloudflare Pages, with a second static copy on GitHub Pages. GitHub Pages cannot run server code. The desk should receive one email per note and should not stand up a database of messages.

## Decision

`functions/api/contact.js` is a Cloudflare Pages Function on `POST /api/contact`. It validates the note and sends one plain-text message with the Workers `send_email` binding. The From address is `desk@aitamer.news`. The visitor's address is Reply-To. The recipient is the Pages secret `CONTACT_TO`, which must be a verified Email Routing destination. The static pages, including the GitHub Pages copy, post to `https://aitamer.news/api/contact`.

`wrangler.toml` sets `pages_build_output_dir`, so the next Pages deploy treats that file as the project's configuration and uploads the email binding with the site.

## Alternatives rejected

- A form host such as Formspree. It works, and it adds another company that stores the note. The site is already on Cloudflare, and Cloudflare can send the mail.
- The Astro Cloudflare adapter, so the whole site becomes a Worker. One form does not justify giving up the static upload or the incremental HTML cache.
- Paid Email Sending to arbitrary recipients. The form only writes to the desk. The free path is Email Routing to one verified destination.
- Putting the recipient address in the repository. The secret stays on the Pages project.

## Consequences

- The domain must be onboarded (MX, SPF, and DKIM) before a live send succeeds. `aitamer.news` had no mail records when this was chosen, so onboarding does not replace an existing mailbox.
- Until `CONTACT_TO` is set, the function returns "Contact is not set up yet." and does not pretend the note was sent.
- A hidden company field drops bot posts. That is not a substitute for Cloudflare Turnstile, which needs a widget created in the account.
- Another website cannot submit: a browser `Origin` outside the site, its `www` host, the GitHub Pages host, or a local wrangler host is rejected.

## Status

Accepted 2026-09-25. Live sending still waits on domain onboarding and the `CONTACT_TO` secret.

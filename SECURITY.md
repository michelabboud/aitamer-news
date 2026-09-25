# Security

## Reporting a vulnerability

Please report security problems privately, not in a public issue:

- **Preferred:** GitHub's private vulnerability reporting on this repository (Security tab → "Report a vulnerability").
- **Or, once it is open:** the contact form at https://aitamer.news/about/#contact, marked "Security".

Include what you found, where (URL, file, or commit), and how to reproduce it. You will get an answer within a few days. Please give us reasonable time to fix a problem before disclosing it.

## Supported versions

Only the site as currently deployed at https://aitamer.news, built from `main`, is supported.

## In scope

- The static site at aitamer.news and its build (`src/`, `scripts/`, `astro.config.mjs`), including injection through post content, feeds, structured data and search.
- The contact Worker at `contact.aitamer.news` (`workers/contact/`): abuse, rate-limit bypass, header injection, anything that makes it send mail it should not.
- The GitHub Actions workflows (`.github/workflows/`) and anything that could expose a deploy secret.

## Trust model

Posts are written by the desk's own bots, the posts tool and editors, all trusted writers. The post contract (`POST.md`, strict JSON Schema) blocks malformed data and dangerous link schemes, and everything rendered from frontmatter is escaped; but Markdown bodies may contain raw HTML by design, so a writer with commit access can publish arbitrary markup. Protection against that sits upstream: only the maintainer can push, and pull requests from outside run no deploy.

## Out of scope

- Findings that need a compromised maintainer account or machine.
- Third-party services the site loads (Disqus, Google Analytics, Google Fonts, YouTube when a reader presses play): report those to the vendor.
- Denial of service by traffic volume; Cloudflare handles that layer.
- Missing security headers or best-practice notes with no demonstrated impact (still welcome as ordinary issues).

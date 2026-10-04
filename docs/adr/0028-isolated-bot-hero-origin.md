# ADR 0028: Isolated bot hero origin

Date: 2026-10-04
Status: Accepted; extends ADRs 0020 and 0024.

## Context

Michel provisioned `bots.aitamer.news` for a separate R2 bucket and gave its upload credentials to Grok. Existing media validation admitted only `media.aitamer.news`; accepting the new domain requires a repository change before bot posts can pass checks.

## Decision

Allow exactly `https://bots.aitamer.news/heroes/<own-post-slug>-<8 lowercase hex>.jpg` in addition to existing media URLs. Preserve the original media host, legacy names, share card and redirects. Validate each live hero by requesting the origin the post actually names; an identical key in the main bucket cannot satisfy a bot-bucket check. Keep the existing build, preflight, media and deployment safeguards. No queue admission reactivation, GitHub path-guard change or inline-body image policy change.

## Alternatives

Staging images through the publisher protects the main bucket but adds a promotion step; Michel chose a public bot origin. Accepting arbitrary image domains weakens the exact site-media boundary and is unnecessary. Replacing the existing origin would break current posts.

## Consequences

Bots can upload their hero directly to their own bucket and refer to their public URL. Bucket-scoped credentials isolate existing media; conditional PUTs prevent accidental overwrites when followed, but are not an enforced create-only credential. A missing live bot hero blocks deployment. Existing GitHub permissions still govern who can submit or merge a post. The bot origin is for frontmatter heroes; Markdown inline image policy is unchanged. No new dependency or service is installed by this change.

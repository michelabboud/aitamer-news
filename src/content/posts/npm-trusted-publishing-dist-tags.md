---
title: npm trusted publishing can opt in to dist-tag changes
description: GitHub's 30 September 2026 changelog adds an opt-in Allow npm dist-tag permission on trusted publishing, so an OIDC workflow can move latest, next, or beta without a long-lived token. It defaults to off.
pubDate: "2026-10-05T13:00:00Z"
section: devops
subsection: registries
tags:
  - npm
  - trusted-publishing
  - oidc
  - supply-chain
  - github
draft: false
heroImage: https://bots.aitamer.news/heroes/npm-trusted-publishing-dist-tags-b1949f06.jpg
heroAlt: Tan paper package tied with twine holds a blank slate-blue tag and a blank tan ticket on ivory ground with paper hills.
author: desk-bot
wildness:
  rating: 2
  verified: "30 Sep changelog: opt-in name, default off, independence from publish, OIDC match rule"
  claimed: No further behavior is stated beyond that page
verdict: Turn on Allow npm dist-tag only on the workflows that should move latest or next. Existing tokens still work, and the switch is off until you enable it.
sources:
  - title: Opt-in dist-tag permissions for npm trusted publishing (GitHub changelog, 30 September 2026)
    url: https://github.blog/changelog/2026-09-30-opt-in-dist-tag-permissions-for-npm-trusted-publishing
---

GitHub's changelog for [30 September 2026](https://github.blog/changelog/2026-09-30-opt-in-dist-tag-permissions-for-npm-trusted-publishing) says an npm trusted-publishing configuration can be granted permission to manage dist-tags. That covers promoting a version to `latest` and moving `next` or `beta`, using the short-lived OIDC credential from the workflow instead of a long-lived access token. The post says trusted publishing already covered publishing and staging, and that tag changes were the gap that kept a granular token around after a release or a rollback.

## Defaults and scope

Each trusted-publishing configuration has an opt-in setting named Allow npm dist-tag. It defaults to off for new configurations and for ones that already exist, so turning the feature on in the product does not give every workflow new rights. The permission is separate from the right to publish a package. A configuration that can only stage a release can still be allowed to move tags. GitHub says a tag operation is authorized when the incoming OIDC token matches any one configuration that has the permission enabled. Token-based tag management is unchanged.

The setup step on the page is: open the package's trusted publishing settings and enable Allow npm dist-tag on the configurations that should manage tags. The post does not show a CLI flag or a JSON field name. It points to GitHub's existing documentation on trusted publishers for npm.

## Practical takeaway

If your release workflow still stores an npm token only to run `npm dist-tag` after publish, this is the opt-in that removes that token, on the configurations you mark. Leave it off where a workflow should publish or stage without being able to move `latest`. Because any one matching configuration is enough, review every trusted-publisher entry on the package, not only the one you use for production.

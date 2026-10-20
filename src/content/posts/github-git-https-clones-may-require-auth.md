---
title: GitHub may ask anonymous HTTPS clones of public repos to sign in during traffic spikes
description: GitHub may require sign-in for some anonymous HTTPS clones and fetches of public repos during unusual traffic. SSH, pushes and authenticated Git still work.
pubDate: "2026-10-20T05:07:00Z"
specimen: 921
section: tools
subsection: git
tags:
  - github
  - git
  - authentication
  - ci-cd
  - agents
draft: false
heroImage: https://bots.aitamer.news/heroes/github-git-https-clones-may-require-auth-85968d1c.jpg
heroAlt: A cut-paper slate-blue turnstile stands on a sand paper path leading to a cream filing cabinet with open drawers, as a paper parcel with a yellow key sits on the path past the turnstile while three plain parcels wait behind a rust-red rope between two posts.
author: desk-bot
wildness:
  rating: 1
  verified: Scope, exemptions, all-plans coverage and fixes are in GitHub's changelog and docs
  claimed: Narrow targeting is GitHub's own description; it publishes no signals, durations or error text
verdict: Public repos stay public, and anonymous HTTPS clones of them are now best effort. Put a token on every unattended clone, from CI to agent sandboxes, and treat an auth failure on a public repo as retryable.
sources:
  - title: Some Git over HTTPS may temporarily require authentication (GitHub changelog, 19 October 2026)
    url: https://github.blog/changelog/2026-10-19-some-git-over-https-may-temporarily-require-authentication/
  - title: About authentication to GitHub (GitHub Docs)
    url: https://docs.github.com/authentication/keeping-your-account-and-data-secure/about-authentication-to-github
  - title: Managing remote repositories (GitHub Docs)
    url: https://docs.github.com/get-started/git-basics/managing-remote-repositories
  - title: Authenticating as a GitHub App installation (GitHub Docs)
    url: https://docs.github.com/en/apps/creating-github-apps/authenticating-with-a-github-app/authenticating-as-a-github-app-installation
  - title: actions/checkout action.yml, token input (GitHub)
    url: https://github.com/actions/checkout/blob/main/action.yml
  - title: gh auth setup-git (GitHub CLI manual)
    url: https://cli.github.com/manual/gh_auth_setup-git
---

An anonymous `git clone` of a public GitHub repository is no longer guaranteed to work every time. In a [changelog entry](https://github.blog/changelog/2026-10-19-some-git-over-https-may-temporarily-require-authentication/) published on October 19, 2026, GitHub says that "during periods of unusual traffic" it may temporarily require authentication for some clones and fetches of public repositories over HTTPS, "to help protect github.com's availability." The protection applies to repositories on github.com across all plans.

## What changes, and for whom

Only unauthenticated HTTPS clones and fetches of public repositories can be hit. GitHub lists four things that are unaffected: authenticated Git operations over HTTPS, Git operations over SSH, pushes, and unrelated GitHub web and API traffic.

GitHub says it applies the protection "as narrowly as possible using signals associated with anomalous traffic." It also concedes that legitimate and anomalous traffic can share those signals, so "legitimate unauthenticated operations may occasionally be affected." It stresses that this is "not a general authentication requirement for public repositories."

An affected operation fails "with a message indicating that authentication is required." GitHub does not publish the exact error text, the traffic signals or thresholds, or how long a protection window lasts. "Temporarily" is not defined beyond the advice that you can wait and retry without authentication "after the temporary protection has been lifted." The entry names no specific incident or traffic source behind the change.

## The fix GitHub recommends

Authenticate and retry. For automation, the changelog gives three cases:

- **GitHub Actions:** use the built-in `GITHUB_TOKEN`.
- **Other CI systems:** prefer a GitHub App installation access token; a personal access token also works.
- **Jobs that cannot authenticate:** retry after the protection is lifted.

## What to do now

**On your own machine.** GitHub's [authentication docs](https://docs.github.com/authentication/keeping-your-account-and-data-secure/about-authentication-to-github) say HTTPS Git takes a personal access token or a credential helper such as Git Credential Manager, or sign-in through GitHub CLI. If you use `gh`, [`gh auth setup-git`](https://cli.github.com/manual/gh_auth_setup-git) makes it Git's credential helper for the hosts you are logged in to. Or switch the remote to SSH, as the [remote URL guide](https://docs.github.com/get-started/git-basics/managing-remote-repositories) shows: `git remote set-url origin git@github.com:OWNER/REPOSITORY.git`. The docs warn that some firewalls and proxies block SSH.

**In GitHub Actions.** `actions/checkout` already fetches with the workflow token by default, per its [action definition](https://github.com/actions/checkout/blob/main/action.yml). Look instead for bare `git clone https://github.com/...` lines in scripts, Dockerfiles and submodule steps. The changelog does not say whether sending `GITHUB_TOKEN` on a clone of someone else's public repository is enough. GitHub's authentication docs say that token can only access resources within the repository that contains the workflow, and point to a personal access token or a GitHub App beyond that.

**In other CI, and in agent sandboxes.** Give the job a GitHub App installation token. GitHub's [App docs](https://docs.github.com/en/apps/creating-github-apps/authenticating-with-a-github-app/authenticating-as-a-github-app-installation) show it used as the HTTP password, as in `https://x-access-token:TOKEN@github.com/owner/repo.git`, and note it expires after one hour, so mint it per job. Keep tokens out of logs and out of anything the agent can echo back. An agent that clones public repositories without credentials is making exactly the kind of unauthenticated request this protection can stop.

**Everywhere.** Our suggestion, not GitHub's: treat an authentication failure on a public clone as retryable, back off and retry, and cache or mirror the dependencies you pull often so a protection window does not stall a build.

## Why it matters

Plenty of build scripts assume public means anonymous forever. GitHub now says, in writing, that this assumption can fail while a protection is active. Adding a token is a few lines; finding out during a release is not.

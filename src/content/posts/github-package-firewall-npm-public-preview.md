---
title: "GitHub's package firewall checks npm installs for agents and CI before the code lands"
description: "In preview for GitHub Enterprise Cloud, it blocks malware, risky versions, new install scripts and too-fresh npm packages before agents or CI install them."
pubDate: "2026-10-24T07:07:00Z"
section: devops
subsection: security
tags:
  - github
  - supply-chain
  - npm
  - ci
  - coding-agents
  - security
draft: false
heroImage: "https://bots.aitamer.news/heroes/github-package-firewall-npm-public-preview-19ba3d4f.jpg"
heroAlt: "Paper parcels ride a conveyor through a slate-blue gate with a turnstile, while one parcel waits in a sand tray beside a rust hourglass."
author: desk-bot
wildness:
  rating: 2
  verified: "GitHub's 20 October changelog (rewritten 21 October) and the package firewall setup docs, read 24 October."
  claimed: "GitHub has not said what it will charge at general availability, only that pricing will be metered."
verdict: "Worth turning on if you run GitHub Enterprise Cloud and let agents or CI install npm packages. Start with the defaults, then raise the vulnerability bar and the package age once you see what gets blocked."
sources:
  - title: "GitHub package firewall in public preview (GitHub Changelog, 20 October 2026, rewritten 21 October)"
    url: https://github.blog/changelog/2026-10-20-github-package-firewall-in-public-preview/
  - title: "Protecting endpoints with GitHub package firewall (GitHub Docs)"
    url: https://docs.github.com/enterprise-cloud@latest/code-security/how-tos/secure-your-supply-chain/secure-your-dependencies/protecting-endpoints-with-package-firewall
---

GitHub has put a [package firewall](https://github.blog/changelog/2026-10-20-github-package-firewall-in-public-preview/) into public preview. It sits between your machines and the npm registry and checks each package download against your enterprise's policy before it reaches the endpoint. The changelog went up on 20 October and GitHub rewrote it for clarity a day later.

GitHub's reasoning is a "recent flood" of malware that strikes at install time. It says agents and CI runners are especially exposed, because they install dependencies "without a human in the loop." The firewall checks both the metadata requests for package lists and the actual downloads.

## Who can use it

- GitHub Enterprise Cloud customers, including Enterprise Cloud with data residency.
- npm packages only, for now.
- Free during the preview. At general availability it will be billed on metered usage, similar to Actions billing, with no price yet.

## The five controls

Enterprise owners and security managers set these under the enterprise's Policies, then Package firewall, per the [setup docs](https://docs.github.com/enterprise-cloud@latest/code-security/how-tos/secure-your-supply-chain/secure-your-dependencies/protecting-endpoints-with-package-firewall):

| Control | What it blocks | Default |
| --- | --- | --- |
| Block known malware | Packages with an active malware advisory in the GitHub Advisory Database | On |
| Block vulnerability advisories | Versions with an advisory at or above a severity you pick | Critical only |
| Block attestation downgrades | Versions without SLSA attestations when earlier versions had them | On |
| Block newly-introduced install scripts | Packages that recently added `preinstall` or `postinstall` scripts | On |
| Minimum package age | Versions newer than a cooldown of 1 to 365 days (0 turns it off) | 1 day |

The last two target the pattern behind many recent npm attacks: a hijacked maintainer account pushes a fresh version with a new install script, and it gets pulled in within hours. A cooldown gives the ecosystem time to spot it first.

## Pointing npm at it

Each enterprise gets its own registry URL. Put it in your user-level `.npmrc`, with a token from a user or bot account in the enterprise. The token needs no more than read-only access to public repositories:

```ini
registry=https://package-firewall.githubapp.com/npm/enterprises/ENTERPRISE
//package-firewall.githubapp.com/npm/enterprises/ENTERPRISE/:_authToken=${GITHUB_TOKEN}
```

Replace `ENTERPRISE` with your enterprise slug and keep the token in a CI secret, not in the repo. You can also route JFrog Artifactory through the firewall with a remote npm repository. GitHub labels that path experimental and says to drop any remotes that reach the public registry directly, or they bypass the firewall.

## When it blocks something you need

A blocked install prints a link in the npm output or CI log to request an exception. The docs' own example is a new version with a security fix that the age rule holds back. Enterprise admins and security managers review requests under Security and quality, then Package firewall bypass, and can allow one version or all of them. A custom role can carry the "Edit enterprise-level package firewall policy" permission if someone else should own the policy.

## Practical takeaway

If you are on Enterprise Cloud, route one CI runner and your coding agents through the firewall first, keep the defaults, and read the block log for a week. Then decide on a longer cooldown and a stricter severity bar. If you are not on Enterprise Cloud, pinned lockfiles and a cooldown in your package manager, such as pnpm's `minimumReleaseAge`, cover part of the same ground.

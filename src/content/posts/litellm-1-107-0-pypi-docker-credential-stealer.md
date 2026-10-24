---
title: "LiteLLM 1.107.0 shipped a credential stealer on PyPI and Docker. Pin 1.106.2 and rotate keys"
description: "Poisoned LiteLLM 1.107.0 wheels and images stole cloud, SSH and AI keys, plus provider keys stored in the proxy database. What happened and what to do."
pubDate: "2026-10-21T19:37:00Z"
specimen: 967
section: devops
subsection: security
tags:
  - security
  - supply-chain
  - litellm
  - pypi
  - docker
draft: false
heroImage: "https://bots.aitamer.news/heroes/litellm-1-107-0-pypi-docker-credential-stealer-e0f1a46e.jpg"
heroAlt: "Paper-cut illustration of a delivery crate on a conveyor with a hooked wire sneaking out of its lid toward a ring of keys on a board."
author: desk-bot
wildness:
  rating: 3
  verified: "LiteLLM security issue and statements, Wiz analysis, PyPI JSON (1.107.0 gone, latest 1.106.2)."
  claimed: "The token-leak account is LiteLLM's and partly unconfirmed. Payload analysis is Wiz's and Upwind's."
verdict: "If any machine or container ran LiteLLM 1.107.0, treat every secret it could reach as stolen, including the provider keys in the proxy database. Rebuild on 1.106.2 and rotate first, investigate second."
sources:
  - title: "BerriAI/litellm issue #47826: litellm 1.107.0 compromised (21 October 2026)"
    url: https://github.com/BerriAI/litellm/issues/47826
  - title: "Wiz: LiteLLM Compromised, Steals Credentials (21 October 2026)"
    url: https://www.wiz.io/blog/litellm-compromised-steals-credentials
  - title: "LiteLLM on X: statement from the Director of Security (21 October 2026)"
    url: https://x.com/LiteLLM/status/2112945728565993864
  - title: "PyPI: litellm project JSON (read 21 October 2026)"
    url: https://pypi.org/pypi/litellm/json
  - title: "LiteLLM: Oct 21, 2026 LiteLLM release v1.107.0 Compromised (incident post, updated 21 October 2026 20:30 UTC)"
    url: https://docs.litellm.ai/blog/security-incident-oct-21-2026
  - title: "LiteLLM: The attack chain behind the v1.107.0 LiteLLM release (23 October 2026)"
    url: https://docs.litellm.ai/blog/security-incident-oct-21-2026-attack-chain
  - title: "LiteLLM v1.105.4 release notes (new cosign key, eMudhra root CA removed)"
    url: https://github.com/BerriAI/litellm/releases/tag/v1.105.4
---

LiteLLM, the open-source gateway many teams put in front of OpenAI, Anthropic and other model APIs, published a poisoned release on 21 October. Version 1.107.0 reached PyPI at about 11:40 UTC (14:40 in Israel) and the Docker images on GHCR and Docker Hub, including the `latest`, `main-latest` and `main-stable` tags. LiteLLM's Director of Security [said](https://x.com/LiteLLM/status/2112945728565993864) the team learned of it at 13:32 UTC and has removed the releases and images. PyPI now lists 1.106.2 as the latest version, and 1.107.0 is gone from the project's release list.

## What the release did

According to the [maintainers' tracking issue](https://github.com/BerriAI/litellm/issues/47826) and [Wiz's analysis](https://www.wiz.io/blog/litellm-compromised-steals-credentials), every 1.107.0 wheel dropped three extra files into the root of `site-packages`: `cook.pth`, `cook.py` and `sitecustomize.py`. Python runs those automatically whenever an interpreter starts in that environment, including when you run `pip`.

The stealer collects:

- browser passwords and cookies, SSH and GPG keys, shell history and `.env` files;
- AWS, Google Cloud and Azure credentials, including tokens from cloud instance metadata;
- config and token files of AI coding tools such as Claude, Codex, Gemini, Cursor and Copilot, plus LLM provider API keys in the environment;
- when `DATABASE_URL` is set, the LiteLLM proxy's own credentials and model tables, which hold every upstream provider key the proxy uses.

The data is encrypted and posted to a lookalike LiteLLM domain. A second component checks a GitHub file every hour for a new address to fetch and run code from. Upwind's researchers, who filed the issue, say that file has never held a live address, so that stage has stayed dormant.

## How it got in

The payload is not in the `v1.107.0` git tag. Wiz and Upwind trace it to commits in a lookalike repository, `Berri-AI/litellm` with a hyphen, which LiteLLM's release pipeline built from. In a [16:32 UTC update](https://github.com/BerriAI/litellm/issues/47826) the maintainers said the malicious actions were taken through three engineers' GitHub accounts, "appearing to be by way of stolen GitHub CLI OAuth tokens": one account triggered the release run and another approved it. Those tokens are revoked and the GitHub organization is cut down to one unaffected member while the investigation continues. In an [18:30 UTC update](https://github.com/BerriAI/litellm/issues/47826) the maintainers said they had identified a potential vector for one of the leaked tokens but not yet how the attacker reached the other engineers' accounts; ordinary releases are paused and the image registries stay locked to new releases until LiteLLM can re-enable them safely. Customers who pull only from LiteLLM's private enterprise registry are not affected, the company says.

## What to do

From the remediation in the issue:

1. Do not start by running `pip install`. Delete `cook.pth`, `cook.py`, `sitecustomize.py` and their `.pyc` files from every affected `site-packages`, and kill any detached Python daemon.
2. Rebuild environments and images pinned to `litellm==1.106.2`, or image `v1.106.2` pinned by digest. Do not rely on `latest`.
3. If 1.107.0 ever ran on a host with outbound internet, assume the theft succeeded. Rotate cloud roles, every provider key stored in the proxy database, master and virtual keys, the database password, and any secret in that host's environment.
4. On AWS, check CloudTrail for `GetCallerIdentity` calls from the instance role around install time, then for use of those credentials from outside your network.

File hashes and image digests are in [Wiz's post](https://www.wiz.io/blog/litellm-compromised-steals-credentials) and the issue. LiteLLM says it will keep posting updates there and in its [incident post](https://docs.litellm.ai/blog/security-incident-oct-21-2026).

## Update, 22 October 2026: LiteLLM describes the attack chain

In its [incident post](https://docs.litellm.ai/blog/security-incident-oct-21-2026), last updated at 20:30 UTC on 21 October, LiteLLM says it believes it has identified how the attack worked, and that the attacker "had to compromise multiple independent security controls".

LiteLLM's account, which it says it is still confirming:

- It found an "unexpected, innocuously named user account" in its own internal LiteLLM deployment, which was exposed to the public internet. It believes the attacker got into that deployment, possibly through "a recently patched vulnerability", which it has not named.
- LiteLLM says the attacker then took developers' GitHub CLI OAuth tokens from that deployment's logs.
- One stolen token belonged to one of LiteLLM's two GitHub organization owners. The attacker used it to override branch protection on the private release workflow at 10:08 UTC, pointed the workflow at the lookalike `Berri-AI/litellm` repository, and used a second developer's credential to pass the production approval gate. A third account deleted the workflow run records at about 11:54 UTC, which limited the logs available.

The post also firms up the exposure windows: PyPI from 11:39:51 to 13:23 UTC, GHCR tags until 13:51 UTC, and Docker Hub tags until 14:20 UTC. The incident page itself still carried its 20:30 UTC update when we checked on the morning of 22 October, but the maintainers kept posting on the [tracking issue](https://github.com/BerriAI/litellm/issues/47826). At 23:37 UTC they said they are revoking or rotating every authentication token across the organization as a precaution, because "some questions about how the attacker gained initial access remain unresolved", and that for "the vast majority" of those tokens they had seen no sign of exfiltration or improper use. At 02:19 UTC they reported no material developments, said the registries stay locked and regular releases stay paused, and switched from two-hourly updates to updates when there are significant developments.

What changes for readers: if you pulled any of those Docker Hub tags up to 14:20 UTC, include that image in your check. And if you run a LiteLLM proxy yourself, look at what it logs. Request and response bodies can carry secrets, so turn off full body logging where you do not need it, keep the admin interface off the public internet, and audit its user accounts.

## Update, 24 October 2026: the root cause was a key leaked in May, and releases are back

LiteLLM published a [root cause analysis](https://docs.litellm.ai/blog/security-incident-oct-21-2026-attack-chain) late on 23 October and calls it "the canonical source of truth". It says some assumptions in its earlier status updates "were later proven to be inaccurate or incomplete". The biggest correction: the first token did not come from the logs of an internal deployment, as its first post suspected. LiteLLM's account now runs:

- **27 May.** A config file committed to the public `LiteLLM-Labs/lite-harness` repository contained the master key of a LiteLLM Agent Platform deployment, an experimental tool LiteLLM used to let cloud agents open pull requests. The commit was force-pushed over and the key was marked for revocation, but the master key was never revoked.
- **10 October.** The attacker used that key to call the Agent Platform API, which returned the GitHub CLI OAuth token of one of LiteLLM's two organization owners. The token was not a scoped service account. LiteLLM notes that GitHub CLI tokens are issued after two-factor login and are not asked to re-authenticate for sensitive organization actions.
- **10 and 12 October.** With the owner's token, the attacker pushed throwaway branches whose workflows posted repository CI secrets to an outside endpoint, then deleted the runs. Two of those secrets were GitHub CLI tokens of two more maintainers. LiteLLM says the attacker also took tokens for other internal systems and looked mainly for upstream inference API keys.
- **21 October.** The owner's token overrode branch protection on the private release repository to build from the lookalike `Berri-AI/litellm`. A rule requiring a device-locked approver account had been relaxed that week to let any two engineers trigger and approve releases, so one stolen token started the release and another approved it. A third deleted the run records, and the owner's token force-pushed the change out of visible history.

LiteLLM says it is revoking every token on every internal system and vendor platform, and that it will share process changes next week.

Releases have resumed. On 24 October LiteLLM published 1.103.8, 1.104.6, 1.105.4 and 1.106.3 on GitHub, and 1.106.3 is also on PyPI. The [release notes](https://github.com/BerriAI/litellm/releases/tag/v1.105.4) say Docker images and Helm charts are now signed with a **new cosign key** (from commit `e82a3c6`), so verifying with the old key from commit `0112e53` will fail, and the eMudhra root CA is removed from every certificate bundle the SDK, proxy and images trust.

What changes for readers: update any `cosign verify` script, CI check or admission policy that pins the old `cosign.pub` before you move to these releases. And the lesson generalizes to any agent platform: a GitHub token held by an agent service should be a scoped bot token, never an owner's personal CLI token, and a leaked key has to be revoked, not just scrubbed from history.

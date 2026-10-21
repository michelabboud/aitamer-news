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
  claimed: "How the GitHub tokens were stolen is not fully known yet. Payload analysis is Wiz's and Upwind's."
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

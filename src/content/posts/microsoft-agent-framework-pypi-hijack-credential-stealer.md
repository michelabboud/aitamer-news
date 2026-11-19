---
title: "Microsoft's Agent Framework package on PyPI shipped a credential stealer. Check for 1.26.1 and 1.26.2"
description: "Two rogue agent-framework releases ran a stealer on every Python start, taking cloud keys and CI tokens. Pin 1.26.0, check for .pth files, rotate secrets."
pubDate: "2026-11-19T16:37:00Z"
specimen: 1492
section: devops
subsection: security
tags:
  - security
  - supply-chain
  - pypi
  - microsoft
  - ai-agents
  - python
draft: false
heroImage: "https://bots.aitamer.news/heroes/microsoft-agent-framework-pypi-hijack-credential-stealer-9a348073.jpg"
heroAlt: "An ordinary paper parcel on a teal conveyor belt reaches out with a sulfur-yellow hook to lift a key from a nearby rack."
author: desk-bot
wildness:
  rating: 2
  verified: "GitHub advisory GHSA-764m-3ppc-5m73, PyPI advisory PYSEC-2026-4388 on OSV and Wiz's analysis, read 19 Nov."
  claimed: "How the attacker got publishing access is not public. Microsoft's only comment so far came via The Register."
verdict: "Short window, nasty payload. If either version touched a laptop or CI runner, treat that environment as compromised and rotate everything it could reach."
sources:
  - title: "GitHub Advisory Database: Malicious code in agent-framework (PyPI), GHSA-764m-3ppc-5m73 (18 November 2026)"
    url: https://github.com/advisories/GHSA-764m-3ppc-5m73
  - title: "OSV: PYSEC-2026-4388, agent-framework 1.26.1 and 1.26.2 contain credential-stealing code"
    url: https://osv.dev/vulnerability/PYSEC-2026-4388
  - title: "Wiz: malicious version of Microsoft's agent-framework published to PyPI"
    url: https://www.wiz.io/blog/malicious-version-of-microsofts-agent-framework-published-to-pypi
  - title: "The Register: Microsoft's official Python agent framework hijacked to distribute malware (18 November 2026)"
    url: https://www.theregister.com/security/2026/11/18/microsofts-official-python-agent-framework-hijacked-to-distribute-malware/5310858
---

Two releases of **agent-framework**, the PyPI package for Microsoft Agent Framework, Microsoft's Python toolkit for building AI agents, carried a credential stealer. According to the [GitHub advisory](https://github.com/advisories/GHSA-764m-3ppc-5m73), versions **1.26.1** (uploaded 20:35 UTC on 17 November, wheel only) and **1.26.2** (21:08 UTC) were published without authorization. [Wiz](https://www.wiz.io/blog/malicious-version-of-microsofts-agent-framework-published-to-pypi), which reported it, says both were gone from PyPI by 21:30 UTC. That is a window of about an hour, from 22:35 to 23:30 Israel time. The last clean release is **1.26.0**.

## How it ran

Each bad wheel was a repack of the real 1.26.0 with one addition: a `.pth` file in `site-packages`. Python runs `.pth` files every time the interpreter starts, so the payload ran on any Python start in that environment, **even if your code never imported agent_framework**. It forked into a background process and kept the genuine package working so nothing looked wrong.

The [PyPI advisory](https://osv.dev/vulnerability/PYSEC-2026-4388) says the releases were repackaged from the legitimate wheel and that PyPI's security team worked with Microsoft on the accounts and cleanup. How the attacker got publishing access has not been published. Microsoft told [The Register](https://www.theregister.com/security/2026/11/18/microsofts-official-python-agent-framework-hijacked-to-distribute-malware/5310858) it had made some repositories private while it investigates.

## What it took

Per the GitHub advisory, the stealer collected:

- environment variables with names containing TOKEN, SECRET, PASSWORD, KEY, AZURE, AWS, GITHUB, HF_, OPENAI, NPM, PIP or CI_
- the environment of other processes, read from `/proc/*/environ`
- credential files: `~/.azure`, `.npmrc`, `.netrc`, `.git-credentials`, `.docker/config.json`, the Hugging Face token, Azure DevOps agent credentials and `.env` files
- fresh **Azure managed identity** tokens from the instance metadata service, and Azure DevOps OIDC tokens

Version 1.26.2 also requested **GitHub Actions OIDC tokens**. Wiz says that in workflows with `id-token: write`, those can be swapped for Azure access wherever an Entra ID federated credential trusts the workflow, with no stored secret needed. Everything was compressed, base64-encoded and posted to a webhook.site URL. Wiz says stolen managed identity and OIDC-exchanged tokens stay valid for up to 24 hours.

## What to check

1. **Find it.** Search lockfiles, CI logs, virtualenvs and container images for `agent-framework` 1.26.1 or 1.26.2. Pin `agent-framework==1.26.0`.
2. **Look for the hook.** `agent_framework_meta.pth` and `agent_framework_meta/_telemetry.py` (1.26.1), or `af_runtime_diag.pth` and `af_runtime_diag.py` (1.26.2). Wiz warns that searching only for the 1.26.1 names misses the second version.
3. **Check egress** in proxy and DNS logs for `webhook[.]site/d381fd80-ec62-42ad-8f5c-d1b15103c9bb`. Wiz says a 200 response means that host's data was accepted.
4. **Rotate** every secret the environment could reach: cloud CLI sessions, Azure DevOps tokens and service connections, npm, PyPI, Docker and Hugging Face tokens, git credentials, and repository and organisation secrets exposed to affected jobs. Then review Azure sign-in logs for managed identities and federated credentials that were reachable.

## Why this matters

This is the second AI developer package in a month to ship a stealer through PyPI, after [LiteLLM 1.107.0](/posts/litellm-1-107-0-pypi-docker-credential-stealer/), and agent stacks sit next to exactly the keys these payloads hunt. A `.pth` hook means "we never imported it" is no defence; what kept teams safe was being pinned to a known-good version such as 1.26.0. For GitHub Actions, Wiz's analysis is a reason to grant `id-token: write` only to the jobs that need it, so a poisoned dependency cannot mint cloud access.

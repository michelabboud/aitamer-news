---
title: "NEAR AI breach went through an SGLang bug, and the enclave did not stop it"
description: "An SGLang remote code execution flaw let an attacker into NEAR AI's inference servers, about 100 accounts and 18 agents. Confidential mode was in scope too."
pubDate: "2026-11-10T13:37:00Z"
specimen: 1418
section: general
subsection: security
tags:
  - near-ai
  - sglang
  - security
  - breach
  - confidential-computing
  - inference
draft: false
heroImage: https://bots.aitamer.news/heroes/near-ai-cloud-breach-sglang-rce-confidential-inference-c828ef33.jpg
heroAlt: "A shut cream paper safe with a faint slate-blue shield, while a coral thread slips out through a crack in the small gear mechanism on its back."
author: desk-bot
wildness:
  rating: 3
  verified: "NEAR AI incident report (9 Nov) and SGLang GitHub advisories and releases, read 10 Nov 2026."
  claimed: "Scope, counts and the fix are NEAR AI's account; the SGLang flaw has no public advisory yet."
verdict: "A clear lesson for anyone selling confidential inference: the enclave protects data from the host, not from a bug in the serving stack inside it."
sources:
  - title: "NEAR AI: Security Incident Report, SGLang Vulnerability (9 November 2026)"
    url: https://near.ai/blog/security-incident-report-sglang-vulnerability
  - title: "SGLang security advisories (GitHub)"
    url: https://github.com/sgl-project/sglang/security/advisories
  - title: "SGLang releases"
    url: https://github.com/sgl-project/sglang/releases
  - title: "crypto.news: NEAR AI fixes SGLang security flaw, restores Cloud service"
    url: https://crypto.news/near-ai-cloud-restored-security-breach-user-data/
---

NEAR AI, which runs a cloud for private AI inference inside hardware enclaves, says an attacker got in through a remote code execution flaw in [SGLang](https://github.com/sgl-project/sglang), the open-source inference engine on its servers. Its [incident report](https://near.ai/blog/security-incident-report-sglang-vulnerability), dated 9 November, says the access is closed, credentials are replaced, the flaw is fixed on every inference server, and NEAR AI Cloud is back online.

## What NEAR AI says was reached

- **One inference server first.** The SGLang bug gave the attacker code execution on one server, and from there access to NEAR AI's infrastructure.
- **About 100 user accounts.** From an internal system behind the already deprecated Private Chat, the attacker downloaded email addresses and names, and for some accounts plan and balance details. NEAR AI says it found no sign that stored Private Chat conversations or uploaded files were accessed.
- **18 legacy agents.** Agents on an older NEAR AI Agents deployment, which did not run in NEAR AI's confidential computing environment, had their chat history, settings and logs taken. Two Cloud customers had API keys sitting in those logs; both keys are revoked.
- **Live requests.** On 8 November, NEAR AI says, the attacker could also have observed user requests being processed on the compromised server, **including requests running in confidential mode**. It has not said how many.

## The enclave point

NEAR AI is unusually direct about this. "Confidential computing protects data from the operator and the host," the report says. "It does not protect against a vulnerability in the software running inside the environment." The SGLang flaw ran code inside the inference server, so requests being processed there were exposed whatever the hardware promised.

That matters because NEAR AI's confidential inference is also used by others; we covered [Brave Leo routing private chats through it](/posts/brave-leo-e2ee-tee-near-ai/). The company says it now treats the inference software and the services around the enclave with the same rigour as the enclave itself, and that its confidential stack's code and configs stay public.

## The SGLang side

NEAR AI says it reported the flaw to the SGLang project. As of 10 November we found no public SGLang security advisory or CVE for it, and the latest release, v0.5.23, is from 2 November. So it is not yet clear which versions are affected or whether the fix is upstream.

## Why this matters

SGLang is a widely used open-source serving engine; [llm-d](/posts/llm-d-1-0-kubernetes-distributed-inference/) coordinates it alongside vLLM. Until an advisory appears, keep SGLang servers off the public internet, put auth in front of them, and give the serving process no credentials beyond what it needs, since here one server led to internal systems. If you buy "confidential" inference, ask the provider how it patches the serving engine, not only which enclave it uses. It lands the same week [Fireworks widened its own breach disclosure](/posts/fireworks-ai-breach-update-datasets-model-weights/).

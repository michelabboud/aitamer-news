---
title: "Dragos planted secrets in 2 million AI prompts and says it caught three breached AI hosts. OpenRouter has dropped three"
description: "Dragos says canary prompts caught three breached AI hosts, logging resellers and ignored ZDR flags. OpenRouter cut three providers and 125 ZDR endpoints."
pubDate: "2026-11-22T07:41:00Z"
specimen: 1513
section: general
subsection: security
tags:
  - security
  - privacy
  - inference
  - openrouter
  - supply-chain
draft: false
heroImage: "https://bots.aitamer.news/heroes/dragos-canary-prompts-inference-providers-breached-openrouter-ae47d1cc.jpg"
heroAlt: "Cut-paper pipe carrying framed yellow canaries toward three paper houses, a canary perched on the pipe while hands pass a blank envelope between two open doors"
author: desk-bot
wildness:
  rating: 3
  verified: "Dragos research post (19 Nov), OpenRouter notice (22 Nov), Phala and Together incident posts, read 22 Nov."
  claimed: "Dragos does not name the three breached providers. Attribution and scope are Dragos's findings."
verdict: "A privacy flag only binds the first hop. Choose your upstream providers yourself, and put a canary credential in your agent context today."
sources:
  - title: "Dragos: Three breaches, endless leaks: Your AI supply chain needs canaries (HD Moore, 19 November 2026)"
    url: https://www.dragos.com/blog/ai-supply-chain-security-canary-tokens
  - title: "OpenRouter: Data Processing Incidents on Inference Providers (22 November 2026)"
    url: https://openrouter.ai/blog/announcements/data-processing-incidents-on-inference-providers/
  - title: "Phala: November preliminary incident report"
    url: https://phala.com/posts/phala-november-preliminary-incident-report
  - title: "Together AI: Security event: prompt leakage for requests in June and July of 2026 (21 November 2026)"
    url: https://www.together.ai/blog/security-event-prompt-leakage-for-requests-in-june-and-july-of-2026
---

Between July and November, Dragos sent about **two million prompts** to widely used AI services, each carrying a unique URL, DNS name and AWS key that existed nowhere else. Then it watched who used them. [HD Moore's write-up, published 19 November](https://www.dragos.com/blog/ai-supply-chain-security-canary-tokens), reports three kinds of leak. On 22 November, [OpenRouter said](https://openrouter.ai/blog/announcements/data-processing-incidents-on-inference-providers/) it had off-boarded three providers and removed **125 endpoints** from Zero Data Retention (ZDR) eligibility.

## Three breached hosting providers

Dragos says attackers were stealing data from inside three inference providers, and none of them knew until Dragos told them. The earliest breach began in mid-July. Dragos does not name the three.

- **The largest** involved a couple hundred planted AWS keys, each sent in one request during short windows in late October. Every request in those windows was stolen, including some the provider rejected before a model ran, so the copying happened "at the provider's front door".
- **The other two** included stolen requests marked ZDR. "A privacy flag doesn't help when the attacker is already inside," Moore writes.
- **What the thief did:** tested keys, sometimes within hours, listed S3 buckets, searched Secrets Manager and Parameter Store, and tried to create Bedrock API keys and add IAM users. The bait keys drew tens of thousands of AWS API calls.
- **Tooling:** one attacker appears to have hit two providers at once from a single rented server. On 1 November it added ARTEX, an LLM-driven pentest framework, whose user agents `artex-agent` and `artex-judge-r121` Dragos says are in no public indicator list.

Dragos says the mid-July provider has still not disclosed its incident, and that the stolen data was still driving login attempts in late October.

## Resellers and ignored privacy settings

The second finding, Dragos says, needed no exploit. Sellers on an inference marketplace listed models at the lowest price, enabled request logging and read what came through. Dragos traced individuals on home connections opening the secret URLs and, in one case, typing root SSH logins by hand with passwords from the prompts. One router was quietly forwarding some traffic to that marketplace; it told Dragos it has stopped.

The third finding is about policy, not crime. Dragos says a Chinese AI lab it does not name fetched the secret URLs from more than half the prompts sent to its models, including about two-thirds of requests marked "no data collection" or ZDR, and the same scraper fired for prompts sent to US providers that resell the lab's models. Dragos also says one large US provider crawled a secret URL more than two months after a single call. Its route tracing across about **2,000 paths** found several hundred unidentified systems, and one seller that adds about a thousand hidden tokens to every prompt.

## What providers have said

OpenRouter says the findings show no breach of OpenRouter itself, that it has notified all potentially affected customers, and that it will run similar canary tests on an ongoing basis and require assurances before restoring ZDR to any removed endpoint. It lists public notices from Novita, Phala and Together, and says not all affected providers have posted. We read two of them:

- **[Phala](https://phala.com/posts/phala-november-preliminary-incident-report)** says users whose **DeepSeek V4 Flash 0731** requests OpenRouter routed to it between 21 October 00:00 UTC and 8 November 05:35 UTC should treat those requests as exposed and rotate any secrets in them. It blames one actor who chained a legacy internet-facing service with management interfaces that trusted loopback access.
- **[Together AI](https://www.together.ai/blog/security-event-prompt-leakage-for-requests-in-june-and-july-of-2026)** says prompt samples from MiniMax M3, GLM-5.2 and Kimi K2.6 requests in June and July, kept in a private Hugging Face repository, were downloaded after **an AI coding agent committed the access credential** to its public GitHub repo. Five of the credentials the intruder tested were Dragos canaries. ZDR is now the default for new Together accounts.

## Why this matters

If you send prompts through a router, a privacy flag binds only the first hop, and Dragos shows that later hops can be breached, logged or scraped. Pick upstream providers yourself instead of the default pool, keep credentials out of agent context, and add a canary credential to the context your agents already send so any use of it is an incident. Our guide to [routers and inference providers](/posts/model-hosting-services-explained/) covers the trade-offs, and Hugging Face users should note that [Inference Providers now route through OpenRouter](/posts/hugging-face-inference-providers-openrouter-routing/).

---
title: "Wiz: nine AI developer platforms breached in October, and stolen keys ran up big Bedrock bills"
description: "Wiz ties breaches at OpenCode, Railway, Warp, Northflank and five more to LLMjacking. One stolen key made 800,000 Bedrock calls in 30 hours."
pubDate: "2026-10-31T17:37:00Z"
specimen: 1207
section: general
subsection: security
tags:
  - wiz
  - llmjacking
  - aws-bedrock
  - api-keys
  - warp
  - opencode
  - railway
  - security
draft: false
heroImage: https://bots.aitamer.news/heroes/wiz-black-october-ai-developer-platform-breaches-llmjacking-6c1f8bea.jpg
heroAlt: "A slate blue paper hand lifting a key with a coral tag from a cream key rack where several pegs are already empty."
author: desk-bot
wildness:
  rating: 2
  verified: "Wiz Research post of 30 Oct; BleepingComputer on Warp; our earlier OpenCode, Railway, Northflank posts."
  claimed: "Links between breaches and resellers are Wiz's analysis. Wiz says the IPs are not proven tied to the breaches."
verdict: "If an AI platform stored your keys this month, rotate them and lock their scope. Wiz's two cases show how fast stolen keys get tested and resold."
sources:
  - title: "Wiz: Black October for AI Developer Platforms (30 October 2026)"
    url: https://www.wiz.io/blog/black-october-for-ai-developer-platforms
  - title: "BleepingComputer: Warp discloses breach exposing AI agent logs, user telemetry data"
    url: https://www.bleepingcomputer.com/news/security/warp-discloses-breach-exposing-ai-agent-logs-user-telemetry-data/
---

Wiz Research counts at least nine AI developer platforms that disclosed security incidents during October and calls it ["Black October"](https://www.wiz.io/blog/black-october-for-ai-developer-platforms): Fireworks AI (6 October), Andromeda (9), Zeabur (14), Lightning AI (15), OpenCode (16 and 17), Railway (20), Warp (23), CommandCode (28) and Northflank (30). Its 30 October post connects them to one market: stolen keys for paid AI models.

## The pattern Wiz sees

- All public reports describe attackers hunting stored environment variables, especially keys that unlock AI models.
- Fireworks, OpenCode and Warp reported signs of an "agent swarm" attack. OpenCode and CommandCode attributed their incidents to attempts at distillation.
- Root causes differ: credential access at Fireworks, Zeabur and Lightning; "privilege escalation in our build infrastructure" at Railway; a third-party vendor at Warp; a "legacy system" at OpenCode. Wiz says no single vulnerability links them.
- Zeabur published a full write-up and is shutting down because of the incident, per Wiz.

Warp's CEO said roughly 1% of users may have been affected and that agent traces and telemetry were exposed through a vendor, [BleepingComputer reports](https://www.bleepingcomputer.com/news/security/warp-discloses-breach-exposing-ai-agent-logs-user-telemetry-data/). We have covered [OpenCode](/posts/opencode-console-breach-provider-api-keys/), [Railway](/posts/railway-breach-environment-variables-ai-inference-keys/) and [Northflank](/posts/northflank-security-incident-assume-env-vars-decrypted/) separately.

## What happened to two stolen keys

Wiz traced two enterprise AWS keys it attributes to one of the vendor breaches. Both were first used within 30 minutes of the reported credential theft, in a one-minute sweep that tested stolen keys across several organizations.

- **Case A:** four days later, a probe tried one call per model across vendors on Bedrock, mapped quotas, and then started bulk traffic. Over about 30 hours the actor made roughly 800,000 Bedrock calls, 90% of which succeeded. The key's policy allowed `global.*` cross-region inference profiles, which spread the load so only about 6% of calls were throttled.
- **Case B:** this key only allowed `us.*` profiles, so thousands of calls from a reseller pool asking for `global.*` failed at first. Once a checker found working model IDs, one address made about 1.7 million calls in 13 hours, over a million of them successful; regional quotas throttled most of the rest.

Wiz says the token pattern looked like resold coding-agent traffic and estimates the two cases likely ran up more than $100,000 in usage at list price. It links the keys to two openly advertised model resale sites, while saying it cannot prove those resellers carried out the breaches or the bulk abuse.

## What to do

1. If any of these platforms held your keys or environment variables, rotate them, starting with AI model and cloud keys.
2. Scope AI keys narrowly. In Wiz's Case B, limiting Bedrock to `us.*` profiles slowed the abuse and quotas capped it; Case A's `global.*` access let it run nearly unthrottled.
3. Set spend alerts and quotas on model accounts so a stolen key hits a ceiling, not your invoice.
4. Wiz publishes IP indicators in its post, with the caveat that they are tied to key testing and resale, not proven to be from the breaches.

## Why this matters

Wiz's count shows one month of breaches across nine platforms that developers trust with AI keys, not isolated bad luck. Its two cases show stolen keys being tested within half an hour and drained at a scale of a million calls a day. Narrow key scopes and quotas made a measurable difference in its data, which is something any team can set today.

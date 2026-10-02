---
title: "Dogwood Local Engine: Apache-2.0 temporal allow/deny for agent tool calls"
description: "AWS Open Source Blog (Sep 30, 2026) released Dogwood Local Engine under Apache 2.0: an embeddable library that issues allow/deny on agent tool-call requests under temporal history. The harness must enforce."
pubDate: 2026-10-01T20:20:00Z
specimen: 124
section: tools
subsection: agents
tags:
  - dogwood
  - aws
  - agents
  - governance
  - policy
  - apache-2
  - open-source
  - harness
  - temporal
draft: false
heroImage: https://media.aitamer.news/heroes/aws-dogwood-local-engine.jpg
heroAlt: "Paper-cut collage of a local verdict ledger beside an agent tool-call ribbon, slate blue and cream with a coral allow/deny gate."
author: desk-bot
wildness:
  rating: 4
  verified: "Apache-2.0 Local Engine Sep 30 2026; GitHub + crates.io 1.0.0; allow/deny on request events; harness must enforce"
  claimed: "Fine vs coarse ~5× eval; ~6ms at 12h under 24h window = AWS lab guidance only"
verdict: "Open policy-verdict library for harness authors—temporal allow/deny on tool-call requests. Not a sandbox; harness must enforce. No AgentCore Policy GA claim here."
sources:
  - title: "Introducing the Dogwood Local Engine: temporal governance for agent actions — AWS Open Source Blog"
    url: https://aws.amazon.com/blogs/opensource/introducing-the-dogwood-local-engine-temporal-governance-for-agent-actions/
  - title: "dogwood-policy/dogwood-local-engine — GitHub"
    url: https://github.com/dogwood-policy/dogwood-local-engine
  - title: "dogwood-local-engine — crates.io"
    url: https://crates.io/crates/dogwood-local-engine
---

AWS’s Open Source Blog (**2026-09-30**, Jatin Arora, Joseph Tassarotti, Jean-Baptiste Tristan) released the **Dogwood Local Engine** under the **Apache 2.0** license: an embeddable library that issues **allow/deny** verdicts on agent **tool-call request** events using **temporal** history—order, timing, and outcomes of prior actions ([AWS OSS blog](https://aws.amazon.com/blogs/opensource/introducing-the-dogwood-local-engine-temporal-governance-for-agent-actions/)).

The engine is available on [GitHub](https://github.com/dogwood-policy/dogwood-local-engine) and as crates.io **`dogwood-local-engine` 1.0.0** (Apache-2.0). Dogwood the **language** shipped in **August 2026**; this post is the **Local Engine**, not a re-launch of the language.

## What it does

Given Dogwood policies plus an event history, the engine decides whether policies permit each **request**. Temporal clauses can require prior actions’ order, timing, and outcomes—for example, permit `git:push` only if tests passed within the last fifteen minutes and none failed since ([AWS OSS blog](https://aws.amazon.com/blogs/opensource/introducing-the-dogwood-local-engine-temporal-governance-for-agent-actions/)).

Verdicts apply to **request** events. **Response** events record outcomes (no verdict). Denied requests have no response event because the tool did not run, as AWS describes.

## Harness must enforce (not a sandbox)

The engine returns a verdict for each request; **it does not directly enforce** that verdict. The **harness** (enforcement layer) must intercept tool calls, submit request events, and **run the tool only if the verdict is allow**. Event fields must come from the harness with accurate descriptions ([AWS OSS blog](https://aws.amazon.com/blogs/opensource/introducing-the-dogwood-local-engine-temporal-governance-for-agent-actions/)).

AWS is explicit that the library **does not perform isolation** itself—its job is correct allow/deny based on the events and policies it is shown. Installing the crate alone is not a sandbox or managed agent host.

By contrast, this is **open policy-enforcement glue** for harness authors, not a managed agent runtime. This primary does **not** announce or couple the Local Engine to **Amazon Bedrock AgentCore Policy** (or any AgentCore Policy GA).

## Durability and policy updates (as AWS states)

AWS says the engine linearizes concurrent events, persists them (log on **redb**, a pure-Rust embedded store), and supports crash replay via durable snapshots. Mid-session **dynamic policy updates** are supported; new temporal clauses judge only events **after** the update—not retroactive history ([AWS OSS blog](https://aws.amazon.com/blogs/opensource/introducing-the-dogwood-local-engine-temporal-governance-for-agent-actions/)).

## Evaluation latency (lab guidance only)

Under “The cost of a verdict,” AWS reports design measurements on one server-class host: evaluation under a fine-grained action schema was roughly **five times** faster than a coarse schema with the same policies, and under a 24-hour window a push decision took **six milliseconds** at twelve hours—about three hundred times longer than under a fifteen-minute window. Treat those as **vendor lab/design guidance**, not a product SLA or competitive claim ([AWS OSS blog](https://aws.amazon.com/blogs/opensource/introducing-the-dogwood-local-engine-temporal-governance-for-agent-actions/)).

## Who should care

Teams building agent harnesses who need **temporal** allow/deny on tool calls can start at the [AWS Open Source post](https://aws.amazon.com/blogs/opensource/introducing-the-dogwood-local-engine-temporal-governance-for-agent-actions/) and the [Local Engine repo](https://github.com/dogwood-policy/dogwood-local-engine). Wire the harness to enforce verdicts and protect event integrity; leave managed runtimes and unrelated safety surfaces as separate products.

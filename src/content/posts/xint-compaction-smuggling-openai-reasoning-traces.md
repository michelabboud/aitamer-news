---
title: "Compaction smuggling: how researchers pulled hidden reasoning out of OpenAI's API, and why it is fixed"
description: "Xint got raw GPT-5.6 Sol reasoning out via the /responses/compact step, bypassing August's fix. Xint says OpenAI fixed it server-side on 23 October."
pubDate: "2026-10-27T17:07:00Z"
section: models
subsection: security
tags:
  - openai
  - api-security
  - distillation
  - reasoning
  - responses-api
  - bug-bounty
draft: false
heroImage: "https://bots.aitamer.news/heroes/xint-compaction-smuggling-openai-reasoning-traces-57bdc303.jpg"
heroAlt: "A paper-cut collage of a locked strongbox with a thin ribbon slipping out through its keyhole onto a small spool."
author: desk-bot
wildness:
  rating: 2
  verified: "Xint's 26 October write-up and The Hacker News report, read 27 October."
  claimed: "OpenAI's confirmation and the fix date come from Xint; Xint says it cannot prove the trace is verbatim."
verdict: "A neat lesson for anyone building on model APIs: any server step that reads protected data and also takes client instructions can leak it. Nothing for API users to change."
sources:
  - title: "Xint: Stealing OpenAI Reasoning Traces via Compaction Smuggling (26 October 2026)"
    url: https://xint.io/blog/compaction-smuggling-reasoning-traces
  - title: "The Hacker News: OpenAI compaction flaw let researchers extract hidden reasoning (27 October 2026)"
    url: https://thehackernews.com/2026/10/openai-compaction-flaw-let-researchers.html
---

OpenAI's API never shows developers the raw chain of thought of its reasoning models. It returns that reasoning only as an encrypted blob you can pass back on the next turn. Security firm **Xint** found a way to read it anyway, which it calls **compaction smuggling**, and [published the details](https://xint.io/blog/compaction-smuggling-reasoning-traces) on 26 October.

According to Xint, OpenAI confirmed the issue, deployed "an undisclosed fix on October 23, 2026" and paid a $6,000 bounty. The fix is on OpenAI's side, so developers do not need to change anything. OpenAI had not commented publicly on the write-up when we checked on 27 October.

## Why the reasoning is hidden

Raw reasoning is the best material for **distillation**, training a smaller model on a bigger model's outputs, because it includes the dead ends and self-corrections. OpenAI has been fighting that: see our stories on [the distillation campaign it disrupted](/posts/openai-disrupts-model-distillation-campaign/) and on [Anthropic's defenses](/posts/anthropic-distillation-defenses-preserved-thinking/).

In August, a paper called Stolen Thoughts showed that encrypted reasoning could be replayed into a weaker model from the same provider and coaxed back out. Providers added mitigations, and Xint says that attack no longer worked against OpenAI by August.

## The three calls

Xint's attack, as it describes it:

1. **Produce the reasoning.** Send a task to `gpt-5.6-sol` with `store=False` and keep the encrypted reasoning item.
2. **Steer the compaction.** Remove the original task from the history and call `/responses/compact`, whose `instructions` parameter controls the output, asking it to preserve the reasoning verbatim inside JSON with every space replaced by a tab. Xint says the tab trick "was enough to slip past OpenAI's usage-policy classifiers".
3. **Echo it.** Compaction items are portable, so Xint sent the item to `gpt-4.1` and `gpt-4o` and asked each to repeat its input exactly.

It worked, Xint says, because the August fix only blocked replaying reasoning into a *different* model, and compaction runs on the *same* model that produced the reasoning.

## Limits

Xint is careful about what it proved. Both echo models produced identical output, but "we can't prove token-for-token fidelity without the original plaintext". It notes the compaction item was larger than the reasoning (612 vs 405 tokens), consistent with the JSON and tab overhead. The attack starts from the attacker's own API request; the write-up does not describe access to other customers' reasoning.

Its takeaway applies well beyond OpenAI: "Any server-side step that reads decrypted reasoning and takes instructions from the client is a potential decryption oracle."

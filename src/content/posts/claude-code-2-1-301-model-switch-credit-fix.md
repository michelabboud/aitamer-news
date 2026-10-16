---
title: "Claude Code 2.1.301 fixes an unasked summary charge on model switch"
description: "Claude Code 2.1.301 fixes a model switch that could bill a summary without asking. The notes name no amount, rate, or model."
pubDate: "2026-10-16T18:52:00Z"
specimen: 858
section: tools
subsection: cli
tags:
  - claude-code
  - anthropic
  - billing
draft: false
heroImage: https://bots.aitamer.news/heroes/claude-code-2-1-301-model-switch-credit-fix-65793b4c.jpg
heroAlt: "A cream paper gauge with a rust-to-yellow arc and slate needle beside a slate switch lever and a coral token on a teal clip, over torn blue paper hills."
author: desk-bot
wildness:
  rating: 3
  verified: "The 2.1.301 changelog section and the npm dist-tags were opened on 16 October 2026."
  claimed: "The notes describe the bug. They give no amount, rate, or model."
verdict: "The fix is in the 2.1.301 notes, and npm latest is 2.1.301. Stable is still 2.1.292. The notes name no charge size."
sources:
  - title: "Claude Code changelog, section 2.1.301"
    url: https://github.com/anthropics/claude-code/blob/main/CHANGELOG.md
  - title: "npm registry, @anthropic-ai/claude-code"
    url: https://registry.npmjs.org/@anthropic-ai/claude-code
  - title: "AI Tamer: Claude Code 2.1.299 stops sending a gateway key on some Anthropic requests"
    url: https://aitamer.news/posts/claude-code-2-1-299-gateway-api-key-fix/
---

Claude Code 2.1.301, in the [changelog](https://github.com/anthropics/claude-code/blob/main/CHANGELOG.md), includes this fix: "Fixed a case where switching to a model with a smaller context window could spend usage credits on a summary by the previous model without asking first".

The same section has a second line about compaction behind a gateway: "Fixed conversations being compacted over and over, on a model you didn't pick, behind an LLM gateway whose responses name a different model than the one requested".

It also adds an environment variable. The line reads: "Added `CLAUDE_CODE_RETRY_WATCHDOG_MAX_USAGE_LIMIT_WAIT_MS` so unattended retry mode (`CLAUDE_CODE_RETRY_WATCHDOG`) ends a request at a usage limit that resets too far away instead of waiting".

A later line in the same section describes the switch itself: "Improved switching to a model with a smaller context window: a conversation too long for the new model is now summarized by the previous model first".

The 2.1.301 section does not say whether that summary now waits for a yes. It does not name a dollar amount, a credit amount, how often the old path ran, or which model ids were involved. Those figures are absent, so this account does not estimate them.

## Which tag has 2.1.301

The [npm registry record](https://registry.npmjs.org/@anthropic-ai/claude-code) for `@anthropic-ai/claude-code`, read at 17:36 UTC on 16 October 2026, lists these dist-tags:

| Tag | Version | Publish time on the registry |
| --- | --- | --- |
| `latest` | 2.1.301 | 2026-10-15T14:34:23.330Z |
| `next` | 2.1.302 | 2026-10-16T16:48:28.057Z |
| `stable` | 2.1.292 | 2026-10-06T17:10:31.715Z |

The registry's `modified` time at that read was 2026-10-16T16:48:28.515Z. The changelog file on the repository's main branch, read in the same pass, opens with the 2.1.301 section. It has no 2.1.302 section. This account does not say whether 2.1.302 keeps the fixes above.

`stable` is still 2.1.292, published on 6 October, which is before 2.1.301. An install that follows `stable` does not include these notes.

## The previous gateway note

[Claude Code 2.1.299](/posts/claude-code-2-1-299-gateway-api-key-fix/) was the prior gateway-adjacent fix. The registry lists that version at 2026-10-14T00:23:19.588Z. Its notes cover Anthropic requests that were carrying a third-party gateway API key. The 2.1.301 notes are a different pair: a summary billed on a model switch, and repeated compaction when a gateway's response names a model other than the one requested. On the registry the two versions are a day apart.

## What to install

If you take versions from `latest`, 2.1.301 is the version that tag named on this read. If a conversation is too long for the model you switch to, the 2.1.301 notes say the previous model summarizes it first. They still do not say the summary is free, and they still do not name a model. If your install follows `stable`, these notes are not in 2.1.292.

People who run Claude Code through an LLM gateway, and who have seen a conversation compact more than once on a model they did not choose, have the second fix in the same section. The changelog does not say how to detect that case after the fact.

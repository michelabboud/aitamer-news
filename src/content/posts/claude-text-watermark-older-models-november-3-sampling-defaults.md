---
title: "Claude's text watermark reaches Opus 4.6, Sonnet 4.6, Opus 4.7 and Mythos 5 on 3 November"
description: "An Anthropic customer email says older Claude models get the watermark from 3 November. On the 4.6 models it may need default sampling settings."
pubDate: "2026-11-01T16:37:00Z"
section: models
tags:
  - anthropic
  - claude
  - watermarking
  - eu-ai-act
  - compliance
  - api
draft: false
heroImage: https://bots.aitamer.news/heroes/claude-text-watermark-older-models-november-3-sampling-defaults-ed8f9719.jpg
heroAlt: "A cut-paper sheet with a faint blue wavy watermark resting on a stack of older sheets, with a small coral paper clip on its corner."
author: desk-bot
wildness:
  rating: 2
  verified: "Anthropic help page and watermark post; customer email screenshot and The Decoder, read 31 Oct 2026."
  claimed: "Email not on an Anthropic URL; sampling caveat is The Decoder's reading. Detection is private preview."
verdict: "Older Claude models join the watermark on Tuesday. If you need the mark for compliance, keep default sampling on the 4.6 models."
sources:
  - title: "Claude Help Center: How Claude marks AI-generated content"
    url: https://support.claude.com/en/articles/16266773-how-claude-marks-ai-generated-content
  - title: "Anthropic: How Claude's text watermarking works"
    url: https://www.anthropic.com/news/claude-text-watermark
  - title: "The Decoder: watermark on older Claude models (31 Oct 2026)"
    url: https://the-decoder.de/anthropic-api-nutzer-koennen-wasserzeichen-bei-aelteren-claude-modellen-mit-einem-trick-umgehen/
---

From Tuesday, 3 November, text from four older Claude models will carry Anthropic's invisible watermark. That date comes from an email Anthropic sent to organizations using those models; a screenshot of it [circulated on X](https://x.com/i/status/2116533073139610038), and [The Decoder](https://the-decoder.de/anthropic-api-nutzer-koennen-wasserzeichen-bei-aelteren-claude-modellen-mit-einem-trick-umgehen/) reported its contents on 31 October. The email itself is not published on an Anthropic page.

## What the email says

Per the screenshot we read: "On November 3, 2026, Anthropic will begin applying its text watermark to outputs from these four models": Claude Mythos 5, Claude Opus 4.7, Claude Opus 4.6 and Claude Sonnet 4.6, on the Claude Platform. Rollout on Amazon Bedrock "may take a few additional days". It is the same watermark newer models such as Claude Opus 5.5 already carry.

The mark is "an imperceptible pattern in word choice". The email says it adds no characters or tokens, does not change pricing or request formats, and "contains no information about the user, their organization, or their conversations with Claude".

## The sampling caveat

The email tells customers they need to change nothing "unless you rely on the watermark for your own compliance and use non-default sampling settings". The Decoder reports the detail: for Opus 4.6 and Sonnet 4.6, the watermark is only applied when temperature, top_p and top_k stay at their defaults. We could not see that part of the email ourselves, so treat it as The Decoder's reading.

## What Anthropic has published

Anthropic's [help page](https://support.claude.com/en/articles/16266773-how-claude-marks-ai-generated-content) says models launched on or after 2 August 2026 mark text from launch, and that Anthropic is adding marks to earlier models. The marks apply across the API, the Claude apps and Claude Code, and on cloud partners. Its [explainer](https://www.anthropic.com/news/claude-text-watermark) ties the change to the EU AI Act and the Code of Practice on transparency it signed in July, applied worldwide because it cannot yet scope the mark by region.

Who can check a mark: only organizations in a private preview of the detection API, such as regulators, law enforcement, media, fact-checkers and researchers. Anthropic also warns that a detected mark means Claude "may" have processed the text, for example by proofreading or translating, and that a missing mark proves nothing, especially on short passages.

OpenAI took a different route: [opt-in API text watermarks](/posts/openai-eu-text-watermarking/), off by default.

## Why this matters

If you build on Opus 4.6 or Sonnet 4.6 and must show that output is marked, keep sampling at the defaults; the newest [API version already rejects temperature, top_p and top_k](/posts/claude-api-version-2026-10-21-sampling-parameters-removed/), so code already on that version uses the defaults. If you pinned an older model to avoid the mark, that stops working on Tuesday for these four. Nobody outside the preview can verify the mark yet, so do not treat it as an AI detector for your own content checks.

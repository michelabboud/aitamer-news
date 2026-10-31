---
title: "Cisco Talos: the VOLTA infostealer asks an LLM what each victim is worth"
description: "VOLTA sends stolen data to OpenRouter for a ranked target assessment, with a model fallback chain built for refusals. What defenders can check today."
pubDate: "2026-10-31T19:37:00Z"
specimen: 1210
section: general
subsection: security
tags:
  - cisco-talos
  - malware
  - infostealer
  - openrouter
  - security
  - llm-abuse
draft: false
heroImage: https://bots.aitamer.news/heroes/cisco-talos-volta-infostealer-llm-ranks-victims-openrouter-9852309d.jpg
heroAlt: "A cut-paper magnifying glass over a pile of paper keys and envelopes, one key tagged in coral, with a faint blue balance scale behind."
author: desk-bot
wildness:
  rating: 3
  verified: "Cisco Talos write-up of 31 October (sample hash, model config, countermeasures); WIRED interview, read 31 Oct."
  claimed: "In-the-wild use not tracked. Sold-builder model is Talos's inference. No model shown to have complied."
verdict: "A stealer that hands triage to a model. Block or alert on headless Chrome launches, keep volta_debug.txt if hit, and revoke tokens."
sources:
  - title: "Cisco Talos: Appraisal by AI, model-driven victim prioritization in the VOLTA infostealer"
    url: https://blog.talosintelligence.com/appraisal-by-ai-model-driven-victim-prioritization-in-the-volta-infostealer/
  - title: "WIRED: Spooky new infostealer malware uses AI to autodox victims"
    url: https://www.wired.com/story/kernel-panic-volta-autodoxer-ai-infostealer-malware/
---

Cisco Talos has published an analysis of a Windows infostealer that calls itself VOLTA-AUTODOXER. The theft is familiar. The new step comes after it: the malware packs what it took into a profile of the person and sends it to a large language model, which is asked to rank what that person is worth. Talos researcher Ryan Fetterman [wrote it up on 31 October](https://blog.talosintelligence.com/appraisal-by-ai-model-driven-victim-prioritization-in-the-volta-infostealer/), and [WIRED](https://www.wired.com/story/kernel-panic-volta-autodoxer-ai-infostealer-malware/) interviewed him the same day.

## What VOLTA takes

Per Talos, the stealer collects browser passwords, cookies and saved payment cards, cryptocurrency wallet seed phrases, Discord, Telegram, Steam and Roblox sessions, Microsoft OAuth tokens, SSH and cloud-provider keys, saved Wi-Fi passwords and screenshots. It runs a built-in cracker against wallet vaults.

It then uses the stolen sessions to learn more. Talos says it searches the victim's Gmail for receipts from Amazon, DoorDash, Uber Eats, Grubhub, Walmart and PayPal to confirm a home address, pulls Uber Eats and DoorDash order history directly, and reuses the Discord token to enrich the account profile.

## The model step

VOLTA writes the results to a local `Identity_Report.txt`, serializes it as JSON and posts it to OpenRouter, a service that routes one API call to many model providers. The system prompt tells the model to act as "a forensic intelligence analyst drafting a target assessment". The required output includes a section headed "WHAT THEY'RE WORTH", ranking assets by monetization in low, medium and high tiers, and one headed "THEIR OPSEC" on the victim's security habits and password hygiene.

The hardcoded configuration Talos shows:

- **Default model:** `anthropic/claude-opus-4.6` through OpenRouter.
- **Fallback chain:** `moonshotai/kimi-k2`, then `google/gemini-2.5-flash`. VOLTA checks each reply for phrases such as "I can't" or "I'm not able" and moves down the chain.
- **Temperature** 0.2, a hand-built JSON request with no SDK, and a browser User-Agent.

Talos reads the fallback chain as a sign the author expected refusals. It does not say which of these models, if any, produced an assessment. The AI step is optional: Talos says the stealer still runs without it when no key is present. The model's reply comes back as `AI_Analysis.txt` and leaves the machine with the report in `volta_dox.zip`.

## Sold as a builder, per Talos

The Telegram channel, API keys and settings sit in six slots filled in at build time, and the stored credentials are only lightly obscured. Talos infers a builder sold to customers, each of whom gets a custom binary. WIRED quotes Fetterman saying Talos did not track whether VOLTA has been used in the wild. The sample Talos analyzed was first seen on 11 October 2026 (UTC). All the endpoints Talos observed are run by third parties.

## What to do

Talos's countermeasures:

1. Much of the token theft depends on bypassing Chrome's App-Bound Encryption by launching Chrome with `--headless`. An application control policy that limits which processes may do that blocks the path. At minimum, alert on headless Chrome started by anything that is not a known developer tool.
2. If a machine is hit, the executable may have deleted itself. Try to keep `%APPDATA%\volta_debug.txt`: it is a timestamped log of what was taken and whether the model call worked.
3. Revoke tokens and change passwords. A wallet whose seed phrase sat in plain text on disk should be treated as lost, with funds moved to a new wallet.

Talos covered a different way malware is turning to AI earlier this month: [instructions planted to steer AI analysis tools toward a clean verdict](/posts/talos-ai-analysis-evasion-malware/). Stolen inference is the other recurring theme; Symantec's honeypot showed [an offensive agent running on hijacked model endpoints](/posts/symantec-skynet-llmjacking-agent-exposed-ai-endpoints/).

## Why this matters

In VOLTA the model writes no code. It does the analyst's job of deciding which stolen accounts to use first, and Talos's own conclusion is that this kind of effort displacement, plus fallback chains built around refusals, may spread to other malware. For teams, the practical checks are the ones Talos lists: control headless Chrome launches, keep the debug log on an infected host, and revoke every session token, not just passwords.

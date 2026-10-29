---
title: "IBM puts Granite Switch 4.1 chat, decisions, and speech on one endpoint"
description: "IBM's 15 October post and the Apache 2.0 cards compose Granite Switch 4.1 so chat, decision checks, and speech share one endpoint."
pubDate: "2026-10-16T10:37:00Z"
specimen: 840
section: models
subsection: opensource
tags:
  - ibm
  - granite
  - apache-2.0
  - speech
  - adapters
draft: false
heroImage: https://bots.aitamer.news/heroes/ibm-granite-switch-4-1-one-endpoint-ef082888.jpg
heroAlt: "Three paper rail tracks from a speech bubble, a teal shield, and a cream signal post merging into one navy switch box with a coral knob."
author: desk-bot
wildness:
  rating: 3
  verified: "The 15 Oct post, both Apache 2.0 cards, the decision adapter card, and IBM's 2025 aLoRA note were opened."
  claimed: "Decision Index scores, the Guardian ranking, and the 'fastest ASR' line are IBM's."
verdict: "Two Apache 2.0 checkpoints put chat, decision and safety adapters, and English speech on one deployment. IBM says memory stays near the base model. The scores and the ASR rank are IBM's."
sources:
  - title: "Kate Soule, Subhajit Chaudhury, Hendrik Strobelt, and Luis Lastras, Granite Switch 4.1: Chat, Decisions, and Speech from One Endpoint (Hugging Face Blog, 15 October 2026)"
    url: https://huggingface.co/blog/ibm-granite/granite-switch-4-1
  - title: "ibm-granite/granite-switch-4.1-8b model card"
    url: https://huggingface.co/ibm-granite/granite-switch-4.1-8b
  - title: "ibm-granite/granite-switch-4.1-8b README"
    url: https://huggingface.co/ibm-granite/granite-switch-4.1-8b/raw/main/README.md
  - title: "ibm-granite/granite-switch-4.1-30b model card"
    url: https://huggingface.co/ibm-granite/granite-switch-4.1-30b
  - title: "ibm-granite/granite-switch-4.1-30b README"
    url: https://huggingface.co/ibm-granite/granite-switch-4.1-30b/raw/main/README.md
  - title: "Hugging Face model API, granite-switch-4.1-8b"
    url: https://huggingface.co/api/models/ibm-granite/granite-switch-4.1-8b
  - title: "Hugging Face model API, granite-switch-4.1-30b"
    url: https://huggingface.co/api/models/ibm-granite/granite-switch-4.1-30b
  - title: "Decision adapter card (ibm-granite/granitelib-core-r1.0)"
    url: https://huggingface.co/ibm-granite/granitelib-core-r1.0/raw/main/decision/README.md
  - title: "Kristjan Greenewald and others, A new LoRA technology for efficient agentic applications (IBM Research, 17 April 2025)"
    url: https://research.ibm.com/blog/inference-friendly-aloras-lora
  - title: "Apache License, Version 2.0"
    url: https://www.apache.org/licenses/LICENSE-2.0
  - title: "Apache License, Version 2.0 (Open Source Initiative)"
    url: https://opensource.org/license/apache-2-0
  - title: "Open ASR Leaderboard (Hugging Face Space)"
    url: https://huggingface.co/spaces/hf-audio/open_asr_leaderboard
  - title: "generative-computing/granite-switch"
    url: https://github.com/generative-computing/granite-switch
  - title: "Granite Switch 4.1.1: Update models like you update software (Hugging Face Blog, 29 October 2026)"
    url: https://huggingface.co/blog/ibm-granite/granite-switch-4-1-1
  - title: "ibm-granite/granite-switch-4.1-30b model card, revision 4.1.1"
    url: https://huggingface.co/ibm-granite/granite-switch-4.1-30b
  - title: "ibm-granite/granite-switch-4.1-8b model card, revision 4.1.1"
    url: https://huggingface.co/ibm-granite/granite-switch-4.1-8b
---

On 15 October 2026, IBM researchers Kate Soule, Subhajit Chaudhury, Hendrik Strobelt, and Luis Lastras published [Granite Switch 4.1: Chat, Decisions, and Speech from One Endpoint](https://huggingface.co/blog/ibm-granite/granite-switch-4-1). The post says Granite-Switch-4.1-8B and Granite-Switch-4.1-30B can move among chat, decision checks, and speech-to-text from one hosted endpoint.

The [8B card](https://huggingface.co/ibm-granite/granite-switch-4.1-8b) and the [30B card](https://huggingface.co/ibm-granite/granite-switch-4.1-30b) both print a release date of 14 October 2026. The [8B API record](https://huggingface.co/api/models/ibm-granite/granite-switch-4.1-8b) was created at 21:38 UTC that day, and the [30B record](https://huggingface.co/api/models/ibm-granite/granite-switch-4.1-30b) at 21:23 UTC. Both were last modified on 15 October, around 20:27 UTC. The blog and the cards disagree by a day on the date. Both repos are public, `gated` is false, and `license` is `apache-2.0`. No `LICENSE` file sits at the usual raw path. The cards link the [Apache License 2.0](https://www.apache.org/licenses/LICENSE-2.0). The [Open Source Initiative page](https://opensource.org/license/apache-2-0) for that text is titled Apache License, Version 2.0.

## What the checkpoints contain

The [8B README](https://huggingface.co/ibm-granite/granite-switch-4.1-8b/raw/main/README.md) names base model `ibm-granite/granite-4.1-8b`, two adapters, and an embedded speech model. The [30B README](https://huggingface.co/ibm-granite/granite-switch-4.1-30b/raw/main/README.md) uses `ibm-granite/granite-4.1-30b` with the same additions. The adapters are `decision`, an activated LoRA for general-purpose decisions from `granitelib-core-r1.0`, and `guardian-core`, an activated LoRA from `granitelib-guardian-r1.0`. Speech is `ibm-granite/granite-speech-5.0-470m-turboctc`: 470 million parameters, English, a non-autoregressive conformer CTC encoder. The cards say the encoder and the language model are not jointly trained, with no learned projection between them, and they list the limits that follow: English only, lowercase unpunctuated text, and no decode-time steering. The spec table says 131,072 tokens of context. The summary line says 128K, the same window.

Hub safetensors totals are 8,776,400,896 BF16 parameters for the 8B checkpoint and 29,989,814,272 for the 30B checkpoint. IBM says the adapters, the speech model, and the base together use approximately the same GPU memory as the base model alone. That sentence is IBM's. The parameter counts are the API's.

May 2026 preview repos are the wider Granite Libraries set without audio. This October pair is the chat, decision, guardian, and speech bundle.

## What an activated LoRA is, in IBM's words

IBM's [17 April 2025 research post](https://research.ibm.com/blog/inference-friendly-aloras-lora) defines an activated LoRA, or aLoRA, against an ordinary LoRA. A normal LoRA applies to the whole prompt, so switching adapters means recomputing the conversation so far. Kristjan Greenewald, who leads that work, is quoted: "LoRA has to run all the way back to the beginning of a long conversation and recompute it, while aLoRA does not." An aLoRA turns on separately and reuses embeddings already in the key-value cache. The same post estimates 20 to 30 times faster on one task, and up to five times on a full chat. Those multiples belong to the Granite 3.2 adapters discussed there. They are not a measurement of Switch 4.1.

The October blog uses that mechanism here. It says the Switch adapters are cache-efficient activated LoRAs, so a cache built during a base-model reply can be reused for a later decision. Sharing that cache, IBM writes, is why extra specialist adapters beside a generalist one cost almost nothing.

The [decision adapter card](https://huggingface.co/ibm-granite/granitelib-core-r1.0/raw/main/decision/README.md) shows the Granite 4.1 switch. A LoRA variant stays active over the whole prompt. The aLoRA variant turns on at the marker `### DECISION`. The answer is one forward pass, a softmax over the option-label tokens. The Switch cards say to send `adapter_name: decision` and to keep the state turn identical to a normal chat turn, so the server can reuse the prefix cache.

## Scores and ranks IBM states

The blog says the Guardian aLoRA, on average, outperforms Jev 1.13, Microsoft-Decision-1, GPT-Luna-Decisions, and Clef-Flash on safety decisions. Those averages are not printed in the text. The claim is IBM's.

On the Decision Index fast subset, edition v0.3, 1,068 rows, the 8B card prints a hosted overall score of 42.9 for the decision adapter. IBM says the local and hosted paths agree within about 0.6 points. The 30B card prints 50.1 overall. The blog also says a 30B setup with four specialized aLoRAs finished a five-step retrieval workflow much faster than Jev-27B, with no time given.

The blog and both cards call Granite-Speech-5.0-Turbo-CTC the fastest model on the [Open ASR Leaderboard](https://huggingface.co/spaces/hf-audio/open_asr_leaderboard). They do not date the sentence. The leaderboard page's static HTML had no ranking table and did not name this model. The rank remains IBM's claim.

## Building a different bundle

IBM says these two checkpoints are a ready-made set, and that other combinations come from Granite Libraries through the [granite-switch](https://github.com/generative-computing/granite-switch) composer. The cards' command takes a base, the guardian and core libraries, only `guardian-core` and `decision`, and audio turned on. Named runtimes are Hugging Face Transformers and vLLM. An Adapter SDK for training new adapters in Mellea is described as planned, on the blog and on the cards. The decision card says Mellea does not yet offer a built-in call for that adapter.

For a single deployment of chat, a safety check, a labeled choice, and English transcription, these Apache 2.0 checkpoints are the published bundle. The memory saving IBM describes depends on the adapter reusing a matching base-model prefix. The index scores, the Guardian comparison, and the speech rank are IBM's.

## Update, 29 October 2026: revision 4.1.1 adds multilingual speech and new decision weights

IBM shipped [Granite Switch 4.1.1](https://huggingface.co/blog/ibm-granite/granite-switch-4-1-1), which it calls a patch release that is "fully backwards compatible with 4.1". Both checkpoints keep the same two adapters. The `decision` aLoRA gets updated weights with the same prompt format and readout, and the embedded Granite Speech 5.0 TurboCTC encoder now returns punctuated, capitalized transcripts in more languages. The cards list seven: English, French, German, Spanish, Portuguese, Italian and Japanese. The blog says 10 languages, so we report the cards' list. IBM says the base model is untouched.

The cards date revision 4.1.1 to 27 October. It sits on `main`, and the previous release can be pinned with the revision tag `granite-switch-4.1-30b` or `granite-switch-4.1-8b`. On what the cards call the public Jev Decision Index v0.3 set, the new decision adapter scores 51.33 overall on the 30B checkpoint and 46.72 on the 8B. Those are IBM's numbers, and they are not directly comparable with the 4.1 figures above, which came from a 1,068-row fast subset. The cards also repeat a limitation worth planning for: the speech model is not fine-tuned jointly with the LLM or adapters, so "a mistranscription can silently change what the model (or an adapter) responds to." The Adapter SDK for building your own adapters is still described as coming.

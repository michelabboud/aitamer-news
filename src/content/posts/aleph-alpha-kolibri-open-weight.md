---
title: Aleph Alpha ships Kolibri, a 78B open-weight German-English MoE
description: On 3 October 2026 Aleph Alpha released Kolibri, a bilingual German-English mixture-of-experts model with 78.1B total parameters, 3.46B active, Apache 2.0 weights, and context up to 1M tokens.
pubDate: "2026-10-04T19:40:43Z"
specimen: 393
section: models
subsection: opensource
tags:
  - open-weights
  - moe
  - german
  - aleph-alpha
  - long-context
draft: false
heroImage: https://bots.aitamer.news/heroes/aleph-alpha-kolibri-open-weight-3b702ed5.jpg
heroAlt: A paper-cut collage of a slate-blue hummingbird hovering over an open lined notebook with a small coral bookmark, with layered cream and pale blue paper hills and leaf sprigs behind.
author: desk-bot
wildness:
  rating: 2
  verified: 3 Oct 2026 release, Apache 2.0 HF weights, MoE size and context limits
  claimed: Vendor benchmark tables and sovereign supply-chain framing
verdict: A real open-weight ship with clear sizes and license; treat the benchmark tables and sovereignty language as Aleph Alpha's own claims until independent runs land.
sources:
  - title: "Kolibri Has Landed: A Sovereign Open-Weight Model (Aleph Alpha)"
    url: https://aleph-alpha.com/en/blog/kolibri-has-landed-a-sovereign-open-weight-model/
  - title: Aleph-Alpha/Kolibri-1 model card (Hugging Face)
    url: https://huggingface.co/Aleph-Alpha/Kolibri-1
---

Aleph Alpha published [Kolibri](https://aleph-alpha.com/en/blog/kolibri-has-landed-a-sovereign-open-weight-model/) on 3 October 2026, which the launch post calls the Day of German Reunification. The company frames it as a sovereign open-weight model for regulated work in public administration, industrials, and aerospace. Full weights are on Hugging Face as [`Aleph-Alpha/Kolibri-1`](https://huggingface.co/Aleph-Alpha/Kolibri-1) under Apache 2.0.

## What shipped

Kolibri is an English-German mixture-of-experts Transformer. The launch post's opening line lists about 78B total parameters and about 3B active per token. Its comparison table and the Hugging Face model card both list 78.1B total and 3.46B active. The card also prints the exact counts: 78,103,074,560 total parameters and 3,457,573,120 active per token. Context is validated up to 1,048,576 tokens. Aleph Alpha recommends staying at or below 262,144 tokens when latency, throughput, or task complexity matter. Reasoning effort can be set to none, low, medium, or high. Tool calling is supported through Aleph Alpha's vLLM plugin.

A smaller internal predecessor, Kolibri Origin (30.6B total, 3.27B active, longest trained length 65,536 tokens), finished pre-training on 11 June 2026 and was not released publicly. Kolibri finished pre-training on 11 September 2026. The public weights shipped on 3 October 2026.

## Architecture and training claims

According to the launch post and model card, Kolibri has 50 MoE layers and a bilingual tokenizer with a 128,000 vocabulary. The card describes 384 experts per layer, with 6 routed and 1 shared. The launch table lists 384 experts and 6 active, plus one shared expert. Pre-training used 20T tokens on 768 NVIDIA B200 GPUs over 21 days. The card lists a further 3.44T tokens of mid-training and 201B tokens of long-context extension. The launch post describes those later stages as 3.44T and 200B tokens and calls the combined total nearly 24T. On the language mix, the launch post says German accounts for 21.3% of pre-training tokens, more than a fifth. The model card lists the pre-training mix as about 62.5% English, 23.9% German, and 13.6% code. Knowledge cutoff for both English and German is listed as 18 June 2026.

Serving needs a real GPU footprint. The model card estimates about 78 GB for FP8 weights. The minimum it lists is two A100 80 GB GPUs, two H100 SXM5 GPUs, one H200, one B200, or one B300. The recommended set on the same card is two H100 SXM5, two H200, one B200, or one B300. Inference uses the `aleph-alpha-inference` package, which supplies the Kolibri vLLM plugin.

## Benchmarks and grounding

Aleph Alpha publishes vendor-run tables that compare Kolibri with larger open mixture-of-experts models on math, code, long context, and agentic suites. Examples from the launch post include AIME 2025 at 96.9 (English) and LiveCodeBench v6 at 85.9. The company also emphasizes abstention and grounding. It says Kolibri refrains from answering when the context does not support an answer, and it reports higher non-hallucination rates than Kolibri Origin on its own suites. Those scores are Aleph Alpha's harness results.

## What sovereignty means here

Aleph Alpha ties "sovereignty" to two claims. It says the model was built in Germany and trained on infrastructure in Germany and Finland, with the EU AI Act, the General-Purpose AI Code of Practice, and the GDPR in mind. It also says customers can download the weights and deploy them themselves. The Apache 2.0 notice on Hugging Face covers the published weights and configuration files. Aleph Alpha says the license does not extend to underlying code, model architecture, parameter settings, or training methods outside that repository.

## Practical takeaway

Kolibri is a European open-weight release: bilingual by design, sparse on active compute, long-context capable, and licensed so teams can self-host the published weights. Operators still need enough GPU memory for the full weight set, Aleph Alpha's inference plugin, and their own evaluation before using the vendor benchmark tables in a regulated deployment. For teams that need German-capable open weights with an explicit abstention story, the launch post and the Kolibri-1 card are the places to start.

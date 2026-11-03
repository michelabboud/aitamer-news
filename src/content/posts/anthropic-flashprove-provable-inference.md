---
title: "Anthropic releases FlashProve, an open-source prototype that proves which model wrote a response"
description: "FlashProve attaches a zero-knowledge proof to LLM output so a user can check which committed model produced it. Prototype only: 1,024 tokens, ~70-95x GPU cost."
pubDate: "2026-11-03T16:07:00Z"
specimen: 1251
section: models
subsection: safety
tags:
  - anthropic
  - provable-inference
  - zero-knowledge
  - lean
  - inference
  - open-source
draft: false
heroImage: https://bots.aitamer.news/heroes/anthropic-flashprove-provable-inference-1f3052e8.jpg
heroAlt: "Cut-paper envelope with a small coral wax seal, a paper magnifying glass leaning toward it and a faint slate-blue server cabinet behind."
author: desk-bot
wildness:
  rating: 3
  verified: "Anthropic research post (2 Nov) and the public Apache 2.0 FlashProve repo, read 3 Nov."
  claimed: "Speed, proof size and overhead figures are Anthropic's own measurements. We have not run it."
verdict: "A real step for checking which model served a response, with code and Lean proofs you can inspect. It is a research prototype with short contexts and heavy GPU overhead, not a feature to ask your provider for yet."
sources:
  - title: "Anthropic: Progress on provable inference for large language models (2 November 2026)"
    url: https://www.anthropic.com/research/provable-inference
  - title: "Anthropic: FlashProve technical report"
    url: https://www.anthropic.com/document/flashprove-technical-report
  - title: "GitHub: anthropics/FlashProve (code, Lean proofs, protocol description)"
    url: https://github.com/anthropics/FlashProve
---

Anthropic has released FlashProve, an open-source research prototype for what it calls provable inference. A model provider commits to a set of weights once, then attaches a cryptographic proof to responses. Anyone holding the commitment, the prompt and the reply can check that the committed model produced exactly those tokens, without seeing the weights. The [research post](https://www.anthropic.com/research/provable-inference) is dated 2 November, and the [code](https://github.com/anthropics/FlashProve), Lean proofs and protocol description are public under Apache 2.0.

## The problem it targets

Anthropic's framing is simple: today a user "cannot check that the responses came from the specific model that a developer claims is responding". Its examples are a routing service quietly swapping in a cheaper model, an attacker tampering with the token stream, and evaluators who need to know the model they test is the one being served. The post also ties the work to a goal in Anthropic's Frontier Safety Roadmap, a provable inference prototype by 30 September 2026.

FlashProve uses a zkSNARK, a short proof that a computation ran correctly and reveals nothing else. The post credits Claude with producing the improvements behind the system's speed, and says Anthropic countered the difficulty of auditing that work with top-level security statements written in Lean, a formal proof language.

## The numbers, as Anthropic measured them

Anthropic tested Llama 4 Maverick, a 400B-parameter mixture-of-experts model, using a public 4-bit conversion of the weights:

- **Setup:** committing to the model takes about 39 minutes on one H100 and covers about 16 million requests before a new commitment is needed.
- **Proving:** a batch of 24 requests of 1,024 tokens takes about 223 seconds, around 110 tokens per second, with each proof about 18.78 MB.
- **Checking:** the verifier needs no GPU. It downloads a commitment of about 6.5 MB and checks a proof in 17 seconds on 24 threads.
- **Cost:** per GPU, proving took about 72 times as long as vLLM serving the same requests (66 to 77 across runs), and about 94 times at the highest load tried.

For comparison, Anthropic cites VerInf, an earlier proof of the same model that took 14.3 hours for 1,000 tokens with a 93.6 GB proof.

## What it does not do yet

The limitations section is specific. Proofs cover contexts of up to 1,024 tokens. They prove an exact integer version of the weights under greedy decoding, so a floating-point or sampled reply could diverge from what was proved. The weights are hidden but the architecture is not, and the system assumes a mixture-of-experts model. Side-channel attacks, such as timing, are out of scope. Only the slow Lean verifier carries a formal guarantee; the fast C++ verifier does not, though Anthropic says the two agreed on every proof in its tests. Proving happens after the fact, on a subset of tokens, not inline with serving.

The Lean-first approach echoes the [proposal for a journal that accepts only Lean-verified proofs](/posts/math-journal-proposal-lean-verified-proofs/): the machine checks the proof, but a human still has to audit that the formal statement says what it should.

## Why this matters

If you buy model access through a router or reseller, there is currently no way to check which model answered, and FlashProve is a public, inspectable route to that check rather than a promise. It is the model-serving cousin of [build attestation](/posts/a-signed-build-is-a-traceable-build/): it links output to a committed artifact, but deciding whether to trust that artifact stays with you. With 1,024-token contexts, greedy decoding only and roughly 70 to 95 times the GPU time of plain serving, treat it as research to follow, not a requirement to put in a vendor contract yet.

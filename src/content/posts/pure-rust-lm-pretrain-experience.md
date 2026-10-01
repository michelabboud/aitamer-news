---
title: "Pure-Rust LM pretrain experience report: Candle/Burn defects, then train PyTorch / serve Rust"
description: "arXiv 2609.25008v1 is a preprint experience report (not SOTA): after a Candle/Burn failure taxonomy on a ~0.4B Bangla-first run, the author pivoted to train in PyTorch and keep Rust for serving. Self-reported $164 / 54.6h H100; weights not public."
pubDate: 2026-10-01T07:00:00Z
heroImage: /heroes/pure-rust-lm-pretrain-experience.jpg
section: rust
subsection: ai
tags:
  - rust
  - candle
  - burn
  - pretraining
  - experience-report
  - bangla
  - gradient-flow-arbiter
  - arxiv
  - pytorch-serve-rust
  - tokenizer-fertility
draft: false
author: desk-bot
sources:
  - title: "Training a Language Model End-to-End in Rust: An Experience Report — arXiv:2609.25008v1"
    url: https://arxiv.org/abs/2609.25008v1
  - title: "gradient-flow-arbiter — GitHub (MIT)"
    url: https://github.com/Adiuk24/gradient-flow-arbiter
---

An arXiv **cs.CL preprint** ([2609.25008v1](https://arxiv.org/abs/2609.25008v1), Jul 2026) is an **experience report** on a solo pure-Rust language-model pretraining attempt—**not** peer-reviewed, **not** a product launch, and **not** a SOTA claim.

This is a **Desk Bot** rust/ai briefing. Soft “among the first documented…” framing stays with the author’s own caveat; forbid “first Rust LLM” or launch language. The central story is the **failure taxonomy** and the pivot to **train in PyTorch / serve in Rust**—not “pure Rust pretrain” as a product pitch.

## What the author tried

Author Arif Ahmed Adito (Adioris Tech Ltd.) documents a Bangla-first decoder-only run labeled roughly **0.4B** (eval harness **NOOR-EDGE 0.43B**), with a self-reported **$164** rented GPU bill, one **H100**, **54.6 hours**, and about **2B tokens**. Those economics and NLL/MC scores are **author self-report**, not independent replication ([arXiv](https://arxiv.org/abs/2609.25008v1)).

Measurements sit against **Candle 0.11** and **Burn 0.20** (cubecl-runtime 0.9.0) in an **Apr–Jul 2026** window—the paper warns readers to re-test as frameworks move. An author **estimate** (not a measurement) puts a tuned PyTorch stack about **10–15×** faster on the same hardware; Burn backward throughput is framed as about **~3%** of theoretical GPU matmul on the author’s model ([arXiv](https://arxiv.org/abs/2609.25008v1)).

## Candle / Burn defects (the spine)

The useful desk spine is silent training defects under loss curves. Candle classes include fused ops registered via a “no backward” wrapper (missing grads), optimizer host memory blow-ups, aggressive intermediate retention, softmax OOM/footgun paths, and causal-mask rebuild churn—several tied to live Candle issues/PRs the author cites (#3011, #3526, #1241, #3508, #3613; note **#3526 / #3508 / #3613** were open PRs in the paper’s framing). Burn’s supported path is called “genuinely good” on correctness, with fences on fusion at multi-billion scale (**burn#4347**—“multi-billion” is **author framing**, not issue text), slow backward loops, and optimizer/RoPE traps ([arXiv](https://arxiv.org/abs/2609.25008v1)).

The author’s reusable practice is a **gradient-flow arbiter** (one forward/backward; assert every trainable param has finite, nonzero-norm gradient), shipped MIT at [gradient-flow-arbiter](https://github.com/Adiuk24/gradient-flow-arbiter). **Model weights and the full training stack are not public**—do not imply otherwise ([arXiv](https://arxiv.org/abs/2609.25008v1)).

## Pivot: train PyTorch, serve Rust

After the run, the author moved **training to PyTorch** and kept **Rust for on-device serving** (“train in Python, serve in Rust” as of that 2026 snapshot)—explicitly not a permanent language verdict ([arXiv](https://arxiv.org/abs/2609.25008v1)).

Corpus sources the author lists as permissive include Sangraha (CC-BY-4.0), FineWeb-2/FineWeb-Edu/FineMath (ODC-By), bangla_newspaper_dataset (MIT), and UltraX-Preview (Apache-2.0). An unresolved small Bangla dialogue subset (`bn_empathetic`) has **no surviving licence record**—flag if you touch data statements; do not present the mix as fully cleared ([arXiv](https://arxiv.org/abs/2609.25008v1)).

## Who should care

Rust ML builders evaluating Candle/Burn as **training** backends should read the [preprint](https://arxiv.org/abs/2609.25008v1) for the defect taxonomy and the [arbiter repo](https://github.com/Adiuk24/gradient-flow-arbiter)—not as a checkpoint drop or a frontier scorecard. (Gemini 4 Argon C++→Rust migration anecdotes are a separate sidebar story; do not merge those numbers here.)

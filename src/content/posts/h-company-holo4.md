---
title: "H Company Holo4: computer-use agents — 27B CC BY-NC, 35B-A3B Apache-2.0"
description: "Holo4 (Sep 28, 2026): 27B dense (Qwen3.8) + 35B-A3B MoE (Qwen3.6) for GUI/code/MCP/API computer-use. License split: 27B weights CC BY-NC 4.0; 35B-A3B Apache-2.0. Both on H Models API + HF. OSWorld/cost figures are H Company harness claims only. Prefer BF16; context 256K (config max 262,144)."
pubDate: 2026-10-01T13:40:00Z
specimen: 101
section: models
tags:
  - h-company
  - holo4
  - computer-use
  - open-weights
  - moe
  - qwen
  - osworld
  - huggingface
  - api
  - evals
  - license-split
draft: false
heroImage: https://media.aitamer.news/heroes/h-company-holo4.jpg
author: desk-bot
wildness:
  rating: 5
  verified: "Holo4 Sep 28: 27B dense CC BY-NC 4.0 + 35B-A3B MoE Apache-2.0; API+HF; GUI/code/MCP/API computer-use"
  claimed: "OSWorld 27B 85.2%@$0.08 / 35B-A3B 80.8%@$0.05 + OSWorld 2.0 (H Company’s own harness)"
verdict: "Open-weight computer-use with a real rights split: the licenses differ by model and must not be merged. Harness benchmarks are H Company’s own; Holotron4 Nano is not covered."
sources:
  - title: "Holo4 — Hugging Face Blog (Hcompany)"
    url: https://huggingface.co/blog/Hcompany/holo4
  - title: "Holo4 — H Company Newsroom"
    url: https://hcompany.ai/newsroom/holo4
  - title: "Holo4-27B — Hugging Face"
    url: https://huggingface.co/Hcompany/Holo4-27B
  - title: "Holo4-35B-A3B — Hugging Face"
    url: https://huggingface.co/Hcompany/Holo4-35B-A3B
  - title: "H Models API"
    url: https://hcompany.ai/models-api
  - title: "Holo4 collection — Hugging Face"
    url: https://huggingface.co/collections/Hcompany/holo4
---

H Company announced **Holo4** on **2026-09-28** (HF blog + newsroom): a series of **agentic / computer-use** vision-language models in two sizes—**27B dense** (Qwen3.8 base) and **35B-A3B Mixture of Experts** (Qwen3.6 base; ~**3B active** naming). Both ship on the **H Models API** and as Hugging Face weights ([HF blog](https://huggingface.co/blog/Hcompany/holo4), [newsroom](https://hcompany.ai/newsroom/holo4)).

The companion **Holotron4 Nano** is not covered here, so the license split below does not apply to it.

## License split

| Model | Weights license | Commercial self-host? |
| --- | --- | --- |
| **Holo4-27B** | **CC BY-NC 4.0** (non-commercial). Hub `license:cc-by-nc-4.0`. Card notes Qwen3.8-27B base is Apache-2.0; repo includes both licenses. | **No** for weights — use **API** for commercial 27B |
| **Holo4-35B-A3B** | **Apache License 2.0**. Hub `license:apache-2.0`. Base Qwen3.6-35B-A3B also Apache-2.0. | **Yes** under Apache-2.0 |

“Holo4 open-weights” is not one rights story. **API Terms ≠ weight redistribution rights** ([27B card](https://huggingface.co/Hcompany/Holo4-27B), [35B-A3B card](https://huggingface.co/Hcompany/Holo4-35B-A3B)).

## What it does

Same model family across interfaces: **GUI** click/type, **code** write/run in a sandbox, **MCP**, and **APIs**—on desktop, web, Android, code sandbox, and business APIs. Trained via supervised + RL on Agentic Task Factory tasks (~**10k** claimed). Harness: **`hai-agents`** ([HF blog](https://huggingface.co/blog/Hcompany/holo4), [newsroom](https://hcompany.ai/newsroom/holo4)).

Context: prefer “**256K** (config max **262,144** tokens)”—newsroom/API say 256K; cards list 262,144. Formats on HF: **BF16, FP8, NVFP4, 4-bit GGUF** (prefer **BF16** over blog “FP16” shorthand). Trajectories open-sourced: viewer + `Hcompany/trajectories` ([collection](https://huggingface.co/collections/Hcompany/holo4)).

## API pricing (as of Fact check)

Per [models-api](https://hcompany.ai/models-api) / newsroom (USD per 1M tokens):

- **Holo4 27B:** input **$0.40** / cached **$0.04** / output **$3.00**
- **Holo4 35B-A3B:** input **$0.30** / cached **$0.03** / output **$2.00**

Re-check models-api if citing dollars at ship time.

## Vendor harness benchmarks

All scores/costs below are **H Company claims in H’s harness**—not aitamer re-runs; harnesses/effort differ from frontier charts ([newsroom](https://hcompany.ai/newsroom/holo4), [HF blog](https://huggingface.co/blog/Hcompany/holo4)):

- **OSWorld:** 27B **85.2% @ $0.08**/task; 35B-A3B **80.8% @ $0.05**/task
- **OSWorld 2.0:** 27B **61.7%** (41.5% success) **@ $1.22**; 35B-A3B **30.9%** (12.3%) **@ $0.61** — vs vendor-cited Opus 5.5 **81.8%** / GPT-6 Astra **73.5%** (different harnesses)
- Footnotes: mean 2–4 runs except single-run OSWorld 2.0 / ALE-CLI; “Holo4 in our harness.”

Dense 27B ahead of 35B-A3B on those vendor OSWorld numbers is OK **only** as attributed vendor framing—not an independent ranking. No MarkTechPost as primary.

## Who should care

Teams picking a downloadable computer-use stack should start at the [HF blog](https://huggingface.co/blog/Hcompany/holo4) and cards. Remember the **27B CC BY-NC vs 35B-A3B Apache-2.0 split**, treat every harness benchmark as H Company’s own, and use the API for commercial use of the 27B rather than assuming weight rights.

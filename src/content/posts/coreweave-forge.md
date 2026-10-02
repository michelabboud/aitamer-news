---
title: "CoreWeave Forge: AI loop platform — only ARIA + Sandboxes called GA"
description: "CoreWeave Forge (Fully Connected 2026 / Sep 30 news): connected run→observe→curate→improve→evaluate loop. Only CoreWeave ARIA and CoreWeave Sandboxes are explicitly Generally Available, not all of Forge. CoreWeave Forge is not Cloudflare Forge. Claims are CoreWeave’s; Agent Lens cost wording differs between the blog and the news release."
pubDate: 2026-10-01T14:50:00Z
specimen: 108
section: tools
subsection: agents
tags:
  - coreweave
  - coreweave-forge
  - agents
  - aria
  - sandboxes
  - agent-lens
  - mlops
  - post-training
  - observability
  - weights-and-biases
  - fully-connected-2026
  - developer-tools
draft: false
heroImage: https://media.aitamer.news/heroes/coreweave-forge.jpg
author: desk-bot
wildness:
  rating: 5
  verified: "Only ARIA + Sandboxes explicitly GA; CoreWeave Forge umbrella at Fully Connected 2026; ≠ Cloudflare Forge"
  claimed: "Five-stage loop / Free·Pro·Enterprise / W&B+OpenPipe+marimo provenance (CoreWeave’s claims; Agent Lens cost varies)"
verdict: "CoreWeave’s loop platform announcement. Only ARIA and Sandboxes are GA; the rest is CoreWeave’s own claim. Unrelated to Cloudflare Forge or Cloudflare’s sandboxes."
sources:
  - title: "CoreWeave Forge — Blog"
    url: https://www.coreweave.com/blog/coreweave-forge-turn-ai-iteration-into-compounding-improvement
  - title: "CoreWeave Forge launches — News"
    url: https://www.coreweave.com/news/coreweave-forge-launches-turning-the-ai-loop-production-run-into-a-better-model-and-agent
  - title: "CoreWeave Forge — Product"
    url: https://www.coreweave.com/products/coreweave-forge
---

**CoreWeave Forge**—always say the full name—is CoreWeave’s AI-loop development layer announced at **Fully Connected 2026** (news **2026-09-30**): one environment that connects **run → observe → curate → improve → evaluate** (then repeat), open across models, frameworks, and clouds ([blog](https://www.coreweave.com/blog/coreweave-forge-turn-ai-iteration-into-compounding-improvement), [news](https://www.coreweave.com/news/coreweave-forge-launches-turning-the-ai-loop-production-run-into-a-better-model-and-agent), [product](https://www.coreweave.com/products/coreweave-forge)).

**CoreWeave Forge is not Cloudflare Forge**: they are separate products. It is also distinct from Cloudflare Containers agent sandboxes and OpenShell.

## Only ARIA + Sandboxes are GA

In the announce, CoreWeave labels **CoreWeave ARIA** and **CoreWeave Sandboxes** as **“now Generally Available.”** Not all of CoreWeave Forge is GA, and Agent Lens, Notebooks, Model Distillation, RL Rollouts and the suite as a whole are not stated to be GA ([blog](https://www.coreweave.com/blog/coreweave-forge-turn-ai-iteration-into-compounding-improvement), [news](https://www.coreweave.com/news/coreweave-forge-launches-turning-the-ai-loop-production-run-into-a-better-model-and-agent)).

| Piece | Status per primaries |
| --- | --- |
| **CoreWeave ARIA** | **Generally Available** — coding/research agent across the loop; analyzes experiment + agent-observability data, proposes next work, can recommend code changes (blog: storing them in GitHub) with evidence |
| **CoreWeave Sandboxes** | **Generally Available** — fresh isolated CPU/GPU environment per run for agent tool use, RL, and evals (serverless or on infra the team already trains on) |
| Agent Lens, Model Distillation, Notebooks | Primaries: **New Service** — not GA |
| Dedicated Inference **RL Rollouts** | News: **in preview** (hot-load checkpoints into a live deployment) |
| W&B Models, Post-Training (Serverless SFT/RL), Registry, Inference | Bundled under the umbrella — not every “New Service” is GA |

MasterClass and Canva are named as early builders—attribute CoreWeave ([news](https://www.coreweave.com/news/coreweave-forge-launches-turning-the-ai-loop-production-run-into-a-better-model-and-agent)).

## Editions + stack provenance

Product page: **Forge Free** $0/mo (personal); **Forge Pro** starts at **$60/month** (early-stage teams <50 employees; 30-day free trial on primaries); **Forge Enterprise** custom. No credit amounts or SKU limits are given beyond the primaries ([product](https://www.coreweave.com/products/coreweave-forge)).

News: Forge unifies **Weights & Biases Models**, post-training expertise from **OpenPipe**, and open-source **marimo** notebooks with CoreWeave services; Registry versions checkpoints/agent configs in open portable formats—**vendor framing**, not independent M&A claims in the lede ([news](https://www.coreweave.com/news/coreweave-forge-launches-turning-the-ai-loop-production-run-into-a-better-model-and-agent)).

**Agent Lens cost claim:** blog “half” vs news “one-tenth”; both are attributed and neither is treated as fact ([blog](https://www.coreweave.com/blog/coreweave-forge-turn-ai-iteration-into-compounding-improvement), [news](https://www.coreweave.com/news/coreweave-forge-launches-turning-the-ai-loop-production-run-into-a-better-model-and-agent)).

## Who should care

Teams that want a production→improve MLOps/agent loop under one account should start at the [CoreWeave Forge blog](https://www.coreweave.com/blog/coreweave-forge-turn-ai-iteration-into-compounding-improvement) and [product page](https://www.coreweave.com/products/coreweave-forge).

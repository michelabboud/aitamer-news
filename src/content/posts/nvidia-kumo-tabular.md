---
title: "NVIDIA Kumo Tabular: open tabular FM (~28M–215M), OpenMDW weights"
description: "NVIDIA announced Kumo Tabular (HF blog 2026-09-29): open tabular foundation models for cls/reg via structured-data-models. Weights OpenMDW-1.1 on HF; library code Apache-2.0. No Inference Provider—local weights path. TabArena/#1 soft-attributed."
pubDate: 2026-10-01T09:28:00Z
section: models
subsection: opensource
tags:
  - nvidia
  - kumo-tabular
  - tabular
  - foundation-model
  - huggingface
  - open-weights
  - openmdw
  - apache-2
  - evals
  - in-context-learning
draft: false
heroImage: /heroes/nvidia-kumo-tabular.jpg
author: desk-bot
wildness:
  rating: 5
  verified: "Product name, HF weights path, library install, OpenMDW-1.1 vs Apache-2.0 split, and size table as stated on…"
  claimed: "TabArena/#1, ELO 1950, 17× vs LimiX-2, BeyondArena/TALENT/ScoringBench ranks"
verdict: "Open weights + Apache library drop: keep licenses split, deep-link OpenMDW and HF, and label every TabArena figure as NVIDIA/vendor."
sources:
  - title: "NVIDIA Kumo Tabular — Hugging Face Blog"
    url: https://huggingface.co/blog/nvidia/kumo-tabular
  - title: "nvidia/Kumo-Tabular — Hugging Face"
    url: https://huggingface.co/nvidia/Kumo-Tabular
  - title: "structured-data-models — GitHub"
    url: https://github.com/NVIDIA/structured-data-models
  - title: "sdm.models API — NVIDIA docs"
    url: https://nvidia.github.io/structured-data-models/api/models.html
  - title: "OpenMDW License 1.1"
    url: https://openmdw.ai/license/1-1/
---

NVIDIA announced **Kumo Tabular** on the Hugging Face blog (**2026-09-29**; docs list model release **2026-09-28**): an open foundation model for **tabular classification and regression** in the **NVIDIA Kumo Structured** collection. Given labeled context rows plus unlabeled query rows, it predicts labels in a **single forward pass** with **no training, no tuning, and no feature engineering**—vendor framing ([HF blog](https://huggingface.co/blog/nvidia/kumo-tabular)).

This is a **Desk Bot** models/opensource briefing. **Do not** fold **Kumo Relational**, **TabFM**, or **TabICLv2** into this slug. Benches below are **NVIDIA/HF-blog claims**, not newsroom re-runs.

## Weights vs code (do not collapse)

| Asset | License | Where |
| --- | --- | --- |
| **Weights** | **OpenMDW-1.1** | [`nvidia/Kumo-Tabular`](https://huggingface.co/nvidia/Kumo-Tabular) — text at [openmdw.ai/license/1-1](https://openmdw.ai/license/1-1/) |
| **Library / code** | **Apache-2.0** | [`NVIDIA/structured-data-models`](https://github.com/NVIDIA/structured-data-models) · [`pip install structured-data-models`](https://nvidia.github.io/structured-data-models/api/models.html) |

Deep-link weights only—**no newsroom redistribute** of blobs. The HF card states the model **is not deployed by any Inference Provider**; the path is **weights + local/`sdm.models.KumoTabular` inference**, not a hosted NVIDIA prediction API ([HF card](https://huggingface.co/nvidia/Kumo-Tabular), [blog](https://huggingface.co/blog/nvidia/kumo-tabular)).

## Sizes (cls and reg are separate)

Blog TL;DR: three sizes **~28M–215M** parameters. NVIDIA docs (per size × task):

| Size | Classification | Regression |
| --- | --- | --- |
| Small | **27.46M** | **28.47M** |
| Medium | **61.49M** | **62.49M** |
| Large | **213.67M** | **215.68M** |

Classification and regression ship as **separate models** ([docs](https://nvidia.github.io/structured-data-models/api/models.html), [blog](https://huggingface.co/blog/nvidia/kumo-tabular)).

## How it works (high level)

Transformer with column, row, and in-context attention (blog cites TabICL / TabPFN lineage). **Pretrained only on artificial tables** (SCM generator); training recipe / generators are **“will be released soon”**—not public yet. Numerical + categorical only (text/images/timestamps via built-in preprocessing recipes); single forward pass up to **10 classes** (library extends via ECOC) ([blog](https://huggingface.co/blog/nvidia/kumo-tabular)).

## Benches (soft — NVIDIA / HF blog)

NVIDIA claims Kumo Tabular **ranks first** on **TabArena**, **BeyondArena**, **TALENT**, and **ScoringBench**; TabArena overall **ELO 1950** and “**17×** faster than LimiX-2” under a uniform single RTX 6000 Pro setup; BeyondArena ELO **1418** / Improvability **7.78%**; ScoringBench Large/Medium 1st/2nd average rank. **Attribute all to the vendor blog**—not independent verification ([blog](https://huggingface.co/blog/nvidia/kumo-tabular)).

## Who should care

Teams that want open tabular in-context prediction without per-task training should start at the [HF blog](https://huggingface.co/blog/nvidia/kumo-tabular) and [`nvidia/Kumo-Tabular`](https://huggingface.co/nvidia/Kumo-Tabular)—read [OpenMDW-1.1](https://openmdw.ai/license/1-1/) for weights and Apache-2.0 for the library, and keep TabArena/#1 soft.

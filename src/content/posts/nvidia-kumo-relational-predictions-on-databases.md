---
title: "NVIDIA Kumo Relational: churn and fraud predictions straight from your database tables, with no training run"
description: "NVIDIA's Kumo Relational reads linked tables and predicts from up to 10,000 examples in context. Open weights under OpenMDW; benchmarks are NVIDIA's."
pubDate: "2026-10-22T16:07:00Z"
specimen: 988
section: models
subsection: opensource
tags:
  - nvidia
  - kumo-relational
  - relational-data
  - foundation-model
  - open-weights
draft: false
heroImage: "https://bots.aitamer.news/heroes/nvidia-kumo-relational-predictions-on-databases-86e6913a.jpg"
heroAlt: "Paper-cut illustration of index-card drawers linked by thin threads into a small web, with a weather vane on top pointing ahead."
author: desk-bot
wildness:
  rating: 3
  verified: "NVIDIA's Hugging Face post (21 October), the model page (OpenMDW-1.1) and the Apache 2.0 library."
  claimed: "Wins over XGBoost and supervised models, and the 500B-row engine, are NVIDIA's own results."
verdict: "Useful for teams that want a quick baseline for churn, demand or fraud without building features. Compare it with your current model on a held-out period before replacing anything."
sources:
  - title: "NVIDIA on Hugging Face: Kumo Relational outperforms supervised machine learning on relational data (21 October 2026)"
    url: https://huggingface.co/blog/nvidia/kumo-relational
  - title: "Hugging Face: nvidia/Kumo-Relational"
    url: https://huggingface.co/nvidia/Kumo-Relational
  - title: "arXiv 2604.12596: the Kumo Relational paper"
    url: https://arxiv.org/abs/2604.12596
  - title: "GitHub: NVIDIA/structured-data-models"
    url: https://github.com/NVIDIA/structured-data-models
---

NVIDIA introduced [Kumo Relational](https://huggingface.co/blog/nvidia/kumo-relational) on 21 October, a pre-trained model that makes predictions directly on a relational database. It is the multi-table sibling of [Kumo Tabular](/posts/nvidia-kumo-tabular/), which works on one flat table.

## How it works

Most prediction models on business data need a flattened table of hand-built features, such as "average order value in the last 30 days". Kumo Relational instead reads the tables, foreign keys and timestamps as they are. You state what to predict in its Predictive Query Language, and it gathers up to 10,000 past examples as context and predicts in one forward pass. There is no task-specific training, though you can fine-tune it.

For time-based tasks it replays the database as it looked before a cut-off time, which NVIDIA says prevents leakage from the future. The model was pre-trained only on synthetic relational databases.

## What NVIDIA reports

All of these are NVIDIA's and the paper authors' results, on 41 benchmarks across 15 databases that were not in pre-training:

- On RelBench V1 classification, nearly 4 AUROC points better on average than gradient-boosted trees on expert-built features.
- On SAP SALT, 7 MRR points better than XGBoost out of the box, and 13 after fine-tuning.

NVIDIA also lists limits. It works best where relationships and time matter, such as user behavior. With very large training sets, a dedicated supervised model may still edge it out. And the useful signal has to sit within a few table hops, so NVIDIA suggests starting with a narrow query over a few tables.

## Running it

The weights are on Hugging Face under the OpenMDW-1.1 license, ungated; the [structured-data-models](https://github.com/NVIDIA/structured-data-models) library is Apache 2.0 and downloads the weights on first use in a GPU notebook. You can also run it as an NVIDIA NIM service, and NVIDIA publishes Databricks examples. Data can stay in memory or come through database and warehouse connectors; NVIDIA says its graph engine handles more than 500 billion rows.

The research paper dates from April. The 21 October post is the public launch of the model and library.

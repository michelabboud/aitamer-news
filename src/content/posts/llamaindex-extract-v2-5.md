---
title: "LlamaIndex Extract v2.5: schema extraction with Advanced Citations"
description: "LlamaIndex (Oct 1, 2026) shipped Extract v2.5: schema-based document extraction agents with Advanced Citations on Agentic and Agentic Plus, same per-page pricing, and native spreadsheet mode."
pubDate: 2026-10-01T21:30:00Z
specimen: 131
section: dev
subsection: rag
tags:
  - llamaindex
  - extract
  - document-extraction
  - rag
  - citations
  - agentic
  - spreadsheet
  - extractbench
draft: false
heroImage: /heroes/llamaindex-extract-v2-5.jpg
heroAlt: "Paper-cut collage of a schema card lifting fields from layered document pages, cream panels and a coral citation box accent."
author: desk-bot
wildness:
  rating: 4
  verified: "Extract v2.5 10/1/2026; Advanced Citations on Agentic+Plus; same per-page; spreadsheet mode"
  claimed: "ExtractBench F1/grounding lifts = LlamaIndex vendor benches only"
verdict: "Extract v2.5 is schema-based document extraction—Advanced Citations on Agentic and Agentic Plus, same per-page pricing framing. Attribute ExtractBench to LlamaIndex; not a vector-index story."
sources:
  - title: "Introducing Extract v2.5 — LlamaIndex Blog"
    url: https://www.llamaindex.ai/blog/introducing-extract-v2-5
---

LlamaIndex introduced **Extract v2.5** on **2026-10-01** (Adrian Lyjak and Eli Stewart): a new generation of **schema-based document extraction agents**, with a **new agent harness** purpose-built for document extraction ([LlamaIndex blog](https://www.llamaindex.ai/blog/introducing-extract-v2-5)).

## What shipped

Accuracy improvements are claimed across all three tiers—**Cost Effective**, **Agentic**, and **Agentic Plus**. **Advanced Citations** (bounding-box grounding of supporting evidence) are improved and now available on **Agentic** and **Agentic Plus**; an earlier version had been Agentic Plus only. LlamaIndex says the lifts come with **no increase in per-page pricing**—higher performance per dollar as vendor framing, with **no dollar rates** published on the post ([LlamaIndex blog](https://www.llamaindex.ai/blog/introducing-extract-v2-5)).

## ExtractBench (vendor-attributed)

On **ExtractBench**, LlamaIndex reports overall value F1 moving **87.1 → 93.9** (Cost Effective), **89.8 → 95.8** (Agentic), and **95.1 → 96.4** (Agentic Plus), plus grounding scores **46.8 → 80.6** (Agentic) and **46.4 → 82.2** (Agentic Plus). Treat every figure as a **LlamaIndex / ExtractBench vendor result**, not an independent newsroom measurement or a competitor head-to-head ([LlamaIndex blog](https://www.llamaindex.ai/blog/introducing-extract-v2-5)).

Worked examples on the same bench cover long lists, records that span pages, and scanned forms—still vendor challenge color.

## Native spreadsheet mode

Extract v2.5 also adds **native spreadsheet extraction**: in spreadsheet mode, agents work directly with **workbook cells** rather than a flattened representation. Enable it in the extraction configuration ([LlamaIndex blog](https://www.llamaindex.ai/blog/introducing-extract-v2-5)).

## Who should care

Teams running schema-driven document extraction—especially where citations and confidence scores feed human-in-the-loop review—should start at the [Extract v2.5 post](https://www.llamaindex.ai/blog/introducing-extract-v2-5). Keep ExtractBench numbers attributed to LlamaIndex, stick to the same-per-page pricing claim without inventing rates, and leave vector-index products for their own desks.

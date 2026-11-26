---
title: "OpenAI says GPT-6 designed protein shapes that bound five lab targets, with specialized models still in the pipeline"
description: "OpenAI says GPT-6 models can design protein shapes and sequences. In Onava lab tests, 35 of 322 minibinders bound their target. The preprint is unreviewed."
pubDate: "2026-11-26T08:07:00Z"
section: models
subsection: research
tags:
  - openai
  - gpt-6
  - protein-design
  - science
  - onava
draft: false
heroImage: "https://bots.aitamer.news/heroes/openai-gpt-6-protein-design-onava-wet-lab-96cf166f.jpg"
heroAlt: "Cut-paper scene of a coiled cream and rust ribbon settled into a slate-blue well on a sand bench, beside an ivory pipette and a small flask holding a muted teal drop"
author: desk-bot
wildness:
  rating: 4
  verified: "OpenAI's 24 Nov post and the linked preprint PDF, read 25 Nov. No separate Onava write-up found."
  claimed: "All lab counts, computational comparisons and 'intrinsic' design claims are OpenAI's."
verdict: "Early wet-lab binding, reported by OpenAI with a named partner, not an independent replication, and several of the tested sequences still came from specialized models."
sources:
  - title: "OpenAI: GPT-6 models demonstrate intrinsic protein-design capabilities (24 November 2026)"
    url: https://openai.com/index/gpt-6-models-demonstrate-intrinsic-protein-design-capabilities/
  - title: "OpenAI preprint PDF: GPT-6 as a Universal Foundation Model for Protein Biology: Beyond Specialized Models"
    url: https://cdn.openai.com/pdf/gpt-6-a-universal-foundation-model-for-protein-biology.pdf
  - title: "Onava"
    url: https://www.onava.ai
---

OpenAI says its [GPT-6 family can design new protein shapes and amino acid sequences](https://openai.com/index/gpt-6-models-demonstrate-intrinsic-protein-design-capabilities/) using only reasoning and general-purpose code, without calling a specialized biology model to produce those designs. The 24 November post points to a preprint, [GPT-6 as a Universal Foundation Model for Protein Biology](https://cdn.openai.com/pdf/gpt-6-a-universal-foundation-model-for-protein-biology.pdf). The work is unreviewed.

The "intrinsic" claim is OpenAI's. The lab work, done with research partner [Onava](https://www.onava.ai), is more mixed: some experiments used specialized models to supply sequences or to shortlist candidates.

## What was tested in the lab

In the first lab experiment, OpenAI gave a pre-released version of GPT-6.2 the structures of five target proteins and marked where a small binder should attach. GPT-6.2 designed three-dimensional shapes. Specialized models then proposed amino acid sequences and helped select what to make. Onava tested **322 minibinders**; **35 (10.9%)** tested positive for binding to the intended target: 5 for PD-L1, 3 for IL-7R-alpha, 1 for TrkA, 8 for VEGF-A and 18 for IL-17A. OpenAI notes that an earlier RFdiffusion study reported higher hit rates, and that rates depend on how strictly designs are filtered and how binding is defined.

In a second experiment, GPT-6.2 designed new sequences for existing minibinder shapes. Initial screens, OpenAI says, showed binding in 75 of 88 designs for MDM2 (85%), 26 of 42 for VEGF-A (62%) and 8 of 59 for PD-1 (14%). The new sequences often differed from the originals (median differences of 50%, 43% and 15% on those three targets). Of 107 proteins made from GPT-6.2 sequences for three unpublished shapes it had designed earlier, 14 (13.1%) bound. Separately, of 272 antibody fragments based on five therapeutic antibodies, 179 (66%) still bound PD-1 or PD-L1.

OpenAI reports only "evidence of binding" or a positive binding test. It does not claim neutralization, cellular protection or a therapeutic candidate. No separate write-up from Onava was found for this story.

## Computational results, and a clear gap

OpenAI says it compared the GPT-6 series with specialized models on 14 protein tasks, covering binder design, constrained structures, interactions and the effect of sequence changes. It says newer models matched or outperformed specialized models on most of those tasks, and that predicting a complete protein structure remained a clear weakness. In one docking comparison, it reports that GPT-6.2 closely matched the experimental pose in 92% of scored predictions, and an internal research model in 97%, against 60% for DiffDock. Those figures are OpenAI's, on its own splits.

An internal research model, not a generally available GPT-6 product, is the one OpenAI says matched or beat specialized models on many tasks and followed shape instructions with near-perfect fidelity. Treat product names and the internal model as distinct.

## Why this matters

General-purpose models are being asked to do work that until recently needed a stack of specialist protein tools. This post is early lab evidence, not a replacement for those tools: the first minibinder test still leaned on specialized models for sequences, the hit rate was about one in ten, and the paper has not been reviewed. It sits next to OpenAI's earlier [GPT-6 Rosalind](/posts/openai-gpt-6-rosalind-research-life-sciences-model-api/) trusted-access life sciences model, Anthropic's [scorpion-toxin binder study](/posts/anthropic-claude-scorpion-toxin-binders/), which also confirmed binding rather than protection, and OpenAI's [BioBasicsBench](/posts/openai-biobasicsbench-wet-lab-agent-benchmark/) on reading wet-lab evidence. The 24 November post does not say this lab work used Rosalind. The useful next check is whether Onava or another lab publishes the designs and an independent binding assay.

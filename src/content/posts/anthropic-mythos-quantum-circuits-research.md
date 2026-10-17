---
title: "Anthropic says Claude Mythos 5 found leaner quantum-circuit designs"
description: "Anthropic and an arXiv paper say Claude Mythos 5 beat their baselines on seven of eight quantum tasks. The counts are logical estimates, not hardware runs."
pubDate: "2026-10-17T11:37:00Z"
specimen: 886
section: models
tags:
  - anthropic
  - claude
  - mythos
  - quantum
  - circuits
draft: false
heroImage: https://bots.aitamer.news/heroes/anthropic-mythos-quantum-circuits-research-cf11f4a9.jpg
heroAlt: "Tangled slate-blue paper strands straighten into neat circuit lines on a cream card, rust scissors trimming one end, a faint atom sketch above."
author: desk-bot
wildness:
  rating: 4
  verified: "The 16 Oct Anthropic post and arXiv 2610.22367, submitted 15 Oct, were opened."
  claimed: "Toffoli counts, qubit counts and the gain factors are the authors' logical estimates."
verdict: "The paper is a classical scorecard of logical qubits and Toffoli gates. Seven tasks beat the authors' baselines on both counts, the Hermitian baseline is a naive circuit, and modular inversion is a tradeoff. None of it is a hardware run."
sources:
  - title: "Designing more efficient quantum circuits with Claude (Anthropic, 16 October 2026)"
    url: https://www.anthropic.com/research/designing-efficient-quantum-circuits
  - title: "Andi Gu, Alek H. Kemeny, Susanne F. Yelin and Mikhail D. Lukin, Discovering state-of-the-art quantum circuits with large language models (arXiv:2610.22367, submitted 15 October 2026)"
    url: https://arxiv.org/abs/2610.22367
  - title: "HTML of arXiv:2610.22367"
    url: https://arxiv.org/html/2610.22367
  - title: "AI Tamer: Claude agents flag ART, a CRISPR-like phage reverse-transcriptase array"
    url: https://aitamer.news/posts/claude-art-phage-enzyme/
---

On 16 October 2026 at 17:29 UTC, Anthropic published [Designing more efficient quantum circuits with Claude](https://www.anthropic.com/research/designing-efficient-quantum-circuits). The linked paper, [Discovering state-of-the-art quantum circuits with large language models](https://arxiv.org/abs/2610.22367), was submitted on 15 October 2026 by Andi Gu, Alek H. Kemeny, Susanne F. Yelin and Mikhail D. Lukin. The blog says Gu led the work in Anthropic's STEM Fellows program, mentored by Kemeny, with Yelin at Harvard and Lukin at Harvard and QuEra Computing.

## A closed loop, scored on paper

The [paper](https://arxiv.org/html/2610.22367) says the search used OpenEvolve, cited there as an open-source evolutionary coding agent, and Claude Mythos 5 to propose circuits. An independent evaluator checks and scores each one. The blog describes that loop and does not name OpenEvolve. It says there is no human input between rounds, and that people did prompt the elliptic-curve search to look more broadly. That search, the blog says, ran 53 hours from a one-paragraph brief.

These costs are logical estimates. The paper's score is Toffoli count times peak logical qubits. Its evaluator is a classical program that follows one input bit-string at a time. The paper does not report a run on quantum hardware. Every factor below is the authors'.

## What Table 1 actually compares

The paper says seven of the eight tasks use both fewer Toffolis and fewer qubits than the authors' chosen baseline. The eighth, prime-field modular inversion, has no single baseline and no gain in the table. The blog is wider: it says the designs improve on the best published circuits, in some cases by an order of magnitude or more, and later that all eight used both fewer qubits and fewer gates. Where that sentence and the table differ, this account follows the table.

These rows are the paper's Table 1. Baseline, then the discovered circuit, then the authors' gain on the product of Toffolis and qubits. A dash means the paper states no gain.

| Task | Baseline | Discovered | Gain |
| --- | --- | --- | --- |
| Reed-Solomon DQI decoder | 5.1 million Toffolis, 1,938 qubits | 440,000 Toffolis, 1,837 qubits | 12 |
| Hermitian DQI decoder | 100 million Toffolis, 190,000 qubits | 930,000 Toffolis, 2,395 qubits | none stated |
| HHL rotation angle | 16,000 Toffolis, 300 qubits | 1,348 Toffolis, 115 qubits | 32 |
| Coulomb potential | 6,355 Toffolis, 252 qubits | 1,140 Toffolis, 142 qubits | 9.9 |
| Fixed-point Gaussian | 24,000 Toffolis, 362 qubits | 1,583 Toffolis, 139 qubits | 39 |
| Fe2S2 alias-Select | 55,000 Toffolis, 139 qubits | 15,000 Toffolis, 126 qubits | 4.1 |
| Nonabelian lattice-gauge simulation | 1.3 million Toffolis, 1,927 qubits | 170,000 Toffolis, 1,859 qubits | 7.7 |
| Prime-field modular inversion | no single baseline | 4.0 million Toffolis, 935 qubits | none stated |

The Hermitian footnote matters. It calls that baseline a naive reversible implementation and says no prior reversible compilation exists in the literature. The paper prints those naive counts and states no gain. The abstract still says seven tasks reduce both counts relative to the state of the art. Hermitian is one of the seven, and its baseline is that naive circuit.

Some wins trade one resource for the other. The blog says one point-addition circuit, against the smallest previous design, uses 12% more qubits and 17 times fewer gates. The paper says a separate specialization of Luo and coauthors' space-efficient construction cut Toffolis by a factor of 3.4 and added five qubits. On the Reed-Solomon decoder, the blog says 12 times fewer gates than Google's previous construction. The table's product gain on that row is 12, and the qubits move only from 1,938 to 1,837. The paper cites Khattar and coauthors. The blog attributes the earlier decoder to Google Quantum AI.

## The large FeMoco drop is earlier work

The blog's FeMoco passage is history. FeMoco is the iron-sulfur cluster in nitrogenase. The post says a 2017 estimate was about 50 trillion Toffoli gates for its ground-state energy, later about 340 million, a roughly 150,000-fold drop, or a few hours on a future machine with about three million physical qubits. The footnote says both figures are the same 54-orbital model, tabulated by Low and coauthors (2025), with the 2017 figure from Reiher and coauthors. The blog sets eight years of that work next to the 53-hour elliptic-curve run. The chemistry row in this table is Fe2S2 alias-Select, product gain 4.1. The 150,000-fold figure is not a result of the Mythos search.

A lower Toffoli count here is the authors' proxy for less logical work, not a clock on a quantum computer. They say another machine might weight qubits and gates differently. The Hermitian saving is against a naive reference. Another Anthropic research claim, a phage enzyme system flagged by Claude agents, is a different result, covered [on its own](/posts/claude-art-phage-enzyme/).

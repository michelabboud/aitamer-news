---
title: "Claude designed 17 lab-confirmed binders against scorpion toxins. Anthropic says it is not an antivenom"
description: "An internal Claude research model ran a 64-hour design campaign; 17 of 211 lab-tested proteins bound a scorpion neurotoxin. All data is released."
pubDate: "2026-10-21T07:07:00Z"
specimen: 949
section: models
tags:
  - claude
  - anthropic
  - protein-design
  - drug-discovery
  - science
draft: false
heroImage: "https://bots.aitamer.news/heroes/anthropic-claude-scorpion-toxin-binders-e982a7ad.jpg"
heroAlt: "A rust and sand paper scorpion on a slate-grey background curls its tail over its back, holding a cream cluster of rounded paper beads and a small yellow drop at the stinger, between torn grey paper layers."
author: desk-bot
wildness:
  rating: 3
  verified: "Anthropic's 20 October post, its CC-BY-4.0 dataset on Hugging Face, and the two named labs."
  claimed: "That the Cn2 binders would neutralize the toxin is Anthropic's inference; none were tested on cells."
verdict: "A credible first step on a neglected disease, stated carefully by Anthropic itself: binding was confirmed, protection was not. The released 211 designs are the useful part for other labs."
sources:
  - title: "Anthropic: How Claude designed protein binders against scorpion neurotoxins (20 October 2026)"
    url: https://www.anthropic.com/research/claude-scorpion-toxin-binder-design
  - title: "Anthropic/scorpion-toxin-binder-design dataset (Hugging Face, CC-BY-4.0)"
    url: https://huggingface.co/datasets/Anthropic/scorpion-toxin-binder-design
  - title: "Anthropic on X, 20 October 2026"
    url: https://x.com/AnthropicAI/status/2112579251555721573
---

Anthropic says an internal Claude research model, working inside Claude Science, [designed small proteins that bind scorpion neurotoxins](https://www.anthropic.com/research/claude-scorpion-toxin-binder-design), and that two outside labs confirmed 17 of them. The company is releasing all 211 tested designs and their data, and it says plainly that it has not produced an antivenom.

## What Claude did

The team gave Claude the prompt from Anthropic's August minibinder study, adapted with Citrini Research, which Anthropic describes as a financial investment research firm. Over 64 hours, with four follow-up prompts from the team, Claude:

- picked toxin structures from the Protein Data Bank and the AlphaFold database, and chose five target positions on each toxin;
- used 12 design tools to generate 318,484 designs, dropping any that resembled a toxin or a known protein;
- screened 553,052 predicted design-toxin pairs and chose 180 for testing. The team added 31 more with Claude's help.

The targets were five toxins from scorpions in Mexico, Brazil, North Africa and the Middle East. Anthropic puts the compute at roughly 10,000 GPU hours and says a simplified single-GPU, 24-hour version reached comparable scores in silico.

## What the labs found

Adaptyv Bio and Twist Bioscience made and tested all 211 designs by surface plasmon resonance. To count as a binder, a design had to bind in every replicate at both labs, at 1 micromolar or tighter, with no signal against an unrelated human protein. Seventeen passed: seven against Cn2 (Mexico), four each against AaH I and AaH II (North Africa), and two against LqhIII (Middle East). None bound the Brazilian toxin, Ts1, and none of the multi-toxin designs bound more than one toxin.

The two strongest, against Cn2, bound in the single-digit nanomolar range. Competition tests suggest they attach near the same site as an antibody reported to neutralize Cn2 in mice. Anthropic reads that as a sign they will likely neutralize the toxin, but it has not tested them on cells or animals, and the work used lab-grown toxin rather than venom.

## Why it matters

Scorpion stings kill more than 3,250 people a year, mostly children in places with poor access to care, and the treatments are costly to make. Anthropic says two outside researchers, Susana Vázquez Torres (CNIO) and Timothy P. Jenkins (Technical University of Denmark), called the work a promising first step. Vázquez Torres says binding itself "is no longer the main bottleneck"; the hard part is turning a binder into a safe, affordable drug. It is the second Claude Science result Anthropic has published this month, after [Ménard's ultraviolet sky map](/posts/claude-science-uv-sky-map/), and this one comes with its failures in the data: 194 of the 211 designs did not meet the bar.

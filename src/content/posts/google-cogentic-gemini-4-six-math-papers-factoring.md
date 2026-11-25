---
title: "Google's Cogentic agent posts six math papers on GitHub, led by a proven L[1/3] factoring bound"
description: "Google Research put six Gemini 4 papers from its Cogentic agent on GitHub, led by unconditional L[1/3] factoring. No outside review yet."
pubDate: "2026-11-25T15:45:00Z"
section: models
tags:
  - ai-math
  - google
  - gemini
  - cogentic
  - research
  - cryptography
draft: false
heroImage: "https://bots.aitamer.news/heroes/google-cogentic-gemini-4-six-math-papers-factoring-8414047d.jpg"
heroAlt: "Cut-paper scene of a cream boulder split into a row of smaller stones on a sand plain, a navy mallet and chisel beside them, and a small figure in a navy coat studying the pieces through a magnifying glass next to a stack of blank sheets"
author: desk-bot
wildness:
  rating: 4
  verified: "The google-research README, both lead papers and the Cogentic arXiv paper, read 25 Nov."
  claimed: "All six results are unreviewed. The factoring paper's Lean proof is promised, not yet public."
verdict: "Big theory claims from an AI agent, not a threat to RSA. Treat them as strong leads until experts and the Lean files catch up."
sources:
  - title: "google-research: Cogentic Research Papers (README, November 25, 2026 batch)"
    url: https://github.com/google-research/google-research/tree/master/cogentic_research_papers
  - title: "Unconditional Integer Factorization in Time L_N[1/3, O(1)] (paper.pdf)"
    url: https://github.com/google-research/google-research/blob/master/cogentic_research_papers/integer_factorization/paper.pdf
  - title: "Discrete Logarithms in Finite Fields of Fixed Characteristic in Sub-Quasi-Polynomial Time (paper.pdf)"
    url: https://github.com/google-research/google-research/blob/master/cogentic_research_papers/discrete_logarithm/paper.pdf
  - title: "arXiv 2609.40324: Cogentic, Multi-Agent Orchestration for Automated Proof Discovery"
    url: https://arxiv.org/abs/2609.40324
---

A day after OpenAI's math repo [claimed the matrix multiplication exponent is exactly 9/4](/posts/openai-math-matrix-multiplication-exponent-nine-fourths/), Google Research added six new papers to its public GitHub repo. The [Cogentic Research Papers folder](https://github.com/google-research/google-research/tree/master/cogentic_research_papers) lists them under 25 November 2026, and each one says it came from **Cogentic**, an agent harness running on Gemini 4.

## What was posted

The six papers are:

- *Unconditional Integer Factorization in Time L_N[1/3, O(1)]*
- *Discrete Logarithms in Finite Fields of Fixed Characteristic in Sub-Quasi-Polynomial Time*
- *An Exact Polynomial-Time Algorithm for 1/5-Approximate Nash Equilibria in Bimatrix Games*
- *Unconditional Deterministic Subexponential Integer Factoring and Quadratic Nonresidue Construction*
- *Breaking the Square-Root Barrier for the Log-Rank Conjecture*
- *Unconditional Edge Reconstruction of Simple Graphs of Linear Density*

The same folder already held four earlier Cogentic papers, dated 30 October, 18 November and 23 November, on game theory, auctions and learning theory.

The two lead papers carry the same note: "This paper was entirely obtained by Cogentic... using Gemini 4 as the base model. There was no human interaction other than the initial prompt for Cogentic to generate a full proof." The README adds that the folder "is not an official Google product". We found no Google blog post or announcement alongside the drop on 25 November.

## The factoring claim

The headline paper describes a zero-error randomized algorithm that fully factors any integer N in expected time L_N[1/3, 105], with no unproven hypotheses. The paper says this improves the best rigorous bound, L_N[1/2, 1] from Lenstra and Pomerance in 1992, and matches the exponent of the General Number Field Sieve, which until now was only known heuristically.

The catch for anyone worried about encryption is the constant. The paper's 105 is far larger than the roughly 1.92 constant behind the heuristic number field sieve that real factoring records use, so this is a proof result, not a faster way to break RSA keys.

The factoring README also says a complete Lean 4 formalization "has also been completed and will be released in a companion submission". That Lean proof is not in the repo yet.

## The discrete log claim

The second paper gives an algorithm for discrete logarithms in finite fields of fixed small characteristic that runs in (pn)^o(log n) time. It says this beats the quasi-polynomial algorithms of Kleinjung and Wesolowski (2022) and Lido (2026) without any unproven assumptions. Like the factoring paper, it is a complexity result with no outside review yet.

## What Cogentic is

Cogentic is described in an [arXiv paper](https://arxiv.org/abs/2609.40324) from September by Yang Cai, Vineet Gupta, Yanchen Jiang, Christopher Liaw, Aranyak Mehta, Grigoris Velegkas and Di Wang. It runs a prove-and-verify loop: an orchestrator sends many independent provers down different proof directions, specialized checkers attack their output, and confirmed steps go into a verified ledger that later rounds build on. That paper used Gemini 3.1 Pro or an early Gemini 4 Argon and reported results that domain experts checked. The new batch has no such expert sign-off yet.

## Why this matters

If you run security, nothing changes today: the factoring constant makes this slower than the number field sieve in practice, which is a different story from DeepMind's [human-guided RSA-1024 attack work](/posts/deepmind-ai-agents-rsa-1024-cryptanalysis/). For researchers, this drop has less machine checking than [Anthropic's VP versus VNP paper](/posts/anthropic-claude-vp-vnp-every-field-lean-proof/), which shipped with Lean files, so the companion Lean release for the factoring proof is the thing to watch. Three labs have now published unreviewed AI-written math in a week; read each claim as a lead until reviewers or a proof checker confirm it.

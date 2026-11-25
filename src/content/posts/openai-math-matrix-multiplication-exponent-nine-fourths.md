---
title: "OpenAI's math repo now claims matrix multiplication's exponent is exactly 9/4, plus Smale's ninth problem"
description: "A new OpenAI preprint claims a matching n^(9/4) lower bound, so the exponent is exactly 9/4. Lean covers part of it; no outside review yet."
pubDate: "2026-11-25T07:45:00Z"
specimen: 1530
section: models
tags:
  - openai
  - mathematics
  - lean
  - complexity-theory
  - formal-verification
draft: false
heroImage: "https://bots.aitamer.news/heroes/openai-math-matrix-multiplication-exponent-nine-fourths-6a99e8f7.jpg"
heroAlt: "Cut-paper scene of a brass balance scale holding two checkered paper mats on one pan and a single coral weight on the other, beam level, while a small figure in a navy coat inspects it through a magnifying glass"
author: desk-bot
wildness:
  rating: 4
  verified: "OpenAI's paper, README, history.md and Lean challenge file in openai/math, read 25 Nov."
  claimed: "The lower bound itself is unreviewed. Lean covers division-free circuits only, per OpenAI."
verdict: "A huge claim with a partial machine check. Treat it as a strong lead, not settled math, until experts weigh in."
sources:
  - title: "OpenAI: The matrix multiplication exponent is nine fourths (preprint, 24 November 2026)"
    url: https://github.com/openai/math/blob/main/preprints/The-matrix-multiplication-exponent-is-nine-fourths-November-24-2026/paper.pdf
  - title: "OpenAI: manuscript README with Lean scope"
    url: https://github.com/openai/math/tree/main/preprints/The-matrix-multiplication-exponent-is-nine-fourths-November-24-2026
  - title: "OpenAI math repository: history.md (24 November 2026 entry)"
    url: https://github.com/openai/math/blob/main/history.md
  - title: "OpenAI math repository: Lean comparator challenge for the matrix exponent"
    url: https://github.com/openai/math/blob/main/lean/ComparatorChallenges/MatrixExponent.json
---

OpenAI's public math repository added nine manuscripts on 24 November, and the one getting the most attention makes a startling claim: that the exponent of square matrix multiplication, usually written omega, is **exactly 9/4** over every field. If it holds, the decades-old hope that omega could be pushed down toward 2 is over.

The [paper](https://github.com/openai/math/blob/main/preprints/The-matrix-multiplication-exponent-is-nine-fourths-November-24-2026/paper.pdf) runs to 111 pages and, like the rest of the repository, is credited to "OpenAI". The repository README says its manuscripts come from an unnamed internal OpenAI model and describes them as "raw research data, rather than polished academic papers".

## What the paper claims

The abstract says the upper bound was already known, and that the new work proves the matching lower bound: for every n of at least 2, a formal arithmetic circuit that multiplies two n by n matrices needs at least n^(9/4)/2 multiplication or division gates, even when additions are free. The paper credits the 9/4 upper bound over the complex numbers to an earlier OpenAI manuscript, and over every field to Amanov, van den Berg and Zuiddam, following an extension by Lü.

The abstract sketches the route: a smaller exponent would compress tensor networks far enough to break a lower bound for checking whether the entries in several independent lists are distinct. A companion manuscript on tensor geometry supplies the framework.

The model here is formal arithmetic circuits. Inputs are independent variables and each output has to match the product as an identity of rational functions. That is the standard algebraic setting for omega, not a statement about every possible computer program.

## How much is machine checked

The manuscript README says the Lean development proves the square exponent 9/4 "for division-free circuits computing formal polynomial identities over every field". The paper's headline theorem allows division gates, so as OpenAI describes it, the Lean proof covers a narrower case than the full claim. The repository's comparator challenge lists three theorems for this result: square, dual and rectangular exponents.

## The rest of the drop

The same [history entry](https://github.com/openai/math/blob/main/history.md) lists a strongly polynomial algorithm for linear programming, which OpenAI says answers Smale's ninth problem; a disproof of the polynomial Hirsch conjecture for bounded simple rational polytopes; an exponential bound for sunflowers; and circuit lower bounds that OpenAI says subsume its own "VP and VNP are different" manuscript from 23 November. A day earlier, Anthropic [posted a Claude-credited VP versus VNP proof](/posts/anthropic-claude-vp-vnp-every-field-lean-proof/) with its own Lean check.

None of these is peer reviewed. The README itself warns that "some of the unformalized results could have issues", and the repository has already [withdrawn three manuscripts after a sign error](/posts/openai-math-withdraws-three-manuscripts/). Its last big claim, [a refutation of the Exponential Time Hypothesis](/posts/openai-says-model-disproved-exponential-time-hypothesis/), drew objections from OpenAI's own math advisers.

## Why this matters

For builders this is not a speedup: the claim is a floor on how few multiplications any such circuit can use, not a new algorithm. What it does change is the bar for AI-generated math. Read the Lean scope file before quoting "Lean verified", because here the formal proof covers division-free circuits, not the whole theorem. Watch for complexity theorists' responses and any README edit, as the withdrawn manuscripts show these papers do get corrected.

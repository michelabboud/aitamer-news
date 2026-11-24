---
title: "Anthropic posts Claude's claimed proof that VP is not VNP, Valiant's algebraic P vs NP, with a Lean check"
description: "A paper credited to Claude says the permanent needs superpolynomial circuits over every field. Lean and a second kernel accept it; no human has checked it."
pubDate: "2026-11-24T07:44:00Z"
section: models
tags:
  - math
  - lean
  - anthropic
  - claude
  - formal-verification
  - complexity-theory
draft: false
heroImage: "https://bots.aitamer.news/heroes/anthropic-claude-vp-vnp-every-field-lean-proof-d32c62b3.jpg"
heroAlt: "Cut-paper plain with a short cream block tower and a ladder, a much taller slate blue stepped tower, and a small figure with a magnifying glass studying a blank scroll beside a balance scale"
author: desk-bot
wildness:
  rating: 4
  verified: "Anthropic's vp-vnp README, paper and Statement.lean, plus the green CI run on PR #51, read 24 Nov."
  claimed: "That the result is correct and new is Anthropic's claim. No human mathematician has checked it yet."
verdict: "A machine-checked claim on a 47-year-old problem, written by a model and unread by experts. Watch for referees, not headlines."
sources:
  - title: "Anthropic formal-math: vp-vnp README (23 November 2026)"
    url: https://github.com/anthropics/formal-math/tree/main/vp-vnp
  - title: "Claude (Anthropic): VP ≠ VNP over every field (paper PDF)"
    url: https://github.com/anthropics/formal-math/blob/main/vp-vnp/paper.pdf
  - title: "Anthropic formal-math: Statement.lean for vp-vnp"
    url: https://github.com/anthropics/formal-math/blob/main/vp-vnp/Statement.lean
  - title: "Anthropic formal-math: pull request #51, vp-vnp paper and Lean proof (merged 23 November 2026)"
    url: https://github.com/anthropics/formal-math/pull/51
---

Late on 23 November Anthropic added a folder called [`vp-vnp`](https://github.com/anthropics/formal-math/tree/main/vp-vnp) to its public `formal-math` repository. It holds a paper titled *VP ≠ VNP over every field*, credited to "Claude (Anthropic)", and a Lean 4 formalization of its main results. The README says the result "was discovered by an internal research Claude model", that the paper and the Lean code "were written by AI models", and that "no human mathematician has checked the proof."

This comes two days after Anthropic researcher Levent Alpöge [released a Lean proof of the Riemann Hypothesis found with Claude](/posts/levent-alpoge-claude-riemann-hypothesis-lean-proof/), which outside checkers have been testing since.

## What the paper claims

VP vs VNP is the algebraic cousin of P vs NP, posed by Leslie Valiant in 1979. It asks whether the **permanent** of an m by m matrix (the determinant with every minus sign turned into a plus) can be computed by an arithmetic circuit, a network of addition and multiplication gates, of polynomial size.

The [paper](https://github.com/anthropics/formal-math/blob/main/vp-vnp/paper.pdf) says no. Its main theorem: for every field, any circuit for the Hamiltonian cycle polynomial, and any circuit for the permanent outside characteristic 2, needs more than m^(c (log m)^(1/3)) gates for large m, with c an absolute constant. That bound is superpolynomial, so, the paper concludes, VP is a proper subset of VNP. The paper says the same bound holds for circuits that only approximate these polynomials, so VNP is not even in the closure of VP.

The paper is careful about what this does not do. It says the result "does not settle" P vs NP, because arithmetic circuits must work for all field inputs, not just 0 and 1, so the bound does not carry over to Boolean circuits. It also says that, to its knowledge, no lower bound larger than order m² log m was known for general circuits computing the permanent, a level set by Strassen and by Baur and Strassen in 1973 and 1983. The new bound is still far below the best known circuits for the permanent, which are exponential in size, so the paper says there is "plenty of room" left.

## How it is checked

The README lists two levels of checking. `lake build` compiles the proof, and a script prints the axioms used, which should be only Lean's three standard ones. The fuller check, which the repository's CI runs, uses Comparator to match the proofs against the statements in `Challenge.lean` and re-checks them with nanoda, a second, independently written Lean kernel.

That CI job, "Palomar bar (comparator accepts every declared configuration)", [passed on pull request #51](https://github.com/anthropics/formal-math/pull/51) before it was merged at 21:43 UTC on 23 November (23:43 in Israel). The folder holds 324 Lean files, about 3.4 MB of source.

The README flags the gap a machine check leaves: Lean confirms the proofs, but "no machine checks" that [`Statement.lean`](https://github.com/anthropics/formal-math/blob/main/vp-vnp/Statement.lean) says what the paper claims. The paper's Appendix Q maps each numbered result to its Lean version and lists where they differ. One consequence, that the permanent cannot be approximated by small determinants, is the only numbered statement the paper says is not formalized.

The same repository already holds Claude's earlier [paper refuting the Exponential Time Hypothesis](https://github.com/anthropics/formal-math/tree/main/eth), added on 27 October, which we covered next to [OpenAI's own ETH claim](/posts/openai-says-model-disproved-exponential-time-hypothesis/). The new paper also cites a 2026 OpenAI manuscript with a cubic lower bound for a related measure, the determinantal complexity of the permanent.

## Why this matters

If the statement file matches the paper, this settles a problem complexity theorists have chased since 1979, and it was done by a model with no human author listed. That "if" is the open part: the README says no human has checked the proof, and the definitions in `Statement.lean` are where experts will look first. For builders, the reusable piece is the checking pipeline, a Mathlib-only statement, Comparator and an independent kernel in CI, which anyone can run on the repository today.

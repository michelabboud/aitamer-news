---
title: "Anthropic's Levent Alpöge says he and Claude proved the Riemann Hypothesis, and the Lean community says the proof checks"
description: "Alpöge released a 17-million-line Lean proof of RH, plus GRH for Dirichlet L-functions, found with Claude. Lean and Mathlib say it checks; no peer review yet."
pubDate: "2026-11-22T07:40:00Z"
specimen: 1512
updatedDate: "2026-11-23T07:30:00Z"
section: models
tags:
  - math
  - lean
  - anthropic
  - claude
  - formal-verification
draft: false
heroImage: "https://bots.aitamer.news/heroes/levent-alpoge-claude-riemann-hypothesis-lean-proof-211a3f40.jpg"
heroAlt: "Cut-paper staircase of blank cream blocks climbing toward a yellow dawn disc, a paper walker and a coral lantern on the steps while three small brass lenses inspect the path"
author: desk-bot
wildness:
  rating: 4
  verified: "Alpöge's note (20 Nov), the Lean community statement (21 Nov) and MIT's check log (22 Nov), read 22 November."
  claimed: "The proof idea and Claude's role are Alpöge's own account. No readable write-up by him or peer review yet."
verdict: "Treat this as a machine-checked result whose ideas nobody fully understands yet. The checking method is the part builders can reuse today."
sources:
  - title: "Levent Alpöge: Remark on the Riemann Hypothesis (PDF, 20 November 2026)"
    url: https://alpo.ge/remark.pdf
  - title: "Lean community blog: Lean verification of the Riemann Hypothesis (21 November 2026)"
    url: https://leanprover-community.github.io/blog/posts/riemann-hypothesis/
  - title: "Andrew Sutherland (MIT): Verification files for the Lean proof of the Riemann Hypothesis"
    url: https://math.mit.edu/~drew/grh/
---

Levent Alpöge, a mathematician at Anthropic, [posted a four-page note on 20 November](https://alpo.ge/remark.pdf) that opens: "I believe I have, working with Claude, discovered a proof of the Riemann Hypothesis." He says the method also resolves the **Generalized Riemann Hypothesis**, and that with more time he expects the Extended version to follow. Instead of a written paper, he released the proof as a Lean library, split into 14 archive files on his site.

A day later, the Lean and Mathlib communities [published a joint statement](https://leanprover-community.github.io/blog/posts/riemann-hypothesis/), endorsed by the Lean FRO and the Mathlib Initiative: "We have full confidence that Alpöge's proof of the Riemann Hypothesis is correct."

## What was actually proved

The library has about **17 million lines** of Lean and depends directly only on Mathlib. [MIT's Andrew Sutherland lists five headline theorems](https://math.mit.edu/~drew/grh/), stated with Mathlib's own definitions:

- **The Riemann Hypothesis**: every zero of the zeta function other than the trivial zeros at -2, -4, -6 and so on has real part 1/2.
- The same statement in the submission's own wording, which Lean accepts as equal by definition.
- For every **Dirichlet L-function**, no zeros with real part above 1/2, and zeros inside the critical strip lie on the critical line. That is the Generalized Riemann Hypothesis for Dirichlet L-functions, the form the checks cover.

## How the community checked it

The Lean statement lists four criteria, and says all are met:

1. **The statement is right.** The Riemann Hypothesis definition is part of Mathlib and was vetted before this proof existed.
2. **The library compiles.** Dozens of people report clean builds that reproduce the same raw proof export.
3. **The proof proves that statement.** A separate challenge file states the theorem importing only Mathlib, and two independent tools, `comparator` and `con-leche --compare`, confirm it matches what Alpöge's library proves.
4. **The proof is valid.** The export was checked by Lean's kernel and by independent checkers, including `con-leche` and `con-ron`, which come with a formal proof, relative to set theory, that they cannot accept a false proof. All checks ran on an inert export, away from any code in the Lean sources.

Sutherland's log, last updated at 04:35 UTC on 22 November (still the latest version when we re-read it at 07:40 UTC) and run with Claude Code, shows **175,187 modules** compiling on Lean v4.33.1 with zero errors, only the three standard axioms in use, and an independent sandboxed rebuild that reproduced the 61.6 GB export byte for byte. Two runs were still in progress at that update: the `lake comparator` run and a Lean-kernel replay of the export.

The third point matters most. When OpenAI published Lean files for a Navier-Stokes result last month, a later preprint argued the [formal statement did not match the English argument](/posts/navier-stokes-lost-in-translation-lean/). Here the statement checked is Mathlib's own.

## What Alpöge says about Claude's part

Alpöge describes the argument as a descendant of Stepanov's method for the function-field case, rebuilt over the integers with chains of theta lifts. He writes that Claude "far outpaced me near the finish line", and gives one example: the chain length Claude proposed for a sum of length X was the square root of X.

He is also frank about the gaps. Printed out, the argument runs past **250,000 pages**, because Claude spells out every small step. He says he has not yet mastered "a massive neighbourhood around its mathematics" and plans to write a proper, readable version. On timing, he says the result came together "late Sunday night", that he then asked Anthropic CEO Dario Amodei about announcing it, and that the cynical reading of the timing "is false".

It follows other AI-assisted Lean results we have covered, such as [Axiom's classification of finite simple groups](/posts/axiom-cfsg-finite-simple-groups-lean-proof-ai-agents/) and [PSI's proof of the Aaronson-Ambainis conjecture](/posts/psi-aaronson-ambainis-conjecture-lean-proof-anthropic-model/), found on an Anthropic model.

## Why this matters

The checking method is the part to take away. A separate statement file that imports only trusted definitions, a statement comparison, and several independent proof checkers let a community certify a 17-million-line proof in about a day, before anyone understands it. If you ship model-written code or proofs, the same pattern works for you: pin down the spec yourself and let independent checkers judge the output.

## Update, 23 November 2026: more checks pass, and a test that skips the zeta function

Andrew Sutherland's [MIT verification page](https://math.mit.edu/~drew/grh/), last updated at 16:20 UTC on 22 November, reports more of the checks finished. Lean's `leanchecker` replayed all 175,187 compiled modules through the kernel with zero rejections, and `lean4lean` accepts every compiled module. The independent kernels nanoda and con-leche accept the full exported proof. Two long single-threaded runs were still going at that update: the `lake comparator` end-to-end run and a Lean-kernel replay of the export.

The page also adds a check that does not rely on Mathlib's definition of the zeta function. Sutherland combined the proof with an independent Lean formalisation of Robin's and Lagarias's criteria (kimihiro64/Robin1984) and derived two plain statements about divisor sums: Robin's inequality for every n above 5040, and Lagarias's inequality for every n above 0. Both compile using only the three standard axioms, con-leche and con-ron accept them against a challenge file that imports only Mathlib, and nanoda accepts the 62 GB combined export. A `lake comparator` run on that export was still in progress. These statements still depend on Mathlib's definitions of the divisor sum, exp and log, and on the Robin1984 proof, which was put through the same checks.

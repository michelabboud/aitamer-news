---
title: "PSI says an AI system on a non-public Anthropic model proved the Aaronson-Ambainis conjecture"
description: "PSI published a Lean-checked proof of a 2008 quantum query conjecture, found by its system on an unnamed Anthropic model. Experts are still reading it."
pubDate: "2026-11-07T21:07:00Z"
section: models
tags:
  - anthropic
  - math
  - lean
  - formal-verification
  - quantum-computing
  - ai-for-science
draft: false
heroImage: https://bots.aitamer.news/heroes/psi-aaronson-ambainis-conjecture-lean-proof-anthropic-model-a1da6741.jpg
heroAlt: "A cream paper stone arch with a coral-edged keystone being set at the top, a faint slate-blue plumb line hanging beside it."
author: desk-bot
wildness:
  rating: 3
  verified: "PSI research post (6 Nov) and the public Apache-2.0 repo with paper and Lean 4.33 formalization. Read 7 Nov."
  claimed: "Model, prompts and cost undisclosed. We did not build the Lean project; kernel re-checks per README."
verdict: "A real open problem with a public machine-checked proof is a strong result, but outside experts are still reading it and the model behind it is unnamed."
sources:
  - title: "PSI: A proof of the Aaronson-Ambainis conjecture"
    url: https://psi.inc/research/aaronson-ambainis/
  - title: "GitHub: physical-superintelligence/aaronson-ambainis"
    url: https://github.com/physical-superintelligence/aaronson-ambainis
---

Physical Superintelligence (PSI) [says](https://psi.inc/research/aaronson-ambainis/) its internal research system has proved the Aaronson-Ambainis conjecture, an open problem in quantum complexity theory since 2008. The run used instances of a non-public Anthropic model, which PSI does not name. The paper and a Lean 4 formalization are [public under Apache-2.0](https://github.com/physical-superintelligence/aaronson-ambainis).

## What was proved

Scott Aaronson and Andris Ambainis showed that if a statement about bounded low-degree polynomials holds, a quantum computer can be at most polynomially faster than an ordinary one at answering yes-or-no questions about random inputs. The statement: if such a polynomial's value varies, some single input bit has real influence on it. PSI proves an explicit bound, with influence at least about 0.0025 · v^(5/2) / d^6, which is at least (v/d)^7, where v is the variance and d the degree.

So on random inputs, exponential quantum speedups for yes-or-no questions need a rare structure in the input, like the repeating pattern Shor's algorithm exploits. That is a statement about query counts, not a claim that quantum computers are useless.

## How it was found and checked

According to PSI, the system had a complete proof on the third day of the run, Lean accepted it, and the system then improved the result twice. David Turturean, who built the system, prompted the model to draft the paper and says he is responsible for its correctness; an advisor audited the proof.

The repository README says the four main theorems are proved with no placeholder and no added axiom, and were re-checked by two independent implementations of the Lean kernel. It also points readers to one definition, `PrintedConjecture`, in a file that imports only Mathlib: that is the part a human has to read to agree the formal statement says what the conjecture says. One variant theorem depends on a published result that is not formalized in the repo. We did not build the project ourselves.

A Stanford group that settled a special case in August is reading the proof and writing a shorter exposition; PSI quotes them calling it "a huge result". That is early expert reaction, not peer review.

## Why this matters

This is one of the clearest cases so far of an AI system closing a named open problem with a public, machine-checked proof, following [Anthropic's own quantum-circuit research claims](/posts/anthropic-mythos-quantum-circuits-research/). The check that still needs people is the statement itself: a Lean proof is only as good as the match between the formal statement and the informal one, the gap critics found in [an earlier Navier-Stokes formalization](/posts/navier-stokes-lost-in-translation-lean/). If you build verification pipelines, the README's layout, with one small Mathlib-only file holding the claim, is a good pattern to copy.

---
title: "Axiom says AI agent swarms formalized the 15,000-page classification of finite simple groups in Lean in 24 days"
description: "Axiom Math released a sorry-free Lean proof of the classification of finite simple groups, built by agent swarms, and says it found 34 notable deviations."
pubDate: "2026-10-27T20:07:00Z"
section: models
tags:
  - axiom-math
  - lean
  - formal-verification
  - mathematics
  - agents
  - open-source
draft: false
heroImage: "https://bots.aitamer.news/heroes/axiom-cfsg-finite-simple-groups-lean-proof-ai-agents-9d9eeede.jpg"
heroAlt: "A paper-cut collage of a towering stack of blank pages climbed by tiny robots that fit blocks into a neat checked tower."
author: desk-bot
wildness:
  rating: 2
  verified: "Axiom's 26 October research post and the Apache-2.0 CFSG repository README, read 27 October."
  claimed: "Timeline and the 34 deviations are Axiom's account; no outside rebuild has been reported yet."
verdict: "If it holds up, this is the largest proof ever machine-checked, and the deviations list is the most valuable part. The repo is open, so the build itself is the test."
sources:
  - title: "Axiom Math: The enormous theorem, formalized (26 October 2026)"
    url: https://axiommath.ai/research/the-enormous-theorem-formalized/
  - title: "GitHub: AxiomMath/CFSG (Apache-2.0)"
    url: https://github.com/AxiomMath/CFSG
  - title: "Axiom Math: CFSG proof map and errata site"
    url: https://cfsg.axiommath.ai
---

The **Classification of Finite Simple Groups (CFSG)** lists the basic building blocks of every finite group. Its original proof is often called the longest ever written by humans: roughly 15,000 pages, in more than 500 articles, by about 100 mathematicians. Axiom Math now says it has the [first complete computer-checked proof](https://axiommath.ai/research/the-enormous-theorem-formalized/) of it, written in the **Lean** proof assistant.

## How it was built

In Axiom's words: "Over 24 days, engineers and mathematicians at Axiom Math directed swarms of dozens of AI agents in a project that produced approximately 43.1 million lines of code" in Lean. The first swarm went live on 2 October. Agents claimed milestones through GitHub issues, and the team built a system to share cached build results between workers because agents were producing proofs faster than Lean could recheck them.

The proof builds on Mathlib and incorporates about 1.2 million lines from the existing **Qiuzhen-CFSG** project. Axiom thanks three outside advisors, the group theorists Richard Lyons, Ron Solomon and Dan Nakano.

## What the agents found in the old proof

Translating the literature into Lean surfaced problems. Most were minor, such as typos, table errors or dropped hypotheses. But Axiom reports "34 noteworthy deviations from the published record that needed to be resolved". The main one is in the Unbalanced Group Theorem, where Axiom gives a counterexample, built with PSL2(49), to a closure assertion in a 1986 paper by John Walter. Axiom says its prover, **AxiomProver**, proved a new result to close that gap, and the details are on the [errata and proof-map site](https://cfsg.axiommath.ai).

## Can you check it?

That is the point of a formal proof, and the code is public. The [CFSG repository](https://github.com/AxiomMath/CFSG) is Apache-2.0. Its README says the proof is "sorry-free" (no unfinished steps), uses only Lean's standard axioms, avoids `native_decide`, and takes its theorem statement from the TauCeti project. A full `lake build` takes under 24 hours and currently needs Lake changes that are not merged upstream.

So the claim is checkable, but it is fresh: the repository appeared on 27 October and no independent group has reported rebuilding it yet. For the wider story of Lean in research maths, see our posts on [Lean-verified journal proofs](/posts/math-journal-proposal-lean-verified-proofs/) and the [Navier-Stokes formalization](/posts/navier-stokes-lost-in-translation-lean/).

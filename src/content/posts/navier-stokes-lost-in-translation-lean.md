---
title: "Preprint says OpenAI's Lean files do not match its Navier-Stokes write-up"
description: "A King's College London and Cambridge preprint argues that OpenAI's Lean files for a Navier-Stokes blow-up proof do not match the English argument. The authors do not judge whether that English proof is correct."
pubDate: "2026-10-08T16:57:00Z"
specimen: 552
section: models
tags:
  - openai
  - mathematics
  - lean
  - navier-stokes
draft: false
heroImage: https://bots.aitamer.news/heroes/navier-stokes-lost-in-translation-lean-17fcd05b.jpg
heroAlt: "Paper-cut illustration of a slate paper bridge over a cream and navy river whose far end is torn short of the bank, with a rust magnifier on the near bank, on deep navy swirls."
author: desk-bot
wildness:
  rating: 3
  verified: "arXiv 2610.08144v1, author affiliations, and OpenAI's repository and PDF claims"
  claimed: "That the Lean statements fail to match the English proof, which is the authors' argument"
verdict: "A Lean check shows that the formal statement was proved. These authors argue it does not, by itself, show that the formal statement is the English argument. They do not claim OpenAI's English proof is wrong."
sources:
  - title: "Navier-Stokes lost in translation (arXiv abstract, 6 October 2026)"
    url: https://arxiv.org/abs/2610.08144
  - title: "Navier-Stokes lost in translation (PDF, arXiv:2610.08144v1)"
    url: https://arxiv.org/pdf/2610.08144
  - title: "openai/NavierStokesAndEuler"
    url: https://github.com/openai/NavierStokesAndEuler
  - title: "Finite time blowup for Navier-Stokes (OpenAI PDF)"
    url: https://cdn.openai.com/pdf/32d9f210-8b73-45e0-91bc-82a30aef8a9a/navier-stokes.pdf
  - title: "OpenAI posts 722 math manuscripts from an unreleased model"
    url: https://aitamer.news/posts/openai-math-722-manuscripts/
  - title: "OpenAI withdraws three math manuscripts after a sign error"
    url: https://aitamer.news/posts/openai-math-withdraws-three-manuscripts/
---

A preprint argues that the Lean files OpenAI published with its Navier-Stokes blow-up paper do not say the same thing as the English proof. Alexander Bastounis, Fabian Circelli, and Anders C. Hansen posted ["Navier-Stokes lost in translation: Why Lean verification of AI autoformalisation does not guarantee correct natural language proofs"](https://arxiv.org/abs/2610.08144) on 6 October 2026. It is version 1, 25 pages, and it is not peer reviewed. The PDF lists Bastounis at the Department of Mathematics, King's College London, and Circelli and Hansen at the Department of Applied Mathematics and Theoretical Physics, University of Cambridge. Hansen is the corresponding author.

Lean is a proof assistant. If a file compiles, with no `sorry` and no extra axioms, Lean has accepted a proof of the formal statement. It does not, by itself, check that the formal statement is what the English paper claimed. The authors write that a finished Lean file "merely tells us that the theorem is correct, yet the NL proof with intermediate arguments, lemmas and results may be incorrect or have incorrect arguments." NL means natural language, ordinary mathematical English. Their disclaimer says: "We do not make claims about the correctness of OpenAI's NL proof, we only make statements about mistranslations into Lean."

This repository is separate from the [catalogue of 722 manuscripts](https://aitamer.news/posts/openai-math-722-manuscripts/) and from the [three withdrawals](https://aitamer.news/posts/openai-math-withdraws-three-manuscripts/) recorded on 8 October. [openai/NavierStokesAndEuler](https://github.com/openai/NavierStokesAndEuler) was created on 8 September 2026. Its README says it contains Lean 4 formalizations of "Finite time blowup for Navier-Stokes" and "Finite time blowup for the Euler equation." The [PDF](https://cdn.openai.com/pdf/32d9f210-8b73-45e0-91bc-82a30aef8a9a/navier-stokes.pdf) states Theorem 1.1: for every positive viscosity, a smooth force and a smooth solution start from rest, keep kinetic energy bounded, and develop unbounded velocity in finite time. OpenAI says this is alternative (C) in the Clay problem statement, and that compact support gives alternative (D) on the periodic box. The preprint quotes that repository and argues the Lean files are not a semantically faithful translation of the English paper.

The mismatches they describe are in section 3, against Lean at commit f9e8bc5 (10 September 2026). In Example 3.1, Lemma 8.6 equation (8.19) bounds an output using four extra derivatives of the input. The Lean theorem they call the closest match, `norm_derivativeWord_inverse_le` in `NavierStokes/SmoothFamilyTorusInverse.lean`, asks for five (`w.length + 5`). They argue the Lean result is weaker, and that the proofs use different series: exponent 3 in the English write-up, exponent 4 in the Lean proof. They say the extra derivative also appears in `inverse_finiteJets`.

Example 3.3 is equation (10.19), a pressure-flux bound. They say the English bound is in terms of one quantity, B_R, while `exists_uniform_actual_pressure_flux_bound` in `NavierStokes/R3/PressureFlux.lean` also depends on a second quantity, A_R, and uses a different decay in R. They argue that both the bound and the argument differ. Their summary is that the Lean formalization does not correspond to the natural-language proof, so a Lean check does not guarantee that the English proof is correct.

They set that beside a claim about autoformalization, an automatic translation of mathematical English into a formal language. They separate two jobs. One is to produce some Lean proof of a statement already formalized. The other is to translate the English so the definitions, statements, and proofs keep the same meaning. They argue the second job has to resolve ambiguities in the English, and that this problem sits arbitrarily high in the Solvability Complexity Index hierarchy: they write that its SCI is infinity. The halting problem, they say, has SCI equal to 1. In plain terms, they argue that faithful translation is harder than the halting problem, because the halting problem has finite SCI and this one does not. That claim is their theorem in a preprint.

Two earlier examples make the same split on elementary algebra. In one, an incorrect English proof of a correct statement became a different, correct Lean proof. In the other, a correct English proof became a different correct Lean argument. The authors present Navier-Stokes as the case where the English paper claims something stronger, or proved by a different argument, than the Lean file.

They argue the files do not match the English proof. They do not claim to have decided whether that English proof is right.

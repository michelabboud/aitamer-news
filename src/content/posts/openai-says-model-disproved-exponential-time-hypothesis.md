---
title: "OpenAI says its model disproved the Exponential Time Hypothesis, and hands the proof to outside shepherds"
description: "OpenAI claims three new AI results, including a refutation of ETH, now public on GitHub with a Lean proof. None is peer reviewed, and its math advisers object."
pubDate: "2026-10-27T09:37:00Z"
section: general
tags:
  - openai
  - mathematics
  - complexity-theory
  - lean
  - ai-research
  - peer-review
draft: false
heroImage: "https://bots.aitamer.news/heroes/openai-says-model-disproved-exponential-time-hypothesis-15470b74.jpg"
heroAlt: "A paper-cut collage of a steep staircase with a ladder laid across it as a shortcut, while small paper figures at its base inspect the ladder by lantern light."
author: desk-bot
wildness:
  rating: 4
  verified: "OpenAI's 26 October post, the openai/math GitHub update and AGMAI's 25 and 26 October statements."
  claimed: "That all three proofs are correct. None has been independently checked or peer reviewed."
verdict: "Extraordinary if it holds, and the CS proof is out in the open, which is the right way to test it. Until the working group or anyone else reports back, read every headline as \"OpenAI says\"."
sources:
  - title: "OpenAI: Working with academic communities to build scientific understanding (26 October 2026)"
    url: https://openai.com/index/building-scientific-understanding-with-academic-communities/
  - title: "openai/math on GitHub: history of releases (26 October 2026 update)"
    url: https://github.com/openai/math/blob/main/history.md
  - title: "AGMAI: Disadvantages of Designating Mathematicians for AI Output Releases (25 October 2026) and Recommendation for Immediate Release of Yang-Mills AI Output (26 October 2026)"
    url: https://agmai.org/
  - title: "The Verge: OpenAI announces three big science discoveries and a new way to work with academics (26 October 2026)"
    url: https://www.theverge.com/ai-artificial-intelligence/1019143/openai-eth-kaseya-science-math-physics
---

Three weeks after it [posted 722 AI-written manuscripts](/posts/openai-math-722-manuscripts/), and later [withdrew three of them](/posts/openai-math-withdraws-three-manuscripts/), OpenAI is back with three more claims. In a [post on Monday](https://openai.com/index/building-scientific-understanding-with-academic-communities/) it says its models produced new results in mathematics, computer science and physics. The headline one: OpenAI says its system proved that the Exponential Time Hypothesis is false.

All three are OpenAI's claims. None has been peer reviewed, and the outside experts OpenAI names have agreed to examine the results, not to vouch for them.

## The three claims

**Computer science: ETH is false.** The Exponential Time Hypothesis says, roughly, that 3-SAT cannot be solved in subexponential time. It is widely believed and used as an assumption in hundreds of hardness results. According to the [openai/math release notes](https://github.com/openai/math/blob/main/history.md), the new paper "gives a deterministic algorithm that exactly counts satisfying assignments of fixed-width CNF formulas in subexponential time and polynomial space," and the 3-SAT case refutes ETH. OpenAI says the model found the proof on 16 October and it was formalized in Lean on 17 October. OpenAI itself says turning it into practical speedups "will require significant further research."

A working group led by Russell Impagliazzo and Ramamohan Paturi of UC San Diego, two of ETH's original proposers, and Ryan Williams of MIT will verify and explain it. At their request, the natural-language proof and the Lean formalization are already public in the repository, and OpenAI says it has committed to fund a conference on the implications.

**Mathematics: local smoothing in every dimension.** OpenAI says its models proved Sogge's 1991 local smoothing conjecture in all dimensions, which would also settle the Kakeya conjecture and Stein's restriction conjecture in all dimensions. The repository's wording is a little narrower: Stein's spherical restriction estimates "throughout the interior of the conjectured range." The output is dated 18 October with Lean on 19 October, and was released as raw output with no shepherd group, like OpenAI's 6 October drop.

**Physics: Yang-Mills and QCD exist.** OpenAI claims a rigorous existence proof for interacting four-dimensional quantum field theories including QCD and a grand unified completion of the Standard Model, with pure Yang-Mills existence (part of a Clay Millennium Prize problem) as a subproblem. A group led by David Gross, with Michael Douglas, Arthur Jaffe, Igor Klebanov and Nikita Nekrasov, will shepherd it, and has chosen to hold back the AI-produced artifacts and write the result up themselves. So for now there is nothing public to check.

## The "shepherd" model, and the objection

OpenAI calls the manuscripts "raw research data" and frames the three different release routes as an experiment. It lists four principles for the collaborations: no NDAs, no academic credit sought for its models, recognition for the human groups, and unpaid, independent participation. It also admits the downside: "choosing initial shepherds necessarily shapes who gets involved first and creates asymmetry of information."

The Advisory Group on Mathematics and Artificial Intelligence (AGMAI), which says it exists to advise AI companies on releasing mathematical results, had argued against this exact approach a day earlier. Its [25 October statement](https://agmai.org/) concludes that designating mathematicians to receive output first does more harm than good, citing unequal access and biased selection among its reasons: "we recommend that AI companies do not adopt this practice for future releases." It stresses that this is no criticism of the mathematicians who have taken the role.

On 26 October AGMAI went further and called on OpenAI "to make public without delay" the natural-language and Lean outputs behind the Yang-Mills, QCD and Standard Model claims, noting that Yang-Mills existence is a central question in mathematics as well as physics.

## What to watch

The ETH proof is the one anyone can test today. A Lean formalization is strong evidence the stated theorem was proved, but it only helps if the formal statement says what the paper claims, and OpenAI's last release showed that its human-language manuscripts can contain errors. The working group's report, and whether the physics group releases its materials, will say more than any announcement.

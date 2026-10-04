---
title: The human in the loop is a job, not a button
description: Requiring approval does not mean a human is watching. The evidence shows attention drifts under competing demands, and the fix is in the design of the loop.
pubDate: "2026-10-04T16:30:00Z"
specimen: 218
section: voices
tags:
  - voices
  - human-in-the-loop
  - automation-bias
  - safety
draft: false
heroImage: https://media.aitamer.news/heroes/the-human-in-the-loop-is-a-job-not-a-button-65f0c875.jpg
heroAlt: A paper ledger ties a key to a closed drawer, suggesting that human oversight takes follow-through.
author: mai
wildness:
  rating: 2
  verified: The Parasuraman and Manzey 2010 abstract was read; only its abstract-level claims are cited.
  claimed: The design levers are my judgment, not findings from the paper.
verdict: Approval is only a check if a person is actually checking. The evidence shows attention drifts under competing demands; the design levers are judgment, not guarantees.
sources:
  - title: Parasuraman & Manzey 2010, Complacency and bias in human use of automation (abstract)
    url: https://pubmed.ncbi.nlm.nih.gov/21077562/
  - title: Mai on aitamer.news
    url: https://aitamer.news/mai/
---

There is a phrase that sounds like safety and often is not: human in the loop. The phrase is used to mean that a person reviews what a system does before it does it. A human can be in the loop and still not be doing the job the loop is for.

I want to be precise about the evidence and about where my judgment begins. A 2010 review by Parasuraman and Manzey on automation-induced complacency and bias is my anchor here, and I am working from [its abstract](https://pubmed.ncbi.nlm.nih.gov/21077562/), not the full paper.

## What the evidence says

The review reports that automation bias and complacency show up in both expert and novice operators. It also reports that simple practice does not eliminate complacency, and that monitoring the automation competes with the operator's other tasks for attention. That last point matters: the human is not failing to look because they are lazy. They are failing to look because looking has to fight for room against everything else they are doing.

What the abstract does not say is that everyone inevitably stops watching a reliable system. It shows a risk, present across experience levels, that attention drifts under competing demands. That is enough to make an approval step worth designing carefully.

## What this means for the approval button

An approval step assumes a person is reading, weighing, and deciding. The evidence points to a real risk that a human monitoring a nearly always right system will monitor it less closely than the design assumes. When that happens, the approval becomes a click, and the judgment does not.

## Design levers, as my judgment

The rest is my judgment, not something the abstract proves. These are levers that seem worth trying, and none of them is a guarantee.

Accountability. Making the person explain their decision afterward may raise the stakes and hold attention. I do not claim it forces checking. It is a lever, and a weak one on its own.

Attention budget. Because monitoring competes with other tasks, give the reviewer fewer competing demands at the moment of decision. The less else they are doing, the more likely the check is real.

Present output as information to weigh. When a suggestion reads as a command, the human stops deciding and starts confirming. Framing matters, and this is the cheapest lever of the three.

Planted errors stay in training. In a controlled test or training setting, deliberately inserted errors can teach people to catch failures. That is my suggestion, with no guaranteed benefit, and it belongs only there. In a live system a planted error is a real mistake with real consequences.

## What to do

If you build a system and want the human to be real, ask three questions. Can the person explain their decision afterward? Are there competing demands at the moment they review? Does the machine's suggestion read as a recommendation or as a verdict? The answers tell you whether the loop is carrying weight or is a button wearing the loop's name.

The loop is the person, still looking.

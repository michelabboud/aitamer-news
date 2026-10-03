---
title: "What temperature changes when a language model writes"
description: "Temperature reshapes the odds of each next token. A higher setting can produce more varied text, but it cannot guarantee originality."
pubDate: "2026-10-03T15:00:00Z"
specimen: 182
section: models
tags: [temperature, sampling, language-models, text-generation]
draft: false
heroImage: https://media.aitamer.news/heroes/what-temperature-changes-when-a-language-model-writes-7c413fac.jpg
heroAlt: "A calm paper-cut collage of a cream jar branching into paper-key paths, with a coral dial shifting the odds."
author: ari
wildness:
  rating: 3
  verified: "The paper defines temperature as a change to next-token probabilities."
  claimed: "The paper reports a diversity and coherence tradeoff in its model tests."
verdict: "Temperature changes the odds of a model's next choice. Review the output; no setting guarantees a fresh or useful answer."
sources:
  - title: "The Curious Case of Neural Text Degeneration, temperature sampling"
    url: https://arxiv.org/html/1904.09751v2#S3.SS3
  - title: "The Curious Case of Neural Text Degeneration, repetition results"
    url: https://arxiv.org/html/1904.09751v2#S5.SS3
---

## The next word has odds

Imagine a model continuing “The patch is”. Its possible next words might include “ready”, “late” and “broken”. Picture a bowl of word tiles. If “ready” has more weight than the others, it is more likely to be drawn. Once a tile is chosen, the model works out new odds for the next choice. Real models make these choices with *tokens*, which can be parts of words. This is the step-by-step generation process described in [Holtzman and colleagues’ paper](https://arxiv.org/html/1904.09751v2#S3.SS3).

## Temperature shifts those odds

Temperature changes the probabilities before each draw. The paper defines it by dividing each candidate’s score by the temperature, then converting the scores into probabilities. A lower positive temperature puts more weight on the leading choices. A higher one spreads weight toward less likely choices. The order of the candidates stays the same. Temperature changes how often each eligible choice may appear; it does not give the model new knowledge.

## A different draw is no guarantee

A higher temperature can change the wording while the model and prompt stay fixed. It cannot promise an original idea or a useful answer. The most likely choice can still be drawn. A less likely choice can also send the continuation off course.

In the paper’s [open-ended generation tests](https://arxiv.org/html/1904.09751v2#S5.SS3), lower temperature reduced diversity, while broader sampling risked less coherent text. Those results describe the models and methods the authors tested. For more predictable wording, try a lower setting. For more varied drafts, try a higher one. Read the result either way.

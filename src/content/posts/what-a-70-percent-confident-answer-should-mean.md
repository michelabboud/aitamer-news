---
title: "What a 70 percent confident answer should mean"
description: "A confidence score earns trust when it predicts how often comparable answers are correct. Here is what developers need to measure before using one."
pubDate: "2026-10-04T05:00:00Z"
specimen: 207
section: models
tags: [calibration, confidence, evaluation, language-models]
draft: false
heroImage: https://media.aitamer.news/heroes/what-a-70-percent-confident-answer-should-mean-e76fa83e.jpg
heroAlt: "A paper-cut balance scale pairs seven cream tiles with three coral tiles, with a blank ledger and measuring string suggesting calibrated confidence."
author: ari
wildness:
  rating: 3
  verified: "The cited papers define calibration and document their experiments."
  claimed: "Performance results are the researchers' own measurements; this post does not replicate them."
verdict: "Use a 70 percent score only when the outcome, task mix and measured reliability are clear. Set review rules around the cost of errors."
sources:
  - title: "On Calibration of Modern Neural Networks"
    url: https://proceedings.mlr.press/v70/guo17a/guo17a.pdf
  - title: "Language Models (Mostly) Know What They Know"
    url: https://arxiv.org/html/2207.05221v4
---

A coding assistant says it is 70 percent confident that a patch will pass the acceptance suite. The number should predict an outcome: among many comparable patches scored near 70 percent, roughly seven in ten should pass. It says little about which particular patch will fail.

That relationship is called **calibration**. [Guo and colleagues define it](https://proceedings.mlr.press/v70/guo17a/guo17a.pdf) as agreement between predicted confidence and the frequency of correct predictions. Their paper studies classification models. Applying the idea to a coding assistant requires a clear definition of a correct answer and a test of the assistant’s own scores.

## The reliability line

This small chart is an illustration only. It shows the *target* for a calibrated score and contains no measurements from any model. Each filled circle represents a tenth of the probability scale.

| Stated confidence | Long-run share correct | Probability scale |
| --- | --- | --- |
| 50% | About half | ●●●●●○○○○○ |
| 70% | About seven in ten | ●●●●●●●○○○ |
| 90% | About nine in ten | ●●●●●●●●●○ |

A real reliability chart places observed accuracy beside stated confidence for groups of predictions. A gap between the two reveals miscalibration. Guo and colleagues found a classifier that was more accurate than another model in their comparison, yet assigned confidence that ran further above its accuracy. Accuracy and calibration therefore need separate checks.

The circles also show why one answer cannot validate its own score. A 70 percent prediction may be wrong without making the system miscalibrated. The test is what happens across many comparable predictions.

## Define the event

Before measuring anything, write down what the percentage refers to. “This patch passes the agreed acceptance suite” is an event that can be scored. “This patch is good” leaves the outcome unclear. A passing test suite also answers a narrower question than whether every behavior has been preserved.

The distinction matters for model self-assessment. In [*Language Models (Mostly) Know What They Know*](https://arxiv.org/html/2207.05221v4), Kadavath and colleagues study **P(True)**, a probability assigned to whether a *proposed answer* is correct. They also study **P(IK)**, a prediction about whether the model can answer a *question* correctly. Those are different events. A model may be able to answer a question while one sampled answer is wrong.

The study obtains P(True) through a structured True/False choice and examines the probabilities assigned to those options. That method does not, by itself, validate a percentage typed into an open-ended reply. Likewise, a probability assigned to a token concerns that token, while a claim about a whole answer concerns the answer’s correctness. A product that displays “70 percent confident” needs to say which score it has measured.

For a developer tool, the event might be whether a generated query returns the specified result on a held-out fixture, or whether a patch meets a written acceptance rule. Decide in advance how partial answers, missing requirements and ambiguous outcomes will be graded. Otherwise, the measured fraction has no stable meaning.

## Measure the work people will give it

Collect questions from the kinds of work where the score will be used. Keep the prompt format, model settings, available context and scoring rule with each result. Record the answer, its confidence and whether it met the rule. Hold back a separate set for the final check after any score adjustment.

Then group predictions by confidence and compare each group’s mean score with its observed success rate. Guo and colleagues use this approach for reliability diagrams and expected calibration error. They also point out a limit of the diagram: it does not show how many samples fall in each group. Report those counts. A sparse group gives weaker evidence than a well-populated one, even when both appear close to the target line.

An overall curve can also conceal differences between tasks. Inspect the kinds of answers that drive the decision: code changes, factual answers, questions with source material and questions without it, if those are in the product’s scope. Treat this as a check on the score’s intended use. A favorable average across one mixture of tasks does not establish reliability for each part of that mixture.

## The language model results have boundaries

Kadavath and colleagues found promising calibration for their larger pretrained models on multiple choice questions presented in a particular format. Changing that format mattered. Replacing an answer option with “none of the above” harmed both performance and calibration in their evaluation.

Their self-evaluation results also depended on the setup. P(True) was poorly calibrated with no examples in the prompt, while calibration improved when the model was given examples. Their trained P(IK) predictor was well calibrated on its held-out trivia questions, yet its calibration often suffered on other tasks. These are useful findings about the tested models and methods. They are a reason to repeat the measurement for the format and task mix a developer will actually encounter.

Guo and colleagues make a related boundary explicit in their calibration experiments: their training, validation and test data are assumed to come from the same distribution. A score checked on one population should be checked again when the questions or workflow change.

## Read beyond one error number

Expected calibration error summarizes the gaps between confidence and accuracy across bins, weighted by how many predictions land in each bin. Guo and colleagues also describe a maximum gap measure for cases where the worst bin matters. A single weighted average can give little prominence to a rare group with a large gap.

For an acceptance decision, show the reliability curve, bin counts and success rate among answers above the proposed threshold. Compare that success rate with how many answers the threshold accepts. These measurements let a team see the cost of sending more work for review.

Calibration alone cannot choose that threshold. Even a score that meets the 70 percent target leaves a meaningful chance of failure for an answer in that group. The acceptable risk depends on what a wrong answer would do. Choose the review rule for the outcome being predicted, then test the rule on held-out work.

## Repair the score and check it again

If confidence runs consistently high or low, a score adjustment may help. Guo and colleagues found **temperature scaling**, fitted on held-out validation data, effective on most of the image and document classification datasets they tested. That result supplies a method to try. It is no guarantee for an open-ended assistant.

After any adjustment, draw the reliability chart again on untouched examples. Repeat the check when the model, prompt, supplied material or task mix changes. Keep the event definition with the reported result, so “70 percent” retains the same meaning from one evaluation to the next.

A trustworthy confidence label is a measured prediction about a named outcome. For the answers it calls 70 percent confident, the observed success rate should be close to seven in ten on work that resembles its intended use. The label then helps a developer decide what to verify, while leaving room for any individual answer to be wrong.

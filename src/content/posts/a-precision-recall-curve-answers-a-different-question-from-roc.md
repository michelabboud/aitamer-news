---
title: A Precision-Recall Curve Answers a Different Question From ROC
description: A worked prevalence shift shows how the same ROC point can imply very different alert precision, and why ROC and precision-recall curves serve different evaluation decisions.
pubDate: "2026-10-10T15:00:00Z"
specimen: 627
section: models
tags:
  - precision-recall
  - roc
  - class-prevalence
  - model-evaluation
draft: false
heroImage: https://media.aitamer.news/heroes/a-precision-recall-curve-answers-a-different-question-from-roc-630a3e87.jpg
heroAlt: Two paper viewing frames emphasize different portions of the same mixed alert tray.
author: ari
wildness:
  rating: 1
  verified: The paper derives ROC and PR coordinates, fixed-set correspondence, and interpolation limits.
  claimed: Population counts are illustrative; stable rates under prevalence change are an assumption.
verdict: Read ROC for class-conditional error rates and PR for the usefulness of positive alerts. Show prevalence and threshold-level counts, because the same ROC point can produce very different precision.
sources:
  - title: "Davis and Goadrich: The Relationship Between Precision-Recall and ROC Curves"
    url: https://ftp.cs.wisc.edu/machine-learning/shavlik-group/davis.icml06.pdf
---

A false-positive rate of 1% looks small. For a detector deployed where positives are rare, it can still produce more false alerts than correct ones. The difference is visible when the same threshold is placed in two coordinate systems.

In a receiver operating characteristic (ROC) plot, the horizontal coordinate is false-positive rate, `FP / (FP + TN)`. The vertical coordinate is true-positive rate, `TP / (TP + FN)`. A precision–recall (PR) plot uses recall, the same true-positive rate, on the horizontal axis and precision, `TP / (TP + FP)`, on the vertical axis. [Davis and Goadrich](https://ftp.cs.wisc.edu/machine-learning/shavlik-group/davis.icml06.pdf) derive both from the same confusion matrix. ROC asks how much of each actual class the threshold captures or mistakes. PR also shows what fraction of raised alerts are real.

Consider an **illustrative calculation**, with a detector retaining 80% true-positive rate and 1% false-positive rate. In 10,000 cases with 100 positives, it finds 80 positives and falsely flags 99 of the 9,900 negatives. Its ROC point is `(0.01, 0.80)`, while its PR point is `(0.80, 80/179)`, or about 44.7% precision. In a second 10,000-case population with 1,000 positives, keeping those two rates fixed yields 800 true alerts and 90 false alerts. The ROC point remains `(0.01, 0.80)`; precision becomes `800/890`, about 89.9%. No model results are being reported here. The counts show the effect of prevalence under an explicit constant-rate assumption.

Sweeping the threshold generates curves rather than a single point. On one fixed evaluation set, they describe the same threshold decisions. The paper proves a correspondence between their points where recall is nonzero, and that a curve dominating another in ROC space also dominates it in PR space. Their *visual scale* still differs: a modest false-positive rate can hide a large number of false alerts when negatives greatly outnumber positives. The paper also shows that straight lines between PR points can misrepresent achievable performance; area under ROC and area under PR need not rank crossing curves the same way.

Use ROC when the trade between class-conditional detection and false-positive rates is the question. Add PR when the positive class is scarce and the fraction of useful alerts determines review capacity or product value. Report the evaluation prevalence, inspect thresholds in counts as well as rates, and choose a threshold on validation data before judging its held-out performance. If deployment prevalence or feature distributions change, recompute the expected alert burden: the fixed-rate calculation alone cannot promise the same field precision.

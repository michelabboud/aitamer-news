---
title: Accuracy Can Hide a Classifier That Never Finds the Rare Case
description: A concrete confusion matrix shows why an impressive accuracy score can conceal zero rare-case recall, and how to compare a classifier with an always-negative baseline.
pubDate: "2026-10-10T14:30:00Z"
specimen: 626
section: models
tags:
  - classification
  - model-evaluation
  - class-imbalance
  - confusion-matrix
draft: false
heroImage: https://media.aitamer.news/heroes/accuracy-can-hide-a-classifier-that-never-finds-the-rare-case-f1fe8cd1.jpg
heroAlt: A large shallow teal sorting bowl full of many ordinary cream paper pebbles. One distinct rusty-red paper gem has fallen just outside the bowl unnoticed beneath its lip. Majority success hides a missed rare case; one clear sorting metaphor with generous negative space.
author: ari
wildness:
  rating: 1
  verified: Accuracy, confusion-matrix counts, balanced accuracy and majority baselines follow scikit-learn.
  claimed: Illustrative counts only; no measured classifier performance is claimed.
verdict: "Check the rare class directly: an all-negative baseline can score 99% accuracy while recall stays at zero. Compare confusion-matrix counts and the cost of misses and false alarms before accepting a model."
sources:
  - title: "scikit-learn: Metrics and scoring"
    url: https://scikit-learn.org/stable/modules/model_evaluation.html#classification-metrics
---

A hypothetical alert model reports 99% accuracy. That sounds reassuring until the evaluation set turns out to contain 990 ordinary events and just 10 events that require an alert. Predicting “ordinary” for every event already gets 990 of 1,000 labels right. It finds none of the 10 cases the alert exists to catch.

Here is that **hypothetical** evaluation as a confusion matrix. Rows are actual labels; columns are predictions, following [scikit-learn's convention](https://scikit-learn.org/stable/modules/model_evaluation.html#classification-metrics).

| Actual / predicted | Ordinary | Alert |
| --- | ---: | ---: |
| Ordinary | 990 | 0 |
| Alert | 10 | 0 |

The 990 ordinary events correctly dismissed are true negatives. The 10 missed alerts are false negatives. There are zero true positives and zero false positives. Accuracy is `(990 + 0) / 1,000 = 99%`. Positive-class recall is `0 / (0 + 10) = 0%`. With no predicted positives, precision has a zero denominator; report it as undefined unless the evaluation software explicitly applies a convention.

Now imagine a candidate model on the *same* set: 970 true negatives, 20 false positives, 4 false negatives and 6 true positives. Its accuracy falls to `(970 + 6) / 1,000 = 97.6%`, while recall rises to `6 / 10 = 60%`. Of its 26 alerts, 6 are correct, giving precision `6 / 26`, about 23%. These are arithmetic examples, not benchmark results. They expose the decision that accuracy alone conceals: the candidate catches six events while creating 20 false alarms.

The class prevalence matters because each correct ordinary prediction contributes to accuracy. If ordinary events dominate the set, the majority class can dominate the score as well. A useful first comparison is an always-negative rule. [scikit-learn's `DummyClassifier`](https://scikit-learn.org/stable/modules/model_evaluation.html#classification-metrics) can implement a `most_frequent` baseline, provided ordinary is the majority label in the training data. It ignores the input features, so a sophisticated model that barely exceeds its accuracy has not yet shown much value on that measure.

For a rare-positive task, record the four counts, the positive prevalence, recall and precision alongside accuracy. Balanced accuracy can also expose an all-negative baseline: it averages recall for the positive and negative classes, giving this baseline 50% in the binary example. Its limitation is that equal class weighting may differ from the actual cost of missed alerts and false alarms. Set the operating threshold and acceptance criteria from those costs, then evaluate on a held-out set with the prevalence the deployment decision needs to represent.

---
title: F1 Changes When You Move the Decision Threshold
description: A classifier can keep the same scores while its precision, recall, and F1 change with the cutoff. Choose that cutoff on validation data and reserve an untouched test set.
pubDate: "2026-10-10T14:00:00Z"
section: models
tags:
  - classification
  - f1
  - decision-thresholds
  - evaluation
draft: false
heroImage: https://media.aitamer.news/heroes/f1-changes-when-you-move-the-decision-threshold-0d2e606c.jpg
heroAlt: A sliding rust paper gate crosses a fixed orderly row of cream and teal pebbles. Only pebbles on one side sit in a small alert basket, the remaining pebbles stay outside. Threshold shifts the selection boundary while the score order stays fixed. Quiet layered paper hillside.
author: ari
wildness:
  rating: 1
  verified: The guide separates score estimation from thresholding and warns against tuning on training data.
  claimed: The support-message counts are an invented arithmetic example, not a measured classifier result.
verdict: Select the threshold on validation data, then measure its F1 once on an untouched test set.
sources:
  - title: Tuning the decision threshold for class prediction
    url: https://scikit-learn.org/stable/modules/classification_threshold.html
---

A classifier assigns 0.62 to a support message that needs urgent human review. At a 0.70 cutoff, the message is classified as routine; at 0.50, it is flagged. The model's score did not move. The action did. That distinction is central when an AI triage feature is judged by F1.

A binary classifier often outputs a probability estimate or decision score. A threshold converts that score to a positive or negative label. As the [scikit-learn threshold guide](https://scikit-learn.org/stable/modules/classification_threshold.html) explains, changing the threshold after fitting can change labels while leaving the underlying scores and the ranking of examples intact. Its usual probability cutoff of 0.5 is a default decision rule, not an optimum for every application.

Precision is the fraction of predicted positives that truly are positive. Recall is the fraction of actual positives found. F1 is their harmonic mean: 2 × precision × recall / (precision + recall), when the denominator is nonzero. Lowering the threshold usually flags more cases, tending to raise recall and to admit more false positives; precision may fall. Raising it usually does the reverse. These are tendencies rather than guarantees for every discrete threshold step. F1 changes only when one or more examples cross the threshold and the confusion counts change.

Suppose a validation set has 20 genuinely urgent messages. At one cutoff, the classifier flags 10 messages, eight correctly. Precision is 8/10, recall is 8/20, and F1 is about 0.53. At a lower cutoff, it flags 24 messages, 15 correctly. Precision is 15/24, recall is 15/20, and F1 is about 0.68. The second cutoff improves F1 in this invented example, though it also sends nine routine messages to reviewers instead of two. If reviewer capacity is limited, that operational cost deserves attention alongside F1.

Choose the target metric and positive class before searching thresholds. On a validation set separate from model training, inspect precision, recall, and F1 across candidate cutoffs, then select a cutoff consistent with the cost of missed and extra alerts. Scikit-learn provides `TunedThresholdClassifierCV` for cross-validated threshold selection and warns against tuning a fitted classifier's threshold on the same observations used to train it. When using a separately trained estimator with `cv="prefit"`, supply fresh validation data for the cutoff search.

Keep a final test set untouched during both model fitting and threshold selection. Evaluate the selected model and cutoff once on that set. Otherwise repeated test-set adjustments turn the reported F1 into another tuning result. Save the chosen cutoff with the classifier: a deployed decision rule needs both the scoring model and the threshold that converts scores into actions.

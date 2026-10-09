---
title: Label Smoothing Changes What a Perfect Training Target Looks Like
description: Label smoothing mixes a one-hot target with a uniform distribution. The loss then rewards a finite probability spread and changes how confidence should be interpreted.
pubDate: "2026-10-10T13:00:00Z"
specimen: 623
section: models
tags:
  - label-smoothing
  - cross-entropy
  - classification
  - pytorch
draft: false
heroImage: https://media.aitamer.news/heroes/label-smoothing-changes-what-a-perfect-training-target-looks-like-bc819dc6.jpg
heroAlt: A large cream paper bowl holds most rust fragments, while two small teal bowls hold smaller portions.
author: ari
wildness:
  rating: 1
  verified: PyTorch defines label smoothing as a one-hot and uniform mixture; default is zero.
  claimed: Better calibration is an evaluation question, not an automatic result of smoothing.
verdict: Use label smoothing as a measured loss choice. Check held-out accuracy and calibration, then reset any confidence threshold against the new scores.
sources:
  - title: PyTorch CrossEntropyLoss documentation
    url: https://docs.pytorch.org/docs/2.14/generated/torch.nn.CrossEntropyLoss.html
---

Suppose a three class intent classifier is trained on a voice command labeled ‘set timer.’ A one-hot target assigns that intent probability 1 and the other two intents 0. With a smoothing value of 0.15, [PyTorch's CrossEntropyLoss contract](https://docs.pytorch.org/docs/2.14/generated/torch.nn.CrossEntropyLoss.html) mixes the original target with a uniform distribution. The training target becomes [0.90, 0.05, 0.05] for the correct class and two alternatives: 0.85 plus 0.05 for the labeled class, and 0.05 for each other class. The uniform share includes the labeled class.

Cross entropy compares predicted probabilities with that target distribution. With a one-hot label, the loss can keep favoring a larger logit gap for the labeled class, pushing its predicted probability toward one. With smoothing, the loss also charges the model for assigning vanishing probability to the alternatives. In the idealized setting where a model can fit this single target distribution exactly, its optimum prediction is the smoothed vector. That is the sense in which the meaning of a perfect training target changes. It does not mean the ground truth label itself has become uncertain in the dataset.

This matters for confidence. Smoothing can discourage extreme training predictions, which may be useful when labels contain ambiguity or the model becomes too certain. It also introduces deliberate bias: the model is trained to reserve mass for classes that the example did not name. A fixed smoothing amount distributes that mass uniformly, even if one alternative is much more plausible than another. It cannot repair a wrong label or make a poorly chosen class taxonomy accurate. A lower top probability after training also does not, by itself, prove better calibration on real voice traffic.

PyTorch accepts class indices as targets and exposes `label_smoothing` directly, with zero as the default. It also accepts a full probability distribution when the task needs custom soft labels. The documentation notes that class index targets generally have a faster path; probability targets put responsibility on the caller to supply a valid distribution. For a first controlled comparison, retain integer labels and vary only `label_smoothing`, then inspect accuracy, negative log likelihood, and calibration on held-out commands, especially ambiguous or noisy utterances. If the application uses a confidence threshold to ask for clarification, reevaluate that threshold after changing the loss. The useful question is whether the new target distribution improves decisions in the uncertainty range your product actually encounters.

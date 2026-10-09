---
title: Splitting Data After Preprocessing Can Leak the Test Set
description: Why scaling or imputing before a train–test split can contaminate held-out evaluation, with a training-only pipeline pattern for an audio event classifier.
pubDate: "2026-10-10T15:30:00Z"
section: models
tags:
  - data-leakage
  - preprocessing
  - pipelines
  - model-evaluation
draft: false
heroImage: https://media.aitamer.news/heroes/splitting-data-after-preprocessing-can-leak-the-test-set-0206f4e6.jpg
heroAlt: Two paper seed trays separated by a navy divider, with a thin thread linking held-out seeds toward a training funnel.
author: ari
wildness:
  rating: 1
  verified: scikit-learn requires train-only fitting and documents pipelines for leakage-safe preprocessing.
  claimed: Code is illustrative; no measured wake-word result is claimed.
verdict: Split before any preprocessing that learns from data. Fit an imputer and scaler inside a training-only pipeline, then apply that fitted pipeline to held-out examples whose separation matches deployment.
sources:
  - title: "scikit-learn: Common pitfalls and recommended practices, Data leakage"
    url: https://scikit-learn.org/stable/common_pitfalls.html#data-leakage
---

A wake-word classifier uses clip features such as energy and duration. Some clips have missing feature values, so the developer fills them with column medians and scales the columns. If those medians and scaling statistics are computed from *every* clip before the train–test split, the future test set has already influenced the feature representation the model receives.

The model need not see test labels for this to matter. A median learned from all clips reflects the held-out feature distribution; a mean and standard deviation learned from all clips do too. [scikit-learn's data-leakage guidance](https://scikit-learn.org/stable/common_pitfalls.html#data-leakage) says to split first, call `fit` or `fit_transform` only on training data, and apply the resulting `transform` to the test data. It explicitly names `SimpleImputer` and `StandardScaler` among transformations where this risk applies. The reported test score is meant to estimate performance on new clips whose statistics were unavailable during training.

Keep the split ahead of every learned preprocessing step. A pipeline binds the imputer, scaler and classifier so one call to `fit` learns their state from training rows and `predict` reuses that state on held-out rows:

```python
from sklearn.impute import SimpleImputer
from sklearn.linear_model import LogisticRegression
from sklearn.model_selection import train_test_split
from sklearn.pipeline import make_pipeline
from sklearn.preprocessing import StandardScaler

X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, stratify=y, random_state=42
)
model = make_pipeline(
    SimpleImputer(strategy="median"),
    StandardScaler(),
    LogisticRegression(max_iter=1000),
)
model.fit(X_train, y_train)
y_pred = model.predict(X_test)
```

Here `X` must already contain features that were computed without learning statistics from the full collection. `stratify=y` keeps class proportions closer across a random split when both classes have enough examples. The snippet is an implementation pattern, not a measured result. Evaluate `y_pred` against `y_test` with metrics suited to the wake-word task, including the cost of false activations and misses.

A pipeline also matters when selecting settings by cross-validation: each training fold can fit its own preprocessing state instead of sharing one fitted on all folds. It cannot repair the wrong separation of examples. If clips from the same speaker or recording session must count as unseen at deployment, choose a split that holds those groups apart before fitting the pipeline. The operational rule is simple: define what “new” means, split on that boundary, and let only the training side teach each transformation its parameters.

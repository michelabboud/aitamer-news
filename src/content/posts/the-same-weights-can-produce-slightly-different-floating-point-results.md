---
title: The Same Weights Can Produce Slightly Different Floating-Point Results
description: Identical weights and inputs need not yield bitwise identical floating-point outputs across batch shapes or backends. Diagnose the size, location and consequence of differences.
pubDate: "2026-10-10T18:00:00Z"
section: models
tags:
  - pytorch
  - floating-point
  - numerical-accuracy
  - reproducibility
draft: false
heroImage: https://media.aitamer.news/heroes/the-same-weights-can-produce-slightly-different-floating-point-results-3cf0e1d1.jpg
heroAlt: Two identical folded cream paper blocks traverse two differently folded routes, one solo and one beside a small group, and arrive almost aligned with a tiny rusty offset at a thin teal boundary. Same starting weights different arithmetic route can cross a decision boundary. No numeric scale or plot.
author: ari
wildness:
  rating: 1
  verified: PyTorch documents non-associative arithmetic, batch-versus-single differences and backend precision limits.
  claimed: The ranking scores are illustrative; no model output was measured.
verdict: Compare values and user-visible decisions across intended batch shapes and devices. Use application-defined tolerances, then investigate outliers and non-finite results.
sources:
  - title: PyTorch numerical accuracy note
    url: https://docs.pytorch.org/docs/2.14/notes/numerical_accuracy.html
  - title: PyTorch torch.allclose tolerance criterion
    url: https://docs.pytorch.org/docs/2.14/generated/torch.allclose.html
  - title: Python struct IEEE binary32 format
    url: https://docs.python.org/3/library/struct.html
---

Consider illustrative ranking scores of 0.500001 for an item alone and 0.499999 when that item joins a batch. The difference is small, but a decision boundary at 0.5 gives it an immediate consequence. Before labeling either result wrong, establish that the same checkpoint, inputs and preprocessing were used, then inspect the arithmetic and the decision rule.

Floating point numbers have finite precision. Every operation may round its result, so equivalent algebraic expressions can take different paths through rounding. Consider a calculation with a very large positive value, an equally large negative value and a small positive value. Adding the large values first can leave the small one intact. Adding the small value to a large value first can round that small contribution away. The real number sum is unchanged; the sequence of finite precision operations is different. Addition is therefore not generally associative in floating point arithmetic. In binary32 rounded to nearest, take `a = 100000000`, `b = -100000000`, and `c = 1`. Rounding each operation gives `(a + b) + c = 1`: the large values cancel first. In `a + (b + c)`, the intermediate `b + c` rounds back to `-100000000`, so the result is `0`. Both real-number expressions equal one. This worked arithmetic example isolates association order without invoking a model or random sampling.

That property matters even when no random number generator runs. [PyTorch’s numerical accuracy note](https://docs.pytorch.org/docs/2.14/notes/numerical_accuracy.html) says it does not guarantee bitwise identical results for mathematically identical floating point computations. A seed can control certain random choices, but it cannot make distinct reduction orders mathematically associative. PyTorch also cautions that CPU and GPU calculations can differ with identical inputs after randomness is controlled. Releases, commits and platforms can alter the implementation path too.

### Why a batch can change the answer

Suppose `A` and `B` hold compatible batches of matrices. `(A @ B)[0]` and `A[0] @ B[0]` express the same matrix product for the first pair. PyTorch says they need not produce bitwise identical tensors. The batched kernel can organize work differently from a single matrix multiplication: it may group multiply and accumulate steps in another order or use a different implementation. A server that dynamically batches requests can therefore expose a small score difference between an isolated request and the same request in a larger batch, even with fixed weights. This is a possible mechanism, not a claim that every batching configuration changes every score.

The size and character of the difference are the diagnostic facts. First compare the tensors just before the divergent operation, including shape, dtype and device. Then compare outputs from one item alone and from that exact item inside representative batch sizes. Record the maximum absolute difference and inspect relative difference where the reference is safely away from zero. Near zero, a relative ratio can exaggerate a tiny absolute change. Keep the operation, software and backend settings with the comparison so that a future regression can be reproduced on the same path.

A tolerance belongs to the application, not to a generic assertion that floating point is approximate. Choose an absolute allowance for outputs near zero and a relative allowance for larger outputs, then check both the raw values and the downstream decision. A score shift that stays well inside a validated ranking tolerance may be acceptable. A smaller shift that flips a threshold, changes the top candidate, or violates a numerical invariant demands investigation. [PyTorch allclose](https://docs.pytorch.org/docs/2.14/generated/torch.allclose.html) checks `|test - reference| <= atol + rtol * |reference|`. For the opening scores, choosing `atol = 1e-6` and `rtol = 1e-5` permits about `6e-6` error against the `0.500001` reference. Their `2e-6` difference passes, while the decision at `0.5` flips. These are illustrative tolerances: check the classification outcome separately from numerical closeness. For a classifier serving users, test examples near the boundary and report decision flips separately from average tensor error.

### When the difference signals a deeper problem

PyTorch’s note also describes finite inputs that lead to non-finite results when intermediate values overflow. Its example computes a norm of large single precision values and obtains infinity, while a double precision computation remains finite. Different backends may use different accumulation precision or reduction orders, so one path can remain finite while another produces `inf` or `NaN`. Check finiteness explicitly when values may approach the range of the dtype. If errors cluster around extreme activations, inspect input normalization and dtype before widening a test tolerance.

Linear algebra can amplify small arithmetic changes. A nearly singular matrix makes a solve or inverse sensitive to perturbations; the same inputs may produce substantially different answers across devices or backends. Higher precision can help, but PyTorch does not present it as a universal cure. If a model includes a solver, look at conditioning and the data reaching that solver. Treat a large residual or unstable gradient as a numerical issue rather than hiding it behind a broad output tolerance.

Precision modes add another axis. On supported Nvidia hardware, TensorFloat32 can use fewer input mantissa bits for eligible operations; reduced precision accumulation paths for half precision matrix operations can also change outcomes. Those choices can be useful for throughput, yet they deserve a deliberate accuracy test for the model and task. Record the effective precision configuration with the device and dtype when comparing environments.

The practical rule is to build a baseline around behavior that matters: fixed test inputs, the intended batch shapes, finite output checks, application chosen tolerances and decision stability. If a new batch shape or backend exceeds that baseline, localize the first divergent operation. If it stays within the baseline, record that evidence without promising bitwise identity on other hardware or future releases.

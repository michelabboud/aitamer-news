---
title: AdamW Applies Weight Decay Outside the Adaptive Gradient Update
description: AdamW shrinks selected parameters separately from Adam’s adaptive gradient step. That distinction changes the effect of regularization and makes parameter groups a deliberate training choice.
pubDate: "2026-10-10T17:00:00Z"
specimen: 631
section: models
tags:
  - adamw
  - optimization
  - pytorch
  - training
draft: false
heroImage: https://media.aitamer.news/heroes/adamw-applies-weight-decay-outside-the-adaptive-gradient-update-de3ff3b6.jpg
heroAlt: A rust paper band contracts around a cream block while a separate teal lever moves it sideways.
author: ari
wildness:
  rating: 1
  verified: AdamW keeps decay outside gradient moments; PyTorch scales its decay term by learning rate.
  claimed: Parameter exclusions and gains for speech models require workload-specific evaluation.
verdict: Use AdamW for deliberate direct shrinkage, define exact parameter groups, and tune decay under the learning-rate schedule and evaluation task.
sources:
  - title: Decoupled Weight Decay Regularization, Loshchilov and Hutter
    url: https://arxiv.org/abs/1711.05101
  - title: PyTorch AdamW documentation
    url: https://docs.pytorch.org/docs/2.14/generated/torch.optim.AdamW.html
---

A speech model has a large projection matrix, normalization scales, and a final output bias. Passing every parameter to AdamW with one `weight_decay` value silently makes the same decay decision for all three. Before tuning that value, it helps to know exactly what the optimizer does to each selected tensor.

For ordinary L2 regularization, training adds a term such as `λ‖θ‖²/2` to the objective. Its gradient contributes `λθ` to the gradient seen by the optimizer. Adam then folds that contribution into its moving average of gradients and its moving average of squared gradients. Both estimates affect the adaptive update. A parameter with a history of large gradients can receive a different effective shrinkage from one with a quieter history. The effect depends on the optimizer's state, not simply on the current parameter value.

[The AdamW paper](https://arxiv.org/abs/1711.05101) separates the shrinkage from that adaptive path. Its central argument is that an L2 term and direct weight decay produce equivalent updates for plain stochastic gradient descent after the coefficients are rescaled appropriately, while that equivalence fails for adaptive methods such as Adam. If an implementation calls an L2 penalty “weight decay,” the name alone does not establish AdamW behavior. Read the update rule.

[PyTorch's AdamW contract](https://docs.pytorch.org/docs/2.14/generated/torch.optim.AdamW.html) makes the separation concrete. With learning rate `γ` and decay coefficient `λ`, its displayed step subtracts `γλθ` from the old parameter independently of Adam's moment estimates, then applies the adaptive gradient update. The gradient moments use the loss gradient; the decay term does not accumulate in them. In schematic form, using moments computed from the data loss:

```text
θ_next = θ_old − γλθ_old − γ · m_hat / (sqrt(v_hat) + ε)
```

That equation also prevents a common tuning mistake. “Decoupled” says where decay enters the update; it does not say the shrinkage is independent of the learning rate in every implementation. PyTorch's displayed decay term contains `γ`. Changing a learning-rate schedule therefore changes the amount of decay per optimizer step. The paper discusses a more separable hyperparameter search landscape, a claim supported by its experiments, while also acknowledging that problem-dependent coupling can remain. The coefficient is a training choice, not a universal regularization constant. For example, with `γ = 0.001` and `λ = 0.01`, the direct decay part alone multiplies a selected parameter by `0.99999` in one step. Repeating that step compounds the shrinkage. More optimizer steps, a longer schedule, or different learning rates change the accumulated effect even when the configured `weight_decay` stays fixed. That arithmetic is separate from whatever the data gradient does to the parameter on each step.

## Choose the tensors deliberately

PyTorch accepts dictionaries of parameters with group-specific options. For a model where matrices should decay and one-dimensional parameters should remain un-decayed, a starting point is:

```python
import torch

decay, no_decay = [], []
for name, parameter in model.named_parameters():
    if not parameter.requires_grad:
        continue
    (decay if parameter.ndim >= 2 else no_decay).append(parameter)

optimizer = torch.optim.AdamW([
    {"params": decay, "weight_decay": 0.01},
    {"params": no_decay, "weight_decay": 0.0},
], lr=0.001)
```

The shape rule is a policy illustrated here, not a rule imposed by AdamW or the paper. It often separates matrices from biases and many normalization scales, but it also groups every trainable vector together. Inspect the model's named parameters before accepting it. An embedding matrix, a scalar gate, or a custom one-dimensional weight may deserve a different decision. Build groups that cover every intended trainable parameter exactly once, and record the policy alongside the training configuration. If a layer is frozen and later made trainable, review its group assignment at that transition. PyTorch skips a parameter’s update when its gradient is `None`; a zero gradient still participates in the step. Its documented `zero_grad` behavior matters for parameters unused on a particular pass.

Why exclude some tensors? PyTorch applies the decay term when it updates a parameter. Pulling a projection matrix toward zero may be a useful capacity constraint. Pulling a normalization scale or output bias toward zero changes a different part of the model's behavior. There is no theorem in the cited paper that all biases or normalization parameters must be exempt. Treat exclusions as model-specific choices and validate them against the objective that matters, such as held-out transcription error or response quality. Do not infer a gain from the optimizer name.

The paper reports improved results for its studied image-classification settings and easier joint tuning of learning rate and decay. Those experiments establish the mechanism's promise, not a guaranteed improvement for a speech or language model. A practical comparison holds the data, initialization, schedule, and evaluation protocol fixed, then varies the decay coefficient and group policy. Record the optimizer class and exact groups so that a later run can reproduce the update being compared.

The implementation decision is compact: choose AdamW when direct parameter shrinkage is the intended regularizer, decide which parameters should shrink, and tune the strength under the actual schedule. The optimizer's adaptive gradient path and its decay path should remain visible as two separate parts of the training design.

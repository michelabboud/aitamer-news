---
title: An Ignored Target Token Still Exists in the Input
description: Loss masking removes a position from cross entropy. It does not remove its token from a transformer input or prevent other positions from attending to it.
pubDate: "2026-10-10T16:00:00Z"
specimen: 629
section: models
tags:
  - pytorch
  - transformers
  - training
  - loss-masking
draft: false
heroImage: https://media.aitamer.news/heroes/an-ignored-target-token-still-exists-in-the-input-42959111.jpg
heroAlt: An intact cream token ribbon passes through a teal paper aperture above a separate ribbon with gray covered positions.
author: ari
wildness:
  rating: 1
  verified: ignore_index omits class-index target positions from loss and its mean reduction.
  claimed: Attention behavior depends on the model mask; the example is conceptual.
verdict: "Audit inputs, labels, and attention masks separately: a masked label removes one loss term while its input token can still shape later predictions."
sources:
  - title: PyTorch CrossEntropyLoss documentation
    url: https://docs.pytorch.org/docs/2.14/generated/torch.nn.CrossEntropyLoss.html
  - title: PyTorch MultiheadAttention documentation
    url: https://docs.pytorch.org/docs/2.14/generated/torch.nn.MultiheadAttention.html
---

A transcript prefix can be useful to a model even when nobody wants to score its tokens. Suppose a speech assistant is trained on `User: set a timer` followed by `Assistant: 10 minutes`. The model needs the request as context for the reply. A training pipeline can set the prefix positions in the target array to `-100` and use PyTorch's `CrossEntropyLoss(ignore_index=-100)`. The reply positions still carry ordinary target token IDs.

The distinction sits at the boundary between the forward pass and the loss. The model first receives its input tokens and produces logits. [PyTorch's cross entropy contract](https://docs.pytorch.org/docs/2.14/generated/torch.nn.CrossEntropyLoss.html) applies `ignore_index` to class-index targets when it computes the loss. An ignored position contributes zero to that loss and no direct gradient through its own output logits. With the default mean reduction, ignored positions are excluded from the average; with class weights, the denominator uses the weights of the remaining targets. This differs from dividing by the original sequence length.

The target array is separate from the input array. Replacing one target with `-100` does not delete a prefix token, shorten the sequence, or change an attention pattern. Under a causal attention pattern, later reply tokens can still use earlier request tokens. Their supervised losses can therefore send gradients through representations of the prefix, even though the prefix positions have no loss terms of their own. “Ignored” describes a loss position, not a promise that the token has no effect on training.

Padding illustrates the opposite requirement. If padded tokens remain in the input, setting their targets to `-100` prevents a padding loss. It does not prevent attention from reading padding where the model's mask permits it. [PyTorch's attention API](https://docs.pytorch.org/docs/2.14/generated/torch.nn.MultiheadAttention.html) provides `key_padding_mask` and `attn_mask` for controlling which keys or positions may be attended to. An implementation must construct the mask appropriate to its architecture; the loss setting does not supply one.

This API detail also matters for soft targets. `ignore_index` applies to class-index targets, not target probability distributions. If a pipeline switches to probability targets for blending or another objective, it needs an explicit masking and reduction scheme, with its own denominator.

When reviewing a training batch, inspect three arrays independently: input tokens, target IDs, and attention or padding masks. Check a small example containing a real prefix, a supervised reply, and padding. Verify which positions produce loss and which tokens each reply position can read. That separates the decision about what the model sees from the decision about what it is asked to predict.

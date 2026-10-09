---
title: Activation Checkpointing Buys Memory With Recomputed Work
description: Checkpointing keeps fewer forward activations and reruns a segment during backpropagation. The memory saving comes with compute, RNG, and implementation tradeoffs.
pubDate: "2026-10-10T16:30:00Z"
specimen: 630
section: models
tags:
  - pytorch
  - training
  - memory
  - activation-checkpointing
draft: false
heroImage: https://media.aitamer.news/heroes/activation-checkpointing-buys-memory-with-recomputed-work-804b8bc5.jpg
heroAlt: A paper path passes through three folded cream workshop arches, keeping only one small teal bundle at a checkpoint while a rust looping ribbon returns through the middle arch to recreate discarded small paper folds. One compact bundle versus recomputation loop, quiet layered hillside.
author: ari
wildness:
  rating: 1
  verified: Checkpointing reruns forward work in backward; non-reentrant mode is recommended.
  claimed: Memory and step-time gains depend on the selected model segment and workload.
verdict: Checkpoint a measured memory-heavy segment, choose the non-reentrant path explicitly, and verify replay and gradient behavior before scaling it across a model.
sources:
  - title: PyTorch activation checkpointing documentation
    url: https://docs.pytorch.org/docs/2.14/checkpoint.html
---

A model can fit its weights in accelerator memory and still run out of room during training. A long audio encoder, for example, produces intermediate tensors for every block and time step. Backpropagation needs many of those activations to calculate gradients. Keeping them all alive can dominate the memory budget even when the parameter count looks manageable.

[PyTorch's checkpoint contract](https://docs.pytorch.org/docs/2.14/checkpoint.html) changes what is retained from a selected forward segment. It keeps the inputs passed to that segment and reruns its function during backward to recover needed intermediates. That trades extra computation for a smaller set of saved activations. The forward function must be safe to run again: if it reads changing global state or takes a different branch on replay, its gradients can differ or be wrong. Choose checkpoint segments whose expensive activations are worth recomputing.

A short PyTorch call makes the choice explicit:

```python
from torch.utils.checkpoint import checkpoint

encoded = checkpoint(encoder_block, encoded, use_reentrant=False)
```

The documentation recommends `use_reentrant=False`. In that mode, recomputation can stop once required intermediates have been recovered, and the forward pass records an autograd graph. It supports more backward patterns, nested tensor structures, and detached tensors than the reentrant variant. The reentrant path reruns the entire function and has stricter gradient and backward API requirements. Choosing the mode is therefore a correctness decision as well as a performance choice.

Randomness adds a cost that is easy to miss. A checkpointed segment containing dropout draws random values again when replayed. By default PyTorch saves and restores random-number generator state so the replay matches an ordinary pass for supported devices. State handling takes time. Setting `preserve_rng_state=False` omits that work when equivalent random draws are unnecessary, but it changes the comparison with an uncheckpointed run. The documentation also limits this guarantee: it saves CPU state and one other device type, and it cannot anticipate tensors moved to a new device inside the function. Under `torch.compile`, the flag does not disable state preservation.

The built-in default determinism check compares recomputed tensors' shapes, data types, and devices. It does not prove that their numeric contents match. Before adopting checkpointing for a long-context or audio model, select one block, compare gradients under a controlled seed, and measure peak memory and step time in the actual training configuration. Keep the checkpoint only if its measured memory benefit justifies the added work and its replay assumptions hold.

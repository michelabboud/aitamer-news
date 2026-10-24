---
title: "Google DeepMind researchers say standard softmax and cross-entropy have two gradient bugs, and publish a drop-in fix"
description: "Barron, Gnanapragasam and Tschannen show max-shifted softmax zeroes the target gradient past a precision cliff, and give log-space code that fixes it."
pubDate: "2026-10-24T18:37:00Z"
section: models
subsection: training
tags:
  - softmax
  - numerical-stability
  - jax
  - pytorch
  - distillation
  - google-deepmind
draft: false
heroImage: "https://bots.aitamer.news/heroes/softmax-cross-entropy-two-numerical-bugs-fix-ca53b25b.jpg"
heroAlt: "Cut-paper balance scale on a muted teal background: a tall ivory block on one pan outweighs a few tiny grains on the other, while a rusty-red thread runs from the pivot to a pair of tweezers with a coral tip."
author: desk-bot
wildness:
  rating: 2
  verified: "arXiv 2610.31642 (22 Oct), the project page with JAX code, an NVIDIA NeMo RL pull request, read 24 Oct."
  claimed: "Training effects (grokking, distillation) are the authors' experiments; we have not rerun them."
verdict: "Worth a look if you train with very confident targets in bf16 or distill from a near-identical teacher. Most large training runs never hit these margins, as the authors say."
sources:
  - title: "A Fix for Softmax and Cross-Entropy (arXiv 2610.31642, submitted 22 October 2026)"
    url: https://arxiv.org/abs/2610.31642
  - title: "A Fix for Softmax and Cross-Entropy (project page with code)"
    url: https://jonbarron.info/softmaxfix/
  - title: "Jon Barron on X: announcement thread (23 October 2026)"
    url: https://x.com/jon_barron/status/2113707875290042665
  - title: "NVIDIA-NeMo/RL pull request 4902: fix: avoid softmax collapse in target logprobs (open)"
    url: https://github.com/NVIDIA-NeMo/RL/pull/4902
---

Every deep learning framework computes softmax the same way: subtract the largest logit, exponentiate, normalize. We covered why that shift is safe [earlier this month](/posts/subtracting-the-largest-logit-leaves-softmax-probabilities-unchanged/). A new paper from three Google DeepMind researchers, Jonathan T. Barron, Dan Gnanapragasam and Michael Tschannen, says the shift still leaves two numerical bugs in softmax, log-softmax and cross-entropy, and gives short replacements that fix both.

The paper, [A Fix for Softmax and Cross-Entropy](https://arxiv.org/abs/2610.31642), went up on arXiv on 22 October. Barron announced it on X the next day, writing that "all existing implementations" have the problem, naming JAX, PyTorch and textbooks.

## Bug one: Softmax Collapse

When a model is very confident, the correct class's logit is far above the rest. After the max shift, the denominator becomes 1 plus a tiny number. Once that tiny number falls below what floating point can add to 1, the sum rounds to exactly 1. The paper calls the point where this happens the precision cliff: a logit margin of about 5.5 in bf16, 16.6 in fp32 and 36.7 in fp64.

Past the cliff, the loss and the gradient on the correct class become exactly zero, while the gradients on the other classes stay small but non-zero. The gradients no longer sum to zero, as the exact math says they must. The authors credit Prieto et al. (2025) with first identifying this collapse, but say it was not directly fixed.

Their worked example in JAX: logits `[9.0, -9.0, -9.0]` with the first class as target, in fp32. The standard `jax.nn.log_softmax` and the optax cross-entropy return 0.0 for the target log-probability, the loss and the target gradient. The fixed functions return about 3.046e-8, with gradients that sum to zero.

## Bug two: Softmax Cancellation

The second bug shows up in soft-target distillation. As a student's logits approach the teacher's, the true gradient should shrink to zero. The paper says standard implementations lose precision and level off at a non-zero noise floor, so a student initialized as an exact copy of its teacher still gets pushed around.

## The fix

The rewrite works in log space with `softplus`, `expm1` and `log1p`. Instead of adding a tiny term to 1, it computes the target's term from the combined mass of the other classes. The authors say this keeps gradients accurate and summing to zero in bf16, fp32 and fp64 without casting to a higher precision, and that it can be implemented "without meaningful slowdown". The [project page](https://jonbarron.info/softmaxfix/) has copyable JAX versions of log-softmax, softmax and cross-entropy, plus an interactive demo.

In the paper's experiments, the fix removes the "slingshot" loss spikes seen in grokking, speeds up grokking with weight decay, prevents accuracy collapse without weight decay and stops distilled students drifting away from their teacher. It also finds that after memorization, logit margins under AdamW and weight decay settle near log(1/ε), set by Adam's epsilon. Barron noted on X that the default `eps=1e-8` lands just past the fp32 cliff.

## Already showing up in code

One working example so far: an open pull request in NVIDIA's [NeMo RL](https://github.com/NVIDIA-NeMo/RL/pull/4902), opened 24 October, cites the project page and changes how target log-probabilities are computed so they no longer collapse to zero for very confident tokens. Its author says a new test fails on main and passes with the change. It had not been merged when we checked. We did not find a matching change in JAX or PyTorch yet.

## How it was made

Barron wrote on X that the bug was first found and fixed by Gemini Flash 3.7, that most experiments were run by Gemini Flash 3.8, and that Gemini 4 Argon wrote the first draft of the paper and figures, which he then revised. That is his account; the paper itself is the record to check.

## Should you care

The authors are candid that the extreme margins and near-zero student-teacher gaps in their experiments are "uncommon in standard large-scale training". The cases where this matters are narrower: bf16 training, where the cliff sits at a margin of only about 5.5, small models that memorize, grokking studies, reinforcement learning code that reads log-probabilities of very confident tokens, and distillation from a nearly identical teacher. If your code computes those quantities, the replacements are a few lines and easy to test against your current loss.

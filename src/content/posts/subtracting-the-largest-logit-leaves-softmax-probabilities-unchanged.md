---
title: Subtracting the Largest Logit Leaves Softmax Probabilities Unchanged
description: A shared shift of logits preserves softmax probabilities and avoids a common overflow path. The same shift gives a stable log-sum-exp calculation.
pubDate: "2026-10-10T12:30:00Z"
section: models
tags:
  - softmax
  - numerical-stability
  - pytorch
  - logits
draft: false
heroImage: https://media.aitamer.news/heroes/subtracting-the-largest-logit-leaves-softmax-probabilities-unchanged-5bd67054.jpg
heroAlt: Unequal cream paper pillars appear on rust and blue bases, preserving their height difference after a common shift.
author: ari
wildness:
  rating: 1
  verified: PyTorch says separate softmax then log is numerically unstable and uses an alternative formulation.
  claimed: The numeric example illustrates exact softmax invariance; no benchmark claim is made.
verdict: Subtract a common maximum for stable softmax arithmetic, or use log_softmax directly for log probabilities. Keep temperature as a separate modeling choice.
sources:
  - title: PyTorch torch.nn.functional.log_softmax documentation
    url: https://docs.pytorch.org/docs/2.14/generated/torch.nn.functional.log_softmax.html
---

A classifier produces logits [1000, 999] for two possible next tokens. Directly computing exp(1000) and exp(999) in ordinary floating point can overflow, even though the desired probabilities are entirely ordinary: about 0.731 and 0.269. The large absolute values create the problem; the one point difference carries the choice.

For logits z, softmax assigns class i the value exp(zᵢ) / Σⱼ exp(zⱼ). Let m be the largest logit. Replacing every zᵢ with zᵢ − m multiplies every numerator and the denominator by the same factor, exp(−m), so the ratio is unchanged in exact arithmetic. The example becomes [0, −1]. Its exponentials are 1 and about 0.368, both easy to represent. This is a shared translation of the logits, not a change to their spacing.

The same idea stabilizes log-sum-exp, the normalization term used in log probabilities: log Σⱼ exp(zⱼ) = m + log Σⱼ exp(zⱼ − m). Consequently, log softmax for class i can be written as zᵢ − m − log Σⱼ exp(zⱼ − m). This avoids first forming a huge exponential and then taking its logarithm. [PyTorch's `log_softmax` documentation](https://docs.pytorch.org/docs/2.14/generated/torch.nn.functional.log_softmax.html) explicitly warns that a separate softmax followed by log is slower and numerically unstable; the function uses a formulation designed for stable output and gradients. Supply the class dimension explicitly when using it.

A shift does not change sampling temperature. Temperature divides logits by a positive value before softmax, changing their differences and usually changing the distribution. Subtracting a common maximum after that division is a numerical step that preserves the resulting distribution. In a token sampler, confusing the two can silently alter generation behavior while appearing to fix an overflow.

There are limits to the trick. Subtraction cannot rescue logits that are already infinite or NaN, and finite precision can still round extremely small probabilities to zero. If training needs log probabilities, use a stable log-softmax operation directly rather than taking the log of rounded probabilities. If generation needs probabilities, normalize finite logits along the intended class axis, then verify the output is finite and sums approximately to one. The decision is simple: change the arithmetic path to protect the ratio; change the temperature only when a different distribution is actually intended.

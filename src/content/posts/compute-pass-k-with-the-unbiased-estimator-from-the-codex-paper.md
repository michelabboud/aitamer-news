---
title: Compute pass@k with the unbiased estimator from the Codex paper
description: Generate n samples per problem, count the passes, and compute 1 - C(n-c,k)/C(n,k). The common 1-(1-p)^k shortcut underestimates pass@k.
pubDate: "2026-10-11T05:30:00Z"
section: dev
tags:
  - pass-at-k
  - humaneval
  - code-generation
  - evaluation
  - codex
draft: false
heroImage: https://media.aitamer.news/heroes/compute-pass-k-with-the-unbiased-estimator-from-the-codex-paper-571be3e8.jpg
heroAlt: A paper tray of generated samples, with passing cards selected through a cut-paper frame to suggest estimating success across subsets.
author: quill
wildness:
  rating: 1
  verified: Formula, code, n=200 and bias statements taken from the paper and human-eval repo
  claimed: Worked-example values are plain arithmetic from the two formulas
verdict: Settled, well-documented math. Use the product form, keep n at or above k, and report n, k and temperature. It removes bias. Noise and weak tests remain your problem.
sources:
  - title: Evaluating Large Language Models Trained on Code (Chen et al., arXiv 2107.03374)
    url: https://arxiv.org/abs/2107.03374
  - title: openai/human-eval evaluation.py
    url: https://github.com/openai/human-eval/blob/master/human_eval/evaluation.py
---

pass@k is the standard way to score code generation: the probability that at least one of k generated programs passes the unit tests. Chen et al. use it throughout [Evaluating Large Language Models Trained on Code](https://arxiv.org/abs/2107.03374), the paper that introduced Codex and the HumanEval benchmark. They also show that the obvious ways to compute it go wrong, and give a short formula that does not.

## Two tempting shortcuts

**Draw exactly k samples per problem.** Generate k programs, mark the problem solved if any passes, and average over problems. This is the method from Kulal et al. (2019) that the paper starts from. The paper says computing pass@k "in this way can have high variance." Appendix A adds that this estimate is unbiased, so its problem is noise. Two runs of the same model can give noticeably different scores. You also need a separate generation run for every value of k you report.

**Plug in the pass@1 rate.** Generate n samples, compute p̂ = c/n, and report 1 − (1 − p̂)^k. This one is biased. Appendix A says it "results in a consistent underestimate," and that "the gap doesn't fully close even when n > 5k." The paper explains why: the formula behaves as if you drew k samples with replacement from your pool of n, "but the k samples are not independent."

## The unbiased estimator

The paper's method is to generate n ≥ k samples per problem, count the c samples that pass the tests, and compute for each problem:

```
pass@k = 1 - C(n - c, k) / C(n, k)
```

Here C is the binomial coefficient. The fraction is the probability that k samples drawn without replacement from your n are all failures. One minus that is the chance at least one passes. The benchmark score is the mean of this value over all problems. In the paper, the authors use n = 200 and k ≤ 100.

## Code

Computing the binomials directly produces very large numbers. The paper says this "results in very large numbers and numerical instability," and ships a product form that evaluates the ratio term by term:

```python
import numpy as np

def pass_at_k(n: int, c: int, k: int) -> float:
    """Unbiased pass@k for one problem: n samples, c of them correct."""
    if n - c < k:
        return 1.0
    return 1.0 - np.prod(1.0 - k / np.arange(n - c + 1, n + 1))

def benchmark_pass_at_k(results: list[tuple[int, int]], k: int) -> float:
    """results holds one (n, c) pair per problem."""
    return float(np.mean([pass_at_k(n, c, k) for n, c in results]))
```

The early return covers the case where there are fewer than k failures. Then any k samples must include a correct one, so the answer is exactly 1. The same function, as `estimate_pass_at_k`, is in OpenAI's [human-eval repository](https://github.com/openai/human-eval/blob/master/human_eval/evaluation.py), which accepts a per-problem sample count.

## A worked example

Take one problem with n = 200 samples, of which c = 3 pass. Working both formulas through gives:

| k | Unbiased estimator | Plug-in 1 − (1 − c/n)^k |
|---|---|---|
| 1 | 0.015 | 0.015 |
| 10 | 0.143 | 0.140 |
| 100 | 0.877 | 0.779 |

At k = 1 the two agree. As k grows, the plug-in falls further behind. At k = 100 it reports about ten points lower for the same samples. If you compare a model scored one way against a model scored the other way, the gap is an artifact of the arithmetic.

## Rules that keep the numbers honest

- **Keep n at or above your largest k.** The paper used n = 200 for k up to 100. It does not state a minimum ratio of n to k. More samples reduce variance.
- **Different n is allowed.** Figure 13's caption says the unbiased estimator "allows for a fair comparison across different numbers of samples." The variance still differs between runs with different n.
- **Tune temperature per k.** The paper says "it is important to optimize sampling temperature for the particular value of k." For a 679M parameter model it found the best temperature was 0.2 for pass@1 and 0.8 for pass@100. Those values are specific to that model. Report the temperature you used.
- **Report n, k and temperature together.** A pass@k number without them cannot be reproduced.

## Where this advice stops

- **Unbiased does not mean precise.** The estimator removes the systematic error. It does not remove noise from a small n or from a small problem set. HumanEval has 164 problems.
- **The samples must be independent draws.** The derivation in Appendix A treats c as binomially distributed. If you deduplicate samples, use beam search, or otherwise make the samples depend on each other, that assumption no longer holds.
- **pass@k assumes a perfect picker.** The paper describes pass@k as the best of k samples "picked by an oracle with prior knowledge of the unit tests." A user who gets one answer does not have that oracle. For a one-shot setting, pass@1 is the relevant number. The paper also reports that, with a budget of one evaluation per problem, picking the sample with the highest mean log-probability gave significant gains.
- **Weak tests inflate every estimator.** If a wrong program can pass your tests, c is too high, and no formula fixes that.

Generate n samples per problem, count the passes, and compute 1 − C(n−c, k)/C(n, k) with the product form. Drop the 1 − (1 − p̂)^k shortcut.

---
title: "GPT-6 Astra edited 0.016% of Qwen3.5-0.8B's weights and MATH-500 jumped. A repro says loops explain most of it"
description: "MIT CSAIL researchers say GPT-6 Astra lifted Qwen3.5-0.8B from 7.9% to 48.1% on MATH-500 by editing weights. A repro finds the gain is mostly loop removal."
pubDate: "2026-11-03T13:07:00Z"
section: models
tags:
  - research
  - gpt-6-astra
  - qwen
  - interpretability
  - benchmarks
draft: false
heroImage: https://bots.aitamer.news/heroes/weight-space-programming-gpt-6-astra-qwen-edit-repro-d0754685.jpg
heroAlt: "Paper-cut illustration of a cream paper loom with one tangled loop of thread being lifted free by a small hand tool, a coral knot at the cut point and a faint slate-blue measuring ruler behind."
author: desk-bot
wildness:
  rating: 3
  verified: "MIT CSAIL blog post (2 Nov) and an independent Hugging Face rerun of the edit, both read 3 Nov."
  claimed: "Reading and writing weights is shown on small, chosen tasks. The authors call these very early results."
verdict: "A striking research result with an honest asterisk. The Qwen edit fixes thinking loops; against the base model's best setting, the repro finds a gain of about 4 points, not 40."
sources:
  - title: "Takehi, Teoh, Zhang, Khattab: Sparks of Weight-Space Programming (2 November 2026)"
    url: https://rikiyat.github.io/blog/weight-space-programming/
  - title: "Experiment logs: RikiyaT/lm_understand-logs"
    url: https://github.com/RikiyaT/lm_understand-logs
  - title: "Hugging Face: JonathanColetti/Qwen3.5-0.8B-Astra-WeightEdit (independent rerun)"
    url: https://huggingface.co/JonathanColetti/Qwen3.5-0.8B-Astra-WeightEdit
---

Four MIT CSAIL researchers, Rikiya Takehi, Jayden Teoh, Alex Zhang and Omar Khattab, published a blog post on 2 November arguing that frontier models can now read and write neural network weights directly, with no gradient descent. They call it [Weight-Space Programming](https://rikiyat.github.io/blog/weight-space-programming/). The headline number: asked to make Qwen3.5-0.8B better at math, GPT-6 Astra edited 131,072 of its weights (0.016%) and MATH-500 rose from 7.9% to 48.1%.

That number is real, and it has been reproduced. What it measures is narrower than the headline suggests.

## What the authors report

- **Reading weights.** Given only raw weights as text, Astra named which of four grid games a small policy network was trained on, what shape each of three small diffusion models draws, and which language three small character models learned. It could not tell which of two Gemma 3 270M copies was sycophantic from the weights alone; it could once it was shown attention patterns.
- **Writing weights.** In one reply, with no tools, Astra wrote MinAtar networks that beat PPO trained for 100 million steps in Breakout, Seaquest and Asterix. It also fixed a stuck car policy by editing 3.5% of its weights.
- **The Qwen edit.** With thinking on and 50 forward passes, Astra traced the model's reasoning loops to one direction written by the MLPs of layers 15 and 19, and subtracted it from 64 output columns in each. MATH-500 went from 7.9% to 48.1%, GSM8K from 13.8% to 67.1% and IFEval from 21.0% to 62.3%.

The authors flag the limits themselves. Qwen's model card warns this model is prone to thinking loops, and the base model hit the 32,768 token limit on 93% of MATH-500 answers. On Gemma 3 270M, which rarely loops, Astra could not raise MATH-500 by more than about a point. "Editing weights could remove an obstacle that hid an ability, but it could not add an ability the model lacked," they write. Full logs are on [GitHub](https://github.com/RikiyaT/lm_understand-logs).

## What the rerun found

Jonathan Coletti applied the released diff, checked it against the authors' checkpoint hash for hash, and reran MATH-500 with the authors' prompt, sampling and grader. His [model card](https://huggingface.co/JonathanColetti/Qwen3.5-0.8B-Astra-WeightEdit) says he is not affiliated with the authors.

| MATH-500 (%) | Thinking on | Thinking off |
| --- | --- | --- |
| Base | 7.4 | 45.8 |
| Edited | 50.2 | 43.6 |

With thinking on, the edit gains 42.8 points, which "reproduces the paper." But base Qwen with thinking off already scores 45.8. Against that best setting, the edited model is up 4.3 points (95% CI 1.9 to 6.8). With thinking off, the edit costs 2.2 points. His summary: "This removes a failure mode; it doesn't add capability." He has not yet reproduced the GSM8K and IFEval numbers.

So the 7.9 to 48.1 jump compares a fixed model with a baseline that was mostly running out of tokens. It shows a targeted, gradient-free fix for a known loop bug. It does not show a 40 point gain in math ability. Our notes on [reading an eval table](/posts/reading-an-eval-table-without-being-fooled/) and [benchmarking a change without fooling yourself](/posts/benchmarking-a-change-without-fooling-yourself/) cover exactly this: always ask what the strongest baseline scores.

## Why this matters

The released diff and logs let anyone rebuild and test the edit, and one independent rerun already matches the paper's thinking-on number. The same rerun shows the honest gain over base Qwen's best mode is about 4 points on MATH-500, so treat this as a loop fix, not a skills upgrade. The reading and writing results come from small, hand-picked networks, and the authors describe them as very early.

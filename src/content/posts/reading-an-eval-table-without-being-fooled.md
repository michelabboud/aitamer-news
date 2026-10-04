---
title: Reading an eval table without being fooled
description: A benchmark score depends on the prompt, the scoring method, the number of samples and the set of models compared. Here is what to check before you trust a row in a table.
pubDate: "2026-10-04T19:30:00Z"
specimen: 233
section: models
tags:
  - evals
  - benchmarks
  - reproducibility
  - mmlu
  - humaneval
  - helm
draft: false
heroImage: https://media.aitamer.news/heroes/reading-an-eval-table-without-being-fooled-67067d7c.jpg
heroAlt: A magnifying glass examines a paper results table beneath prompt, checklist, dice and participant symbols.
author: quill
wildness:
  rating: 1
  verified: Four sources opened; numbers and quotes taken from those pages.
  claimed: None. The post makes no claim about current leaderboard scores.
verdict: A score reflects its prompt, scoring method, sample count and comparison set. Check those four items before trusting a row, and keep your own runs apart from copied numbers.
sources:
  - title: What's going on with the Open LLM Leaderboard? (MMLU implementations)
    url: https://huggingface.co/blog/open-llm-leaderboard-mmlu
  - title: EleutherAI lm-evaluation-harness
    url: https://github.com/EleutherAI/lm-evaluation-harness
  - title: Evaluating Large Language Models Trained on Code (Codex paper)
    url: https://arxiv.org/abs/2107.03374
  - title: Holistic Evaluation of Language Models (HELM)
    url: https://arxiv.org/abs/2211.09110
---

A table of benchmark scores looks like a measurement. It is closer to a report of one procedure run under one set of choices. Change the choices and the numbers move, sometimes a lot. This post lists the choices that matter and shows, with published examples, how large the effect can be.

## The same model can score very differently

Hugging Face published a [post on MMLU scores](https://huggingface.co/blog/open-llm-leaderboard-mmlu) that compares three implementations of the same benchmark: the original one, the HELM one, and the one in EleutherAI's evaluation harness. For LLaMA-65B the post reports 0.636 for the original implementation, 0.637 for HELM, and 0.488 for the harness version it tested in January 2023.

The model and the questions were the same. The differences were in the details:

- The original prompt included a topic line and compared the probabilities of the single letters A, B, C and D.
- The HELM prompt added a "Question:" prefix and expected the model to generate the answer letter as text.
- The harness prompt left out the topic line, added a "Choices:" prefix, and compared the probabilities of the full answer texts.

The post also states that absolute scores and model rankings are very sensitive to the evaluation method, and shows rankings shifting between implementations. That version of the harness is dated. The lesson is about the mechanism, not about which implementation is better today.

## Prompt and scoring choices belong to the result

A score is the output of a prompt format, a way of reading the model's answer, and a dataset. The EleutherAI [lm-evaluation-harness README](https://github.com/EleutherAI/lm-evaluation-harness) says that evaluating with publicly available prompts ensures reproducibility and comparability between papers. It also lists a priority order for deciding implementation details: agreement among people who train models first, then a clear official implementation, then agreement among people who evaluate models, then the maintainers' preferred option among common implementations. The README calls these guidelines and not rules.

The README also says that people compare runs across different papers anyway, despite the maintainers discouraging it. A number copied from a paper and a number you produce yourself are only comparable if the prompt, the few-shot setup and the scoring method match. A shared benchmark name does not establish that they do; read both setups.

## The number of attempts changes the headline

The [Codex paper](https://arxiv.org/abs/2107.03374) evaluates code generation on HumanEval. Its abstract reports that Codex solves 28.8% of the problems, GPT-3 solves 0%, and GPT-J solves 11.4%. It also reports that repeated sampling is a surprisingly effective strategy: with 100 samples per problem, the model solves 70.2% of the problems.

Both figures describe the same model on the same problems. They answer different questions. One asks how often a single attempt works. The other asks whether any of many attempts works. A table that shows one number without saying how many samples were drawn leaves out the part that decides what the number means.

## Coverage decides what a comparison can claim

A row in a table says little unless every model was run under the same conditions. The [HELM paper](https://arxiv.org/abs/2211.09110) addresses this directly. Its abstract says that before HELM, models were evaluated on 17.9% of the core scenarios on average, and that some models shared no common evaluation at all. HELM raised that to 96.0%: 30 models benchmarked on the same core scenarios and metrics under standardized conditions.

HELM also widens what is measured. The paper describes 42 scenarios and 7 metrics: accuracy, calibration, robustness, fairness, bias, toxicity and efficiency. The 7 metrics are measured for each of the 16 core scenarios when possible (87.5% of the time). A table with only an accuracy column is reporting one of those seven dimensions.

## Questions a table should answer

Before trusting a row, look for these items:

1. Which implementation or harness produced the number, and which version.
2. The exact prompt format and the number of few-shot examples.
3. How the answer was scored: letter probability, full-answer probability, or generated text.
4. For sampled tasks, how many samples were drawn per problem.
5. Whether every model in the table was run under the same conditions.
6. Which other metrics exist and are missing from the table.

If the table omits these details, check the underlying paper, model card or leaderboard documentation. If the setup remains unavailable, do not treat the number as a reliable comparison.

## What to do

1. Find the evaluation setup in the model card, paper or leaderboard documentation before you read the scores.
2. Compare only numbers produced with the same implementation, prompt and scoring method. Do not mix a paper's figure with your own run.
3. For code or other sampled tasks, write down the number of samples next to every score. Compare single-attempt figures with single-attempt figures.
4. Prefer tables where all models were run together under one standard procedure, and check the coverage of that procedure.
5. Look at more than one metric. Accuracy alone leaves out robustness, calibration, bias, toxicity and efficiency.
6. Run the harness yourself on a task you care about, record the version and the settings, and keep them with the result.
7. When a number is missing its setup, mark it as unconfirmed in your notes and do not use it for a decision.

---
title: "Build useful artificial intelligence evaluations with a small team"
description: "A practical way to turn real user examples into graders, regression tests, and model-update reviews."
pubDate: "2026-10-01T15:00:00Z"
specimen: 63
section: "dev"
tags: ["evaluation", "testing", "llm", "quality-engineering"]
draft: false
heroImage: "https://media.aitamer.news/heroes/evals-for-small-teams.jpg"
heroAlt: "A paper-cut collage of answer cards passing through check, code, and judgment gates, with one card outlined in coral."
author: "ari"
sources:
  - title: "Working with evals (OpenAI API)"
    url: "https://platform.openai.com/docs/guides/evals"
  - title: "Evaluation best practices (OpenAI API)"
    url: "https://developers.openai.com/api/docs/guides/evaluation-best-practices"
  - title: "Define success criteria and build evaluations (Anthropic Claude Platform Docs)"
    url: "https://docs.anthropic.com/en/docs/test-and-evaluate/develop-tests"
  - title: "Graders (OpenAI API)"
    url: "https://platform.openai.com/docs/guides/graders"
  - title: "Judging LLM-as-a-Judge with MT-Bench and Chatbot Arena (Zheng et al.)"
    url: "https://arxiv.org/abs/2306.05685"
  - title: "Judging the Judges: A Systematic Study of Position Bias in LLM-as-a-Judge (Shi et al.)"
    url: "https://arxiv.org/abs/2406.07791"
wildness:
  rating: 3
  verified: "Independent papers test judge agreement and bias; vendor guides describe eval methods."
  claimed: "The small-team workflow is editorial advice, not a measured outcome."
verdict: "Start with a small, representative set of real failures and deterministic checks; add a model judge only where rules cannot capture quality."
---

An artificial intelligence (AI) feature can look convincing in a demo and still fail on the requests people actually send. A support assistant may answer the common question while inventing account details. A code helper may explain a fix well but produce a patch that does not compile. Evaluations, often shortened to evals, are repeatable tests that compare model behavior with stated expectations. [OpenAI describes evals as a way to test outputs against criteria](https://platform.openai.com/docs/guides/evals), especially when trying a new model or improving an application.

A small team can start without a benchmark program: collect realistic inputs, define success clearly, and add checks that expose meaningful regressions. A practical first eval is a compact suite built from actual work, including cases that surprised the team. OpenAI's [evaluation best practices](https://developers.openai.com/api/docs/guides/evaluation-best-practices) recommend using production and historical data, covering typical and edge cases, and evaluating on every change.

## Collect examples from the feature's real work

Start with examples that show what the feature receives and what it should do. Useful sources include support tickets, bug reports, user corrections, failed tool calls, and outputs a reviewer rejected. Keep the relevant context with each example: the prompt, retrieved material, tool results, expected action, and the reason an answer was accepted or rejected. For a feature that handles sensitive information, include examples that test whether the model protects privacy, a criterion in [Anthropic’s evaluation guide](https://docs.anthropic.com/en/docs/test-and-evaluate/develop-tests).

The guide recommends matching an eval to the real task distribution and including edge cases such as missing, irrelevant, long, or ambiguous inputs. That guidance matters because a suite made only of easy, frequent examples can reward a system that fails exactly where users need help. For a coding feature, include a typical task, an incomplete specification, an unsupported library call, and a task whose correct answer is to ask for more context.

Write down the expected outcome and why it matters. An expected answer can be an exact label, a required action, or a set of properties rather than a single reference paragraph. For example, an answer might need to cite the supplied policy, avoid exposing a secret, and say when evidence is missing. One test can measure each property separately. That makes a failing result easier to interpret than one overall score.

Examples should cover the feature's important paths as well as common usage. Keep a few deliberately difficult cases even if they are uncommon: data that contradicts itself, prompt injection in retrieved text, or a request that exceeds the feature's authority. Label the source and expected behavior so a future editor can see what each case is protecting.

## Choose a grader that matches the question

A grader is the check that decides whether an output met a criterion. Use the simplest check that can answer the question accurately.

**Exact match** works when there is one unambiguous answer, such as a category label or a fixed value in a JavaScript Object Notation (JSON) field. Normalize harmless variation, such as whitespace or case, only when that variation does not matter to the user. If wording can vary while meaning stays the same, exact matching will mark good answers wrong. A keyword check can be similarly brittle: seeing a required phrase does not prove the answer used it correctly. OpenAI’s [grader guide](https://platform.openai.com/docs/guides/graders) describes string checks for straightforward pass-or-fail cases and model graders for more nuanced ones.

**Code checks** are useful when success can be observed directly. Parse structured output against a schema; run a generated query against a test database; compile code; execute tests; or check whether the correct tool and arguments were selected. These checks are repeatable and can be precise. A passing program test establishes behavior for the cases it covers; assess security, maintainability, and user suitability separately.

**A large language model (LLM) acting as a judge** can score qualities that are difficult to reduce to fixed rules, such as whether a summary preserves the key caveat. Give the judge a short, concrete rubric, the relevant input and evidence, and a constrained result format. Split broad goals into separate criteria. The Anthropic guide advises testing judge reliability before scaling and distinguishes code-based, human, and model-based grading. Treat a judge's score as evidence to inspect and corroborate.

Research explains why that caution matters. [Zheng and coauthors' study of LLM-as-a-judge](https://arxiv.org/abs/2306.05685) reports agreement with human preferences in its tested setting while identifying position, verbosity, and self-enhancement biases, along with limits in reasoning. [A later position-bias study](https://arxiv.org/abs/2406.07791) found the bias varied across judges and tasks. In practice, a judge may favor one answer position, a longer answer, or a familiar style over a more correct but terser response.

Check the grader before trusting it. Ask people on the team to label a sample independently, then compare their decisions with the judge. Include clear passes, clear failures, and borderline examples. For pairwise judging, swap the order of candidate answers and see whether the preference changes. Review disagreements, revise the rubric, and repeat. If agreement remains weak on a criterion, keep human review for that criterion or define a more observable check.

## Keep a regression suite small and useful

Put the examples and expected behavior under version control or in a dataset with an equivalent change history. Each case should have a stable identifier, input, expected result or rubric, and a short explanation. When a case changes, reviewers can then see whether the product requirement changed or the test was simply made easier.

Run the suite when you change prompts, retrieval settings, tools, model configuration, or safety logic. Report more than one aggregate pass rate. Break results down by criterion and case group so a gain on routine answers cannot hide a regression in refusals or tool use. Keep the failing outputs beside the scores: a number can tell you that something moved, but the examples show what moved.

Avoid turning every unusual production output into a permanent test without reviewing it. First decide whether it reveals a real requirement, a one-off condition, or an incorrect expectation. Add cases that protect important behavior and remove or revise tests when the product contract deliberately changes. Record the reason for each meaningful edit.

## Treat model updates as behavior changes

Changing the selected model or its configuration can change style, formatting, tool use, latency, or correctness. Record the model identifier and relevant generation settings with each run. Keep a baseline from the current production setup, then run the same cases against the proposed setup. Compare per-criterion results and inspect cases that changed in either direction.

A model update should be reviewed like a code change: show what improved, what regressed, and whether the regression matters to users. If outputs vary between runs, repeat the uncertain cases and report that variation rather than treating a single pass as proof. Keep human review for high-impact criteria, especially when a false pass could expose data, trigger an unsafe action, or mislead a user.

Begin by selecting a small set of real successes and failures, writing down the user-visible expectation for each, and implementing exact or code-based checks wherever possible. Add a model judge for one subjective criterion, then compare it with human labels. Run that suite whenever the feature or model changes. A small eval that catches a real failure is more useful than a large score whose meaning the team cannot explain.

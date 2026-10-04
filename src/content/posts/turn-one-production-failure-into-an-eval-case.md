---
title: Turn One Production Failure Into an Eval Case
description: A failed application trace can become a repeatable regression case when you preserve the input and define the expected behavior.
pubDate: "2026-10-06T03:00:00Z"
specimen: 295
section: dev
tags:
  - evaluation
  - regression-testing
  - tracing
  - mlflow
draft: false
heroImage: https://media.aitamer.news/heroes/turn-one-production-failure-into-an-eval-case-12133847.jpg
heroAlt: A cracked failure report is transformed into a checked evaluation case.
author: ari
wildness:
  rating: 2
  verified: MLflow supports trace-derived datasets, expectations, and pass or fail regression tests.
  claimed: A curated case can keep a known failure visible during later changes.
verdict: A trace becomes useful regression evidence when someone selects the case, defines success, and runs the check again.
sources:
  - title: MLflow Tracing for LLM and Agent Observability
    url: https://mlflow.org/docs/latest/genai/tracing/
  - title: Building MLflow Evaluation Datasets
    url: https://mlflow.org/docs/latest/genai/datasets/
  - title: Ground Truth Expectations
    url: https://mlflow.org/docs/latest/genai/assessments/expectations/
  - title: Regression Testing and CI/CD
    url: https://mlflow.org/docs/latest/genai/eval-monitor/regression-testing/
---

Suppose a support assistant gives a customer a refund deadline that conflicts with the current policy. A production trace holds the input and output, and may show which intermediate step led to the answer. [MLflow tracing](https://mlflow.org/docs/latest/genai/tracing/) captures those details. The trace gives you a concrete failure to investigate.

## Choose the failure

Open the trace and identify the input that exposed the problem. Check the answer and any retrieved material before deciding what the case should test. Keep the relevant input and context. Remove details that are not needed for the test, such as a customer's name or account number. Write down why this example matters so another reviewer can understand the choice.

[MLflow evaluation datasets](https://mlflow.org/docs/latest/genai/datasets/) can be built from existing traces or from cases written by hand. The documentation recommends choosing traces that represent important problems, including low-quality outputs and edge cases. Export the selected trace to a dataset through the UI, or find and add it with the SDK.

## State the expected behavior

The failed answer alone cannot tell a future test what success looks like. Have a person who knows the policy define the expectation. For this example, it might require the assistant to use the current policy text and avoid giving a deadline when that text is unavailable. Make the criterion specific enough that a reviewer can say whether an answer meets it.

[MLflow expectations](https://mlflow.org/docs/latest/genai/assessments/expectations/) attach the desired answer or behavior to a trace. The docs describe factual, structured, and behavioral expectations. They also recommend specific, measurable criteria and metadata explaining the reason for an expectation. This turns an observed failure into a case with an explicit answer key.

## Check the next change

Run the curated case against the proposed prompt, model, or application change. Inspect the new output and the test result. [MLflow's regression testing guide](https://mlflow.org/docs/latest/genai/eval-monitor/regression-testing/) describes pinning the input, scoring the desired behavior, and asserting a pass or fail in a pytest test. Run that check when changes are proposed so the known failure stays visible.

## What to do

Pick one real failed trace. Review its input and output. Save a safe, representative version in an evaluation dataset. Ask a domain expert to write the expected behavior. Add a pass or fail check, run it against the next change, and keep the case when the fix lands.

---
title: "Write a first Inspect eval: dataset, solver chain and scorer"
description: Build a three-sample Inspect task with a solver chain and a built-in scorer, run it with inspect eval, and read the log to tell a wrong answer from a format mismatch.
pubDate: "2026-10-11T07:00:00Z"
section: dev
tags:
  - inspect
  - evals
  - llm-testing
  - python
draft: false
heroImage: https://media.aitamer.news/heroes/write-a-first-inspect-eval-dataset-solver-chain-and-scorer-a38d9c2d.jpg
heroAlt: A layered paper dataset flows through a solver chain to a scorer that distinguishes a wrong answer from a format mismatch.
author: quill
wildness:
  rating: 1
  verified: APIs, CLI flags, log path and scorer behavior checked against Inspect docs and source.
  claimed: Nothing beyond the docs; no claim about how many samples an eval needs.
verdict: Inspect's dataset, solver and scorer split is simple to start with. The real lesson is pairing the scorer with the output format, and reading failed samples before trusting accuracy.
sources:
  - title: Inspect documentation (welcome and getting started)
    url: https://inspect.aisi.org.uk/
  - title: "Inspect: Model Providers"
    url: https://inspect.aisi.org.uk/providers.html
  - title: "Inspect: Datasets"
    url: https://inspect.aisi.org.uk/datasets.html
  - title: "Inspect: Solvers"
    url: https://inspect.aisi.org.uk/solvers.html
  - title: "Inspect: Scorers"
    url: https://inspect.aisi.org.uk/scorers.html
  - title: "Inspect: Tutorial"
    url: https://inspect.aisi.org.uk/tutorial.html
  - title: "Inspect: Log Files"
    url: https://inspect.aisi.org.uk/eval-logs.html
  - title: "Inspect: Log Viewer"
    url: https://inspect.aisi.org.uk/log-viewer.html
  - title: inspect_ai source repository
    url: https://github.com/UKGovernmentBEIS/inspect_ai
---

Inspect is an open-source framework for large language model evaluations from the UK AI Security Institute and Meridian Labs, according to its [documentation](https://inspect.aisi.org.uk/). The docs describe every evaluation as a `Task` built from three parts: a dataset of labelled samples, a solver that produces an answer for each sample, and a scorer that grades the answer. This guide builds a small task from those parts, runs it and reads the log. It also covers the failure most people meet on a first run, where the scorer and the prompt disagree about the shape of the answer.

## Install Inspect and a model provider

The getting-started page installs Inspect from PyPI, then a provider package with its API key in the environment:

```bash
pip install inspect-ai
pip install openai
export OPENAI_API_KEY=your-openai-api-key
```

The same page shows the pattern for Anthropic (`anthropic`, `ANTHROPIC_API_KEY`), Google (`google-genai`, `GOOGLE_API_KEY`) and Hugging Face. The [Model Providers](https://inspect.aisi.org.uk/providers.html) page covers the rest.

## Define the task

The welcome example loads its data from Hugging Face. For a first task, a dataset you can read on one screen is easier to debug. The [Datasets](https://inspect.aisi.org.uk/datasets.html) page shows how to build one in memory with `MemoryDataset` and `Sample`.

```python
# ops_math.py
from inspect_ai import Task, task
from inspect_ai.dataset import MemoryDataset, Sample
from inspect_ai.scorer import answer
from inspect_ai.solver import chain_of_thought, generate, system_message

dataset = MemoryDataset([
    Sample(input="A pipeline has 3 stages of 4 jobs each. How many jobs run?", target="12"),
    Sample(input="An API allows 60 requests per minute. How many in 5 minutes?", target="300"),
    Sample(input="A log rotates every 6 hours. How many rotations in 2 days?", target="8"),
])

@task
def ops_math():
    return Task(
        dataset=dataset,
        solver=[
            system_message("Answer operations questions. Give the final answer as a bare number."),
            chain_of_thought(),
            generate(),
        ],
        scorer=answer("word"),
    )
```

What each part does, according to the docs:

- `Sample(input=..., target=...)` holds the prompt and the ideal answer.
- The solver is a list that runs in order. The [Solvers](https://inspect.aisi.org.uk/solvers.html) page says `system_message()` inserts a system message and `chain_of_thought()` rewrites the user prompt to ask for step-by-step reasoning. Its default template in the [Inspect source](https://github.com/UKGovernmentBEIS/inspect_ai) asks the model to end on its own line with `ANSWER: $ANSWER`. `generate()` calls the model.
- The [Scorers](https://inspect.aisi.org.uk/scorers.html) page describes `answer()` as the scorer for prompts that tell the model to end with `ANSWER: X`. It extracts the letter, word or rest of the line after the marker. In the source it is built on the `pattern()` scorer, which reports accuracy and standard error.
- `@task` registers the function so `inspect eval` can find it by name.

## Run it from the command line

```bash
inspect eval ops_math.py --model openai/gpt-4o
```

The [Tutorial](https://inspect.aisi.org.uk/tutorial.html) uses `--limit` to run a subset while you develop:

```bash
inspect eval ops_math.py --limit 1 --model openai/gpt-4o
```

The [Log Files](https://inspect.aisi.org.uk/eval-logs.html) page says each run writes one log per task to `./logs` under the current working directory, and prints a link to it below the results. Since Inspect v0.3.46 the default format is `.eval`, which the docs describe as typically 1/8 the size of `.json`. You can change the location with `--log-dir` or the `INSPECT_LOG_DIR` environment variable.

## Read the log

```bash
inspect view
```

The [Log Viewer](https://inspect.aisi.org.uk/log-viewer.html) page says this serves the viewer on `127.0.0.1`, port 7575, reads the configured log directory and updates as new runs finish. Open a sample to see the message history: the system message, the prompt as rewritten by `chain_of_thought()`, the model reply and the scoring decision. On a first run, the scoring decision is the part to read closely.

For scripts, the Log Files page documents a Python API (`read_eval_log()` and related functions) and `inspect log list --json` for listing logs in a directory.

## The first failure: a format mismatch scored as a wrong answer

Remove `chain_of_thought()` from the solver and run again. The model now answers in its own words and may never write an `ANSWER:` line. The Scorers page says `pattern()`, which `answer()` uses, returns `INCORRECT` with `reason="invalid_response_format"` when the pattern does not match. Accuracy drops even if every number in the replies is right.

Other scorers have the same trap in different forms. The docs say `exact()` requires the whole normalized output to match a target, so "The answer is 12." fails against "12". `match()` looks at the end of the output by default and ignores case and whitespace. The word pattern in `answer("word")` captures a single token, so a reply of `ANSWER: 12 jobs` does not match.

What to do:

1. Choose the scorer and the output instruction together. If the scorer expects `ANSWER:`, the solver chain must ask for it.
2. Say in the prompt what the final answer looks like, as the system message above does with "a bare number".
3. Before you trust an accuracy figure, open several failed samples in the viewer and read why each was marked incorrect.

## Where this advice stops

Text-matching scorers fit short answers that can be checked exactly. For free-form answers the docs point to `model_graded_qa()` and `model_graded_fact()`, which ask a model to grade the reply against the target. For `model_graded_fact()`, the tutorial notes that by default the model being evaluated does the grading and that you can pass a different grader model. Three samples say little about a model, and the getting-started pages give no guidance on how many samples a reliable eval needs. Agent evaluations keep the same `Task` structure and swap the solver for an agent such as the built-in `react()`, usually with tools and a sandbox.

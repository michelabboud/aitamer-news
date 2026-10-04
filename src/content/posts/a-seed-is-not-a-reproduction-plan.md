---
title: A Seed Is Not a Reproduction Plan
description: Matching seeds do not guarantee matching results. Reproducing a run also means recording its software, hardware, and algorithm settings.
pubDate: "2026-10-04T21:00:00Z"
specimen: 236
section: dev
tags:
  - reproducibility
  - pytorch
  - randomness
  - machine-learning
draft: false
heroImage: https://media.aitamer.news/heroes/a-seed-is-not-a-reproduction-plan-94dd9ce0.jpg
heroAlt: Two plants grow differently beside computers with different settings, despite a shared seed symbol.
author: ari
wildness:
  rating: 2
  verified: PyTorch documents variation across releases, devices, random generators, and algorithms.
  claimed: A useful reproduction record should include the environment and algorithm settings alongside seeds.
verdict: Keep the seed, then record the software, device, and algorithm settings needed to interpret a repeated run.
sources:
  - title: Reproducibility — PyTorch documentation
    url: https://docs.pytorch.org/docs/2.14/notes/randomness.html
---

A seed fixes a starting point for a random number generator. It does not describe the machine that runs the code or the algorithms the machine selects. The [PyTorch reproducibility guide](https://docs.pytorch.org/docs/2.14/notes/randomness.html) says results can differ across releases, platforms, and CPU and GPU runs even when seeds match. A saved seed is one entry in a larger run record.

## Randomness can have several owners

PyTorch has its own random number generator. Python code and NumPy can have separate ones. NumPy Generator objects can also carry their own state instead of using NumPy's global generator. Seeding one source leaves the others free to vary. PyTorch's guide recommends setting the relevant seeds and checking the libraries used by the application.

The order of work matters too. PyTorch's DataLoader reseeds workers, and its guide shows a worker initialization function and a generator for reproducible loading. If data loading is part of an experiment, record those settings alongside the seed.

## Hardware can change the route

A GPU convolution may use cuDNN benchmarking to choose an algorithm for a given input shape. Benchmark noise or different hardware can lead to a different choice on another run. Disabling that benchmark makes the selection consistent, though the selected algorithm may itself be nondeterministic. This is why the device and its settings belong in the record.

PyTorch also warns that matching results across CPU and GPU is not guaranteed. A reproduction attempt should therefore say which device was used and which software release ran on it. That gives another person a concrete environment to recreate.

## Algorithm settings affect the result

PyTorch offers `torch.use_deterministic_algorithms(True)`. Where a deterministic alternative exists, it uses one. Where an operation has no such alternative, it raises an error. The guide also notes that deterministic operations are often slower.

Algorithm choices can change numerical results even when an operation is deterministic. The guide says scaled dot product attention backends can accumulate floating point values in different orders, so bitwise matches across those backends are not guaranteed. Record the backend when that operation matters to the result.

## What to do

1. Save the seed and set it for every random number generator the run uses.
2. Record the code revision, PyTorch release, device, and relevant backend settings.
3. Enable deterministic algorithms when exact repeatability matters, and record any errors or performance cost.
4. Run the same inputs again in the recorded environment. Compare outputs and state the level of agreement you actually observed.

A seed makes one source of variation controllable. The rest of the run record explains what that seed was allowed to control.

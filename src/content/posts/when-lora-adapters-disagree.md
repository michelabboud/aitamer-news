---
title: When LoRA Adapters Disagree
description: Merging LoRA adapters means choosing how strongly each contributes, how many updates survive, and how conflicting updates are resolved.
pubDate: "2026-10-07T12:00:00Z"
specimen: 359
section: models
tags:
  - lora
  - peft
  - model-merging
  - ties
  - dare
draft: false
heroImage: https://media.aitamer.news/heroes/when-lora-adapters-disagree-c0cf50ba.jpg
heroAlt: Two adjustment sliders pull different colored layers toward a shared scene.
author: ari
wildness:
  rating: 2
  verified: PEFT documents weights, density, TIES, and DARE for LoRA merges.
  claimed: A merge setting still needs evaluation on the tasks it must handle.
verdict: Adapter merging is a controlled experiment. Keep the source adapters, record each merge choice, and compare performance on every task that matters.
sources:
  - title: PEFT model merging guide
    url: https://huggingface.co/docs/peft/developer_guides/model_merging
  - title: PEFT LoRA guide and API reference
    url: https://huggingface.co/docs/peft/package_reference/lora
  - title: Resolving Interference When Merging Models
    url: https://huggingface.co/papers/2306.01708
  - title: "Language Models are Super Mario: Absorbing Abilities from Homologous Models as a Free Lunch"
    url: https://huggingface.co/papers/2311.03099
---

A LoRA adapter changes a model through small trainable matrices while leaving the original model weights frozen. That makes it practical to keep several task adapters for one base model. Combining them requires choices about how their updates share the same parameters. The [PEFT LoRA guide](https://huggingface.co/docs/peft/package_reference/lora) explains the frozen base and separate adapters. Its [merging guide](https://huggingface.co/docs/peft/developer_guides/model_merging) shows how to combine named adapters.

## Start with the same foundation

The PEFT example loads a base model, then loads three LoRA adapters under separate names. It calls `add_weighted_adapter()` to create a new, named adapter, and `set_adapter()` to make that result active. Keeping the source adapters available lets you compare each one with the merge. [PEFT merging guide](https://huggingface.co/docs/peft/developer_guides/model_merging).

The guide warns that special tokens can collide when fully trained models added different tokens at the same embedding position. It says this should not be an issue when merging only LoRA adapters trained from the same base model. Check the base model and tokenizer history before treating two adapters as compatible. [PEFT merging guide](https://huggingface.co/docs/peft/developer_guides/model_merging).

## Weights decide each adapter's influence

The `weights` argument assigns one number to each adapter in the same order as their names. PEFT permits positive and negative values, so the setting can add or subtract an adapter's effect. Its LoRA reference shows a two-adapter example using `[0.7, 0.3]` with `combination_type="linear"`. Those numbers describe that example; other merges need their own evaluation. [PEFT LoRA reference](https://huggingface.co/docs/peft/package_reference/lora).

The TIES example in PEFT makes a different choice. It gives three adapters weights of `[2.0, 1.0, 1.0]` and sets density to `0.2`. The guide says equal weights of `1.0` are a good starting point for this setting and that values above `1.0` typically preserve scale better. Treat each weight vector as a candidate and compare it with the individual adapters. [PEFT merging guide](https://huggingface.co/docs/peft/developer_guides/model_merging).

## Density decides how much survives

For TIES, DARE combinations, and pruning methods, PEFT exposes `density` as a value from zero to one. Its API defines zero as pruning all values and one as pruning none. Density `0.2` therefore asks the method to retain a small fraction of values. Density controls sparsity; weights control each adapter's contribution. A weight can emphasize an adapter while density still removes many candidate updates. Change these settings separately when comparing results. [PEFT LoRA reference](https://huggingface.co/docs/peft/package_reference/lora).

Lower density can reduce overlap among updates. It can also discard useful changes. Record density with the merge method and weights so that results from different runs can be compared. The [PEFT merging guide](https://huggingface.co/docs/peft/developer_guides/model_merging) presents density as a setting to choose for TIES and DARE merges.

## Conflicting signs need a rule

Suppose two adapters update the same parameter in opposite directions. Averaging can weaken both changes. The [TIES paper](https://huggingface.co/papers/2306.01708) identifies sign disagreement and small, redundant updates as sources of interference in model merging. Its method trims small changes, selects a sign, and merges values aligned with that sign.

PEFT offers `ties` and related `combination_type` choices. Its API also offers `majority_sign_method` values `total` and `frequency` for the TIES family. Record the sign rule: it helps determine which opposed updates survive. [PEFT LoRA reference](https://huggingface.co/docs/peft/package_reference/lora).

DARE takes a preparatory step. It randomly drops some delta parameters, then rescales those left behind. PEFT describes it as a way to reduce potentially interfering updates before another merge rule, including TIES. The [DARE paper](https://huggingface.co/papers/2311.03099) studies sparsifying updates from related fine-tuned models before combining them. Its reported results belong to the models and settings it studied. Test DARE on the tasks your merge must handle. [PEFT merging guide](https://huggingface.co/docs/peft/developer_guides/model_merging).

## Merge types have practical costs

PEFT supports linear, singular value decomposition (SVD), concatenation, TIES, DARE combinations, and pruning variants through `combination_type`. Its reference calls linear efficient but a rough approximation. Concatenation produces a rank equal to the sum of the source ranks, which can make the result large enough to run out of memory. SVD has an output-rank control. The reference also says SVD combination is unsupported when using `torch.float16` or `torch.bfloat16`. Method choice affects size and compatibility as well as how updates are combined. [PEFT LoRA reference](https://huggingface.co/docs/peft/package_reference/lora).

## What to do

1. Verify that the adapters belong to the intended base model. Check whether tokenizer or embedding changes need separate handling. Keep each adapter available under its own name. [PEFT merging guide](https://huggingface.co/docs/peft/developer_guides/model_merging).
2. Evaluate the base and each adapter on the tasks the combined model must handle. Save those results for comparison. The [PEFT LoRA reference](https://huggingface.co/docs/peft/package_reference/lora) shows how to load and select individual adapters.
3. Create a named merge with `add_weighted_adapter()`. For a TIES or DARE trial, start with the guide's equal `1.0` weights. Then vary one weight or density setting at a time. Record the method, weights, density, and sign rule. [PEFT merging guide](https://huggingface.co/docs/peft/developer_guides/model_merging).
4. Set the merged adapter active and rerun the same tasks. Keep the merge only if it meets the requirements on each task, including tasks whose adapters received less weight. [PEFT merging guide](https://huggingface.co/docs/peft/developer_guides/model_merging).

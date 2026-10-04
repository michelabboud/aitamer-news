---
title: Your Model Weights Shouldn't Execute Code
description: A model checkpoint's file format affects what happens when you load it. Learn why pickle deserves caution and how to choose safer weights.
pubDate: "2026-10-08T04:30:00Z"
specimen: 392
section: tools
tags:
  - model-security
  - pickle
  - safetensors
  - pytorch
draft: false
heroImage: https://media.aitamer.news/heroes/your-model-weights-shouldn-t-execute-code-6f29d937.jpg
heroAlt: A coral paper snake escapes a brain-marked box while a separate shelter remains still.
author: ari
wildness:
  rating: 3
  verified: Hugging Face documents code execution during pickle loading.
  claimed: A file presented as weights can become an execution path when loaded.
verdict: Prefer supported safetensors weights. Treat pickle checkpoints as files that require trust in their publisher.
sources:
  - title: "Hugging Face: Pickle Scanning"
    url: https://huggingface.co/docs/hub/security-pickle
  - title: "PyTorch: torch.load"
    url: https://docs.pytorch.org/docs/2.14/generated/torch.load.html
  - title: "Hugging Face: Safetensors"
    url: https://huggingface.co/docs/safetensors/index
---

A model download may look like a collection of numbers. The loader decides how those bytes are interpreted. [Hugging Face warns](https://huggingface.co/docs/hub/security-pickle) that loading a pickle file can execute arbitrary code. It also describes pickle as a common format for PyTorch model weights. A checkpoint can therefore carry instructions that run when it is opened.

## Why pickle changes the risk

Pickle stores a sequence of instructions for rebuilding Python objects. During loading, those instructions can import modules and call functions. In [Hugging Face's example](https://huggingface.co/docs/hub/security-pickle), malicious code runs and the expected data is still returned. Check the checkpoint format before calling a loader.

PyTorch's [torch.load documentation](https://docs.pytorch.org/docs/2.14/generated/torch.load.html) says the function uses an unpickler and warns against loading data from an untrusted source. Its `weights_only=True` option restricts the objects the unpickler may create. That restriction is useful when a PyTorch checkpoint is necessary. It does not establish whether you can trust the publisher.

## What a scan can tell you

Hugging Face says its Hub scans pickled files and displays imports it finds. That gives you information to review before loading a file. The same [guidance](https://huggingface.co/docs/hub/security-pickle) says the scanner is not foolproof. A clean looking result should not settle the decision by itself.

A signed commit can help establish who published a file. Hugging Face explicitly says the signature does not guarantee the file is safe. Format and provenance answer different questions: what the loader will do with the bytes, and whose bytes you received.

## What to do

1. Check the model repository's file list before downloading or loading a checkpoint. If it offers `.safetensors` weights that your software supports, choose them. [Safetensors documentation](https://huggingface.co/docs/safetensors/index) describes it as a format for storing tensors safely, as opposed to pickle.
2. If you need a pickle checkpoint, verify that you trust its publisher and review the Hub's import scan. Treat a signature as evidence of origin, then make your own trust decision.
3. When loading a suitable PyTorch checkpoint, pass `weights_only=True` explicitly, as shown in the [PyTorch documentation](https://docs.pytorch.org/docs/2.14/generated/torch.load.html). If loading fails because the file needs broader object support, do not disable that restriction for a file whose publisher you have not verified.

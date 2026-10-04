---
title: The Model Beneath the Adapter
description: A LoRA adapter stores a learned update, not a complete model. Here is what the base model supplies, what the adapter changes, and how to load or merge them.
pubDate: "2026-10-07T02:00:00Z"
specimen: 339
section: models
tags:
  - lora
  - adapters
  - fine-tuning
  - base-models
draft: false
heroImage: https://media.aitamer.news/heroes/the-model-beneath-the-adapter-5d9b83fd.jpg
heroAlt: The same base wolf sits on both sides of an inserted adapter, with a different colored coat afterward.
author: ari
wildness:
  rating: 2
  verified: LoRA freezes base weights and trains compact updates that can be merged.
  claimed: An adapter download can look like a complete model to a reader.
verdict: A LoRA adapter needs its base model to run. Keep the base identity and adapter configuration together, or save a merged model when that path is supported.
sources:
  - title: LoRA, Hugging Face PEFT documentation
    url: https://huggingface.co/docs/peft/main/en/conceptual_guides/lora
  - title: PEFT checkpoint format, Hugging Face
    url: https://huggingface.co/docs/peft/main/en/developer_guides/checkpoint
  - title: PEFT configurations and models, Hugging Face
    url: https://huggingface.co/docs/peft/main/en/guides/peft_model_config
  - title: "LoRA: Low-Rank Adaptation of Large Language Models"
    url: https://arxiv.org/abs/2106.09685
---

A LoRA adapter can be easy to mistake for a complete model. Its files can be shared separately, and a model page may present it as a finished customization. The useful mental picture is a base model plus a learned change. Hugging Face’s [LoRA guide](https://huggingface.co/docs/peft/main/en/conceptual_guides/lora) says the original weights stay frozen during this kind of fine-tuning. The trained adapter supplies an update that is combined with those weights when the model runs.

## The base model supplies the original weights

A base model is the pretrained model chosen before the adapter is trained. It holds the weight matrices that LoRA will adapt. Training starts by loading that model, adding a LoRA configuration, and wrapping it as a trainable PEFT model. The [PEFT configuration guide](https://huggingface.co/docs/peft/main/en/guides/peft_model_config) shows this sequence. The base remains the large part of the system, even when the adapter is the part someone has just downloaded.

Think of the adapter as instructions for changing specific calculations in that base. This is an analogy: the adapter contains learned numerical weights. The choice of base matters because those changes are defined against the model and modules used during training. The adapter configuration can record a `base_model_name_or_path` and a model revision. Those fields help identify the model that belongs underneath it, as the [checkpoint format guide](https://huggingface.co/docs/peft/main/en/developer_guides/checkpoint) explains.

## LoRA trains a compact update

Full fine-tuning can change a model’s original weights. LoRA keeps those weights frozen and trains two smaller matrices for each selected weight matrix. Together, the smaller matrices represent an update to the original matrix. The original weights and the learned update are combined to produce the adapted result. This is the mechanism described in the [LoRA guide](https://huggingface.co/docs/peft/main/en/conceptual_guides/lora) and the [original LoRA paper](https://arxiv.org/abs/2106.09685).

The word “rank” describes a limit on the size of this update. In PEFT, the configuration parameter `r` sets the rank of the update matrices. A lower rank means smaller update matrices and fewer trainable parameters. The `target_modules` setting chooses which modules receive them. The guide says LoRA is commonly applied to attention blocks in Transformer models, though the method can be applied to other weight matrices. These choices affect what the adapter can change and how many parameters training has to adjust. [Hugging Face documents both settings](https://huggingface.co/docs/peft/main/en/conceptual_guides/lora).

This compact training path lets one base support several adapters for different tasks. Each adapter can carry its own learned update while the pretrained weights remain the same. The [LoRA guide](https://huggingface.co/docs/peft/main/en/conceptual_guides/lora) describes this storage and training advantage. The adapter file still needs the pretrained weights to produce an adapted model.

## The adapter checkpoint leaves the base out

When PEFT saves an adapter, its weight file contains adapter parameters rather than the base model’s weights. The checkpoint also includes `adapter_config.json`, which holds settings needed to load the adapter. PEFT can generate a model card too. The [checkpoint format documentation](https://huggingface.co/docs/peft/main/en/developer_guides/checkpoint) states directly that loading a PEFT model requires the original model to be available.

That explains a common surprise: downloading the adapter alone does not give you a runnable copy of the adapted model. The base has to be loaded, then the adapter has to be applied to it. Hugging Face’s [loading example](https://huggingface.co/docs/peft/main/en/guides/peft_model_config) reads the adapter configuration, loads the named base model, and passes that model into `PeftModel.from_pretrained` with the adapter path. If the base cannot be obtained, the adapter checkpoint does not supply the missing weights.

The configuration is therefore part of the handoff. Check the recorded base name, the revision if one is given, the LoRA method, and the target modules before trying to load an adapter. The [checkpoint guide](https://huggingface.co/docs/peft/main/en/developer_guides/checkpoint) shows those fields in an example configuration and says the weight file and configuration file are both needed for a PEFT checkpoint. A revision may be absent, so the file does not always identify one exact base snapshot.

## Merging changes what gets saved

After training, LoRA’s update can be merged into the base weights. PEFT’s `merge_and_unload()` returns a model that can then be saved with the merged weights. The [LoRA guide](https://huggingface.co/docs/peft/main/en/conceptual_guides/lora) describes merging as a way to avoid loading a separate adapter at inference time. The [checkpoint guide](https://huggingface.co/docs/peft/main/en/developer_guides/checkpoint) says a saved merged model contains the base weights as well, so it is much larger than an adapter checkpoint.

Merging also changes what you can do with the result. The checkpoint guide says the returned basic model loses PEFT features such as disabling an adapter or switching among several loaded adapters. It also notes that some PEFT methods or settings do not support merging. Keep an unmerged adapter when those controls matter. Save a merged model when you need a single set of weights and the chosen method supports that path. [Hugging Face lists these trade-offs](https://huggingface.co/docs/peft/main/en/developer_guides/checkpoint).

## What to do

1. Open the adapter’s `adapter_config.json`. Find `base_model_name_or_path`, its revision if present, and `peft_type`. The [checkpoint guide](https://huggingface.co/docs/peft/main/en/developer_guides/checkpoint) explains these fields.
2. Obtain the named base model and load it before the adapter. Follow the [PEFT loading example](https://huggingface.co/docs/peft/main/en/guides/peft_model_config) for the order of operations.
3. Keep the adapter files and base model identity together when sharing your setup. If you need one saved model, check merge support, merge the adapter, and save the resulting model. The [PEFT storage guide](https://huggingface.co/docs/peft/main/en/developer_guides/checkpoint) shows that path.

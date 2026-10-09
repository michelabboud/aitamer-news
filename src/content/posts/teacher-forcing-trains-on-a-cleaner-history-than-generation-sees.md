---
title: Teacher Forcing Trains on a Cleaner History Than Generation Sees
description: A sequence model can score well one token at a time yet stumble when its own earlier output becomes the next input. Scheduled sampling exposes the training and generation mismatch.
pubDate: "2026-10-10T13:30:00Z"
specimen: 624
section: models
tags:
  - teacher-forcing
  - sequence-models
  - scheduled-sampling
  - generation
draft: false
heroImage: https://media.aitamer.news/heroes/teacher-forcing-trains-on-a-cleaner-history-than-generation-sees-ae44dac4.jpg
heroAlt: Paper footprints follow a straight cream guide trail beside a curved rust trail through a teal landscape.
author: ari
wildness:
  rating: 1
  verified: The paper defines teacher-forced training and per-token scheduled sampling for recurrent sequence models.
  claimed: Examples are conceptual; paper results do not establish a universal benefit for modern generators.
verdict: Evaluate generated sequences under their own histories before choosing a training fix.
sources:
  - title: Scheduled Sampling for Sequence Prediction with Recurrent Neural Networks
    url: https://arxiv.org/abs/1506.03099
---

A generated caption can begin correctly and then drift after one wrong word. The next word is chosen with that wrong word in its history; the model cannot quietly replace it with the intended caption. Yet during ordinary supervised training, the same model often receives the correct previous word at every step. This difference matters whenever a developer evaluates a sequence generator by next-token accuracy and expects the score to predict complete-output quality.

In the [scheduled-sampling paper](https://arxiv.org/abs/1506.03099), Bengio and colleagues describe this setup for recurrent sequence models. Given an input, such as an image, and a target sequence, training maximizes the probability of each target token conditioned on the input and the preceding target tokens. The sequence probability factors into one conditional prediction per position. This makes training straightforward: the target history is already in the dataset, so the model can learn from every position without having to generate the whole sequence first. This practice is commonly called teacher forcing.

Consider a caption target, “a dog jumps over a log.” Suppose the model predicts “a dog runs” where the target uses “jumps.” Under teacher forcing, the following training step still supplies “jumps” as the previous word and asks for “over.” During generation, the model instead receives “runs” and must decide what comes next from that altered context. “Over” may still be possible, but the state leading to it differs. The example illustrates a changed input history, not a guarantee that one error will ruin every continuation.

The mismatch compounds because the model's state summarizes the tokens it has processed. A wrong token changes that state. Later predictions can shift the state further, placing the model on a path rarely encountered when all training histories were correct. The paper calls out this accumulation of errors as a reason that strong next-step predictions under ground-truth histories can coexist with weaker decoded sequences. A beam search can keep several candidate continuations, but it does not supply the true previous token and cannot cheaply enumerate every possible output sequence.

Scheduled sampling changes the histories seen during training. For each prediction step, a coin flip decides whether the next input token comes from the target sequence or from the model's own earlier prediction. The paper starts with a high probability of using the target token and reduces it as training proceeds. Early in training, model-generated tokens can be nearly random, so feeding them back too often makes the learning problem harder before the model has learned the task. Later, more model-generated history gives it practice recovering from its own choices. The paper considers either sampling from the model's distribution or taking its highest-scoring token for that input.

The decision is made per token in the reported experiments. That detail matters: switching an entire sequence to model-generated history early can create long runs of errors at once. The authors report that a per-sequence coin flip worked much worse in their experiments. They also report poor captioning results when training always fed back model predictions from the start. The schedule is therefore part of the method, not merely a parameter for how much randomness to add.

There is an important limit to the analogy with live generation. At a step reached through a model-generated, possibly incorrect prefix, the training loss still uses the reference token for that position as its target. If the prefix has changed the meaning of the sentence, the reference continuation may no longer be the only sensible continuation. The paper's experiments also did not backpropagate through the discrete decision that selected a generated token. Scheduled sampling supplies exposure to altered histories; it does not directly optimize every property of a complete generated sequence. Its reported gains on image captioning, parsing, and speech recognition are evidence for those studied settings, not a universal guarantee.

For an AI developer building a spoken-response generator, the practical lesson is about evaluation before intervention. A system that reads a response aloud cannot repair its first sentence by supplying the written reference at the next token. Keep a held-out set of prompts or inputs and compare two views: loss under reference histories and quality when the model produces full outputs using the actual decoding procedure. Include cases where an early choice changes a later noun, instruction, or stopping point. If the gap is consequential, test training strategies that expose the model to its own prefixes and measure complete outputs again. The diagnostic is the difference between the histories the model sees while learning and those it must handle when speaking.

---
title: A Selective State Space Model Carries State Instead of an Attention Cache
description: Mamba changes a recurrent state according to each input. That keeps generation memory bounded by the model state, while making recall depend on what the state retained.
pubDate: "2026-10-10T12:00:00Z"
specimen: 621
section: models
tags:
  - mamba
  - state-space-models
  - sequence-modeling
  - inference
draft: false
heroImage: https://media.aitamer.news/heroes/a-selective-state-space-model-carries-state-instead-of-an-attention-cache-b7e35a76.jpg
heroAlt: A teal paper seed capsule retains a rust seed from a long cream ribbon, beside a separate rolled paper history.
author: ari
wildness:
  rating: 1
  verified: Mamba makes Δ, B, and C input dependent and uses recurrent state for inference.
  claimed: A fixed state cannot guarantee exact recall of arbitrary earlier details.
verdict: Use selective state updates for long streams when bounded serving state matters; test rare detail recall separately and retain source text when exact retrieval is required.
sources:
  - title: "Mamba: Linear-Time Sequence Modeling with Selective State Spaces"
    url: https://arxiv.org/html/2312.00752
---

A transcript says, ‘The access code is 4172,’ then wanders through several minutes of corrections and small talk. Later, a user asks for the code. A sequence model serving this conversation needs two abilities: carry information forward cheaply and preserve the particular detail the user may request. Those abilities pull against each other. Keeping every earlier token available for direct lookup costs memory; compressing a history into a bounded state makes some details harder to recover.

That tension is the useful way to read [Mamba](https://arxiv.org/html/2312.00752). In an autoregressive Transformer, attention layers typically retain keys and values derived from earlier tokens so later tokens can attend to them. The cache grows with the processed context. A state space model instead updates a latent state as inputs arrive. At the next step, the model carries that state forward rather than a growing record of keys and values. Its state size is fixed by the architecture for a given stream, although the total memory of an application still includes weights, batching, inputs, outputs, and any other buffers.

The basic recurrence has a simple shape: the new state combines a transformed previous state with a transformed current input; the output reads from that new state. With time invariant dynamics, the recurrence applies the same transition and input projection at every position. Those update coefficients do not change in response to the current token. Earlier structured state space models benefited from such time invariant dynamics because the recurrence could also be computed as a convolution over a whole sequence. That route helped parallel training, but it limited content dependent selection.

Mamba changes the update rule with the input. In the paper's selective state space layer, the step size Δ and the input and output projections B and C depend on the current sequence values, while the structured A parameter remains learned and shared. After discretization, the transition and input contribution therefore vary across positions. The paper connects Δ to gating: a small step can preserve existing state and largely ignore an incoming item; a larger step can favor the current item and replace more of what came before. B and C offer finer control over what enters the state and what the output reads from it. The model learns these decisions from data; it has no explicit rule that marks a four digit string as important.

Consider a streaming transcript encoder receiving ‘um, the code is 4172, sorry, I mean 4173.’ A selective update gives it a mechanism to treat the correction differently from the filler and to keep a useful trace through later speech. The example illustrates what the architecture can represent; it does not establish that a particular trained model will reliably return 4173. Tokenization, training data, state capacity, and the later question all affect that outcome. The paper uses selective copying tasks with irregular gaps to probe this kind of content dependent retention, and separately evaluates language and audio models. The synthetic result should not be promoted into a guarantee of exact recall in a production assistant.

Selection removes the old convolution shortcut because the recurrence changes with each input. Mamba's implementation addresses that cost with a parallel scan for sequences available during training. It fuses parts of the calculation so the expanded intermediate state need not be written repeatedly to slower accelerator memory, and recomputes some values during the backward pass. When generating one token or sample at a time, it can simply advance the recurrent state. This distinction matters when comparing systems: the training path processes a sequence efficiently in parallel, while the serving path updates a compact state incrementally. The paper reports its own throughput and quality comparisons, but those measurements depend on its models, baselines, and hardware.

The bounded state is also the central tradeoff. It is a compression of history, so it cannot offer unrestricted, exact access to arbitrary earlier spans merely because the stream can continue for a long time. A later query may need a detail that the update process did not preserve. Long context length and reliable retrieval are different tests. The authors themselves frame selection as a way to choose what survives compression and note that their empirical scale and downstream affordances leave open questions. Even within state space models, they report that selection can impair performance on some continuous signals where time invariant models are strong.

For an AI developer, the practical choice is task specific. If the product must quote an earlier legal clause, reproduce a user supplied identifier, or audit which source supported an answer, keep the original text in an external record and retrieve it explicitly. If the workload is a long stream where a compact running representation is valuable, a selective state space model is a plausible candidate. Evaluate it with the actual question distribution, including corrections, rare facts, long distractors, and boundary resets. Measure both serving memory and answer accuracy as the stream length grows. The architectural promise is economical state updates; the acceptance test is whether that state preserves the information your users will later need.

---
title: An Expert Router Can Run Out of Capacity
description: A sparse mixture-of-experts router can choose an expert that has no remaining token slots. Here is what overflow means in Switch Transformer and how capacity changes the tradeoff.
pubDate: "2026-10-10T10:30:00Z"
section: models
tags:
  - mixture-of-experts
  - transformers
  - model-architecture
  - routing
draft: false
heroImage: https://media.aitamer.news/heroes/an-expert-router-can-run-out-of-capacity-3c669b1b.jpg
heroAlt: Cream leaves crowd a full blue expert basket while overflow follows a teal residual path beside an empty rust basket.
author: ari
wildness:
  rating: 1
  verified: Switch uses top-one routing and finite expert capacity; overflow skips expert computation via a residual path.
  claimed: Application quality and cost depend on the model, dispatch groups, routing policy, and workload.
verdict: Expert capacity limits assignments per dispatch, not the existence of a token. Inspect overflow handling and measure load, quality, and cost together before changing the capacity factor.
sources:
  - title: "Switch Transformers: Scaling to Trillion Parameter Models with Simple and Efficient Sparsity"
    url: https://arxiv.org/abs/2101.03961
---

Seven of twelve tokens choose the same expert. Its batch has room for four. The router made a valid choice for each token, yet three assignments cannot be served. That is the practical tension in sparse mixture-of-experts (MoE) layers: an expert can have available weights and still have no available **capacity** in the current dispatch.

A dense Transformer feed-forward layer applies the same weights to every token representation. An MoE layer replaces that computation with several feed-forward experts and a router that selects which expert receives each token. The router computes scores from a token representation, turns them into probabilities, and selects experts according to a routing rule. Sparse activation lets a model hold many expert parameters while invoking only a subset for each token. It also makes the work per expert depend on the batch's routing decisions. [Switch Transformer](https://arxiv.org/abs/2101.03961) is a particularly clear example because it sends each token to its highest-scoring expert, then weights that expert's output by its router probability.

The capacity calculation is simple enough to inspect. For a batch with *T* tokens, *N* experts, and capacity factor *c*, the paper describes each expert's nominal token capacity as **(T / N) × c**. Think of this as an allocation of slots, rather than a promise that exactly *T / N* tokens will choose each expert. At *T = 12*, *N = 3*, and *c = 1*, each expert has four slots. If the assignments are seven, three, and two, the first expert overflows by three while the other two have three unused slots between them. Increasing the factor to 1.5 gives six slots per expert; in this example, one assignment still overflows. A larger factor could accommodate this particular batch, but would reserve more potentially empty space on every expert. Implementations must also make capacity an integer and may calculate it within their own dispatch groups, so these small numbers illustrate the paper's rule rather than specify a universal rounding convention.

### What happens to an overflowing token?

In the paper's standard Switch routing, an assignment beyond an expert's capacity receives **no computation from that expert layer**. The token representation continues through the residual connection to the next layer. “Dropped token” is therefore easy to misread: the token does not disappear from the sequence, and the entire model does not necessarily refuse to process it. It loses this layer's selected expert transformation. The paper's router pseudocode counts positions within each expert, masks positions beyond capacity, and zeroes the corresponding expert gate. A busy expert does not automatically hand its excess tokens to an idle one.

That last point matters for an AI application that generates a transcript summary or a spoken answer. If many representations in one dispatch group prefer the same expert, some may miss a feed-forward transformation even though spare capacity exists elsewhere. The effect on any particular answer cannot be inferred from the capacity formula alone. It depends on learned routing, the batch, the location of the layer, and the model's behavior after the residual path. Treat overflow as a model-level diagnostic, not as a claim that a visible word was deleted.

The capacity factor trades unused slots for fewer overflows. In the paper's statically shaped distributed implementation, extra slots can mean padding, computation, memory use, and communication. Reducing the factor can improve utilization, but only if routing stays sufficiently balanced. The authors add an auxiliary load-balancing loss during training. It combines each expert's fraction of chosen tokens with the average router probability assigned to that expert, encouraging a more even distribution. This changes the learned router's incentives; it does not guarantee that every future batch fits. The paper reports typically less than one percent token dropping in its experiments under its settings, which is an observation about those runs, not a safe target to assume for another model or serving workload.

There is also a distinction between **capacity** and **routing policy**. Ordinary top-one Switch routing selects the highest-probability expert once. The paper's appendix explores “No-Token-Left-Behind,” which tries another expert for overflowed tokens, starting with the second-highest choice. That can use otherwise idle capacity and leave very few tokens without an expert pass. The authors did not find an empirical benefit from that rerouting in their tests. Their proposed explanation is that moving a token away from the expert learned for it can offset the benefit of processing it. A design that reroutes, drops, or provisions more capacity therefore needs its own quality and cost evaluation; those options are not interchangeable implementations of the same behavior.

For an engineer selecting or operating a sparse model, inspect the actual routing contract before interpreting a capacity metric. Ask how tokens are grouped for dispatch, which experts are eligible, how capacity is rounded, whether overflow takes a residual path or a fallback expert, and whether the reported drop rate counts assignments or tokens across multiple layers. Then measure expert load and overflow on representative batches alongside task quality and latency. Capacity is a budget for expert calls. Its useful setting is the one that handles the application's routing distribution at an acceptable cost, rather than the largest number that makes an illustrative batch fit.

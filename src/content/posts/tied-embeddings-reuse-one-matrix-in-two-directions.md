---
title: Tied Embeddings Reuse One Matrix in Two Directions
description: A token embedding table can also score output tokens. The shared dimensions save one vocabulary-sized matrix, while tying changes how every row learns.
pubDate: "2026-10-10T11:30:00Z"
section: models
tags:
  - embeddings
  - language-models
  - model-architecture
draft: false
heroImage: https://media.aitamer.news/heroes/tied-embeddings-reuse-one-matrix-in-two-directions-05da66ef.jpg
heroAlt: One cream paper comb serves a blue single-row ribbon on one side and several rust scoring ribbons on the other.
author: ari
wildness:
  rating: 1
  verified: Tying shares one vocabulary matrix for input lookup and output scoring; both roles contribute gradients.
  claimed: No universal quality, total-memory, or generation-speed benefit is claimed.
verdict: Tying removes one vocabulary-sized parameter matrix when dimensions and token IDs align, and it couples learning from lookup and scoring. Validate those constraints and the resulting quality.
sources:
  - title: Using the Output Embedding to Improve Language Models
    url: https://arxiv.org/abs/1608.05859
---

A model with 50,000 tokens and 1,024-dimensional embeddings needs 51.2 million values for one vocabulary matrix. If it stores a separate matrix of the same shape to score next tokens, those two matrices alone contain 102.4 million values. Tying them retains one 51.2-million-value matrix. That arithmetic explains the parameter saving; it says nothing by itself about total model size or generation speed.

The input use is a lookup. Let *E* have shape **vocabulary size × hidden width**. For token ID *i*, the model reads row *Eᵢ* as its vector. After the model computes a hidden state *h* with the same width, the output use is **logits = h Eᵀ**. Each logit is a dot product between *h* and one token's row. A softmax can turn those logits into next-token probabilities. [Press and Wolf's paper](https://arxiv.org/abs/1608.05859) describes this as sharing the input embedding and output embedding of a language model. The two uses face opposite directions: an ID selects a row on input, while a hidden vector is compared with all rows on output.

The shared shape is a real constraint. The output state must match the embedding width, or a projection must map it there first. Input and output token IDs must refer to the same vocabulary rows. In translation, tying a decoder's input and output matrices is a narrower choice than also tying an encoder matrix; the paper studies both. A system with different source and target vocabularies cannot simply assign identical row numbers and call them shared semantics.

The optimization effect is as important as the memory arithmetic. In an untied model, a lookup contributes an input-side gradient to rows used by the current context. With a full softmax, the output matrix receives a scoring gradient for every vocabulary row at each prediction. When tied, each shared row receives the sum of its applicable input and output gradients. The paper analyzes these update rules and finds that its tied language-model embeddings resemble the untied output embeddings more than the untied input embeddings. It reports improved perplexity in its tested language models, while its word2vec skip-gram experiment shows tying can be harmful in another objective. Sharing is therefore an architectural bias, not a free guarantee of quality.

For a transcript completion model or other text generator, first verify the tokenizer, hidden width, and checkpoint's intended weight sharing. Count the saved parameters against the entire model, including any output projection and optimizer state during training. Then compare task quality and memory use on the actual workload. One matrix in two roles can be a good economy, provided the model was trained and evaluated with that coupling.

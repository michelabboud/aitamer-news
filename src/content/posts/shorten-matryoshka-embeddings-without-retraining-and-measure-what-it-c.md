---
title: Shorten Matryoshka embeddings without retraining, and measure what it costs
description: Cut Matryoshka-trained embedding vectors to fewer dimensions, renormalize them, and measure the retrieval loss on your own queries before you commit.
pubDate: "2026-10-11T01:30:00Z"
section: models
tags:
  - embeddings
  - matryoshka
  - vector-search
  - retrieval
  - openai
  - sentence-transformers
draft: false
heroImage: https://media.aitamer.news/heroes/shorten-matryoshka-embeddings-without-retraining-and-measure-what-it-c-88fd209e.jpg
heroAlt: A layered paper vector is trimmed shorter beside scissors and a small ruler, illustrating dimension reduction and retrieval loss measurement.
author: quill
wildness:
  rating: 1
  verified: Paper, OpenAI guide and Sentence Transformers docs read; numbers quoted from them
  claimed: Benchmark retention figures are the sources' own results on MTEB and STSBenchmark
verdict: Truncating Matryoshka embeddings is a documented, supported way to save storage. Renormalize after the cut and measure recall on your own labelled queries; published benchmark numbers do not transfer to your domain.
sources:
  - title: Matryoshka Representation Learning (arXiv 2205.13147)
    url: https://arxiv.org/abs/2205.13147
  - title: "OpenAI API docs: Vector embeddings guide"
    url: https://developers.openai.com/api/docs/guides/embeddings
  - title: "Sentence Transformers: Matryoshka Embeddings"
    url: https://sbert.net/examples/sentence_transformer/training/matryoshka/README.html
---

Embedding vectors get expensive at scale. A 3072-dimension float32 vector takes 12 KB, and your vector index pays that for every chunk you store. If your model was trained the Matryoshka way, you can keep only the first part of each vector and throw the rest away. You don't have to retrain or fine-tune anything. The open question is how much retrieval quality the cut costs on your own data, and a short script can measure it.

## Why a prefix of the vector still works

The method comes from the paper [Matryoshka Representation Learning](https://arxiv.org/abs/2205.13147) (Kusupati et al., first posted May 2022). During training, the loss is computed on several nested prefixes of the same vector at once. The paper's ImageNet setup uses prefix sizes of 8, 16, 32 and so on up to 2048. For BERT-Base it uses 12, 24, 48, 96, 192, 384 and 768. Because every prefix is trained to stand on its own, the paper describes the first *m* dimensions as "an information-rich low-dimensional vector". It also reports that quality interpolates for sizes that fall between the trained ones.

The key detail: this property comes from training. Truncating a vector from a model that was never trained this way is a different experiment. The guarantees in the paper do not cover it.

## What the providers document

The [OpenAI embeddings guide](https://developers.openai.com/api/docs/guides/embeddings) says `text-embedding-3-small` returns 1536 dimensions and `text-embedding-3-large` returns 3072 by default. It says you can shorten them "without the embedding losing its concept-representing properties" by passing the `dimensions` parameter, and it calls that the suggested approach. The guide also cites one benchmark result: on MTEB, a `text-embedding-3-large` embedding shortened to 256 dimensions still outperforms an unshortened 1536-dimension `text-embedding-ada-002` embedding.

If you shorten vectors yourself, the same guide says you must normalize them again. Its example keeps the first 256 values and divides them by their L2 norm.

In Sentence Transformers, the [Matryoshka training page](https://sbert.net/examples/sentence_transformer/training/matryoshka/README.html) shows inference with `truncate_dim`. It loads `nomic-ai/nomic-embed-text-v1.5` at 64 dimensions. The same page reports that on the STSBenchmark test set, its Matryoshka model kept 98.37% of its performance at 8.3% of the embedding size, and the standard model it was compared with kept 96.46%. It also states the limit plainly: only processing and storing the resulting embeddings gets cheaper. The model itself runs at the same cost.

## The failure you will meet

You truncate stored vectors, keep your cosine or dot-product index, and the rankings look slightly off. The usual cause is that you skipped the renormalization step. A cut vector no longer has length 1. If your index uses inner product because the full vectors were unit length, the scores now depend on how much length each vector kept after the cut.

The second failure is mixing sizes. Every query and every document in one index must be cut to the same dimension, by the same method. The OpenAI guide shows truncate-then-normalize code, but it does not state that the `dimensions` parameter returns exactly the same numbers as doing that yourself. Re-embed everything one way, or check the outputs match before you mix them.

## Truncate and renormalize

If you kept the full vectors, you can shorten them locally without another API call:

```python
import numpy as np

def shorten(emb: np.ndarray, dim: int) -> np.ndarray:
    cut = emb[:, :dim]
    norms = np.linalg.norm(cut, axis=1, keepdims=True)
    return cut / np.clip(norms, 1e-12, None)
```

The clip keeps an all-zero row from dividing by zero. Renormalizing a vector that is already unit length leaves it unchanged, so this function is safe even if your library already normalizes after truncating. The Sentence Transformers API reference does not say in which order `truncate_dim` and `normalize_embeddings` are applied.

## Measure the cost on your own data

Benchmark numbers describe benchmark data. Your queries and your documents decide what you lose. Build a small labelled set: a few hundred real queries, each with the IDs of the documents that should come back. Then compare recall at several sizes:

```python
def recall_at_k(q, d, relevant, k=10):
    scores = q @ d.T  # unit-length rows, so this is cosine similarity
    top = np.argsort(-scores, axis=1)[:, :k]
    hits = [len(set(top[i]) & relevant[i]) / len(relevant[i])
            for i in range(len(q))]
    return float(np.mean(hits))

for dim in (3072, 1024, 512, 256):
    r = recall_at_k(shorten(Q, dim), shorten(D, dim), relevant)
    print(dim, round(r, 3))
```

Here `Q` and `D` are the full-length query and document embeddings, and `relevant` is a list of sets of document indices. This brute-force version suits an evaluation set of a few thousand documents. For a full corpus, use `np.argpartition` or your vector database.

If you have no labels yet, a weaker proxy still helps. For each query, compare the top 10 results at the short size with the top 10 at full size, and report the overlap. A drop in overlap shows that rankings moved. It does not show whether they got worse, so treat it as a screen and label a sample before you decide.

Pick the smallest size whose recall loss you can accept, and write the number down next to the model name. A model upgrade means you measure again.

## Where this advice stops

- It applies to models trained with a Matryoshka objective. Check the model card before you cut.
- The measurements above test exact search. An approximate index (HNSW, IVF) adds its own recall loss, so run the same check through your real index once you pick a size.
- Shorter vectors cut storage, memory and search cost. Embedding the text costs the same as before.
- The published numbers (MTEB for OpenAI, STSBenchmark for Sentence Transformers) are benchmark results. Neither source predicts the loss on your domain.

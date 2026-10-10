---
title: "A reranker reads the query and the document together: add a cross-encoder after retrieval"
description: Cross-encoders score a query and a document in one pass, which makes them more accurate than embedding search and too slow for a whole corpus. Use them to rerank the top hits.
pubDate: "2026-10-11T16:00:00Z"
section: models
tags:
  - rag
  - reranking
  - cross-encoder
  - sentence-transformers
  - search
draft: false
heroImage: https://media.aitamer.news/heroes/a-reranker-reads-the-query-and-the-document-together-add-a-cross-encod-dc01af57.jpg
heroAlt: A slate-blue frame pairs a query slip with one document, lifting it above a small shortlist of paper records.
author: quill
wildness:
  rating: 1
  verified: Docs give 65 hours vs 5 seconds for 10,000 sentences and the model speed and NDCG table
  claimed: Throughput figures come with no stated hardware
verdict: Retrieve about 100 hits with embeddings, then rerank them with a cross-encoder. It is the documented pattern and costs little, but it cannot recover passages that retrieval missed.
sources:
  - title: "Sentence Transformers: Cross-Encoder applications"
    url: https://sbert.net/examples/cross_encoder/applications/README.html
  - title: "Sentence Transformers: Retrieve & Re-Rank"
    url: https://sbert.net/examples/sentence_transformer/applications/retrieve_rerank/README.html
  - title: "Sentence Transformers: Pretrained Cross-Encoder models"
    url: https://sbert.net/docs/cross_encoder/pretrained_models.html
  - title: Sentence-BERT paper (arXiv 1908.10084) on Hugging Face Papers
    url: https://huggingface.co/papers/1908.10084
  - title: "Sentence Transformers: CrossEncoder API reference"
    url: https://sbert.net/docs/package_reference/cross_encoder/cross_encoder.html
  - title: "Sentence Transformers: util.retrieval API reference"
    url: https://sbert.net/docs/package_reference/util/retrieval.html
---

Embedding search is fast because every document becomes a vector once, ahead of time. The price is that the query and the document never meet inside the model. A reranker, built as a cross-encoder, reads both texts in a single pass. The Sentence Transformers documentation on [cross-encoder applications](https://sbert.net/examples/cross_encoder/applications/README.html) explains the difference and recommends combining the two approaches.

## Two ways to score a query against a document

A bi-encoder turns each text into an embedding on its own. The documentation says "Bi-Encoders produce for a given sentence a sentence embedding," and the two embeddings are compared with cosine similarity. Documents can be embedded once and indexed.

A cross-encoder takes the pair at once and returns a score. In the documentation's words, "A Cross-Encoder does not produce a sentence embedding," and you cannot pass it a single sentence.

The [retrieve and re-rank page](https://sbert.net/examples/sentence_transformer/applications/retrieve_rerank/README.html) gives the reason for the accuracy gap: cross-encoders "perform attention across the query and the document." Each token of the query can be weighed against each token of the document inside the model. For the claim that cross-encoders outperform bi-encoders, the documentation points to the [SBERT paper](https://huggingface.co/papers/1908.10084).

## Why it cannot score the whole corpus

Nothing can be computed ahead of time. The documentation notes that cross-encoders "do not produce embeddings we could e.g. index." Every new query needs a fresh model pass for every document it is scored against.

The documentation gives a clustering example. Clustering 10,000 sentences with a cross-encoder means scoring about 50 million pairs, which it says takes about 65 hours. Computing an embedding for each sentence with a bi-encoder takes about 5 seconds.

The [pretrained cross-encoder table](https://sbert.net/docs/cross_encoder/pretrained_models.html) lists `cross-encoder/ms-marco-MiniLM-L6-v2` at 1,800 documents per second. The page does not say which hardware produced that figure, so treat it as a relative number. At that rate, 100 candidates take about 56 ms per query. One million documents would take about 9 minutes per query.

## The pipeline: retrieve 100, rerank, keep 5

The retrieve and re-rank page describes the pattern. A fast retriever returns a list of, for example, 100 possible hits. The cross-encoder scores each (query, hit) pair, and the page's example shows the top 5 passages to the user.

```python
from sentence_transformers import SentenceTransformer, util
from sentence_transformers.cross_encoder import CrossEncoder

retriever = SentenceTransformer("sentence-transformers/multi-qa-mpnet-base-dot-v1")
reranker = CrossEncoder("cross-encoder/ms-marco-MiniLM-L6-v2")

corpus = ["..."]  # your passages
corpus_emb = retriever.encode(corpus, convert_to_tensor=True)  # once, offline

def search(query, n_candidates=100, n_final=5):
    q_emb = retriever.encode([query], convert_to_tensor=True)
    # the model name marks it as tuned for dot-product scores
    hits = util.semantic_search(q_emb, corpus_emb, top_k=n_candidates,
                                score_function=util.dot_score)[0]
    candidates = [corpus[h["corpus_id"]] for h in hits]
    ranked = reranker.rank(query, candidates, top_k=n_final)
    # corpus_id from rank() indexes candidates, not corpus
    return [(r["score"], candidates[r["corpus_id"]]) for r in ranked]
```

The [CrossEncoder API reference](https://sbert.net/docs/package_reference/cross_encoder/cross_encoder.html) describes the return value of `rank` as a sorted list with "corpus_id", "score", and optionally "text". That `corpus_id` is a position in the list you passed in. Using it as an index into the full corpus returns the wrong passages without any error. The [retrieval reference](https://sbert.net/docs/package_reference/util/retrieval.html) shows that `semantic_search` uses cosine similarity unless you pass another `score_function`, and returns its top 10 unless you set `top_k`.

## Choosing a reranker size

The pretrained table reports both quality and speed. Three rows show the shape of the trade-off:

| Model | NDCG@10 (TREC DL 19) | Docs / sec |
|---|---|---|
| ms-marco-TinyBERT-L2-v2 | 69.84 | 9000 |
| ms-marco-MiniLM-L6-v2 | 74.30 | 1800 |
| ms-marco-MiniLM-L12-v2 | 74.31 | 960 |

On these benchmarks, going from 6 to 12 layers roughly halves throughput for a 0.01 point gain. The benchmarks come from MS MARCO, which the documentation describes as "500k real user queries from Bing search engine." If your queries look different, such as code search or internal tickets, measure on a labelled sample of your own.

## Failures to plan for

- **The reranker only reorders what it receives.** If the relevant passage is not in the top 100 from retrieval, no reranker brings it back. Measure retrieval recall at your candidate count before you tune the reranker.
- **Raw scores are not a portable threshold.** Use them to order candidates. If you need a cut-off, such as dropping weak hits before they reach a language model, choose it from labelled examples, because the score range depends on the model and its activation setting.
- **Latency grows with the candidate count.** Each candidate costs one model pass per query. The candidate count is the knob that trades recall for speed.

## Where this advice stops applying

The documentation says cross-encoders "can be used whenever you have a pre-defined set of sentence pairs you want to score." If your corpus is a few hundred passages, you may be able to score every pair directly and skip retrieval; check the cost against the throughput table on your own hardware. The documentation uses 100 candidates as an example and gives no rule for picking the number, so tune it against your recall and latency targets.

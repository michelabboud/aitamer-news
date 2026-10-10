---
title: "HyDE: search with a model-written answer instead of the raw question"
description: HyDE embeds a passage a language model writes in answer to the query, then searches with it. How to build it, and where it stops helping.
pubDate: "2026-10-11T17:00:00Z"
section: models
tags:
  - retrieval
  - embeddings
  - rag
  - hyde
  - vector-search
draft: false
heroImage: https://media.aitamer.news/heroes/hyde-search-with-a-model-written-answer-instead-of-the-raw-question-9a8dc0a4.jpg
heroAlt: A folded paper passage bridges a query token to a stack of retrieved documents.
author: quill
wildness:
  rating: 2
  verified: All numbers, prompts and the averaging formula come from the paper's text and tables.
  claimed: "Paper: HyDE nears fine-tuned retrievers with no relevance labels; real-world latency unreported."
verdict: A cheap win for a new search system with no labeled data and a strong generator. Measure it against raw-query embeddings first, and skip it on top of a retriever already fine-tuned for your data.
sources:
  - title: Precise Zero-Shot Dense Retrieval without Relevance Labels (Gao, Ma, Lin, Callan, arXiv 2212.10496)
    url: https://arxiv.org/abs/2212.10496
  - title: "texttron/hyde: code for the HyDE paper"
    url: https://github.com/texttron/hyde
---

Dense retrieval compares a query vector with document vectors. That works when the encoder was trained on query and document pairs that look like yours. Without that training data, a question and the passage that answers it can land far apart in embedding space. A short question such as "how long does it take to remove a wisdom tooth" shares little wording or structure with a dental article that answers it.

HyDE, short for Hypothetical Document Embeddings, targets this gap. Luyu Gao, Xueguang Ma, Jimmy Lin and Jamie Callan proposed it in [Precise Zero-Shot Dense Retrieval without Relevance Labels](https://arxiv.org/abs/2212.10496), posted in December 2022. The idea: stop embedding the question. Ask a language model to write an answer, embed that answer, and search with it.

## How HyDE builds the query vector

1. Send the query to an instruction-following model with an instruction such as "write a passage that answers the question".
2. Embed the generated passage with the same encoder you used for the corpus.
3. Run a normal nearest-neighbor search with that vector and return the real documents it finds.

The paper is direct about the generated text: it "captures relevance patterns but is unreal and may contain false details." The authors describe the encoder as a lossy compressor. The expectation is that invented specifics get filtered out of the dense vector, and the search lands in the neighborhood of real documents that look like a good answer. No model is trained or fine-tuned.

Two details from the method section matter in code. First, the paper samples N hypothetical documents and averages their embeddings. Second, it also treats the original query as one more hypothesis, so the final vector is the mean of the N document vectors plus the query vector. The authors generated with InstructGPT (`text-davinci-003`) at a temperature of 0.7 and used Contriever as the encoder. Their code is in the [project's repository](https://github.com/texttron/hyde).

## A minimal implementation

The web search instruction below is copied from the paper's appendix. `generate` stands for any function that sends a prompt to your language model and returns text. `encoder` is a Sentence Transformers model, the same one that embedded your corpus.

```python
import numpy as np

PROMPT = "Please write a passage to answer the question\nQuestion: {q}\nPassage:"

def hyde_vector(query, generate, encoder, n=4):
    docs = [generate(PROMPT.format(q=query)) for _ in range(n)]
    vecs = encoder.encode(docs + [query], normalize_embeddings=True)
    return vecs.mean(axis=0)  # N documents plus the query, as in the paper

# corpus_vecs = encoder.encode(corpus, normalize_embeddings=True)
# scores = corpus_vecs @ hyde_vector(q, generate, encoder)
# top = np.argsort(-scores)[:10]
```

The paper does not tie its reported results to one value of N, so treat `n` as a setting to tune. Each extra sample is one more generation call before the search can start.

Match the instruction to your corpus. The appendix uses a different instruction per dataset: "Please write a scientific paper passage to support/refute the claim" for SciFact, "Please write a financial article passage to answer the question" for FiQA, and "Please write a counter argument for the passage" for ArguAna. The generated text should look like the documents you index.

## What the paper reports

On the TREC Deep Learning 2019 web search set, nDCG@10 rose from 44.5 with plain Contriever to 61.3 with HyDE. The fine-tuned ContrieverFT, trained on MS MARCO relevance labels, scored 62.1. On the 2020 set the numbers were 42.1, 57.9 and 63.2, so HyDE trailed the fine-tuned model there.

The low-resource BEIR results show the same pattern. On TREC-COVID, Contriever scored 27.3 nDCG@10, HyDE 59.3 and BM25 59.5. HyDE beat Contriever on all six BEIR datasets it tested. The authors also report gains over mContriever in Swahili, Korean, Japanese and Bengali.

## Where it stops helping

**You already have a retriever fine-tuned for your data.** The authors call HyDE with a fine-tuned encoder "not the intended usage". With ContrieverFT, a FLAN-T5 generator lowered DL19 nDCG@10 from 62.1 to 60.2. The GPT generator raised it to 67.4. A weak generator can cost you accuracy on top of a strong encoder.

**The generator is small or weak.** With the plain Contriever encoder on DL19, FLAN-T5 (11B parameters) reached 48.9, a 52B Cohere model reached 53.8, and the 175B GPT model reached 61.3. Larger generators gave larger gains in these tests.

**The domain or language is thin in the generator's training.** ContrieverFT stayed ahead on FiQA (financial posts) and DBPedia (entities). The authors attribute this to under-specified instructions and suggest more elaborate ones. In the multilingual tests HyDE stayed below the fine-tuned mContrieverFT, which the authors attribute to those languages being under-trained.

**The query is ambiguous.** The averaging step assumes the query has one meaning. The paper leaves ambiguous queries and diversity to future work. A query like "python" may produce passages about the language and the snake, and their average may sit near neither.

**Latency and cost matter.** Every query now waits on at least one generation call. The paper reports no latency or cost figures, so measure them on your own stack.

## How to adopt it

Build a small evaluation set of real queries with known relevant documents. Compare recall@k for raw-query embeddings and HyDE vectors on your own corpus before you ship.

The paper ends with a deployment pattern worth copying. Use HyDE when a search system is new and has no relevance data. As search logs grow, train a supervised dense retriever and route more queries to it, leaving less common and emerging queries to the HyDE path.

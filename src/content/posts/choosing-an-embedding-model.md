---
title: "How to choose an embedding model for your search system"
description: "Compare hosted APIs with models you run yourself, then choose dimensions, language and context length against your own retrieval workload."
pubDate: "2026-09-29T13:00:00Z"
specimen: 50
section: "dev"
tags: ["embeddings", "semantic-search", "retrieval", "mteb", "multilingual-ai"]
draft: false
heroImage: "https://media.aitamer.news/heroes/choosing-an-embedding-model.jpg"
heroAlt: "A paper-cut collage of a cream text sheet branching toward a compact stack and a larger slate-blue field of vector dots, with one coral path linking them."
author: "ari"
sources:
  - title: "Vector embeddings | OpenAI API"
    url: "https://developers.openai.com/api/docs/guides/embeddings"
  - title: "Cohere’s Embed Models (Details and Application)"
    url: "https://docs.cohere.com/docs/cohere-embed"
  - title: "intfloat/multilingual-e5-large model card"
    url: "https://huggingface.co/intfloat/multilingual-e5-large"
  - title: "MTEB: Massive Text Embedding Benchmark"
    url: "https://arxiv.org/abs/2210.07316"
  - title: "MTEB Leaderboard models"
    url: "https://leaderboard.mteb.org/models"
  - title: "Matryoshka Representation Learning"
    url: "https://arxiv.org/abs/2205.13147"
  - title: "Production checklist | Pinecone Docs"
    url: "https://docs.pinecone.io/guides/production/production-checklist"
  - title: "Increase search relevance | Pinecone Docs"
    url: "https://docs.pinecone.io/guides/optimize/increase-relevance"
  - title: "Chunking Strategies for LLM Applications | Pinecone"
    url: "https://www.pinecone.io/learn/chunking-strategies/"
  - title: "Cross-validation: evaluating estimator performance | scikit-learn"
    url: "https://scikit-learn.org/stable/modules/cross_validation.html"
wildness:
  rating: 3
  verified: "Published specifications and benchmark scope checked in primary sources."
  claimed: "Model limits are vendor-reported; performance on this workload needs local testing."
verdict: "Shortlist models by fit, then let a labeled sample of your own queries decide."
---

Choosing an embedding model is a retrieval decision with operating consequences. The model [turns text into a list of numbers, or vector](https://developers.openai.com/api/docs/guides/embeddings), so that a search system can find passages with related meaning. The right choice depends on what your users ask, what your documents contain, and where you want inference to run.

Start with a small shortlist. Compare a hosted application programming interface (API) with a model whose weights you can run, then [test both using the same queries, corpus, chunking and search settings](https://docs.pinecone.io/guides/production/production-checklist). A leaderboard can help find candidates. It cannot choose for your product.

## Choose where inference runs

A hosted API lets you send text to a provider and receive vectors without deploying the model yourself. For example, [OpenAI’s embedding guide](https://developers.openai.com/api/docs/guides/embeddings) documents an API that returns vectors. As of September 2026, it lists 1,536 dimensions by default for `text-embedding-3-small`, 3,072 for `text-embedding-3-large`, and an 8,192-token maximum input for both. These details can change, so verify the model documentation when you make a decision.

With an API, account for request charges, network latency, rate limits, and the provider’s rules for handling submitted data. Those are operational dependencies to investigate for the service you select; a model page alone does not settle your organization’s privacy or availability requirements. Hosted inference can still be the simplest choice when your team wants to avoid serving a model.

Running a model yourself gives you control over deployment and lets you avoid sending each embedding request to a model API. It also makes your team responsible for downloading and serving the model, allocating compute, scaling requests, and upgrading it. The [MTEB model directory](https://leaderboard.mteb.org/models) tracks open weights, licenses, training code and training data separately. Check the specific model’s license and available disclosures before adopting it.

The [multilingual E5-large model card](https://huggingface.co/intfloat/multilingual-e5-large) is one concrete self-hosted candidate. Its page provides model files and describes a 1,024-value embedding and truncation of input beyond 512 tokens. It also says retrieval inputs should use `query:` and `passage:` prefixes. The example is useful because it shows why the model’s instructions and limits matter as much as a headline score.

## Estimate the storage cost of dimensions

An embedding’s dimension is the number of values in its vector. [More dimensions require more resources](https://docs.pinecone.io/guides/production/production-checklist). A simple estimate makes the impact visible: with 32-bit floating-point values, one vector uses 4 bytes per dimension. At that assumption, 1,024 dimensions take about 4 kilobytes per vector, and 3,072 dimensions take about 12 kilobytes. One million vectors would therefore take roughly 4 or 12 gigabytes for the raw values alone.

That estimate excludes identifiers, metadata, database indexes, replicas and other overhead, so treat it as a lower bound, not a capacity plan. Ask whether a candidate supports smaller output vectors. OpenAI documents a `dimensions` option for its third-generation models. [Cohere’s model documentation](https://docs.cohere.com/docs/cohere-embed) lists `embed-v4.0` outputs of 256, 512, 1,024 or 1,536 dimensions, plus a 128,000-token context limit, as of September 2026. A smaller vector can reduce storage, but you still need to measure whether it preserves retrieval quality for your workload.

## Match language and context to real inputs

“Multilingual” is not a single performance guarantee. The [multilingual E5-large card](https://huggingface.co/intfloat/multilingual-e5-large) says low-resource languages may see degraded performance despite the model's broad language support. Confirm the languages and cross-language search patterns you actually need, then include examples of each in evaluation.

Context length is the maximum input the model can process in one pass. It does not say how much text should go into a single document vector. [Pinecone notes](https://www.pinecone.io/learn/chunking-strategies/) that larger chunks can dilute the significance of individual passages, while chunks that are too small can lack useful context. Compare chunk sizes and overlap on representative files. Check truncation behavior: the E5-large card says input beyond 512 tokens is truncated, while Cohere lists 128k tokens for Embed v4. Those published limits do not tell you the best chunk size.

## Use Matryoshka dimensions with care

Matryoshka Representation Learning is a training method that arranges information so a vector’s early dimensions remain useful when the vector is shortened. The [original paper](https://arxiv.org/abs/2205.13147) describes representations that adapt to downstream compute constraints. Some models expose selected shorter dimensions, making it possible to trade vector storage and comparison cost against quality.

The [paper](https://arxiv.org/abs/2205.13147) notes that standard fixed representations tend to spread information across dimensions, so shortening them can lose accuracy. Follow the model’s documented dimension options and compare each setting on your own retrieval examples. Also make sure your database uses the chosen dimensionality consistently for both indexed documents and incoming queries.

## Use MTEB to shortlist models

The [Massive Text Embedding Benchmark (MTEB) paper](https://arxiv.org/abs/2210.07316) introduced a broad evaluation across embedding tasks and datasets. Its key finding is useful to practitioners: no one method dominated every task. A model’s score for semantic similarity does not automatically predict its results on retrieval or clustering tasks.

The [MTEB leaderboard](https://leaderboard.mteb.org/models) now lets readers inspect models and compare details such as dimensions, maximum context and whether weights, licenses, training code or data are available. Use it to filter candidates and inspect the task results closest to yours. A combined score compresses different datasets, languages and task types into one number; your traffic may look little like that mix. Benchmark entries also do not include your latency, hosting cost, privacy requirements, chunking or search filters.

## Test the system you plan to ship

Build an evaluation set from real, permitted queries and documents. Include the queries users phrase awkwardly, exact identifiers, language variants, and cases where similar-sounding passages are wrong. Have a knowledgeable reviewer mark which passages count as useful results. [Hold a portion of this set aside](https://scikit-learn.org/stable/modules/cross_validation.html) while tuning, so you can assess the final choice on examples that did not guide it.

For each model, embed the same corpus and queries according to its instructions. Measure whether relevant passages appear near the top, and inspect misses instead of relying on one aggregate metric. Also measure end-to-end latency and resource use with your intended serving path. If your product needs exact names or codes, [compare semantic search with keyword search or a combination of both](https://docs.pinecone.io/guides/optimize/increase-relevance).

Choose the smallest, simplest candidate that meets your retrieval target across the important languages and query types, while fitting your operating constraints. If no candidate does, improve chunking or retrieval design before assuming that a larger model will fix every miss. Keep the evaluation set: it becomes the evidence for your next model decision.

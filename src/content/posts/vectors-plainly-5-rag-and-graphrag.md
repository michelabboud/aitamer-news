---
title: "Vectors, Plainly, part 5: RAG end to end, GraphRAG, and graphs beside vectors"
description: "Retrieval-augmented generation is an architecture, and the vector database is one box in it. The whole loop, the RAG variants worth knowing, reranking, and when a knowledge graph beats similarity."
pubDate: 2026-10-02T09:00:00Z
specimen: 43
section: dev
tags:
  - vectors-plainly
  - rag
  - graphrag
  - reranking
  - knowledge-graphs
draft: false
heroImage: /heroes/vectors-plainly-5-rag-and-graphrag.jpg
heroAlt: "A paper-cut collage: on a slate-blue field of paper dots, coral threads link several dots into a small network and lead to an open cream paper book whose blank pages glow softly."
author: quill
sources:
  - title: "Retrieval-Augmented Generation for Knowledge-Intensive NLP Tasks (Lewis et al., 2020)"
    url: https://arxiv.org/abs/2005.11401
  - title: "Precise Zero-Shot Dense Retrieval without Relevance Labels (HyDE, Gao et al., 2022)"
    url: https://arxiv.org/abs/2212.10496
  - title: "Self-RAG (Asai et al., 2023)"
    url: https://arxiv.org/abs/2310.11511
  - title: "Corrective Retrieval Augmented Generation (Yan et al., 2024)"
    url: https://arxiv.org/abs/2401.15884
  - title: "Lost in the Middle: How Language Models Use Long Contexts (Liu et al., 2023)"
    url: https://arxiv.org/abs/2307.03172
  - title: "Sentence-BERT (Reimers and Gurevych, 2019)"
    url: https://arxiv.org/abs/1908.10084
  - title: "ColBERT: Efficient and Effective Passage Search via Contextualized Late Interaction over BERT (Khattab and Zaharia, 2020)"
    url: https://arxiv.org/abs/2004.12832
  - title: "BEIR (Thakur et al., 2021)"
    url: https://arxiv.org/abs/2104.08663
  - title: "From Local to Global: A Graph RAG Approach to Query-Focused Summarization (Edge et al., 2024)"
    url: https://arxiv.org/abs/2404.16130
  - title: "Microsoft GraphRAG documentation"
    url: https://microsoft.github.io/graphrag/
  - title: "microsoft/graphrag README"
    url: https://github.com/microsoft/graphrag
  - title: "Microsoft Research: LazyGraphRAG"
    url: https://www.microsoft.com/en-us/research/blog/lazygraphrag-setting-a-new-standard-for-quality-and-cost/
  - title: "Cohere: Rerank v4.0 changelog"
    url: https://docs.cohere.com/changelog/rerank-v4.0
wildness:
  rating: 2
  verified: "Methods and quoted results come from the papers and project docs cited."
  claimed: "Each method's gains are its authors' own benchmark results."
verdict: "Most RAG failures are retrieval failures, and most retrieval failures sit outside the vector database. Add reranking before anything fancier, and GraphRAG only when questions are about relationships."
---

*Part 5 of 6 in **Vectors, Plainly**. Earlier: [part 1, what a vector database does](/posts/vectors-plainly-1-what-a-vector-database-is/); [part 2, inside the index](/posts/vectors-plainly-2-inside-the-index/); [part 3, multi-tenancy](/posts/vectors-plainly-3-multi-tenancy/); [part 4, retrieval quality](/posts/vectors-plainly-4-retrieval-quality/).*

Retrieval-augmented generation (RAG) is the reason most teams meet a vector database at all. It is worth seeing the whole loop once, because RAG is an architecture pattern, not a product, and the vector database is exactly one of its boxes. When "RAG isn't working", the fault is usually in one of the other boxes.

## The loop

The term comes from [Lewis et al. (2020)](https://arxiv.org/abs/2005.11401), who combined "pre-trained parametric and non-parametric memory": a language model, plus "a dense vector index of Wikipedia, accessed with a pre-trained neural retriever". Today's systems keep that shape.

![Offline, sources are parsed, chunked, embedded and upserted with metadata. On each request the question is embedded, searched with filters, reranked, and the top chunks go into a prompt from which a model writes an answer with citations.](/diagrams/vectors-plainly-5-rag-and-graphrag/rag-loop.svg)

**Ingestion** runs offline and whenever sources change: fetch documents, parse them (PDF and HTML extraction is where many projects quietly lose tables and headings), chunk them, embed each chunk, and upsert vectors with the chunk text and metadata. **Query** runs on every request: embed the question with the same model, search with the tenant and other filters, rerank the shortlist, assemble a prompt with the best chunks and their sources, and let the language model answer with citations.

The vector database does the "search with filters" box, and nothing else. Parsing, chunking, the embedding model, the reranker, the prompt and the generator are separate, swappable components, and each can sink the result.

## The variants worth knowing

| Variant | How it works | Trade-off against naive RAG |
|---|---|---|
| **Naive (single-shot)** | Embed the question, take the top k, put them in the prompt, generate | Cheapest; weak on multi-part or ambiguous questions |
| **Hybrid** | Dense and keyword search, fused (part 2) | Recovers IDs, names and codes; one more search per query |
| **Iterative, multi-hop** | Retrieve, let the model decide it needs more, reformulate, retrieve again | Handles compositional questions; more latency and model calls |
| **Agentic** | An agent chooses whether and where to retrieve (vector search, SQL, web) and combines tools | Most flexible and most expensive; needs limits on runaway loops |
| **HyDE** | The model drafts a hypothetical answer; that is embedded and searched instead of the question | Bridges question wording and answer wording; one extra model call first |
| **Self-RAG, corrective RAG** | The system judges its retrieved context and re-retrieves or abstains | Fewer answers built on bad context; adds a judgement step with its own errors |
| **GraphRAG** | Vector search plus traversal of an extracted knowledge graph | Strong on relationship questions; costly to build and keep current |
| **Long context, no retrieval** | Put the whole corpus, or a big slice, into the model's context window | No retrieval misses, but cost grows with every token, and long-context recall degrades |

A few of these come with papers worth reading. [HyDE (Gao et al., 2022)](https://arxiv.org/abs/2212.10496) reported that embedding a generated hypothetical document "significantly outperforms" the unsupervised dense retriever Contriever. [Self-RAG (Asai et al., 2023)](https://arxiv.org/abs/2310.11511) trains a model to decide when to retrieve and to critique what it retrieved. [Corrective RAG (Yan et al., 2024)](https://arxiv.org/abs/2401.15884) adds "a lightweight retrieval evaluator" that grades the retrieved documents before generation.

The long-context row deserves its own warning. [Liu et al. (2023)](https://arxiv.org/abs/2307.03172) found that models do best when the relevant information sits at the beginning or end of the input and "significantly degrade" when it sits in the middle. A bigger window is a complement to retrieval, not a replacement, once a corpus outgrows a single prompt.

## Ranking and re-ranking are two different jobs

**Ranking** is the first pass. The index orders candidates by vector distance, or by a fused dense and keyword score, computed for each document independently of the query. That independence is what makes it fast: document vectors are computed once, at ingestion. [Sentence-BERT](https://arxiv.org/abs/1908.10084) quantified the difference on the pair-finding task: about 65 hours when a BERT model reads every pair of 10,000 sentences together, about 5 seconds with independently computed embeddings.

**Re-ranking** is a deliberately expensive second pass over the shortlist only. A **cross-encoder** reads the query and one candidate together and outputs a relevance score, so it sees how the words of the two interact, which a pair of separate vectors cannot capture.

![A bi-encoder embeds the query and each document separately and compares them with cosine similarity; a cross-encoder reads the query and one document together and outputs a relevance score, one model call per candidate.](/diagrams/vectors-plainly-5-rag-and-graphrag/bi-vs-cross.svg)

Between the two sits **late interaction**. [ColBERT (Khattab and Zaharia, 2020)](https://arxiv.org/abs/2004.12832) keeps one vector per token instead of one per document and matches token against token at query time. Its authors report it runs "two orders-of-magnitude faster" than a BERT cross-encoder with "four orders-of-magnitude fewer FLOPs per query", at the price of storing far more vectors.

The evidence for reranking is consistent. [BEIR](https://arxiv.org/abs/2104.08663) found that reranking and late-interaction models achieved "the best zero-shot performances" on average, "however, at high computational costs". Commercial rerankers keep moving: Cohere's current generation is [Rerank v4.0](https://docs.cohere.com/changelog/rerank-v4.0), in "pro" and "fast" versions. Open cross-encoders exist in several sizes, and a language model can serve as a reranker when volume is low.

The working rule: cast a wide net cheaply (a first pass of 50 to 100 candidates), then spend the expensive model narrowing it to the 3 to 10 chunks the prompt will carry. If you add one thing to a naive RAG system, make it this.

## Where the time goes

A well-tuned vector search is rarely the slow part of a RAG request. Generation usually is: the language model reads the assembled prompt and writes the answer, and that cost grows with both. So optimise retrieval for quality first, measured as in part 4, and optimise generation for latency: keep the retrieved context to what is relevant, stream the response, cache repeated prompt prefixes, and send simple questions to smaller models. Part 6 breaks the pipeline down by hardware.

## GraphRAG: when the question is about relationships

Plain RAG retrieves passages that sound like the question. It struggles when the answer requires walking relationships: "which vendors used by our EU subsidiaries had a security incident this year?" No single passage sounds like that question. The answer is a path: subsidiary, to vendor, to incident.

**GraphRAG** adds a knowledge graph of entities and relationships extracted from the same corpus, so retrieval can follow edges as well as distances.

![A question goes two ways: a vector search finds passages that sound like it, and a graph traversal follows subsidiaries to a vendor to an incident. Both results merge into the context given to the model.](/diagrams/vectors-plainly-5-rag-and-graphrag/graphrag.svg)

Microsoft's version, described in [Edge et al. (2024)](https://arxiv.org/abs/2404.16130), popularised the pattern. Per the [project docs](https://microsoft.github.io/graphrag/), indexing slices the corpus into text units, uses a language model to "extract all entities, relationships, and key claims", clusters the graph hierarchically with the Leiden algorithm, and generates summaries of each community "from the bottom-up". Queries then run in several modes: **global search** answers broad questions about the whole corpus from community summaries; **local search** starts from entities in the question and expands to their neighbours; **DRIFT search** mixes the two; and **basic search** is plain vector retrieval.

The cost is in the indexing. The [project README](https://github.com/microsoft/graphrag) warns that "GraphRAG indexing can be an expensive operation" and advises starting small: you are running a language model over the entire corpus, and keeping a second store in sync with the first. Microsoft Research's follow-up, [LazyGraphRAG](https://www.microsoft.com/en-us/research/blog/lazygraphrag-setting-a-new-standard-for-quality-and-cost/), defers most of that work to query time and reports indexing costs "identical to vector RAG and 0.1% of the costs of full GraphRAG".

GraphRAG earns its keep on relationship-heavy, multi-hop questions and on "what are the main themes across everything" questions. For finding the paragraph that answers a direct question, plain hybrid RAG with reranking is cheaper and usually as good.

## Three different things called "graph"

"Graph" appears around vector databases in three unrelated senses, and conflating them causes real confusion.

![Left: an HNSW index is a graph whose edges only mean two vectors are close. Middle: a knowledge graph beside the vector store, whose edges are facts between entities. Right: one engine that stores both vectors and graph edges.](/diagrams/vectors-plainly-5-rag-and-graphrag/three-graphs.svg)

1. **The index is a graph.** HNSW (part 2) is a proximity graph. Its edges mean "these two vectors are close" and nothing more. Every HNSW-based vector database "has a graph" in this sense.
2. **A knowledge graph beside it.** GraphRAG's graph: entities and relationships extracted from documents, stored in a graph database, and traversed to answer relational questions. Its edges are facts.
3. **One engine for both.** Some databases store vectors and graph edges together, so a single query can combine "similar to" with "connected to": graph databases that added vector indexes, and multi-model databases. The payoff is one query and one system; the cost is that each half is usually less mature than a specialist.

For most teams the pragmatic default is to compose: a vector database for similarity, a graph database added only once real multi-hop questions appear, joined in the application or orchestration layer. A single engine makes sense when running two systems costs more than the maturity you give up.

## Where RAG specifically is the right shape

- **Internal knowledge assistants** over policies, wikis and tickets that change too often to train into a model.
- **Support copilots** grounded in product docs and resolved tickets, citing their sources.
- **Legal and compliance research**, where answers must quote the exact clause they rest on.
- **Code assistants over a private codebase**, retrieving the files that matter instead of relying on what the model saw in training.
- **Anything after the model's knowledge cutoff**, refreshed by re-indexing instead of retraining.
- **Personal assistants over one user's data** (mail, notes, documents), where the corpus is unique per user and could never live in model weights. Part 3's per-tenant isolation applies here with full force.

---

**Next: part 6 of 6, "Production": sharding and freshness, memory and disk-based indexes, where a GPU is worth it, security and compliance, and where to go next. It publishes tomorrow, 3 October.**

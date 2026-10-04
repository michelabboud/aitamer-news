---
title: "Chunking for retrieval: how big a piece should the retriever read"
description: Chunk size, overlap and boundaries decide what a retriever can return. This post covers defaults documented by Azure AI Search and OpenAI, plus a way to test a setting on your own questions.
pubDate: "2026-10-04T15:00:00Z"
specimen: 226
section: dev
tags:
  - rag
  - chunking
  - retrieval
  - embeddings
  - vector-search
draft: false
heroImage: https://media.aitamer.news/heroes/chunking-for-retrieval-how-big-a-piece-should-the-retriever-read-b5fdee82.jpg
heroAlt: A long paper document becomes smaller stacks, with a lamp highlighting one selected piece.
author: quill
wildness:
  rating: 2
  verified: Defaults, limits and chunk counts read on four vendor pages
  claimed: No page names one best chunk size; results depend on the data
verdict: Pick a documented starting size, split on structure, add context to each chunk, then let a small set of real questions decide the final size and overlap. No vendor page names one best value.
sources:
  - title: Chunk Documents - Azure AI Search (Microsoft Learn)
    url: https://learn.microsoft.com/en-us/azure/search/vector-search-how-to-chunk-documents
  - title: Introducing Contextual Retrieval (Anthropic)
    url: https://www.anthropic.com/news/contextual-retrieval
  - title: "Create vector store file: chunking_strategy (OpenAI API reference)"
    url: https://developers.openai.com/api/reference/resources/vector_stores/subresources/files/methods/create
  - title: Splitting recursively (LangChain docs)
    url: https://docs.langchain.com/oss/python/integrations/splitters/recursive_text_splitter
---

## What chunking decides

In a common embedding-based retrieval pipeline, a splitter cuts documents into chunks before indexing. Each chunk gets an embedding, and a query retrieves the closest chunks. Other retrieval designs can use whole documents or keyword matching. The cut points set what the retriever can ever return.

Two failures follow. If an answer is split across two chunks, neither chunk may rank well. If one chunk covers many topics, its single vector describes none of them well. The [Azure AI Search chunking guide](https://learn.microsoft.com/en-us/azure/search/vector-search-how-to-chunk-documents) makes the second point. It says chunking is required only when a document exceeds a model's input size, and that it also helps when content is poorly represented as one vector. Its example is a wiki page with many sub-topics. The page may fit the limit, yet finer chunks can give better results.

## One hard limit and one soft limit

The hard limit is the model's input size. The Azure guide gives text-embedding-3-small a maximum of 8,191 tokens, which it equates to around 6,000 words. Text past the limit is lost to truncation.

The soft limit is quality. The same guide says larger chunks and variable chunking that keeps sentence structure intact can produce better results when you need intact text or passages. Smaller chunks suit pages with many sub-topics. No formula sits between these. The guide says the best parameters depend on how the chunks are used.

## Defaults that vendors document

The sources do not agree on one size. Here is what each page states.

- Azure, general guidance for fixed-size chunks: start with 512 tokens (about 2,000 characters) and 25% overlap, which is 128 tokens.
- Azure Text Split skill: for most applications, start with pages of 2,000 characters and an overlap of 500 characters.
- Azure, earlier in the same guide: a fixed size such as 200 words or 600 characters, with 10 to 15 percent overlap, can produce good chunks.
- OpenAI vector stores: the automatic strategy uses a maximum of 800 tokens per chunk and 400 tokens of overlap. A custom static strategy accepts 100 to 4,096 tokens per chunk. The [OpenAI reference](https://developers.openai.com/api/reference/resources/vector_stores/subresources/files/methods/create) also says overlap must not exceed half of the chunk size.

Treat these as starting points. They come from different tools with different units.

## Overlap costs storage

Overlap repeats text at the edge of neighbouring chunks, so a sentence cut at the boundary still appears whole in one of them. The Azure guide says the best amount varies. Highly structured data may need less. Conversational or narrative text may need more.

The price is a larger index. Azure shows chunk counts for one document, NASA's Earth at Night e-book. With 1,000-character pages, zero overlap gives 172 chunks and 200 characters of overlap gives 216. With 2,000-character pages, zero overlap gives 85 chunks and 500 characters of overlap gives 113. By simple arithmetic on that table, overlap added about 26% and 33% more chunks. That is one document, so use it as an illustration only.

The guide adds a warning. On a document with short pages, an overlap value that is too large can result in no overlap appearing at all.

## Boundaries matter as much as size

A fixed cut can land mid-sentence. Splitters reduce this by trying natural break points first. LangChain's [recursive splitter](https://docs.langchain.com/oss/python/integrations/splitters/recursive_text_splitter) tries a list of separators in order until chunks are small enough. The default list is paragraph break, line break, space, then empty string. The page says the effect is to keep paragraphs together, then sentences, then words.

The same page says chunk size is set by a length function, and its example counts characters. Azure's page points out that characters do not align to tokens, so the token count a model sees can differ from the character count the splitter used. Azure's Text Split skill avoids breaking sentences, so actual chunk length varies with the content. Azure also notes that HTML and Markdown headings can be used to split by section.

## A chunk can lose its subject

Anthropic's [Contextual Retrieval post](https://www.anthropic.com/news/contextual-retrieval) gives a plain example. A chunk reads that a company's revenue grew by 3% over the previous quarter. It names no company and no period. Read alone, it is hard to retrieve and hard to use.

The post describes adding context to each chunk before embedding. In the tests it reports, the top-20-chunk retrieval failure rate fell from 5.7% to 3.7% with contextual embeddings. It fell to 2.9% when combined with BM25, and to 1.9% when reranking was added. These are the post's own results on its own test sets. The post also says chunk size, chunk boundary and chunk overlap can affect performance, and that passing 20 chunks to the model did better than 5 or 10 in its tests.

Azure suggests a similar idea. For a long document split into variable-sized chunks, append the document title to chunks from the middle to prevent context loss.

## What to do

1. Look up your embedding model's input limit. Measure chunk length in tokens, not only characters. Count tokens over your own documents first, as the Azure LangChain example does.
2. Start from a documented default. Use 512 tokens with 25% overlap, or your platform's own default such as 800 tokens with 400 overlap on OpenAI vector stores.
3. Split on structure first. Use headings, paragraphs and sentences, and fall back to a fixed length only when a section is too long.
4. Keep overlap below half the chunk size. Check how much it grows your chunk count.
5. Put the document title and section heading into each chunk, so a chunk from the middle still names its subject.
6. Write a representative set of real questions, each with the passage that answers it. For each chunk setting, count how often that passage appears in the top results.
7. Change one setting at a time. If chunks get smaller, raise the number of chunks you retrieve and test again.
8. Re-run the question set whenever the document types or the embedding model change.

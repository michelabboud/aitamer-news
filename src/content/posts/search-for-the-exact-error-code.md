---
title: Search for the Exact Error Code
description: An error identifier deserves a literal search path. SQLite FTS5 can find token and prefix matches, rank the results, and leave strict spelling checks to the stored field.
pubDate: "2026-10-05T17:00:00Z"
specimen: 275
section: dev
tags:
  - sqlite
  - fts5
  - search
  - error-codes
draft: false
heroImage: https://media.aitamer.news/heroes/search-for-the-exact-error-code-fdce6c43.jpg
heroAlt: A magnifying glass isolates one warning symbol from many similar error documents.
author: ari
wildness:
  rating: 2
  verified: SQLite documents tokenizers, prefix indexes, and BM25 ranking in FTS5.
  claimed: Literal code search can recover identifiers a semantic-only path may miss.
verdict: Use FTS5 for code and prefix candidates, rank them, then check the stored identifier when exact spelling matters.
sources:
  - title: SQLite FTS5 Extension
    url: https://www.sqlite.org/fts5.html
  - title: "Salient Phrase Aware Dense Retrieval: Can a Dense Retriever Imitate a Sparse One?"
    url: https://aclanthology.org/2022.findings-emnlp.19/
---

A log line ends with `ERR42A`. A search for “login timeout” may lead to useful background, yet the code is a stronger clue when the task is to find the incident that mentions that code. A result about the same kind of failure cannot establish that it contains the identifier.

Research on dense retrieval found weaker matching of salient phrases and rare entities than sparse retrieval in the settings it studied. It did not test error codes. The practical inference is to give literal identifiers their own search path alongside searches for broader meaning. [Read the retrieval study](https://aclanthology.org/2022.findings-emnlp.19/).

## Tokens decide what can be found

SQLite's full-text search extension, FTS5, builds an index of tokens from selected text columns. A `MATCH` query looks for those tokens, and phrases require tokens in order. The tokenizer therefore defines what “exact” means to the index. [SQLite documents the query syntax and tokenizers](https://www.sqlite.org/fts5.html).

The default `unicode61` tokenizer treats letters and numbers as token characters. Spaces and punctuation are separators. It also folds case and usually removes Latin diacritics. Under those rules, `ERR-42` becomes a sequence of tokens rather than one indivisible code. An FTS phrase for `"ERR-42"` can match the same token sequence written as `ERR 42`. Quoting a phrase preserves token order; it does not preserve punctuation.

This matters for issue keys, exception names, paths, and IDs. Before designing a query, write down the identifier formats users actually paste. Decide whether a hyphen or underscore belongs inside a token. The `unicode61` tokenizer has a `tokenchars` option for characters that should remain part of tokens. SQLite's example adds hyphens and underscores. Keep that choice consistent when indexing and querying. [The tokenizer options are documented here](https://www.sqlite.org/fts5.html).

## Build a literal search lane

Suppose an incident record has a code, title, and body. This FTS5 table indexes those fields and adds a prefix index for five-character code prefixes:

```sql
CREATE VIRTUAL TABLE incidents USING fts5(
  code,
  title,
  body,
  prefix='5'
);
```

A search confined to the code column can use a column filter:

```sql
SELECT code, title
FROM incidents
WHERE incidents MATCH 'code : ERR42A'
ORDER BY rank;
```

SQLite supports column filters such as `code : ERR42A`. Without one, a matching token in any indexed column can admit a row. That distinction matters when a code also appears in prose. The `rank` column sorts full-text matches by SQLite's default ranking function, so this query puts stronger matches first. [See FTS5 column filters and sorting](https://www.sqlite.org/fts5.html).

For a user supplied string, build the FTS query carefully and pass it as a SQL parameter. FTS5 has its own query syntax. Punctuation in an unquoted search expression may be interpreted as syntax or rejected. Double quotes create an FTS string; embedded double quotes must be doubled. The SQL parameter carries that complete FTS expression. [SQLite specifies both quoting and `MATCH` forms](https://www.sqlite.org/fts5.html).

## Prefixes recover incomplete codes

Users often have only the start of an identifier. In FTS5, an asterisk after a string marks its final token as a prefix. A query for `code : ERR42*` can find code tokens beginning with `ERR42`. The asterisk must sit outside a quoted FTS string. Putting it inside the quotes sends it to the tokenizer, where it may lose its prefix meaning. [SQLite shows both forms in its prefix query examples](https://www.sqlite.org/fts5.html).

A prefix query works without a dedicated prefix index. SQLite says that path may require a range scan over indexed tokens. The `prefix` table option creates additional indexes for chosen prefix lengths. The example's `5` index is suited to `ERR42*`. Choose lengths from the prefixes people actually enter, then weigh the extra index storage against query speed. An index for a chosen length does not turn every other prefix length into that indexed lookup. [See SQLite's prefix index explanation](https://www.sqlite.org/fts5.html).

## Ranking orders candidates

A literal hit can still occur in many records. FTS5 supplies `bm25()` to order matching rows. In SQLite's implementation, a better match has a numerically lower score, so ascending order is intentional. The hidden `rank` column uses `bm25()` by default for full-text queries. [SQLite explains its scoring and rank column](https://www.sqlite.org/fts5.html).

Column weights let a hit in the code field count more than a hit buried in the body. For a query across all columns, with code, title, body in that order, use `ORDER BY bm25(incidents, 8.0, 2.0, 1.0)`. Those weights are an example configuration, not a universal optimum. Start with an explicit priority for code matches, inspect returned records, and change weights when the ordering fails real searches. Ranking changes the order of matches. It cannot retrieve a row whose tokens did not match.

## Check the original identifier

FTS5 token matching can differ from strict string equality. Its default tokenizer folds case and separates punctuation. If the task requires the literal stored code, check the original code field after FTS5 selects candidates. For example, add `AND code = 'ERR-42'` to a phrase query when the code must have that spelling. The phrase finds candidates; the equality condition enforces the stored value. Apply the comparison rules your application needs for case and normalization. [SQLite's token and phrase rules explain why this check is needed](https://www.sqlite.org/fts5.html).

For fragments inside a token, SQLite also offers a trigram tokenizer. It indexes overlapping character sequences and can support substring queries. Its documented limits include full-text queries shorter than three Unicode characters, which return no rows. That makes it a separate choice for fragment search, with its own index behavior. [See SQLite's trigram section](https://www.sqlite.org/fts5.html).

## What to do

1. Collect real examples of the codes, paths, and exception names people search for.
2. Test how the chosen tokenizer splits each example, especially at punctuation and underscores.
3. Add a code column filter for known identifiers and a prefix query for incomplete ones. Add prefix indexes for the lengths users enter often.
4. Sort candidates with `rank` or weighted `bm25()`, then inspect whether the first results contain the intended code.
5. When literal spelling matters, compare the original field after retrieval. Keep broader semantic search available for queries that describe a problem without naming its identifier.

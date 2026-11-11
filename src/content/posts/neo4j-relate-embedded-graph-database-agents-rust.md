---
title: "Neo4j Labs releases Relate 1.0, an embedded Rust graph database for agents"
description: "Relate is an Apache 2.0, in-process graph database in Rust with Cypher, vector search, a CLI and an MCP server. Neo4j calls it an experimental Labs project."
pubDate: "2026-11-11T21:07:00Z"
section: dev
subsection: rag
tags:
  - neo4j
  - graph-database
  - agent-memory
  - mcp
  - rust
draft: false
heroImage: https://bots.aitamer.news/heroes/neo4j-relate-embedded-graph-database-agents-rust-3281f5b1.jpg
heroAlt: "A small paper lantern on a workbench holding a glowing cluster of teal paper nodes joined by threads, one node rusty orange."
author: desk-bot
wildness:
  rating: 2
  verified: "relatedb/relate GitHub repo (v1.0.0, Apache 2.0, README, limitations), relatedb.ai, Neo4j on X."
  claimed: "Press-release speed and Cypher coverage figures: not read, not used."
verdict: "A good fit for agent memory or codebase graphs on one machine, like SQLite for graphs. Not a Neo4j server replacement, and Neo4j does not support it as a product."
sources:
  - title: "GitHub: relatedb/relate (v1.0.0, 11 November 2026)"
    url: https://github.com/relatedb/relate
  - title: "Relate limitations (docs/limitations.md)"
    url: https://github.com/relatedb/relate/blob/main/docs/limitations.md
  - title: "relatedb.ai"
    url: https://relatedb.ai
  - title: "Neo4j on X: say hello to Relate (11 November 2026)"
    url: https://x.com/neo4j/status/2120490982856663361
---

Neo4j has [announced Relate](https://x.com/neo4j/status/2120490982856663361), an open-source graph database built to live inside an AI agent's process rather than on a server. The [repository](https://github.com/relatedb/relate) tagged **v1.0.0** on 11 November under the **Apache 2.0** licence, and the engine is written in Rust.

## What it is

The README describes Relate as an embedded, in-memory property-graph engine. A graph is one `.rl` file, a directory, or memory only, made durable with an fsync'd write-ahead log and Parquet checkpoints. You query it in Cypher. The same engine ships as a `relate` CLI, a Python package (`pip install relate-db`), npm packages for Node.js and the browser through WebAssembly, and a Rust crate.

For agents, three pieces matter:

- **An agent skill** that teaches coding agents such as Claude Code to write Cypher for Relate, installed with one command from [relatedb.ai](https://relatedb.ai).
- **An MCP endpoint**, part of an optional single-process server that also speaks Bolt (so Neo4j drivers and neo4j-browser connect) and Neo4j's HTTP Query API v2.
- **Vector search in the same query language**: `vector()` properties, similarity functions, `CREATE VECTOR INDEX` and a `SEARCH` clause for top-K with pre-filtering, plus hybrid vector and full-text queries.

The site's examples are agent memory ("what do you remember from our last session?"), codebase context ("which functions break if you change parse_config()?") and recommendations.

## Read before you deploy

- The README opens with a warning: this is **an experimental Neo4j Labs project and not part of Neo4j's supported product lineup**.
- The [limitations page](https://github.com/relatedb/relate/blob/main/docs/limitations.md) calls Relate single-process, "closer to SQLite than to a clustered graph server". One graph per statement, no cross-graph queries, and most database administration commands are unsupported.
- The server binds to loopback with a generated auth token by default. `RELATE_AUTH=none` turns auth off, and `serve` is plaintext only, so put a TLS-terminating proxy in front of it if it ever leaves localhost.
- We could not load Neo4j's press release, so we are not repeating any performance figures from it. The repo's own compliance history says no current Cypher conformance pass rate is published.

## Why this matters

Agent memory usually ends up as a vector store plus ad hoc JSON. A graph adds the "how is this connected" question that [GraphRAG](/posts/vectors-plainly-5-rag-and-graphrag/) is built on, and Relate puts it in-process with vectors in the same query. It joins other open agent-memory projects such as [Tencent's HY Memory 2](/posts/tencent-hy-memory-2-open-source-agent-memory/). Treat it as a Labs tool for local and embedded use, keep the server on localhost, and keep an export path while the project is young.

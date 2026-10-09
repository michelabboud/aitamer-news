---
title: "DuckDB's v2.0 CLI gets an agent mode that writes for the model, not the terminal"
description: "DuckDB's v2.0 CLI detects coding agents and switches to compact Markdown tables, explicit truncation and JSON errors. DuckDB says agent output fell 59%, about 0.5% of total input tokens."
pubDate: "2026-10-09T17:47:00Z"
section: devops
subsection: duckdb
tags:
  - duckdb
  - cli
  - agents
  - claude-code
draft: false
heroImage: https://bots.aitamer.news/heroes/duckdb-cli-agent-mode-dfa8e252.jpg
heroAlt: "A yellow paper duck at a cream lectern holds a short folded table, with a long trimmed paper strip on the floor."
author: desk-bot
wildness:
  rating: 2
  verified: "DuckDB blog, 9 Oct: detection variables, -agent and -no-agent flags, ships with v2.0"
  claimed: "The 59% and 132/132 figures come from a DuckDB-run experiment in which Claude also wrote the report"
verdict: "Agent mode fixes how truncated results mislead a model, which matters more than the token saving. Try it when v2.0 lands; the latest stable release is still v1.5.6."
sources:
  - title: "Agent Mode in the DuckDB CLI (DuckDB blog, 9 October 2026)"
    url: https://duckdb.org/2026/10/09/agent-mode
  - title: "duckdb/duckdb PR #26167"
    url: https://github.com/duckdb/duckdb/pull/26167
  - title: "duckdb/duckdb releases"
    url: https://github.com/duckdb/duckdb/releases
---

DuckDB's team [described an agent mode for its command-line shell](https://duckdb.org/2026/10/09/agent-mode) on 9 October 2026. The post says "agent mode ships with DuckDB v2.0." DuckDB's [latest stable release](https://github.com/duckdb/duckdb/releases) is still v1.5.6, from 28 September, so this is a v2.0 feature you can read about now and use when that release arrives.

## How it detects an agent

Coding agents such as Claude Code, Codex, Cursor, Gemini CLI and GitHub Copilot typically run `duckdb -c "..."` per shell call and hand the captured output to a model. The CLI checks for environment variables these tools set, including `CLAUDECODE`, `CURSOR_AGENT`, `GEMINI_CLI`, `CODEX_SANDBOX`, `COPILOT_CLI` and the generic `AI_AGENT` or `AGENT`. Agent mode turns on when one is set, stdout is not a terminal, and no output format was given. `-agent` and `-no-agent` force it on or off, and `.help agent` explains the output.

## What changes

- **Compact tables:** Markdown with no alignment padding and the type in each header cell. DuckDB says that is 25 to 65% smaller than the box renderer on typical results.
- **Honest truncation:** results up to 1,000 rows and 10,000 bytes print in full. Larger ones show the first and last 20 rows around an explicit "rows omitted" marker, with a footer saying what happened and how to get the rest.
- **Early stop:** after the cap, rows are counted, and a runaway query is stopped 100,000 rows later, with the count reported as a lower bound.
- **Errors as JSON**, and compact plans and cost estimates before long queries, so the agent can decide whether to wait.

## The numbers, and the honest part

These are DuckDB's figures from an experiment it ran with Claude Code: 22 TPC-H questions at scale factor 100, asked in plain English, three times with agent mode and three without. All 132 runs were correct, and the DuckDB output the model read fell from 123.6k to 50.8k tokens, a 59% cut. Claude also wrote the report.

DuckDB is upfront that this did not show up in cost or runtime. Each turn re-reads the agent's much larger system prompt, "so the saved tokens amount to about 0.5% of the total input," and agent-mode runs took slightly more turns, 237 against 224. The real gain is that a model is less likely to draw conclusions from rows it never saw.

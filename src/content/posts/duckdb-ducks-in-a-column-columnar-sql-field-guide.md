---
title: "DuckDB's columnar tricks, tried on an eval log: query files in place, ASOF joins, sorted Parquet"
description: "DuckDB's team explains why storing data by column makes it fast. We tried the ideas on a small LLM eval log, with short queries you can run in a minute."
pubDate: "2026-11-12T13:37:00Z"
section: devops
subsection: duckdb
tags:
  - duckdb
  - sql
  - parquet
  - analytics
  - evals
  - explainer
draft: false
heroImage: https://bots.aitamer.news/heroes/duckdb-ducks-in-a-column-columnar-sql-field-guide-ea528c39.jpg
heroAlt: "Small paper ducks stand in five neat columns on a cream pond, and a paper magnifying glass enlarges only the sulfur-yellow column."
author: desk-bot
wildness:
  rating: 1
  verified: "DuckDB blog posts of 10 and 12 Nov 2026. Our queries ran on DuckDB 2.0.0, 12 Nov."
  claimed: "Speed reasons are DuckDB's own explanation. We ran no benchmarks."
verdict: "If your evals, traces or RAG logs live in Parquet or CSV files, DuckDB can answer most questions about them without a server or a load step."
sources:
  - title: "DuckDB: Ducks in a Column (10 November 2026)"
    url: https://duckdb.org/2026/11/10/ducks-in-a-column.html
  - title: "DuckDB: Local Analytics Doesn't Need a Database Server (12 November 2026)"
    url: https://duckdb.org/2026/11/12/local-analytics-without-a-database-server.html
---

The DuckDB team published [Ducks in a Column](https://duckdb.org/2026/11/10/ducks-in-a-column.html) on 10 November, a short tour of the features that follow from one design choice: DuckDB stores each column separately. In their words, "a query that touches three columns out of fifty reads only those three." The post works through a sample table of duck sightings. Here we take the same ideas and point them at something closer to an AI team's day: a log of model evaluation runs.

Everything below ran on DuckDB 2.0.0 from Python (`pip install duckdb`, then `duckdb.sql(...)`) on 12 November. The same SQL works in the DuckDB CLI.

## Why columns matter for AI data

Eval results, traces, token counts and RAG retrieval logs are wide and append-only, and most questions touch only a few columns: pass rate by model, p95 latency, spend. A row store reads whole rows to answer those. DuckDB reads only the named columns, and the DuckDB team says columns also compress well because each holds one type of value, and the engine processes them in batches of 2,048 values.

## Make a test log

This builds 2,000 fake runs across three models and writes them as two weekly Parquet files:

```sql
CREATE TABLE runs AS
SELECT
  i AS run_id,
  ['model-a', 'model-b', 'model-c'][1 + i % 3] AS model,
  'task-' || lpad((i % 50)::VARCHAR, 3, '0') AS task_id,
  TIMESTAMP '2026-11-01' + to_minutes(i * 7) AS ran_at,
  200 + (hash(i) % 1800) AS latency_ms,
  300 + (hash(i * 7) % 4000) AS tokens,
  hash(i * 13) % 10 < 7 AS passed
FROM range(2000) t(i);

COPY (SELECT * FROM runs WHERE ran_at <  '2026-11-08') TO 'runs_w1.parquet';
COPY (SELECT * FROM runs WHERE ran_at >= '2026-11-08') TO 'runs_w2.parquet';
```

## Query files where they are

No import step. A glob reads every matching file, and `filename = true` says which file each row came from:

```sql
SELECT filename, count(*) AS runs
FROM read_parquet('runs_*.parquet', filename = true)
GROUP BY ALL ORDER BY ALL;
-- runs_w1.parquet  1440
-- runs_w2.parquet   560
```

The DuckDB post notes that `s3://` and `https://` paths work the same way, with the httpfs extension loading automatically. For CSV files, `DESCRIBE SELECT * FROM 'tasks.csv'` shows what types DuckDB guessed. In our test a code column like `0042` came back as `VARCHAR`, so the leading zeros survived. If a guess is wrong, pin it with `read_csv('tasks.csv', types = {'team_code': 'VARCHAR'})`.

## Column-level SQL

`EXCLUDE` drops columns you do not need, `COLUMNS(...)` applies one expression to several columns, and `GROUP BY ALL` groups by every non-aggregated column so you stop repeating yourself:

```sql
SELECT * EXCLUDE (run_id, ran_at) FROM 'runs_*.parquet' LIMIT 2;

SELECT model, avg(COLUMNS(['latency_ms', 'tokens']))
FROM 'runs_*.parquet' GROUP BY ALL ORDER BY ALL;

SELECT model,
       round(avg(passed::INT), 3)        AS pass_rate,
       quantile_cont(latency_ms, 0.95)   AS p95_ms
FROM 'runs_*.parquet' GROUP BY ALL ORDER BY ALL;
```

## ASOF joins for prices that change

Model prices change over time. An ASOF join matches each run to the most recent price at or before that run, which is awkward to write with a plain join:

```sql
CREATE TABLE prices (model VARCHAR, effective_at TIMESTAMP, usd_per_mtok DOUBLE);
INSERT INTO prices VALUES
  ('model-a', '2026-11-01', 3.0), ('model-a', '2026-11-06', 2.0),
  ('model-b', '2026-11-01', 1.0),
  ('model-c', '2026-11-01', 0.5), ('model-c', '2026-11-10', 0.8);

SELECT r.model, round(sum(r.tokens * p.usd_per_mtok / 1e6), 2) AS usd
FROM 'runs_*.parquet' r
ASOF JOIN prices p ON r.model = p.model AND r.ran_at >= p.effective_at
GROUP BY ALL ORDER BY ALL;
```

A window function gives a rolling pass rate per model, and `QUALIFY` keeps only the latest row for each:

```sql
SELECT model, ran_at,
  avg(passed::INT) OVER (PARTITION BY model ORDER BY ran_at
                         ROWS BETWEEN 49 PRECEDING AND CURRENT ROW) AS rolling_pass
FROM 'runs_*.parquet'
QUALIFY row_number() OVER (PARTITION BY model ORDER BY ran_at DESC) = 1;
```

## Write Parquet that is cheap to read later

Sorting before writing and partitioning by a column you filter on lets later queries skip data. This writes one folder per model:

```sql
COPY (SELECT * FROM 'runs_*.parquet' ORDER BY task_id, ran_at)
TO 'runs_by_model' (FORMAT parquet, PARTITION_BY (model), OVERWRITE_OR_IGNORE);
```

`EXPLAIN ANALYZE` shows whether the skipping happens. On our two files, `EXPLAIN ANALYZE SELECT model, avg(latency_ms) FROM 'runs_*.parquet' WHERE ran_at >= '2026-11-08' GROUP BY ALL` reported that the scan read only `model` and `latency_ms` (plus the filter on `ran_at`) and scanned 1 of 2 row groups, because Parquet's per-group min and max values ruled the first week out.

## No server needed

A second DuckDB post, [Local Analytics Doesn't Need a Database Server](https://duckdb.org/2026/11/12/local-analytics-without-a-database-server.html) from 12 November, profiles Ilya Boyandin, creator of the open-source SQLRooms toolkit. His apps run DuckDB in the browser through WebAssembly or inside a desktop app, loading Parquet from S3 and querying it on the user's machine. "You should own your data," he says in the post. For eval and trace data that a team mostly reads, that pattern can replace a hosted warehouse for day-to-day questions.

If you are on DuckDB already, our coverage of [DuckDB 2.0 LTS](/posts/duckdb-2-0-lts-cinnamon-teal/) explains the new file format that older versions cannot read, and [the CLI's agent mode](/posts/duckdb-cli-agent-mode/) covers output written for models instead of people. [Aurora PostgreSQL's embedded DuckDB](/posts/aurora-postgresql-iceberg-parquet-duckdb/) brings the same Parquet reading into Postgres.

## Why this matters

Most AI teams already have their eval runs, traces and retrieval logs sitting in files. DuckDB lets you ask column-shaped questions of those files with plain SQL, no server and no load step, and its ASOF joins and partitioned Parquet output fit cost and regression tracking well. Start with one log folder and the queries above before reaching for a warehouse.

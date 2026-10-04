---
title: Generated Columns Move Work Between Writes and Reads
description: Stored and virtual generated columns calculate the same kind of value at different times. A usage total shows how to choose between them.
pubDate: "2026-10-05T05:00:00Z"
specimen: 252
section: dev
tags:
  - postgresql
  - databases
  - generated-columns
  - performance
draft: false
heroImage: https://media.aitamer.news/heroes/generated-columns-move-work-between-writes-and-reads-779919ec.jpg
heroAlt: Paper records enter a central box, while stored cards and a reading station sit on opposite sides.
author: ari
wildness:
  rating: 2
  verified: PostgreSQL computes stored columns on write and virtual columns on read.
  claimed: Which form performs better for a workload needs measurement.
verdict: Use virtual when saving storage and shifting work to reads fits the workload. Use stored when paying for the calculation on writes fits better. Measure before settling on either.
sources:
  - title: "PostgreSQL Documentation: Generated Columns"
    url: https://www.postgresql.org/docs/current/ddl-generated-columns.html
---

## Where the calculation runs

A generated column derives its value from other columns in the same row. PostgreSQL offers two forms. A stored column is calculated when a row is inserted or updated and occupies table storage. A virtual column occupies no storage and is calculated when read. PostgreSQL's [generated-column documentation](https://www.postgresql.org/docs/current/ddl-generated-columns.html) describes both forms and says virtual is the default. Spell out the choice so the table definition shows where the work happens.

## A usage counter example

Suppose a usage record holds incoming and outgoing byte counts. A total can be derived from those two fields:

```sql
CREATE TABLE usage_records (
    bytes_in bigint NOT NULL,
    bytes_out bigint NOT NULL,
    total_bytes bigint GENERATED ALWAYS AS (bytes_in + bytes_out) STORED
);
```

For the virtual form, replace `STORED` with `VIRTUAL`. The application supplies the two inputs. PostgreSQL calculates `total_bytes`; an insert or update cannot supply a separate value for that generated column. This keeps the total tied to the row's inputs under PostgreSQL's [generated-column rules](https://www.postgresql.org/docs/current/ddl-generated-columns.html).

The choice moves computation between operations. Stored pays for the calculation on writes and keeps the result in storage. Virtual pays when the field is read and saves that column's storage. If usage records are updated often and the total is rarely read, virtual is a sensible starting point. If the total is read often and writes are less frequent, stored is a sensible starting point. Those are workload hypotheses, not measured performance results.

## Rules that shape the expression

PostgreSQL requires a generated expression to use only immutable functions and the current row. It cannot refer to another generated column. Virtual expressions also cannot use user-defined functions or types, including indirect use through an operator or cast. Stored expressions do not have that virtual-specific restriction. Check these limits before choosing a form for a more complex usage calculation. The [documentation](https://www.postgresql.org/docs/current/ddl-generated-columns.html) lists the restrictions.

## What to do

1. Write the total as an expression of fields on one row, and keep required inputs non-null.
2. Declare `VIRTUAL` or `STORED` explicitly in the table definition.
3. Compare insert and update cost, storage use, and reads of that field with representative data. Choose the form that fits the actual workload.

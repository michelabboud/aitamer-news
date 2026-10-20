---
title: One NULL can empty a SQL exclusion query
description: A NOT IN query can lose every candidate when its exclusion set contains NULL. A small SQLite example shows why and how a correlated NOT EXISTS changes the result.
pubDate: "2026-10-20T11:30:00Z"
section: dev
tags:
  - sql
  - sqlite
  - postgresql
  - "null"
draft: false
heroImage: https://media.aitamer.news/heroes/sql-not-in-null-5df0e39c.jpg
heroAlt: Three blue paper tokens sit above a mesh gate held by a hollow cream ring, with an empty tray below.
author: ari
wildness:
  rating: 1
  verified: PostgreSQL and SQLite document NULL behavior; the example specifies non-null candidate IDs.
  claimed: Use the matching relationship and an explicit policy for missing identifiers.
verdict: An exclusion query needs an explicit NULL policy. Use NOT EXISTS when absence means no matching row.
sources:
  - title: "PostgreSQL subquery expressions: NOT IN and EXISTS"
    url: https://www.postgresql.org/docs/current/functions-subquery.html
  - title: "SQLite SELECT: WHERE filtering"
    url: https://www.sqlite.org/lang_select.html
  - title: PostgreSQL comparison functions and operators
    url: https://www.postgresql.org/docs/current/functions-comparison.html
  - title: "SQLite expression rules: IN, NOT IN, EXISTS"
    url: https://www.sqlite.org/lang_expr.html
---

A report asks for customers without an entry in a suppression table. The query worked with the original fixture. Then an imported suppression row arrives without a customer identifier, and the report returns no customers at all.

The trap is `NOT IN` with a nullable exclusion set. [PostgreSQL's subquery documentation](https://www.postgresql.org/docs/current/functions-subquery.html) states the rule: when no right-hand value matches and at least one is null, the result is null. A matching value still makes the exclusion false. Neither result admits a row through a `WHERE` filter.

## Reproduce it without existing tables

Run this self-contained example in SQLite:

```sql
WITH customers(id) AS (VALUES (1), (2), (3)),
     suppressed(customer_id) AS (VALUES (2), (NULL))
SELECT id
FROM customers
WHERE id NOT IN (SELECT customer_id FROM suppressed)
ORDER BY id;
```

It returns no rows. Customer `2` is explicitly suppressed. For `1` and `3`, the null leaves the exclusion condition unknown. [SQLite's SELECT documentation](https://www.sqlite.org/lang_select.html) says `WHERE` excludes rows when its expression is false or null.

For ordinary comparisons, null represents an unknown value. [PostgreSQL's comparison documentation](https://www.postgresql.org/docs/current/functions-comparison.html) explains that comparing a value with null produces null, including an inequality. Failing to find a known equal identifier therefore does not establish that a candidate differs from every identifier in this particular exclusion set.

## Express the matching relationship

For this report, a null suppression identifier should suppress nobody. Write the condition around the existence of a matching row:

```sql
WITH customers(id) AS (VALUES (1), (2), (3)),
     suppressed(customer_id) AS (VALUES (2), (NULL))
SELECT c.id
FROM customers AS c
WHERE NOT EXISTS (
    SELECT 1
    FROM suppressed AS s
    WHERE s.customer_id = c.id
)
ORDER BY c.id;
```

This query returns `1` and `3`. [SQLite's expression documentation](https://www.sqlite.org/lang_expr.html) defines `EXISTS` in terms of whether its subquery returns rows. Here the null identifier creates no equality match, so it adds no matching suppression row for either candidate.

Filtering nulls from the original subquery with `WHERE customer_id IS NOT NULL` also produces the intended result for this fixture. Choose the expression that states the relationship clearly, and inspect whether the schema should reject missing suppression identifiers at insertion time.

## Decide what a missing candidate means

The candidate identifiers above are all present. If an outer candidate identifier can itself be null, an equality-based `NOT EXISTS` admits that candidate because no equality match is true. Decide whether that is allowed. Add an outer `c.id IS NOT NULL` condition when the report requires an actual identifier.

Avoid replacing null with an invented sentinel identifier merely to make a comparison return a Boolean. That creates another policy to maintain and can collide with a legitimate value. Also avoid turning this correctness fix into an unsupported performance claim. Examine the actual query plan and representative data before choosing a faster formulation.

Keep fixtures for a matching identifier, a missing match, a null exclusion identifier, and an empty exclusion set. Include a null candidate if the schema permits one. Those cases make the intended meaning of absence visible before a real import changes the report.

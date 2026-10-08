---
title: A Prepared Statement Can Switch to a Generic Plan
description: PostgreSQL can change how it plans a prepared query after repeated executions. Inspect custom and generic plans when parameter values have very different row counts.
pubDate: "2026-10-09T05:00:00Z"
section: dev
tags:
  - postgresql
  - prepared-statements
  - query-planning
draft: false
heroImage: https://media.aitamer.news/heroes/a-prepared-statement-can-switch-to-a-generic-plan-711bb7a2.jpg
heroAlt: A hinged rust flap sits at a branching cream route, with small and large blue paper stacks facing different passages.
author: ari
wildness:
  rating: 1
  verified: PostgreSQL may choose a reusable generic plan after comparing its cost with early custom plans.
  claimed: Illustrative tenant skew and plan choices are examples, not measured outcomes.
verdict: Inspect custom and generic plans with representative parameter values before forcing plan behavior.
sources:
  - title: PostgreSQL PREPARE documentation
    url: https://www.postgresql.org/docs/current/sql-prepare.html
---

A query that feels fast for one tenant can feel slow for another, even when both use the same prepared statement. Imagine a task table where a large tenant owns most rows and thousands of small tenants own a few each. The application repeatedly requests tasks by `tenant_id`. An index lookup may suit a small tenant; a different access path may suit the large one. The actual choice depends on the table, statistics, and query.

PostgreSQL parses and analyzes a statement when it is prepared, then plans it for execution. A **custom plan** uses the parameter value supplied for that execution. A **generic plan** is reusable across values, saving planning work, but it cannot tailor its estimates to a particular tenant. The [PREPARE documentation](https://www.postgresql.org/docs/current/sql-prepare.html) says that, in automatic mode, PostgreSQL uses custom plans for the first five executions, compares their average estimated cost with a generic plan's estimated cost, and may use the generic plan for later executions. This is a cost heuristic, not a promise that every execution takes the same path.

To inspect the choice, use the same session as the prepared statement and compare representative values:

```sql
PREPARE tasks_for_tenant (bigint) AS
  SELECT id, title FROM tasks WHERE tenant_id = $1;

SET plan_cache_mode = force_custom_plan;
EXPLAIN EXECUTE tasks_for_tenant(42);
EXPLAIN EXECUTE tasks_for_tenant(9001);

SET plan_cache_mode = force_generic_plan;
EXPLAIN EXECUTE tasks_for_tenant(42);
EXPLAIN EXECUTE tasks_for_tenant(9001);

SET plan_cache_mode = auto;
```

These are inspection commands for an illustrative schema; they are not measured results. In `EXPLAIN EXECUTE`, a generic plan retains `$1` in its displayed condition, while a custom plan shows the supplied value. Compare both the chosen nodes and estimated rows. If the two tenants have sharply different distributions, a single reusable plan can fit one poorly. Conversely, custom planning has a cost, and a generic plan can be the sensible choice when values behave similarly.

For a real regression, inspect the plan from the affected connection after repeated executions, then compare representative large and small parameter values under both forced modes. Keep the forced setting scoped to diagnosis until the evidence shows that its planning cost and execution behavior suit the workload. A prepared statement is session-local; a plan observed in one connection does not establish what every application connection has selected.

---
title: A CHECK Constraint Can Accept NULL
description: PostgreSQL accepts a CHECK expression that evaluates to NULL. Make optional positive quotas explicit, and pair CHECK with NOT NULL when a value is required.
pubDate: "2026-10-09T03:00:00Z"
section: dev
tags:
  - postgresql
  - sql
  - data-modeling
  - constraints
draft: false
heroImage: https://media.aitamer.news/heroes/a-check-constraint-can-accept-null-8dd4f645.jpg
heroAlt: A cream inspection sleeve accepts a blue card and an empty frame, while a bent rust card remains outside.
author: ari
wildness:
  rating: 1
  verified: PostgreSQL CHECK accepts true or NULL; NOT NULL rejects missing values.
  claimed: The quota schema is illustrative and has not been executed here.
verdict: Use CHECK for the permitted numeric range and NOT NULL when the quota is mandatory. If NULL selects a default, document and test that behavior explicitly.
sources:
  - title: "PostgreSQL Documentation: Constraints"
    url: https://www.postgresql.org/docs/current/ddl-constraints.html
---

Suppose a developer tool stores a per-project quota for requests to an AI model. A positive number means a custom limit; `NULL` means the project uses a separately defined default. The schema can allow both states, but a `CHECK` constraint alone cannot express “a positive number must be present.”

In PostgreSQL, this definition accepts `NULL`:

```sql
CREATE TABLE model_projects (
    project_id bigint PRIMARY KEY,
    custom_quota integer CHECK (custom_quota > 0)
);
```

The comparison `NULL > 0` evaluates to SQL's unknown value. As the [PostgreSQL constraints guide](https://www.postgresql.org/docs/current/ddl-constraints.html) explains, a `CHECK` constraint is satisfied when its expression is true or null; it rejects false. A stored quota of `0` or `-1` violates the constraint. An absent quota does not. The database is enforcing the stated rule, even if an application developer expected the column to be required.

That behavior is useful when absence has a defined meaning. If `NULL` selects the default quota, keep the column nullable and document that meaning in the application and schema. If every project must carry its own quota, change the column declaration to `custom_quota integer NOT NULL CHECK (custom_quota > 0)`. `NOT NULL` rejects absence; `CHECK` rejects present nonpositive values. PostgreSQL's guide shows these constraints together and notes that an explicit `NOT NULL` is more efficient than expressing the same condition through a check.

Three-valued logic can also affect checks involving several columns. A condition such as `CHECK (used_tokens <= custom_quota)` evaluates to unknown when `custom_quota` is null. It therefore cannot enforce a relationship for projects using the default. If that relationship matters, apply it to the effective quota through the appropriate schema or application design; do not assume the nullable comparison enforces it. A `CHECK` is intended to validate the row being inserted or updated, and PostgreSQL warns against using it to reference other rows or tables.

Decide what `NULL` means before writing the constraint. Test inserts for a positive quota, zero, a negative quota, and `NULL`, then verify both database acceptance and the application's default-selection behavior. That small matrix exposes the gap between a required positive value and an optional positive override.

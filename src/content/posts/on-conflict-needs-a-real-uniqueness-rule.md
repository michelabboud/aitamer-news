---
title: ON CONFLICT Needs a Real Uniqueness Rule
description: A preflight SELECT cannot decide whether a concurrent insert conflicts. Design the unique key first, then let PostgreSQL arbitrate each proposed row.
pubDate: "2026-10-09T03:30:00Z"
section: dev
tags:
  - postgresql
  - concurrency
  - ai-applications
draft: false
heroImage: https://media.aitamer.news/heroes/on-conflict-needs-a-real-uniqueness-rule-72ec3657.jpg
heroAlt: Two identical blue paper cards meet a single occupied keyhole slot in a cream gate, with a rust guide beside the newcomer.
author: ari
wildness:
  rating: 1
  verified: ON CONFLICT uses a unique arbiter and can atomically insert or update a proposed row.
  claimed: The example's key and overwrite policy are design choices for a voice application.
verdict: Put the application's identity rule in a unique index, then select DO NOTHING or DO UPDATE according to duplicate and revision semantics.
sources:
  - title: PostgreSQL INSERT documentation
    url: https://www.postgresql.org/docs/current/sql-insert.html
---

A voice application receives the same transcription callback twice. Both handlers ask whether a job already exists for the tenant and request ID. Both see no row, then both insert. The lookup described the past; it did not reserve the key. A developer agent processing duplicate tool results can create the same race.

The database needs a rule that names the identity of one logical job. For example:

~~~sql
CREATE UNIQUE INDEX utterance_jobs_request_key
  ON utterance_jobs (tenant_id, request_id);

INSERT INTO utterance_jobs (tenant_id, request_id, transcript)
VALUES ($1, $2, $3)
ON CONFLICT (tenant_id, request_id)
DO UPDATE SET transcript = EXCLUDED.transcript
RETURNING id, transcript;
~~~

PostgreSQL's [INSERT reference](https://www.postgresql.org/docs/current/sql-insert.html) calls the selected unique index or constraint the arbiter. Here the conflict target infers the unique index on exactly those two columns. The index enforces the identity even when two handlers run concurrently. For each proposed row, PostgreSQL either inserts or applies the conflict action; the documented atomic insert-or-update guarantee assumes no independent error.

EXCLUDED.transcript means the value proposed by the incoming insert. The existing row supplies the other side of the update. If callbacks can arrive out of order, this example allows an older transcript to overwrite a newer one. Add a version or timestamp rule to the update condition, or choose DO NOTHING when the first accepted result should be immutable. A DO UPDATE condition is evaluated after PostgreSQL has identified the conflict; a row can be locked even when that condition declines the update. A RETURNING clause then reports rows actually inserted or updated, so a skipped update may return no row.

The choice of unique key carries product meaning. A globally unique request ID may need only one column. A request ID reused by different tenants needs the tenant ID in the key. If the application allows several transcript revisions for one request, a revision number may belong in a different key. A plain, nonunique index cannot arbitrate ON CONFLICT DO UPDATE, and PostgreSQL raises an error when it cannot infer a suitable unique index.

A preflight lookup can still improve a user message or avoid needless work. Treat it as a hint. Define the database uniqueness rule for the invariant, choose the conflict action that matches duplicate and revision semantics, and inspect the returned row before telling the voice user or agent which result won.

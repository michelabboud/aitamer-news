---
title: Attaching Two SQLite Files Changes the Commit Guarantees
description: A transaction can update two attached SQLite databases, but crash atomicity across both files depends on the main database and journal mode. Here is the boundary to check before relying on it.
pubDate: "2026-10-09T09:00:00Z"
section: dev
tags:
  - sqlite
  - transactions
  - wal
draft: false
heroImage: https://media.aitamer.news/heroes/attaching-two-sqlite-files-changes-the-commit-guarantees-d4a2e0bb.jpg
heroAlt: Two cream folders hold separate records connected by a blue strip interrupted by a rust seam.
author: ari
wildness:
  rating: 1
  verified: SQLite documents cross-file atomicity conditions and the WAL or in-memory-main exception.
  claimed: The voice app and SQL rows are illustrative; no crash test or deployment claim is made.
verdict: ATTACH makes two files accessible in one transaction. Check the main database and journal mode before depending on all-or-nothing crash recovery across them.
sources:
  - title: SQLite ATTACH DATABASE documentation
    url: https://www.sqlite.org/lang_attach.html
  - title: SQLite PRAGMA journal_mode
    url: https://www.sqlite.org/pragma.html#pragma_journal_mode
---

A voice application keeps conversations in one SQLite file and a search index in another. Its developer attaches the index file, writes both records inside one transaction, and expects the pair to survive a crash together. That expectation has a condition hidden behind the convenience of `ATTACH DATABASE`.

For an otherwise crash-safe journaling configuration, SQLite's [ATTACH documentation](https://www.sqlite.org/lang_attach.html) says a transaction involving multiple attached databases is atomic across those files when the main database is not `:memory:` and the journal mode is not write-ahead logging (WAL). If the main database is in memory, or WAL is in use, the transaction remains atomic within each individual database file. A host crash during a commit that updates two files can then leave one file with the change and the other without it.

Avoid reading “not WAL” as permission to disable journaling. The [journal-mode documentation](https://www.sqlite.org/pragma.html#pragma_journal_mode) says `OFF` disables atomic commit and rollback, while `MEMORY` journals can leave a database corrupt after a mid-transaction crash. Those modes do not provide the baseline assumed here.

Consider this conceptual transaction:

```sql
ATTACH DATABASE 'search.db' AS search;
BEGIN;
INSERT INTO main.conversations (id, text) VALUES (42, 'turn text');
INSERT INTO search.entries (conversation_id, text) VALUES (42, 'turn text');
COMMIT;
```

The `main.` and `search.` prefixes identify which file owns each table. The SQL boundary is one transaction on one connection. It does not, by itself, tell you whether a crash can expose half of the intended cross-file update. An ordinary successful `COMMIT` establishes that both statements completed; the difficult question is what durable state remains if the machine stops partway through that commit.

For an AI developer tool, this can matter when the first file contains the authoritative conversation and the second stores retrieval metadata. A mismatch can make search omit a committed turn or point at a turn absent from the conversation store. If rebuilding the index from the authoritative file is acceptable, that may be a deliberate recovery design. If the two files must always agree after a crash, document and check SQLite's conditions for cross-file atomicity before choosing the layout. Treat a switch to WAL, or an in-memory main database used in tests, as a change to that contract.

Do not infer the guarantee from a test that only exercises successful commits. Review the actual connection setup and journal mode used by the deployed application, and decide whether recovery can reconcile the files. Where reconciliation is essential, specify which file is authoritative and how an interrupted commit is detected. Where reconciliation is unacceptable, keep the cross-file guarantee as an explicit storage requirement.

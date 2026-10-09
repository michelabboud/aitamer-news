---
title: "SQLite 3.54.0 ships a CLI overhaul and new limits for untrusted SQL"
description: "SQLite 3.54.0 is dated 9 October 2026, ahead of the 15 October date still on its draft changelog. The release overhauls the shell, drops Windows XP, and adds limits for untrusted SQL."
pubDate: "2026-10-09T18:47:00Z"
section: devops
subsection: sqlite
tags:
  - sqlite
  - cli
  - sql
  - local-first
draft: false
heroImage: https://bots.aitamer.news/heroes/sqlite-3-54-0-release-fd0a55a6.jpg
heroAlt: "A paper-cut stack of cream and steel-blue rings forms a database cylinder, a new sulfur-yellow ring on top, with a cream quill and a small ruler at its base."
author: desk-bot
wildness:
  rating: 2
  verified: "Release notes, news, downloads and the check-in are all dated 9 Oct 2026; the draft log still says 15 Oct"
  claimed: "The 4% and 7.5% figures are SQLite's own speedtest1 CPU-cycle counts with valgrind on Linux x64"
verdict: "Upgrade for the shell and the authorizer change. If a connection runs generated SQL, lower the new schema and trigger limits. Treat the speed line as SQLite's own benchmark."
sources:
  - title: "SQLite Release 3.54.0 (9 October 2026)"
    url: https://sqlite.org/releaselog/3_54_0.html
  - title: "SQLite news"
    url: https://sqlite.org/news.html
  - title: "SQLite download page"
    url: https://sqlite.org/download.html
  - title: "Draft release notes for 3.54.0 (still headed 15 October 2026)"
    url: https://sqlite.org/draft/releaselog/3_54_0.html
  - title: "Check-in be8d059e9a, Version 3.54.0"
    url: https://sqlite.org/src/info/be8d059e9a49089ab2dce5ed26dd87aaf598fdc5fbe0b107c0dd758464bcd5e3
  - title: "SQLite printf format substitutions"
    url: https://sqlite.org/printf.html
  - title: "sqlite3_result_str()"
    url: https://sqlite.org/c3ref/result_str.html
  - title: "sqlite3_complete() and sqlite3_incomplete()"
    url: https://sqlite.org/c3ref/complete.html
  - title: "Date and time functions"
    url: https://sqlite.org/lang_datefunc.html
  - title: "sqlite3_set_authorizer()"
    url: https://sqlite.org/c3ref/set_authorizer.html
  - title: "sqlite3_limit()"
    url: https://sqlite.org/c3ref/limit.html
  - title: "Run-time limit categories"
    url: https://sqlite.org/c3ref/c_limit_attached.html
  - title: "Implementation limits"
    url: https://sqlite.org/limits.html
  - title: "SQLite can carry a small AI app from prototype to local product"
    url: https://aitamer.news/posts/sqlite-for-ai-apps/
  - title: "SQLite as the default datastore for small AI tools"
    url: https://aitamer.news/posts/sqlite-default-datastore-small-ai-tools/
---

SQLite [version 3.54.0](https://sqlite.org/releaselog/3_54_0.html) is dated 9 October 2026. The [news page](https://sqlite.org/news.html) and the [download page](https://sqlite.org/download.html) match that version, and the [release check-in](https://sqlite.org/src/info/be8d059e9a49089ab2dce5ed26dd87aaf598fdc5fbe0b107c0dd758464bcd5e3) is by drh at 15:46:58 UTC, comment "Version 3.54.0", with the same source id. The [draft changelog](https://sqlite.org/draft/releaselog/3_54_0.html) is still headed "SQLite Release 3.54.0 On 2026-10-15", marked DRAFT, hashes pending.

## The shell

Prompt strings may contain escape sequences that expand to session state. If `SQLITE_PS1` or `SQLITE_PS2` is set, that value initializes the prompt. The default prompt honors `NO_COLOR`.

Columnar modes show the column-name header even when a query returns no rows. `.mode` gains `--rowcount on` and `--titles always`. The notes say `--titles always` is now the default, and that the previous behavior returns with `-titles on`, written there with a single dash. `--ifmt` and `--fpfmt` are printf-style formats for integers and floating-point values.

`.diskused`, built on the optional `diskused()` function, takes the place of the stand-alone `sqlite3_analyzer`. The news page says this is the last release that will ship that program, and that it is deprecated. The 3.54.0 tool archives on the download page still include it.

A line that contains only `go` or `/` no longer ends a statement. Those endings were there for SQL Server and Oracle habits. They remain only if the shell is compiled with `-DSQLITE_SHELL_LEGACY_COMMAND_TERMINATOR`.

## Planner, names, and new calls

An `UPDATE` on a table with expression indexes skips the index when the indexed value did not change. The planner also tightens `expr OR TRUE` and `expr OR FALSE`, ignores `DISTINCT` on the right-hand side of `IN`, and handles a `UNION` with `LIMIT` 1 with less time and memory. `ALTER TABLE` errors on adding, dropping, or renaming a column named `ROWID`, `_ROWID_`, or `OID`.

[`printf()` and `format()`](https://sqlite.org/printf.html) gain `%J` and `%j`, which render a string as a JSON string literal. `%J` adds the quotes. `%j` omits them. The printf page says both first appeared in 3.54.0.

[`sqlite3_result_str()`](https://sqlite.org/c3ref/result_str.html) returns a dynamic string from an SQL function. [`sqlite3_incomplete()`](https://sqlite.org/c3ref/complete.html), on the `sqlite3_complete()` page, reports whether input looks finished. The notes say the new prompt uses it.

[Date and time functions](https://sqlite.org/lang_datefunc.html) gain `end of month`, `end of year`, and `end of day` (last millisecond of that period, from 3.54.0) and `weekday -N`, which moves backward. N must be from -6 to +6, and negative values start in this release.

## Windows, and SQLite's own timings

Windows builds now require Windows Vista (about 2007) or later. XP, earlier Windows, and Windows CE are dropped: the news post says the library will not compile there because non-recursive mutexes use Slim Reader/Writer locks, which XP does not have. The notes say Linux, Mac, BSD, and other Unix builds are unchanged.

SQLite's own figure: about 4% faster on speedtest1, counting CPU cycles with valgrind on Linux x64, and about 7.5% faster than 3.51.0. The notes say that depends on workload, build options, CPU, compiler, and operating system.

## What the news log says about AI-found bugs

The 3.54.0 item says the release includes "countless fixes for AI-discovered bugs." The 3.53.4 entry, dated 24 July 2026 on the same [news page](https://sqlite.org/news.html), is the longer account:

> There was a huge rush of AI-aided bug reporting shortly after the 3.53.0 release (2026-04-09), but lately the rate of bug reports has declined noticably, and the bugs that are being reported are increasingly insignificant. Could it be that the AI-bug avalanche is coming to an end, and that all of the bugs that AIs are able to find have now nearly all been found and fixed?

That entry calls 3.53.4 a patch "with fixes for (mostly) AI-discovered bugs," and it suggested the next release might be 3.54.0, "with enhancements and new features." ("noticably" is the page's spelling.)

## When the SQL comes from a model

Local-first tools and agent apps already store state in SQLite. For a connection that runs SQL the application did not write, [SQLite's limit page](https://sqlite.org/c3ref/limit.html) says run-time limits are for databases controlled by untrusted external sources, and it points at the authorizer "to further control untrusted SQL." Applying that to model-generated statements is guidance for the application.

The [authorizer](https://sqlite.org/c3ref/set_authorizer.html) now runs for SQL functions in `DEFAULT` clauses of `CREATE TABLE`, both when the `CREATE TABLE` is issued and when the default is used. It does not run while SQLite is only reading the schema to open a database. An authorizer that allows a named set of functions will see those defaults.

[`sqlite3_limit()`](https://sqlite.org/c3ref/limit.html) gains [`SQLITE_LIMIT_SCHEMA` and `SQLITE_LIMIT_TRIGGER_STEPS`](https://sqlite.org/c3ref/c_limit_attached.html): a cap on tables, indexes, triggers, and views, and a cap on SQL statements inside one trigger. The [limits page](https://sqlite.org/limits.html) says the default schema maximum, from 3.54.0, is 10 million, "far more than any reasonable schema needs." It states no default for trigger steps. On a connection that accepts generated `CREATE` statements, set both lower and keep the authorizer on. A ceiling of ten million objects will not stop a runaway one.

Related reading: [SQLite for a small AI app](https://aitamer.news/posts/sqlite-for-ai-apps/) and [one file as the default store](https://aitamer.news/posts/sqlite-default-datastore-small-ai-tools/).

## Upgrade notes

Scripts that terminate SQL with a bare `go` or `/` line need a change, or `-DSQLITE_SHELL_LEGACY_COMMAND_TERMINATOR` at compile time. `sqlite3_analyzer` still ships and is deprecated in favor of `.diskused`. Windows older than Vista will not compile. Retest authorizers against `DEFAULT` functions, and lower the two new limits on any connection that runs generated SQL. The 4% and 7.5% figures are SQLite's valgrind count, not a figure for your workload.

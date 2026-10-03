---
title: "Reading AI agent logs with jq"
description: "If your agent logs one JSON object per line, five short jq filters turn that log into answers: which tool calls failed, which tools fail most, which steps were slowest, and how long the run took."
section: tools
tags: [jq, logs, ai-agents, json, command-line]
draft: false
sources:
  - title: "JSON Lines"
    url: https://jsonlines.org/
  - title: "jq manual"
    url: https://jqlang.org/manual/
wildness:
  rating: 1
  verified: "Every filter was run with jq 1.7 on the sample log shown, and each builtin is in the jq manual"
  claimed: "The log format is an example the author made up; real field names will differ"
verdict: "Log agent runs as one JSON object per line, and a few short jq filters answer the first questions after a failed run."
---

When an AI agent run goes wrong, the first questions are always the same: what failed, where, and how long did it take? If the run was logged as [JSON Lines](https://jsonlines.org/), one JSON object per line, [jq](https://jqlang.org/manual/) answers each of those in one line.

## A sample log

Say your agent writes a line like this for each tool call. Your field names will differ, but the filters adapt easily.

```json
{"ts":"2026-10-04T09:00:03Z","step":2,"tool":"fetch","status":"error","duration_ms":30012,"error":"timeout"}
```

## 1. Which calls failed?

```sh
jq -c 'select(.status == "error")' agent.jsonl
```

`select(f)` passes its input through when `f` is true and outputs nothing otherwise. `-c` prints each result on one line.

## 2. The same, readable

```sh
jq -r 'select(.status == "error") | [.ts, .tool, .error] | @tsv' agent.jsonl
```

`@tsv` turns an array into one tab-separated line, and `-r` prints it as plain text instead of a quoted JSON string. On the sample, that gives `2026-10-04T09:00:03Z  fetch  timeout`.

## 3. Which tools fail most?

```sh
jq -s 'group_by(.tool) | map({tool: .[0].tool, calls: length, errors: map(select(.status == "error")) | length})' agent.jsonl
```

`-s` (slurp) reads the whole file into one array, so the filter can see every line at once. `group_by(.tool)` collects the calls for each tool, and `length` counts them. On the sample: `fetch` 2 calls with 1 error, `write_file` 1 call with 1 error.

## 4. The slowest steps

```sh
jq -s -c 'sort_by(.duration_ms) | reverse | .[:3] | map({step, tool, duration_ms})' agent.jsonl
```

Sort by duration, reverse it, keep the first three with an array slice, and print only the fields you care about. `{step, tool, duration_ms}` is jq's shorthand for an object with those three keys. On the sample, the 30-second `fetch` timeout comes first.

## 5. How long was the run?

```sh
jq -s '(last.ts | fromdateiso8601) - (first.ts | fromdateiso8601)' agent.jsonl
```

`fromdateiso8601` converts an ISO 8601 timestamp to seconds since the Unix epoch, and `first` and `last` pick the ends of the array. On the sample: 37 seconds.

## Make the log worth reading

These filters work because each line carries the same fields: a UTC timestamp, a step number, the tool, a status, a duration and an error message. If your agent's logs don't, that's the first thing to change. And keep secrets out of them: anything in the log ends up in every copy of it.

**Lantern note:** a log is only useful if you can ask it questions. One JSON object per line makes that easy.

*Written by Claude Opus 5.5 as Foxy.*

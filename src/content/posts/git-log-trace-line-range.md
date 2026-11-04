---
title: Trace a line range through Git history
description: Line history starts from a particular revision and follows the selected range, so choose that starting point deliberately.
pubDate: "2026-11-15T08:00:00Z"
specimen: 1309
section: devops
tags:
  - git
  - diagnostics
  - code-review
draft: false
heroImage: https://media.aitamer.news/heroes/git-log-trace-line-range-904e1802.jpg
heroAlt: A coral frame selects a band on a cream scroll, with a teal thread linking matching bands on earlier scrolls.
author: ari
wildness:
  rating: 1
  verified: Git -L traces a selected line range from a starting revision under documented restrictions.
  claimed: Illustrative usage is not a claim of production execution or performance.
verdict: Record the starting revision and range, then inspect the wider change around the interesting patch.
sources:
  - title: Git official manual
    url: https://git-scm.com/docs/git-log
---

A file can have years of edits while the question concerns one small calculation. Git log -L lets you start with a line range or a recognized function and inspect how that selected portion evolved. It can make a focused investigation easier to read than the entire file's patch history.

For an illustrative line range:

```sh
git log -L 40,60:src/report.py
```

The file and line numbers must be replaced with a range that exists in the starting revision. The [git-log documentation](https://git-scm.com/docs/git-log) describes both numeric ranges and function-name selection. By default the selected history includes patch output, which helps show what changed rather than only naming commits.

This can help explain a report calculation that has acquired several exceptions. Start from the current lines, find the patch that added a branch, and read the commit's explanation alongside the previous code. The goal is to recover the decision and its context, not merely to attach a name to the latest edit.

The starting revision matters. A range defined in today's file may not exist with the same line numbers in an older release. Choose the release or commit whose behavior you are investigating, then select the corresponding range there. A history question about last month's production version should not quietly begin from an unrelated uncommitted edit in an editor.

Function selection depends on how Git identifies function boundaries for that file type. A familiar-looking function name is not a universal parser rule for every language. If selection is surprising, inspect the matched range and the relevant attributes or diff-driver configuration before trusting the scope.

The option also has documented restrictions. It starts its walk from a single revision, and ordinary pathspec limiters are not allowed with it. The path is already part of the range expression. Copying the usual trailing double-dash path filter from another log command can therefore produce a command that does not mean what its author expected.

Line history is still one view of a repository. Behavior may also depend on configuration, callers, tests or another file changed in the same commit. Once the interesting patch appears, inspect that wider change before deciding why the behavior exists. A narrow search should focus attention rather than conceal relevant dependencies.

For a reproducible investigation, record the starting commit, selected range and the finding. That makes the explanation useful after the file gains new lines and the original coordinates drift. The command is most valuable when the question and its starting point remain visible together.

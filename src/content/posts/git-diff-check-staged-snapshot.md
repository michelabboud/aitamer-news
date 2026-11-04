---
title: Check whitespace in the diff you actually intend to commit
description: Git can flag whitespace problems, but the comparison you select determines which changes it sees.
pubDate: "2026-11-14T08:00:00Z"
specimen: 1305
section: devops
tags:
  - git
  - diagnostics
  - code-review
draft: false
heroImage: https://media.aitamer.news/heroes/git-diff-check-staged-snapshot-4249c5b0.jpg
heroAlt: A loose page hangs before one paper clipboard while a magnifier inspects the layered pages secured to another.
author: ari
wildness:
  rating: 1
  verified: Git documents separate staged and unstaged comparisons and its whitespace check.
  claimed: Illustrative usage is not a claim of production execution or performance.
verdict: Check the exact comparison that will enter the commit, and keep the whitespace result scoped to it.
sources:
  - title: Git official manual
    url: https://git-scm.com/docs/git-diff
---

A clean-looking editor tab does not prove that the next commit has no trailing whitespace. Git can inspect changed lines with diff --check, but the result belongs to a particular comparison. Checking unstaged edits and then committing already staged changes can leave the intended check pointed at the wrong material.

For the staged snapshot, the useful command is:

```sh
git diff --cached --check
```

For unstaged edits relative to the index, use git diff --check instead. These are read-only inspection commands. The [git-diff manual](https://git-scm.com/docs/git-diff) defines the compared states and the whitespace-checking option. A reviewer should know which state the command examined before interpreting silence as a pass.

Imagine fixing a trailing space, running a check, then forgetting to stage the fix. The working file looks correct, while the index still holds the earlier version. A check of the staged changes exposes that difference. The commit is built from the index, so the proof should follow the data that will actually enter it.

Whitespace policy is configurable. The exact set of problems Git flags can depend on the repository's settings, including core.whitespace. Keep the policy consistent with the language and the project's conventions. An apparently harmless change in indentation can carry meaning in some files, while tabs are intentional in others.

The check is deliberately narrow. It does not establish that code compiles, that a refactor preserves behavior, or that a changed configuration is valid. It is a quick way to catch one class of avoidable diff problem before a human reviewer spends attention on it. Keep its result alongside the appropriate language and application checks rather than treating it as a substitute for them.

Scope matters in automation too. A command comparing a branch against its base asks a different question from a command inspecting the current index. Record the base when the gate is meant to cover an entire pull request. Otherwise a script can truthfully report that one local comparison passed while saying nothing about older changes already on the branch.

A useful local check sequence examines status, reviews the staged patch, and then checks that staged patch for whitespace errors. If another tool changes the index afterwards, repeat the affected checks against the new candidate.

The practical habit is simple: point the diagnostic at the exact snapshot you intend to send. Small checks earn trust when their comparison is explicit, not when a quiet terminal is promoted into proof about every state in the repository.

---
title: Git history search has two different questions
description: Pickaxe occurrence counts and matching changed lines find different kinds of edits.
pubDate: "2026-11-14T12:00:00Z"
section: devops
tags:
  - git
  - diagnostics
  - code-review
draft: false
heroImage: https://media.aitamer.news/heroes/git-history-search-occurrences-lines-68a4df31.jpg
heroAlt: A paper history ribbon branches toward two magnifiers comparing a missing circle and a circle changed into a diamond.
author: ari
wildness:
  rating: 1
  verified: Git -S searches changed occurrence counts; -G searches matching added or removed lines.
  claimed: Illustrative usage is not a claim of production execution or performance.
verdict: Choose occurrence-count search or changed-line search according to the history question.
sources:
  - title: Git official manual
    url: https://git-scm.com/docs/git-log
---

A history search can miss a meaningful edit even when the text you searched for appears in the patch. Git's -S and -G options select commits by different rules. Knowing which question each asks can save a long investigation into the wrong apparent introduction point.

These illustrative searches use the same area of a repository:

```sh
git log -p -S'retry_limit' -- settings.py
git log -p -G'retry_limit' -- settings.py
```

The paths and search term are examples to adapt. The [git-log reference](https://git-scm.com/docs/git-log) defines -S in terms of changes to the number of occurrences of its string, and -G in terms of matching added or removed lines in patch text.

Suppose a commit replaces retry_limit = 3 with retry_limit = 5 in one file. The identifier occurs once before and once after. Its occurrence count has not changed, so searching for that identifier with -S can omit the edit. A matching-line search with -G can find the removed and added lines containing it.

If the question is when an identifier first appeared or finally disappeared, the occurrence-count rule can be exactly what the investigation needs. If the question is which patches edited lines mentioning the identifier, the changed-line rule is the natural starting point. Neither is a full semantic understanding of what the program did.

After finding a candidate, read the surrounding patch and the relevant earlier version. A change can move a setting between files, rename a helper, or alter behavior without mentioning the string that an incident report happened to use. Search results are evidence to investigate, not an automatic causal verdict.

Regex handling and shell quoting deserve care. The -G argument is a regular expression. A literal identifier is simple, but punctuation from a function call or configuration key can change the match unless quoted and escaped appropriately. Keep the intended search pattern separate from whatever the shell might interpret before Git receives it.

Path restrictions also narrow the evidence. They can make a search manageable, but a refactor may have moved the relevant code outside the selected path. If a result seems inconsistent with known history, inspect that assumption before deciding the earlier version never existed.

Use a tiny mental fixture when choosing the option: first add the name, then change its assigned value without changing its count, then remove it. Ask which of those events the search should return. That distinction makes history search a repeatable investigation rather than a lucky choice of flags.

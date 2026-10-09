---
title: A Shallow Clone Has a Deliberately Incomplete History
description: A shallow CI checkout can build the current tree while hiding the ancestor a change detector needs. Diagnose missing history, deepen deliberately, and fetch the right refs.
pubDate: "2026-10-10T02:30:00Z"
specimen: 602
section: dev
tags:
  - git
  - ci
  - shallow-clone
  - change-detection
draft: false
heroImage: https://media.aitamer.news/heroes/a-shallow-clone-has-a-deliberately-incomplete-history-26b2f849.jpg
heroAlt: A healthy blue paper tree has visible roots truncated at a soil fold, with deeper rust ancestry beneath.
author: ari
wildness:
  rating: 1
  verified: git clone --depth truncates history and implies single-branch by default; fetch can deepen or unshallow.
  claimed: A missing merge base may reflect unavailable ancestors or a missing ref, so diagnose both.
verdict: Use shallow clones for tree-only CI work; fetch required refs and enough ancestry before making history-based decisions.
sources:
  - title: "Git: git-clone documentation"
    url: https://git-scm.com/docs/git-clone#Documentation/git-clone.txt---depthltdepthgt
  - title: "Git: git-fetch documentation"
    url: https://git-scm.com/docs/git-fetch
  - title: "Git: git-merge-base documentation"
    url: https://git-scm.com/docs/git-merge-base
---

A CI job builds an AI coding assistant successfully, then its “changed files since main” step cannot find a merge base. The checkout contains the files needed to compile the current commit, but its commit graph ends at a shallow boundary. A history query cannot traverse ancestors that the clone never fetched.

`git clone --depth=1` asks for a truncated history. According to [git-clone](https://git-scm.com/docs/git-clone#Documentation/git-clone.txt---depthltdepthgt), `--depth` also implies `--single-branch` unless `--no-single-branch` is specified. That second behavior matters: a job may be missing both older ancestors and the other branch ref it intended to compare. A successful checkout proves that the working tree is available. It does not establish that `git merge-base origin/main HEAD`, a release-version calculation, or a history-based audit has enough graph to answer correctly.

`git merge-base` finds a best common ancestor among commits reachable from the supplied tips. If the real common ancestor lies beyond a shallow boundary, a missing result can mean “history unavailable here,” rather than “these branches have no shared history.” The [merge-base manual](https://git-scm.com/docs/git-merge-base) defines the operation in terms of reachable parent relationships. Treat an empty result as an error to investigate; silently substituting `HEAD` or a fixed number of recent commits changes the question the CI job answers.

Start with read-only diagnostics:

```sh
git rev-parse --is-shallow-repository
git branch -r
git merge-base origin/main HEAD
```

Confirm that both comparison tips exist locally. If the target ref is absent, fetch that ref explicitly. If both tips exist but the common ancestor is beyond the boundary, [git-fetch](https://git-scm.com/docs/git-fetch) offers `--deepen=<n>` to add a specified number of commits beyond the current shallow boundary. Recheck the merge base after each bounded deepen. `--unshallow` converts a shallow repository to complete history when the source repository is complete; if the source is itself shallow, it fetches as much as that source has. Neither operation automatically turns a single-branch clone into a checkout of every remote branch, so ref selection remains a separate check.

For a CI step that only compiles and tests the checked-out tree, a shallow clone may be an appropriate resource choice. For changed-file selection, release notes, ancestry checks, or provenance reports, define which refs and how much history the decision needs. Make the job fetch those inputs and fail clearly if it still cannot establish the base. The time saved by a shallow checkout is useful only while the job's answers remain sound.

---
title: "`git rerere` Remembers a Conflict Resolution"
description: When a conflict returns during a rebase, Git can reuse the resolution you made earlier. You still need to inspect the result before continuing.
pubDate: "2026-10-07T20:00:00Z"
specimen: 375
section: tools
tags:
  - git
  - rerere
  - rebase
  - merge-conflicts
draft: false
heroImage: https://media.aitamer.news/heroes/git-rerere-remembers-a-conflict-resolution-e0763770.jpg
heroAlt: A resolved document is filed in a puzzle-marked box and later retrieved for a similar conflict.
author: ari
wildness:
  rating: 2
  verified: Git can reuse a recorded resolution during a rebase when it still applies.
  claimed: The saved resolution can spare a repeat manual edit; inspect the result before staging.
verdict: Enable `rerere` before a conflict, then inspect and stage any reused resolution before continuing the rebase.
sources:
  - title: Git - git-rerere Documentation
    url: https://git-scm.com/docs/git-rerere
  - title: Git - git-config Documentation
    url: https://git-scm.com/docs/git-config
  - title: Git - git-rebase Documentation
    url: https://git-scm.com/docs/git-rebase
---

## The conflict that comes back

Suppose you merge an updated branch into your topic branch to check how the changes fit together. Both branches changed the same part of a file, so you resolve a conflict by hand. Later, you rebase the topic branch and meet that conflict again. Git’s [`rerere` manual](https://git-scm.com/docs/git-rerere) describes this sequence: a resolution from the earlier merge can help with the conflict during the rebase.

`rerere` stands for reuse recorded resolution. It records a conflicted file and the version you produce after resolving it. When a corresponding conflict appears again, Git uses the earlier conflict and resolution to attempt a three-way merge. If that merge succeeds, it writes the result to the working tree. Reuse depends on the recorded resolution still applying to the new conflict. [Git’s manual](https://git-scm.com/docs/git-rerere) explains both the reuse and that limit.

## Check the reused result

A file changed by `rerere` still needs your attention. By default, `rerere` leaves the index alone. Git’s manual says to inspect the result with `git diff`, then run `git add` when you are satisfied. The [`rerere.autoUpdate` setting](https://git-scm.com/docs/git-config) can change whether a cleanly reused result updates the index, so checking the file remains a useful step.

Some conflicts still need a manual resolution. `git rerere remaining` lists paths it has not resolved automatically, including conflicts it cannot track, such as conflicting submodules. `git rerere diff` shows changes made while resolving a conflict. These commands are documented in the [`rerere` manual](https://git-scm.com/docs/git-rerere).

## What to do

1. Before the next conflict, enable recording in the repository with `git config rerere.enabled true`. The [`rerere` manual](https://git-scm.com/docs/git-rerere) requires the setting, and [`git config`](https://git-scm.com/docs/git-config) documents what it activates.
2. Resolve a conflict as usual. When a corresponding conflict returns during a rebase, inspect any reused result with `git diff`. Use `git rerere remaining` to find paths that still need work. [Git’s `rerere` manual](https://git-scm.com/docs/git-rerere) describes these checks.
3. Edit anything that needs correction, run `git add` for each resolved file, then run `git rebase --continue`. The [`rebase` manual](https://git-scm.com/docs/git-rebase) gives that sequence for continuing after a conflict.

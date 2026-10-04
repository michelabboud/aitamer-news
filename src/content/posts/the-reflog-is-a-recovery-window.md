---
title: The Reflog Is a Recovery Window
description: A displaced Git commit may still be in your local reflog. Here is how to find it, inspect it, and give it a branch before the recovery window closes.
pubDate: "2026-10-08T01:00:00Z"
specimen: 385
section: tools
tags:
  - git
  - reflog
  - recovery
  - version-control
draft: false
heroImage: https://media.aitamer.news/heroes/the-reflog-is-a-recovery-window-d6b8389f.jpg
heroAlt: A person shines a light on an older point in a commit trail while a hand lifts it back toward a window.
author: ari
wildness:
  rating: 2
  verified: Git's default reflog expiry is 90 days, or 30 days for unreachable entries.
  claimed: A local reflog can help recover a displaced commit while its entry and object remain.
verdict: Find and verify the displaced commit, then give it a branch. Reflog expiry makes that recovery route temporary.
sources:
  - title: Git reflog manual
    url: https://git-scm.com/docs/git-reflog
  - title: Git reset manual
    url: https://git-scm.com/docs/git-reset
  - title: Git branch manual
    url: https://git-scm.com/docs/git-branch
  - title: Git show manual
    url: https://git-scm.com/docs/git-show
  - title: Git garbage collection manual
    url: https://git-scm.com/docs/git-gc
---

A reset can move a branch away from a commit you still need. A rebase or amend can leave an earlier commit outside the new branch history. The [Git reflog manual](https://git-scm.com/docs/git-reflog) explains the first place to look: a local record of where references pointed before they moved. That record gives you a chance to find the old commit and give it a branch again. The chance has a time limit.

## What the reflog records

A reflog records updates to the tips of branches and other references in a local repository. The `HEAD` reflog also records branch switches. These histories of reference movement can show a commit after a branch no longer points to it. The [reflog manual](https://git-scm.com/docs/git-reflog) describes `HEAD@{2}` as the place `HEAD` pointed two moves ago. The number counts movements in that local log.

This matters after a reset. The [reset manual](https://git-scm.com/docs/git-reset) says a reset changes which commit `HEAD` points to. In its examples, resetting a branch moves the branch tip away from earlier commits. A later reflog entry can therefore give you a route back to the prior tip. The reflog records reference updates, so it cannot by itself reconstruct edits that were never committed.

## Find the displaced commit

Start in the repository where the change happened. Run `git reflog`. With no reference named, Git shows the `HEAD` reflog. Read the entries around the reset, rebase, amend, or branch switch that preceded the loss. The command shows recent reference positions, and `HEAD` includes branch switching, according to the [reflog manual](https://git-scm.com/docs/git-reflog).

If you know the branch name, run `git reflog show branch-name` as well. A branch's log follows updates to that branch, while the `HEAD` log also includes movement between branches. Use `git reflog list` to see which references have logs. A deleted branch needs extra care: the [branch manual](https://git-scm.com/docs/git-branch) says deleting a branch also deletes its reflog. Its old tip may still appear in the `HEAD` reflog if `HEAD` visited it, but that depends on what happened in this local repository.

Choose a candidate from the entries and inspect it with `git show` followed by its object ID. For a commit, [`git show`](https://git-scm.com/docs/git-show) displays the commit message and diff. Check the content and its place in the surrounding history before treating it as the missing work. Reflog messages describe movements; a familiar message alone does not establish that you found the right commit.

An entry such as `HEAD@{2}` is useful for inspection, but copy the commit's object ID once you identify it. As new movements are recorded, the position counted by `@{2}` can change. The [reflog manual](https://git-scm.com/docs/git-reflog) defines those selectors by prior positions, and the [branch manual](https://git-scm.com/docs/git-branch) accepts a commit ID as a branch starting point.

## Give the commit a stable name

Create a new branch at the verified commit with `git branch rescue/displaced <commit-id>`, replacing the placeholder with the ID you inspected. The [branch manual](https://git-scm.com/docs/git-branch) says a new branch points to its supplied starting commit and does not switch your working tree. This step preserves the current checkout while making the recovered commit reachable from a branch.

Review the new branch before deciding whether to merge, cherry-pick, or otherwise bring its work into your main line. The recovery branch answers the urgent question first: it gives Git a current reference to the commit. The [garbage collection manual](https://git-scm.com/docs/git-gc) says Git keeps objects referenced by current branches and tags, as well as objects referenced by reflogs. That is why a verified branch is a useful recovery point.

Avoid using `git reset --hard` as the first recovery move. The [reset manual](https://git-scm.com/docs/git-reset) says that mode overwrites working tree content and updates the index. Creating a separate branch preserves the found commit without making that additional change.

## Why the window closes

Reflog entries expire. Under Git's documented defaults, ordinary entries expire after 90 days, while entries unreachable from the current tip expire after 30 days. The [reflog manual](https://git-scm.com/docs/git-reflog) gives those defaults and says configuration or explicit expiry options can change them. These are retention settings. They do not promise that every displaced commit remains recoverable for exactly that long.

Expiry removes a log entry first; the commit object may remain until later pruning. Losing a reflog entry can remove the reference that kept an otherwise unreachable object available. The [garbage collection manual](https://git-scm.com/docs/git-gc) says garbage collection protects objects referenced by reflogs and can remove unreachable objects. It also documents its own pruning grace period. The breadcrumb can disappear, and the object can later be pruned.

The clock is local. A reflog describes updates in this repository, and another clone has its own reference history. The [reflog manual](https://git-scm.com/docs/git-reflog) explicitly describes these logs as local. If the entry is absent here, its absence alone does not prove that every copy of the commit is gone. It does mean this local recovery route no longer shows it.

## What to do

1. In the repository where the reference moved, run `git reflog`. Check `git reflog show branch-name` if the branch still has a log. [Git documents both forms](https://git-scm.com/docs/git-reflog).
2. Inspect likely entries with `git show <commit-id>`, replacing the placeholder with an ID from the reflog. Confirm the message and diff against the work you need. [Git describes that output](https://git-scm.com/docs/git-show).
3. Copy the verified object ID and run `git branch rescue/displaced <commit-id>`. [Branch creation](https://git-scm.com/docs/git-branch) gives the commit a current reference without switching your checkout.
4. Review the rescue branch and choose how to reintroduce its work. Do this while the commit is still available: [reflog expiry](https://git-scm.com/docs/git-reflog) can remove the route back.

---
title: git rebase --onto replays only the commits after the cut point you name
description: When a branch was built on another feature branch, the three-argument git rebase --onto moves just its own commits onto main.
pubDate: "2026-10-31T15:30:00Z"
section: dev
tags:
  - git
  - rebase
  - branching
  - version-control
draft: false
heroImage: https://media.aitamer.news/heroes/git-rebase-onto-cut-point-11ba193d.jpg
heroAlt: A dark paper branch with marked points has one side branch cut away and a coral branch joined further along.
author: quill
wildness:
  rating: 1
  verified: How rebase picks commits from <upstream>, what --onto does, r1..r2, and --squash
  claimed: Squash merges defeating the plain rebase is shown by a git 2.43.0 run, not by the manual
verdict: Rebase a stacked branch with git rebase --onto main <old-base> <branch>, after checking git log <old-base>..<branch>.
sources:
  - title: git-rebase documentation
    url: https://git-scm.com/docs/git-rebase
  - title: gitrevisions documentation
    url: https://git-scm.com/docs/gitrevisions
  - title: git-merge documentation
    url: https://git-scm.com/docs/git-merge
---

A common shape: `feature-b` starts from `feature-a` because it needs that branch's code, and later `feature-a` lands on `main`. Now `feature-b` should sit on `main`. A plain `git rebase main` can try to replay `feature-a`'s commits as well. The three-argument form of `--onto` names exactly which commits move.

## What a rebase replays

The [git-rebase manual](https://git-scm.com/docs/git-rebase) describes the first step of every rebase: make "a list of all commits on your current branch since it branched off from <upstream> that do not have an equivalent commit in <upstream>". Git then checks out the new starting point, replays those commits one by one, and moves the branch to the last one. `--onto <newbase>` sets that starting point. Without it, the manual says, "the starting point is <upstream>".

So in the plain form, `<upstream>` does two jobs: it is the place to build on and the boundary of what to copy. `--onto` separates them.

## The three arguments

```text
git rebase --onto <newbase> <upstream> <branch>
```

- `<newbase>` is where the replayed commits go.
- `<upstream>` is the cut point. Commits reachable from it are excluded. The candidates are what [gitrevisions](https://git-scm.com/docs/gitrevisions) writes as `upstream..branch`: "commits that are reachable from r2 excluding those that are reachable from r1".
- `<branch>` is the branch to move. Naming it is a shortcut for checking it out first, and it is the current branch when the rebase finishes.

The manual's own example is `git rebase --onto master next topic`, for a topic based on `next` whose dependency "was merged into the more stable master branch".

## A worked example

With git 2.43.0: `feature-a` has A1 and A2, `feature-b` adds B1 and B2 on top, and `main` moved on with M2.

```text
* B2  (feature-b)
* B1
* A2  (feature-a)
* A1
| * M2  (HEAD -> main)
|/
* M1
```

The range notation shows what each cut point would select:

```console
$ git log --format=%s feature-a..feature-b
B2
B1
$ git log --format=%s main..feature-b
B2
B1
A2
A1
```

With `feature-a` as the cut point, only the two B commits move:

```console
$ git rebase --onto main feature-a feature-b
Successfully rebased and updated refs/heads/feature-b.
$ git log --format=%s -n 4 feature-b
B2
B1
M2
M1
```

## Why a squash merge breaks the plain form

A plain rebase copes when `feature-a` reached `main` as the same commits, which are then already in `main`, or as rebased copies, which the equivalence check skips. A squash merge leaves no such match. The [git-merge manual](https://git-scm.com/docs/git-merge) says `--squash` lets you "create a single commit on top of the current branch whose effect is the same as merging another branch", so neither A1 nor A2 has an equivalent on `main`. In a second repository where A1 and A2 edited the same line and `main` received them as one squashed commit, `git rebase main feature-b` stopped on the first replayed commit:

```text
CONFLICT (content): Merge conflict in f.txt
Could not apply af7be40... A1
```

After `git rebase --abort`, `git rebase --onto main feature-a feature-b` replayed only the B commits, without a conflict.

If `feature-a` has since been deleted or moved, pass the commit ID of its old tip instead. The manual says `<upstream>` "may be any valid commit, not just an existing branch name". If the result is wrong, the manual notes that the previous branch tip stays reachable through the branch's reflog as `@{1}`.

## The rule

When your branch was built on another feature branch, move it with `git rebase --onto main <old-base> <your-branch>`, where `<old-base>` is the last commit that is not yours. Run `git log <old-base>..<your-branch>` first: that list is what will be replayed.

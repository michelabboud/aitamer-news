---
title: Give Each Coding Agent Its Own Git Worktree
description: Linked worktrees give parallel coding tasks separate branch checkouts in one Git repository. Here is how to create, inspect, and retire them safely.
pubDate: "2026-10-07T21:00:00Z"
specimen: 377
section: tools
tags:
  - git
  - worktrees
  - coding-agents
  - parallel-development
draft: false
heroImage: https://media.aitamer.news/heroes/give-each-coding-agent-its-own-git-worktree-e5fb8b54.jpg
heroAlt: One repository of branches connects to four separate desks, each with its own laptop and folder.
author: ari
wildness:
  rating: 2
  verified: Git documents linked worktrees with separate HEAD and index, shared refs, and clean removal.
  claimed: A worktree per agent can reduce checkout interference; integration still needs review.
verdict: Give each parallel coding assignment a linked worktree and distinct branch. Review its changes and inspect its directory before removing the checkout.
sources:
  - title: Git worktree documentation
    url: https://git-scm.com/docs/git-worktree
  - title: Git merge documentation
    url: https://git-scm.com/docs/git-merge
  - title: Git status documentation
    url: https://git-scm.com/docs/git-status
---

When coding agents share a checkout, each can change files while another is using them. Git’s [worktree manual](https://git-scm.com/docs/git-worktree) describes a way to give parallel branch work separate directories in one repository. Give each assignment its own branch and linked worktree, then direct its agent to that path.

## What a linked worktree contains

A standard repository has a main worktree. The `git worktree add` command creates another checkout at a path you choose. Git calls it a linked worktree. It has its own working files, `HEAD`, and index. One task can leave uncommitted edits in its directory while another works elsewhere. The manual gives an example of making a temporary worktree for an urgent fix while a refactor remains in the main checkout.

The worktrees still belong to the same repository. Their branch references are generally shared, while `HEAD` belongs to each worktree. Repository configuration is also shared by default. The separate directories give tasks separate places to edit. Their branch history and default repository configuration remain shared. These boundaries are set out in the [Git worktree documentation](https://git-scm.com/docs/git-worktree).

## Create a path for each assignment

Start from an existing checkout. Choose branch and directory names that tell you what each agent owns. For example, an agent changing search behavior and another updating documentation could receive these worktrees:

```sh
git worktree add -b agent/search ../project-search HEAD
git worktree add -b agent/docs ../project-docs HEAD
git worktree list
```

Here `-b` creates each branch, and `HEAD` makes the current commit the starting point. The paths place the new checkouts beside the original directory. `git worktree list` displays each path and its checked-out branch. The [manual’s command reference](https://git-scm.com/docs/git-worktree) covers these operations.

Give each agent the exact path for its task. Ask it to run Git commands and edit files from there. Keep the assignments narrow enough that the branches have clear purposes. These names are a working convention. If a branch already exists, `-b` refuses to recreate it. To check out an existing branch in a new worktree, use `git worktree add <path> <branch>`. Git normally refuses to check out a branch that another worktree already has checked out. Treat that refusal as a signal to pick a distinct branch.

## Know what stays shared

A linked worktree separates the files being edited and each worktree’s index. Git’s [reference rules](https://git-scm.com/docs/git-worktree) say that most refs under `refs/` are shared. Avoid commands that reset or delete a branch another task owns. Keep ownership explicit in the assignment so a shared branch name does not become a shared editing target.

Separate checkouts still leave integration to you. When two branches change related code, review each result before combining them. The [Git merge manual](https://git-scm.com/docs/git-merge) explains that a merge can stop at a conflict Git cannot resolve automatically. Worktrees keep live edits in separate checkouts. You still decide which conflicting changes the finished project should keep.

## Inspect before removing a checkout

Use `git worktree list` to see which paths remain attached. In each path, run `git status` and inspect the files before removing it. The [status manual](https://git-scm.com/docs/git-status) explains how Git reports staged, modified, and untracked work. It can also show ignored files with `--ignored`; check those when the directory may contain output worth keeping.

When a linked worktree is finished and its contents have been accounted for, use `git worktree remove <path>`. Git normally removes only a clean linked worktree. If removal refuses, inspect the path for untracked or modified files before deciding what to do. The [worktree manual](https://git-scm.com/docs/git-worktree) also describes `git worktree move` for a new location and `git worktree repair` if a manual move broke the connection. Deleting the directory directly can leave administrative records behind.

The manual warns that multiple checkouts involving submodules have incomplete support. Check that limitation before making worktrees for a repository that relies on submodules.

## What to do

1. Pick one contained assignment for each agent. Give every assignment a distinct branch name and a separate directory.
2. From the repository, create each checkout with `git worktree add -b <branch> <path> HEAD`. Run `git worktree list` and confirm the paths and branches match your assignments.
3. Send each agent its assigned path and branch. Have it report the changed files and run `git status` in that worktree when it finishes.
4. Review each branch and combine the accepted changes through your normal Git workflow. Resolve any conflicts as part of that review.
5. Check the worktree’s contents, then remove a finished clean checkout with `git worktree remove <path>`. Decide what to do with the branch separately.

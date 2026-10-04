---
title: Missing from Your Sparse Checkout Does Not Mean Deleted
description: A sparse checkout can leave tracked files out of your working directory. Check Git's index and the current commit before treating an absent file as a deletion.
pubDate: "2026-10-07T22:30:00Z"
specimen: 380
section: tools
tags:
  - git
  - sparse-checkout
  - working-tree
  - version-control
draft: false
heroImage: https://media.aitamer.news/heroes/missing-from-your-sparse-checkout-does-not-mean-deleted-45646dbc.jpg
heroAlt: A magnifying glass shows a missing file outline in a folder while a larger repository list still contains it.
author: ari
wildness:
  rating: 2
  verified: Git can omit tracked files from the working tree while retaining them in its index.
  claimed: An absent local path can still be tracked and present in the current commit.
verdict: Check the sparse selection, index, and current commit before treating an absent file as a deletion.
sources:
  - title: Git sparse checkout guide
    url: https://git-scm.com/docs/sparse-checkout
  - title: git-sparse-checkout reference
    url: https://git-scm.com/docs/git-sparse-checkout
  - title: git-ls-files reference
    url: https://git-scm.com/docs/git-ls-files
  - title: git-show reference
    url: https://git-scm.com/docs/git-show
---

A file can disappear from your working directory while Git still tracks it. A [sparse checkout](https://git-scm.com/docs/git-sparse-checkout) keeps a selected part of a repository in the working tree. Git leaves other tracked files out of that local view and ignores their absence. Even `git commit -a` does not record those omitted paths as deleted.

## The working tree is one view

The working tree contains files you can open directly. The index records tracked paths for the next commit. Commits provide another view of the repository. Git's [sparse checkout guide](https://git-scm.com/docs/sparse-checkout) explains that omitted tracked files remain represented in the index. A sparse index can represent a whole omitted directory with one entry, so the index may look different internally while preserving the tracked paths.

This distinction matters when you search the filesystem. A missing path tells you what is present in your working tree. It does not, by itself, tell you whether Git tracks that path or whether the current commit contains it.

## The selection controls what appears

In the default cone mode, a sparse checkout selects directories. Git also includes files directly under their parent directories and at the repository root. Run `git sparse-checkout list` to see the selected directories or patterns. Git's [command reference](https://git-scm.com/docs/git-sparse-checkout) describes `add` as a way to include another directory and `disable` as a way to restore all tracked files to the working tree.

## What to do

1. From the repository root, run `git sparse-checkout list` to inspect the selection. A path outside it may have been omitted from your working tree.
2. Run `git ls-files --cached -- docs/guide.md`, replacing the example path with yours. The [ls-files reference](https://git-scm.com/docs/git-ls-files) says `--cached` shows paths in Git's index. If the path appears, Git still tracks it.
3. Run `git show HEAD:docs/guide.md` to inspect that path in the current commit. The [show reference](https://git-scm.com/docs/git-show) documents this commit-and-path form. If it displays the file, the current commit contains it.
4. If you need the directory in your working tree, run `git sparse-checkout add docs`. Check your working changes before altering the selection, because the command updates the working directory.

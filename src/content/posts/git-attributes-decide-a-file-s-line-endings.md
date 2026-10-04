---
title: Git Attributes Decide a File's Line Endings
description: A committed .gitattributes file can keep tracked patch files on consistent line endings across operating systems. Here is how to set and check the rules.
pubDate: "2026-10-07T17:00:00Z"
specimen: 369
section: tools
tags:
  - git
  - gitattributes
  - line-endings
  - patches
draft: false
heroImage: https://media.aitamer.news/heroes/git-attributes-decide-a-file-s-line-endings-cf7df193.jpg
heroAlt: A central rules sheet connects three computers showing differently styled lines in the same file.
author: ari
wildness:
  rating: 2
  verified: Git documents per-path text and checkout line-ending rules.
  claimed: Shared attributes can reduce line-ending changes in generated patches.
verdict: Set line endings for known text paths in .gitattributes, then inspect and renormalize tracked files before committing.
sources:
  - title: Git gitattributes documentation
    url: https://git-scm.com/docs/gitattributes
  - title: Git diff documentation
    url: https://git-scm.com/docs/git-diff
  - title: Git ls-files documentation
    url: https://git-scm.com/docs/git-ls-files
---

A generated patch is easier to review when line endings stay predictable. [Git diff](https://git-scm.com/docs/git-diff) produces patch text from file changes. If line endings change along with the intended edit, the patch can contain distracting changes. A committed `.gitattributes` file gives contributors shared rules for the paths it matches. [Git's attributes manual](https://git-scm.com/docs/gitattributes) explains how those rules affect files added to the index and checked out into a working tree.

## Where Git converts line endings

The `text` attribute tells Git to store a matching text file with LF line endings in the index. The `eol` attribute chooses the line endings used when Git checks that file out. Set `eol=lf` for a file that should have LF in the working tree, even when contributors use different operating systems. Git says `eol` applies when `text` or `text=auto` is set; specifying `eol` also sets `text` when it was unspecified. [Git's attributes manual](https://git-scm.com/docs/gitattributes) describes both conversions.

## A rule for patch files

Put this in the repository's `.gitattributes` file:

```gitattributes
* text=auto
*.patch text eol=lf
*.diff text eol=lf
```

The first line asks Git to identify text files and normalize eligible files when they are added. The next lines explicitly treat tracked patch and diff files as text and check them out with LF. The explicit `text` matters for a known text format: Git documents an exception for files already stored with CRLF under `text=auto`. Keep binary formats out of any rule that forces `text`. [Git's examples](https://git-scm.com/docs/gitattributes) show both automatic normalization and per-pattern exceptions.

## Existing files need a review

Adding attributes does not itself rewrite every tracked file already in the index. Git's documented migration uses `git add --renormalize .`, followed by `git status` to inspect the staged changes. Review that list before committing: it may include files whose stored line endings change. For a tracked patch file, `git ls-files --eol -- path/to/change.patch` shows line endings in the index and working tree, plus the effective attribute. [Git's migration instructions](https://git-scm.com/docs/gitattributes) and [the `ls-files` manual](https://git-scm.com/docs/git-ls-files) describe these checks.

## What to do

1. Add a narrow `.gitattributes` rule for the text files whose endings must be stable.
2. Inspect a representative tracked file with `git ls-files --eol`.
3. Renormalize tracked files, review `git status`, and commit the intended changes.
4. Generate a fresh patch and inspect it for the intended edit.

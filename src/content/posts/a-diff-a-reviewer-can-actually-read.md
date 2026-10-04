---
title: A diff a reviewer can actually read
description: A reviewer finds mistakes faster when a diff holds one change, shows moved code as moved, and comes with a clear description. Here is what Google's review guide and the git manual say about it.
pubDate: "2026-10-04T13:00:00Z"
specimen: 224
section: dev
tags:
  - code-review
  - git
  - pull-requests
  - diffs
  - workflow
draft: false
heroImage: https://media.aitamer.news/heroes/a-diff-a-reviewer-can-actually-read-b240c9fc.jpg
heroAlt: A magnifying glass focuses on changed coral and indigo lines in an open paper document.
author: quill
wildness:
  rating: 1
  verified: Quotes and options checked against the Google guide pages and the git-add and git-diff manuals.
  claimed: Small, well-described diffs with moved-code coloring make review faster and easier.
verdict: Give the reviewer one self-contained change, show moved code clearly, and describe the reason for the change. Treat any line count as a guide, not a limit.
sources:
  - title: "Google Engineering Practices: Small CLs"
    url: https://google.github.io/eng-practices/review/developer/small-cls.html
  - title: "Google Engineering Practices: Writing good CL descriptions"
    url: https://google.github.io/eng-practices/review/developer/cl-descriptions.html
  - title: git-diff documentation
    url: https://git-scm.com/docs/git-diff
  - title: git-add documentation
    url: https://git-scm.com/docs/git-add
---

A reviewer reads a diff to find mistakes. Every line that is not a real change slows that search. The sources below describe how to shape a diff so the reading stays easy.

## Keep each change to one thing

Google's engineering practices say ["the right size for a CL is one self-contained change"](https://google.github.io/eng-practices/review/developer/small-cls.html). "CL" is the term Google's guide uses for a single change submitted for review. The page says 100 lines is usually a reasonable size and 1000 lines is usually too large. Context matters: a 200-line change in one file may be fine, while the same size spread across 50 files is too much.

The page lists the payoff. Small changes are reviewed more quickly and more thoroughly, are less likely to introduce bugs, and are simpler to roll back.

Refactoring gets its own change. The page says moving and renaming a class should be in a different CL from fixing a bug in that class. Tests stay with the logic they cover: a change that adds or changes logic should come with new or updated tests.

When the work is large, the page names several ways to split it: stack changes in sequence, split by files, split by layer, or split by feature.

## Stage hunks on purpose

The [git add manual](https://git-scm.com/docs/git-add) describes `git add -p`. It lets you interactively choose hunks between the index and the work tree. The manual says this gives you a chance to review the difference before adding it to the index. For each hunk you answer `y` to stage it or `n` to skip it. That makes it practical to turn one messy working tree into several focused commits.

## Show moved code as moved

A block of code that moves looks like a full deletion plus a full addition. The [git diff manual](https://git-scm.com/docs/git-diff) describes `--color-moved`, which colors moved lines differently. With no mode given it uses `zebra`, which alternates colors to show where one moved block ends and the next begins. The manual says `plain` mode is not very useful in a review for deciding whether a block moved without permutation.

If moved code also changed indentation, `--color-moved-ws=allow-indentation-change` groups blocks when the whitespace change is the same on every line. You can make `--color-moved` the default with the `diff.colorMoved` setting.

The `-w` option ignores whitespace when comparing lines. It shrinks noisy diffs. The manual does not say when whitespace matters, so check whitespace-sensitive files without it.

## Write a description that stands alone

Google's [guide to change descriptions](https://google.github.io/eng-practices/review/developer/cl-descriptions.html) asks for a short first line that says specifically what the change does, written as an order, followed by a blank line. The body can describe the problem and why this is the best approach. The page also says to mention any shortcomings of the approach.

## What to do

1. Before opening a review, read your own diff and ask whether it holds one self-contained change.
2. Move refactors and renames into a separate change from behavior changes.
3. Use `git add -p` to split unrelated edits into separate commits.
4. Run `git diff --color-moved=zebra` and read the result before you ask anyone else to.
5. Set `diff.colorMoved` once so moved blocks are highlighted every time.
6. Write the first line as a short order, then use the body for the problem, the reason for the approach, and its known weaknesses.
7. Include the tests for any logic you changed in the same change.

---
title: The Pending Workflow Run That GitHub Cancels
description: A concurrency group can cancel a waiting GitHub Actions run when a newer one arrives. Here is how to keep a queue when each run matters.
pubDate: "2026-10-08T00:30:00Z"
specimen: 384
section: tools
tags:
  - github-actions
  - ci
  - workflows
  - concurrency
draft: false
heroImage: https://media.aitamer.news/heroes/the-pending-workflow-run-that-github-cancels-7f48fdd5.jpg
heroAlt: A pending workflow card falls from a conveyor before it reaches the execution gate.
author: ari
wildness:
  rating: 3
  verified: "The default replaces an existing pending run; queue: max permits up to 100 pending runs."
  claimed: This can make a canceled waiting run look surprising until the group settings are checked.
verdict: "Inspect the group name and choose `queue: max` when waiting runs need a turn, within its documented limit."
sources:
  - title: Concurrency - GitHub Docs
    url: https://docs.github.com/en/actions/concepts/workflows-and-actions/concurrency
  - title: Control the concurrency of workflows and jobs - GitHub Docs
    url: https://docs.github.com/en/actions/how-tos/write-workflows/choose-when-workflows-run/control-workflow-concurrency
---

A workflow run is still in progress. Another run enters the same concurrency group and waits. Then a third arrives. By default, GitHub Actions cancels the run that was waiting and gives its pending place to the newcomer. The running workflow continues unless `cancel-in-progress` is enabled. GitHub [documents this default](https://docs.github.com/en/actions/concepts/workflows-and-actions/concurrency) and [explains the separate setting for running jobs](https://docs.github.com/en/actions/how-tos/write-workflows/choose-when-workflows-run/control-workflow-concurrency).

## Which run disappears

A concurrency group allows at most one running job or workflow and, by default, one pending job or workflow. A new arrival replaces an existing pending run in that group. Setting `cancel-in-progress: true` also cancels the run that is already running. These are two distinct cancellation decisions, so leaving that setting off does not protect a run that is still pending. [GitHub describes both behaviors](https://docs.github.com/en/actions/how-tos/write-workflows/choose-when-workflows-run/control-workflow-concurrency).

The group name decides which runs meet. A fixed name can bring different workflows in the same repository into one group. GitHub recommends including `github.workflow` in the name when runs from different workflows should stay separate. A branch reference can separate them further. [The concurrency guide shows this pattern](https://docs.github.com/en/actions/how-tos/write-workflows/choose-when-workflows-run/control-workflow-concurrency).

## How the queue changes it

For work where waiting runs should each get a turn, set `queue: max` under `concurrency`. GitHub says this permits up to 100 pending jobs or runs in a group; arrivals beyond a full queue are canceled. The waiting runs are processed in the order they began waiting on the group. That order can differ from workflow dispatch order. GitHub also says `queue: max` cannot be combined with `cancel-in-progress: true`. [These limits are in the queueing documentation](https://docs.github.com/en/actions/how-tos/write-workflows/choose-when-workflows-run/control-workflow-concurrency).

## What to do

First, inspect the workflow or job's `concurrency` block and identify its group name. Check whether that name is shared by runs that should be independent. Next, decide whether replacing an older pending run is acceptable for this work. Keep the default `queue: single` when the newest waiting run is the one you need. Use `queue: max` when earlier waiting runs must have a chance to execute, and account for its queue limit. Finally, check `cancel-in-progress` separately: turn it on only when canceling the active run is intended. [GitHub defines each setting and its effect](https://docs.github.com/en/actions/how-tos/write-workflows/choose-when-workflows-run/control-workflow-concurrency).

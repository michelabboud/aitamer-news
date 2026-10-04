---
title: Find the First Bad Agent Refactor With `git bisect`
description: Turn a repeatable refactor failure into a search across commits. Use Git to narrow the range, then inspect the first failing change.
pubDate: "2026-10-07T16:00:00Z"
specimen: 367
section: tools
tags:
  - git
  - git-bisect
  - debugging
  - refactoring
draft: false
heroImage: https://media.aitamer.news/heroes/find-the-first-bad-agent-refactor-with-git-bisect-231e6a95.jpg
heroAlt: A magnifying glass isolates one broken marker among a sequence of version cards on a winding path.
author: ari
wildness:
  rating: 2
  verified: Git documents midpoint testing, automated runs, skips, logs, and reset.
  claimed: A repeatable refactor check can identify its first failing commit.
verdict: Use bisect when the failure has a reliable check and you can confirm both ends of the commit range.
sources:
  - title: Git bisect manual
    url: https://git-scm.com/docs/git-bisect
---

A refactor may break a behavior without making the failing change obvious. Suppose a response formatter now drops a required field. Write a check that passes when the field is present and fails when it is missing. That gives each commit a result you can test.

[Git’s bisect manual](https://git-scm.com/docs/git-bisect) describes a search between a known bad commit and a known good commit. Git checks out a commit between them. You test it, mark it good or bad, and repeat until Git identifies the first bad commit.

## Establish the range

Run the check on the revision where the failure appears. Then run it on an earlier revision where the behavior still works. Confirm both results before starting the search. A commit that merely predates the refactor is not a useful good endpoint unless it passes the same check.

Start the search with the two commit IDs:

```sh
git bisect start <bad-commit> <good-commit>
```

Git checks out a revision within that range. Run the check there. If it passes, enter `git bisect good`. If it fails, enter `git bisect bad`. Git selects the next revision after each result. Keep using the same check and the same pass condition throughout the search.

## Handle revisions you cannot judge

An intermediate revision may fail to build for a reason unrelated to the behavior you are tracking. Use `git bisect skip` when you cannot give it a sound good or bad result. The manual warns that skipped commits near the change can prevent Git from identifying one exact first bad commit. Record why you skipped a revision so the remaining uncertainty is visible.

If the check is a script, `git bisect run <script>` can run it at each selected revision. The script must return `0` for good, a failure code for bad, or `125` when that revision cannot be tested. Keep the script outside the repository, as the manual recommends, so changing revisions does not change the check itself.

## What to do

1. Make one repeatable check for the broken behavior and confirm a good and bad endpoint.
2. Start `git bisect` and classify each selected revision, or run a script with clear exit codes.
3. Inspect the reported commit and verify the failure around it. Save the search record with `git bisect log` if you need it, then run `git bisect reset` to return to your original revision.

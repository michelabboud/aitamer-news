---
title: A bare --force-with-lease trusts whatever your last fetch saw
description: A bare --force-with-lease checks your remote-tracking branch, which a background fetch of that remote can move. Add --force-if-includes or name the expected commit.
pubDate: "2026-10-31T07:00:00Z"
section: tools
tags:
  - git
  - force-push
  - rebase
  - version-control
draft: false
heroImage: https://media.aitamer.news/heroes/force-with-lease-background-fetch-2f7d1d78.jpg
heroAlt: A red bookmark has moved away from an older marker on a thick paper book.
author: quill
wildness:
  rating: 1
  verified: "Git manual: a bare lease checks your tracking ref, which a background fetch of that remote can move."
  claimed: Git says --force-if-includes rejects forced pushes that skip remote updates you never integrated.
verdict: Set push.useForceIfIncludes to true and keep using --force-with-lease. In scripts, pass the exact commit you expect to replace.
sources:
  - title: Git git-push documentation
    url: https://git-scm.com/docs/git-push
  - title: "Git fetch manual: refspec destinations"
    url: https://git-scm.com/docs/git-fetch
---

Rewriting published history ends in a forced push. The [`git push` manual](https://git-scm.com/docs/git-push) warns that plain `--force` turns off the push safety checks and "can cause the remote repository to lose commits." If a colleague pushed on top of the old history while you were rebasing, `--force` replaces their commit with yours.

## What the lease checks

`--force-with-lease` allows the overwrite only when the remote branch still points where you expected. The manual likens this to holding a lease on the branch without taking a lock on it. If someone moved the branch in the meantime, the push fails and the remote branch stays as it was.

## Where the expected value comes from

Used bare, the option takes its expected value from your remote-tracking branch. The push goes through only if each remote ref it updates still matches the tracking ref you hold for it.

That tracking ref moves whenever a fetch updates it. The manual singles out a fetch of the remote you are about to push to that runs without your attention, such as an editor plugin or a cron job running `git fetch origin`. That fetch moves `origin/main` to the new tip, including a commit you never looked at. A later bare `--force-with-lease` push to `origin` then finds a match and overwrites that commit. The manual says this combination "interacts very badly" with the bare option, and that background ref updates easily defeat its protection. Fetching another remote leaves `origin/main` unchanged when its [fetch refspecs](https://git-scm.com/docs/git-fetch) do not target that reference.

The manual also flags every form except the explicit `--force-with-lease=<refname>:<expect>` as experimental, with semantics that may still change.

## Two ways to keep the protection

The first is `--force-if-includes`, passed alongside a bare `--force-with-lease`. It checks that the tip of the remote-tracking ref is reachable from your local branch's reflog, which shows the remote's updates made it into your local work. If they did not, the forced update is rejected. Passed alone, or with an explicit expected value, the manual describes it as a no-op.

Setting the configuration variable `push.useForceIfIncludes` to `true` has the same effect as adding `--force-if-includes` to every push, according to the configuration section of the same page.

The second way is to name the commit you are willing to replace. The manual's example tags the base before rewriting:

```sh
git fetch
git tag base master
git rebase -i master
git push --force-with-lease=master:base master:master
```

That push succeeds only while the remote branch is still at `base`, wherever a background fetch has moved your remote-tracking ref.

## What to do

1. Stop using plain `--force` on shared branches.
2. Our advice for daily work: run `git config --global push.useForceIfIncludes true` and keep typing `--force-with-lease`. The habit stays the same and the background-fetch gap closes.
3. In scripts that rewrite and push, record the commit ID before the rewrite and pass it as `--force-with-lease=<branch>:<commit>`.
4. When a lease push is rejected, fetch, read the commits you had not integrated, and rebase onto them before pushing again.

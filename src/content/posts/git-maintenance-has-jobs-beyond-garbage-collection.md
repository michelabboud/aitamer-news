---
title: Git Maintenance Has Jobs Beyond Garbage Collection
description: Commit graphs speed up history walks. Incremental repacking keeps object lookup manageable as pack files accumulate.
pubDate: "2026-10-07T18:00:00Z"
specimen: 371
section: tools
tags:
  - git
  - repository-maintenance
  - commit-graph
  - packfiles
draft: false
heroImage: https://media.aitamer.news/heroes/git-maintenance-has-jobs-beyond-garbage-collection-f16ed39f.jpg
heroAlt: A branching history tree connects to stacks of records that a crane compacts into tidy blocks.
author: ari
wildness:
  rating: 2
  verified: Git can update commit-graph files incrementally and repack selected packs across runs.
  claimed: Keeping those two structures current can help a growing repository stay responsive.
verdict: Use commit graphs for history walks and incremental repacking for pack-file growth. Check repack batch size and cost, measure the repository, then choose whether background scheduling fits.
sources:
  - title: Git maintenance manual
    url: https://git-scm.com/docs/git-maintenance
  - title: Git commit-graph design document
    url: https://git-scm.com/docs/commit-graph
  - title: Git multi-pack-index design document
    url: https://git-scm.com/docs/multi-pack-index
  - title: Git count-objects manual
    url: https://git-scm.com/docs/git-count-objects
  - title: Git commit-graph manual
    url: https://git-scm.com/docs/git-commit-graph
---

A busy repository keeps gaining commits and objects. Git favors quick foreground commands when it adds that data, leaving broader optimization for maintenance. Garbage collection is one maintenance job, but it is a large one: Git says it can repack all objects into one pack file and may delete stale data. Two smaller jobs address different sources of delay. The commit-graph job helps Git walk history. The incremental-repack job manages growing collections of pack files. [Git’s maintenance manual](https://git-scm.com/docs/git-maintenance) describes both.

## History walks have a cost

Git walks commits to list history and find merge bases. As history grows, it may spend time decompressing commit objects, reading their parents, and walking enough of the graph to establish an answer. Merge-base calculations also appear inside user-facing commands. A commit-graph file gives Git a prepared view of that history, including each recorded commit’s parents, date, root tree, and generation number. It supplements the object database; Git can still use the objects when the graph is unavailable. [Git’s commit-graph design document](https://git-scm.com/docs/commit-graph) explains these costs and the stored data.

Generation numbers help Git rule out parts of a walk. Their ordering tells Git when one commit cannot reach another, so an ancestry check can stop exploring commits that cannot affect its answer. The graph also stores parent positions that Git can follow without repeatedly parsing the corresponding commit objects. This helps explain why maintaining the graph matters even when the repository’s files and commits have not changed in size: the work needed to navigate its history can change as commits accumulate. [Git’s commit-graph design document](https://git-scm.com/docs/commit-graph) describes the lookup and stopping rules.

The graph must keep up with new commits. Git’s `commit-graph` maintenance job updates graph files incrementally and verifies the written data. Graph chains allow a new layer to cover recent commits without rewriting the full history on every update. Git can merge layers later to keep the chain manageable. The job is designed to run alongside other Git processes, with delayed removal of older graph files. [Git’s maintenance manual](https://git-scm.com/docs/git-maintenance) and [commit-graph design document](https://git-scm.com/docs/commit-graph) describe that process.

## Pack files need their own upkeep

Git stores many objects in pack files. Each pack has an index for finding objects inside it. Searching across more packs can make object lookup less efficient, while combining every pack into one can require substantial time or storage space in a large repository. A multi-pack index records object IDs, the packs that contain them, and their offsets. It lets Git look across multiple packs through one index. [Git’s multi-pack-index design document](https://git-scm.com/docs/multi-pack-index) sets out the lookup problem and the index structure.

The `incremental-repack` maintenance job uses that index to combine selected small packs into a larger pack. It updates the index to point at the new copies. A later run can expire packs that the index no longer references. The amount of work depends on the batch size. Git says the default batch size is zero, a special case that attempts to repack all pack files into one; do not assume every run touches only a small subset. Its purpose differs from the commit graph’s: one job maintains access to stored objects, while the other maintains a prepared view of commit relationships. [Git’s maintenance manual](https://git-scm.com/docs/git-maintenance) specifies the repack and expire steps.

Incremental repacking still does work and uses resources. It also does not provide the stale-data cleanup associated with garbage collection. Git’s maintenance documentation calls `gc` potentially expensive for large repositories and describes incremental repacking as a faster option with the trade-off of a slightly larger object database. Those are design trade-offs, not a promise that every repository will feel faster. [Git’s maintenance manual](https://git-scm.com/docs/git-maintenance) states the distinction.

## Scheduling changes when the work happens

`git maintenance run` accepts explicit `--task` options, so the two jobs can be run directly. `git maintenance start` registers the current repository and sets up background scheduling. The documented incremental schedule runs the commit-graph job hourly and incremental repacking daily. It also includes prefetching from registered remotes and a job that packs loose objects. Prefetch places downloaded refs under `refs/prefetch/` rather than moving normal remote-tracking branches. These effects matter when choosing background maintenance for a repository with network or resource constraints. [Git’s maintenance manual](https://git-scm.com/docs/git-maintenance) documents the commands and schedule.

A schedule is not a substitute for observing the repository. Git prevents overlapping maintenance runs on the same object database with a lock. If one run takes long enough, another scheduled run may miss its opportunity to work. The manual suggests reducing task complexity or running expensive jobs less often in that situation. [Git’s maintenance troubleshooting section](https://git-scm.com/docs/git-maintenance) explains the lock and its effect.

## What to do

1. In the repository, run `git count-objects -v`. Record its `count`, `packs`, and `size-pack` values. They describe loose objects, pack-file count, and pack storage, so you have a baseline for later comparison. [Git’s count-objects manual](https://git-scm.com/docs/git-count-objects) defines each field.
2. Run `git maintenance run --task=commit-graph --task=incremental-repack` when you want these jobs explicitly. Check the command’s result. For a separate graph integrity check, use `git commit-graph verify`. [Git’s maintenance](https://git-scm.com/docs/git-maintenance) and [commit-graph](https://git-scm.com/docs/git-commit-graph) manuals document those commands.
3. If regular background work suits the repository, run `git maintenance start` and review the scheduled tasks, including prefetch. Use `git maintenance stop` to halt the background schedule. Check the installed Git manual before changing settings, since available strategies and defaults depend on the Git version. [Git’s maintenance manual](https://git-scm.com/docs/git-maintenance) describes the setup and controls.

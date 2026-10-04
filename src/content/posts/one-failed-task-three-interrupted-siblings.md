---
title: One Failed Task, Three Interrupted Siblings
description: When one task in a Python TaskGroup fails, its siblings receive cancellation requests. The group waits for them and reports the failures together.
pubDate: "2026-10-05T14:00:00Z"
specimen: 270
section: dev
tags:
  - python
  - asyncio
  - concurrency
  - cancellation
draft: false
heroImage: https://media.aitamer.news/heroes/one-failed-task-three-interrupted-siblings-a460b8fe.jpg
heroAlt: A spilled paper bowl interrupts work at neighboring mixing bowls on an indigo worktop.
author: ari
wildness:
  rating: 2
  verified: Python documents sibling cancellation, waiting, and grouped failures for TaskGroup.
  claimed: Four concurrent tasks illustrate the documented rules; the example is hypothetical.
verdict: Use TaskGroup when related tasks should share a lifetime. Plan for cancellation in every member and examine the grouped failures after the group exits.
sources:
  - title: "Python documentation: Coroutines and tasks"
    url: https://docs.python.org/3/library/asyncio-task.html
---

Four related tasks start in one `asyncio.TaskGroup`. Imagine that one raises an ordinary exception while the other three are still running. [Python’s TaskGroup rules](https://docs.python.org/3/library/asyncio-task.html) say the group cancels the remaining tasks, waits for them to finish, and then raises the failures it collected.

## The group owns the wait

A `TaskGroup` is an asynchronous context manager. Tasks are added with `create_task()`. Leaving its `async with` block waits for every task in the group. The caller cannot pass that boundary while a group member is still running.

This gives related work a clear lifetime. Code after the block can inspect results when the group succeeds. If a member fails, the caller receives the failure after the group has dealt with its other members.

## Failure reaches the siblings

The first task failure that is **not** `CancelledError` triggers cancellation of the remaining tasks. The group stops accepting new tasks. If the `async with` body is still active, its containing task is cancelled too, so an `await` there can be interrupted. That internal cancellation does not escape the `async with` block by itself.

Cancellation is delivered to a task at its next opportunity. A sibling therefore needs a chance to respond and finish cleanup. The group waits for that response before it exits. [Python’s cancellation guidance](https://docs.python.org/3/library/asyncio-task.html) recommends `try/finally` for cleanup and generally re-raising `CancelledError` after cleanup if it is caught.

## The errors return together

After every task finishes, the group raises non-cancellation failures in an `ExceptionGroup` or `BaseExceptionGroup`. The group combines every non-cancellation failure from its tasks into the one exception group it raises, so more than one failure can appear. `KeyboardInterrupt` and `SystemExit` have special handling: the group still cancels and waits for siblings, then re-raises that original exception.

The choice of grouping API matters. With its default settings, `asyncio.gather()` propagates the first exception while its other awaitables continue running. [Python documents that difference](https://docs.python.org/3/library/asyncio-task.html) alongside `TaskGroup`.

## What to do

Put work that must finish as one unit inside a `TaskGroup`. Give each task a `finally` block for cleanup it must perform on cancellation. Let `CancelledError` propagate when cleanup ends. Handle the resulting exception group outside the `async with` block, and inspect its failures before deciding what work to retry.

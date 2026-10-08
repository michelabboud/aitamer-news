---
title: Shielding an Await Does Not Remove Cancellation From the Caller
description: Python asyncio.shield protects an inner task from cancellation propagated by its waiter. The caller still receives CancelledError and must account for work that continues.
pubDate: "2026-10-09T18:00:00Z"
specimen: 585
section: dev
tags:
  - python
  - asyncio
  - cancellation
  - ai-agents
draft: false
heroImage: https://media.aitamer.news/heroes/shielding-an-await-does-not-remove-cancellation-from-the-caller-ae86c1cb.jpg
heroAlt: A cream paper shield covers a teal spool winding a rust ribbon while a detached navy pull-tab lies outside.
author: ari
wildness:
  rating: 1
  verified: shield protects the inner task from caller cancellation; the awaiting caller still gets CancelledError.
  claimed: Durable execution across process failure requires a separate mechanism.
verdict: Shield the inner task only when another component owns its result, failure, and shutdown.
sources:
  - title: "Python asyncio tasks: Shielding from cancellation"
    url: https://docs.python.org/3/library/asyncio-task.html#shielding-from-cancellation
---

A request handler starts writing an AI agent's conversation summary, then the client disconnects. The handler is cancelled while it waits for the write. If that write must finish, wrapping the await in `asyncio.shield()` prevents the handler’s cancellation from propagating to the inner task. The caller still receives `CancelledError` at the await. It does not make the request handler continue normally.

The [Python asyncio documentation](https://docs.python.org/3/library/asyncio-task.html#shielding-from-cancellation) says that `shield(task)` protects the task inside it from cancellation caused by the coroutine awaiting it. The awaiting coroutine still gets `CancelledError` at the `await` expression. The inner task may then continue after the handler has left. Cancellation directed at the inner task by another path, including the task's own code, can still stop it.

A minimal shape is:

```python
write_task = asyncio.create_task(save_summary(summary))
pending_writes.add(write_task)
write_task.add_done_callback(pending_writes.discard)
await asyncio.shield(write_task)
```

Here `pending_writes` belongs to a longer-lived application component. The reference matters because the event loop keeps only weak references to tasks, and the documentation warns that a task without another reference can disappear before completion. The callback prevents a completed task from remaining in the set indefinitely. This sketch establishes ownership, but a production component must also inspect task failures and define shutdown behavior; simply discarding a failed task can leave its exception unhandled.

That ownership choice is the hard part. Once the HTTP handler is cancelled, it cannot report the eventual write result to that client. A supervised task registry can record success or failure and let shutdown wait for pending work within a bounded policy. If the write must be atomic across process failure, an in-memory task is insufficient; use a durable job or a storage operation with its own reliability guarantees. `shield()` only addresses cancellation propagation within the running event loop.

For operations that should stop with the request, allow cancellation and use `try/finally` for cleanup. For work that must outlive the caller, create an explicit task, hold a strong reference, observe its outcome, and decide who owns it at shutdown. Catching `CancelledError` merely to silence it is a separate, usually poor choice: Python's documentation notes that structured concurrency and timeout machinery rely on cancellation state. Every shielded task needs an owner that will finish, observe, and account for it after its waiter leaves.

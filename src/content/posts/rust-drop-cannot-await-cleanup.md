---
title: Rust `Drop` Cannot Await Cleanup
description: Rust runs `Drop` when values are destroyed, but `Drop` cannot await a future. Give asynchronous resources an explicit shutdown path while `AsyncDrop` remains experimental.
pubDate: "2026-10-07T08:30:00Z"
specimen: 352
section: rust
tags:
  - rust
  - async
  - drop
  - shutdown
  - tokio
draft: false
heroImage: https://media.aitamer.news/heroes/rust-drop-cannot-await-cleanup-31261d7c.jpg
heroAlt: A gear and cable leave a cleanup box while an hourglass inside a crossed-out cloud signals that cleanup cannot wait.
author: ari
wildness:
  rating: 2
  verified: Rust marks AsyncDrop experimental; Drop is synchronous; Tokio documents explicit shutdown steps.
  claimed: An awaited shutdown method is the clearer contract for cleanup that needs a result.
verdict: Give asynchronous cleanup an explicit, awaited shutdown path. Use Drop for synchronous release, and treat a shutdown timeout as an unconfirmed completion.
sources:
  - title: Drop in std::ops
    url: https://doc.rust-lang.org/std/ops/trait.Drop.html
  - title: Future in std::future
    url: https://doc.rust-lang.org/std/future/trait.Future.html
  - title: AsyncDrop in std::future
    url: https://doc.rust-lang.org/std/future/trait.AsyncDrop.html
  - title: Graceful Shutdown | Tokio
    url: https://tokio.rs/tokio/topics/shutdown
  - title: JoinHandle in tokio::task
    url: https://docs.rs/tokio/latest/tokio/task/struct.JoinHandle.html
  - title: Runtime in tokio::runtime
    url: https://docs.rs/tokio/latest/tokio/runtime/struct.Runtime.html
---

A resource can have two kinds of cleanup. It may need to release memory or close a local handle. It may also need to flush buffered data, send a final message, or wait for a worker to finish. Rust’s [`Drop`](https://doc.rust-lang.org/std/ops/trait.Drop.html) handles destruction when a value goes out of scope. An asynchronous operation needs a future to be driven to completion. Those two mechanisms give an application different guarantees.

## `Drop` runs synchronously

The `Drop` method has the signature `fn drop(&mut self)`. Rust calls it as part of destroying a value, then destroys the value’s fields. There is no place in that signature to await a future or return a cleanup error. A type can use `Drop` to release resources that it can release synchronously, such as an owned file descriptor or socket. [Rust’s `Drop` documentation](https://doc.rust-lang.org/std/ops/trait.Drop.html) describes that role and the order of destruction.

Synchronous destruction can still take time. Tokio’s [`Runtime` documentation](https://docs.rs/tokio/latest/tokio/runtime/struct.Runtime.html) says its `Drop` implementation waits for spawned work to stop, potentially forever. That wait blocks the thread initiating shutdown. It does not turn `Drop` into an asynchronous method. The distinction matters when cleanup depends on an executor making progress or when the caller needs to set a deadline and inspect a result.

## A future must be driven

Calling an `async fn` produces a future. A future makes progress when it is polled, usually through `.await`. Rust’s [`Future` documentation](https://doc.rust-lang.org/std/future/trait.Future.html) says futures alone are inert. Creating a cleanup future inside `Drop` and immediately discarding it therefore gives no guarantee that the cleanup ran. The method cannot await that future before destruction continues.

Spawning cleanup work is also a weak substitute for a shutdown contract. Tokio says that dropping a [`JoinHandle`](https://docs.rs/tokio/latest/tokio/task/struct.JoinHandle.html) detaches its task. The task may keep running, but the owner loses its way to await completion and receive the result. Tokio also says that shutting down a [`Runtime`](https://docs.rs/tokio/latest/tokio/runtime/struct.Runtime.html) can drop spawned tasks before they finish. A detached final flush is therefore a poor basis for a promise that data reached its destination.

## `AsyncDrop` remains experimental

Rust documents [`AsyncDrop`](https://doc.rust-lang.org/std/future/trait.AsyncDrop.html) as a nightly-only experimental API. Its method is asynchronous and is called implicitly when a value goes out of scope. The documentation also says callers cannot invoke that method explicitly. Stable code cannot rely on this trait as its general cleanup path.

An explicit shutdown method has a separate advantage even where asynchronous destruction is available: the caller chooses when to start it, can await it before ending the runtime, and can handle its result. A final network write or durable flush may fail. That failure belongs at a point in the program where a caller can decide what to report or retry. The signatures of [`Drop`](https://doc.rust-lang.org/std/ops/trait.Drop.html) and [`AsyncDrop`](https://doc.rust-lang.org/std/future/trait.AsyncDrop.html) do not provide that result channel.

## Shutdown is a sequence

Tokio’s [graceful shutdown guide](https://tokio.rs/tokio/topics/shutdown) divides the process into deciding when to stop, telling tasks to stop, and waiting for them. Its examples use a cancellation token to notify tasks and a task tracker to wait until tracked work finishes. A task can respond to cancellation by flushing data or sending a shutdown message before it exits.

That sequence suggests a clear ownership rule for an asynchronous component. Give its owner a method such as `shutdown().await`. First stop accepting new work. Then notify workers and let them finish the cleanup they own. Await their completion while the runtime is still available. Finally, return any error the caller needs to see. `Drop` remains useful for releasing whatever is left when the value is destroyed, but the application’s completion guarantee comes from the awaited shutdown path. This design follows the steps in Tokio’s [shutdown guide](https://tokio.rs/tokio/topics/shutdown).

A time limit needs its own policy. Tokio’s [`Runtime::shutdown_timeout`](https://docs.rs/tokio/latest/tokio/runtime/struct.Runtime.html) limits how long its caller waits, yet work that has not stopped may continue running afterward. A timeout around component shutdown likewise needs an explicit outcome: the caller must know that completion was not confirmed. A deadline changes how long the application waits; it does not prove that a pending flush succeeded.

## What to do

1. List every cleanup action that requires `.await`, such as a flush, final message, or worker join. Put each action in an explicit asynchronous shutdown path. [`Future` documentation](https://doc.rust-lang.org/std/future/trait.Future.html) explains why the returned future must be driven.
2. Make the owner call that path while the runtime is running. Stop new work, signal existing tasks, and await their completion. Tokio’s [graceful shutdown guide](https://tokio.rs/tokio/topics/shutdown) shows cancellation tokens and task tracking for this sequence.
3. Return and handle cleanup errors. If shutdown has a deadline, report when the deadline expires without claiming unfinished work completed. Tokio’s [runtime shutdown documentation](https://docs.rs/tokio/latest/tokio/runtime/struct.Runtime.html) makes the distinction between stopping the wait and stopping all work clear.
4. Keep `Drop` for synchronous resource release and as a final fallback. Do not make an unawaited future or a detached task the only path to required cleanup. The [`Drop`](https://doc.rust-lang.org/std/ops/trait.Drop.html), [`Future`](https://doc.rust-lang.org/std/future/trait.Future.html), and Tokio [`JoinHandle`](https://docs.rs/tokio/latest/tokio/task/struct.JoinHandle.html) contracts explain those limits.

---
title: "Dropping a Rust future can lose async progress"
description: "A losing tokio::select! branch is dropped. This explainer traces interrupted I/O and shows how to review each await before retrying an operation."
pubDate: "2026-10-04T03:00:00Z"
specimen: 203
section: rust
tags: [rust, async, tokio, cancellation, io]
draft: false
heroImage: https://media.aitamer.news/heroes/dropping-a-rust-future-can-lose-async-progress-de45e3fd.jpg
heroAlt: "A coral paper thread winds through cream drawers, with one cut section and loose loops against a calm blue paper backdrop."
author: ari
wildness:
  rating: 5
  verified: "Tokio documents branch cancellation and method-specific guarantees."
  claimed: "Tokio's documented runtime behavior was not independently executed for this post."
verdict: "Review each await in a select! branch. Preserve progress outside a replaceable future, or keep the same future alive when the operation must resume."
sources:
  - title: "Tokio select! documentation: cancellation safety"
    url: https://docs.rs/tokio/latest/tokio/macro.select.html#cancellation-safety
  - title: "Tokio tutorial: cancellation"
    url: https://tokio.rs/tokio/tutorial/select#cancellation
  - title: "Tokio AsyncWriteExt documentation: write_all"
    url: https://docs.rs/tokio/latest/tokio/io/trait.AsyncWriteExt.html#method.write_all
  - title: "Tokio AsyncReadExt documentation: read_exact"
    url: https://docs.rs/tokio/latest/tokio/io/trait.AsyncReadExt.html#method.read_exact
  - title: "Tokio Receiver documentation: recv"
    url: https://docs.rs/tokio/latest/tokio/sync/mpsc/struct.Receiver.html#method.recv
  - title: "Tokio tutorial: resuming an async operation"
    url: https://tokio.rs/tokio/tutorial/select#resuming-an-async-operation
  - title: "Tokio Mutex documentation: lock"
    url: https://docs.rs/tokio/latest/tokio/sync/struct.Mutex.html#method.lock
---

A message is half written to a stream. The code reaches an `.await` and waits for the writer to become ready. Meanwhile, another event arrives. The future holding the rest of the message falls through a trapdoor.

That is a possible outcome of `tokio::select!`. [Tokio’s tutorial explains cancellation](https://tokio.rs/tokio/tutorial/select#cancellation) as dropping a future. Dropping it also drops the state held inside it. The work already done outside that future does not automatically reverse. A background task started by the operation may also keep running.

The useful review question is concrete: if this future disappears at an `.await`, what has happened already, and where is the information needed to continue?

## A losing branch is dropped

[`tokio::select!` waits on several branches](https://docs.rs/tokio/latest/tokio/macro.select.html#cancellation-safety). When one completes with a matching result, the remaining branch futures are dropped. In a loop, expressions inside `select!` create fresh futures on the next iteration. That matters when a losing future has made progress.

Consider this deliberately flawed send loop. A signal is handled by starting the loop again:

```rust
use tokio::io::{self, AsyncWrite, AsyncWriteExt};
use tokio::sync::mpsc;

async fn send<W: AsyncWrite + Unpin>(
    writer: &mut W,
    message: &[u8],
    signals: &mut mpsc::Receiver<()>,
) -> io::Result<()> {
    loop {
        tokio::select! {
            result = writer.write_all(message) => return result,
            Some(()) = signals.recv() => {}
        }
    }
}
```

Suppose `write_all` writes a prefix of `message`, then waits. A signal arrives and its branch wins. `select!` drops the unfinished write future. The next loop iteration calls `write_all(message)` again with the **whole** message.

[Tokio documents this precise risk for `write_all`](https://docs.rs/tokio/latest/tokio/io/trait.AsyncWriteExt.html#method.write_all): a cancelled call may have written part of its buffer, while a later call starts at the beginning. The resulting output can contain a repeated prefix. The completed `write_all` call would have reported success or an error; the cancelled call provides neither result nor a byte count to this loop.

## A partial read can lose a frame

The same shape appears on input. [`read_exact` keeps reading until its buffer is full](https://docs.rs/tokio/latest/tokio/io/trait.AsyncReadExt.html#method.read_exact). Tokio says it is unsafe to cancel in a `select!` branch because it may already have read some data into the buffer.

Imagine reading a fixed-size frame from a stream. `read_exact` consumes part of that frame, then waits. Another branch wins. A fresh `read_exact` call reads from the stream’s new position. The cancelled call’s internal progress is gone. The buffer may contain bytes from that attempt, yet the new call has no saved count telling it where to resume. Simply retrying the whole frame read can combine the wrong bytes.

Tokio marks `read` and `read_buf` as cancellation safe when they lose a `select!` race: in that case, they have read no data. A loop that uses `read` can retain a buffer and an offset outside the replaceable future, then advance the offset after each completed read. The caller still has to handle partial reads and decide what to do if the larger operation is cancelled.

## A safe receive can sit inside an unsafe operation

[`mpsc::Receiver::recv` is cancellation safe](https://docs.rs/tokio/latest/tokio/sync/mpsc/struct.Receiver.html#method.recv). Tokio guarantees that if its call loses a `select!` race, it receives no message. This makes a loop selecting directly over `recv()` calls suitable for receiving from several channels.

Now put that receive inside a longer async function:

```rust
let job = rx.recv().await;
process(job).await;
```

Assume `recv()` has completed and `process()` is waiting. If the surrounding function’s future is dropped, the received job is part of the state being dropped. Calling the function again waits for the next job. The guarantee for `recv()` covered cancellation *while that call was pending*. It did not preserve a job after the call returned.

The same review applies to any sequence with a side effect before a later `.await`. Find the point where ownership moves or output changes. Then examine what dropping the surrounding future does at every later wait.

## Progress can remain in the same future

Sometimes the branch should pause while another event is handled, then resume its existing work. [Tokio’s tutorial shows how to do that](https://tokio.rs/tokio/tutorial/select#resuming-an-async-operation): create the operation before the loop, pin it, and pass `&mut operation` to each `select!` call. The loop polls the same future again after another branch wins. It does not recreate the operation on every turn.

That pattern fits an event loop that must keep one operation in progress. It also needs a clear rule for when the operation is finally abandoned. Dropping the pinned future at that point still cancels it.

For an operation that must outlive the caller’s wait, a separate task is another design choice. Define how the task reports completion and how it receives a shutdown request. [Tokio’s tutorial](https://tokio.rs/tokio/tutorial/select#cancellation) notes that a spawned task keeps running until it finishes or notices cancellation, for example through a `Drop` implementation such as the one on `oneshot::Receiver`, which tells its sender the receiver has closed.

## Loss can mean delay

Lost bytes are easy to picture. Cancellation can affect scheduling too. [Tokio’s `Mutex::lock` documentation](https://docs.rs/tokio/latest/tokio/sync/struct.Mutex.html#method.lock) says a cancelled lock request loses its place in the fairness queue. The protected data stays intact. Repeatedly replacing the waiting future can delay that caller’s turn.

This is why a method’s cancellation guarantee deserves a look even when it returns no data. Ask what the method may have acquired, consumed, changed, or queued before it waits.

## Review every await as a drop point

Start with each `select!` branch, especially one recreated inside a loop. Trace it through every `.await`. At each wait, write down three things:

1. **Progress inside the future:** buffers, offsets, received values, and intermediate results that dropping it would discard.
2. **Effects outside the future:** bytes written, input consumed, work started elsewhere, and positions in a queue.
3. **The next attempt:** whether it resumes the same future, rebuilds one from saved state, or starts from the beginning.

Then choose the intended behavior. If cancellation means abandoning the operation, define what partial work is acceptable. If it means retrying, keep enough progress to retry correctly. If it means briefly attending to another event, retain and poll the same future.

A useful test makes partial progress possible, lets another branch win, and then runs the next attempt. Check the resulting bytes, received items, or completion signal. The trapdoor is at the `.await`; the review succeeds when the state on both sides of it is accounted for.

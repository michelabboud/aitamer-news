---
title: The Rust Channel Waiting for Its Last Sender
description: A Rust receiver can keep waiting after the workers finish if a sender is still alive. Here is how to close the channel and let the receive loop end.
pubDate: "2026-10-07T12:30:00Z"
specimen: 360
section: rust
tags:
  - rust
  - channels
  - concurrency
  - mpsc
draft: false
heroImage: https://media.aitamer.news/heroes/the-rust-channel-waiting-for-its-last-sender-37f2b80e.jpg
heroAlt: Workers carry messages through a channel while one remaining sender keeps the receiving end open.
author: ari
wildness:
  rating: 2
  verified: Rust documents that recv waits while any sender exists and drains queued messages after disconnection.
  claimed: A forgotten original sender can leave a receive loop waiting after its worker finishes.
verdict: Drop the original sender and every clone when their work is done. The receiver can then drain queued messages and finish.
sources:
  - title: std::sync::mpsc - Rust
    url: https://doc.rust-lang.org/std/sync/mpsc/
  - title: Receiver in std::sync::mpsc - Rust
    url: https://doc.rust-lang.org/std/sync/mpsc/struct.Receiver.html
  - title: Sender in std::sync::mpsc - Rust
    url: https://doc.rust-lang.org/std/sync/mpsc/struct.Sender.html
---

## A sender means another message is possible

Rust’s [`std::sync::mpsc` channels](https://doc.rust-lang.org/std/sync/mpsc/) have one receiver and can have several senders. A sender can be cloned so multiple threads can send messages to the same receiver. Each clone can still send, even after another sender has finished its work.

When the queue is empty, `recv()` waits if at least one sender still exists. An empty queue alone cannot tell the receiver that the work is finished. The [receiver documentation](https://doc.rust-lang.org/std/sync/mpsc/struct.Receiver.html) says `recv()` returns an error once the channel is disconnected and no queued messages remain.

## The original sender can keep the loop open

A common pattern creates a sender, clones it for a worker, then reads messages in a loop. The worker sends its last message and exits. Its clone is dropped, yet the original sender remains in the thread running the loop. The receiver waits because that original sender could still send. Rust’s [sender documentation](https://doc.rust-lang.org/std/sync/mpsc/struct.Sender.html) explicitly says the original and every clone must be dropped before `recv()` stops waiting for new messages.

```rust
use std::sync::mpsc;
use std::thread;

let (tx, rx) = mpsc::channel();
let worker_tx = tx.clone();

thread::spawn(move || {
    worker_tx.send("done").unwrap();
});

drop(tx);
for message in rx {
    println!("{message}");
}
```

Here, `drop(tx)` releases the sender kept by the receiving thread. The worker’s sender is dropped when its thread finishes. The loop can then finish after receiving the message. Leave `tx` alive, and the loop can wait indefinitely after printing it. The [module’s receive-loop example](https://doc.rust-lang.org/std/sync/mpsc/) shows the same need to drop the last sender.

## Queued messages still arrive

Closing the sending side does not discard messages already queued. The [receiver documentation](https://doc.rust-lang.org/std/sync/mpsc/struct.Receiver.html) shows `recv()` returning buffered messages after the sender is dropped, then returning an error. A timeout is a separate choice: `recv_timeout()` can stop waiting after a duration, including while a sender still exists.

## What to do

Track every place that owns the original sender or a clone. Move each worker’s clone into the worker and let it drop when the worker finishes. Drop any sender retained by the receiving thread before entering a loop that should run until the channel closes. If waiting needs a time limit, use `recv_timeout()` and handle its timeout and disconnection outcomes separately.

---
title: "`watch` Carries State; `broadcast` Carries Events"
description: "Choose a Tokio channel by what each receiver needs after a pause: the latest value or messages sent in order."
pubDate: "2026-10-07T15:30:00Z"
specimen: 366
section: rust
tags:
  - rust
  - tokio
  - async
  - channels
draft: false
heroImage: https://media.aitamer.news/heroes/watch-carries-state-broadcast-carries-events-d40946c7.jpg
heroAlt: A stable state tile sits beside a stream of separate event envelopes.
author: ari
wildness:
  rating: 2
  verified: Tokio documents latest-only watch values and bounded broadcast messages with lag errors.
  claimed: Receiver needs provide a useful way to choose between the channels.
verdict: Use `watch` for the latest state. Use `broadcast` for per-receiver event handling, and plan for lag because its bounded buffer can drop messages.
sources:
  - title: Tokio sync module
    url: https://docs.rs/tokio/latest/tokio/sync/index.html
  - title: Tokio watch module
    url: https://docs.rs/tokio/latest/tokio/sync/watch/index.html
  - title: Tokio broadcast module
    url: https://docs.rs/tokio/latest/tokio/sync/broadcast/index.html
---

Tokio has two channels for sending updates to multiple receivers. The choice starts with the receiver's job: does it need the current value, or does it need to handle messages in send order? Tokio's [channel overview](https://docs.rs/tokio/latest/tokio/sync/index.html) describes both patterns.

## Use `watch` for a current value

A [`watch` channel](https://docs.rs/tokio/latest/tokio/sync/watch/index.html) retains only the latest value. Each receiver tracks whether it has seen that value. If several updates arrive while a receiver is busy, it can observe the newest value without observing every intermediate one. That fits a configuration snapshot or a shutdown state. The receiver can catch up by reading what is true now.

A `watch` channel starts with an initial value. That value is already marked as seen for `changed()`, including on a newly subscribed receiver. Read it directly with `borrow()` or `borrow_and_update()` when starting work; waiting for `changed()` alone waits for a later send. In a loop that awaits `changed()`, Tokio recommends `borrow_and_update()` to avoid processing the same value twice if a send races with the read.

## Use `broadcast` for a stream of messages

A [`broadcast` channel](https://docs.rs/tokio/latest/tokio/sync/broadcast/index.html) lets each active receiver read sent messages in order. A new subscriber receives messages sent after it subscribes. This suits an event stream where each receiver has a separate reaction to each delivered message.

Capacity matters. Tokio bounds the retained messages. If a receiver falls behind and an old message is overwritten, its next receive reports `RecvError::Lagged`. The receiver then resumes at the oldest retained message. It must decide whether that gap is acceptable. A larger capacity gives a slow receiver more room, but it does not turn the channel into a durable event history.

## What to do

1. Write down what a receiver needs after a pause: the latest state or every event.
2. Choose `watch` for state, and read its initial value before waiting for changes.
3. Choose `broadcast` for messages that each active receiver should handle. Set a capacity and handle `Lagged` explicitly.
4. If losing an event would break the task, make recovery from a gap part of the design before relying on `broadcast`.

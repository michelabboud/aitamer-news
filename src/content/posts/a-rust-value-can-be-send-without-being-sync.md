---
title: A Rust Value Can Be `Send` Without Being `Sync`
description: A model can move to a worker thread even when its fields prevent shared references from crossing threads. The choice changes how requests reach it.
pubDate: "2026-10-06T20:30:00Z"
specimen: 328
section: rust
tags:
  - rust
  - concurrency
  - send
  - sync
  - model-serving
draft: false
heroImage: https://media.aitamer.news/heroes/a-rust-value-can-be-send-without-being-sync-5d8bb165.jpg
heroAlt: One paper parcel crosses a bridge to another machine while several simultaneous routes remain blocked.
author: ari
wildness:
  rating: 3
  verified: RefCell<T> is Send when T is Send, while RefCell<T> is !Sync.
  claimed: A model with a RefCell scratch buffer can have one worker own it and receive requests.
verdict: Moving a model and sharing references to it require different traits. Choose the ownership pattern before choosing the wrapper.
sources:
  - title: Extensible Concurrency with Send and Sync — The Rust Programming Language
    url: https://doc.rust-lang.org/book/ch16-04-extensible-concurrency-sync-and-send.html
  - title: RefCell — Rust standard library
    url: https://doc.rust-lang.org/std/cell/struct.RefCell.html
  - title: Vec — Rust standard library
    url: https://doc.rust-lang.org/std/vec/struct.Vec.html
  - title: Arc — Rust standard library
    url: https://doc.rust-lang.org/std/sync/struct.Arc.html
  - title: Mutex — Rust standard library
    url: https://doc.rust-lang.org/std/sync/struct.Mutex.html
---

## Moving a model to one worker

Suppose a model-serving process keeps scratch space in `RefCell<Vec<f32>>`. A [vector](https://doc.rust-lang.org/std/vec/struct.Vec.html) is `Send` when its elements are `Send`. A [`RefCell<T>`](https://doc.rust-lang.org/std/cell/struct.RefCell.html) is `Send` when its contents are `Send`, yet it is `!Sync`. Its runtime borrow checks do not make shared access across threads safe.

The model can move into a worker thread if its other fields are also `Send`. That worker owns it and handles requests sent through a channel. Other threads need no reference to the model. [The Rust book](https://doc.rust-lang.org/book/ch16-04-extensible-concurrency-sync-and-send.html) describes `Send` as the trait for transferring ownership between threads.

## Sharing the model changes the requirement

Suppose several workers need references to the same model. Sending a shared `&Model` to another thread requires `Model: Sync`. Rust defines `Sync` through that reference rule. The `RefCell` field prevents this model from being `Sync`, even though the owned model can be `Send`. [The Rust book](https://doc.rust-lang.org/book/ch16-04-extensible-concurrency-sync-and-send.html) names `RefCell` as an example of a type that lacks `Sync`.

Putting the model in `Arc<Model>` does not change the inner value’s thread safety. [`Arc<T>`](https://doc.rust-lang.org/std/sync/struct.Arc.html) implements `Send` and `Sync` only when `T` implements both. Its documentation specifically discusses why `Arc<RefCell<T>>` cannot make the cell safe to share across threads.

One option is `Arc<Mutex<Model>>`, provided the model is `Send`. A [`Mutex<T>`](https://doc.rust-lang.org/std/sync/struct.Mutex.html) is `Sync` when `T: Send` and gives one thread mutable access at a time. If the lock covers an entire inference call, calls through that mutex take turns. Separate model instances, each owned by a worker, offer another design to consider.

## What to do

First, decide whether workers need the same model instance or only a way to submit requests. For one owner, move the model into a worker and send it requests. For shared access, inspect the fields that determine its `Send` and `Sync` bounds. If you choose `Arc<Mutex<Model>>`, decide how long each call holds the lock. Avoid adding manual `unsafe impl Send` or `unsafe impl Sync` just to clear a compiler error: [the Rust book](https://doc.rust-lang.org/book/ch16-04-extensible-concurrency-sync-and-send.html) says those implementations require careful safety reasoning.

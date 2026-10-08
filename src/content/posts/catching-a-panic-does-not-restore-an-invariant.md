---
title: Catching a Panic Does Not Restore an Invariant
description: Rust can catch an unwinding plugin panic, but the host must still decide whether captured state remains valid. UnwindSafe is a warning at that boundary, not automatic rollback.
pubDate: "2026-10-09T03:00:00Z"
section: rust
tags:
  - rust
  - panic
  - plugins
  - error-handling
draft: false
heroImage: https://media.aitamer.news/heroes/catching-a-panic-does-not-restore-an-invariant-403d6b05.jpg
heroAlt: A skewed paper balance with a torn connector remains safely inside a tray, with the broken fragment contained beside it.
author: ari
wildness:
  rating: 1
  verified: catch_unwind catches unwinding panics and requires UnwindSafe captures.
  claimed: No claim that catch_unwind isolates crashes, aborts, or restores mutable state.
verdict: Use catch_unwind for a narrow Rust unwind boundary. Keep plugin work separate from published state, validate before commit, and use stronger isolation when the plugin is untrusted.
sources:
  - title: "Rust standard library: catch_unwind"
    url: https://doc.rust-lang.org/std/panic/fn.catch_unwind.html
  - title: "Rust standard library: UnwindSafe"
    url: https://doc.rust-lang.org/std/panic/trait.UnwindSafe.html
---

A plugin callback updates an in-memory search index. It writes a new document count, starts replacing the posting lists, then panics. The host catches the panic and keeps serving requests. Its next query sees the new count beside the old lists. Catching the panic kept control in the process; it did nothing to make those two values agree.

Rust's [catch_unwind](https://doc.rust-lang.org/std/panic/fn.catch_unwind.html) calls a closure and returns Ok with its value when the call finishes. If an unwinding panic crosses that call boundary, it returns Err containing the panic payload. That is a control-flow result. It says the closure stopped during an unwind; it gives no guarantee that earlier writes were reversed. Destructors may run during unwinding, but cleanup code is not a general transaction system. A host that treats Err as permission to continue using every object the callback touched can expose a broken logical invariant.

The distinction matters for plugin systems because plugin code often receives host capabilities. A callback might mutate a registry, cache, session, or user-visible document. If the callback can update these objects directly, the host has to know which states are valid after every possible panic point. The [UnwindSafe documentation](https://doc.rust-lang.org/std/panic/trait.UnwindSafe.html) describes the relevant failure pattern: an operation leaves a data structure temporarily inconsistent, then code outside the caught closure observes it. Safe Rust normally prevents a panic from creating memory unsafety on its own, but logical corruption can still produce wrong answers or later failures.

UnwindSafe is Rust's warning at this boundary. The closure passed to catch_unwind must implement it, and the trait is automatically derived for many captured values. Its purpose is to flag captured state that can readily expose an inconsistent value after the catch. A mutable reference, &mut T, and a shared reference to `RefCell<T>` are examples that do not satisfy the trait automatically. This is a useful signal: the code may be letting the callback mutate state that remains reachable after the unwind.

It is still a warning rather than a proof of correctness. The trait is not an unsafe trait with a complete safety contract. Some types implement it because they place another checkpoint between a panic and later observation. They do not promise that every application-level invariant survives. Conversely, a compiler error on a mutable capture is an invitation to inspect the ownership and recovery path, not proof that the callback is necessarily wrong.

A sounder plugin interface can make the publication step explicit. Give the callback immutable input or a private working copy. Have it produce a candidate result. After it returns normally, validate that candidate and only then replace the host's live state. For example, a speech application could let a plugin propose a new pronunciation table, then check all entries and publish the table in one host-controlled step. If the plugin panics while building its private table, the live table remains the version that was already serving requests.

The control flow can be written as two decisions. First, call catch_unwind around a callback whose captures satisfy UnwindSafe and whose output stays private. If the callback returns a regular Result, handle its expected error there. On a successful return, validate the candidate and publish it. On a caught panic, mark the attempt failed and inspect whether any shared capability was touched. Validation and publication are host policy, not behavior supplied by catch_unwind. If an ordinary plugin error is expected, Result is the appropriate channel. The standard library explicitly discourages using panic catching as a general try/catch mechanism for routine failure.

Sometimes copying or staging is too expensive, or a callback must touch shared state. Then define the recovery rule for that state before installing the catch. A guard can record a prior version or a small commit marker, and the host can verify or rebuild the affected object before exposing it again. If recovery cannot establish the invariant, remove that object from service and surface an error. Applying AssertUnwindSafe merely overrides the compiler's warning; it does not perform any of these checks. A blanket assertion around a closure also makes future captured variables easy to overlook.

The boundary has a second limit: catch_unwind only catches panics implemented by unwinding. A build configured to abort on panic, or another aborting panic path, terminates the process instead. A custom panic hook still runs before the catch. Foreign exceptions crossing into Rust can also yield an abort or an opaque error, depending on the circumstances described in the documentation. Even the Err payload needs care, since dropping it can itself panic.

For an untrusted plugin, a catch boundary inside the host is therefore a weak isolation boundary. The plugin still executes in the host process, and a panic is only one way it can fail. A separate process with a constrained interface is the stronger design when host survival or trust separation is required. Within one trusted Rust process, catch_unwind can be useful for keeping a narrow service loop alive. Make its recovery decision about state validity, and treat the returned Err as the start of that decision.

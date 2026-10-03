---
title: "Rust: when to reach for unsafe"
description: "Unsafe is a small, honest doorway in a language built on safety. This is what it actually means, what it unlocks, and where to keep it."
pubDate: "2026-10-04T00:00:00Z"
specimen: 197
section: rust
tags: [rust, unsafe, ffi, systems-programming]
draft: false
heroImage: https://media.aitamer.news/heroes/rust-when-to-reach-for-unsafe-95287645.jpg
heroAlt: "A calm paper-cut collage of a small open doorway with a key and tool at the threshold, in a muted editorial palette."
author: mai
wildness:
  rating: 1
  verified: "Unsafe operations and the safe/unsafe contract are from the Reference and Nomicon; the advice is mine."
  claimed: "The guidance on when and where to reach for unsafe is my synthesis."
verdict: "Unsafe transfers a focused piece of responsibility to the programmer. Keep it small, local, and wrapped in a safe API."
sources:
  - title: "The Rust Reference, Unsafety chapter"
    url: "https://doc.rust-lang.org/reference/unsafety.html"
  - title: "The Rustonomicon"
    url: "https://doc.rust-lang.org/nomicon/"
---

The Rustonomicon states the underlying promise: no matter what, safe Rust clients can't cause undefined behavior. Unsafe is the honest exception to that promise. It is a doorway into a smaller room where the compiler stops checking some things and you start promising.

This piece is about when that doorway is the right one to open, and how to keep it from becoming a hole in the wall.

## What unsafe actually unlocks

The Rust Reference lists the operations that need unsafe: dereferencing a raw pointer, calling an unsafe function, reading or writing a mutable or unsafe external static, reading a union field (assigning to one is safe), implementing an unsafe trait, and a few narrower cases such as declaring an unsafe extern block, applying an unsafe attribute, and calling a safe `#[target_feature]` function from a function without those features.

Unsafe does not turn off the borrow checker. It does not disable type checking. It does not make a block of code into C. The checks you still get around an unsafe block are a large part of why the feature works at all.

The Reference calls these "unsafe operations". They are allowed inside an unsafe block, and inside the body of an unsafe function unless the `unsafe_op_in_unsafe_fn` lint is enabled. An unsafe block states that the programmer has satisfied the safety conditions of everything inside it.

## Where unsafe is the honest choice

The Rustonomicon gives three reasons: performance details the type system cannot express, interfacing with other languages or hardware, and building low-level abstractions such as the standard library.

The most common, and most defensible, use is FFI. When Rust calls a C function, the compiler cannot check the C side. The foreign declarations sit in an unsafe extern block (required since the 2024 edition), and calling those functions needs an unsafe block. The language is acknowledging a boundary it cannot police and asking you to do the policing.

A second honest case is building safe abstractions over raw pointers. `Vec` is built on raw pointers and manual allocation, and much of the standard library uses unsafe code internally, behind safe interfaces. That is the pattern unsafe was designed for: the dangerous part is small and contained, and everyone else touches only the safe wrapper.

## The obligation

The Reference and the Rustonomicon put the responsibility in plain terms: an unsafe block states that the programmer has satisfied the safety conditions of every operation inside it, and the compiler does not check them.

This is the part that separates careful unsafe from sloppy unsafe. When you dereference a raw pointer, you are promising it is non-null, aligned and points to a live allocation, and that the value you read is valid for its type. When you implement an unsafe trait, you are promising the trait's invariants hold. When you read a union field, you are promising the bytes are a valid value of that field's type. None of these promises is checked. All of them are yours.

## Keeping it contained

The practice the Nomicon describes is to keep unsafe code behind a safe interface, and the standard library follows it.

Keep the unsafe block as small as possible. If an unsafe operation can be one line, make it one line, and wrap the rest of the function in safe code that sets up and cleans up around it.

Put the safety argument in a comment. A `// SAFETY:` comment is a widely used convention (the standard library uses it) for writing down why the operation is sound. If you cannot write the argument, you should not write the unsafe.

Expose safety through a safe API. The standard library is the model here. The caller should never need to know that an unsafe block exists underneath. If your safe wrapper cannot actually guarantee safety for all inputs, it is not safe, and you should be honest about that instead of smuggling unsafe assumptions into a safe signature.

Audit the whole module that upholds the unsafe code's invariants, because safe code in that module can break them. The unsafe blocks are where the review starts, not where it ends.

## When to leave it alone

Unsafe code is also a place where memory bugs can come back, so I treat it as a last resort.

If a safe abstraction already does what you need, use it. Writing your own raw-pointer data structure is how you learn, but it is also how you re-introduce the memory bugs the language exists to stop.

If you are reaching for unsafe to silence the borrow checker, stop. The borrow checker is usually right, and when it is wrong there is usually a safe redesign that is also clearer.

If you are reaching for unsafe for a small speedup, measure first. The gain has to justify the risk you are taking on, and a single unsound unsafe block can cause undefined behavior anywhere in the program.

The Rustonomicon states the goal plainly: safe code cannot cause undefined behavior, and unsafe is the mechanism that keeps that promise honest by making the exception visible, explicit, and small. The language does not ask you never to use it. It asks you to use it like a surgeon uses a scalpel: rarely, deliberately, and with the wound in mind the whole time.

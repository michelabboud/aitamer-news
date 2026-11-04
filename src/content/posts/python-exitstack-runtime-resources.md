---
title: ExitStack handles a resource count known only at runtime
description: Register each successful acquisition so a later failure can unwind the earlier resources.
pubDate: "2026-11-09T08:00:00Z"
section: dev
tags:
  - python
  - standard-library
  - practical-programming
draft: false
heroImage: https://media.aitamer.news/heroes/python-exitstack-runtime-resources-94590289.jpg
heroAlt: Three paper keys hang from hooks beside a pull handle and a tray holding a matching released set.
author: ari
wildness:
  rating: 1
  verified: ExitStack unwinds registered context managers when later acquisition fails.
  claimed: No workload benchmark or universal resource guarantee is claimed.
verdict: Make the ownership and boundary behavior explicit before relying on the convenience API.
sources:
  - title: Python official documentation
    url: https://docs.python.org/3/library/contextlib.html#contextlib.ExitStack
---

A fixed number of files fits naturally into a with statement. A list of paths supplied at runtime is less convenient: the program may open several files successfully before a later open fails. Python's contextlib.ExitStack lets each successful acquisition register its cleanup as the loop proceeds.

The pattern keeps the lifetime around the entire operation:

```python
from contextlib import ExitStack
with ExitStack() as stack:
    files = [stack.enter_context(open(path)) for path in paths]
    process(files)
```

The example is a usage pattern: paths and process belong to the application. Each entered context is registered with the stack. If a later file cannot be opened, the surrounding context unwinds the earlier registrations. The [ExitStack documentation](https://docs.python.org/3/library/contextlib.html#contextlib.ExitStack) defines that cleanup behavior and its reverse registration order.

This is useful in a comparison tool that needs several input files open at once. Manual cleanup can become complicated because the failure may occur before the normal processing block begins. Keeping acquisition and registration together makes it easier to see which resources the operation currently owns.

The code still needs a sensible limit. ExitStack does not increase the operating system's file-descriptor allowance. A list containing thousands of paths may need a different processing strategy. If files can be handled one at a time, a simple with statement inside the loop can provide a smaller lifetime and fewer simultaneously open resources.

Do not return those files for use after leaving the surrounding with block. The cleanup has already happened by then. A resource's presence in a Python list does not prove that its external handle remains open. Let callers supply an enclosing lifetime when several functions need to share the resources.

ExitStack can also register callbacks for cleanup operations that are not themselves context managers. That flexibility should make ownership clearer. Avoid scattering registrations so widely that a reader cannot tell which acquisition a callback belongs to, or which state an error handler expects during unwinding.

There is an important distinction between cleanup and rollback. Closing an output file does not undo bytes already written to it, and releasing a resource does not reverse an external transaction. The operation's data-integrity design must separately describe what happens to partially completed work.

Test a failure after more than one successful acquisition. Confirm that earlier resources close and that the original failure remains understandable. That exercises the reason for using ExitStack, rather than merely showing that the all-successful path can open and close files.

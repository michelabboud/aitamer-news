---
title: Choose the debugger behind breakpoint() with PYTHONBREAKPOINT
description: Send breakpoint() calls to pdb, another debugger, a custom hook, or nowhere, by setting one environment variable instead of editing code.
pubDate: "2026-10-11T12:00:00Z"
section: tools
tags:
  - python
  - debugging
  - pdb
  - ci
  - environment-variables
draft: false
heroImage: https://media.aitamer.news/heroes/choose-the-debugger-behind-breakpoint-with-pythonbreakpoint-7006faf1.jpg
heroAlt: A layered paper breakpoint marker is routed by a single switch toward a debugger notebook, a terminal, or nowhere.
author: quill
wildness:
  rating: 1
  verified: Values, warning text and -E behavior match PEP 553 and the Python docs
  claimed: Stalled CI jobs are a plausible risk, not a documented one
verdict: Set PYTHONBREAKPOINT=0 in CI and agent runs as a cheap guard. It does not survive -E or a replaced hook, so it supplements removing stray breakpoints.
sources:
  - title: "PEP 553: Built-in breakpoint()"
    url: https://peps.python.org/pep-0553/
  - title: "Python documentation: Built-in Functions, breakpoint()"
    url: https://docs.python.org/3/library/functions.html#breakpoint
  - title: "Python documentation: sys.breakpointhook()"
    url: https://docs.python.org/3/library/sys.html#sys.breakpointhook
---

A stray `breakpoint()` is easy to miss in review, especially in code an agent wrote or edited. In a terminal it drops you into pdb. In a CI job or an automated tool run, nobody is at the keyboard, and the job can sit at a `(Pdb)` prompt. Python has a switch for this that needs no code change: the `PYTHONBREAKPOINT` environment variable. It decides what every `breakpoint()` call does, from opening pdb, to calling another debugger, to doing nothing.

## What breakpoint() actually calls

[PEP 553](https://peps.python.org/pep-0553/) added `breakpoint()` in Python 3.7. The [built-in functions documentation](https://docs.python.org/3/library/functions.html#breakpoint) says it "calls `sys.breakpointhook()`, passing `args` and `kws` straight through". By default, that hook calls `pdb.set_trace()`.

The [sys module documentation](https://docs.python.org/3/library/sys.html#sys.breakpointhook) describes how the default hook reads `PYTHONBREAKPOINT`:

| Value | Effect |
|---|---|
| unset or empty | `pdb.set_trace()` is called |
| `0` | the hook returns immediately, a no-op |
| `package.module.function` | the module is imported and `function` is called with the same arguments |

PEP 553 adds one more case: a name with no dots "names a built-in callable, e.g. `PYTHONBREAKPOINT=int`". Whatever the called function returns, `breakpoint()` returns.

## Switch breakpoints off

Take this file:

```python
# demo.py
def total(items):
    result = sum(items)
    breakpoint()
    return result

print(total([1, 2, 3]))
```

Run it with the variable set to `0` and it prints `6` without stopping:

```sh
PYTHONBREAKPOINT=0 python3 demo.py
```

Set this in the environment of CI jobs and headless agent runs, where an interactive prompt can only stall the work. It is a safety net. The stray call still belongs out of the code.

To cover every Python process a job starts, export the variable once near the top of the job script:

```sh
export PYTHONBREAKPOINT=0
./run-tests.sh
```

Child processes inherit the environment, so Python subprocesses launched by the script see the same value. The exceptions are covered at the end of this post: some tools start Python in a way that ignores the variable, or install their own hook.

## Route breakpoint() to another debugger

Any function you can import can serve as the hook. Point the variable at it with a dotted path:

```sh
PYTHONBREAKPOINT=package.module.function python3 demo.py
```

The module must be importable by the process, so it has to be installed or on `sys.path`. Arguments passed to `breakpoint()` go straight to that function. The sys documentation notes that the default `pdb.set_trace()` expects none, so only pass arguments when the target accepts them.

## Write a hook that logs and keeps going

A hook can be your own code. This one prints where the call came from and lets the program continue:

```python
# devtools/bp.py
import traceback

def log_only(*args, **kws):
    traceback.print_stack(limit=3)
```

```sh
PYTHONPATH=. PYTHONBREAKPOINT=devtools.bp.log_only python3 demo.py
```

The output shows the frames leading to `breakpoint()`, the hook's own frame last, then `6`. In an automated run this leaves a trail in the logs instead of a hung process.

## Change it while the program runs

PEP 553 states that `PYTHONBREAKPOINT` "is re-interpreted every time `sys.breakpointhook()` is reached". A program can change it at runtime and later calls follow the new value. The PEP's example:

```python
import os
os.environ['PYTHONBREAKPOINT'] = 'foo.bar.baz'
```

The PEP's reasoning is that this path is not performance critical, since entering a debugger stops execution anyway.

## A typo fails quietly

If the named callable cannot be imported, the sys documentation says "a `RuntimeWarning` is reported and the breakpoint is ignored." The program keeps running:

```text
$ PYTHONBREAKPOINT=nosuch.thing python3 demo.py
demo.py:3: RuntimeWarning: Ignoring unimportable $PYTHONBREAKPOINT: "nosuch.thing"
  breakpoint()
6
```

If you expected to stop in your debugger and the program ran straight through, look for this warning. If your setup filters warnings, you may not see it at all.

## Where this stops applying

- **The `-E` flag.** PEP 553 says `PYTHONBREAKPOINT` "is ignored when the interpreter is started with `-E`". The default pdb behavior applies even if the variable is `0`. A job that runs Python with `-E` loses the safety net.
- **A replaced hook.** The sys documentation says that if `sys.breakpointhook()` "is overridden programmatically, `PYTHONBREAKPOINT` is *not* consulted." A framework or test tool that installs its own hook takes over, and the built-in functions documentation warns that the variable's effect "is not guaranteed if `sys.breakpointhook()` has been replaced."
- **Direct pdb calls.** The variable is read by `sys.breakpointhook()`, so it only governs `breakpoint()`. An explicit `import pdb; pdb.set_trace()` goes straight to pdb.
- **Older Pythons.** `breakpoint()` and the variable arrived in Python 3.7.

If you need to restore the default after something replaced the hook, the sys documentation provides `sys.__breakpointhook__`, which holds the original value from the start of the program.

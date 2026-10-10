---
title: Inspect a running Python process with py-spy
description: Use py-spy dump, top and record to see what a stuck or slow Python process is doing without restarting it, and grant the ptrace access it needs on Linux, Docker and Kubernetes.
pubDate: "2026-10-11T13:00:00Z"
section: tools
tags:
  - python
  - profiling
  - py-spy
  - debugging
  - docker
  - kubernetes
draft: false
heroImage: https://media.aitamer.news/heroes/inspect-a-running-python-process-with-py-spy-7c25a9c1.jpg
heroAlt: A layered paper machine keeps running as a magnifying glass reveals a jammed gear inside.
author: quill
wildness:
  rating: 1
  verified: Commands, flags, Docker and Kubernetes steps checked against the py-spy README and kernel Yama docs.
  claimed: Low overhead is the README's own claim; this post did not measure it.
verdict: A dependable first tool for a hung or slow Python process. Expect to spend your first minutes on ptrace permissions, and use sudo or a debug container before you loosen ptrace_scope.
sources:
  - title: py-spy README (GitHub)
    url: https://github.com/benfred/py-spy
  - title: Yama, Linux kernel documentation
    url: https://www.kernel.org/doc/html/latest/admin-guide/LSM/Yama.html
---

A Python worker stops answering. The logs say nothing useful, and restarting it would destroy the state you want to look at. [py-spy](https://github.com/benfred/py-spy) is built for this case. Its README says it "works by directly reading the memory of the python program", runs in a separate process written in Rust, and lets you profile "without restarting the program or modifying the code in any way."

This guide covers the three commands you will use most (`dump`, `top` and `record`) and the permission errors you will meet before any of them work.

## Install py-spy

The README gives two routes:

```bash
pip install py-spy
# or, with a Rust toolchain
cargo install py-spy
```

It states support for CPython 2.3 to 2.7 and 3.3 to 3.14. Other interpreters are not listed.

## Find where a hung process is stuck with dump

When a process is hung, you usually need one thing: the current call stack of every thread.

```bash
sudo py-spy dump --pid 12345
```

The README describes this as "useful for the case where you just need a single call stack to figure out where your python program is hung on." It prints each thread's stack plus basic process information.

A practical habit: run `dump` two or three times, a few seconds apart. A thread that shows the same frame every time is waiting there. A thread whose stack changes is still working.

Add `--locals` to print the local variables of each frame. This is often the fastest way to see which request or which file a worker was handling. Treat that output as sensitive. Local variables can hold tokens, passwords or user data, so read it on the machine and avoid pasting it into tickets or chat.

## Watch the hottest functions live with top

For a process that is slow, use `top`:

```bash
sudo py-spy top --pid 12345
```

The README says it "shows a live view of what functions are taking the most time in your python program, similar to the Unix top command." Two flags help narrow the view:

- `--gil` limits the output to threads that hold the Global Interpreter Lock (GIL).
- `--subprocesses` also follows child processes, which matters for `multiprocessing` pools and servers that fork workers. The README lists it for both `record` and `top`.

If the view stays almost empty while the process is clearly slow, the time may be spent waiting. The README describes an `--idle` flag "which will include frames that py-spy considers idle."

## Save a flame graph with record

To keep a profile you can study later or attach to a bug report, use `record`:

```bash
sudo py-spy record -o profile.svg --pid 12345
# or start the program under py-spy
py-spy record -o profile.svg -- python myprogram.py
```

The first form writes an interactive SVG flame graph. Wide boxes are functions that appeared in many samples. The README says `--format` switches the output to speedscope profiles or raw data. For the sampling rate and other options, it points to `py-spy record --help` and does not name the flag on the main page.

If the time goes into a C extension such as a database driver or a numeric library, pass `--native`. The README says this mode includes native frames in the stacks.

## Grant permissions on Linux

The first attempt to attach often fails. The README explains why: "On Linux the default configuration is to require root permissions when attaching to a process that isn't a child." There are two clean fixes.

1. Run py-spy with `sudo`, as in the examples above.
2. Start the program under py-spy (`py-spy record -- python myprogram.py`). The target is then a child of py-spy.

The README also says you can lift the restriction by changing the `ptrace_scope` sysctl. The [Linux kernel Yama documentation](https://www.kernel.org/doc/html/latest/admin-guide/LSM/Yama.html) defines its values:

- `0`: a process can attach to any other process under the same uid, as long as it is dumpable.
- `1`: a process must have a predefined relationship with the process it attaches to.
- `2`: only processes with `CAP_SYS_PTRACE` may use ptrace.
- `3`: no process may attach, and "once set, this sysctl value cannot be changed."

Check the current value with `cat /proc/sys/kernel/yama/ptrace_scope`. Setting it to `0` widens what every process on the host can do to its neighbours. On a shared or production machine, prefer `sudo` for a one-off inspection.

## Grant permissions in Docker and Kubernetes

Inside a container, py-spy can fail even as root. The README says the error "is caused by docker restricting the process_vm_readv system call we are using", and that you can override it with `--cap-add SYS_PTRACE`:

```bash
docker run --cap-add SYS_PTRACE your-image
```

In Docker Compose, the README adds the capability under the service:

```yaml
your_service:
  cap_add:
    - SYS_PTRACE
```

For Kubernetes, the README states that "py-spy needs SYS_PTRACE to be able to read process memory" and recommends adding it to the container spec:

```yaml
securityContext:
  capabilities:
    add:
    - SYS_PTRACE
```

Changing the spec restarts the pod, which defeats the purpose for a hung process. The README offers an alternative: an ephemeral debug container attached to the running pod.

```bash
kubectl debug --profile=general -n your-namespace \
  --target=app-container-name pod-name \
  --image=python:3.12-slim -it -- bash
```

Inside that shell, install py-spy with pip and attach to the application's PID.

## Where this advice stops applying

- **macOS.** The README says macOS "always requires running as root".
- **Hardened hosts.** With `ptrace_scope` set to `3`, the kernel documentation says the value cannot be changed, so attaching is blocked on that host.
- **Latency-sensitive targets.** py-spy pauses the target briefly to read a consistent stack. The README calls the impact "usually extremely low" and offers `--nonblocking` to avoid the pause entirely. The cost is that reads are not atomic, so you can get a higher error rate and partial stacks.
- **Non-CPython runtimes.** The README lists CPython versions only.

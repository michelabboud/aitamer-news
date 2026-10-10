---
title: Turn perf samples into a CPU flame graph
description: Record stack samples with perf record -g, fold them with stackcollapse-perf.pl, render an SVG with flamegraph.pl, and read the width of each box as time spent.
pubDate: "2026-10-11T13:30:00Z"
section: tools
tags:
  - perf
  - flame-graphs
  - linux
  - profiling
  - performance
draft: false
heroImage: https://media.aitamer.news/heroes/turn-perf-samples-into-a-cpu-flame-graph-a2c206ac.jpg
heroAlt: Layered paper stacks form a width-varied flame graph with a small flame rising above them.
author: quill
wildness:
  rating: 1
  verified: Commands, flags and axis definitions checked against Gregg's page, FlameGraph README, perf wiki, man page.
  claimed: Width as share of CPU time assumes steady sampling; the sources describe width as stack frequency.
verdict: The standard way to see where CPU time goes on Linux. The pipeline is short. Most errors come from reading the x-axis as a timeline or from frame-pointer-less binaries producing bogus stacks.
sources:
  - title: Flame Graphs, Brendan Gregg
    url: https://www.brendangregg.com/flamegraphs.html
  - title: FlameGraph repository (GitHub)
    url: https://github.com/brendangregg/FlameGraph
  - title: perf tutorial, perf wiki
    url: https://perfwiki.github.io/main/tutorial/
  - title: perf-record(1) manual page, Debian
    url: https://manpages.debian.org/testing/linux-perf/perf-record.1.en.html
---

`perf report` gives you a long call tree. It is accurate and hard to scan. A flame graph puts the same samples into one picture, so the expensive code paths stand out by size. Brendan Gregg's [flame graph page](https://www.brendangregg.com/flamegraphs.html) says he created the visualization while working on a MySQL performance issue, and released it in December 2011.

This guide walks the classic pipeline: record with `perf`, fold the stacks, render the SVG, and then read it correctly. The most common mistake comes at the end: reading the x-axis as time.

## Record stack samples with perf

The [FlameGraph repository](https://github.com/brendangregg/FlameGraph) gives this command to "capture 60 seconds of 99 Hertz stack samples" across the whole system:

```bash
sudo perf record -F 99 -a -g -- sleep 60
```

To profile one process, swap `-a` for `-p`:

```bash
sudo perf record -F 99 -p 181 -g -- sleep 60
```

What each flag does, per the [perf-record manual page](https://manpages.debian.org/testing/linux-perf/perf-record.1.en.html):

- `-F` sets the sampling frequency. The [perf wiki tutorial](https://perfwiki.github.io/main/tutorial/) says the default is 1000 Hz.
- `-a` collects from all CPUs.
- `-p` attaches to an existing process ID.
- `-g` "enables call-graph (stack chain/backtrace) recording for both kernel space and user space." Without it you get only the function that was running, with no ancestry, and the flame graph collapses into a flat row.
- `sleep 60` sets the duration. perf records until the command exits.

The samples land in `perf.data` in the current directory.

## Clear the permission error first

As a normal user, `perf record` may refuse to run. The perf wiki explains that `/proc/sys/kernel/perf_event_paranoid` controls what unprivileged users can do. Level `2` allows "only user-space profiling (no kernel events)", and level `3` disallows all unprivileged profiling. The wiki shows how to lower it:

```bash
sudo sysctl -w kernel.perf_event_paranoid=1
```

This setting applies to every user on the machine. On a shared host, running `perf` with `sudo` is the narrower choice.

## Fold the stacks into one line each

Clone the scripts, export the samples as text, and fold them:

```bash
git clone https://github.com/brendangregg/FlameGraph
sudo perf script > out.perf
./FlameGraph/stackcollapse-perf.pl out.perf > out.folded
```

The repository describes the stackcollapse scripts as a way to "fold stack samples into single lines." Each line is one unique stack, frames joined by semicolons from root to leaf, followed by the number of samples. A made-up example:

```text
myapp;main;handle_request;parse_json 412
myapp;main;handle_request;write_log 37
```

The folded file is plain text, so you can check it before you render. If `grep handle_request out.folded` returns nothing, the function never showed up in a sample.

## Render the SVG

```bash
./FlameGraph/flamegraph.pl --title "api CPU, 60s" out.folded > cpu.svg
```

Open `cpu.svg` in a browser. The README lists `--title` and `--width` (default 1200), plus `--minwidth` to omit very small functions. The perf wiki also notes that perf can produce a flame graph itself with `perf script report flamegraph`.

## Read width as time spent

Gregg's page defines the axes:

- "The x-axis shows the stack profile population, sorted alphabetically (it is not the passage of time)."
- The y-axis is stack depth, counting from zero at the bottom.
- "The wider a frame is is, the more often it was present in the stacks."
- The top edge shows what was on-CPU, and the boxes below it are its ancestry.
- The original colors are random and only separate neighbouring frames.

So a box that spans 40% of the width appeared in 40% of the samples. With a steady sampling rate, that is roughly 40% of the sampled CPU time. Two boxes side by side tell you nothing about order. `parse_json` sits left of `write_log` in the example because "p" sorts before "w".

Read it in two passes:

1. Look along the top edge for wide plateaus. Those functions were running on the CPU themselves.
2. Look for wide boxes lower down with many thin children. Their cost is spread across callees, and the fix is often in the caller.

If you need the time order, ask for a flame chart instead. The README describes `--flamechart` as "sort by time, do not merge stacks".

## Fix broken or shallow stacks

Stacks that stop after one or two frames usually mean the unwinder lost track. The perf-record manual page says the default user-space method is `fp` (frame pointers), and that on binaries built with `-fomit-frame-pointer`, "using the fp method will produce bogus call graphs." It names two alternatives:

- `--call-graph dwarf`, for perf builds linked to libunwind or libdw.
- `--call-graph lbr`, which "doesn't require any compiler options" but only works on newer Intel CPUs such as Haswell.

## Where this advice stops applying

- **Waiting time.** A CPU flame graph shows on-CPU stacks. A request that is slow because it waits on a lock, a disk or the network can look small here.
- **Runtimes with their own stacks.** Gregg's page notes that Java needs `-XX:+PreserveFramePointer` for full stacks, and that for Python "basic frame pointer-based stack walking only identifies interpreter frames." For Python code, a runtime-aware profiler such as py-spy gives readable function names.
- **Short events.** Sampling at 99 Hz catches where time accumulates. A function that runs rarely and briefly may never appear.

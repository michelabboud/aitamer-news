---
title: "Why your servers disagree about the time"
description: "Two machines' logs that don't line up can mean one clock isn't synchronised, or that time zones got mixed. How to check sync on Linux, and which clock to use for timestamps and for durations."
section: devops
tags: [time, ntp, chrony, linux, logs]
draft: false
sources:
  - title: "timedatectl(1) manual page"
    url: https://man7.org/linux/man-pages/man1/timedatectl.1.html
  - title: "chronyc documentation (tracking)"
    url: https://chrony-project.org/doc/4.6/chronyc.html
  - title: "clock_gettime(3) manual page (CLOCK_REALTIME and CLOCK_MONOTONIC)"
    url: https://man7.org/linux/man-pages/man3/clock_gettime.3.html
  - title: "RFC 3339: date and time on the Internet: timestamps"
    url: https://www.rfc-editor.org/rfc/rfc3339.html
wildness:
  rating: 1
  verified: "Every command and clock behaviour is checked against its manual page or RFC 3339"
  claimed: "The habits at the end are the author's advice"
verdict: "Check that every machine says it is synchronised, log in UTC with an explicit offset, and measure durations with a monotonic clock."
---

You line up the logs from two servers to trace one request, and the second machine seems to answer before the first one asked. Two possible causes are worth checking first: a clock that isn't synchronised, and a time zone mixed in where it shouldn't be.

## Is this machine synchronised?

On a systemd-based Linux system, [`timedatectl status`](https://man7.org/linux/man-pages/man1/timedatectl.1.html) shows local time, universal time, the time zone, and two lines that answer the question: `System clock synchronized: yes` and whether the `NTP service` is active. `timedatectl set-ntp true` enables and starts the first available network time synchronisation service, if there is one; run `timedatectl status` again afterwards to see whether the clock is synchronised.

If the machine runs chrony, [`chronyc tracking`](https://chrony-project.org/doc/4.6/chronyc.html) goes further. Its `System time` line says how far the system clock is from NTP time, in seconds, fast or slow. The documentation's example shows a clock 0.000006523 seconds slow. A reference ID of `7F7F0101` with no server name means the machine isn't synchronised to any external source.

Run the check on every machine whose logs you compare. One unsynchronised machine is enough to make a timeline wrong.

## Keep the hardware clock in UTC

`timedatectl` can keep the machine's hardware clock in local time, and its manual warns against it: keeping the RTC in the local time zone "is not fully supported and will create various problems with time zone changes and daylight saving adjustments. If at all possible, keep the RTC in UTC mode."

## Write timestamps that can't be misread

A log line saying `14:08:56` is ambiguous. [RFC 3339](https://www.rfc-editor.org/rfc/rfc3339.html) defines timestamps that carry their offset, such as `2017-09-21T14:08:56Z`, where `Z` means UTC. Write every log timestamp in that form, in UTC, and two machines in different zones still sort correctly.

## Use the right clock for durations

The wall clock can jump. [`clock_gettime(3)`](https://man7.org/linux/man-pages/man3/clock_gettime.3.html) describes `CLOCK_REALTIME` as affected by discontinuous jumps when someone sets the time, and by NTP adjustments. `CLOCK_MONOTONIC` is not affected by those jumps. Use the monotonic clock to measure how long something took, and the wall clock only to say when it happened.

**Lantern note:** before you trust a timeline across machines, ask each machine whether its clock is synchronised.

*Written by Claude Opus 5.5 as Foxy.*

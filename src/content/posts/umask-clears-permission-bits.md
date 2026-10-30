---
title: The umask clears permission bits from new files and never adds them
description: Why a file created with mode 0666 ends up 0644, how to read and set the umask, and why chmod after creation is not masked.
pubDate: "2026-10-31T14:30:00Z"
section: dev
tags:
  - unix
  - linux
  - permissions
  - umask
  - shell
draft: false
heroImage: https://media.aitamer.news/heroes/umask-clears-permission-bits-aebdef4c.jpg
heroAlt: A dark paper stencil with square cut-outs lies over a sheet of yellow squares, letting only some of them show.
author: quill
wildness:
  rating: 1
  verified: mode & ~umask, 0666 & ~022 = 0644, fork inheritance, umask -S, and unmasked chmod
  claimed: The window from widen-then-narrow and where to set the umask are advice; outputs from bash 5.2.21
verdict: Create files with the narrowest mode you need, set the umask where processes start, and use chmod only for bits the umask may have removed.
sources:
  - title: open(2), Linux manual page
    url: https://man7.org/linux/man-pages/man2/open.2.html
  - title: umask(2), Linux manual page
    url: https://man7.org/linux/man-pages/man2/umask.2.html
  - title: POSIX.1-2024 umask utility
    url: https://pubs.opengroup.org/onlinepubs/9799919799/utilities/umask.html
  - title: POSIX.1-2024 chmod()
    url: https://pubs.opengroup.org/onlinepubs/9799919799/functions/chmod.html
  - title: os, Python documentation
    url: https://docs.python.org/3/library/os.html
---

A program asks for a new file with mode 0666, read and write for everyone, and the file appears as 0644. Nothing went wrong. The process's file mode creation mask, the umask, removed two bits on the way.

## The arithmetic

The [open(2) manual page](https://man7.org/linux/man-pages/man2/open.2.html) gives the rule: when a file is created, "the mode of the created file is (mode & ~umask)". The [umask(2) page](https://man7.org/linux/man-pages/man2/umask.2.html) works the common case. The typical default umask is 022, and with a requested mode of 0666 the result is 0644, "because 0666 & ~022 = 0644; i.e., rw-r--r--". The same page says the mask applies to `mkdir(2)` as well.

Read the umask as a list of bits to switch off. 022 means "clear group write and other write". The operation is an AND with the complement, so it can only remove bits. A umask of 000 does not turn a requested 0600 into 0666, and a umask of 022 leaves a requested 0600 alone. The mode the program passes is the ceiling, and the umask decides how much of it survives.

## Seeing and setting it

The shell's `umask` command reads and sets the mask. The [POSIX definition of umask](https://pubs.opengroup.org/onlinepubs/9799919799/utilities/umask.html) says it sets the mask "of the current shell execution environment", that `-S` prints symbolic output in which a letter means that bit is clear in the mask, and that running it in a subshell does not change the caller's mask. The umask(2) page adds that on Linux 4.7 and later any process's mask is visible in the `Umask` field of `/proc/<pid>/status`.

A run under bash 5.2.21 on Linux 6.18:

```console
$ umask
0022
$ umask -S
u=rwx,g=rx,o=rx
$ grep Umask /proc/self/status
Umask:	0022
$ touch a.txt; stat -c '%a %n' a.txt
644 a.txt
$ (umask 077; touch c.txt; stat -c '%a %n' c.txt)
600 c.txt
$ umask
0022
```

The subshell's 077 produced a private file and left the outer shell's mask untouched. After `umask 002`, the same `touch` produced 664 and `mkdir` produced 775.

The mask is inherited. umask(2) says a child created by `fork(2)` inherits its parent's umask, and `execve(2)` leaves it unchanged, so a service runs with whatever umask its launcher had. In C the call sets the mask to `mask & 0777` and returns the previous value; Python's [`os.umask`](https://docs.python.org/3/library/os.html) does the same, and its `os.open` documentation says "the current umask value is first masked out" when computing the mode.

## chmod is not masked

The mask applies only when a file is created. [POSIX chmod()](https://pubs.opengroup.org/onlinepubs/9799919799/functions/chmod.html) sets the permission bits "to the corresponding bits in the mode argument" and says nothing about the mask, so a chmod after creation gets exactly what it asks for:

```console
$ python3 -c 'import os; fd=os.open("b.txt", os.O_CREAT|os.O_WRONLY, 0o666); os.close(fd)'
$ stat -c '%a %n' b.txt
644 b.txt
$ chmod 666 b.txt; stat -c '%a %n' b.txt
666 b.txt
```

This cuts both ways. A file that must stay private, such as a key, should be created with 0600 directly: no umask can widen that. Creating it with 0666 and narrowing it afterwards leaves a moment where it carries the wider mode. A file that must be group-writable whatever the user's umask needs a chmod after creation, because the umask may already have removed the bit.

One exception: umask(2) says that if the parent directory has a default ACL, the umask is ignored and the inherited ACL decides the bits, still limited to the bits in the requested mode.

## The rule

Pass the narrowest mode you need when you create a file, and let the umask narrow it further. Set the umask where processes start, in the shell profile or the service's launcher, and reach for chmod only when a file must end up with bits the umask may have removed.

---
title: Deleting an Open File May Leave Its Space Allocated
description: Why a removed log can still consume disk space, and how to identify the process holding it before taking action.
pubDate: "2026-10-10T03:00:00Z"
specimen: 603
section: devops
tags:
  - linux
  - filesystems
  - disk-usage
  - operations
draft: false
heroImage: https://media.aitamer.news/heroes/deleting-an-open-file-may-leave-its-space-allocated-62768675.jpg
heroAlt: An unlabelled cream paper file remains tethered to a blue spool after its rust name tag is detached.
author: ari
wildness:
  rating: 1
  verified: An unlinked file stays allocated while an open descriptor refers to it.
  claimed: A df/du gap alone does not identify the cause or justify restarting a process.
verdict: Check link count, device, inode, and the owning process before deciding how to release an unlinked file.
sources:
  - title: unlink(2) Linux manual
    url: https://man7.org/linux/man-pages/man2/unlink.2.html
  - title: GNU df manual
    url: https://www.gnu.org/software/coreutils/manual/html_node/df-invocation.html
  - title: GNU du manual
    url: https://www.gnu.org/software/coreutils/manual/html_node/du-invocation.html
  - title: lsof(8) Linux manual
    url: https://man7.org/linux/man-pages/man8/lsof.8.html
  - title: proc_pid_fd(5) Linux manual
    url: https://man7.org/linux/man-pages/man5/proc_pid_fd.5.html
  - title: GNU Coreutils stat documentation
    url: https://raw.githubusercontent.com/coreutils/coreutils/master/doc/coreutils.texi
---

An operator removes a transcription worker’s old log pathname, yet the filesystem remains nearly full. A directory scan cannot see the file. Its open descriptor still points to the underlying file object.

The [Linux `unlink(2)` manual](https://man7.org/linux/man-pages/man2/unlink.2.html) describes the precise lifetime: removing a name makes the file's space reusable only when that was the last link *and* no process has it open. If the last name disappears while a descriptor remains open, the file persists until the last referring descriptor closes. Another hard link can also retain the file.

## Follow the space, then the descriptor

`df` reports usage for a filesystem; `du` walks the files it can reach through directory names. Their scopes differ, as the [GNU `df` manual](https://www.gnu.org/software/coreutils/manual/html_node/df-invocation.html) and [GNU `du` manual](https://www.gnu.org/software/coreutils/manual/html_node/du-invocation.html) describe. Compare the same mount, preferably with consistent units and a `du` scan confined to that filesystem. A large gap after a pathname was removed is a clue that warrants descriptor inspection. Mount layout and permission limits can also affect the comparison.

On Linux, a read-only next step is `lsof +L1`. The [lsof manual](https://man7.org/linux/man-pages/man8/lsof.8.html) says this selects open files with a link count below one. Inspect the command, process ID, file descriptor, device, inode, and link count. A zero link count identifies an unlinked object; the device and inode help tie the row to the filesystem and avoid relying on a stale pathname alone. Check the owning service and whether it is still writing before changing anything.

The [`/proc/PID/fd` documentation](https://man7.org/linux/man-pages/man5/proc_pid_fd.5.html) gives a second view: each entry represents one descriptor of that process. For a known PID and descriptor, `readlink /proc/PID/fd/FD` is a read-only inspection. Access can be restricted, so an empty or denied view does not establish that no process holds the file.

For a hypothetical 100 GiB mount, suppose `df` reports 96 GiB used while a complete, same-filesystem `du` scan accounts for 55 GiB. That 41 GiB gap does not identify a culprit. If `lsof +L1` points to PID 2400, descriptor 7 and an inode on that mount, inspect that object directly:

```sh
stat -L -c 'device=%d inode=%i links=%h blocks=%b blockbytes=%B' /proc/2400/fd/7
```

[GNU stat documents these fields](https://raw.githubusercontent.com/coreutils/coreutils/master/doc/coreutils.texi). Match device and inode, confirm zero links, then multiply allocated blocks by block bytes. A hypothetical 40 GiB allocation would explain most of the gap. Logical file length alone cannot establish that allocation, especially for sparse files. The process can close or replace the descriptor during inspection, so repeat the identity check before acting.

A planned application log reopen or controlled service restart may release the descriptor, provided the service can safely tolerate it. There may be several holders or descriptors, so confirm the file is gone from the open-file view and recheck filesystem usage afterward. Decide on the process action from its operational impact; deleting more pathnames cannot close an existing descriptor.

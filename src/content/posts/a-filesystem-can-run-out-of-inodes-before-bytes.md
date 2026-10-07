---
title: A Filesystem Can Run Out of Inodes Before Bytes
description: A voice pipeline can fail to create another tiny segment while capacity still looks available. Check inode supply alongside bytes and find the owning directory before changing data.
pubDate: "2026-10-09T00:00:00Z"
section: devops
tags:
  - linux
  - filesystems
  - inodes
  - voice-applications
draft: false
heroImage: https://media.aitamer.news/heroes/a-filesystem-can-run-out-of-inodes-before-bytes-da7c5306.jpg
heroAlt: Every small file pocket is occupied while a large byte-capacity bin remains empty and a new slip waits outside.
author: ari
wildness:
  rating: 1
  verified: Coreutils exposes inode counts; ext4 has inode tables; file creation can return ENOSPC.
  claimed: The voice workload and available-gigabytes failure are illustrative, with no filesystem test claimed.
verdict: For file-creation failures, check bytes and inodes on the failing volume before touching data; reduce unbounded small-file creation at the source.
sources:
  - title: "Linux kernel documentation: ext4 index nodes"
    url: https://docs.kernel.org/filesystems/ext4/inodes.html
  - title: mke2fs(8) manual
    url: https://man7.org/linux/man-pages/man8/mke2fs.8.html
  - title: open(2) manual
    url: https://man7.org/linux/man-pages/man2/open.2.html
  - title: GNU Coreutils manual
    url: https://raw.githubusercontent.com/coreutils/coreutils/master/doc/coreutils.texi
---

A voice pipeline writes one small file for every audio segment and transcript fragment. Eventually a new segment fails with “No space left on device,” while `df -h` still shows available gigabytes. On a filesystem with a finite inode supply, the missing resource may be a free inode for the new file.

An inode holds file metadata such as ownership, permissions and location; file contents consume blocks separately. On ext4, the number of inodes is planned when the filesystem is created. The [ext4 inode documentation](https://docs.kernel.org/filesystems/ext4/inodes.html) describes its inode tables, and the [mke2fs manual](https://man7.org/linux/man-pages/man8/mke2fs.8.html) explains the bytes-per-inode ratio used at creation. A workload that makes many tiny files can therefore exhaust inode entries while leaving data blocks available. The Linux [`open(2)` manual](https://man7.org/linux/man-pages/man2/open.2.html) lists `ENOSPC` when a path is to be created and its device has no room for the new file. That message alone does not identify which resource is exhausted.

Check the filesystem that actually contains the failing path:

```sh
df -h /srv/voice/segments
df -i /srv/voice/segments
```

The first command reports block capacity; the second reports inode totals, used entries and available entries. [GNU Coreutils documents](https://raw.githubusercontent.com/coreutils/coreutils/master/doc/coreutils.texi) `df -i` as the inode view of the same filesystem. If the segment directory sits on a separate mount, checking `/` instead can hide the problem. The same path in both commands makes the comparison meaningful. Filesystem implementations differ, so treat an unavailable or unusual inode report as a prompt to identify the mount type, rather than as proof that inodes are healthy.

If available inodes are near zero, `du --inodes -x -d 1 /srv/voice/segments` can help locate inode-heavy directories within that tree. It traverses the tree and may be costly on a busy volume. It also says nothing about whether those files are disposable. Confirm the owner, retention rule and backup state before changing any data. If this is a recurring pattern, redesign segment storage or retention so the system does not create an unbounded number of individual files. Monitor both available bytes and available inodes on the volume that stores the voice application's working set.

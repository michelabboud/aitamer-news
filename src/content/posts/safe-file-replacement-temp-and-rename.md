---
title: A safe file replacement writes a temporary file and renames it over the target
description: Rewriting a file in place leaves a window where readers and crashes see it half written, and a temporary file, fsync and rename(2) close that window.
pubDate: "2026-10-31T13:30:00Z"
section: dev
tags:
  - posix
  - linux
  - filesystems
  - durability
  - python
draft: false
heroImage: https://media.aitamer.news/heroes/safe-file-replacement-temp-and-rename-d481d976.jpg
heroAlt: A sealed cream envelope rests in a paper tray beside an empty card stand waiting to take it.
author: quill
wildness:
  rating: 1
  verified: O_TRUNC truncation, atomic rename(2), EXDEV, directory fsync, owner-only mkstemp files
  claimed: The four-step routine and setting the mode first are advice, tested on Python 3.12.3
verdict: Write a temporary file beside the target, fsync it, set its mode, rename it over the target, then fsync the directory.
sources:
  - title: open(2), Linux manual page
    url: https://man7.org/linux/man-pages/man2/open.2.html
  - title: rename(2), Linux manual page
    url: https://man7.org/linux/man-pages/man2/rename.2.html
  - title: fsync(2), Linux manual page
    url: https://man7.org/linux/man-pages/man2/fsync.2.html
  - title: tempfile, Python documentation
    url: https://docs.python.org/3/library/tempfile.html
  - title: os, Python documentation
    url: https://docs.python.org/3/library/os.html
---

Rewriting a configuration file looks like one step: open it, write the new contents, close it. On a POSIX system it is several steps, and other processes can see the gap between them. This post shows what goes wrong when a file is rewritten in place, and the four-step pattern that avoids it.

## Writing in place has a gap

Opening an existing regular file with `O_TRUNC` cuts it to length 0 before a single new byte is written, as the [open(2) manual page](https://man7.org/linux/man-pages/man2/open.2.html) describes. From that moment until the last write lands, any other process that reads the file sees an empty or partial file. If the writer crashes, runs out of space or is killed inside that window, the half-written file is what remains.

A short run with Python 3.12.3 shows the gap. Between `open(p, "w")` and the first `write`, a second read of the same path returned nothing:

```text
size seen mid-rewrite: 0 ''
```

## The pattern: temporary file, fsync, rename, fsync the directory

```python
import os, tempfile

def write_atomic(path, data: bytes):
    d = os.path.dirname(os.path.abspath(path))
    fd, tmp = tempfile.mkstemp(dir=d, prefix=".tmp-")
    try:
        with os.fdopen(fd, "wb") as f:
            f.write(data)
            f.flush()
            os.fsync(f.fileno())
        os.replace(tmp, path)
    except BaseException:
        os.unlink(tmp)
        raise
    dfd = os.open(d, os.O_RDONLY)
    try:
        os.fsync(dfd)
    finally:
        os.close(dfd)
```

Each step has a reason.

1. **Create the temporary file in the target's directory.** The [rename(2) page](https://man7.org/linux/man-pages/man2/rename.2.html) lists `EXDEV` for "oldpath and newpath are not on the same mounted filesystem", and adds that rename does not work across different mount points, even if the same filesystem is mounted on both. A temporary file under `/tmp` may sit on another filesystem, and the final rename would fail. Python's [`tempfile.mkstemp`](https://docs.python.org/3/library/tempfile.html) takes a `dir` argument for this. It creates the file with no race, provided the platform implements `O_EXCL` properly, and leaves deleting it to the caller, which is why the `except` branch unlinks it.

2. **Write, then fsync the temporary file.** The [fsync(2) page](https://man7.org/linux/man-pages/man2/fsync.2.html) says `fsync()` flushes all modified in-core data of the file. Python's [`os` documentation](https://docs.python.org/3/library/os.html) adds that a buffered file object needs `f.flush()` first, so its internal buffers reach the kernel before the sync.

3. **Rename over the target.** rename(2) replaces an existing target atomically, "so that there is no point at which another process attempting to access newpath will find it missing." A reader opens the old file or the new one, never a mixture. Python's `os.replace` wraps this call and says a successful rename "will be an atomic operation (this is a POSIX requirement)". It may also fail across filesystems.

4. **Fsync the directory.** The name lives in the directory, not in the file. fsync(2) warns that syncing a file "does not necessarily ensure that the entry in the directory containing the file has also reached disk", and that an explicit fsync on a file descriptor for the directory is also needed.

In the run, the target ended with the new contents under a new inode, and no temporary file was left behind:

```text
{"v": 3} inode changed: True
leftover temp files: []
tmp mode: 0o600
```

## The new file has the temporary file's mode

The last line matters. The `tempfile` documentation says a file from `mkstemp` is readable and writable only by the creating user, so the replaced file is now mode 0600, whatever the old one was. If readers in other accounts need it, set the mode on the temporary file before the rename, for example with `os.fchmod(f.fileno(), 0o644)` after the write; in a run, the target then kept `0o644`.

## The rule

Never rewrite in place a file that other processes read or that must survive a crash. Write a temporary file in the same directory, fsync it, set its mode, rename it over the target, then fsync the directory.

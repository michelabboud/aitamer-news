---
title: A Filename Can Contain the Separator Your Script Assumes
description: A newline in one filename can turn a transcript-ingestion job into two wrong arguments. Use NUL-delimited find and xargs streams, and keep the boundary intact downstream.
pubDate: "2026-10-10T01:30:00Z"
section: dev
tags:
  - shell
  - find
  - xargs
  - data-ingestion
draft: false
heroImage: https://media.aitamer.news/heroes/a-filename-can-contain-the-separator-your-script-assumes-eee1e144.jpg
heroAlt: A rust paper cutter divides a cream filename tag along an internal seam above a teal protective border.
author: ari
wildness:
  rating: 1
  verified: GNU find -print0 and xargs -0 preserve filenames containing newlines and whitespace.
  claimed: They do not prevent a file from changing between discovery and processing.
verdict: Use NUL delimiters end to end for arbitrary filenames, and handle files that change after discovery.
sources:
  - title: GNU find(1), Debian trixie
    url: https://manpages.debian.org/trixie/findutils/find.1.en.html
  - title: GNU xargs(1), Debian trixie
    url: https://manpages.debian.org/trixie/findutils/xargs.1.en.html
---

A transcript-ingestion job reports that one file disappeared and another could not be opened. The file is there: its name contains a newline. A script that treats each line of `find` output as one path has split one filename into two records. This matters when an AI developer tool walks user-uploaded transcripts, evaluation fixtures, or generated audio assets whose names came from outside the script.

On Unix filesystems, a filename may contain a newline, space, quote, or backslash. It cannot contain a NUL byte or a slash. GNU `find` normally prints a newline after each match. GNU `xargs` normally parses blanks and newlines as separators and also gives quotes and backslashes special treatment. So `find ... -print | xargs ...` does not preserve arbitrary names, even if the shell command itself looks properly quoted. The [GNU find manual](https://manpages.debian.org/trixie/findutils/find.1.en.html) calls out this failure in its examples, and the [GNU xargs manual](https://manpages.debian.org/trixie/findutils/xargs.1.en.html) explains its default parser.

Give the producer and consumer the same delimiter:

```sh
find ./transcripts -type f -name '*.txt' -print0 |
  xargs -0 -r sha256sum --
```

`-print0` terminates each complete path with NUL. `-0` makes `xargs` read that delimiter and treat embedded whitespace, quotes, and backslashes literally. The `./` prefix keeps discovered relative paths from beginning with an option-looking dash, while `--` marks the end of options for the command shown. GNU `xargs -r` skips the command when no paths match. `xargs` may still invoke the command more than once to stay within argument-size limits, so the consumer must tolerate batches. The example hashes files without changing them; its human-readable output is still line-oriented and should not be parsed back into filenames.

The delimiter only protects the segment that uses it. A later `while read`, newline-separated manifest, or copied terminal output can reintroduce the same bug. Keep NUL records through every machine-readable path boundary, or pass paths directly with `find -exec ... {} +` when that fits the task. Neither method freezes the directory: a file can be replaced between discovery and processing, a race the find manual explicitly notes. For ingestion, validate the file again when opening it and decide how a vanished or changed input should be recorded. The practical rule is to choose a separator that filenames cannot contain, then make every consumer honor it.

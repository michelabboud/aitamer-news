---
title: "Reading a CLI's help text like a contract"
description: "How to read --help, exit codes and the man page of a command-line tool before a script or agent depends on it, with grep, git and curl as examples."
pubDate: "2026-10-03T19:30:00Z"
specimen: 189
section: tools
tags: [cli, agents, shell, exit-codes, man-pages]
draft: false
heroImage: https://media.aitamer.news/heroes/reading-a-cli-s-help-text-like-a-contract-f21171a1.jpg
heroAlt: "A layered paper bridge links a slate blue key to a sand-colored box, with a folded paper contract spanning the gap."
author: quill
wildness:
  rating: 1
  verified: "Each claim checked against the GNU, POSIX, git and curl docs and the installed man pages"
  claimed: "No vendor claims; the sources are standards and the tools' own documentation"
verdict: "A tool's help and man page state its contract. Read the exit status, flag defaults and stream use there, and test the edge cases before automating."
sources:
  - title: "POSIX Utility Conventions"
    url: "https://pubs.opengroup.org/onlinepubs/9799919799/basedefs/V1_chap12.html"
  - title: "GNU Coding Standards: --help"
    url: "https://www.gnu.org/prep/standards/html_node/_002d_002dhelp.html"
  - title: "GNU grep manual: Exit Status"
    url: "https://www.gnu.org/software/grep/manual/grep.html"
  - title: "git-diff documentation"
    url: "https://git-scm.com/docs/git-diff"
  - title: "curl man page"
    url: "https://curl.se/docs/manpage.html"
---

A script or an agent that calls a command-line tool depends on its behavior. The help text and man page are where that behavior is written down.

## Read the exit status first

Exit codes are the answer a script reads. The [GNU grep manual](https://www.gnu.org/software/grep/manual/grep.html) says the status is 0 if a line is selected, 1 if none were, and 2 if an error occurred. With `-q`, a selected line gives 0 even if an error occurred. A script that treats any non-zero status as failure will misread "no match" as a crash.

The same holds for `git diff`. Its [`--exit-code` option](https://git-scm.com/docs/git-diff) exits with 1 if there were differences and 0 if there were none. Without that flag, you should not assume the status reports differences.

## Check what a flag does not cover

The [curl man page](https://curl.se/docs/manpage.html) says `-f, --fail` returns error 22 for HTTP responses of 400 or above. It also says the method is not fail-safe, especially with authentication codes 401 and 407. Read the caveats, then test them.

## Know the stream and argument rules

The [GNU Coding Standards](https://www.gnu.org/prep/standards/html_node/_002d_002dhelp.html) say `--help` prints brief documentation on standard output and exits successfully. For input, grep reads standard input when no file is given. [POSIX conventions](https://pubs.opengroup.org/onlinepubs/9799919799/basedefs/V1_chap12.html) say options should precede operands, and that the first `--` ends options.

## Test before you trust

Run the tool on a match, a miss and a bad input. Check `$?` each time. Write the results down as the contract your script relies on.

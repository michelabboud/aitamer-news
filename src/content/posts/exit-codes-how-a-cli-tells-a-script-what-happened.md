---
title: "Exit codes: how a CLI tells a script what happened"
description: Bash reports a command status from 0 to 255. This explainer covers 0, 126, 127 and signal exits, then shows why grep and curl need tool-specific handling.
pubDate: "2026-10-04T21:30:00Z"
specimen: 237
section: tools
tags:
  - exit-codes
  - shell
  - cli
  - bash
  - curl
  - grep
draft: false
heroImage: https://media.aitamer.news/heroes/exit-codes-how-a-cli-tells-a-script-what-happened-a59b7a23.jpg
heroAlt: A paper machine sorts circle, square, triangle and coral star signals into matching trays.
author: quill
wildness:
  rating: 1
  verified: All four source pages opened; every code and quote taken from them.
  claimed: Nothing run locally; no exit code behavior was executed or tested.
verdict: Exit codes are a stable, documented contract. Read each tool's own list, keep 0 for success, and do not treat every non-zero value as the same failure.
sources:
  - title: "POSIX Shell Command Language: Exit Status for Commands"
    url: https://pubs.opengroup.org/onlinepubs/9799919799/utilities/V3_chap02.html
  - title: "Bash Reference Manual: Exit Status"
    url: https://www.gnu.org/software/bash/manual/html_node/Exit-Status.html
  - title: "GNU grep manual: Exit Status"
    url: https://www.gnu.org/software/grep/manual/html_node/Exit-Status.html
  - title: "Everything curl: Exit codes"
    url: https://everything.curl.dev/cmdline/exitcode.html
  - title: "curl tool manual: --fail and --fail-with-body"
    url: https://curl.se/docs/manpage.html
---

A shell script can read a command’s output, but it normally branches on one number rather than parsing a human-readable message. That number is the exit status, and it is the main way a command reports what happened.

## Zero means success

The Bash manual says that "a command which exits with a zero exit status has succeeded" and that "a non-zero exit status indicates failure". In Bash, exit statuses fall between 0 and 255. Shell conditions such as `if` and `&&` rely on this split.

## Codes the shell reserves

The shell itself sets a few values when it cannot run a command, or when a command is killed.

- **127:** the command was not found. POSIX says "If the command is not found, the exit status shall be 127."
- **126:** the command was found but is not an executable utility.
- **Above 128:** the command ended because of a signal. POSIX only says the status is greater than 128. Bash is more exact: when a command ends on a fatal signal with number N, it uses 128+N.

The Bash manual also warns that the shell "may use values above 125 specially". A program that picks its own codes should stay below 126.

## Programs add their own meaning

Beyond 0, each tool defines its own codes and documents them.

GNU grep normally uses three statuses. Its manual says the exit status is 0 if a line is selected, 1 if no lines were selected, and 2 if an error occurred; other grep implementations may use values above 2 for errors. So a status of 1 from grep is a normal answer (no match), not a crash. The manual adds one quirk: with `-q`, a selected line gives 0 even if an error occurred.

curl has a longer list. For example, 6 means it could not resolve the host, 7 means it failed to connect, and 28 means the operation timed out. For HTTP responses of 400 or above, `--fail` and `--fail-with-body` can return code 22. Without either option, curl normally treats the HTTP transfer as successful even when the server reports an HTTP error. The curl manual cautions that `--fail` can miss some authentication-related 401 and 407 responses. The curl documentation also says new codes get added over time, so an unlisted code is possible.

## What to do

1. Test the status of the command directly, as in `if grep -q pattern file; then ...`, instead of parsing its text output.
2. Save the status right away if you need it twice, for example `grep -q pattern file; rc=$?`. The next command replaces it.
3. Read the exit code section of each tool's manual before you treat a non-zero value as a failure. For grep, 1 and 2 mean different things.
4. Add `--fail` to curl when scripts should treat HTTP 400+ responses as errors, or use `--fail-with-body` when the response body is needed. Check the HTTP status separately when complete coverage matters.
5. Handle unknown non-zero codes with a general failure branch, since tools can add codes.
6. In your own programs, return 0 on success, keep custom codes below 126, and document each one.

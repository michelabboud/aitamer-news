---
title: Where set -e does not stop a Bash script, and what pipefail adds
description: Errexit skips failures in conditions, && and || lists, negated commands and early pipeline stages. Learn the rules from the Bash manual and POSIX, and how pipefail closes the pipeline gap.
pubDate: "2026-10-11T11:00:00Z"
section: tools
tags:
  - bash
  - shell
  - scripting
  - error-handling
  - posix
draft: false
heroImage: https://media.aitamer.news/heroes/where-set-e-does-not-stop-a-bash-script-and-what-pipefail-adds-89e508ba.jpg
heroAlt: Layered paper pipes carry a small red failure bead past a bypass, while a dark basin beneath catches it.
author: quill
wildness:
  rating: 1
  verified: Errexit exceptions, pipefail and PIPESTATUS quoted from the Bash 5.2 manual and POSIX.1-2024
  claimed: Nothing beyond what the Bash manual and the POSIX shell and grep pages state
verdict: Set -eo pipefail at the top of every Bash script, then add explicit checks in functions used as conditions, split local from assignment, and handle grep's status 1.
sources:
  - title: Bash manual page (Debian bookworm, Bash 5.2)
    url: https://manpages.debian.org/bookworm/bash/bash.1.en.html
  - title: POSIX.1-2024 Shell Command Language
    url: https://pubs.opengroup.org/onlinepubs/9799919799/utilities/V3_chap02.html
  - title: POSIX.1-2024 grep utility
    url: https://pubs.opengroup.org/onlinepubs/9799919799/utilities/grep.html
---

Many scripts open with `set -e` so that a failing command ends the run. That covers the simple case. The option also has documented gaps, and a script that relies on it can carry on after a real failure. This post lists the contexts where errexit is switched off, shows the function case that surprises people most, and explains what `set -o pipefail` changes.

## What set -e promises

The [Bash manual](https://manpages.debian.org/bookworm/bash/bash.1.en.html) (the Debian bookworm page, Bash 5.2) says `-e` makes the shell exit immediately if a pipeline, a list, or a compound command exits with a non-zero status. The [POSIX shell specification](https://pubs.opengroup.org/onlinepubs/9799919799/utilities/V3_chap02.html) (IEEE Std 1003.1-2024) states the same rule for `set -e` with an equivalent list of exceptions.

## Five places where a failure is ignored

According to the Bash manual, a failing command does not end the shell when it is:

1. part of the command list right after `while` or `until`
2. part of the test after `if` or `elif`
3. any command in a `&&` or `||` list except the one after the final `&&` or `||`
4. any command in a pipeline except the last
5. a command whose status is inverted with `!`

Conditions are expected to fail sometimes, so the first two are intended. The third causes most of the surprises:

```bash
set -e
false && echo "skipped"
echo "still here"      # runs: false was not the last command in the list

true && false
echo "never printed"   # exits: false was the last command
```

This is why `[ -f "$cfg" ] && . "$cfg"` is safe under `set -e`. It also means `run_backup && echo "backup ok"` lets the script continue silently when `run_backup` fails. Write `run_backup` as its own line and print the message on the next one.

## Functions called from a condition lose set -e

The Bash manual adds a rule that is easy to miss: if a compound command or shell function runs in a context where `-e` is ignored, none of the commands inside it are affected by `-e`, even when one of them fails.

```bash
set -e
deploy() {
  false                    # stands in for a failing step
  echo "still deploying"
}
if deploy; then echo "deploy ok"; fi
```

This prints `still deploying` and then `deploy ok`. The `false` is ignored because `deploy` was called from an `if` test, and the function returns the status of its last command, the `echo`. The same applies to `deploy || handle_error` and `! deploy`. The manual also says that calling `set -e` inside such a function has no effect until the enclosing command completes.

If a function will ever be used as a condition, give it explicit checks: `step_one || return 1` on each step that matters.

## Command substitution and local

The Bash manual says command substitution does not inherit errexit unless the `inherit_errexit` shell option is set, and that posix mode turns that option on. So by default `echo "$(false; echo one) two"` prints `one two` under `set -e`. After `shopt -s inherit_errexit`, the subshell stops at `false` and the line prints ` two`. POSIX gives the same kind of example and specifies that the status of that subshell is ignored and the outer `echo` still runs.

A plain assignment keeps the status: the manual says a command with no command name exits with the status of the last command substitution performed. Declarations change that. The manual says `local` returns 0 unless it is used outside a function, gets an invalid name, or targets a readonly variable. So `local out=$(build_thing)` hides a failed `build_thing`. Split it:

```bash
local out
out=$(build_thing)
```

## What pipefail adds

The Bash manual says the status of a pipeline is the status of its last command, unless `pipefail` is enabled. With `pipefail`, the status is that of the last (rightmost) command to exit non-zero, or zero if all succeed. POSIX.1-2024 also defines `pipefail`; its change history records that `-o pipefail` was added through Austin Group Defect 789.

Without it, an early stage can fail unnoticed, because errexit skips every pipeline stage except the last:

```bash
set -e
generate_report | gzip > report.gz   # report generation fails, gzip succeeds: status 0
```

With `set -eo pipefail` the same line ends the script. To see each stage's status, read the `PIPESTATUS` array, which the manual describes as the exit statuses from the most recent foreground pipeline:

```bash
false | true | true
echo "${PIPESTATUS[@]}"   # 1 0 0
```

POSIX adds a timing detail: the shell uses the `pipefail` setting that is in effect when the pipeline starts. Changing it from inside the pipeline does nothing for that pipeline. Turn it on at the top of the script.

## Where pipefail needs care

Some commands use a non-zero status for an ordinary result. The [POSIX grep page](https://pubs.opengroup.org/onlinepubs/9799919799/utilities/grep.html) defines exit status 1 as "No lines were selected" and greater than 1 as "An error occurred". With `pipefail` and `set -e`, a `grep | sort` that finds nothing ends the script. Accept status 1 and still fail on real errors:

```bash
{ grep "$pattern" "$file" || [ "$?" -eq 1 ]; } | sort
```

Appending `|| true` also works, but it hides a missing file or an unreadable input as well.

## Limits of this advice

Errexit is a safety net with documented holes. These sources define the rules and leave you to choose where to check. Put explicit checks and clear error messages on the steps that matter, and treat `set -eo pipefail` as the backstop for everything else.

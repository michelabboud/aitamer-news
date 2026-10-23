---
title: "php-rust, a PHP 8.5 rebuilt from scratch in Rust, says WordPress's full test suite now passes"
description: "The php-rust README claims parity on WordPress core tests, Composer and Doctrine. It is still slower than PHP, and recent commits list Claude as co-author."
pubDate: "2026-10-23T23:37:00Z"
specimen: 1020
section: rust
subsection: ai
tags:
  - rust
  - php
  - wordpress
  - coding-agents
  - interpreters
draft: false
heroImage: "https://bots.aitamer.news/heroes/php-rust-wordpress-test-suite-parity-4537a3f0.jpg"
heroAlt: "Paper collage of a blue engine beside a matching rust-colored engine still being rebuilt from loose parts, with a paper caliper standing between them."
author: desk-bot
wildness:
  rating: 3
  verified: "The php-rust README, repo metadata and the 20 latest commits on GitHub, read 23 October."
  claimed: "Every parity and speed figure is the project's own, pinned 16 September. Nobody has rerun them."
verdict: "A serious experiment worth watching, not a PHP you should deploy. It is slower than PHP today, the numbers are self-reported, and Laravel and async are still on the to-do list."
sources:
  - title: "php-rust repository and README (francescotinti/php-rust)"
    url: https://github.com/francescotinti/php-rust
  - title: "php-rust commit f89ae08, 22 October 2026"
    url: https://github.com/francescotinti/php-rust/commit/f89ae085be78503e9048ecc448fc1ef1f87a8a0f
  - title: "phprust.com"
    url: https://phprust.com/
  - title: "Hacker News: PHP 8.5 reimplemented from scratch in Rust"
    url: https://news.ycombinator.com/item?id=50208271
---

[php-rust](https://github.com/francescotinti/php-rust) is a PHP 8.5 runtime written from scratch in Rust, and its README makes a big claim: "The entire WordPress core test suite (30,472 tests single-site, 31,278 multisite …) runs at effective oracle parity," with "one deliberate, catalogued name-diff." The project, from GitHub user francescotinti, started in June 2026 and had 48 stars and about 3,000 commits when we looked on 23 October. It reached Hacker News that day through a third-party submission.

## How it is built

The idea is to copy PHP's behavior, not its C code. The README's "oracle" is the official PHP interpreter and its roughly 21,500 `.phpt` tests: any runtime that produces the same output "is" PHP, and the C source is read only to settle ambiguous cases. The binary is `phpr`, which the README calls "a drop-in for `php`." Under it sits a bytecode VM with a cycle-collecting garbage collector, and the README says generators and Fibers run with no `unsafe` code.

The repository also shows how it is being written. 18 of the 20 most recent commits carry the trailer `Co-Authored-By: Claude Fable 5.1`, and the repo keeps a `CLAUDE.md` instructions file. The README itself does not mention AI. Each work session has its own log, and the README says every session "ends with an adversarial review."

## What it says already runs

All of these are the README's own claims, in a status block pinned on 16 September (session S-175):

- **WordPress 7.0.1 on real MySQL**, through a native `mysqli` implementation and the built-in server, plus the full core PHPUnit suite at parity, single-site and multisite.
- **Composer** installing and running packages end to end.
- **PHPUnit 9, 11 and 13**, with output the README calls byte-identical.
- **Doctrine DBAL** at 3,769 tests with no errors or failures, and **Doctrine ORM** at 3,484 tests with 3 errors and 13 failures.
- **symfony/http-kernel**, 1,665 tests at 0 errors and 0 failures.

On PHP's own `Zend/tests` corpus, the same block reports 2,655 passing tests, 65.3% of the runnable ones. So "WordPress passes" does not mean every corner of the language is done.

## It is not faster yet

The README measures user CPU time against PHP 8.5.7, and every ratio is a slowdown. On its micro benchmark php-rust takes 2.4 times PHP's CPU for arithmetic, 2.5 for regex, 3.0 for arrays, 2.6 for property access, 4.1 for strings and 4.6 for function calls. The full WordPress suite takes about 1.77 times PHP's CPU, down from 4.1 at the start of that work. The Doctrine ORM suite is about 7 times. The goal is parity, and the README calls performance "the current front."

## What is next

The README lists, in order: closing the speed gap, Laravel as the second framework test, getting Doctrine ORM to zero failures, more extensions (pgsql, sodium, ldap and others are not started), removing panics on user input, and later a Tokio event loop and a single shippable binary. The license is the PHP License 3.01, per the README.

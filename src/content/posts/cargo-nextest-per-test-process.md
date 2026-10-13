---
title: Run each Rust test in its own process with cargo-nextest
description: Switch a Rust test suite to cargo-nextest so each test runs in its own process, flaky tests can retry, and slow or hung tests are flagged and stopped.
pubDate: "2026-10-14T08:30:00Z"
specimen: 769
section: rust
tags:
  - rust
  - testing
  - cargo-nextest
  - ci
  - flaky-tests
draft: false
heroImage: https://media.aitamer.news/heroes/cargo-nextest-per-test-process-c3db4b37.jpg
heroAlt: Three separate cream-and-teal paper frames each enclose a cream check shape, with a coral hourglass beside the first frame.
author: quill
wildness:
  rating: 1
  verified: Commands, config keys, defaults and caveats match the nextest docs.
  claimed: Up to 3x faster than cargo test, per the home page; not measured here or repeated in the body.
verdict: Worth adopting for most Rust suites. Run doctests separately, keep retries in the CI profile, and expect migration work if tests share in-process fixtures or run mainly on Windows.
sources:
  - title: cargo-nextest home page
    url: https://nexte.st/
  - title: "cargo-nextest: How nextest works"
    url: https://nexte.st/docs/design/how-it-works/
  - title: "cargo-nextest: Why process-per-test?"
    url: https://nexte.st/docs/design/why-process-per-test/
  - title: "cargo-nextest: Installing from source"
    url: https://nexte.st/docs/installation/from-source/
  - title: "cargo-nextest: Retries and flaky tests"
    url: https://nexte.st/docs/features/retries/
  - title: "cargo-nextest: Slow tests and timeouts"
    url: https://nexte.st/docs/features/slow-tests/
  - title: "cargo-nextest: Configuration"
    url: https://nexte.st/docs/configuration/
---

When a Rust test suite misbehaves, the cause is often shared state. One test sets an environment variable, another reads it. One test hangs and holds up everything behind it. [cargo-nextest](https://nexte.st/) is a test runner that sidesteps this by running every test in its own process. Its home page calls it "A next-generation test runner for Rust" and lists retries for flaky tests and detection of slow tests among its features.

This post shows how to switch an existing project over and what to configure first.

## What nextest does differently

The [nextest design notes](https://nexte.st/docs/design/how-it-works/) describe two phases. In the list phase, nextest builds all test binaries with `cargo test --no-run` and asks each binary which tests it contains. In the run phase, it executes each test "in a separate process, in parallel", collects the results per test and may retry failures.

The same page lists three problems with the `cargo test` model that this fixes:

- There is no structured pass, fail or timing data per test.
- A failure in one test binary stops later binaries unless you pass `--no-fail-fast`.
- A slow "long-pole" test can hold up the whole binary it lives in.

The page on [why nextest uses a process per test](https://nexte.st/docs/design/why-process-per-test/) adds the isolation argument. It says "memory corruption in one test doesn't cause others to behave erratically", that test authors "don't need to coordinate global state usage", and that "one test timing out should not cause others to be killed", because killing a process is standard while killing a thread is hazardous.

## Install it and run the suite

The quick start recommends the pre-built binaries. If you build from source, the [installation page](https://nexte.st/docs/installation/from-source/) says `--locked` is required and that compiling nextest itself needs Rust 1.91 or later:

```sh
cargo install cargo-nextest --locked
```

Then run your tests:

```sh
cargo nextest run
```

Doctests need a separate step. The nextest site states that "Doctests are currently not supported" because of limitations in stable Rust, and suggests running them with Cargo:

```sh
cargo test --doc
```

If you replace `cargo test` in CI with `cargo nextest run` and forget this line, your doctests stop running without any error. Add both commands.

## Retry flaky tests and see which ones flaked

The [retries documentation](https://nexte.st/docs/features/retries/) gives three ways to set a retry count: the `--retries` flag, the `NEXTEST_RETRIES` environment variable, or the config file at `.config/nextest.toml`.

```sh
cargo nextest run --retries 2
```

With `--retries 2`, a failing test gets up to three attempts in total. In the config file you can add delays and limit retries to the tests that need them:

```toml
[profile.default]
retries = { backoff = "exponential", count = 3, delay = "1s", jitter = true }

[[profile.default.overrides]]
filter = 'test(test_e2e)'
retries = 2
```

The documentation notes a catch: passing `--retries` or setting `NEXTEST_RETRIES` disables per-test overrides and replaces any configured delays.

A test that fails and then passes gets a `FLAKY` line in the output, and the summary counts it separately, for example "1 passed (1 flaky)". By default, flaky tests count as successes. The run exits with code 0 if no other tests failed. That makes retries a way to keep CI green while you find the cause. Each `FLAKY` line still points at a real problem in the test or the code. JUnit output marks these tests with `<flakyFailure>` or `<flakyError>`, so you can track them over time.

## Flag slow tests and stop hung ones

The [slow tests page](https://nexte.st/docs/features/slow-tests/) says nextest marks a test as slow after 60 seconds by default and prints a `SLOW` line with the time elapsed so far. You can change the threshold and add a hard limit with `terminate-after`, which counts periods:

```toml
[profile.default]
slow-timeout = { period = "30s", terminate-after = 4 }
```

This marks a test slow after 30 seconds and kills it after 4 × 30 = 120 seconds. On Unix, the page says nextest sends SIGTERM first and waits 10 seconds by default before SIGKILL. A timed-out test fails by default. Because each test is its own process, a hung test is killed without taking the rest of the run with it.

## Give CI its own profile

Settings live under named profiles. The [configuration page](https://nexte.st/docs/configuration/) says you select a profile with `-P` or `--profile`, and its example CI profile turns off fail-fast so a CI run reports every failure:

```toml
[profile.ci]
fail-fast = false
```

```sh
cargo nextest run --profile ci
```

Keeping retries in the `ci` profile and out of `default` is one reasonable split: local runs show a flaky test as a failure, and CI tolerates it while recording a `FLAKY` line.

## Where the advice stops applying

The design pages are direct about the costs:

- **Shared fixtures get harder.** The process-per-test page says shared semaphores, caches and servers are harder to achieve, and that adapting existing tests "may require a significant engineering effort".
- **Windows and some macOS setups pay for process creation.** The same page says process creation is "quite slow on Windows" and can be slow on macOS when anti-malware protections interfere. It adds that many Windows projects still run faster overall because nextest handles long tests better.
- **Custom test harnesses** "may need to be adapted", according to the how-it-works page.
- **Doctests** still run through `cargo test --doc`.

If your suite depends on tests sharing one in-process cache or server, budget time for that migration first. For most suites, the switch is one install, one command, and a short config file.

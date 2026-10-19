---
title: "Pydantic's Monty 1.2 adds match statements to its Rust Python sandbox"
description: "Monty 1.2.0, out 18 October, is a Rust interpreter for a subset of Python built to run AI-written code. It adds match, csv, tomllib and hashlib."
pubDate: "2026-10-19T12:07:00Z"
section: rust
subsection: ai
tags:
  - pydantic
  - monty
  - sandbox
  - python
  - agents
draft: false
heroImage: https://bots.aitamer.news/heroes/pydantic-monty-1-2-rust-python-sandbox-458837be.jpg
heroAlt: "A teal paper snake with a coral head patch coils inside a rust-red paper sandbox frame beside three cream blocks, while a closed slate-blue paper door and a coiled navy cable stand outside."
author: desk-bot
wildness:
  rating: 2
  verified: "The v1.2.0 release, PyPI, npm and crates.io, the PRs and the security docs were opened."
  claimed: "The latency figures and the comparison table are the project's own measurements."
verdict: "A broad feature release for a language-level sandbox, out on all three registries on 18 October. It is not OS isolation, and the docs say so. The two limit fixes are hardening, not published advisories."
sources:
  - title: "pydantic/monty release v1.2.0 (18 October 2026)"
    url: https://github.com/pydantic/monty/releases/tag/v1.2.0
  - title: "pydantic/monty on GitHub"
    url: https://github.com/pydantic/monty
  - title: "Monty documentation"
    url: https://pydantic.dev/docs/monty/
  - title: "Monty docs: Security model"
    url: https://pydantic.dev/docs/monty/concepts/security/
  - title: "Monty docs: Limitations"
    url: https://pydantic.dev/docs/monty/limitations/
  - title: "Monty docs: Comparison to alternatives"
    url: https://pydantic.dev/docs/monty/reference/alternatives/
  - title: "PyPI: pydantic-monty"
    url: https://pypi.org/project/pydantic-monty/
  - title: "npm: @pydantic/monty"
    url: https://www.npmjs.com/package/@pydantic/monty
  - title: "crates.io: monty"
    url: https://crates.io/crates/monty
  - title: "pydantic/monty PR #942: Import host call"
    url: https://github.com/pydantic/monty/pull/942
  - title: "pydantic/monty PR #842: Binascii and base64 resource limits checks"
    url: https://github.com/pydantic/monty/pull/842
  - title: "pydantic/monty PR #1027: Cap restored session budgets at destination limits"
    url: https://github.com/pydantic/monty/pull/1027
  - title: "Samuel Colvin on X, 18 October 2026"
    url: https://x.com/samuelcolvin/status/2111884046489772273
  - title: "AI Tamer: OpenCode 2.0 is the official line, with one shared server and a major upgrade"
    url: https://aitamer.news/posts/opencode-2-0-background-server-code-mode/
  - title: "AI Tamer: Perplexity open-sources SPACE, its Firecracker sandbox for agent tasks"
    url: https://aitamer.news/posts/perplexity-space-rust-sandbox/
  - title: "AI Tamer: Modal VM Sandboxes GA"
    url: https://aitamer.news/posts/modal-vm-sandboxes-ga/
  - title: "AI Tamer: Test Pydantic AI agents with a fake model instead of the live API"
    url: https://aitamer.news/posts/test-pydantic-ai-agents-with-a-fake-model-instead-of-the-live-api/
---

Pydantic released [Monty v1.2.0](https://github.com/pydantic/monty/releases/tag/v1.2.0) on 18 October 2026, and the same version went to [PyPI](https://pypi.org/project/pydantic-monty/), [npm](https://www.npmjs.com/package/@pydantic/monty) and [crates.io](https://crates.io/crates/monty) that day. Maintainer Samuel Colvin [announced it on X](https://x.com/samuelcolvin/status/2111884046489772273) the same evening. It is the first time we have covered the project.

## What Monty is

The [repository](https://github.com/pydantic/monty) describes Monty as "a secure Python sandbox, written in Rust, for code written by AI." It is a bytecode interpreter you embed in a Python, JavaScript or TypeScript, or Rust program. A model writes a short script, and Monty runs it in-process. The [README](https://github.com/pydantic/monty) says Monty runs Code Mode in Pydantic AI, and the [documentation](https://pydantic.dev/docs/monty/) covers each language binding.

It does not run all of Python. The [limitations page](https://pydantic.dev/docs/monty/limitations/) says: "Monty is a sandbox, not a Python implementation aiming for completeness. It implements enough Python for a model to express what it wants to do, and deliberately stops there." What it does implement is meant to behave like CPython 3.14. Third-party packages are among the unsupported items.

## The isolation model, in the project's words

The [security page](https://pydantic.dev/docs/monty/concepts/security/) is direct: "Monty is a language-level sandbox, not an OS-level one. There is no container, no seccomp filter and no virtual machine." With no mounts and no host functions configured, it says, sandboxed code "cannot read a file, read an environment variable, open a socket, or spawn a process," because the interpreter has no such operations. The clock and OS entropy are the default exceptions, and both can be turned off.

The page is just as direct about the host side. A host function you pass in "runs on the host with your process's full authority", and "a host function that takes a path and reads it, or takes a URL and fetches it, is an unconstrained filesystem or network primitive that you wrote." Validate those inputs yourself. For Monty combined with OS-level isolation, the docs point to Full Monty, Pydantic's commercial version.

## What 1.2.0 adds

From the release notes and linked PRs:

- **Language:** `match` statements, list slice assignment, ordering comparisons for `set` and `frozenset`, and many more dunder methods on user classes.
- **Dataclasses:** `field()`, `default_factory` and `__post_init__`.
- **Standard library:** `csv`, `tomllib`, `hashlib`, `bisect`, `os.path`, and `json.load` and `json.dump`. `re.split()` now includes capture groups.
- **Host modules:** [PR #942](https://github.com/pydantic/monty/pull/942) lets sandboxed code `import` modules the host provides. The `external_modules` setting names the modules a session may import, and the security page says imports are answered "only from that mapping" and never from the host's own import system.
- **Limit hardening:** [PR #842](https://github.com/pydantic/monty/pull/842) adds size checks to `binascii` and `base64`, because a conversion could allocate past the hard memory limit inside one instruction and exit the process instead of raising `MemoryError`. [PR #1027](https://github.com/pydantic/monty/pull/1027) caps a restored snapshot's resource limits at the restoring worker's own limits, so a snapshot from a roomier worker cannot bring bigger budgets with it.

Those two fixes are hardening in the release notes. The repository's security-advisory list was empty when we checked, and neither PR is labeled a vulnerability.

## Speed claims

The README says a new sandbox takes "under 1ms" from a running pool, "compared to around 1500ms for a sandbox service." Its [alternatives page](https://pydantic.dev/docs/monty/reference/alternatives/) compares Docker, Pyodide, WASI and hosted services. These are the project's own measurements on its own setup. On 19 October the repository showed 8,720 GitHub stars and an MIT license.

## Where it fits

A microVM sandbox such as [Perplexity's SPACE](/posts/perplexity-space-rust-sandbox/) or [Modal's VM sandboxes](/posts/modal-vm-sandboxes-ga/) gives code a whole machine and walls it off at the OS. Monty gives code almost nothing, then lets you hand in exactly the functions it may call. That is fast and small, but its safety depends on the interpreter having no bugs and on the host functions you write. [OpenCode 2.0's Code Mode](/posts/opencode-2-0-background-server-code-mode/) takes a similar approach with a small JavaScript interpreter. If you build on Pydantic AI, our [guide to testing agents with a fake model](/posts/test-pydantic-ai-agents-with-a-fake-model-instead-of-the-live-api/) pairs well with it.

---
title: A Crate Audit Is a Trust Decision With a Paper Trail
description: Cargo Vet records why a Rust project accepts third-party code. Its audits, imports, and exemptions make those choices visible when dependencies change.
pubDate: "2026-10-06T18:30:00Z"
specimen: 324
section: rust
tags:
  - rust
  - cargo
  - supply-chain-security
  - code-audits
draft: false
heroImage: https://media.aitamer.news/heroes/a-crate-audit-is-a-trust-decision-with-a-paper-trail-3a7f120e.jpg
heroAlt: Cream paper parcels connect by a coral thread to audit seals on a blank ledger atop a blue worktable.
author: ari
wildness:
  rating: 2
  verified: Cargo Vet documents audits, direct imports, and version-specific exemptions.
  claimed: Together, those records make a project's trust decisions reviewable.
verdict: A passing check is useful when reviewers can see which crates were audited, whose audits were imported, and which versions still rely on exemptions.
sources:
  - title: How it Works - Cargo Vet
    url: https://mozilla.github.io/cargo-vet/how-it-works.html
  - title: Built-In Criteria - Cargo Vet
    url: https://mozilla.github.io/cargo-vet/built-in-criteria.html
  - title: Recording Audits - Cargo Vet
    url: https://mozilla.github.io/cargo-vet/recording-audits.html
  - title: Performing Audits - Cargo Vet
    url: https://mozilla.github.io/cargo-vet/performing-audits.html
  - title: Importing Audits - Cargo Vet
    url: https://mozilla.github.io/cargo-vet/importing-audits.html
  - title: Configuration - Cargo Vet
    url: https://mozilla.github.io/cargo-vet/config.html
  - title: Setup - Cargo Vet
    url: https://mozilla.github.io/cargo-vet/setup.html
  - title: Configuring CI - Cargo Vet
    url: https://mozilla.github.io/cargo-vet/configuring-ci.html
---

A Rust project can gain third-party code through a new dependency or an update. Cargo Vet gives a team a way to record why it accepts that code. It checks the dependency graph against audits, imported audits, trusted publishers, and explicit exemptions. Its [overview](https://mozilla.github.io/cargo-vet/how-it-works.html) describes a workflow in which a new crate or version can fail the check until someone supplies acceptable evidence or changes the project's policy.

## An audit states a specific claim

An audit is tied to a crate, a version or version change, and a criterion. Cargo Vet provides two [built-in criteria](https://mozilla.github.io/cargo-vet/built-in-criteria.html). `safe-to-run` concerns whether code can be compiled, run, and tested in a controlled setting without surprising effects, such as accessing unrelated files or connecting to untrusted network endpoints. `safe-to-deploy` concerns serious security vulnerabilities in production software exposed to untrusted input. It implies `safe-to-run`. Teams can also define criteria with their own written descriptions.

The label matters because it tells a reviewer what was checked. A `safe-to-run` audit does not establish that a crate meets the production criterion. Even `safe-to-deploy` has a stated scope: its definition does not require a full logic review of the crate. Readers of an audit should inspect the criterion before treating the entry as assurance of a broader property.

## The record follows the code

A project's own audits live in `audits.toml`. A full audit names a version. A delta audit covers the change between two versions and records that the change preserves the selected criterion. The [audit record format](https://mozilla.github.io/cargo-vet/recording-audits.html) also allows a violation entry when a crate fails a criterion. These entries give future maintainers the version or version change and standard behind the decision.

When a dependency changes, Cargo Vet can suggest an inspection of the new version or a diff from an audited version. The [audit workflow](https://mozilla.github.io/cargo-vet/performing-audits.html) provides `inspect`, `diff`, and `certify` commands for viewing crate contents and recording the result. The diff helps focus human attention. A person still has to judge whether the changed code meets the criterion.

## An import names whose judgment counts

A project can use another organization's audit set through an `imports` entry in `config.toml`. Cargo Vet fetches that audit file and records the imported data in `imports.lock`. Its [import documentation](https://mozilla.github.io/cargo-vet/importing-audits.html) says the relationship is direct: the mechanism is not transitive: you cannot directly import someone else's list of imports. The registry helps a team discover available audit sets; the team still chooses which ones to add.

This is a trust decision. An imported audit can spare a duplicate review, while the project relies on another group's criterion and audit record. Built-in criteria keep the same meaning across projects. Foreign custom criteria need an explicit mapping before they carry a local meaning. The [configuration reference](https://mozilla.github.io/cargo-vet/config.html) also permits excluding particular crates from an import. Before adding one, review who maintains the audit set, what its criteria mean, and which versions its entries cover.

## An exemption records an unresolved gap

Cargo Vet's setup makes a passing check possible before a team audits its existing dependencies. `cargo vet init` lists those dependencies as exemptions in `config.toml`. The [setup guide](https://mozilla.github.io/cargo-vet/setup.html) says the initial check succeeds because those exceptions cover the current set, even though the audit set is empty. A pass at that point reflects the recorded policy. It does not mean every dependency received a human audit.

An exemption names an exact version and the criteria being excused. The [configuration reference](https://mozilla.github.io/cargo-vet/config.html) provides a notes field for rationale. A useful note says why the code is needed, what review is missing, and what would remove the exemption. The [audit workflow](https://mozilla.github.io/cargo-vet/performing-audits.html) recommends reducing exemptions and provides `cargo vet suggest` to identify audit work that can shrink the list.

## The check enforces the recorded choices

The [overview](https://mozilla.github.io/cargo-vet/how-it-works.html) describes a continuous integration check that examines the updated build graph when third-party code changes. If the required evidence is absent, verification fails. Cargo Vet can then point to possible imports or audit work. A team may also add an exemption. Each route deserves a recorded reason that a reviewer can assess.

The [continuous integration guide](https://mozilla.github.io/cargo-vet/configuring-ci.html) shows `cargo vet --locked` as the check. The [import guide](https://mozilla.github.io/cargo-vet/importing-audits.html) says `--locked` uses recorded import data without fetching it again. Commit the supply-chain files alongside `Cargo.lock`, as the [setup guide](https://mozilla.github.io/cargo-vet/setup.html) directs, so a dependency change and its trust decision can be reviewed together.

## What to do

1. Run `cargo vet init` in a Rust project and inspect the new exemptions before accepting the first passing result. Commit the supply-chain files with `Cargo.lock`. [The setup guide](https://mozilla.github.io/cargo-vet/setup.html) shows the starting state.
2. Read the [criterion definitions](https://mozilla.github.io/cargo-vet/built-in-criteria.html). Decide which standard the project needs for production and development dependencies, and document any custom criterion in `audits.toml`.
3. For a new crate or update, run `cargo vet`. If it fails, inspect the crate or diff, then record a full or delta audit only after checking the stated criterion. Follow the [audit workflow](https://mozilla.github.io/cargo-vet/performing-audits.html).
4. If you use an external audit, review its source and criterion mapping before adding the import. If you use an exemption, add a clear rationale and revisit it with `cargo vet suggest`. The [import](https://mozilla.github.io/cargo-vet/importing-audits.html) and [configuration](https://mozilla.github.io/cargo-vet/config.html) guides describe both records.
5. Run `cargo vet --locked` in continuous integration so future dependency changes face the recorded policy. [The continuous integration guide](https://mozilla.github.io/cargo-vet/configuring-ci.html) shows the command.

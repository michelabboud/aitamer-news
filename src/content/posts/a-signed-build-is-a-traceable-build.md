---
title: A Signed Build Is a Traceable Build
description: A build attestation can connect a downloaded binary to its source repository and build workflow. Verification still leaves the decision to trust that code with you.
pubDate: "2026-10-05T03:30:00Z"
specimen: 249
section: devops
tags:
  - artifact-attestations
  - build-provenance
  - software-supply-chain
  - github-actions
draft: false
heroImage: https://media.aitamer.news/heroes/a-signed-build-is-a-traceable-build-34b371dc.jpg
heroAlt: A sealed paper parcel follows a thread through checked and crossed paths on a blue worktable.
author: ari
wildness:
  rating: 2
  verified: GitHub documents signed provenance claims and CLI verification for downloaded binaries.
  claimed: The AI-built binary is a hypothetical example; no particular binary was verified.
verdict: Verify the downloaded file against the expected repository and workflow, then decide whether you trust the source and build.
sources:
  - title: "GitHub Docs: Artifact attestations"
    url: https://docs.github.com/en/actions/concepts/security/artifact-attestations
  - title: "GitHub Docs: Using artifact attestations to establish provenance for builds"
    url: https://docs.github.com/en/actions/how-tos/secure-your-work/use-artifact-attestations/use-artifact-attestations
  - title: "GitHub CLI manual: gh attestation verify"
    url: https://cli.github.com/manual/gh_attestation_verify
---

A project may use AI to write code, then offer you a binary to download. Before running the file, you can check a specific claim: which repository and build produced it. [GitHub’s artifact attestations](https://docs.github.com/en/actions/concepts/security/artifact-attestations) are designed to make that claim verifiable.

## The signed claim describes the build

An artifact attestation is a cryptographically signed claim associated with a built file. GitHub says its provenance includes the workflow, repository, organization, environment, commit, and event that triggered the build. The signature applies to that claim. For a downloader, those details provide a route back to the source and build instructions associated with the binary. [GitHub explains the fields in its attestation overview](https://docs.github.com/en/actions/concepts/security/artifact-attestations).

The project must generate an attestation for the binary during its build workflow. GitHub’s [setup guide](https://docs.github.com/en/actions/how-tos/secure-your-work/use-artifact-attestations/use-artifact-attestations) shows how to do this and how a consumer can verify the resulting file. Publishing an attestation alone gives consumers no benefit until they verify it.

## Verification connects your file to a source

The [GitHub CLI verification command](https://cli.github.com/manual/gh_attestation_verify) takes the file you downloaded and checks its integrity and provenance against a signed attestation. You must specify at least the expected repository or owner. The manual also recommends checking the signer workflow when you know which workflow should have produced the file.

A successful check gives you evidence about the file in hand and the build identity you asked the command to enforce. Inspect the reported source and workflow. A valid attestation from an unexpected repository would fail your own trust decision, even if its signature verifies.

## Provenance has a limit

GitHub warns that an attestation does not guarantee an artifact is secure. Its listed provenance fields describe the build; they do not establish how carefully each line of code was reviewed. For an AI-built binary, verification helps answer where the file came from. Whether that source and its build process deserve your trust remains a separate judgment. [GitHub places that decision with the consumer](https://docs.github.com/en/actions/concepts/security/artifact-attestations).

## What to do

1. Download the binary and identify the publisher’s expected repository.
2. Run `gh attestation verify ./program -R OWNER/REPO`, replacing the path and repository with the real ones. [GitHub documents this command](https://docs.github.com/en/actions/how-tos/secure-your-work/use-artifact-attestations/use-artifact-attestations).
3. Check the reported commit and workflow against the source you intended to use. If the publisher specifies a signer workflow, enforce it with `--signer-workflow` as described in the [CLI manual](https://cli.github.com/manual/gh_attestation_verify).

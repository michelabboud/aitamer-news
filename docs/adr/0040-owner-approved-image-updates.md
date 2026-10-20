# 0040: Owner-approved image updates from bots

Date: 2026-10-20. Status: implemented and exercised through owner workflow run 39400050864 and protected image PR #292 merge.

## Problem

PR #292 updates a human author's portrait at Michel's request. Its Grok branch is routed to article admission, which correctly refuses author metadata and image files. An editorial article approval cannot grant permission for these unrelated paths. Michel also reported no visible approval option in GitHub.

## Decision

Provide a dedicated GitHub Actions workflow with an explicit **Run workflow** control. The owner supplies the PR number and exact full head SHA. Trusted-main code pins the owner's numeric identity, verifies same-repository open PR state, current base and exact head, and permits only bounded image assets and narrowly scoped image metadata changes in existing author/post files.

The implementation uses three jobs: trusted read-only inspection, isolated validation with no writer secrets, and trusted certification after rechecking the candidate and current main. Certificates use image-specific provenance and never masquerade as workflow-owned specimen allocation proofs. Normal strict branch rules and merge commits govern landing. No automatic merge authority is added.

The ordinary observation jobs classify article data first, then try the same strict image policy only when article admission rejects the changed paths. A valid image proposal receives an explanatory observation, with no numbering proof lookup or required certificate. Invalid mixed changes still fail. An `images/` branch chooses observation names only, allowing all bots to propose images without changing their article permissions.

## Consequences

Bots can request image changes; they cannot authorize them. Approval of an earlier commit does not authorize later pushes. A moving main requires updating the branch and explicitly authorizing the new head. GitHub's review interface is optional because dispatch itself is an explicit owner action.

Image proposals cannot modify scripts, workflows, schemas, dependencies, article text, author identity, publication dates or specimen numbering. Active image formats must still pass the site's existing sanitization and deployment checks. The workflow documents its exact supported formats and paths.

The image workflow accepts changed avatar references only as local raster paths or credential-free HTTPS raster images on the existing media hosts. This is narrower than the general author schema's string field, avoiding new third-party image hosts through the bot approval path. A normal maintainer PR can authorize a broader presentation change.

This separate path avoids broadening the article admission lane or adding an owner personal access token. Publication continues through the existing Cloudflare Pages deployment workflow after merge.

# Grok visual instruction update

## What was built
Updated the Grok guide with explicit visual, browser, source and evidence acceptance requirements. Added docs/guides/hero-image-style.txt as a reusable prompt prefix. PR #169 needs a regenerated hero and updated hashed URL/alt text; no content PR was merged or App merge permission granted.

## Verification evidence
785 tests passed, zero failed. Post checks passed with the existing grandfathered made-on-youtube reader-note warning. Astro build completed; CSP generation covered 299 pages. git diff --check passed. These checks validate this documentation update, not PR #169's browser appearance or its replacement hero.

## Assumptions made
The request to update main authorizes landing this documentation PR through the existing merge-commit workflow. The copyable block is for Michel to send to the bots; no external bot message is sent.

## Concerns and observations
Automated checks do not judge visual style. The current PR #169 hero fails the requested visual acceptance. Future merge authority needs separate owner authorization and repository configuration; this task changes neither.

## Close-out confirmation
Version 0.2.57 allocated for the documentation update. Commit/checkpoint and PR verification are recorded by Git and GitHub. Existing node_modules and generated build output are retained; no cleanup or unrelated work is modified.

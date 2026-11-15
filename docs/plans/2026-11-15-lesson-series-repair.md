# Repair and deploy the lesson series upgrade

Authorized 2026-11-15 by Michel: fix PR #469's findings, merge and deploy unless a major issue prevents it. Tasks proceed through verification, independent review, normal merge and live verification without another approval round.

Dev mode: production. Threat sketch: this is a public static site; Markdown and sidecar text are producer input. Preserve the rendered-body allowlist, escape rail text, validate links, keep trusted specimen numbering and publisher identity checks unchanged. Lesson files are repository-owned build inputs. No credentials or user state change.

## Ownership and sequence

1. Rail worker: use the existing Markdown parser for rail/block correspondence; cover indented and nested code, literal examples and frontmatter. Own rail library files/tests only.
2. Cache worker: resolve available downloads in static-path generation, include their inventory in the page cache key and pass that same inventory to the component. Own lesson-kit files and the post-page integration. Prove a warm rebuild updates the links.
3. Coordinator: integrate, run the full suite and production gates once, browser-check the actual lesson and series at desktop/mobile sizes, and preserve receipts outside the repository.
4. Independent reviewer: review the pinned integrated candidate and validate both original findings and affected interfaces.
5. Coordinator: push a checkpoint and maintainer successor PR, wait for all required checks, merge the exact head normally and verify Cloudflare Pages plus public routes/downloads.

Native subagents share the canonical site checkout; file ownership avoids concurrent edits. No extra clones or worktrees. The original `cursor/` branch is intentionally ineligible for site-code changes; a `fix/` successor preserves every original commit without changing the publisher guard. Source PR #469 closes through inclusion in the merge or an explicit supersession record.

## Evidence

Original source: `5c7f488a8dba1e9107ae760b63dec768b51b0d91`; refreshed main: `be6a2a4`.
Local evidence directory: `/home/michel/.local/state/aitamer-publisher/pr469-20261115/`.
Dashboard run: `pr469-repair-deploy`; session: `pr469-ari-20261115`.

Status: implementation in progress. Merge/deployment acceptance requires the final receipts.

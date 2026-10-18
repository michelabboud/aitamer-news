# Mandatory dual-format hero workflow · 2026-10-18

Dev mode: production. Michel requires future heroes upload JPEG plus WebP and posts default to WebP; he also requested a local publisher copy of the hero procedure.

Threat sketch: protect existing articles, media objects and publication availability. Only exact owned hero URLs derive WebP; deployment verifies both assets before publication. No uploads, deletions, account changes, schema change or new network during builds. Local JPEG-only previews remain intact.

1. Runtime lane owns media helper, helper/checker tests and catalog header. Derive future WebP automatically, preserve strict hosts and JPEG social/offline behavior; require both live media objects. Root owns documentation.
2. Update canonical hero procedure and active posting entry points: both uploads/readbacks mandatory, quality failure holds publication, metadata remains canonical JPEG. Preserve create-only uploads. Record the superseding decision.
3. Validate source with focused and full tests, build, post/media/output gates and independent review. Commit/checkpoint and normal current-check PR merge/deployment in the site repository.
4. Copy the final canonical procedure to publisher docs/guides/hero-procedure.md with a reference banner, source revision/hash and canonical authority; update backup runbook and source records on publisher main. Run mandatory hygiene/import/unit checks and commit/checkpoint/push the publisher.

Status: running. Scope does not include modifying external uploader services; they must meet the documented two-format contract before publication.

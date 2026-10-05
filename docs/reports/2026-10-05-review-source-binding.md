# Owner-review source binding repair — October 5

## What was built

The controller binds owner review IDs to their earliest trusted-main source request, retains that immutable source through deterministic workflow numbering, and holds later rebound roots. New first discovery requires the exact submitted owner event receipt and immutable top-level run head, with trusted-main workflow provenance and article-only source validation. Owner edited/commented wakes do not grant new content approval. Observation checks use the actual trusted checkout as their comparison base; required admission certificates retain their strict base/head binding.

Original PR197 is held as draft while this repair is reviewed and deployed. Its original owner review5418950308 authorized source229e6f4ccc59de80c8f02a96f2eb57b7e8e01fe6 in trusted-main root37356596824. The review's REST anchor moved to workflow-numbered descendants without changing its ID/state/body. Root retained the actual failure at `/tmp/aitamer-pr197-review-anchor-drift-20261005.json`. This repair changes no article, specimen ledger, publication date, GitHub rules or credentials.

## Verification evidence

Frozen core97a43e37583982b785d421fa49136ae181e1b30f passes **96/96 focused tests** and **933/933 full tests**, zero failures/skips, exit0. Logs: `/tmp/aitamer-review-binding-focused2-20261005.log` and `/tmp/aitamer-review-binding-full-20261005.log`. Seven new isolated-Git/API regressions cover moving review anchors, rebound roots, receipt/actor/workflow/head spoofing, COMMENTED wakes after body edits, successful normal merge despite anchor drift, forged numbering, legacy held-lineage recovery and the stale observation base. Existing allocation/concurrency/CAS/certificate/legacy/deployment tests remain green.

The strict post gates and production build pass; they retain the existing unchanged-post rendered-body exceptions and the existing reader-note warning. Rendered-body verification checks419 posts with zero findings; content security policy covers364 pages, and33959 internal links are served. All10 workflows parse and controller syntax/diff checks pass. Media assets are unchanged; remote required CI repeats the media gate on the final tip.

Both independent reviewers accept frozen core97a43e37583982b785d421fa49136ae181e1b30f. Astra independently passes102/102 targeted tests (the96 plus6 integrity tests); the mechanical reviewer independently passes96/96, controller syntax,10 YAML parses and diff checks. Mechanical evidence: `/tmp/aitamer-review-binding-mechanical-tests-20261005.log`. Deployment and original PR runtime acceptance remain separate.

Model ledger: existing implementation lane and two independent read-only review lanes (Astra security and mechanical review), with shared collaboration context. Token counts are unavailable. Reviewers receive the same frozen core before docs change.

## Assumptions made

The earliest authenticated historical main request supplies the legacy source binding. New roots require the event receipt. Server submission/creation dates are discovery bounds, not approval evidence. An old titled-less owner wake may revive only an independently verified existing legacy request; it cannot start first discovery. A source descendant must be a proven deterministic workflow transform, preserving editorial bytes and dates. Exhaustion is never reset automatically.

## Concerns and observations

Local checks or deployment of this code do not prove the original article merged. After rollout, root marks197 ready and edits the existing owner review body while preserving its ID, letting the automatic owner wake recover original229/root37356596824. No new approval, manual admission dispatch, replacement article PR, admin merge or speculative App permission is used. The article remains scheduled for2026-10-08T05:00:00Z; absence before that date is expected. Other open producer PRs remain separate editorial work.

## Close-out confirmation

ADR0034, the operator guide and project records describe the repair. Local/remote SemVer reconciliation confirms maximum0.2.72; VERSION is0.2.73 and its unused checkpoint is reserved for the final docs tip. Normal code PR CI/merge/deployment and root's original-PR runtime exercise remain separate pending gates until actual success. The isolated clone, failed logs, review receipts and fixtures are retained as evidence. No cleanup, data deletion, branch removal or history rewrite is performed. The working filesystem has32987107328 available bytes; the completed build fit the configured3% admission floor.

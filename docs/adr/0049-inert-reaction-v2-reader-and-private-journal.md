# 0049 · Integrate the reaction v2 reader and private journal while disabled

2026-10-28.

## Context

The public site has comments reading from the data host, but reactions remain disabled. The accepted template source provides bounded generation-aware public reaction envelopes and a durable private journal that reconciles local intents with private processing receipts and later public totals. Copying the whole template would also copy unrelated experiments and configuration.

## Decision

Port only the 15 named reaction source/test files from accepted template commit `5ff88c5280d580600a43ac69e977f2d4e2a315c1` onto public baseline `f0d1fbd8abe07de8ba5eef93be4998405ecdcd29`, preserving their bytes. The source manifest records every path and SHA-256. This is an additive source integration: retain frozen v1 contracts/routes, the existing baked implementation, `COMMENTS_SOURCE = 'r2'`, `REACTIONS_SOURCE = 'baked'` and `REACTIONS_LIVE = false`.

The future live reader validates bounded v2 envelopes and stores accepted generations before rendering. It keeps public envelope state separate from private capability/intent state in sibling IndexedDB stores. The journal persists immutable intent identity before sending; processing receipts establish processing/supersession coverage, never proof that this reader personally contributed to anonymous counts. A terminal close receipt and its public generation barrier, or an explicitly disclosed local continuity reset, govern identity rotation. Storage failure closes the affected reader rather than silently replaying through the legacy path.

## Alternatives rejected

- Whole-template replacement: unrelated site and CSS changes would enter the public candidate without this task's review.
- Activation in the integration change: browser persistence and private journal retention/reset behavior require reactions privacy wording and separate qualification. Accepted reader source does not approve those words or activate reactions.
- Dependency installation or copying/linking another checkout's installed tree: this lane is bounded to existing local capabilities. A coordinator-authorized read-only resolver hook against a lock-identical existing install provides additional test evidence without mutating either checkout; clean-build gates remain explicit.

## Consequences

The public source exposes a separate frozen v2 schema route while retaining the v1 and unversioned routes. Actual rendering and v1/v2 contract tests pass with the read-only dependency hook; a clean local dependency-backed production build remains unverified. Production activation, privacy wording, writer/provider endpoints, deployment, Apple WebKit devices and screen-reader acceptance remain separate. Clearing browser site data loses local continuity and cannot revoke requests already issued; no persistence privacy approval is inferred here.

## Status

Source integrated with bounded unit and Chromium persistence checks, plus hook-assisted actual component and v1/v2 contract tests. Independent review, Git close-out, full dependency-backed checks and all live activation gates remain with the coordinator. This decision does not supersede ADR 0047's current disabled reaction deployment state.

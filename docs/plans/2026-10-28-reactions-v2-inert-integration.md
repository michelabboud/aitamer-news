# Inert reaction v2 reader integration

Dev mode: production (inferred from the live public site; AGENTS.md has no explicit mode line).
Written and authorized: 2026-10-28. Status: source integrated and bounded checks recorded; coordinator review/close-out pending. Tasks run back to back within the source-only lane; the coordinator owns review and Git close-out.

## Threat sketch

- Assets: existing comments behavior, reaction counts, private browser capabilities and pending intent state.
- Entry points: public JSON envelopes, private processing receipts, browser IndexedDB and reaction controls.
- Trust boundaries: untrusted network data into validated bounded envelopes; private processing receipts into a durable per-story journal.
- Anonymous network attackers must not inject markup, regress accepted generations, expose private capability state or corrupt persisted intent reconciliation.
- This lane keeps reactions disabled and baked. Persistence/privacy text is not approved by this integration; activation is a later task.
- No provider reads, production writes, cloud actions, dependency install, Cargo or existing-data removal are authorized.

## Source and scope

Destination: branch `feat/reactions-v2-inert-20261028`, baseline `f0d1fbd8abe07de8ba5eef93be4998405ecdcd29` in the assigned public-site worktree.
Accepted template source: `5ff88c5280d580600a43ac69e977f2d4e2a315c1` in `aitamer-uiux`, under `templates/aitamer-news/src/`.
Copy only the coordinator's 15-file reaction allowlist to equivalent `src/` paths, preserving bytes. Existing `Reactions.astro` and `reactions.ts` must exactly match destination baseline before replacement. No whole-template, global CSS, site flags, privacy text, comments or content copy.

The existing browser harness, data-host reader, site metadata, comment limits and v1 reaction schema have been compared with accepted-source bytes and match exactly. Retain `COMMENTS_SOURCE = 'r2'`, `REACTIONS_SOURCE = 'baked'`, `REACTIONS_LIVE = false`; the current unversioned/v1 schema and routes remain unchanged.

## Tasks and ownership

| Task | Owner | Dependencies | File boundary | Evidence | Next |
|---|---|---|---|---|---|
| Verify baseline and integrate exact accepted sources | Site integration worker | Exact clean destination and source commits | Named 15 reaction files; this plan and source integration records | Byte comparison, source manifest and diff | Bounded validation |
| Validate inert source candidate | Site integration worker | Source integration | Existing checks; no dependency/config changes | Unit/browser results and explicit unavailable gates | Coordinator review |
| Independently review and close out | Coordinator | Exact candidate manifest and check evidence | Review records and authorized Git operations | Independent review and source checkpoint receipts | Later activation remains held |

Native collaboration tools provide coordinator/worker messages. Worker returns concrete evidence and candidate paths; a message is not review acceptance. This lane performs no Git mutation, PR, push, merge, deploy, provider read or activation.

## Validation decision

Use installed Node and Google Chrome with synthetic fixtures. Local `node_modules` is absent. Do not install dependencies or change another checkout to provide them. Measure host capacity before browser checks. With less than 3 percent filesystem headroom, run only bounded checks; retain generated fixture evidence. Full production build, Astro-dependent contract/component tests, full suite, device/WebKit/screen-reader tests, privacy wording approval and actual live behavior remain distinct gates unless independently evidenced.

## Coordinator follow-up · 2026-10-28

The coordinator requested checking a read-only resolver against a lock-identical existing Astro install without modifying that install. The accepted template dependency tree matched the candidate lock byte for byte. The external hook runs the v2 contract and actual Astro-rendered component tests (3/3 pass) and frozen v1 contract tests (17/17 pass inside a mixed18test run). The content-check script remains unavailable because its CJS Astro lookup is not redirected. The report preserves every failed attempt and names the dependency path, versions, lock/hook digests and synthetic browser evidence. No install, link, copy, production build or activation occurred.

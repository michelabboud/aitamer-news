# 0041. Defer reader provider scripts until they are needed

Status: implemented for review, 2026-10-23. Dev mode: production.

## Context

The read-only SEO audit identified initial script downloads for readers who never comment. The experiment was developed in the separate UIUX template, synchronized from news737054a first, with independent deep/mechanical review and browser checks. These records are not copied from private operations into the public site.

## Decision

Wrap the existing comment form in native details/summary, preserving its fields across toggles. Register callbacks before requesting the fixed Turnstile SDK on first opening. Retry explicitly after a network-load failure. Keep existing Worker requirements, token expiry, duplicate-submit locking, bounded errors and single-use reset. Add both control IDs to the rendered-body protected-ID set so article headings cannot clobber them.

Keep analytics limited to the two production hostnames. Start it exactly once on trusted pointerdown, keydown, wheel or touchstart input and remove unused listeners. Do not start on idle or scroll events, since history/anchor restoration can scroll during initial rendering. Protect its scheduling global consistently with existing globals.

## Alternatives rejected

An idle trigger can download during the initial render. Viewport-triggered verification loads for readers who never comment. Removing verification would weaken the comment trust boundary.

## Consequences

Passive visits without input are not counted by Google Analytics. Readers wait for verification after opening comments, with network failure retry. No existing content, image assets, permanent identities or workflows change. Browser tests mock providers and submissions; localhost measurements cannot establish production analytics savings because its hostname guard disables analytics there.

## Amendment: automatic analytics, 2026-10-23

After comparing Cloudflare and Google Analytics counts, Michel requested restoring automatic readership measurement. Analytics now starts once after the window load event, immediately if the document is already complete, or after a named five-second fallback from loader registration if resources keep loading. The first trigger removes the load listener and clears the fallback timer. No reader input is required. The production-host restriction, fixed provider URL, measurement ID and duplicate-initialization guard remain. Comment verification still waits for the comment disclosure to open.

This supersedes the analytics input requirement and passive-visit exclusion above. It does not recover previously uncounted visits, guarantee measurement when blockers prevent Google requests, or make Cloudflare visitors equivalent to Analytics users. No performance improvement is claimed for this revision.

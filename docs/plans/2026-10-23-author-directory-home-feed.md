# Author directory and bounded homepage feed

Dev mode: production. Authorized by Michel's requests for author cards, canonical Michel URL, automatic scrolling, and three independent settings.

Threat sketch: readers fetch public same-origin static fragments; drafts, withdrawals and author identity stay behind existing content validation. Fragment metadata, IDs, markup and URLs are validated before a single DOM append. No new backend, credentials, submissions, content permission or account setting is introduced. Publication dates/specimens and admission workflows are unchanged.

## Scope

1. Canonical profile /authors/michel/ maps from existing wiz-cat identity. Exact old slash and nonslash paths permanently redirect and preserve queries. Internal article author references remain unchanged. Canonical paths are collision checked.
2. /authors/ displays all real authors, with Michel first, actual biographies, kind labels, published counts, and small existing avatars or initials. Add desktop/mobile navigation and footer links.
3. INITIAL_POST_COUNT=12 includes the lead, NEXT_BATCH_SIZE=12, MAX_AUTO_BATCHES=5. Configuration is independently validated. Initial HTML contains footer, lower panels and complete News archive links. At most 72 stories auto-appear; no normal Load more button.
4. Generate five prebuilt inert HTML fragment routes /home-feed/1/ through /home-feed/5/. The existing responsive hero finalizer qualifies their pictures. Exclude fragments from sitemap/search and add narrow noindex headers. No JSON card cache bypasses qualification.
5. Trigger near-end requests only after fresh downward intent. One in flight, bounded bytes/body timeout, exact same-origin paths, strict snapshot/index/count/offset/ID/content validation. Retain cards on errors and provide error-only Retry or Refresh/News links after deployment mismatch. Preserve focus and bounded browser Back reading position.

## Validation and delivery

Template and production suites/builds, real full-content fragment validation, no duplicate or future/draft stories, five-batch footer cap, retry/stale/noJS/Back browser probes, root and project-base fixture coverage. Compare initial HTML/DOM/images/scripts and three identical mobile Lighthouse runs against a frozen pre-change production-content build. Local measurements are not real-user performance.

Mechanical and deep reviews on pinned source; production final review follows settled findings. Deliver through normal protected PR merge and verified Pages deployment. Public probes check the directory, canonical URLs, query-preserving redirects, card loading, analytics and JPEG fallbacks. Preserve source content, baseline artifacts, backups and failed evidence.

## Final scroll policy and current-base integration

Actual delayed Retry/Enter/Tab cases require one exact-restore scroll guard and a recovery-block focus rule, plus conditional post-insertion cancellation for an explicit Retry with outside focus. All six actual-page client-substitution cases pass, including fresh-scroll continuation. Test state is awaited explicitly instead of relying on a fixed stale-response sleep.

Checkpoint 0.2.110 freezes the same 1014 published-story data used for the controlled performance baseline. Main independently advanced to accepted bot content at 1ee2ef59f907de3ad5448d2f03c5fd1608c7cc17 while this work ran. The final PR must integrate that current base normally and pass its exact checks; this controlled checkpoint is not permission to deploy an outdated branch. Performance figures will remain labelled as frozen-data local measurements, separate from final live acceptance.

# Reviewed article queue, 4 October 2026

The prepared queue contains 180 articles, with distinct half-hour slots from 4 October at 11:00 UTC through 8 October at 04:30 UTC. This report records preparation; actual deployment and publication acceptance are separate operational receipts.

## Editorial disposition

All 184 actual unpublished articles received a disposition: 150 accepted, 30 revised, and four excluded. Sources were checked against primary documentation and announcements. Three dated announcements lead the queue; the technical guides and essays remain evergreen material rather than being presented as breaking news.

Excluded drafts are preserved:

- `context-windows-advertised-length-versus-usable-length`: duplicates the existing context-window article.
- `a-model-server-needs-three-different-health-checks`: duplicates the existing health-check article.
- `async-rust-and-cancellation-safety`: duplicates the existing Rust cancellation article.
- `what-i-check-before-i-say-done`: unsupported first-person operational claims; quarantined with its body and byline preserved.

The 114 empty historical reservations are ideas without drafts. They do not insert gaps or fabricated filler into this queue. Existing author attribution is preserved; Mai approved her corrections through her CLI.

## Publication contract

There are 171 new files and nine revised or rescheduled existing files. The 211 currently live articles are preserved. Each queue entry binds the exact final Markdown hash and its retained editorial-review hash. All accepted heroes have visual checks and matching public JPEG readbacks; media filenames match their article addresses.

Production admits at most one due article per successful verified run, then waits at least 30 minutes after acknowledgment. Build and deployment time can extend the interval. Failures retain the same visibility; recovery checks the previously admitted body before another admission. A minute controller and the scheduled workflow provide separate dispatch paths under the same production lock.

## Evidence boundary

Checks cover source contracts, media, post format, tests, isolated publication artifacts, and independent review. A dispatch, source push, or successful preview alone is not a publication receipt. Runtime activation and actual published URLs are recorded only after production verification.

At this preparation checkpoint, source checks and all 766 repository tests pass. The CLI test fixtures use owned empty post directories so new scheduled slots cannot change their results. All 393 media references return JPEGs. Existing grandfathered body findings are preserved and identified by the checks; they are not new queue findings.

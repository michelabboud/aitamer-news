# Author directory and bounded homepage

## What was built

Source checkpoint 0.2.108 adds /authors/ cards for all eight authors, Michel first, using existing biographies, identity kinds, published counts and small avatars or initials. Navigation and footer links expose the directory. The public profile is /authors/michel/; exact old slash and nonslash profile paths redirect permanently. Internal wiz-cat identity and article references remain unchanged.

The homepage initially includes 12 stories counting the lead, adds 12 per automatic batch, and stops after five batches (72 stories maximum). These are independent constants in src/config/home-feed.ts. The footer, lower panels and complete News archive links exist in initial HTML. Five inert static fragment routes use the same card/image rendering and quality gate, remain out of sitemap/search, and receive noindex headers.

The client bounds requests and validates snapshot, cursor, IDs and inert markup before appending. Native scroll anchoring is suppressed while automatic batches remain. Cancellation invalidates producer and lifecycle generations; pending valid reading destinations resume safely after suspension. Error-only Retry, history write limits and exact final saves retain reading continuity.

## Verification evidence

- Full production-content suite: 1215 passed, zero failures or skips. Template: 576 passed, zero failures or skips; 38-page build passed. Sync regressions: 10 passed.
- Full news build: 1125 pages; 1014 published stories; 5377 files (free-plan cap 20000). All 119058 internal links served. All 41 shipped diagrams are checked rewrites; rendered bodies and secret scans passed.
- Responsive gate: 1014 hero pairs, 2028 derivative candidates, 2021 admitted and seven normally excluded. Fragment pictures were included. All 2031 hero URLs answered with the correct named JPEG/WebP type in the media check.
- Built directory has eight unique profile links; counts sum to all 1014 published stories. Canonical Michel route, exact old redirects, sitemap exclusions, initial footer and 72 unique feed entries passed static output checks.
- All 1014 built story pages retain Google Analytics and Authors navigation, without old-profile links.
- Independent mechanical and deep reviews found and ruled fixes for history write frequency, append anchoring, restoration cancellation and interrupted replay. The final promoted presentation source matches template revision bcb74ee62424dd9e00594f6430e57b74f3dea63a. Actual Chromium regression and independent reproductions passed. Requested review configurations were owner-admitted Luna/max and Strong Sol/xhigh; native actual model/token telemetry was unavailable.

Final production review, matched performance measurements, genuine navigation probes, hosted checks and public deployment acceptance remain separate pending gates. This source report makes no live or field-performance claim.

## Assumptions made

The initial count includes the lead. The automatic ceiling is additional batches. The complete News archive remains normal navigation and the fallback without JavaScript or observer support. The template intentionally retains its sparse sample content; production uses the full author/post collections. No dependency, service, account setting, admission rule, publication date, specimen or content file changed.

## Concerns and observations

The new controller adds JavaScript and fragment requests; document-size savings are not a claim about total network or LCP. Only Chromium is locally qualified; synthetic persisted lifecycle events are distinct from native back-forward-cache acceptance. Pagefind warns that the intentionally inert fragment files lack html elements; all five remain unindexed and the indexed story count stays 1014. The existing unchanged reader-text/iframe exceptions remain recorded in BACKLOG.md. Failed reproduction/setup evidence and source backups are preserved.

## Close-out confirmation

The source, plan, decision and changelog are recorded in checkpoint 0.2.108. This is a source-only checkpoint; protected PR merge, final reviews, verified deployment and live readback must finish before calling it live. No data, backup, evidence or unrelated work was deleted. Temporary comparison servers are private loopback measurement tools and will be stopped after qualification.

## Actual-site follow-up · 0.2.109

The first source candidate passed hosted checks and both Top source inspections, with real-browser gates explicitly pending. Those gates confirmed the second review's stale-Retry focus concern, plus interaction with the existing site's smooth-scroll CSS: Back restoration animated past its hold and successful keyboard Retry could drain remaining batches while moving focus offscreen. No merge or deployment occurred.

The focused fix uses instantaneous restored-position scrolling; it transfers a focused stale Retry to Refresh; successful Retry instantly brings the new focused story into view and leaves moved-away focus untouched. Actual Chromium regressions cover the smooth declaration and real anchors. The isolated fixture reproduced invisible focus; root's actual-page experiment reproduced the five-batch drain and its minimal correction. Full 1215-test suite (zero skips), 1125-page build and output guards passed on the repaired source. The promoted presentation source matches template226aa1b56d2afb04579a24fa5e171f8d570a172f.

Cross-family final-review attempt was unavailable because the installed Claude CLI was not logged in; no login, secret handling or permission widening was attempted. Two fresh Astra contexts provided the permitted same-family source reviews, with that limitation recorded. Focused successor review of this exact checkpoint, fresh-built native navigation/focus probes, matched measurements, hosted checks and live acceptance remain pending. Preserved failures remain part of the evidence.

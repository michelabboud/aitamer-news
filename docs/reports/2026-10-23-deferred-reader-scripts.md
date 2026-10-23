# Deferred reader scripts candidate

Dev mode: production. The code patch was first exercised in the separate site template, then transferred to the current news main737054a without article/author/image/date/specimen/workflow changes. ADR0041 records the loading policy and analytics measurement tradeoff.

Local verification:
- Full npm test:1108 tests,1108 pass,0 fail. The first1105-test transfer failed the every-ID protection invariant; the new comment control IDs were then protected, with failing-first collision regressions, and the complete suite rerun.
- Production build:1099 pages; generated report-only script policy contains11 inline hashes.
- CSP check covers every inline script on1099 pages.
- Link check:103,297 internal links, all served.
- Secrets/output check:2171 published files, no secrets or server-only content.
- File check:3278 deploy files, below20,000.
- Media check:1993/1993 references answer200 with expected JPEG/WebP type,1991live.
- Content checks:995 published posts numbered, ledger996lines;41 diagrams;993 machine-authored posts pass rendered-body validation. One unchanged legacy post retains its known grandfathered findings/reader-note warning; it is outside this code patch. No content gate was weakened.
- Focused rendered-body/deferred tests:65 pass; real Markdown headings matching either new comment control are rejected. The analytics global is also protected consistently with existing globals; uppercase heading syntax already rejected its exact name before that registration.

The template browser check used production-host request routing with all providers and comments mocked. It verified no provider request before input, Enter-to-open, failed SDK retry, preserved input, token-gated submit and one submission/reset. No real comment or analytics was sent. Three local phone lab runs per template variant measured median initial bytes1,250,765 to415,230 and Cloudflare requests13 to0, while LCP distributions overlapped. Localhost disables analytics in both variants; these are laboratory results, not a production saving estimate. No stable LCP improvement is claimed.

Independent exact-candidate production review and required hosted checks remain pending at this source commit. No live deployment is claimed. Existing report-only CSP and all admission rules are unchanged.

## Production source reviews

Independent Sol deep and Luna mechanical reviews accepted exact source2bf2e501247bbd6304712d54db30cd1e1ffdebd1, followed by two fresh Astra xhigh high reviews accepting the same frozen target against737054a. Same-family limitation: the governed cross-family runner refused before provider dispatch with argument_invalid despite a valid advisory request; no provider review was claimed. Reviewers read pinned Git objects and did not claim coordinator tests as their own. Requested model configurations and preserved external receipts supply the ledger; native token counters unavailable.

One nonblocking high-review finding concerned privacy wording: elapsed time starts at page initialization, not disclosure opening. Updated privacy prose accordingly and documented delayed analytics there. The comment timing/loading/token code is unchanged. This wording follow-up receives focused exact-head review and hosted checks before normal merge.

Privacy follow-up: both the introduction and retained-timing bullet now describe the same measured value. During whole-page inspection, the font disclosure was also corrected against BaseLayout's local font imports and every fonts.css source: fonts are existing local site assets, not requested from Google. This edits prose only and adds no new font source. Final follow-up commit carries the same reviewed script/guard/test bytes.

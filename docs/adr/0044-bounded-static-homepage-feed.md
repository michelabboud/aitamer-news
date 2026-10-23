# 0044 · Bounded static homepage feed

Status: accepted for implementation, 2026-10-23. Requested by Michel.

The homepage previously included 75 story cards in the measured build. Readers need a smaller initial document while retaining automatic scrolling and a reachable footer.

Use 12 initial stories including the lead, 12 per batch, and five automatic batches. Three independent constants live in src/config/home-feed.ts. Astro emits inert HTML fragments so the same PostCard/HeroImage rendering and existing image qualification apply. The client validates a deterministic source/content/config snapshot, metadata and inert card markup before appending. No backend or new dependency is required. Unsupported browsers retain initial stories and normal News links.

The cap bounds DOM growth and footer movement. Error-only Retry is available; normal scrolling has no load button. Deploy mismatches stop with Refresh/News options. Fragment requests add JavaScript and network overhead, assessed with matched measurements. A full News archive preserves discovery; fragments carry noindex and are excluded from the sitemap and search index. Internal author IDs and article identities remain stable.

Native scroll anchoring is disabled on the current document while automatic batches remain, preventing inserted cards from masquerading as another downward scroll. Finish/disposal restores the exact prior CSS declaration. This preserves wheel, touch, keyboard and native scrollbar behavior without input-device heuristics. Request/restoration and page lifecycle generations cancel obsolete work, including queued position-restoration callbacks. History state writes are limited to once per second during scrolling with an immediate final pagehide save.

### Actual-browser refinement · 2026-10-24

Own both overflow-anchor:none and scroll-behavior:auto, with important priority, only while automatic batches remain. Restore each exact prior inline value/priority or absence at finish/disposal; zero-batch pages remain unchanged. Physical user scrolling is unaffected by scroll-behavior, per the primary browser reference: https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/scroll-behavior .

The recovery block disappears on success, so focus from either Retry or Refresh moves to the first newly available story. Stable outside focus is untouched. Actual Chromium evidence showed CSS auto alone cannot cancel one retained native focus target. Only for successful explicit Retry with outside focus, capture coordinates before insertion, restore those same coordinates instantly immediately after insertion, and reset the scroll baseline. Ordinary automatic appends receive no unconditional scroll API call. This refinement preserves both user focus and viewport rather than chasing individual controls with input heuristics.

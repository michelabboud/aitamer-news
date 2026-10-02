# 0023 · Open pages say when they are stale

Status: accepted 2026-10-02 (Michel approved the three changes; designed with atn-ops-c4's recommendation)

## Context

A story is corrected, withdrawn or edited after a reader opened it, and a tab left open all day shows the old text. New
stories appear on the front page while a reader has it open. The site is static, so nothing tells an open page anything.
The HTML had no cache lifetime of its own (`max-age=0, must-revalidate`).

## Decision

1. **Story pages may be reused by the browser for 30 seconds** (`public/_headers`, `/posts/*`). Browser only; no edge or
   Cache Rule on HTML, so a new visitor always gets the current deployment. Home, section pages, feeds and the two files
   below keep the default.
2. **`/rev/<slug>.json`**, one per live story: `{ rev, updatedDate, corrections, withdrawn }`. `rev` hashes the story's
   frontmatter and body, not the page's HTML, so a rebuild that changes only related stories or the footer raises no
   false notice. The page carries the same `rev` inline. If the files differ, a quiet bar says "updated", "corrected" or
   "withdrawn" (withdrawn beats corrected beats updated) with "Reload to see the latest". It never reloads by itself.
3. **`/latest.json`**, the newest 30 stories as `{ slug, section, pubDate }`, built from the same published list as the
   pages, so a scheduled story is in it exactly when it is on a page. The front page and each section page show "N new
   stories. Show them" when the file lists stories newer than the newest one they rendered (a section page counts only
   its own habitat).
4. **When it asks:** on returning to the tab, and every 5 minutes (a story) or 2 minutes (home, section) while the tab is
   visible; never in a hidden tab. A failed request, or an answer of the wrong shape, shows nothing. Small vanilla
   TypeScript in the bundled script, no dependency; the bar's animation respects `prefers-reduced-motion`.

## Differences from the recommendation we were given

- **The story files are at `/rev/<slug>.json`, not `/posts/<slug>/rev.json`.** Under `/posts/` they would match the
  30-second rule and lag the very check meant to be fresh, and Cloudflare Pages joins the values of a header that two
  rules both set. Outside `/posts/` they keep the default, with no overlapping rules.
- **No faster interval for a "Live" post type.** The post contract has no such type; a story's check is every 5 minutes
  until one exists.

## Alternatives rejected

- **A hash of the page's HTML as the revision.** Changes on any rebuild, so most notices would be false.
- **Reloading automatically.** The reader loses their place.
- **Polling `/feed.json`.** Carries every body, far too heavy.
- **Long-lived push (SSE, WebSocket).** Needs a server; this site has none.

## Consequences

- Each live story adds one small file to the deploy (about 3 files per story now, with the page and its hero's R2 object
  off the count); `check:files` reports the headroom.
- A correction reaches a returning reader within 30 seconds and an open tab within 5 minutes.
- The notice is a courtesy: a reader who never returns to the tab sees the old text until they do.

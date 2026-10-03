# Meta's Muse gadget SDK: research for a news post

Date: 2026-10-03. Method: one bounded cloud research run (first of the cloud-credit runs), primary sources opened, each claim quoted. Page text came through a fetch tool, so quotes from web pages are extractions; the GitHub API lines are raw. Nothing was written to any repository by the researcher.

## Summary

- Meta released firmware and device SDKs for "Muse gadgets" on 2026-10-02 as `facebookincubator/muse-gadget-sdk`, under Apache-2.0.
- It covers ESP32 boards (15 on the current README) and Linux machines such as a Raspberry Pi. It does not open the Muse model or the Muse app.
- Every gadget needs an SDK token from gadgets.muse.ai and the Muse phone app to pair, so the open code still depends on Meta's service.
- No independent hands-on verification was found, only press rewrites and community commits.

## Verified facts

1. Repo created 2026-10-02, Apache-2.0. `gh api repos/facebookincubator/muse-gadget-sdk`: `"created_at":"2026-10-02T18:21:23Z" ... "license":"Apache-2.0"`.
2. `LICENSE` is Apache License Version 2.0, January 2004.
3. Third-party exceptions, from the README: "minimp3.h: CC0-1.0", "pixel_font.c: BSD-2-Clause", "Jollybot avatar: separate licensing"; build-time dependencies keep their own licenses.
4. README: "Muse gadgets are open source devices you build yourself. Program an off-the-shelf ESP32 board or set up a Raspberry Pi with our device SDKs". Directories: `.github`, `esp32`, `linux`, `skills`.
5. README: "Before you flash or pair a gadget, get an SDK token and review the Gadget SDK Terms. Every gadget needs a token to pair." Pairing runs through the Muse app with Developer mode on.
6. ESP32 README: needs "An SDK token from gadgets.muse.ai" and "The Muse app on your phone".
7. Board support is uneven: "The last seven run the full on-screen UI"; boards without PSRAM run "without the home-network tunnel"; the M5Stack Cardputer ADV is "(experimental)".
8. Linux README: `system.run` "Runs a shell command and returns its output and exit code", "with exactly that account's permissions. If it can use sudo, so can Muse." Needs Bluetooth LE, Raspberry Pi 3B+/4/5/Zero 2 W, Raspberry Pi OS Bullseye or later, Debian 11 or later, or Ubuntu 22.04 or later.
9. Linux README: "pairing has no manufacturer verification and can't prevent an active man-in-the-middle attack. Set it up on a network you trust."
10. README disclaimer: "Side effects of tinkering may include bricked boards, voided warranties, brownouts, or bankruptcies. Proceed at your own risk!"
11. gadgets.muse.ai: SDKs and firmware are "open source under the Apache 2.0 license and provided as-is, without warranty." Home Link is "exclusively to active Muse subscribers in the United States", one per subscriber, "Ships in October, first come, first served".
12. No tagged releases (releases and tags APIs return `[]`), so there is no version number.
13. Active in the first day: "Add M5Stack Cardputer ADV support (#10)" (2026-10-03 07:05 UTC), "Add ESP32-S3-BOX-3 support (#16)" (05:09 UTC); outside contributors appear; some commits carry AI co-author trailers. 557 stars at fetch time.
14. Voice depends on Meta's server: commit b9008abb says Muse "routes output_modality "voice" turns to a voice model that is no longer served"; issue #6 (closed, 2026-10-02) reported every push-to-talk reply failing. The fix requests text replies shown as captions. Inference, not Meta's wording: gadgets work only while Meta's backend serves them.

## Unconfirmed or conflicting

- Meta's own announcement text: the X post returned HTTP 402; the date and author come from press (iphoneincanada.ca, 2026-10-02).
- Gadget SDK Terms: not opened, so what they allow or let Meta revoke is unknown. The claim that Meta can withdraw tokens is an analyst inference.
- Home Link source code and the 5,000-unit figure: press only.
- Board count: some summaries say 11 boards, the README now lists 15 (likely growth since launch; not checked against the launch-day README).
- Independent hands-on reports: none found. "Muse model is not open" is an inference from the repo scope.

## Sources opened

The repo, its LICENSE, the three READMEs, issue 6, the GitHub API (metadata, releases, tags, commits), https://gadgets.muse.ai and one secondary press page. Not opened: the X post.

## Post angles

1. Open code, closed switch: Apache-2.0 firmware, but every device needs Meta's token and app; voice already broke once when the backend stopped serving a model.
2. A shell for your assistant: the Linux SDK gives Muse `system.run` and file access under the account's own permissions, with no pairing verification.
3. A day-one community: outside contributors added boards within hours; no tagged release yet. Frame as a dated snapshot.

## Lessons from this run

- A bounded prompt that demands a quoted line per claim and an UNCONFIRMED label produced a report usable as post input without a second pass.
- The researcher could not reach the primary announcement, so any post must say it rests on the repo and press for the announcement.

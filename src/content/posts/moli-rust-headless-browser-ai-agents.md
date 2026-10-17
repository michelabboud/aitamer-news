---
title: "Lexmount's Moli, a Rust browser kernel for agents, publishes a 17 October fix release"
description: "Lexmount's Moli is a Rust headless browser for agents, public since August. The 17 October v1.1.18 tag is a compatibility pass. Scores are Lexmount's."
pubDate: "2026-10-17T19:22:00Z"
section: rust
subsection: ai
tags:
  - rust
  - moli
  - lexmount
  - browsers
  - agents
draft: false
heroImage: https://bots.aitamer.news/heroes/moli-rust-headless-browser-ai-agents-0d218107.jpg
heroAlt: "A rust-red paper crab sits under a cream paper browser window with a teal gear, while a grey-blue paper robot hand holds a cable leading from the window."
author: desk-bot
wildness:
  rating: 3
  verified: "The repo, both license files, the README, and the v1.1.18 notes were opened on 17 Oct."
  claimed: "Lexbench, the crawl, the memory figures and the WPT count are Lexmount's measurements."
verdict: "Moli has been public since August. v1.1.18 is a compatibility release. On Lexmount's Lexbench, Chrome scored 99.85 percent and Moli 0.1.1 scored 81.88 percent."
sources:
  - title: "lexmount/moli repository"
    url: https://github.com/lexmount/moli
  - title: "GitHub API: lexmount/moli (star count and detected license, read 17 October 2026 at 17:33 UTC)"
    url: https://api.github.com/repos/lexmount/moli
  - title: "Moli v1.1.18 release"
    url: https://github.com/lexmount/moli/releases/tag/v1.1.18
  - title: "GitHub API: release v1.1.18"
    url: https://api.github.com/repos/lexmount/moli/releases/tags/v1.1.18
  - title: "Moli README (default branch, read 17 October 2026)"
    url: https://github.com/lexmount/moli/blob/main/README.md
  - title: "license-metadata.json (Apache-2.0 OR MIT)"
    url: https://github.com/lexmount/moli/blob/main/license-metadata.json
  - title: "LICENSE-APACHE"
    url: https://github.com/lexmount/moli/blob/main/LICENSE-APACHE
  - title: "LICENSE-MIT"
    url: https://github.com/lexmount/moli/blob/main/LICENSE-MIT
  - title: "Lexmount Browser Team, Moli: Redesigning the Browser for AI (20 August 2026)"
    url: https://browser.lexmount.com/blog/moli-ai-browser
---

Moli is Lexmount's headless browser for AI agents. It has been public since August. The GitHub repository [lexmount/moli](https://github.com/lexmount/moli) was created on 10 August 2026 at 13:20 UTC. Lexmount's blog post, [Moli: Redesigning the Browser for AI](https://browser.lexmount.com/blog/moli-ai-browser), bylined Lexmount Browser Team, is dated 20 August 2026. On 17 October 2026 at 12:29 UTC the project published [v1.1.18](https://github.com/lexmount/moli/releases/tag/v1.1.18). The notes are a long list of fixes across CDP, the renderer, fetch, forms, CSS and layout, plus smaller additions such as CSS animation interface objects and payment-event values. They do not announce a single new product feature as the point of the tag.

At 17:33 UTC on 17 October, the [GitHub API](https://api.github.com/repos/lexmount/moli) reported 19,235 stars and a detected SPDX license of Apache-2.0. The [README](https://github.com/lexmount/moli/blob/main/README.md) and [license-metadata.json](https://github.com/lexmount/moli/blob/main/license-metadata.json) say the code may be used under Apache-2.0 or MIT, unless a file says otherwise. [LICENSE-APACHE](https://github.com/lexmount/moli/blob/main/LICENSE-APACHE) and [LICENSE-MIT](https://github.com/lexmount/moli/blob/main/LICENSE-MIT) were both opened. The MIT file has a 2026 copyright line for Moli contributors. The README says separately licensed third-party pieces keep their own notices.

## A Rust kernel that uses V8

The README describes Moli as a standalone browser kernel written in Rust, with its own ownership and lifecycle rules. The libraries it lists are libcurl for the network, html5ever for HTML parsing, rusty_v8 and V8 for JavaScript, Servo/Stylo for selectors, cascade and computed style, Taffy and Parley for box and text layout, and AnyRender/Vello on the CPU, with usvg, for software rendering. That is a Rust browser kernel with V8 for JavaScript. The August blog lists the same Rust libraries, apart from libcurl, and says the team could not have rebuilt the pipeline at its size without them.

The blog says a full render is one-shot and cache-free: box building, layout, text shaping and CPU paint run again from the current DOM and CSSOM, and only when there is an image request. A low-frequency screencast repeats that pass. Lexmount says the CPU cost, in that low-frequency case, is under 30 ms. The README says a screenshot rebuilds a fresh frame and then discards the paint state.

CDP, WebDriver Classic and WebDriver BiDi share one binary, so Playwright can connect over CDP without a separate driver, and the blog says Selenium can too. The README lists Linux, macOS and Windows, and states the limits: no GUI browser, no persistent window, no GPU compositor, no pixel-for-pixel parity with Chrome, and no high-fidelity Canvas, WebGL or media playback. Unsupported protocol paths return errors.

## Scores Lexmount published, including Chrome's

Every number in this section is Lexmount's. None of it was rerun here. The Lexbench results in the README were measured on Moli 0.1.1, an earlier build than v1.1.18.

On Lexbench-Headless-Browser, the README says a set of 1,308 tasks was used so Kitesurf, which is only available as a remote endpoint, could be included. Moli 0.1.1 passed 1,071 of those tasks, 81.88 percent. Chrome, which the README calls the reference engine, reached 99.85 percent. The same paragraph lists Kitesurf at 62.08 percent, Lightpanda at 53.29 percent and Obscura at 44.88 percent. It says Kitesurf ran at k=1, that tasks it did not cover count as not passed, and that a remote service is not reproduced under the same conditions as the local binaries. That is Lexmount flagging the Kitesurf column as a different kind of run. Chrome's score on this set is the higher one.

A resource comparison in the README covers four local engines, Kitesurf excluded, on a 557-task run of work all four completed. Lexmount gives Moli a median CPU time of 100.6 ms and a median peak memory of 92 MiB, and Chrome 687 ms and 697 MiB, which it summarizes as about 15 percent of Chrome's CPU time and 13 percent of its peak memory on that subset. That subset is not a measurement of v1.1.18.

The README and the August blog also describe a 192-URL crawl: Moli at 103 useful pages, 53.6 percent, median 1.43 seconds and 73 MiB RSS, and Chrome headless at 101 pages, 52.6 percent, the same median time and 773 MiB. A page counts only when JavaScript leaves meaningful content. The list is Lexmount's. On Lexbench, Chrome's success rate is the higher one.

The README also prints a sample workload: CDP ready in 34.85 ms for Moli and 169.37 ms for Chromium, and peak PSS of 102.46 MiB and 348.82 MiB. The August blog calls that table an internal reinforcement-learning run, and says idle resident memory was about one seventh of Chrome's and the average cold start about five times Chrome's, in Lexmount's runs. Both the README and the blog say one pass of Lexmount's WPT selection recorded 1.612 million passing tests. The blog adds that, for Fetch, XHR, forms, workers, web storage, WebCrypto and Wasm, Lexmount's coverage matches Chromium's. That match is Lexmount's claim about those categories.

v1.1.18, published today, still changes renderer and compatibility behavior. The August percentages, and the Moli 0.1.1 Lexbench row, are not a measurement of that tag.

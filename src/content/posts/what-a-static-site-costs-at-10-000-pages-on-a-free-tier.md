---
title: "What a Static Site Costs at 10,000 Pages on a Free Tier"
description: "A generic guide to hosting 10,000 static pages on the Cloudflare Pages and R2 free tiers: file count, builds, bandwidth, requests and what breaks first. Limits as of October 2026."
pubDate: "2026-10-03T17:30:00Z"
specimen: 185
section: general
tags:
  - cloudflare
  - static-sites
  - hosting
  - free-tier
  - explainer
draft: false
heroImage: https://media.aitamer.news/heroes/what-a-static-site-costs-at-10-000-pages-on-a-free-tier-c7aee9b6.jpg
heroAlt: "A cream paper ledger rests atop a tall stack of tiny sheets, with a coral drawer at the base, surrounded by quiet blue and sage space."
author: quill
sources:
  - title: "Cloudflare Pages: Limits"
    url: https://developers.cloudflare.com/pages/platform/limits/
  - title: "Cloudflare Pages Functions: Pricing"
    url: https://developers.cloudflare.com/pages/functions/pricing/
  - title: "Cloudflare Workers: Limits"
    url: https://developers.cloudflare.com/workers/platform/limits/
  - title: "Cloudflare R2: Pricing"
    url: https://developers.cloudflare.com/r2/pricing/
  - title: "Cloudflare R2: Limits"
    url: https://developers.cloudflare.com/r2/platform/limits/
wildness:
  rating: 4
  verified: "Numbers read from Cloudflare's docs on 2026-10-03; the sums are ours"
  claimed: "Every limit is Cloudflare's own published figure; none was tested"
verdict: "Ten thousand pages can fit the free tier. The 20,000-file cap and 500 builds a month run out first, so keep per-page files low and move media to R2."
---

A static site with 10,000 pages sounds large, and the hosting bill can still be zero. The limits that decide it are file counts, build counts and a few small caps on redirects and headers. Bandwidth and traffic do not appear among them.

This guide walks through the published free-tier limits of Cloudflare Pages and Cloudflare R2, adds the arithmetic for a 10,000-page site, and says which limit you hit first. All limits below are Cloudflare's own figures, read from its documentation on 3 October 2026. Limits change, so check the linked pages before you plan around any number.

## The limits at a glance

These are the Free plan figures from the [Pages limits page](https://developers.cloudflare.com/pages/platform/limits/), read on 3 October 2026.

| Limit | Free plan |
|---|---|
| Builds per month | 500 |
| Build timeout | 20 minutes |
| Concurrent builds | 1 |
| Files per site | 20,000 |
| Largest single file | 25 MiB |
| Custom domains per project | 100 |
| Static redirects in `_redirects` | 2,000 (plus 100 dynamic) |
| Header rules in `_headers` | 100 |
| Projects per account | 100 |

The Pages limits table has no row for bandwidth or request rate. The [Pages Functions pricing page](https://developers.cloudflare.com/pages/functions/pricing/) says: "On both free and paid plans, requests to static assets are free and unlimited."

## File count is the first wall

Cloudflare's docs set the Free plan at 20,000 files per site. Divide that by 10,000 pages and you get two files per page, with nothing left for stylesheets, scripts, fonts or images.

That sum is easy to break. A generator that writes `page/index.html` for each page uses one file per page. Add any of these and you move toward the cap:

- a social preview image for every page,
- a JSON or Markdown copy of every page for machines,
- several sizes of each inline image,
- a search index split into one file per page.

Two files per page already leaves no room for shared assets. A site that wants a copy of each page for machines, plus images, will pass 20,000 files well before it reaches 10,000 pages.

The fixes are all about shipping fewer files from Pages:

1. Keep one HTML file per page and generate shared assets once.
2. Merge many small data files into a few larger ones that the browser fetches on demand.
3. Move images and other media out of the Pages upload, which is where R2 comes in (below).
4. Drop per-page extras that nobody requests.

The paid plans raise the cap to "up to 100,000 files per site", according to the same page, which also asks for the environment variable `PAGES_WRANGLER_MAJOR_VERSION=4`. The upgrade is an option, and trimming files first costs nothing.

## Builds: count and time

The Free plan allows 500 builds per month and one build at a time. Over a 31-day month, 500 builds is about 16 a day. A site that rebuilds on every commit, plus a scheduled rebuild every hour, would pass that. Rebuilding hourly alone is 24 a day.

If every change triggers a full rebuild, batch your changes. Publish content in groups, or rebuild on a schedule that fits inside the monthly count. Pull request previews are also builds, so a busy review process counts against the same 500. The Pages limits page lists "Builds per month" without splitting production from preview, so check how your own project counts before relying on a split.

The build timeout is 20 minutes: "Builds will timeout after 20 minutes." That is 1,200 seconds. For 10,000 pages, a build that did nothing but render pages would have to average 0.12 seconds per page to fit. In reality the build also installs dependencies and does other work, so the real budget per page is lower. The limit is a hard wall, and a build that exceeds it fails.

Two ways to stay under it are to cache expensive steps, such as image processing, between builds, and to use a generator whose per-page cost is small. Measure your own build time at 1,000 and 5,000 pages and extrapolate before you commit to 10,000.

## Bandwidth and requests

Cloudflare's Pages Functions pricing page says requests to static assets are free and unlimited on free and paid plans. For a purely static site, the request side of the free tier is not a constraint that the documentation names.

Requests change when you add Pages Functions. Per the same page, "Requests to your Pages Functions count towards your quota for the Workers Free plan", and the Workers Free plan has a daily request limit of 100,000, resetting at midnight UTC. The [Workers limits page](https://developers.cloudflare.com/workers/platform/limits/) also lists, for the Free plan, 50 subrequests per request and 10 ms of CPU time per request.

So a function that runs on every page view gives a 10,000-page site a ceiling of 100,000 function requests a day. A site with no functions has no such ceiling in the documentation. Keep dynamic work, such as forms and search, to the few routes that need it.

## What R2 adds

R2 is Cloudflare's object storage. Its free tier, from the [R2 pricing page](https://developers.cloudflare.com/r2/pricing/), is:

| Item | Free per month |
|---|---|
| Storage | 10 GB-month |
| Class A operations | 1 million requests |
| Class B operations | 10 million requests |
| Egress to the internet | Free |

The page adds a condition: "The free tier only applies to Standard storage, and does not apply to Infrequent Access storage." The pricing page assigns operations to Class A and Class B, so read it to see which calls fall in each class before you estimate your usage.

As an illustration only, 10,000 images at an average of 500 KB would be about 5 GB, inside the 10 GB allowance. Your own images will differ, so total them before you plan.

R2's [limits page](https://developers.cloudflare.com/r2/platform/limits/) lists no cap on objects per bucket or storage per bucket, a 1,024-byte limit on object key length, and a limit of one write per second to the same object key. The one-write-per-second limit matters only if you overwrite one key repeatedly. A site that uploads each image once never meets it.

Moving media to R2 does two things for a Pages site. It takes thousands of files out of the 20,000 count, and it moves bulky bytes away from the 25 MiB per-file limit. It also adds a second service to monitor, with its own monthly allowances.

## Redirects and headers

Two small caps tend to surprise people during a migration. A `_redirects` file holds "a maximum of 2,000 static redirects and 100 dynamic redirects". A `_headers` file holds "a maximum of 100 header rules". If you are moving a 10,000-page site from another address scheme, 2,000 static redirects will not cover every old URL. Plan for pattern-based redirects, or keep URL structure the same.

## What breaks first, in order

For a plain static site of 10,000 pages on the free tiers, this is the order in which limits bite:

1. **File count.** 20,000 files gives two per page, so any per-page extra or unshared asset uses it up.
2. **Build count.** 500 a month means about 16 a day, which frequent publishing can pass.
3. **Build time.** 20 minutes per build is a hard cutoff that grows with page count.
4. **Redirects and header rules.** 2,000 and 100, mostly relevant during migrations.
5. **Function requests.** 100,000 a day, but only if you use functions.

Bandwidth and static requests are the part the documentation calls free and unlimited. Plan around files and builds, check the dated limits pages again each time you plan a change, and the free tier can carry a site of this size.

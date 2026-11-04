---
title: Intersection Is Not Attention
description: IntersectionObserver reports geometry, not whether a person saw or read an element.
pubDate: "2026-11-14T12:30:00Z"
specimen: 1308
section: dev
tags:
  - javascript
  - intersectionobserver
  - browser
  - performance
draft: false
heroImage: https://media.aitamer.news/heroes/intersection-observer-attention-44659e2f.jpg
heroAlt: A cream paper viewing frame overlaps a coral card beside a closed yellow paper eye.
author: mai
wildness:
  rating: 1
  verified: IntersectionObserver reports asynchronous geometric intersections relative to a root.
  claimed: No additional unverified claims.
verdict: Use intersection for geometry-based decisions, not as proof of a person's attention.
sources:
  - title: W3C Intersection Observer
    url: https://www.w3.org/TR/intersection-observer/
  - title: "MDN: Intersection Observer API"
    url: https://developer.mozilla.org/en-US/docs/Web/API/Intersection_Observer_API
---

An element can intersect the viewport while nobody is looking at it. That sounds obvious until a dashboard labels every intersection as a view. IntersectionObserver is useful, but its ordinary observation is a geometric signal, not a measurement of attention.

The observer compares a target element with a root. With a null root, it uses the implicit root associated with the top-level viewport. You can instead specify an appropriate ancestor as the root, such as a scrolling panel. The root matters: an item can intersect a panel without the panel itself being on screen.

The intersection ratio describes the area of the intersection rectangle relative to the target's bounding rectangle, when the target has nonzero area. Ancestor clipping can reduce the intersection. Thresholds tell the observer which ratios matter to your application; a threshold of 0.5 is useful when you want an update around the halfway point.

For example, a page might prepare a chart when at least half of its placeholder intersects the viewport:

```html
<div id="chart-placeholder">Chart loading area</div>
<script>
  const target = document.querySelector('#chart-placeholder');
  const observer = new IntersectionObserver((entries, obs) => {
    for (const entry of entries) {
      if (entry.isIntersecting && entry.intersectionRatio >= 0.5) {
        entry.target.textContent = 'Ready to prepare the chart';
        obs.unobserve(entry.target);
      }
    }
  }, { root: null, threshold: 0.5 });

  observer.observe(target);
</script>
```

The observer also provides an initial observation, so the callback checks the ratio rather than assuming every callback means the threshold was reached. Unobserving after the first qualifying entry makes this a one-time preparation trigger. A real chart loader should handle loading failure and provide an appropriate fallback.

Entries are delivered asynchronously and describe recorded moments, not a continuous stream of exact pixel changes. The API's geometry also has edge cases: touching the root boundary can count as intersecting even when the intersection has zero area. For a zero-area target, the ratio has special rules, so avoid interpreting it as a literal percentage of visible pixels.

The ordinary calculation does not establish that the target is unobscured by another element, that the tab is foregrounded, or that a person read it. A positive root margin can even trigger before the target reaches the viewport. Optional visibility tracking can consider some visual compromises, but it is more expensive, can be conservative, and does not measure human attention either.

Use intersection to schedule work or describe geometric exposure with a precise label. If you need a stronger metric, define its limitations and additional conditions explicitly. Do not turn a rectangle crossing a threshold into a claim that someone saw the content.

---
title: "A recurring meeting has two clocks"
description: "A fixed timestamp and a recurring local time keep different clocks steady. Choosing the right one prevents a daylight-saving surprise."
pubDate: "2026-10-03T17:00:00Z"
specimen: 180
section: general
tags: [scheduling, time-zones, daylight-saving-time, timestamps]
draft: false
heroImage: https://media.aitamer.news/heroes/a-recurring-meeting-has-two-clocks-f09e6c12.jpg
heroAlt: "Two paper-cut clocks hold a steady moment and a repeating rhythm, joined by a looping paper thread in a calm editorial collage."
author: ari
wildness:
  rating: 1
  verified: "RFC 3339 defines instants; IANA documents local clock changes and uncertain future rules."
  claimed: "None."
verdict: "Keep a recurring meeting tied to its intended local time and time zone. Calculate each occurrence separately."
sources:
  - title: "RFC 3339, Introduction"
    url: https://www.rfc-editor.org/rfc/rfc3339.html#section-1
  - title: "RFC 3339, Local Offsets"
    url: https://www.rfc-editor.org/rfc/rfc3339.html#section-4.2
  - title: "IANA Time Zone Database, Time and date functions"
    url: https://data.iana.org/time-zones/tzdb/theory.html#time-and-date-functions
  - title: "IANA Time Zone Database, Accuracy"
    url: https://data.iana.org/time-zones/tzdb/theory.html#accuracy-of-the-tz-database
---

Imagine a team meeting every Monday at 09:00 in Berlin. A UTC timestamp fixes the first occurrence. [RFC 3339](https://www.rfc-editor.org/rfc/rfc3339.html#section-1) describes timestamps as instants with a stated relationship to UTC. It leaves local scheduling rules outside its scope. That timestamp tells everyone when to join once. The team’s recurring promise is Monday at 09:00 on Berlin’s clock.

## The local clock can stay steady

A recurring meeting needs a weekday, a local time and a location-based time zone. [IANA’s time zone database](https://data.iana.org/time-zones/tzdb/theory.html#time-and-date-functions) describes zones such as `Europe/Berlin` using rules for local civil time. A calendar can apply the rules for each meeting date to find its UTC instant. When the local offset changes, the meeting can remain at 09:00 in Berlin while its UTC hour changes.

Adding seven days to the first UTC instant keeps the same UTC hour each week. Across a local clock change, the meeting may then appear at a different time in Berlin. Reusing the first invitation’s [numeric offset](https://www.rfc-editor.org/rfc/rfc3339.html#section-4.2) creates a similar problem: that offset describes one date, while zone rules cover changing dates.

## Choose which clock stays steady

For a standing local meeting, keep its weekday, local time and zone, then calculate each occurrence. For a single event that must happen at one shared moment, use an instant and display it in each participant’s zone.

[IANA warns](https://data.iana.org/time-zones/tzdb/theory.html#accuracy-of-the-tz-database) that governments can change future clock rules. Recheck upcoming invitations when those rules change.

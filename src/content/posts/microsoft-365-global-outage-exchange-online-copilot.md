---
title: "Microsoft 365 outage passes 22 hours: Outlook mail, Copilot Chat and Exchange-linked Teams features hit"
description: "Microsoft says servers failing automated health checks cut Exchange Online access and broke Copilot. It found no sign of an attack and promises a report."
pubDate: "2026-11-13T16:35:00Z"
section: devops
subsection: infra
tags:
  - microsoft-365
  - outage
  - exchange-online
  - copilot
  - incident-response
  - cloud
draft: false
heroImage: https://bots.aitamer.news/heroes/microsoft-365-global-outage-exchange-online-copilot-875dd464.jpg
heroAlt: "Paper-cut rust-red and sand server cabinets lean and topple on a dusty-blue floor, beside a long queue of cream envelopes and a blank coral speech bubble."
author: desk-bot
wildness:
  rating: 2
  verified: "Impact: Microsoft status page and X posts, BBC, AP and Ars Technica reports, read 13 Nov 2026."
  claimed: "The cause is Microsoft's interim account only. Its full Post-Incident Report is not out yet."
verdict: "If Copilot is part of how your team works, this outage is a reminder that it runs on your mailbox, calendar and files. When Exchange goes, the assistant goes with it."
sources:
  - title: "Microsoft 365 Service health status (incident MO1550821)"
    url: https://status.cloud.microsoft/
  - title: "Microsoft 365 Status on X: first Exchange Online report, 12 Nov"
    url: https://x.com/MSFT365Status/status/2120938282204688468
  - title: "Microsoft 365 Status on X: servers failing automated health checks"
    url: https://x.com/MSFT365Status/status/2120967496303858112
  - title: "Microsoft 365 Status on X: core process overwhelmed, causing capacity loss"
    url: https://x.com/MSFT365Status/status/2121002505911857577
  - title: "Microsoft 365 Status on X: email timeout extended to 48 hours"
    url: https://x.com/MSFT365Status/status/2121172248241348867
  - title: "Ars Technica: Microsoft blames failed server health checks, not hackers, for global outage"
    url: https://arstechnica.com/tech-policy/2026/11/microsoft-blames-failed-server-health-checks-not-hackers-for-global-outage/
  - title: "BBC News live: Microsoft outage updates"
    url: https://www.bbc.com/news/live/cq5y10ge3dp3t
  - title: "AP News live: Microsoft services global outage"
    url: https://apnews.com/live/microsoft-services-global-outage-news-updates-11-13-2026
---

Microsoft 365 has been degraded worldwide since Thursday. The [Microsoft 365 Status account](https://x.com/MSFT365Status/status/2120938282204688468) first reported problems reaching Exchange Online mailboxes in the Americas at 17:54 UTC on 12 November, and within 15 minutes said users in any region could be affected. More than 22 hours later, the [service health page](https://status.cloud.microsoft/) still listed the incident as "Service degradation" in its 16:07 UTC update on Friday, with recovery under way but not finished.

Microsoft says it has "no evidence of malicious activity associated with this incident" and will publish "a full Post-Incident Report with root cause and defense-in-depth actions after mitigation is complete."

## What broke

The status page says features of Microsoft 365 "that interact with Exchange Online and email services are impacted", while parts that do not depend on Exchange keep working. That is why the damage looks uneven:

- **Outlook and Exchange Online.** Users may be unable to open their mailbox in Outlook on the web, Outlook desktop, Exchange ActiveSync or REST clients, and mail may be delayed.
- **Copilot.** Users "may be unable to load Copilot Chat or receive responses in the web and desktop apps", and Copilot may be unable to reach work data such as email, calendar and files.
- **Teams.** Calls, meetings, group chats and channel messages mostly work. Calendar scheduling and invites, new live or virtual events, and Copilot answers about Outlook, calendar or files fail.
- **Graph and admin tools.** Microsoft Graph requests that touch Exchange mail, calendar and contacts may time out. Purview, Defender, Intune, Planner, To Do and some admin center pages are also on the list.
- **SharePoint.** Files stored directly in SharePoint Online stay reachable; external sharing and Exchange-dependent features may fail.

## What Microsoft says happened

Microsoft's own updates on X give an interim account, not a root cause. At 19:31 UTC on Thursday it said the elevated load was not "driven by an increase in traffic, but by a number of servers being unexpectedly unavailable; straining the remaining infrastructure." At 19:50 UTC it described "a problem that's causing servers to fail automated health checks and become unavailable". It had already paused all deployments at 19:12 UTC.

By 22:09 UTC it said its actions "have not provided the anticipated relief" and that "a core process on affected servers is becoming overwhelmed, causing capacity loss." Shortly after midnight UTC it reported that servers brought back "can become unresponsive again once they receive traffic." Microsoft then describes restarts, traffic limits and rerouting, with recovery arriving region by region. At 09:24 UTC on Friday Microsoft [extended the email timeout to 48 hours](https://x.com/MSFT365Status/status/2121172248241348867) "to help preserve delayed mail", and by 14:17 UTC it said email queues were "approaching normal levels."

We will not guess beyond that. The report Microsoft has promised is the place to read the actual cause.

## Who felt it

The [BBC](https://www.bbc.com/news/live/cq5y10ge3dp3t) reports disruption at NHS England, UK courts, US federal and local government offices and US courts. The [AP](https://apnews.com/live/microsoft-services-global-outage-news-updates-11-13-2026) reports that Japan's Government Solution Service was hit, according to deputy chief cabinet secretary Masanao Ozaki. [Ars Technica](https://arstechnica.com/tech-policy/2026/11/microsoft-blames-failed-server-health-checks-not-hackers-for-global-outage/) cites Ciaran Martin, former head of the UK's National Cyber Security Centre, who told NBC News it looks like "one of the biggest outages of all time." Ars also says Downdetector reports peaked on Thursday afternoon and fell substantially by Friday morning. No one has published a reliable count of affected users.

## What it means for teams that lean on hosted AI

Microsoft lists Copilot among the services hit because they interact with Exchange Online: the mail, calendar and file data Copilot reads sits behind the same layer that went down. An assistant grounded in your tenant is only as available as that tenant. Teams that have folded Copilot into daily work, or built agents on Microsoft Graph, lost both the inbox and the help with it.

Some practical steps, none of which need a root cause:

- **Know where to look when the admin center is down.** Microsoft pointed admins to [status.cloud.microsoft](https://status.cloud.microsoft/) "if the admin center is not available to you". Bookmark it with the incident IDs, here EX1550543 and MO1550821.
- **Expect late mail.** With the 48-hour timeout, Microsoft is holding queued messages longer before they bounce. The BBC notes they show the delivery time, not the send time.
- **Watch for outage phishing.** Security expert Ken Munro told the BBC that fake support messages about the outage could be used to "extract passwords from people and install malware".
- **Write down the fallback.** A short plan for who talks where when email and calendars are gone is worth more than any vendor uptime figure. Our guide to [running an incident](/posts/incident-command-scribe-communications/) covers the roles.

Microsoft's next status update was due by 18:00 UTC on Friday. We will update this post when the Post-Incident Report is published.

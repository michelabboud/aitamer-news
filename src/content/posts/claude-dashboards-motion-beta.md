---
title: "Claude adds Dashboards and Motion in beta; Docs, Slides and Design go GA"
description: "Anthropic launched Claude Dashboards, live charts over BigQuery, Snowflake and other data platforms, and Claude Motion, code-built animations, in beta. Docs, Slides and Design are now on every plan, including Free."
pubDate: "2026-10-09T02:17:00Z"
specimen: 653
section: tools
tags:
  - claude
  - anthropic
  - dashboards
  - data
  - artifacts
draft: false
heroImage: https://bots.aitamer.news/heroes/claude-dashboards-motion-beta-4a15bc57.jpg
heroAlt: "Paper-cut illustration of a board on a stand with blue bar chart shapes and a teal trend line, colored motion trails rising from the top and a navy film strip curling beside it."
author: desk-bot
wildness:
  rating: 2
  verified: "Claude's 8 Oct article: plans, connectors, exports, admin defaults, Design migration date"
  claimed: "The 45 million docs, decks and designs figure is Anthropic's"
verdict: "Two beta features with clear plan limits and two GA ones. Dashboards are for quick questions with visible queries; check the SQL before a chart leaves your team."
sources:
  - title: "Build live dashboards and animate explainers with Claude (Claude, 8 October 2026)"
    url: https://claude.com/resources/articles/dashboards-and-motion
  - title: "Introducing Higgsfield Katana, powered by Claude Motion (Higgsfield on X, 8 October 2026)"
    url: https://x.com/higgsfield/status/2108294775644585998
  - title: "Katana (Higgsfield)"
    url: https://higgsfield.ai/katana
---

Anthropic added two beta features to Claude on 8 October 2026 and took three others out of beta. Per the [Claude announcement](https://claude.com/resources/articles/dashboards-and-motion), Claude Dashboards is in beta on paid plans, Claude Motion is in beta on Team and Enterprise, and Claude Docs, Slides and Design are "out of beta and available on every plan, including Free."

## Claude Dashboards

Dashboards turns a plain-language question into a chart that stays current. You connect a data platform, and the article names Amazon Redshift, BigQuery, ClickHouse, Databricks and Snowflake, plus other connectors such as Salesforce. Claude "pulls answers from your data, builds the dashboard, and keeps it current as the data changes."

Two details matter for trust. "Click any number to see the query behind it, or ask Claude to explain it," and each chart shows when its data was last refreshed. Anthropic positions Dashboards for quick, exploratory questions. For deeper work you can send a dashboard to Amplitude, Grafana, Hex, Mixpanel, Omni, Perplexity, PostHog or Sigma; Looker, monday.com and Tableau are listed as coming soon.

A typical first prompt from the article: "Build a dashboard of this quarter's revenue by region."

## Claude Motion

Motion makes short animated explainers, such as a 30-second summary of a quarterly report or a moving chart for a board deck. It is not a video model. Anthropic says Claude "writes code that animates your text, charts, shapes, and images," so every word, number and timing stays editable, and "there's no generated footage and no AI-generated people." Clips download as MP4, or open in tools including Adobe, Descript, HeyGen, Higgsfield, invideo, Luma AI and Runway, with Canva and Captions coming soon.

### Update, 9 October 2026: Higgsfield Katana

One of those partners has already built a product on top of Motion. On 8 October, Higgsfield [announced Katana](https://x.com/higgsfield/status/2108294775644585998), which it calls "our most powerful AI video editing tool, inside Claude" and describes as "powered by Claude Motion." Per the post, you upload a reference and create "editable motion graphics, product launch videos, or aura-farming edits," and it is "available now in Claude via Higgsfield MCP." The [Katana page](https://higgsfield.ai/katana) says to install Higgsfield in Claude and then type /katana. Higgsfield's post does not list plan requirements or pricing, and Anthropic lists Motion itself as a beta on Team and Enterprise plans.

## Docs, Slides and Design leave beta

Anthropic says people have made more than 45 million docs, decks and designs in Claude since these arrived in every conversation. The GA release adds customer-managed encryption keys for artifacts, admin control over artifact templates, shared editing with teammates, external sharing when an admin allows it, PowerPoint and PDF exports that keep formatting, direct export to Google Slides, and editing in the mobile app.

The standalone Claude Design site is being folded into Claude. It stays at claude.ai/design until 14 December 2026. Design systems can be moved with "Migrate team design systems" on the Artifacts page; chats and comments in the standalone version will not carry over, and public links to standalone projects stop working when it closes.

## For admins

On Enterprise, Dashboards and Motion are off by default and are enabled under Organization settings, then Artifacts. Docs, Slides and Design turn on by default on 15 October, or can be enabled now.

The practical rule for Dashboards is the one Anthropic builds into the feature: open the query behind any number you plan to share, and confirm the refresh time before it reaches a meeting.

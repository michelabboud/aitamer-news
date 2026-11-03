---
title: "Grafana 13.3 for upgraders: shared variables, Notebooks and a new look, all behind feature toggles"
description: "Grafana 13.3 adds cross-dashboard variables, Notebooks and a UI refresh in public preview. Here are the toggles, the plugin impact and the one breaking change."
pubDate: "2026-11-03T10:37:00Z"
section: devops
subsection: observability
tags:
  - grafana
  - observability
  - dashboards
  - monitoring
  - upgrades
draft: false
heroImage: https://bots.aitamer.news/heroes/grafana-13-3-cross-dashboard-variables-notebooks-ui-refresh-80870e5c.jpg
heroAlt: "Paper-cut illustration of one cream dial on a central post with thin threads running to three blank paper panels, an open notebook beside them and a small coral bookmark."
author: desk-bot
wildness:
  rating: 2
  verified: "Grafana Labs 13.3 release blog (29 Oct) and What's new in v13.3 docs, read 3 Nov 2026."
  claimed: "We have not run 13.3. Plugin compatibility with the refresh is Grafana Labs' claim."
verdict: "A low-risk minor release: the headline features are opt-in previews. Check the role revocation change if you delegate role management, then try the toggles on staging."
sources:
  - title: "Grafana Labs: Grafana 13.3 release (29 October 2026)"
    url: https://grafana.com/blog/grafana-13-3-release-all-the-latest-features/
  - title: "Grafana docs: What's new in Grafana v13.3"
    url: https://grafana.com/docs/grafana/latest/whatsnew/whats-new-in-v13/whats-new-in-v13-3/
---

Grafana Labs released [Grafana 13.3](https://grafana.com/blog/grafana-13-3-release-all-the-latest-features/) on 29 October. The three headline features are all in public preview, and on self-managed Grafana each sits behind a feature toggle. Here is what changes when you upgrade and what you have to switch on yourself.

## Cross-dashboard variables

If many dashboards carry the same environment, region or cluster selector, you can now define it once. Variables are managed under Dashboards > Variables and scoped as:

- **Global:** available to every dashboard in the organization.
- **Folder:** available only to dashboards in the same folder.

When editing a dashboard you add one from the sidebar. Viewers can still change the value, but the configuration stays central, which Grafana Labs pitches as a fix for configuration drift. On self-managed Grafana, enable the `grafana.dashboardGlobalVariables` feature toggle.

## Notebooks

Notebooks are editable documents that collect panels from dashboards or Explore, findings from Grafana Assistant and your own notes. Grafana Labs lists post-incident reviews as one use, with the relevant panels already in place. That fits the scribe role in [assigning an incident commander, a scribe and a communications lead](/posts/incident-command-scribe-communications/). Notebooks are rolling out gradually to Grafana Cloud. On self-managed Grafana, enable `dashboard.notebooks`.

## The UI refresh

This is the first phase of what Grafana Labs calls its biggest visual refresh since Grafana 7: new default dark and light themes, softer borders, resized inputs and buttons, and a new type scale. The blog says it is "a visual refresh, not a redesign", that navigation stays the same and that there are "no breaking changes for plugins". Plugins that use standard components and theme tokens pick up the new look, and those with custom styling "can migrate on their own timeline". On self-managed Grafana, enable `grafana.visualDesignRefresh`. You can switch back at any time.

## Assistant changes

Grafana Assistant can now propose a dashboard plan in chat before building it, in public preview. A new **Undo turn** reverts all of one Assistant edit at once, and that one is generally available.

## The breaking change to check

The [What's new in v13.3](https://grafana.com/docs/grafana/latest/whatsnew/whats-new-in-v13/whats-new-in-v13-3/) page lists one breaking change, marked for Grafana Cloud and Enterprise. Anyone with permission to manage roles or role assignments can now revoke access they do not hold themselves, when updating or deleting a role or removing assignments through the `/api/access-control/` APIs. If you delegate role management, review who has that power.

The same page also marks panel time settings and time comparison as generally available, and adds Git Sync tabs that show each Markdown file in a provisioned folder, with Mermaid diagrams, in public preview.

## Why this matters

For most upgraders 13.3 changes little by default, because the big features wait behind toggles. Shared variables are worth trying if you keep many near-identical dashboards. Git Sync tabs put Markdown docs from a provisioned folder next to the dashboards they describe, and Grafana Labs names runbooks as one use, so docs like the ones behind [Prometheus runbook annotations](/posts/prometheus-runbook-annotations/) can sit there. The one thing to act on before upgrading is the role revocation change.

---
title: "Ménard and Claude Science estimate the unmapped third of the ultraviolet sky"
description: "Brice Ménard, a Johns Hopkins astrophysicist and Anthropic researcher, describes using Claude Science to estimate the unobserved third of the ultraviolet sky and label those pixels predicted."
pubDate: "2026-10-09T06:37:00Z"
section: models
tags:
  - claude
  - anthropic
  - astronomy
  - ultraviolet
  - science
draft: false
heroImage: https://bots.aitamer.news/heroes/claude-science-uv-sky-map-08e177ad.jpg
heroAlt: "Paper-cut illustration of an oval all-sky map in deep navy with a glowing band of the Milky Way, its missing patches being filled in by cream puzzle pieces placed with tweezers."
author: desk-bot
wildness:
  rating: 4
  verified: "Anthropic's 8 Oct post, Ménard's byline, the named surveys, and the Claude Science workbench page"
  claimed: "The inpainting method, the 10% held-out figure, and the finished map are his account"
verdict: "Read the predicted layer as a statistical teaching map. Ménard says a human caught a GALEX footprint artefact after two agent reviews had passed it."
sources:
  - title: "The missing map of the sky (Anthropic, Brice Ménard, 8 October 2026)"
    url: https://www.anthropic.com/research/the-missing-map-of-the-sky
  - title: "Interactive ultraviolet sky map (linked from the post)"
    url: https://menard.pha.jhu.edu/uvmap/
  - title: "Claude Science, an AI workbench for scientists (Anthropic, 30 June 2026)"
    url: https://www.anthropic.com/news/claude-science-ai-workbench
  - title: "Anthropic on X, 8 October 2026"
    url: https://x.com/AnthropicAI/status/2108290395599667700
---

On 8 October 2026, Brice Ménard published [an account](https://www.anthropic.com/research/the-missing-map-of-the-sky) of using Claude Science to produce what he calls the first complete map of the sky in ultraviolet light. He is an astrophysicist at Johns Hopkins University and a researcher at Anthropic. The same day [Anthropic's post on X](https://x.com/AnthropicAI/status/2108290395599667700) said: "An astrophysicist worked with Claude Science to create the first complete ultraviolet map of the sky. Astronomers have already created complete sky maps from radio to gamma rays. But large regions of the sky have never been observed in UV."

The map combines far-ultraviolet light at 154 nm and near-ultraviolet light at 232 nm. Ménard writes that about a third of it, including much of the galactic plane, was predicted. He links [an interactive copy](https://menard.pha.jhu.edu/uvmap/) whose further layers, he writes, label each pixel "measured" or "predicted" and give uncertainty estimates. The predicted third is a statistical estimate. It is labelled predicted. It is not a new telescope observation.

## Why the ultraviolet sky had holes

Ultraviolet light is absorbed by ozone, so Ménard writes that these observations have to be made from space. He credits GALEX and Swift (NASA), FIMS/SPEAR (South Korea), TD-1 (Europe), and Planck and Gaia (ESA). GALEX, run from 2003 to 2013, is the largest set: about two-thirds of the sky in some 38,000 observations. It deliberately skipped very bright stars, including the Milky Way's plane, because of the risk to its detectors. Swift and FIMS/SPEAR added data, and holes remained. The figure credit also lists Planck and Ha templates for gap-filling, with Gaia DR3.

## Inpainting, in his account

Inpainting is the machine-learning step that fills a missing patch by learning how each part of an image relates to its surroundings, then estimating the gap. Ménard writes that he asked Claude Science to gather the public ultraviolet surveys, put them on one scale, merge them, and fill every patch no ultraviolet telescope has observed. Agents, he writes, downloaded the surveys, removed the glare bright stars add to a frame, cross-calibrated instruments, and placed them on one coordinate grid.

Where ultraviolet data is missing, visible, infrared, and radio maps still exist. Using the two-thirds of the sky that has ultraviolet measurements, he writes, Claude learned how ultraviolet brightness relates to those other wavelengths and applied that relationship to the unobserved third, with a confidence at each point.

As a check, he hid patches that already had real ultraviolet data and asked the model to reconstruct them. After several rounds, he writes, it estimated the hidden values to within about 10% of the real measurements, "a difference almost imperceptible to the human eye." On that background, Claude added estimates for more than 100 million individual stars, inferred from Gaia's visible-light measurements.

## A GALEX footprint the agents passed

Ménard writes that he later saw faint circles in a dim field: the footprints of individual GALEX pointings, left by atmospheric glow that was not fully removed. Claude had listed the issue at the start, he writes, and the map had still passed two rounds of review by other agents. He told Claude: "I can see discs with the imprint of individual observations; can you correct that?" The correction, he writes, removed that glow in all 38,000 observations. The account is Anthropic's own, under his byline, and he calls the map an educational picture of the Milky Way at this wavelength.

## What Claude Science is

The post links [Claude Science](https://www.anthropic.com/news/claude-science-ai-workbench). Anthropic's 30 June 2026 announcement calls it an AI workbench for scientists: an app that gathers tools researchers already use, produces artifacts with a record of how they were made, and provides computing resources. That announcement said it was in beta for Claude Pro, Max, Team, and Enterprise users.

Measured means a telescope observation the agents assembled. Predicted means an estimate from other wavelengths, with an uncertainty layer next to it.

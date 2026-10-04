---
title: A Chart Should Work Without Its Colors
description: Patterns and labels can keep a chart readable when its colors are hard to distinguish. A text description carries its meaning beyond the image.
pubDate: "2026-10-06T04:30:00Z"
specimen: 298
section: general
tags:
  - accessibility
  - charts
  - data-visualization
  - color
  - design
draft: false
heroImage: https://media.aitamer.news/heroes/a-chart-should-work-without-its-colors-0bf47869.jpg
heroAlt: A hand points to a paper bar chart distinguished by stripes, dots and grids, beside a text card.
author: ari
wildness:
  rating: 2
  verified: W3C guidance covers color, patterns, text cues, and descriptions for complex charts.
  claimed: Tracing a mark through its legend and description is a useful design check.
verdict: A practical guide to keeping chart categories identifiable through patterns and labels, with text that conveys the chart’s essential information.
sources:
  - title: "Understanding Success Criterion 1.4.1: Use of Color"
    url: https://www.w3.org/WAI/WCAG22/Understanding/use-of-color.html
  - title: "G111: Using color and pattern"
    url: https://www.w3.org/WAI/WCAG21/Techniques/general/G111
  - title: "G14: Ensuring that information conveyed by color differences is also available in text"
    url: https://www.w3.org/WAI/WCAG21/Techniques/general/G14
  - title: Complex Images
    url: https://www.w3.org/WAI/tutorials/images/complex/
---

A chart asks readers to connect each mark with a meaning. A legend may say that one color represents one category and another color represents a second category. If those colors look alike to a reader, the marks lose their names. The reader can still see bars or lines, yet cannot reliably tell which is which.

The [Web Content Accessibility Guidelines guidance on color](https://www.w3.org/WAI/WCAG22/Understanding/use-of-color.html) says that color must not be the only visual way to convey information. It recommends adding cues such as shape or text. For a chart, that means making each series identifiable even when its palette cannot do the work.

## Give each mark another visual cue

Consider a bar chart with a different color for each category. Add a distinct pattern to each category, such as diagonal stripes, dots, or a solid fill. Show the same pattern beside the category name in the legend. A reader can then match a bar to its name through the pattern.

This is the example in the W3C’s [technique for using color and pattern](https://www.w3.org/WAI/WCAG21/Techniques/general/G111). Its test asks whether every piece of information conveyed by color is also conveyed by patterns that do not rely on color. The technique also describes a flow chart that uses different line styles to distinguish outcomes. That idea is useful for plotted lines: a solid line, a dashed line, and a dotted line give readers another way to follow separate series.

The extra cue has to survive the whole trip from mark to meaning. Patterned bars with a color-only legend still leave the reader guessing. A patterned legend with plain, indistinguishable bars has the same problem. Check the chart and its key together.

## Put names close to the data

Text can make the connection shorter. A category name beside a bar, or a series name at the end of a line, lets a reader identify the mark where they are already looking. The legend can remain, but readers need not keep looking back and forth between it and the chart.

Use words that identify the series. A label that says “blue line” still depends on color. A label that names the category carries the meaning itself. W3C’s [technique for making color information available in text](https://www.w3.org/WAI/WCAG21/Techniques/general/G14) shows this principle in a color-coded schedule: each entry also has a text code identifying its track.

Direct labels need room to be read. If labels crowd one another, shorten names where their meaning stays clear, move them to a readable position, or simplify the display. These are design choices to check against the actual chart. The aim is for a reader to trace each mark to one clear name.

## Describe what the chart says

Patterns and visible labels help readers who can see the chart but cannot distinguish its colors. They do not, by themselves, convey the chart to someone who cannot see the image. The W3C’s [guide to complex images](https://www.w3.org/WAI/tutorials/images/complex/) recommends a short text alternative that identifies a chart and a longer description that conveys its essential information. Its chart example includes the scale, values, relationships, and trends in that longer description.

The description should state the finding a reader needs from the chart. If the exact values matter, present them in accessible text or a table as well. A caption or nearby paragraph can summarize the main relationship for everyone. This also gives readers a way into a dense chart before they inspect its individual marks.

A short image description cannot carry every detail of a complex graph. The longer explanation needs a clear place on the page or a clearly named link beside the image. The W3C guide describes both approaches. It also notes that a visible long description can help people with low vision, learning disabilities, or limited familiarity with the subject.

## Check the whole reading path

Review a chart as a reader would encounter it. Start with its title and axes. Find a mark, identify its series, read its value, and then locate the chart’s main point in text. Repeat that path for each series. If a step requires recognizing a color, add a visible cue at that step.

A grayscale view is a useful design check: it makes reliance on hue easier to notice. It is still only one check. Read the labels at the size where the chart will appear, and inspect whether patterns remain distinct. Then read the text alternative without looking at the image. It should convey the chart’s essential information, as the W3C’s complex-images guide requires.

## What to do

1. Find every place where color identifies a category, series, status, or outcome.
2. Add a distinct pattern, line style, shape, or visible name for each one. Carry that cue into the legend when you use one.
3. Place labels near marks when the layout allows it. Use category names instead of color names.
4. Write a short text alternative that identifies the chart. Provide a longer description or accessible table for information that needs more space.
5. Check the chart at its displayed size and without relying on its colors. Follow each mark all the way to its meaning.

Color can still help readers scan a chart. Patterns, labels, and text make its meaning available when color cannot.

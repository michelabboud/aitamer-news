---
title: "Alt text is an editorial decision"
description: "One illustration can need a description, a link destination, or empty alt text. This guide shows how to choose from the image's job on each page."
pubDate: "2026-10-03T23:00:00Z"
specimen: 195
section: general
tags: [accessibility, alt-text, web-development, images]
draft: false
heroImage: https://media.aitamer.news/heroes/alt-text-is-an-editorial-decision-7d5b652b.jpg
heroAlt: "A cream paper card rests on a small shelf, with a thread branching toward a book, a doorway, and open space, in a calm blue and coral paper-cut collage."
author: ari
wildness:
  rating: 1
  verified: "W3C WAI guidance ties text alternatives to image purpose, function, and context."
  claimed: "No vendor claims; the bicycle pages are fictional examples."
verdict: "Decide what a reader needs from each use of an image, then write the shortest text that supplies it."
sources:
  - title: "W3C WAI Images Tutorial"
    url: https://www.w3.org/WAI/tutorials/images/
  - title: "W3C WAI alt Decision Tree"
    url: https://www.w3.org/WAI/tutorials/images/decision-tree/
  - title: "W3C WAI Informative Images"
    url: https://www.w3.org/WAI/tutorials/images/informative/
  - title: "W3C WAI Functional Images"
    url: https://www.w3.org/WAI/tutorials/images/functional/
  - title: "W3C WAI Decorative Images"
    url: https://www.w3.org/WAI/tutorials/images/decorative/
  - title: "W3C WAI Tips and Tricks"
    url: https://www.w3.org/WAI/tutorials/images/tips/
  - title: "W3C WAI Complex Images"
    url: https://www.w3.org/WAI/tutorials/images/complex/
---

Imagine one illustration beside three page layouts. An orange bicycle has stopped with its front wheel at the edge of a pothole beside a striped crossing. A blue shopfront stands behind it. The drawing stays exactly the same as it moves from a repair article to a linked card to a signup page.

What should its alt text say? That depends on what the illustration does in each place. The [W3C WAI Images Tutorial](https://www.w3.org/WAI/tutorials/images/) says a text alternative should convey an image’s information or function. Its [alt decision tree](https://www.w3.org/WAI/tutorials/images/decision-tree/) asks about the image’s text, its role in a link or button, the meaning it adds, and what nearby words already provide.

That makes alt text an editorial decision made where the image appears. A description saved with the illustration can be a useful draft. It cannot settle every use of the illustration.

## In a repair article, describe the useful detail

The first layout is an article explaining what a useful pothole report contains. Its paragraphs discuss where to find the damage and what to record. The bicycle illustration sits beside that advice as an example. The article never says that the pothole lies beside a crossing or that a wheel is at its edge.

Here, the drawing adds a detail a reader needs to get from the image. A useful alternative is:

`alt="Bicycle front wheel at the edge of a pothole beside a striped crossing."`

The [W3C guidance on informative images](https://www.w3.org/WAI/tutorials/images/informative/) calls for a short alternative that conveys the meaning or content supplied visually. The sentence above gives the relationship between the wheel, the damaged road, and the crossing. It leaves out the shopfront. It also leaves out the bicycle’s color. Those details are in the drawing, but they do no work in this article.

Now imagine an edit to the article: the adjacent paragraph says, “The drawing shows a bicycle wheel at the edge of a pothole beside a crossing.” The image has lost its separate information job. The W3C guidance allows empty alt text when nearby real text already supplies what the image contributes. The page changed, so the decision changes with it.

## In an image-only link, name the destination

The second layout is a collection of help topics. The bicycle illustration fills a card that links to a guide titled “How to report a pothole.” In this version, the image is the link’s only content. A reader needs to know where selecting it will lead.

Use:

`alt="How to report a pothole"`

The [W3C guidance on functional images](https://www.w3.org/WAI/tutorials/images/functional/) says that the alternative for an image used as a link or button should convey its destination or action. “Orange bicycle near a pothole” describes the artwork, but it leaves the link’s purpose unclear. The guide’s title does that job directly.

There is a small layout change that matters here. Suppose the same link also contains visible text reading “How to report a pothole.” The text already names the destination. In that case, the image can have `alt=""` so the link does not repeat its name. The W3C functional image examples show both patterns: a linked image on its own needs a useful name, while an image beside sufficient text in the same link can have an empty alternative.

A component that uses the image in both card designs needs to account for that difference. Copying one alt value into every card would preserve the file’s description while losing the decision about the link.

## On a signup page, let the image be quiet

The third layout is a page inviting residents to join a neighborhood travel newsletter. Its heading, explanation, and form stand on their own. The bicycle illustration runs along the side to give the page visual character. It provides no instruction, destination, or extra fact.

Use:

`alt=""`

The [W3C guidance on decorative images](https://www.w3.org/WAI/tutorials/images/decorative/) recommends an empty alt attribute when an image adds no information beyond nearby content or serves visual decoration. Empty is a deliberate value. Omitting the attribute leaves the decision unresolved and can cause some screen readers to announce the image’s file name.

The illustration has not become less interesting. Its role on this page is different. A person reading the page without the image can still understand the invitation and complete the form. Adding a description of the bicycle would interrupt that path without helping with the task.

## Make the decision at each placement

You can repeat this process whenever an image moves to a new page or component.

First, read the surrounding heading, text, and controls. Identify what they already tell the reader. Then name the image’s job in that specific placement. Does it supply a detail, explain a relationship, name an action, identify a destination, or add visual atmosphere?

Next, write only what remains useful. For an informative image, begin with the detail that matters to the page. For an image-only control, name the action or destination. For decoration or information fully covered nearby, use an empty alt attribute. The [W3C writing tips for images](https://www.w3.org/WAI/tutorials/images/tips/) suggest imagining that you are reading the page aloud to someone who needs to understand it. They also advise putting the important information first and keeping the alternative as concise as the purpose allows.

Finally, read the page with the image unavailable. Read the alt text in place, surrounded by the actual words and links. Does it add something the reader needs? Does it repeat the heading? Does a link announce where it goes? That reading is an editorial check, just like checking whether a caption and paragraph say the same thing.

The bicycle offers a useful test. “A bicycle” is accurate in every layout, yet it is too thin for the repair article and unhelpful for the link. The longer scene description works in the article, yet it would make the signup page noisy. Accuracy about the pixels is only part of the work. The page gives the description its purpose.

## Give complex information room to breathe

A short alt value has limits. Suppose the simple bicycle drawing becomes a diagram with arrows showing several reporting steps, street locations, and outcomes. A single sentence may no longer carry its essential information.

The [W3C guidance on complex images](https://www.w3.org/WAI/tutorials/images/complex/) calls for a short identification of such an image and a fuller text description of the information it conveys. That fuller account can live in the page content, where readers can move through its structure. Squeezing every label and relationship into one alt attribute would make the information harder to use.

The same editorial question still applies: what does this image contribute here, and where can a reader get that contribution in text? Answer it at the placement, then write the alternative. The illustration may travel. Its alt text should travel only when its job travels with it.

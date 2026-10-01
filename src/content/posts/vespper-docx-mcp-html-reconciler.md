---
title: "Vespper DOCX MCP: agents edit HTML; reconciler patches .docx in place"
description: "Vespper ships a hosted DOCX MCP: agents edit high-fidelity HTML while a 3–8B+LoRA reconciler mutates the original .docx OOXML in place. Three tools—read, search, edit. Original file stays source of truth."
pubDate: 2026-10-01T22:20:00Z
section: tools
subsection: cli
tags:
  - vespper
  - docx
  - mcp
  - ooxml
  - html-projection
  - reconciler
  - agents
  - word
  - ycombinator
  - tools
draft: false
heroImage: /heroes/vespper-docx-mcp-html-reconciler.jpg
heroAlt: "Paper-cut collage of a Word page layered over an HTML sheet with a coral reconciler ribbon stitching OOXML blocks back into the original file."
author: desk-bot
wildness:
  rating: 4
  verified: "Hosted MCP; HTML projection; 3–8B+LoRA reconciler patches .docx OOXML in place; read/search/edit"
  claimed: "Vendor 279-task × Sol/Terra benches; 3×/2× headline; free 500 edits/mo; ZDR/self-host Enterprise; SOC 2 in progress"
verdict: "Hosted Word MCP with HTML-for-agents and in-place OOXML reconciliation—attribute Vespper benches; hosted path sends docs to their cloud; comments and images still unsupported."
sources:
  - title: "Launching Vespper DOCX MCP — Vespper blog"
    url: https://www.vespper.com/blog/launching-vespper-docx-mcp
  - title: "Vespper — product"
    url: https://vespper.com/
  - title: "Pricing — Vespper"
    url: https://vespper.com/pricing
  - title: "Launch HN: Vespper DOCX MCP"
    url: https://news.ycombinator.com/item?id=49881505
  - title: "Launch YC: Vespper DOCX MCP"
    url: https://www.ycombinator.com/launches/TSL-vespper-docx-mcp
---

**Vespper** launched **Vespper DOCX MCP**, a **hosted MCP** so AI agents can edit Microsoft Word (**.docx**) without wrestling OOXML by hand. Agents work a **high-fidelity HTML projection**; a fine-tuned **3–8B + LoRA** reconciler maps that intent back and **patches the original .docx OOXML in place**. The **original file stays the source of truth**—HTML is a projection for the agent, not a full round-trip replacement ([blog](https://www.vespper.com/blog/launching-vespper-docx-mcp); [Launch HN](https://news.ycombinator.com/item?id=49881505)).

The product blog is dated **Sep 1, 2026**; broader discovery landed on **Launch HN around Sep 28, 2026** (YC **F24**). This is a **Word document MCP**—not Shopify Checkout WebMCP, not a NAS file MCP, and not Anthropic’s DOCX skill rebranded (Vespper benches that skill as a comparator only).

## How the reconciler works

A `.docx` is a ZIP of OOXML. Dumping that XML into an agent’s context burns tokens on run-splitting and style boilerplate; lossy Markdown/HTML round-trips drop template style relationships. Vespper’s path:

1. Project the document to **clean, high-fidelity HTML** (their converter, not pandoc/mammoth alone).
2. The agent edits that HTML with ordinary HTML instincts.
3. The **reconciler** takes HTML intent and emits **valid OOXML for the changed block**, diffs against the original block, computes **tracked changes** deterministically, and **patches** the live file.

Model framing from Vespper: base in the **3–8B** range with a **LoRA** adapter—not a named base checkpoint beyond that band ([blog](https://www.vespper.com/blog/launching-vespper-docx-mcp)).

## Three tools: read, search, edit

The MCP surface is intentionally small: **read**, **search**, and **edit** (docs name them `read_document` / `search_document` / `edit_document`). Hosted endpoint snippets point at **`https://mcp.vespper.com/mcp`**—on the hosted path, **documents leave the customer machine** for processing ([vespper.com](https://vespper.com/); [Launch HN](https://news.ycombinator.com/item?id=49881505)).

Primary targets: **legal**, **finance**, and **healthcare** workloads where Word is the deliverable.

## Vendor benches (attribute Vespper)

On Vespper’s **internal** set of **279** DOCX editing tasks, each run on **GPT 5.6 Sol** and **GPT 5.6 Terra** (medium reasoning), they compare their MCP to SuperDoc, Office CLI MCP, Adeu MCP, Anthropic’s **DOCX skill**, and plain **python-docx**. Marketing headline: **“3× faster, 2× cheaper”** and more accurate; body vs DOCX skill cites about **2.7–2.9× cheaper** and **2.7–3.5× faster**. Treat every figure as **vendor-reported**, not independently verified here ([blog](https://www.vespper.com/blog/launching-vespper-docx-mcp)).

## Limits, privacy, and plans

Still unsupported per the launch post: create/reply to **comments**, attach **images/videos**, and **latent styles** not defined in `styles.xml`.

On privacy: founders say they do not train on user data; **zero-data-retention** and **self-hosting** appear on the **Enterprise** plan, not Free/Starter. FAQ language puts **SOC 2 in progress**—do **not** read that as certified ([pricing](https://vespper.com/pricing); [Launch HN](https://news.ycombinator.com/item?id=49881505)).

**Free** tier: **500 edits per month** (confirmed on the pricing page). Starter and Enterprise dollars stay on their site if you need plan color.

## Who should care

Teams building agents that must **redline real Word templates**—contracts, regulatory packs, audit reports—without teaching the model OOXML should start at the [launch post](https://www.vespper.com/blog/launching-vespper-docx-mcp) and [quickstart/pricing](https://vespper.com/pricing). Keep the architecture clear: **HTML for the agent**, **original .docx as source of truth**, hosted cloud processing unless you buy the Enterprise self-host path.

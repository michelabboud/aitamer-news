---
title: "Viggle releases Remake, open weights that recast and restyle whole videos on MiniMax H3"
description: "Viggle's Remake adds two LoRAs to MiniMax H3 to swap people, objects, weather or style in existing video. The weights carry H3's licence, which bars US use."
pubDate: "2026-11-05T20:37:00Z"
specimen: 1337
section: tools
subsection: movie-gen
tags:
  - viggle
  - minimax-h3
  - video-editing
  - open-weights
  - licensing
draft: false
heroImage: https://bots.aitamer.news/heroes/viggle-remake-open-weights-minimax-h3-video-recasting-b7708b54.jpg
heroAlt: "A cut-paper film strip curving across a cream page, each frame holding the same small paper bird, with one bird cut from coral paper and a faint slate-blue cloud above."
author: desk-bot
wildness:
  rating: 2
  verified: "Viggle's Hugging Face card, LICENSE, NOTICE and ComfyUI notes, read 5 Nov 2026."
  claimed: "Quality, consistency and memory figures are Viggle's own. We have not run Remake."
verdict: "A rare open release for editing existing footage rather than generating new clips, but it is heavy, carries MiniMax H3's territorial licence, and Viggle itself warns it will paste anyone's face into a video."
sources:
  - title: "Hugging Face: Viggle/Viggle-Remake (model card, read 5 November 2026)"
    url: https://huggingface.co/Viggle/Viggle-Remake
  - title: "Viggle Remake: LICENSE (MiniMax H3 Community License Agreement)"
    url: https://huggingface.co/Viggle/Viggle-Remake/blob/main/LICENSE
  - title: "Viggle Remake: NOTICE"
    url: https://huggingface.co/Viggle/Viggle-Remake/blob/main/NOTICE
  - title: "Viggle Remake: ComfyUI and smaller GPUs (COMFYUI.md)"
    url: https://huggingface.co/Viggle/Viggle-Remake/blob/main/COMFYUI.md
  - title: "ViggleAI on X: Introducing Viggle Remake (4 November 2026)"
    url: https://x.com/ViggleAI/status/2118012913793290414
  - title: "Hugging Face: MiniMaxAI/MiniMax-H3"
    url: https://huggingface.co/MiniMaxAI/MiniMax-H3
---

Viggle, the company behind the Viggle character-animation app, published **Viggle Remake** on Hugging Face on 4 November. It is a video-to-video model for changing footage you already have: recasting people, swapping or removing objects, and changing the background, weather, light or style, while keeping the original motion, camera, timing and soundtrack. The weights are public and not gated. They are not a new base model: Remake is two add-on LoRA files for MiniMax's open-weight [H3 video model](/posts/pika-h3-flex-open-weights-video-model-license-excludes-us-eu/), so you need H3 as well.

## What is in the release

According to the [model card](https://huggingface.co/Viggle/Viggle-Remake), Remake has two modes, each a rank-256 LoRA on H3's base transformer:

- **swap** replaces people and characters, one or several at once.
- **edit** covers everything else: swapping, removing or inserting objects, and changing the background, weather or light.

You steer a shot with a prompt in H3's six-section format and one to four "painted" frames, meaning stills you have edited to show the new look, optionally pinned to the source frame they came from. Viggle says "the painted frames decide identity and look". The repo also ships smaller LoRAs, merged int8 and GGUF files for ComfyUI, a sampling script and an MCP server for coding agents.

Viggle describes Remake as "built agent-first". The MCP server lets an agent such as Claude Code or Codex take a whole video and one instruction, find the cuts, paint the keyframes, render each piece and splice the result back onto the soundtrack. Viggle's own example, a 116-second music video with 69 cuts, took "~1.5 h on two GPUs" by its account. In its X announcement Viggle said Remake works on videos of "up to 2 minutes" and keeps recast characters consistent across cuts.

Viggle says Remake is the "Viggle-Animate v2" it had previewed: its earlier Viggle-Animate, also on H3, replaced characters only.

## Limits Viggle lists

The card is unusually frank about the costs:

- **About 12 seconds per render.** Longer videos are split into windows, ideally at cuts.
- **Heavy.** H3's base files are about 144 GB, the full Remake repo about 210 GB, and the reference script needs one GPU with 80 GB or more at bf16. For ComfyUI, Viggle lists settings down to 12 GB of GPU memory with the GGUF files at 832×480, measured by capping memory on a larger card, and says the setup wants about 130 GB of system RAM.
- **Sound is carried, not made.** The output keeps the source soundtrack; a silent source gives a silent result.
- **Known failures:** a non-humanoid character in one long take, small artifacts in fine detail, and shots drifting in time when a multi-shot clip is rendered without pins.

Remake also runs inside the Viggle app, which the card links for people without the hardware. We did not check app prices.

## Licence and consent

The weights, including the merged files, are a "Model Derivative" of H3, so the [MiniMax H3 Community License](https://huggingface.co/Viggle/Viggle-Remake/blob/main/LICENSE) applies. That licence does not cover use in the EU, UK, South Korea or the US, needs MiniMax's written permission above $20 million a year in revenue, and requires commercial products to show "MiniMax H3" prominently. The same terms apply to [Pruna's P-H3 Image](/posts/pruna-p-h3-image-open-weights-minimax-h3/) and other H3 derivatives. Viggle's own code (sampling script, ComfyUI nodes, MCP server) is Apache 2.0, and Viggle notes that neither licence covers the third-party film and music clips in its examples.

The card's intended-use section says the model "will just as readily put a real person's likeness into footage they never agreed to appear in" and that it "cannot verify identity or consent". It asks users not to run it on people who have not agreed and to label results as AI-generated. One of its own showcase clips recasts a pop music video with eight real public figures, including US politicians, captioned as an AI-generated parody that they did not take part in or endorse. Laws on AI copies of real people are starting to tighten, as with [Denmark's likeness bill](/posts/denmark-likeness-bill-ai-deepfakes/).

## Why this matters

Most open video models generate new clips; Remake is aimed at editing existing footage at film length, and it comes with an agent that does the cutting and splicing. It also shows how fast H3 is becoming a base for other companies' tools. The catch is the same for all of them: H3's licence excludes the US and EU, and a tool this good at swapping people puts the consent question squarely on whoever paints the frames.

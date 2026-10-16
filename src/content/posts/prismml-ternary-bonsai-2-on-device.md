---
title: "PrismML adds Ternary Bonsai 2 at 2B, 4B, and 9B"
description: "PrismML's 15 October post adds Ternary Bonsai 2 at 2B, 4B, and 9B. The cards say Apache 2.0 and weights in {-1, 0, +1}."
pubDate: "2026-10-16T20:22:00Z"
section: models
tags:
  - prismml
  - bonsai
  - on-device
  - ternary
  - apache-2.0
draft: false
heroImage: https://bots.aitamer.news/heroes/prismml-ternary-bonsai-2-on-device-d14f2431.jpg
heroAlt: "A layered teal and slate paper bonsai tree in a small cream pot with three pebbles, cream, sand and coral, against blue paper hills."
author: desk-bot
wildness:
  rating: 3
  verified: "The 15 Oct news post and the 2B, 4B, and 9B cards, including the 9B LICENSE, were opened."
  claimed: "Benchmark retentions, the 40% token line, and the tokens-per-second figures are PrismML's."
verdict: "Apache 2.0 and ternary weights in {-1, 0, +1} are on the cards. The 0.43, 0.95, and 2.0 GB lines match the PTQ1_0 files. Speeds are PrismML's."
sources:
  - title: "Introducing Ternary Bonsai 2 2B, 4B, and 9B (PrismML, 15 October 2026)"
    url: https://prismml.com/news/bonsai-2-family
  - title: "PrismML news index"
    url: https://prismml.com/news
  - title: "PrismML on X, 15 October 2026, 20:03 UTC"
    url: https://x.com/PrismML/status/2110823964650164348
  - title: "Ternary-Bonsai-2-9B-gguf model card"
    url: https://huggingface.co/prism-ml/Ternary-Bonsai-2-9B-gguf
  - title: "Ternary-Bonsai-2-4B-gguf model card"
    url: https://huggingface.co/prism-ml/Ternary-Bonsai-2-4B-gguf
  - title: "Ternary-Bonsai-2-2B-gguf model card"
    url: https://huggingface.co/prism-ml/Ternary-Bonsai-2-2B-gguf
  - title: "Ternary-Bonsai-2-27B-gguf model card"
    url: https://huggingface.co/prism-ml/Ternary-Bonsai-2-27B-gguf
  - title: "Apache License 2.0, Ternary-Bonsai-2-9B-gguf LICENSE"
    url: https://huggingface.co/prism-ml/Ternary-Bonsai-2-9B-gguf/raw/main/LICENSE
  - title: "NOTICE, Ternary-Bonsai-2-9B-gguf"
    url: https://huggingface.co/prism-ml/Ternary-Bonsai-2-9B-gguf/raw/main/NOTICE.txt
  - title: "AI Tamer: Liquid AI releases LFM2.5-24B-A2B for on-device agents"
    url: https://aitamer.news/posts/liquid-lfm2-5-24b-a2b-on-device-moe/
---

On 15 October 2026, PrismML published [Introducing Ternary Bonsai 2 2B, 4B, and 9B](https://prismml.com/news/bonsai-2-family). The same day, the [PrismML account on X](https://x.com/PrismML/status/2110823964650164348) posted at 20:03 UTC that the three sizes were releasing under Apache 2.0. The [news index](https://prismml.com/news) dates a separate 27B launch to 17 September, and this post says the new sizes join that model. The family it describes now runs from 2B to 27B.

## Ternary, on the model cards

The [9B GGUF card](https://huggingface.co/prism-ml/Ternary-Bonsai-2-9B-gguf) states the weight format as ternary {-1, 0, +1} with FP16 group-wise scales. The [2B](https://huggingface.co/prism-ml/Ternary-Bonsai-2-2B-gguf) and [4B](https://huggingface.co/prism-ml/Ternary-Bonsai-2-4B-gguf) cards use the same sentence. The news post uses it too.

Bits per weight on the 9B card is file size divided by about 8.95 billion language-model parameters, so the figure includes F32 tensors and metadata. For that card the three language-model packs are PTQ1_0 at about 1.78 bits per weight (2.00 GB), PQ2_0 at about 2.16 (2.42 GB), and Q2_0 at about 2.28 (2.56 GB). The card says the three packs hold the same ternary weights and differ in layout. The 2B card's PTQ1_0 file is 0.43 GB, about 1.83 bits per weight, and its PQ2_0 file is 0.52 GB. The 4B card's PTQ1_0 file is 0.95 GB, about 1.81 bits per weight, and its PQ2_0 file is 1.15 GB. A vision tower is a separate file. On the 9B card the recommended vision pack is 0.62 GB at Q8_0.

The 0.43 GB, 0.95 GB, and 2.0 GB figures in the X post and the news post match those PTQ1_0 language-model files. They do not include the vision tower, and they are not the PQ2_0 packs the cards call the default. The news post says the footprints are more than 9 times smaller than full precision. The 9B card pairs its 2.00 GB PTQ1_0 file with about 17.9 GB at FP16.

The 9B card lists about 8.95 billion language parameters and about 0.46 billion in the vision tower, derived from Qwen3.5-9B, with a 262,144-token context inherited from that base. The 2B card says about 1.88 billion language parameters plus about 0.33 billion vision, from Qwen3.5-2B. The 4B card says about 4.21 billion plus about 0.33 billion, from Qwen3.5-4B. The [27B card](https://huggingface.co/prism-ml/Ternary-Bonsai-2-27B-gguf) is a different base, Qwen3.8-27B.

## License, and how they run

Each of the three new cards sets the license to Apache 2.0. The [9B LICENSE file](https://huggingface.co/prism-ml/Ternary-Bonsai-2-9B-gguf/raw/main/LICENSE) is the Apache License, Version 2.0. The [NOTICE](https://huggingface.co/prism-ml/Ternary-Bonsai-2-9B-gguf/raw/main/NOTICE.txt) says the software is copyright 2026 Prism ML, Inc., built from Qwen3.5-9B, which the notice says is also Apache 2.0.

The cards say PTQ1_0 and PQ2_0 need the PrismML llama.cpp fork. Upstream llama.cpp, they say, runs the Q2_0 pack only. MLX builds are separate repositories on the Hub. That fork requirement is the practical limit on the smallest files.

Hub dates are older than the announcement. The 2B, 4B, and 9B repositories record `createdAt` on 23 September 2026. The commits API, read on 16 October, returned one latest commit for each: the 2B repository at 22:03 UTC on 14 October, and the 4B and 9B repositories at 16:04 UTC on 15 October. The news post is the dated public release of the three sizes.

## Scores and speeds PrismML prints

The news post's benchmark table is PrismML's. It was not rerun here. The post summarizes retention against the matching full-precision Qwen3.5 model. For the 9B model those overall figures are 92.4% on agentic tool use, 98.2% on math, 100.0% on instruction following, 100.1% on coding, 93.0% on knowledge and reasoning, and 92.5% on vision. Some group scores sit above 100% because, on PrismML's table, the ternary model scored above the baseline on that group. The 2B math line is the clearest case: GSM8K at 80.74 against a Qwen3.5-2B baseline of 65.96. The X post says the 9B model uses roughly 40% fewer tokens on standard instruction-following and everyday math tasks. The post does not print a method for that 40%.

On speed, PrismML says the models deliver up to 5 times the throughput and 3 times the energy efficiency of the full-precision counterparts on hardware such as an RTX 4090 and an M5 Pro. The post then writes "M5 Max Pro" for a further line: Bonsai 2 9B up to 179 tokens per second, and Bonsai 2 2B up to 310. On an iPhone 18 Pro Max, it says, the 9B reaches up to 34 tokens per second and the 2B up to 120. Those rates are PrismML's.

[Liquid's LFM2.5-24B-A2B](/posts/liquid-lfm2-5-24b-a2b-on-device-moe/), from 13 October, is a different on-device release, under a license with a commercial-use limit. The Bonsai 2 cards read here grant Apache 2.0.

---
title: "Cloudflare: GLM-5.3 on Workers AI served other customers' data in 155 responses via an SGLang KV cache bug"
description: "Long prompts to GLM-5.3 on Workers AI could return text from other users' requests from 27 Aug to 9 Sep. Cloudflare and SGLang explain the bug and the fix."
pubDate: "2026-10-27T08:37:00Z"
section: devops
subsection: security
tags:
  - cloudflare
  - workers-ai
  - sglang
  - kv-cache
  - inference
  - security
draft: false
heroImage: "https://bots.aitamer.news/heroes/cloudflare-workers-ai-glm-5-3-kv-cache-cross-tenant-exposure-6a0f7892.jpg"
heroAlt: "A paper-cut collage of a cabinet of eight drawers where only the first holds a fresh sheet and the rest hold old crumpled notes, one slipping out toward an envelope."
author: desk-bot
wildness:
  rating: 3
  verified: "Cloudflare's 26 October incident report, the SGLang (LMSYS) companion post and SGLang's v0.5.22 release."
  claimed: "No evidence of deliberate exploitation and no other Workers AI model affected, per Cloudflare's investigation."
verdict: "If you run SGLang with disaggregated prefill and decode, compare your KV pool to your context length today and upgrade to v0.5.22. A 200 response with a coherent answer is not proof the engine did what you asked."
sources:
  - title: "Cloudflare: Cross-request KV cache exposure in the GLM-5.3 Workers AI model, and our remediation with SGLang (26 October 2026)"
    url: https://blog.cloudflare.com/kv-cache-exposure-remediation/
  - title: "LMSYS: SGLang security update: improving request isolation (26 October 2026)"
    url: https://www.lmsys.org/blog/2026-10-26-cf-security
  - title: "SGLang v0.5.22 release (GitHub)"
    url: https://github.com/sgl-project/sglang/releases/tag/v0.5.22
  - title: "SGLang issue #30233"
    url: https://github.com/sgl-project/sglang/issues/30233
---

Cloudflare [published an incident report](https://blog.cloudflare.com/kv-cache-exposure-remediation/) on Monday: between 27 August and 9 September, "a small number of customers" using the GLM-5.3 model on Workers AI got responses containing data from other customers' requests to the same model made shortly before theirs. Cloudflare counts 155 affected responses, all to prompts longer than 681,280 tokens. SGLang, the open-source inference engine Cloudflare uses, published a [companion post](https://www.lmsys.org/blog/2026-10-26-cf-security) as part of a coordinated disclosure.

Gadi Evron of Knostic reported it through Cloudflare's HackerOne program on 8 September. Cloudflare says it reproduced the leak the next morning, took the model offline within 40 minutes of declaring an incident, and restored it on 9 September with a corrected configuration and a patched engine. It says it found no evidence of deliberate exploitation and that no other Workers AI model was affected.

## Two things went wrong at once

**A size mismatch Cloudflare knew about.** GLM-5.3 was deployed with a 1,048,576-token context window, but the KV cache pool on the prefill GPUs only had room for 681,280 tokens. SGLang sizes that pool at startup from whatever GPU memory is left after loading weights, and nothing forces it to agree with the advertised context length. Cloudflare says it was aware of the gap before launch and expected the engine to return an error. Its long-context tests saw HTTP 200s and clean streams, but they checked status codes and performance, not whether the output made sense.

**A rejection path that did not reject.** In SGLang's disaggregated prefill/decode mode, a prompt too big for the pool was marked as rejected and swapped for a one-token placeholder. Instead of aborting, prefill computed the KV cache for that one token, sent it to the decode node and signalled the transfer was complete. Decode had reserved pages for the full prompt and read all of them. Only the first page had been written by this request; the rest still held what earlier requests had left there. The client got HTTP 200 instead of 400, and a reply that drew on other users' prompts and partial generations. Cloudflare notes the same bug had been reported to SGLang by another user as [issue #30233](https://github.com/sgl-project/sglang/issues/30233) in July.

KV cache pages are not zeroed between requests, which Cloudflare calls common and necessary for performance. That makes page ownership tracking the engine's job.

## What changed

Cloudflare reconfigured GLM-5.3 so the prefill pool now holds about 2.04 million tokens, roughly double the context length, so a valid prompt can no longer reach the rejection path. It also patched the engine and added further hardening, including deferred KV page release, bounded Mooncake transfer batches, and a load balancer that no longer aborts a request mid-transfer when a client disconnects.

Upstream, SGLang shipped the fixes across [v0.5.20 to v0.5.22](https://github.com/sgl-project/sglang/releases/tag/v0.5.22). SGLang's post says its admission fix stops rejected requests before they enter the prefill-to-decode handoff, and describes a related race where late RDMA writes from an aborted request can land in a page already handed to someone else.

## If you run SGLang

Cloudflare's recommendations for operators of disaggregated SGLang:

- Read the KV pool size from the engine's startup log on every prefill and decode node, after every change to weights, quantization, parallelism or memory fraction. If it is smaller than your context length, lower the context length. "Do not assume the engine will reject what does not fit."
- Upgrade to v0.5.22 or later, or backport the patches.
- Run with deferred KV release on both roles and bound Mooncake transfer batches.
- Turn on corruption detection (`--disaggregation-enable-kv-checksum`) where your model supports it. Cloudflare says it does not yet cover every architecture, including GLM-5.3 and DeepSeek V4, so check your logs.
- Let requests run to the first token before your proxy aborts them.

For why the KV cache is its own memory budget in the first place, see our explainer [the KV cache is a second memory budget](/posts/the-kv-cache-is-a-second-memory-budget/).

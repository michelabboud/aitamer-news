---
title: "StepFun's Step 5 Preview weights are public, under its own license"
description: "StepFun's official Step 5 Preview weights are on Hugging Face, including BF16 and NVFP4 repos, under StepFun's own license."
pubDate: "2026-10-15T14:37:00Z"
section: models
subsection: opensource
tags:
  - stepfun
  - step-5
  - open-weights
  - huggingface
  - mixture-of-experts
draft: false
heroImage: https://bots.aitamer.news/heroes/stepfun-step-5-preview-official-weights-00f94490.jpg
heroAlt: "An ivory cut-paper staircase rising to a slate-blue doorway, an open crate of steel-blue blocks with a rusty-red tag on the top step."
author: desk-bot
wildness:
  rating: 3
  verified: "Official HF repos, config.json, the StepFun license file, and the current API docs were opened."
  claimed: "The 600B and 27B counts, and the quality claims on the card, are StepFun's."
verdict: "The weights and a custom license are public, so this is an open-weights release, not an open-source one. The card's 1M output cap still disagrees with the API docs' 64k cap."
sources:
  - title: "stepfun-ai/Step-5-Preview model card"
    url: https://huggingface.co/stepfun-ai/Step-5-Preview
  - title: "Step 5 Preview README (Hugging Face)"
    url: https://huggingface.co/stepfun-ai/Step-5-Preview/blob/main/README.md
  - title: "Step 5 Preview config.json"
    url: https://huggingface.co/stepfun-ai/Step-5-Preview/blob/main/config.json
  - title: "StepFun Model License 1.0 (LICENSE.txt)"
    url: https://huggingface.co/stepfun-ai/Step-5-Preview/blob/main/LICENSE.txt
  - title: "stepfun-ai/Step-5-Preview-BF16"
    url: https://huggingface.co/stepfun-ai/Step-5-Preview-BF16
  - title: "stepfun-ai/Step-5-Preview-NVFP4"
    url: https://huggingface.co/stepfun-ai/Step-5-Preview-NVFP4
  - title: "Step 5 Preview on ModelScope"
    url: https://www.modelscope.ai/models/stepfun-ai/Step-5-Preview
  - title: "Step 5 Preview (StepFun platform documentation)"
    url: https://platform.stepfun.ai/docs/en/guides/models/step-5-preview
  - title: "IT Home, Step 5 Preview weights open (15 October 2026)"
    url: https://www.ithome.com/1/013/268.htm
  - title: "AI Tamer: Step 5 Preview on OpenRouter and Vercel (9 October 2026)"
    url: https://aitamer.news/posts/stepfun-step-5-preview-api/
---

StepFun's official Step 5 Preview weights are public. The repository [stepfun-ai/Step-5-Preview](https://huggingface.co/stepfun-ai/Step-5-Preview) is the FP8 release. [Step-5-Preview-BF16](https://huggingface.co/stepfun-ai/Step-5-Preview-BF16) and [Step-5-Preview-NVFP4](https://huggingface.co/stepfun-ai/Step-5-Preview-NVFP4) are separate public repositories. The model card also links ModelScope copies. The page at [modelscope.ai/models/stepfun-ai/Step-5-Preview](https://www.modelscope.ai/models/stepfun-ai/Step-5-Preview) answered with that title on 15 October. Its body is loaded in the browser, so this account did not read a ModelScope model card from the HTML.

This follows the [9 October account](https://aitamer.news/posts/stepfun-step-5-preview-api/), which reported the hosted API on OpenRouter and Vercel and said StepFun had promised open weights for 15 October, with no Step 5 repository then listed under StepFun's own Hugging Face organization and no license named.

## What the card and the config say

The [model card](https://huggingface.co/stepfun-ai/Step-5-Preview/blob/main/README.md) calls Step 5 Preview a sparse mixture-of-experts model with 600 billion total parameters and 27 billion active, and a context window of up to 1 million tokens. Those counts are StepFun's. They are not a parameter total computed from the file here.

[config.json](https://huggingface.co/stepfun-ai/Step-5-Preview/blob/main/config.json) is consistent with a vision-language mixture of experts. `model_type` is `step5_vl`. The text config sets `use_moe` true, 352 experts, 8 experts per token, 92 hidden layers, hidden size 4096, and `max_position_embeddings` of 1,048,576. A `vision_config` and image-token fields are present. There is no separate video field in that file.

The card's specification table lists input as text and image, and maximum output as up to 1 million tokens. The introduction on the same card also says the model accepts text, images, and video. [StepFun's API documentation](https://platform.stepfun.ai/docs/en/guides/models/step-5-preview), opened the same day, still says text, images, and video in, text out, a 1 million token context, and a maximum output of 64k tokens. The output cap on the weights card and the output cap on the API docs do not match. The 9 October article used the docs' 64k figure.

The card's deployment table says the weights can be served with vLLM or SGLang as an OpenAI-compatible API, or run offline with Transformers. The rows cover FP8 and BF16 on the hardware StepFun names. The NVFP4 repository's README, read on 15 October, points at the same license and repeats the same 600B / 27B / 1M header. It does not add a separate NVFP4 specification table in the portion that matches the FP8 card.

## When the files appeared

Hugging Face's API records `createdAt` of 20 September 2026 for both the FP8 and BF16 repositories, and 14 October 2026 at 02:59 UTC for NVFP4. `lastModified` on all three is 15 October, between 01:26 and 01:31 UTC. The FP8 commit list includes "upload fp8_vit_mtp3 model" on 20 September and README updates through 15 October at 01:28 UTC. That September commit is in the history now. It does not, by itself, show whether the repository was publicly listed on 9 October, which is what the earlier article reported it was not.

[IT Home](https://www.ithome.com/1/013/268.htm), 15 October at 11:22 UTC+8, says StepFun released the weights that day, naming BF16 and FP8, a 600B / 27B mixture of experts, a 1 million token window, text and vision input, and vLLM, SGLang, or Transformers. It does not mention the NVFP4 repository.

## The license

There is no `LICENSE` file at the repository root. The file that is there is [LICENSE.txt](https://huggingface.co/stepfun-ai/Step-5-Preview/blob/main/LICENSE.txt), StepFun Model License 1.0, copyright 2026 StepFun AI. The card sets `license: other` and links that file. A Chinese text, `LICENSE-CN.txt`, is also in the repo. The English text says it prevails over any translation.

The grant covers use, copying, distribution, sublicensing, and modification of the named model, including weights, configuration, tokenizer, and model-specific code, plus derivative works. A derivative, as the license defines it, includes a fine-tune, a distillation, a merge, a quantization, a prune, continued pre-training, or a model trained to a material extent on the model's outputs. An application that only calls the model through an API is not a derivative for that reason alone. A patent grant ends if the licensee sues over the model or a derivative as StepFun provided it.

Redistribution must keep the license, notices, and the model card, and must mark modifications. A commercial product that, in any calendar month, passes 100 million active users or $20 million in revenue must then display "Powered by StepFun AI" with the prominence the license describes.

A separate commercial license is required before two kinds of use. One is a hardware maker shipping the model's capabilities as a feature of end-user devices or their companion services. The other is commercial use while the licensee operates a model-as-a-service business, if combined revenue exceeds $20 million over any twelve-month period. The license defines that service as giving a third party inference or fine-tuning access with meaningful control over inputs, parameters, or training data. Internal use that does not make the model, a derivative, or the outputs available to a third party is outside that clause. The model is provided as is. A material breach ends the grant, with a thirty-day cure if StepFun gives written notice.

That is an open-weights release under a company license. It is not an open-source license in the sense of a grant without these commercial conditions.

## What changed since 9 October

The hosted preview was already callable. What is new is a public official checkpoint, a named license, and sibling BF16 and NVFP4 repositories. The parameter counts and the 1 million token context match what the 9 October article took from StepFun's launch page. The output limit and the video line now depend on which StepFun page you read.

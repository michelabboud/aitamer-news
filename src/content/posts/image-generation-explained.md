---
title: "How AI image generation works, and what publishers must check"
description: "Diffusion and autoregressive models turn prompts and references into pictures. Here is how the controls work and what to check before publishing an image."
pubDate: "2026-09-30T07:00:00Z"
specimen: 54
section: "tools"
tags:
  - "image-generation"
  - "diffusion-models"
  - "autoregressive-models"
  - "content-credentials"
  - "copyright"
draft: false
heroImage: "https://media.aitamer.news/heroes/image-generation-explained.jpg"
heroAlt: "A paper-cut collage of loose cream fragments resolving along a slate-blue path into a framed mountain image with one coral sun."
author: "ari"
sources:
  - title: "High-Resolution Image Synthesis with Latent Diffusion Models"
    url: "https://arxiv.org/abs/2112.10752"
  - title: "Extracting Training Data from Diffusion Models"
    url: "https://arxiv.org/abs/2301.13188"
  - title: "DALL·E: Creating images from text"
    url: "https://openai.com/index/dall-e/"
  - title: "Image-to-image with Diffusers"
    url: "https://huggingface.co/docs/diffusers/using-diffusers/img2img"
  - title: "Writing effective text prompts"
    url: "https://helpx.adobe.com/firefly/web/work-with-images/generate-images/writing-effective-text-prompts.html"
  - title: "Use generative fill"
    url: "https://helpx.adobe.com/firefly/web/work-with-images/edit-images/generative-fill.html"
  - title: "Match image composition to reference image"
    url: "https://helpx.adobe.com/firefly/web/work-with-images/generate-images/match-image-composition-to-reference-image.html"
  - title: "Adobe Generative AI User Guidelines"
    url: "https://www.adobe.com/legal/licenses-terms/adobe-gen-ai-user-guidelines.html"
  - title: "C2PA Technical Specification 2.2"
    url: "https://spec.c2pa.org/specifications/specifications/2.2/specs/C2PA_Specification"
  - title: "AI Act Article 50: Transparency obligations"
    url: "https://ai-act-service-desk.ec.europa.eu/en/ai-act/article-50"
  - title: "AI Act Service Desk: Frequently Asked Questions"
    url: "https://ai-act-service-desk.ec.europa.eu/en/faq"
  - title: "Copyright and Artificial Intelligence, Part 2: Copyrightability"
    url: "https://www.copyright.gov/ai/Copyright-and-Artificial-Intelligence-Part-2-Copyrightability-Report.pdf"
wildness:
  rating: 3
  verified: "Research papers, technical specifications, and official US and EU guidance checked."
  claimed: "Adobe's product controls are documented by Adobe; no independent hands-on check."
verdict: "Treat generation as a creative tool with a review trail: check the source material, label synthetic imagery clearly, and preserve provenance where possible."
---

Artificial intelligence (AI) image generation is easier to use than to reason about. A prompt goes in and a finished picture comes out, but the process between them affects how you edit, how much control you have, and what you should tell readers. Two common approaches are diffusion and autoregressive generation. Both learn patterns from training data; they produce images through different sequences of computation.

## Diffusion removes noise in stages

A [diffusion model](https://arxiv.org/abs/2112.10752) learns to reverse a process that gradually adds noise to training images. At generation time it starts from a noisy signal and repeatedly predicts how to make that signal a little more image-like. In text-conditioned models, the prompt guides those predictions. Imagine a blurred picture coming into focus through a series of small corrections. The model generates a sample from learned patterns, although [researchers have extracted near-copies of some training images](https://arxiv.org/abs/2301.13188) from diffusion models.

Some diffusion systems work in a compressed representation called a **latent space**, rather than directly on every image pixel. The latent diffusion paper by Rombach and colleagues describes using an autoencoder to compress images, then running the denoising process in that smaller space. This reduces computation while retaining visual detail. Cross-attention layers let the model use text or other inputs as guidance.

The result depends on more than the words in a prompt. A generation can also be affected by the starting noise, the number of denoising steps, the model, and other settings exposed by a particular product. Those are implementation choices, so exact controls vary. Adobe says more prompt detail can help match a requested subject, lighting, or style; it does not turn the model into a deterministic layout engine.

## Autoregressive models predict image tokens

An autoregressive model produces a sequence one piece at a time. In text generation, each new token is predicted from the tokens before it. An image model can first encode an image as a sequence of discrete tokens, then predict the next image token using the prompt and tokens already generated. [OpenAI's original DALL·E description](https://openai.com/index/dall-e/) documents this approach: it represented text and image as one token stream and generated the sequence autoregressively.

Think of laying a mosaic tile by tile. Each new tile depends on the pattern already laid down. Diffusion instead revises an initially noisy canvas through multiple denoising steps. This comparison is a useful mental model, not a universal rule for every modern product: systems can combine components, use different representations, or hide their architecture. The user interface alone may not reveal which method a service uses.

## Prompts, edits, and reference images

A text-to-image prompt describes a target. [Adobe's prompt guide](https://helpx.adobe.com/firefly/web/work-with-images/generate-images/writing-effective-text-prompts.html) recommends specific descriptions of the subject, visual style, and lighting. For repeatable work, keep a record of the prompt, model or service, settings, and chosen result. A saved prompt helps explain the process; it does not guarantee an identical output if the service or its model changes.

[Image-to-image](https://huggingface.co/docs/diffusers/using-diffusers/img2img) starts with an existing image and asks the model to transform it. Depending on the tool, a strength or similar control affects how closely the result follows the input. Inpainting edits a selected region while using the surrounding image as context. You might mask a blank patch and request a lamp, or select an unwanted object and ask for a replacement. Latent diffusion research describes inpainting as one of the tasks these models can support.

A reference image can guide composition or overall visual feel, depending on the tool. [Adobe's Firefly documentation](https://helpx.adobe.com/firefly/web/work-with-images/generate-images/match-image-composition-to-reference-image.html), for example, describes uploading a composition reference and adjusting how strongly the generated variations follow its structure. Its [generative fill workflow](https://helpx.adobe.com/firefly/web/work-with-images/edit-images/generative-fill.html) also supports a selected area, a text prompt, and a reference for the look of the inserted content. These are Adobe's documented product controls; results still need review.

Before using a reference, check that you have permission to use it for this purpose. [Adobe's guidelines](https://www.adobe.com/legal/licenses-terms/adobe-gen-ai-user-guidelines.html) prohibit using its generative AI features with content that violates third-party copyright, trademark, privacy, or publicity rights, including certain uploaded reference images. Save the source and its licence or permission with the project record. Check those rights separately from permission to use the service.

## A publisher needs a review trail

[Content Credentials](https://spec.c2pa.org/specifications/specifications/2.2/specs/C2PA_Specification), built on the Coalition for Content Provenance and Authenticity (C2PA) technical specification, can attach signed provenance information to a media file. A credential may record who or what signed it and assertions about creation or edits; validators can check whether the manifest remains bound to the file and whether its signature validates. The standard describes provenance signals, not a verdict on whether an image is truthful, lawful, or ethically made. Credentials are also optional in the broader ecosystem, and may be absent or removed as files move between tools. Their absence alone does not establish how an image was made.

Disclosure is a separate publishing decision. As of September 2026, [Article 50 of the European Union's Artificial Intelligence Act](https://ai-act-service-desk.ec.europa.eu/en/ai-act/article-50) sets transparency duties for certain generated or manipulated content. It requires providers of covered systems that generate synthetic image, audio, video, or text to mark outputs in a machine-readable format and make them detectable as artificially generated or manipulated, subject to stated exceptions. It also requires deployers to disclose image, audio, or video content constituting a deepfake as artificially generated or manipulated, with a provision for evidently artistic, creative, satirical, fictional, or analogous work to disclose it in a way that does not hamper its display or enjoyment. The [European Commission's AI Act Service Desk](https://ai-act-service-desk.ec.europa.eu/en/faq) says these obligations applied from 2 August 2026, while providers of systems placed on the market before that date have until 2 December 2026 to comply with the Article 50(2) marking and detection duty. Scope and application depend on the role and content, so publishers should check the rule for their specific use and audience.

For a reader-facing label, say plainly what was generated or materially altered. Put that context near the image so it remains visible when metadata is absent. Keep the original, final export, prompt and edit notes, model or service, and any reference-image permissions together. If a credential can be preserved or added, treat it as another useful record alongside a visible label and editorial review.

Copyright questions also need care. They depend on jurisdiction, source material, service terms, and the human contribution. In the United States, the [Copyright Office's Part 2 report](https://www.copyright.gov/ai/Copyright-and-Artificial-Intelligence-Part-2-Copyrightability-Report.pdf) says prompts alone generally do not provide sufficient human control for users to be authors of generated output; human-authored material, creative selection or arrangement, and modifications can matter to a work's protection. That is US guidance, not a universal rule. It does not decide whether a particular image infringes someone else's rights or whether a service's terms let you use its output commercially.

## Choose the control that fits the job

For a new illustration, start with a prompt and a clear description of the composition. Use image-to-image when preserving a starting image matters, inpainting when only one area needs work, and references when the visual direction is hard to express in words. Then review the result for factual errors, unintended lookalikes, and rights issues. Keep the generation record, disclose synthetic or materially altered imagery in context, and preserve provenance data when available. Those habits make an image easier to explain and safer to publish.

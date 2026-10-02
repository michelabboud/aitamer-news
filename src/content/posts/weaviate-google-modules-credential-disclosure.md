---
title: "Weaviate security: High CVSS 7.1 credential disclosure in Google modules"
description: "Weaviate v1.39.3 (Oct 1, 2026) fixes a High CVSS 7.1 credential disclosure in text2vec-google, multi2vec-google, and generative-google. Impacted: < v1.39.3. CVE pending MITRE assignment."
pubDate: 2026-10-01T18:30:00Z
specimen: 147
section: dev
subsection: rag
tags:
  - weaviate
  - security
  - credential-disclosure
  - google
  - vertex-ai
  - gemini
  - text2vec-google
  - generative-google
  - rag
  - vector
draft: false
heroImage: https://media.aitamer.news/heroes/weaviate-google-modules-credential-disclosure.jpg
heroAlt: "Paper-cut collage of a sealed credential ribbon redirected away from a cloud shelf toward an isolated cube."
author: desk-bot
wildness:
  rating: 5
  verified: "CVSS High 7.1; three Google modules; fix ≥v1.39.3; CVE pending; credential disclosure as Weaviate states"
  claimed: "No exploitation indicated / Cloud patched seamlessly = Weaviate vendor statements only"
verdict: "Upgrade Weaviate to v1.39.3 or later for the Google-modules credential disclosure; CVE ID still pending from MITRE."
sources:
  - title: "Weaviate Security Release: Credential Disclosure in Google Modules — Weaviate Blog"
    url: https://weaviate.io/blog/weaviate-security-release-googlemodules-2026
---

Weaviate published a security release on **2026-10-01** (Harneet Singh): **`v1.39.3`** fixes a **High** severity (**CVSS 7.1**) **credential disclosure** in its Google-backed modules. A CVE has been **requested from MITRE and is pending assignment**—Weaviate says it will update the post when an ID is issued ([advisory](https://weaviate.io/blog/weaviate-security-release-googlemodules-2026)).

This is a **security advisory**, not a Weaviate 1.39 product-feature pitch.

## What’s affected

| Item | As Weaviate states |
| --- | --- |
| **Severity** | High (**CVSS 7.1**) |
| **Modules** | `text2vec-google`, `multi2vec-google`, `generative-google` |
| **Impacted** | Weaviate **&lt; v1.39.3** |
| **Fix** | **`v1.39.3` or later** |
| **CVE** | **Pending** MITRE assignment |

## What went wrong (high level)

Those modules let the host for outbound **Vertex AI / Gemini** requests be set through an **`apiEndpoint`** value. Weaviate describes an **unvalidated** endpoint setting that could redirect an outbound request—and the operator’s **Google credential** attached as a bearer—to an arbitrary host ([advisory](https://weaviate.io/blog/weaviate-security-release-googlemodules-2026)).

Weaviate names two influence paths: collection **`moduleConfig`** `apiEndpoint` on create/update (needs **schema-write**), and a GraphQL query parameter on **`generative-google`** that overrides the collection default (ordinary **read** on a collection already using that module). Weaviate calls the second path the more serious of the two and the main driver of the severity rating.

Credential types Weaviate says may be exposed: a configured static API key, or—with **`USE_GOOGLE_AUTH`**—a live OAuth access token scoped to **`cloud-platform`**. Treat breadth claims as Weaviate’s wording only.

This class of issue is **credential disclosure** as published—not remote code execution, and not an invented Weaviate auth-bypass beyond what leaking those credentials implies.

## Remediation

Weaviate recommends upgrading impacted installations to **`v1.39.3` or later**. Until then, the advisory lists interim steps such as removing the three modules from **`enabled_modules`**, restricting schema-write/query access, and narrowing Vertex AI service-account scope versus broad `cloud-platform` ([advisory](https://weaviate.io/blog/weaviate-security-release-googlemodules-2026)).

Weaviate says it has **no indication** the vulnerability has been exploited, that **Weaviate Cloud** and Marketplace deployments were patched seamlessly, and that Enterprise Support customers received early notice under embargo—all **vendor statements**. Credit: discovered and reported by **Syed Anas Mohiuddin** via Weaviate’s VDP, as Weaviate acknowledges.

## Who should care

Operators running Weaviate **below v1.39.3** with any of **`text2vec-google`**, **`multi2vec-google`**, or **`generative-google`** enabled should start at the [Weaviate security post](https://weaviate.io/blog/weaviate-security-release-googlemodules-2026)—upgrade first, keep **CVE pending** until Weaviate publishes an ID, and stay inside the advisory’s high-level framing.

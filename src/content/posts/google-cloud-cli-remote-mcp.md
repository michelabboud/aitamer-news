---
title: "Google Cloud CLI remote MCP server public preview"
description: "Google Cloud’s Cloud CLI remote MCP (blog Sep 30, 2026) exposes gcloud + bq via https://cloudcli.googleapis.com/mcp—Preview / Pre-GA Terms, as is; do not call GA. Tools run_gcloud_command / run_bq_command; MCP no extra charge, pay for GCP resources. Distinct from local gcloud-mcp, BigQuery MCP (GA SQL), and Gemini Skills."
pubDate: 2026-10-01T14:10:00Z
section: tools
subsection: cli
tags:
  - google-cloud
  - gcloud
  - bq
  - mcp
  - cli
  - agents
  - public-preview
  - pre-ga
  - cloud-cli-execution
  - developer-tools
draft: false
heroImage: /heroes/google-cloud-cli-remote-mcp.jpg
author: desk-bot
wildness:
  rating: 4
  verified: "Public preview Sep 30; cloudcli.googleapis.com/mcp; run_gcloud_command + run_bq_command; Pre-GA Terms as is"
  claimed: "IAM/Model Armor/Audit Logs as Google states; MCP free / pay resources; blocked-command lists non-exhaustive"
verdict: "Managed remote gcloud+bq for agents—keep Preview/Pre-GA hard; fence local gcloud-mcp, BigQuery MCP SQL, and T4 Skills; soft-note pay-for-resources."
sources:
  - title: "Google Cloud CLI remote MCP server in preview — Google Cloud Blog"
    url: https://cloud.google.com/blog/products/ai-machine-learning/google-cloud-cli-remote-mcp-server-in-preview/
  - title: "Use the Cloud CLI remote MCP server — Docs"
    url: https://docs.cloud.google.com/sdk/use-gcloud-mcp
  - title: "MCP reference (cloudcli.googleapis.com)"
    url: https://docs.cloud.google.com/sdk/reference/mcp
  - title: "Authenticate to MCP servers — Docs"
    url: https://docs.cloud.google.com/mcp/authenticate-mcp
---

Google Cloud put a **Cloud CLI remote MCP server** into **public preview** (blog **2026-09-30**), powered by **`gcloud`** and **`bq`**, so AI agents can run CLI operations against GCP infra and BigQuery without packaging CLI binaries into agent runtimes. Docs label the feature **Preview** under **Pre-GA Offerings Terms**—**as is**, limited support ([blog](https://cloud.google.com/blog/products/ai-machine-learning/google-cloud-cli-remote-mcp-server-in-preview/), [docs](https://docs.cloud.google.com/sdk/use-gcloud-mcp)).

This is a **Desk Bot** tools/cli briefing. **HARD:** do **not** call GA or invent a GA date. **Fence from** local stdio **`gcloud-mcp`**, the separate **BigQuery MCP server** (GA SQL/analysis), and **T4 Gemini Skills / Gems**.

## Endpoint + enablement

MCP endpoint: **`https://cloudcli.googleapis.com/mcp`** (Streamable HTTP). Enable **Cloud CLI Execution API** (`cloudcli.googleapis.com`); grant **MCP Tool User** (`roles/mcp.toolUser`). Auth: Agent Identity (hosted GCP platforms) or OAuth 2.0 + IAM (external); docs say API keys are **not** accepted ([blog](https://cloud.google.com/blog/products/ai-machine-learning/google-cloud-cli-remote-mcp-server-in-preview/), [auth docs](https://docs.cloud.google.com/mcp/authenticate-mcp)).

## Two tools

Agents get broad CLI surface via **`run_gcloud_command`** and **`run_bq_command`**—infrastructure manage/diagnose (`gcloud`) plus advanced BigQuery admin (scheduling via DTS, jobs/reservations, dataset IAM, snapshots/clones). That admin path is **distinct** from the separate BigQuery MCP server’s GA SQL/analysis surface ([blog](https://cloud.google.com/blog/products/ai-machine-learning/google-cloud-cli-remote-mcp-server-in-preview/), [docs](https://docs.cloud.google.com/sdk/use-gcloud-mcp)).

MCP reference warns: tools are **not** read-only—they can create/update/delete resources ([reference](https://docs.cloud.google.com/sdk/reference/mcp)).

## Soft: blocked commands (non-exhaustive)

Docs list **example** blocked `gcloud` groups (security/inapplicability), including **`auth`**, **`config`**, **`iam service-accounts`**, **`init`**, **`survey`**—list is **non-exhaustive** and **subject to change**. Blocked `bq` examples: **`init`**, **`pyshell`**, **`shell`**. Reference adds further forbidden `gcloud` examples (e.g. `app deploy`, `app instances ssh`, `billing`, `components`, `docker`, `feedback`, `info`, `meta`). Prefer “examples of blocked groups” over claiming a complete allowlist ([docs](https://docs.cloud.google.com/sdk/use-gcloud-mcp), [reference](https://docs.cloud.google.com/sdk/reference/mcp)).

## Soft: security / pricing (as Google states)

Network-restricted execution with **no ambient credentials**; calls run as the authenticated caller with IAM + org-policy enforcement; optional **Model Armor** screening; configurable Audit Logs (Data Access under `cloudcli.googleapis.com/mcp`) without exposing sensitive command payloads/PII per blog—attribute as Google-stated ([blog](https://cloud.google.com/blog/products/ai-machine-learning/google-cloud-cli-remote-mcp-server-in-preview/), [docs](https://docs.cloud.google.com/sdk/use-gcloud-mcp)).

**Pricing:** **no additional charge** for the MCP server itself; customers **pay only for GCP resources created** and applicable data transfer. Do **not** invent free-tier quotas for the Execution API ([blog](https://cloud.google.com/blog/products/ai-machine-learning/google-cloud-cli-remote-mcp-server-in-preview/)).

## Who should care

Teams wiring agents to GCP without stuffing CLI binaries into every sandbox should start at the [preview blog](https://cloud.google.com/blog/products/ai-machine-learning/google-cloud-cli-remote-mcp-server-in-preview/) and [use-gcloud-mcp docs](https://docs.cloud.google.com/sdk/use-gcloud-mcp)—keep **Preview / Pre-GA**, treat blocked lists as mutable examples, soft-attribute IAM/Model Armor/Audit Logs and pay-for-resources, and leave Skills and BigQuery SQL MCP to their own slugs.

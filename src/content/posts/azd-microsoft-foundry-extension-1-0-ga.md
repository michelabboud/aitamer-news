---
title: "Azure Developer CLI's Foundry extension hits 1.0: agents deploy like apps"
description: "Microsoft's azd Foundry extension is GA at 1.0: hosted agents live in azure.yaml, test locally, deploy with azd up and gate CI on evals via GitHub Actions."
pubDate: "2026-11-09T13:37:00Z"
section: devops
tags:
  - azure
  - microsoft-foundry
  - ci-cd
  - agents
  - github-actions
draft: false
heroImage: https://bots.aitamer.news/heroes/azd-microsoft-foundry-extension-1-0-ga-c04f483f.jpg
heroAlt: "A paper conveyor carries a boxed parcel from a workbench to a steel-blue paper cloud under a clipboard checklist with one coral box."
author: desk-bot
wildness:
  rating: 2
  verified: "Microsoft Foundry Blog GA post by John Miller (5 Nov 2026, 20:55 UTC) read 9 Nov."
  claimed: "Workflow benefits are Microsoft's description; we did not deploy an agent."
verdict: "If you already use azd, hosted Foundry agents now fit the same azure.yaml, provision, deploy and pipeline flow as the rest of your app, with evals you can run in CI."
sources:
  - title: "Microsoft Foundry Blog: Microsoft Foundry extension for Azure Developer CLI is generally available (5 November 2026)"
    url: https://devblogs.microsoft.com/foundry/microsoft-foundry-azure-developer-cli-ga/
  - title: "AI Tamer: A cloud deploy without a stored cloud key"
    url: https://aitamer.news/posts/a-cloud-deploy-without-a-stored-cloud-key/
  - title: "AI Tamer: Fail a pull request when prompt tests regress, with promptfoo"
    url: https://aitamer.news/posts/fail-a-pull-request-when-prompt-tests-regress-with-promptfoo/
---

Microsoft says the Foundry extension bundle (`microsoft.foundry`) for the Azure Developer CLI (azd) has reached version 1.0 and is [generally available](https://devblogs.microsoft.com/foundry/microsoft-foundry-azure-developer-cli-ga/). The post went up on 5 November 2026. azd already provisions Azure resources and deploys code; the extension adds agent setup and local testing, and keeps agent and deployment configuration next to your code in `azure.yaml`.

In Foundry, a hosted agent runs your own agent code on managed compute. You pick the framework; Foundry runs it.

## The flow, as Microsoft documents it

Prerequisites are azd 1.37.0 or later, a current `uv`, and Python 3.13 or later for the sample, plus an Azure subscription, Foundry permissions and model quota in your region. Provisioned resources and model usage are billed.

```sh
azd auth login
azd ext install microsoft.foundry
azd ai agent init --template <sample azure.yaml URL> --deploy-mode code --src .
azd provision                     # creates declared resources, incl. missing model deployments
azd ai agent run                  # local run, opens Agent Inspector
azd ai agent invoke --local "..." # call the local agent
azd deploy                        # remote build in Foundry, no local container build
```

`azure.yaml` declares the model deployment, the agent's source and runtime, CPU and memory, and its dependency on the Foundry project. You can start without infrastructure files, or eject editable Bicep or Terraform and keep using `azd provision`. Other commands in the post: `azd deploy --preview` to review hosted-agent config changes, `azd ai agent monitor --follow` for logs, and `azd ai agent doctor` for setup and permission problems.

## Evals and CI

A separate `azure.ai.evaluations` extension generates a test dataset and grading rubric (`azd ai eval generate`), stores the config in `evals/azure.eval.yaml`, and runs it with `azd ai eval run start --eval quality`. `azd pipeline config` sets up a GitHub Actions or Azure DevOps workflow; the post's Actions excerpt installs azd 1.37.0 with `Azure/setup-azd@v2`, installs both extensions and runs `azd up --no-prompt`. Microsoft says to run the eval after deployment in CI and points to its CI/CD guide for threshold-based quality gates.

The post also notes a cleanup trap: `azd down` deletes the resource group of a project it created, but for a reused project it leaves the project and the hosted agent in place.

## Why this matters

For teams already on Azure, this moves agents out of portal clicks and into the same reviewable file, environments and pipeline as the rest of the service, so an agent's model or prompt change shows up in a pull request. The eval step is the part to adopt even if you never use Foundry: gating a deploy on a quality check is the same idea as [failing a PR when prompt tests regress](/posts/fail-a-pull-request-when-prompt-tests-regress-with-promptfoo/). Microsoft's post says to keep runtime credentials in pipeline secrets and use a separate azd environment per stage; if you want to drop the long-lived deploy credential too, [deploying without a stored cloud key](/posts/a-cloud-deploy-without-a-stored-cloud-key/) walks through the OpenID Connect pattern on AWS.

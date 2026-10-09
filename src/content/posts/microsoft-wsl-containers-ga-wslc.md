---
title: "WSL containers are generally available: a wslc.exe primer for WSL 3.0.1"
description: "WSL 3.0.1 shipped on 29 September with WSL containers out of preview: a wslc.exe CLI (alias container.exe) and a containers API on NuGet. Here is what to run, how to update, and what 3.0.2 adds."
pubDate: "2026-10-09T01:07:00Z"
specimen: 646
section: tools
subsection: cli
tags:
  - wsl
  - windows
  - containers
  - wslc
  - microsoft
draft: false
heroImage: https://bots.aitamer.news/heroes/microsoft-wsl-containers-ga-wslc-1a508532.jpg
heroAlt: "Paper-cut illustration of a yellow construction crane lowering a stack of teal, rust and sand shipping containers through an arched cream window in a slate-blue wall."
author: desk-bot
wildness:
  rating: 1
  verified: "3.0.1 is a full GitHub release of 29 Sep; the blog lists wslc commands and the NuGet SDK is published"
  claimed: "Up to 2x faster Windows-file access is Microsoft's figure"
verdict: "A shipped, documented feature, not a preview. Run wsl --update, try wslc on a throwaway image, and wait for compose support before moving multi-service stacks."
sources:
  - title: "WSL containers is now generally available (Windows Developer Blog, 29 September 2026)"
    url: https://blogs.windows.com/windowsdeveloper/2026/09/29/wsl-containers-now-generally-available/
  - title: "WSLC Architecture deep dive (Windows Command Line blog, 29 September 2026)"
    url: https://devblogs.microsoft.com/commandline/wslc-architecture-deep-dive/
  - title: "microsoft/WSL releases (3.0.1 and 3.0.2)"
    url: https://github.com/microsoft/wsl/releases
  - title: "Microsoft.WSL.Containers 3.0.1 (NuGet)"
    url: https://www.nuget.org/packages/Microsoft.WSL.Containers/3.0.1
---

WSL containers left preview on 29 September 2026. That day Microsoft published [WSL 3.0.1](https://github.com/microsoft/wsl/releases) as a full release with the headline "WSLc is generally available," and the [Windows Developer Blog](https://blogs.windows.com/windowsdeveloper/2026/09/29/wsl-containers-now-generally-available/) announced the feature. This is a catch-up explainer, not breaking news: the release is ten days old. A 3.0.2 pre-release followed on 5 October.

## What shipped

WSL containers run Linux containers on Windows through the WSL virtual machine. The blog names two pieces.

- **The CLI.** `wslc.exe` builds, runs and deploys Linux containers. It also answers to a built-in alias, `container.exe`, "to run the same familiar container commands."
- **The API.** Functions that let native Windows apps run Linux containers programmatically. Microsoft's examples are running local AI workloads and running cloud-based containerized applications locally.

## Update first

The blog's instruction is one command:

```powershell
wsl --update
```

That moves a machine to the current stable release, 3.0.1. To try 3.0.2, which GitHub marks as a pre-release, opt in with:

```powershell
wsl --update --pre-release
```

Treat the pre-release as a test build. Its changelog includes fixes for WSL container event timestamps, `--format json` for `wslc events`, container health notifications in that event stream, and a networking fallback when no IPv4 gateway is available.

## Commands worth knowing

The GA post lists what is new since the preview. Each line below is from that list.

- `wslc container restart` restarts a running container.
- `wslc container cp` copies files in and out through a tar archive.
- `wslc system info` shows the state of the container environment.
- `wslc network connect` and `wslc network disconnect` attach and detach containers from networks; `wslc network create` accepts driver options.
- `wslc events` streams container activity in real time.
- `--stop-timeout` on `wslc create` and `wslc run`, where `-1` means wait forever, and `--mount` on both.

Health checks are supported, and the default session's storage path can be moved to another drive.

The [architecture deep dive](https://devblogs.microsoft.com/commandline/wslc-architecture-deep-dive/) shows the volume syntax. Sharing a Windows folder looks like this:

```powershell
wslc container run -v C:\path\to\folder:/volume -it debian:latest ls /volume
```

A volume backed by its own virtual disk, with a size cap, looks like this:

```powershell
wslc volume create --driver vhd -o SizeBytes=200000000 my-volume
wslc container run -v my-volume:/volume -it debian:latest findmnt /volume
```

## How it is built

The deep dive says `wslservice.exe` still creates the virtual machine, but it hands the session to a child process, `wslcsession.exe`, that runs as the calling user. Container creation, mounts and port bindings happen in that less privileged process. Each session has its own VHD, stored under `%AppData%\Local\wslc\sessions` when you use `wslc.exe`. Windows folders reach containers over virtiofs, which the post says is about twice as fast as the older plan9 path. Networking uses a new mode called Consommé, which sends the VM's traffic through a Windows process running for the user, so it behaves like ordinary Windows traffic for VPNs and firewalls.

## Using it from an app

The [Microsoft.WSL.Containers](https://www.nuget.org/packages/Microsoft.WSL.Containers/3.0.1) 3.0.1 package is the SDK. It targets .NET 8.0 and supports x64 and ARM64. It exposes a native C/C++ API (`wslcsdk.h`), a C++/WinRT projection, and a C# projection:

```powershell
dotnet add package Microsoft.WSL.Containers --version 3.0.1
```

The package README also adds a `WslcImage` MSBuild item that builds a container image from a Dockerfile and saves it as a `.tar` during a normal project build. That is the route for a Windows app that wants to ship a Linux inference service next to its own code.

## For admins, and what is missing

Intune gains a switch to allow or block WSL containers and a registry allow list that limits which registries images can be pulled from. Defender for Endpoint's WSL plug-in now covers container process, file and network activity.

Compose is not there yet. Microsoft calls `wslc compose` its top feature request and "our focus for our next iterations." Until it ships, multi-container stacks still need another runtime, while single containers and app-embedded workloads can move to `wslc` now.

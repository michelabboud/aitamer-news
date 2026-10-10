---
title: Split one data center GPU into isolated slices with NVIDIA MIG
description: MIG cuts a supported NVIDIA GPU into up to seven instances with their own memory, cache and compute. How to create them and pick a profile for a model server.
pubDate: "2026-10-11T08:00:00Z"
section: devops
tags:
  - nvidia
  - mig
  - gpu
  - inference
  - nvidia-smi
draft: false
heroImage: https://media.aitamer.news/heroes/split-one-data-center-gpu-into-isolated-slices-with-nvidia-mig-cbde6f3e.jpg
heroAlt: A paper-cut GPU card shows its central chip divided into seven isolated color-coded slices.
author: quill
wildness:
  rating: 1
  verified: Profiles, isolation scope, nvidia-smi commands and reboot behavior come from NVIDIA's MIG guide.
  claimed: The 7B model sizing is plain arithmetic on weights only; real KV cache and overhead need measuring.
verdict: MIG is the right tool when model servers on one card must not touch each other's memory. Size by memory first, script the layout for reboots, and skip it for graphics or NCCL work.
sources:
  - title: "MIG User Guide: Introduction"
    url: https://docs.nvidia.com/datacenter/tesla/mig-user-guide/introduction.html
  - title: "MIG User Guide: Supported GPUs"
    url: https://docs.nvidia.com/datacenter/tesla/mig-user-guide/supported-gpus.html
  - title: "MIG User Guide: Supported MIG Profiles"
    url: https://docs.nvidia.com/datacenter/tesla/mig-user-guide/supported-mig-profiles.html
  - title: "MIG User Guide: Getting Started with MIG"
    url: https://docs.nvidia.com/datacenter/tesla/mig-user-guide/getting-started-with-mig.html
  - title: "MIG User Guide: Deployment Considerations"
    url: https://docs.nvidia.com/datacenter/tesla/mig-user-guide/deployment-considerations.html
  - title: "NVIDIA GPU Operator: Time-Slicing GPUs in Kubernetes"
    url: https://docs.nvidia.com/datacenter/cloud-native/gpu-operator/latest/gpu-sharing.html
---

A single A100 or H100 is often too big for one small inference server and too expensive to leave half idle. Multi-Instance GPU (MIG) cuts the card into fixed slices. Each slice behaves like a smaller GPU with its own memory and compute, and a workload in one slice cannot crowd out the others.

## What MIG isolates

The [MIG introduction](https://docs.nvidia.com/datacenter/tesla/mig-user-guide/introduction.html) says MIG partitions NVIDIA Ampere and later GPUs into up to seven separate GPU instances. Each instance gets "separate and isolated paths through the entire memory system": its own crossbar ports, L2 cache banks, memory controllers and DRAM address buses. NVIDIA states that an instance keeps its cache allocation and DRAM bandwidth even when a neighbour is heavily using memory, and that MIG provides fault isolation between clients such as VMs, containers or processes.

For serving, that is the property that matters. A noisy batch job in one slice does not eat the memory a latency-sensitive endpoint in another slice was counting on.

The [supported GPUs page](https://docs.nvidia.com/datacenter/tesla/mig-user-guide/supported-gpus.html) lists A100 and A30 on Ampere, H100, H20 and H200 on Hopper, and several Blackwell parts including B200 and GB200. If your card is not on that list, MIG is not available to you.

## How profile names work

A profile name such as `3g.20gb` has two parts. On an A100, the number before `g` is the compute share in sevenths of the streaming multiprocessors (SMs); the A30 and RTX PRO 6000 tables use quarters. The number before `gb` is the memory. The [profile tables](https://docs.nvidia.com/datacenter/tesla/mig-user-guide/supported-mig-profiles.html) for the A100-SXM4-40GB show:

| Profile | Memory | SMs | Max instances |
|---|---|---|---|
| `1g.5gb` | 1/8 | 1/7 | 7 |
| `2g.10gb` | 2/8 | 2/7 | 3 |
| `3g.20gb` | 4/8 | 3/7 | 2 |
| `4g.20gb` | 4/8 | 4/7 | 1 |
| `7g.40gb` | Full | 7/7 | 1 |

Two details stand out. Memory comes in eighths while compute comes in sevenths, so a slice is not a simple fraction of the card. And `3g.20gb` and `4g.20gb` get the same memory and L2 share; `4g.20gb` adds one seventh of the SMs and one copy engine. The H100 80GB table uses the same shapes with doubled memory: `1g.10gb`, `2g.20gb`, `3g.40gb`, `4g.40gb` and `7g.80gb`. Profiles ending in `+me` add media engines and can be created only once per GPU.

## Pick a profile for a model server

The MIG guide does not size models for you. Start from memory, because it is the hard wall. Each instance has dedicated memory, so a server that needs more than its slice holds cannot borrow from a neighbour. Add up the model weights (parameter count times bytes per parameter), the KV cache your server reserves for its maximum batch and context length, and the runtime's own overhead. Pick the smallest profile whose memory covers that total with headroom.

As arithmetic: 7 billion parameters at 2 bytes each is 14 GB of weights before any KV cache. That rules out `1g.5gb` and `2g.10gb` on an A100-40GB. `3g.20gb` leaves at most about 6 GB for cache and overhead, which may be tight for long contexts. Then decide on compute. If `3g.20gb` fits but misses your latency target, `4g.20gb` gives more SMs for the same memory. Measure throughput and latency on the slice itself before you commit to a layout.

## Create the instances

Enable MIG mode on GPU 0 and confirm it:

```bash
sudo nvidia-smi -i 0 -mig 1
nvidia-smi -i 0 --query-gpu=pci.bus_id,mig.mode.current --format=csv
```

According to the [getting started guide](https://docs.nvidia.com/datacenter/tesla/mig-user-guide/getting-started-with-mig.html), on Ampere the driver attempts a GPU reset. The reset fails with "In use by another client" if a monitoring agent or another process holds the GPU, so stop those processes or reboot. Hopper and newer need no reset.

List the profiles and their possible placements, then create two `3g.20gb` instances:

```bash
sudo nvidia-smi mig -lgip
sudo nvidia-smi mig -lgipp
sudo nvidia-smi mig -cgi 3g.20gb,3g.20gb -C
nvidia-smi -L
```

`-cgi` accepts profile IDs, short names or full names. The `-C` flag creates the compute instances inside each GPU instance, and the guide says CUDA workloads cannot run without them. `nvidia-smi -L` prints the MIG device UUIDs.

## Run a server on one slice

Point a process or container at a slice by its UUID:

```bash
CUDA_VISIBLE_DEVICES=MIG-<UUID> ./your_app
sudo docker run --runtime=nvidia -e NVIDIA_VISIBLE_DEVICES=MIG-<UUID> nvidia/cuda nvidia-smi
```

To tear the layout down, destroy compute instances first, then GPU instances: `sudo nvidia-smi mig -dci && sudo nvidia-smi mig -dgi`.

## The failure you will meet after a reboot

MIG devices do not survive a reboot or a GPU reset on any architecture. MIG mode itself persists across reboots on Ampere, and on Hopper and newer it lasts only while the driver is loaded. The result is a server that started fine yesterday and finds no MIG device today. The guide points to NVIDIA's MIG Partition Editor (mig-parted), run from a systemd service, to recreate the layout at boot.

## Where MIG stops fitting

The [deployment considerations](https://docs.nvidia.com/datacenter/tesla/mig-user-guide/deployment-considerations.html) list limits that rule out some workloads. Graphics APIs such as OpenGL and Vulkan are not supported, apart from some profiles on RTX PRO 6000 Blackwell. NCCL is not supported. CUDA IPC works across compute instances and not across GPU instances. Profiling of shared GPU resources is not supported. A model too large for the full `7g` profile needs a whole card or several, and MIG adds nothing there.

The layout is also fixed until you change it. If your traffic mix shifts often, you will keep destroying and recreating instances, which disrupts whatever runs on them. When you need to share a card without hard boundaries, [GPU time-slicing in Kubernetes](https://docs.nvidia.com/datacenter/cloud-native/gpu-operator/latest/gpu-sharing.html) is the looser option, and it gives up the memory and fault isolation described here.

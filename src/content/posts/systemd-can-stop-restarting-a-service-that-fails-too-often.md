---
title: Systemd Can Stop Restarting a Service That Fails Too Often
description: How systemd restart policy meets start-rate limits, and why clearing a failed counter is a separate step from fixing a service.
pubDate: "2026-10-10T03:30:00Z"
specimen: 604
section: devops
tags:
  - systemd
  - service-reliability
  - operations
  - ai-applications
draft: false
heroImage: https://media.aitamer.news/heroes/systemd-can-stop-restarting-a-service-that-fails-too-often-a3ca1338.jpg
heroAlt: A broken cream retry wheel with three rust tabs is held at a teal gate, while a reset key leaves its bent spoke unrepaired.
author: ari
wildness:
  rating: 1
  verified: Restart policy is subject to unit start-rate limits, including manual starts.
  claimed: The unit example is illustrative; no service failure or recovery was measured.
verdict: Diagnose and fix the service failure first; clear the counter only if the limit still blocks a verified recovery.
sources:
  - title: systemd.service service unit configuration
    url: https://raw.githubusercontent.com/systemd/systemd/main/man/systemd.service.xml
  - title: systemd.unit unit configuration
    url: https://raw.githubusercontent.com/systemd/systemd/main/man/systemd.unit.xml
---

Consider a voice application whose inference service exits while loading a missing model file. Its unit says `Restart=on-failure`, so systemd tries again. After several quick failures, retries stop. An operator who reads only the restart directive may expect the service to keep trying indefinitely.

Two settings govern different parts of this sequence. [`Restart=` in `systemd.service`](https://raw.githubusercontent.com/systemd/systemd/main/man/systemd.service.xml) selects which exits and timeouts trigger an automatic restart. `RestartSec=` sets the delay before each retry. [`StartLimitIntervalSec=` and `StartLimitBurst=` in `systemd.unit`](https://raw.githubusercontent.com/systemd/systemd/main/man/systemd.unit.xml) count starts within a time window and reject starts beyond the burst. The limit applies to manual starts as well as automatic ones.

For example, this illustrative unit allows a small burst while leaving time to inspect a broken service:

```ini
[Unit]
StartLimitIntervalSec=60s
StartLimitBurst=3

[Service]
ExecStart=/opt/voice/bin/inference-server
Restart=on-failure
RestartSec=5s
```

If each attempt fails promptly, the first start and two retries can consume the three allowed starts. The next start is refused until the rate window allows another one. The exact sequence depends on when each attempt occurs; a slower failure or longer restart delay changes the count within the window. Systemd's unit documentation also notes that once the interval has passed, a later manual, timer, or socket start can run and restart logic can operate again. It does not promise an automatic retry at the instant the window expires.

## Recover the service, then its retry path

Begin with `systemctl status inference.service` and the service journal to find the actual failure. In this example, restore the model file or correct its path and permissions, then verify that the application can initialize. Changing the burst value to suppress the symptom leaves the same failure in place and can create a faster failure loop.

`systemctl reset-failed inference.service` clears the failed state and the service's start-rate counter. The [unit manual](https://raw.githubusercontent.com/systemd/systemd/main/man/systemd.unit.xml) explicitly describes the counter reset as useful when a manual start is blocked. It does not repair the missing file. After fixing the cause, reset the counter if it still blocks recovery, start the service, and verify that it stays active and serves a real inference request. Keep the limit as a guard against repeated failed starts, not as a substitute for application health.

---
title: A Notify Service Must Actually Announce Readiness
description: What systemd waits for with Type=notify, when an application should send READY=1, and why short-lived helpers can lose notifications.
pubDate: "2026-10-10T04:00:00Z"
specimen: 605
section: devops
tags:
  - systemd
  - readiness
  - voice-applications
  - service-design
draft: false
heroImage: https://media.aitamer.news/heroes/a-notify-service-must-actually-announce-readiness-56ab246d.jpg
heroAlt: A completed blue paper bird rings its yellow readiness bell beside a cream door and teal latch.
author: ari
wildness:
  rating: 1
  verified: Type=notify waits for READY=1, and systemd checks sender attribution.
  claimed: Application readiness conditions vary; the gateway example is conceptual.
verdict: Send READY=1 from the long-running main process after real initialization; use Type=exec when notification support is absent.
sources:
  - title: systemd.service service unit configuration
    url: https://raw.githubusercontent.com/systemd/systemd/main/man/systemd.service.xml
---

A voice gateway process can exist before it can serve a call. It may still be loading a speech model, connecting to an upstream service, or preparing its listener. If another unit starts as soon as the process is created, callers can reach a gateway that has not finished initialization.

[`Type=simple` in the systemd service manual](https://raw.githubusercontent.com/systemd/systemd/main/man/systemd.service.xml) considers the service started immediately after the main process is forked, before the binary has necessarily executed. `Type=exec` waits for the executable to start, catching setup failures such as a missing binary, but still says nothing about the gateway's own initialization. `Type=notify` holds the unit in its starting state until the service sends `READY=1` through `sd_notify()` or an equivalent notification. Systemd then proceeds with units ordered after it.

A minimal service definition communicates the contract, but the program must implement it:

```ini
[Service]
Type=notify
ExecStart=/opt/voice/bin/gateway
```

The gateway should send `READY=1` from its main process only after the resources required for useful service are ready. For this example, that means the model is loaded, the listener is available, and the application can handle the requests its dependents will send. The exact readiness condition belongs to the application. A call to `sd_notify()` at the top of `main()` would satisfy the protocol while giving a false readiness signal. Without a notification, systemd keeps waiting; the service manual says it can fail and be shut down when the startup timeout is reached.

## Who may send the message?

`NotifyAccess=` controls which service processes can submit status updates. With `Type=notify`, systemd implicitly uses `main` if the setting is omitted. That fits a main-process readiness call. An auxiliary helper needs a broader setting, but `NotifyAccess=all` alone does not guarantee its message will count. The [manual's attribution rule](https://raw.githubusercontent.com/systemd/systemd/main/man/systemd.service.xml) warns that a helper that sends a notification and exits immediately may disappear before the manager can associate the message with the unit. For a helper outside the manager's directly tracked processes, `sd_notify_barrier()` can synchronize delivery. Keeping readiness reporting in the long-running main process is simpler when that process owns initialization.

Use `Type=notify` when the application can report a meaningful readiness point. If it cannot implement the protocol, `Type=exec` is an honest process-start signal, and downstream health checks should account for the remaining initialization period. A successful readiness message marks one transition; ongoing request health still needs observation.

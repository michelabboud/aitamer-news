---
title: TCP Keepalive Is Different From a Request Deadline
description: A Linux TCP connection can look healthy while an AI request stalls. Keepalive, user timeout, and an application deadline answer different questions.
pubDate: "2026-10-10T07:00:00Z"
specimen: 611
section: devops
tags:
  - tcp
  - linux
  - networking
  - timeouts
  - ai-agents
draft: false
heroImage: https://media.aitamer.news/heroes/tcp-keepalive-is-different-from-a-request-deadline-3ccb4975.jpg
heroAlt: A paper caller waits beside an hourglass while a knotted blue telephone cord remains connected.
author: ari
wildness:
  rating: 1
  verified: Linux keepalive probes idle TCP; TCP_USER_TIMEOUT limits unacknowledged or blocked data.
  claimed: No additional empirical claim; examples illustrate the documented mechanism.
verdict: Use a per-request monotonic deadline; reserve keepalive and TCP_USER_TIMEOUT for transport failures.
sources:
  - title: Linux tcp(7) manual
    url: https://man7.org/linux/man-pages/man7/tcp.7.html
---

A voice assistant sends a turn to a model service over a persistent TCP connection. The socket stays open, yet the caller hears silence while the service takes too long to answer. Enabling TCP keepalive will not bound that wait. The connection and the request have different lifetimes.

Linux sends keepalive probes only when `SO_KEEPALIVE` is enabled and the connection has been idle long enough. `TCP_KEEPIDLE` sets that idle period, `TCP_KEEPINTVL` sets the interval between probes, and `TCP_KEEPCNT` sets how many unanswered probes cause the connection to be dropped. The [Linux TCP manual](https://man7.org/linux/man-pages/man7/tcp.7.html) lists a system default of two hours before probing begins. These Linux options help discover a peer or path that has gone silent; they say nothing about how quickly the peer's application must finish a request.

Consider a service that acknowledges the bytes of an inference request and then spends thirty seconds waiting on its own dependency. TCP can be functioning exactly as designed throughout that period. Even a more aggressive keepalive configuration cannot tell whether the service will deliver a useful answer before the caller leaves. Keepalive also starts from transport idleness, so ordinary traffic can postpone its probes.

Linux has another knob, `TCP_USER_TIMEOUT`. With a positive value, it limits how long transmitted bytes can remain unacknowledged, or bytes can remain unsent because of a zero window, before the connection closes with `ETIMEDOUT`. When used alongside keepalive, it controls the close decision following keepalive failure. It does not change when probes or retransmissions are sent. A peer can acknowledge a request while its application remains stuck, leaving this timeout with no stalled TCP bytes to measure.

Give each voice turn an application deadline based on elapsed time: record a monotonic start time, pass the remaining budget through model and tool calls, and cancel work when the budget expires. Return a deliberate timeout outcome to the caller. Treat socket liveness as a separate concern for idle connection cleanup and failure detection. If several requests share one connection, canceling one turn need not close the socket for all of them. Set the deadline from the user experience the product can tolerate; tune Linux socket options for the distinct transport failures they actually observe.

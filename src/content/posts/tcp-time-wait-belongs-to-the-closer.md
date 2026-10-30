---
title: TCP TIME-WAIT belongs to the side that closes first, and it is there on purpose
description: The endpoint that closes first waits 2xMSL in TIME-WAIT to resend its final ACK and to let old segments expire, so servers should set SO_REUSEADDR instead of tuning the wait away.
pubDate: "2026-10-31T12:00:00Z"
section: dev
tags:
  - tcp
  - networking
  - linux
  - sockets
  - time-wait
draft: false
heroImage: https://media.aitamer.news/heroes/tcp-time-wait-belongs-to-the-closer-95acc82e.jpg
heroAlt: A paper hourglass with running sand stands beside a closed arched gate and a small envelope.
author: quill
wildness:
  rating: 2
  verified: TIME-WAIT, 2xMSL and FIN handling (RFC 9293); old duplicates (RFC 1337); Linux knobs (tcp(7), socket(7)).
  claimed: Calling sysctl tuning the wrong default fix is the post's judgment.
verdict: Leave TIME-WAIT alone and set SO_REUSEADDR on listening sockets before bind.
sources:
  - title: "RFC 9293: Transmission Control Protocol (TCP)"
    url: https://www.rfc-editor.org/rfc/rfc9293.html#section-3.6
  - title: "RFC 1337: TIME-WAIT Assassination Hazards in TCP"
    url: https://www.rfc-editor.org/rfc/rfc1337.html
  - title: tcp(7), Linux manual page
    url: https://man7.org/linux/man-pages/man7/tcp.7.html
  - title: socket(7), Linux manual page
    url: https://man7.org/linux/man-pages/man7/socket.7.html
---

Restart a TCP server right after it closed some connections, and `bind` can fail with "Address already in use". Run `ss -tan` and the port shows up in `TIME-WAIT`. That state is not a leak. It is a deliberate wait in the protocol, and it has a job.

## Who waits, and for how long

[RFC 9293](https://www.rfc-editor.org/rfc/rfc9293.html#section-3.6), the current TCP specification, describes the close sequence. The side that sends the first FIN and then receives the peer's FIN ends in TIME-WAIT. The side that closed second waits until its own FIN is acknowledged and then deletes the connection. If both close at once, both wait. The RFC defines TIME-WAIT as waiting for enough time to pass to be sure the remote TCP peer received the acknowledgment of its connection termination request, and section 3.6.1 says the closing side must linger there for 2×MSL, the Maximum Segment Lifetime.

The same document sets the MSL to 2 minutes for the specification and calls that an engineering choice, which makes TIME-WAIT four minutes long on paper. The RFC adds that the value may be changed if experience indicates it is desirable.

## What it protects

First, the wait lets the final ACK be repeated if it is lost and the peer retransmits its FIN. Section 3.10.7.4 says the only thing that can arrive in TIME-WAIT is a retransmission of the remote FIN, and the response is to acknowledge it and restart the 2 MSL timeout. Without the wait, the retransmitted FIN would meet no connection, and the peer would not see a clean close.

Second, it keeps delayed segments from a previous connection out of a new incarnation that uses the same addresses and ports. [RFC 1337](https://www.rfc-editor.org/rfc/rfc1337.html) puts it plainly: the TIME-WAIT delay allows all old duplicate segments time enough to die in the Internet before the connection is reopened. Its first hazard, old duplicate data being accepted erroneously, is what happens when the wait is cut short.

## Why tuning it away is the wrong fix

The Linux knobs people reach for are documented in the [tcp(7) man page](https://man7.org/linux/man-pages/man7/tcp.7.html), and the descriptions are a warning. `tcp_tw_recycle` existed only from Linux 2.4 to 4.11, and the page says enabling it is not recommended because the remote side may not use monotonically increasing timestamps, as with devices behind NAT. Of `tcp_tw_reuse`, it says the setting should not be changed without advice from technical experts. `tcp_fin_timeout` does not set the TIME-WAIT length either: the man page defines it as how long to wait for a final FIN before the socket is forcibly closed.

## SO_REUSEADDR for servers

The restart failure has a direct answer. The [socket(7) man page](https://man7.org/linux/man-pages/man7/socket.7.html) says `SO_REUSEADDR` relaxes the address checks in `bind`: for IPv4 sockets, a socket may bind unless an active listening socket is already bound to the address.

```python
import socket

srv = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
srv.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
srv.bind(("127.0.0.1", 50011))
srv.listen()
```

In a test on Linux 6.18 with Python 3.12, a server that closed a connection first and then restarted got `[Errno 98] Address already in use` when the option was missing and bound again only when both the first and the restarted server had set it. Set the option on every start, before `bind`, not only after a failure.

## The rule

Leave TIME-WAIT alone. Let the side that closes first carry it, set `SO_REUSEADDR` on listening sockets, and treat sysctl changes to TIME-WAIT as a last resort that needs a measured reason.

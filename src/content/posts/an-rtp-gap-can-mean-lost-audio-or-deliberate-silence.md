---
title: An RTP Gap Can Mean Lost Audio or Deliberate Silence
description: Read RTP sequence numbers and timestamps together to separate likely packet loss from suppressed silence, then account for comfort-noise packets.
pubDate: "2026-10-10T01:00:00Z"
specimen: 599
section: dev
tags:
  - rtp
  - audio
  - voice-ai
draft: false
heroImage: https://media.aitamer.news/heroes/an-rtp-gap-can-mean-lost-audio-or-deliberate-silence-14fb1d8b.jpg
heroAlt: A continuous teal time ribbon spans a gap in cream packet envelopes, with a rust envelope displaced above another gap.
author: ari
wildness:
  rating: 1
  verified: RTP sequences count sent packets; timestamps track sampling time; RFC 3389 defines comfort noise.
  claimed: Packet values are illustrative; a trace alone may not establish why audio was absent.
verdict: Diagnose voice gaps with sequence, timestamp and payload type together. Confirm clock rate and arrival order before classifying loss or suppressed silence.
sources:
  - title: "RFC 3550: RTP, Section 5.1"
    url: https://www.rfc-editor.org/rfc/rfc3550.html#section-5.1
  - title: "RFC 3389: RTP Payload for Comfort Noise"
    url: https://www.rfc-editor.org/rfc/rfc3389.html#section-5
---

A voice agent pauses before answering, and a packet trace shows a jump in audio time. Calling that jump packet loss can send the investigation toward the network when the sender deliberately stopped transmitting during silence.

[RFC 3550](https://www.rfc-editor.org/rfc/rfc3550.html#section-5.1) gives the two header fields different jobs. The sequence number advances by one for each RTP data packet sent. The timestamp marks the sampling instant of the packet’s first payload octet. For fixed-rate audio, its clock continues across time that produced no transmitted packet. The RFC’s example advances the timestamp by 160 sampling periods for each 160-sample block, even when a silent block is dropped.

Consider a hypothetical stream with an 8,000 Hz RTP clock and one 160-sample audio block per packet. Sequence 700 at timestamp 16,000 followed by sequence 701 at 17,760 has consecutive packet numbers but a 220 ms timestamp jump. The first packet covers 20 ms, leaving 200 ms without ordinary audio packets. That pattern is consistent with discontinuous transmission: silence was suppressed while media time continued. Now compare sequence 700 at 16,000 followed by sequence 702 at 16,320. A packet number is absent and the timestamps fit one intervening 20 ms block. After ruling out reordering or a late arrival, that is evidence of a missing packet.

Comfort noise adds a further case. [RFC 3389](https://www.rfc-editor.org/rfc/rfc3389.html#section-5) defines a comfort-noise payload that can describe background noise during inactive speech. A comfort-noise packet is still an RTP packet, so it consumes a sequence number; its timestamp marks the beginning of its noise period. Its update rate is implementation specific. A stream may also suppress silence without using this comfort-noise format at all. Therefore, the absence of a comfort-noise packet does not prove an audio dropout, and a received comfort-noise packet should not be counted as missing speech.

For a voice AI session, inspect one synchronization source at a time. Record sequence, timestamp, payload type and arrival order; establish the negotiated clock rate and packet duration before converting timestamp differences to milliseconds. Use sequence discontinuities to investigate loss, and consecutive sequences with noncontiguous media time to investigate silence suppression. A marker bit may help under the applicable profile, but its meaning is profile-defined. Correlate the trace with receiver reports and the sender’s voice activity behavior before changing jitter buffers or blaming transcription quality.

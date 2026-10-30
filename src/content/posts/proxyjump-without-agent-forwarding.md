---
title: Reach the inner host with ProxyJump instead of forwarding your SSH agent
description: A forwarded SSH agent can be used by anyone able to bypass permissions on its socket. ProxyJump reaches the inner server over a TCP forward with no agent needed.
pubDate: "2026-10-31T08:30:00Z"
specimen: 1157
section: devops
tags:
  - ssh
  - openssh
  - bastion
  - agent-forwarding
  - security
draft: false
heroImage: https://media.aitamer.news/heroes/proxyjump-without-agent-forwarding-f55a1e2a.jpg
heroAlt: An envelope crosses a bridge through a tower toward a door while a key remains on the near bank.
author: quill
wildness:
  rating: 1
  verified: "OpenSSH: users who can bypass permissions on the forwarded agent socket can use the local agent."
  claimed: The ssh manual says a jump host may be the safer alternative to agent forwarding.
verdict: Leave agent forwarding off by default, including for the bastion, and reach inner hosts with ProxyJump. Where forwarding is needed, confirm each key use and keep its lifetime short.
sources:
  - title: "OpenBSD manual: ssh(1)"
    url: https://man.openbsd.org/ssh
  - title: "OpenBSD manual: ssh_config(5)"
    url: https://man.openbsd.org/ssh_config
  - title: "OpenBSD manual: ssh-add(1)"
    url: https://man.openbsd.org/ssh-add
  - title: "OpenSSH portable source: ssh.c"
    url: https://raw.githubusercontent.com/openssh/openssh-portable/master/ssh.c
---

Getting to a server behind a bastion often starts with `ssh -A bastion` and a second `ssh` from there. The `-A` flag forwards your local authentication agent, so the bastion can use your keys for the next hop.

## What a forwarded agent exposes

The [ssh manual](https://man.openbsd.org/ssh) asks for caution with `-A`. Users on the remote host who can get past the file permissions on the agent's Unix-domain socket can reach your local agent over the forwarded connection. In practice that is root, or anyone else who can open the socket despite its permissions.

The manual adds that such an attacker cannot extract the key material. They can still authenticate with the identities loaded in your agent while the connection is open. Confirmation prompts and destination constraints still apply, and each target server still decides whether to accept the key.

## ProxyJump reaches the inner host over TCP

The same `-A` entry suggests a jump host (`-J`) as a possibly safer choice. With `-J`, ssh connects to the jump host and sets up a TCP forwarding from there to the destination. Your local client runs the inner session through that forward.

In the [OpenSSH client source](https://raw.githubusercontent.com/openssh/openssh-portable/master/ssh.c), the jump connection is built as an `ssh -W` stdio forward. That mode opens no session on the bastion, and the client requests agent forwarding only while setting up a session. An ordinary ProxyJump therefore does not normally give the bastion an agent socket, even when a `ForwardAgent yes` line matches it. The [ssh_config manual](https://man.openbsd.org/ssh_config) gives `no` as the default for `ForwardAgent`.

For a single connection:

```sh
ssh -J admin@bastion.example.com app@10.0.0.12
```

For regular use, put it in `~/.ssh/config`. The ssh manual notes that command-line options mostly affect the destination and leave jump hosts alone, so bastion settings belong in the file:

```
Host bastion
    HostName bastion.example.com
    User admin
    ForwardAgent no

Host app
    HostName 10.0.0.12
    User app
    ProxyJump bastion
```

Then `ssh app` passes through the bastion over a TCP forward. Our advice: keep `ForwardAgent no` on the bastion entry anyway. It states the intent for that host and also covers a direct `ssh bastion` login.

## When the remote host needs your key

Some jobs run on the remote host itself, such as cloning a private repository there. If you must forward, the [ssh-add manual](https://man.openbsd.org/ssh-add) offers three limits. `-c` asks for confirmation before each use of a key. `-t` caps how long a key stays loaded. `-h` adds destination constraints, which limit a forwarded key to the hops you list.

Destination constraints arrived in OpenSSH 8.9. Over a forwarded agent, the remote ssh client and the server both have to support them. The manual also warns that someone holding the remote agent socket can still forward it again, though only toward a destination you permitted.

## What to do

1. Run `ssh -G <host>` for the bastion and for the inner host. It prints the evaluated configuration, including the effective `forwardagent` value.
2. Remove `ForwardAgent yes` from any `Host *` block, and set `ForwardAgent no` on the bastion entry.
3. Replace `ssh -A` hops with `ProxyJump` or `-J`.
4. Where forwarding has to stay, enable it for that one host and load the key with `ssh-add -c -t 3600`. Our advice: use the shortest lifetime that fits the job.

---
title: "GreyNoise tracks an intruder inside Check Point management servers at 22 organizations. Patch CVE-2026-16232 and hunt"
description: "GreyNoise says actor GT13 stole data from 24 Check Point Security Management Servers at 22 organizations and likely still has access."
pubDate: "2026-11-25T08:07:00Z"
section: devops
subsection: security
tags:
  - security
  - check-point
  - greynoise
  - incident
  - firewall
  - ai-assisted-attacks
draft: false
heroImage: "https://bots.aitamer.news/heroes/greynoise-gt13-check-point-management-servers-campaign-b373182a.jpg"
heroAlt: "Cut-paper scene of a slate watchtower holding a ring of brass keys and wired by cords to a long cream fortress wall, while a dark navy cable runs in from a small distant hut and a figure with a lantern watches below"
author: desk-bot
wildness:
  rating: 2
  verified: "GreyNoise's GT13 report and Check Point's sk185169 fix list, read 25 Nov."
  claimed: "Victim count, ongoing access and LLM use are GreyNoise's assessment. Check Point says the bug is not new."
verdict: "If your Check Point management server was ever reachable from the internet, patch to the fixed Jumbo Take and hunt for GT13 traces now."
sources:
  - title: "GreyNoise: 99 IPs but a C2 ain't one, an active intrusion campaign against Check Point Security Management Servers (23 November 2026)"
    url: https://www.greynoise.io/blog/check-point-security-management-servers-intrusion-campaign
  - title: "Check Point sk185169: CVE-2026-16232, authentication bypass with SmartConsole login process using application token"
    url: https://support.checkpoint.com/results/sk/sk185169
  - title: "Check Point blog: Security Advisory, Action Required, July 2026 Security Update"
    url: https://blog.checkpoint.com/security/security-advisory-action-required-active-exploitation-of-check-point-smartconsole-authentication-bypass-cve-2026-16232/
  - title: "BleepingComputer: Hackers compromise Check Point servers in 22 organizations (updated 25 November 2026 with Check Point statement)"
    url: https://www.bleepingcomputer.com/news/security/hackers-compromise-check-point-servers-in-22-organizations/
---

Threat intelligence firm GreyNoise [says](https://www.greynoise.io/blog/check-point-security-management-servers-intrusion-campaign) it watched an intruder work through **Check Point Security Management Servers**, the consoles that hold firewall policy for whole networks, at at least 22 organizations between 17 October and 2 November. It tracks the actor as GT13 and does not attribute it to any known group.

The report, by Steve Miller and dated 23 November, says victims sit in finance, energy, government, transportation, mining, engineering and manufacturing, with assets in 17 countries and territories it lists, including the UK, Germany, India, South Korea, Australia and the United States.

## How GreyNoise saw it

GreyNoise says it caught the campaign through a server the actor had already taken over and was using as a relay, or "hop". According to the report, the actor broke into a Rejetto HFS file server with CVE-2026-61500 by rebuilding the state of the JavaScript random number generator from login responses and forging an admin session cookie. From that hop, it saved command output and stolen data from 24 distinct Check Point management servers.

Among the CVEs GreyNoise says the actor used or tried is **CVE-2026-16232**, Check Point's SmartConsole authentication bypass, which GreyNoise describes as reaching Run Script. One script it quotes harvested credentials, internal CA files and firewall configuration from a second Check Point device through the first. GreyNoise also lists attempts on Citrix NetScaler, Ivanti and Windows Netlogon bugs, and says the actor used Nmap, Chisel, Impacket and Paramiko.

GreyNoise says it believes the actor used LLMs and agentic systems for scanning, exploitation, tool building and interaction with compromised machines, alongside hands-on-keyboard work. That is its assessment, not something the report proves line by line.

Its visibility stopped around 2 November. "Given the actor's persistent access to victim Check Point devices, we expect that this intrusion campaign is ongoing," the report says. GreyNoise says it is working with government partners and CERTs to notify victims.

## What Check Point has published

Check Point's [sk185169](https://support.checkpoint.com/results/sk/sk185169) lists the fix for CVE-2026-16232 on Security Management and Multi-Domain Management servers: Jumbo Hotfix Accumulator R82.10 Take 36, R82 Take 118 and R81.20 Take 158 or later. R81 and R81.10 are listed as end of support. Its [July advisory](https://blog.checkpoint.com/security/security-advisory-action-required-active-exploitation-of-check-point-smartconsole-authentication-bypass-cve-2026-16232/) said one of the bugs was exploited at a handful of customers and only affects management exposed directly to the internet without IP restrictions. On 25 November a Check Point spokesperson told [BleepingComputer](https://www.bleepingcomputer.com/news/security/hackers-compromise-check-point-servers-in-22-organizations/) the attackers used CVE-2026-16232 and an adaptation of the public Metasploit module, so "this vulnerability and available protections are therefore not new."

## Why this matters

A management server is the keys to every gateway it controls, so patching alone is not enough if it was exposed this autumn: confirm the Jumbo Take, lock Trusted Clients and management access to known IPs, then hunt with GreyNoise's indicators and rotate credentials and CA material stored on the box. This is the same lesson as [the Azure API Management Classic case](/posts/azure-api-management-classic-flaw-secrets-norway-energy/) and [the vCenter zero-day](/posts/vmware-vcenter-zero-day-cve-2026-123890-armory-castle/): a closed hole does not evict someone already inside.

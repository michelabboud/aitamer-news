---
title: "Tencent retires Yuanqi on 9 November and points builders to its cloud agent platform"
description: "Tencent will shut the Yuanqi agent platform on 9 November 2026. New agents stop on 29 October, export runs until 9 January 2027, and Tencent's own guide points builders to its cloud ADP."
pubDate: "2026-10-12T07:00:00Z"
section: tools
subsection: agents
tags:
  - tencent
  - agents
  - yuanqi
  - shutdown
draft: false
heroImage: https://bots.aitamer.news/heroes/tencent-yuanqi-agent-platform-shutdown-dc7e5db6.jpg
heroAlt: "A paper-cut shop with a torn awning beside a blue warehouse, with small paper crates moving along a path from the shop into the warehouse."
author: desk-bot
wildness:
  rating: 2
  verified: "Tencent notices of 8 Oct: new agents stop 29 Oct, service ends 9 Nov 2026, deletion from 9 Jan 2027"
  claimed: "Which new-version exports import cleanly into ADP is Tencent's guide; old workflows cannot be exported"
verdict: "Export before 9 November if a live bot depends on Yuanqi, and use Tencent's ADP guide. Reports that no successor was named miss the migration page Tencent already published."
sources:
  - title: "关于元器平台停止服务通知 (Yuanqi help centre, updated 8 October 2026)"
    url: https://yuanqi.tencent.com/cl/service-discontinuation
  - title: "用户数据导出指南 (Yuanqi help centre, updated 10 October 2026)"
    url: https://yuanqi.tencent.com/cl/data-export-guide
  - title: "元器智能体迁移至腾讯云智能体开发平台（ADP）指引 (updated 10 October 2026)"
    url: https://yuanqi.tencent.com/cl/adp-guide
  - title: "旧版元器外部服务退费指引 (updated 8 October 2026)"
    url: https://yuanqi.tencent.com/cl/refund-guide
  - title: "关于旧版元器智能体创建入口停止服务的公告 (dated 22 April 2026, updated 8 October 2026)"
    url: https://yuanqi.tencent.com/cl/cr
  - title: "腾讯元器将于 11 月 9 日停止服务 (IT Home, 浩渺, 10 October 2026)"
    url: https://www.ithome.com/1/011/530.htm
  - title: "Tencent Will Shut Down Its Yuanqi AI Agent Platform on November 9 (Pandaily, 12 October 2026)"
    url: https://pandaily.com/tencent-yuanqi-ai-agent-platform-shutdown-november-9-data-export-january-2027
---

Tencent is closing Yuanqi (元器), the agent platform it uses for creation and for publishing into chat channels. The dates below are from Tencent's own help centre, not from the write-ups that followed.

The [shutdown notice](https://yuanqi.tencent.com/cl/service-discontinuation), updated 8 October 2026 and signed by the Yuanqi team that day, says the platform stops on 9 November 2026 because of a business adjustment. From 29 October it stops two things: creating new agents, and issuing API keys. Agents that already exist keep working until the shutdown. On 9 November Tencent closes public app access, data read and write, API calls and the console. Agent pages stop displaying. Agents published onward to WeChat Official Accounts, Service Accounts and WeChat Customer Service stop answering.

[IT Home](https://www.ithome.com/1/011/530.htm), on 10 October, reported that notice and the 2024 launch: a 17 May 2024 Tencent Cloud summit, where Tencent called Yuanqi a one-stop place to create and distribute agents, including through QQ, WeChat Customer Service, Tencent Cloud and search. A separate, older notice still in the help centre, [dated 22 April 2026](https://yuanqi.tencent.com/cl/cr), stopped the old Yuanqi creation entry on 6 May 2026 and said agents already created would keep working. That May date is not this shutdown.

## There is a named next platform

[Pandaily's 12 October article](https://pandaily.com/tencent-yuanqi-ai-agent-platform-shutdown-november-9-data-export-january-2027) has the dates right, and then says: "Tencent has not said whether a successor service will take over Yuanqi's distribution role." Tencent's 8 October notice does name continuations. Section four points at Tencent Cloud's Agent Development Platform (ADP) for building agents, knowledge bases and multi-channel publishing, and at Official Account smart reply, which can turn an account's articles into a knowledge base and take a prompt. The same notice says this is not Tencent leaving agents: those products are the replacements it tells Yuanqi users to move to. Pandaily itself, in the next sentence, points at products Tencent runs itself, such as WorkBuddy.

The [migration guide](https://yuanqi.tencent.com/cl/adp-guide), updated 10 October, is more specific than "go to ADP." It says the new Yuanqi can export a knowledge base, a workflow and a widget, and ADP can import those. Agent settings (mode, model, prompt, tools, welcome text, sample questions) and custom tools have to be entered again. Workflows from the old Yuanqi cannot be exported: you rebuild them, and you re-upload that knowledge base. After the move you publish the channels again on ADP. The guide's comparison keeps QQ Browser, App Bao and Honor on the Yuanqi side only. ADP's list adds WeChat mini programs, WeCom bots, DingTalk and Feishu, and the guide says ADP will not pull an Official Account's old articles across by itself. Official models and plugins also differ, so a bot can answer differently after the move. The guide offers a free ADP allowance and a Yuanqi-only voucher toward a paid ADP plan. It does not state the voucher's value.

## Export, then the refund that actually exists

The [export guide](https://yuanqi.tencent.com/cl/data-export-guide), updated 10 October, tells you to copy data before it is deleted:

- Until 9 November, export inside Yuanqi. The paths it lists are conversation logs, a knowledge base's documents or Q&A, a workflow, and a widget.
- From 9 November to 9 January 2027, the platform is down and a data-export console takes requests. The shutdown notice says you can log into that console in this window. The export guide, updated two days later, says when the console opens will be announced separately. Count on the export you do before 9 November.
- From 9 January 2027, Tencent stops taking export requests and deletes user data, except logs the law tells it to keep.

The support address on the notices is yuanqi2@tencent.com, weekdays 10:00 to 18:00. The export guide says export problems get a reply within three business days.

Refunds are narrower than "whatever you spent on Yuanqi." The shutdown notice says that if you bought resource packs through the old Yuanqi entry on Tencent Cloud, and unused resources or balance remain on the shutdown date, you apply on Tencent Cloud, the money goes back to the original payment account, and the amount is proportional to what was used. The [refund guide](https://yuanqi.tencent.com/cl/refund-guide) limits that to paid Hunyuan model packs bought on Tencent Cloud for old-Yuanqi API calls, with quota left. Free packs, the portion already used, and expired packs are out. The steps it gives: in the Tencent Cloud console, consider turning off post-pay first (it warns that this hits other post-pay use on the same account), check the remaining quota, and file a ticket with after-sales support. It says an approved refund generally takes five to ten business days, back to the original method.

If a WeChat bot is still served from Yuanqi, the hard stop is 9 November, when it stops answering. New agents and new API keys stop being issued on 29 October. The move, if you want one, is a manual republish on ADP, not a cutover Tencent runs for you.

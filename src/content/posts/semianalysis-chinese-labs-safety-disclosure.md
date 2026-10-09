---
title: "SemiAnalysis counts public safety results for 31 of 857 Chinese model releases"
description: "SemiAnalysis checked 857 releases from nine Chinese AI developers and found a published safety result for 31, only 9 at launch. It stresses that not found does not mean not tested."
pubDate: "2026-10-09T17:07:00Z"
section: general
subsection: safety
tags:
  - ai-safety
  - china
  - disclosure
  - semianalysis
draft: false
heroImage: https://bots.aitamer.news/heroes/semianalysis-chinese-labs-safety-disclosure-9a1f609d.jpg
heroAlt: "A long shelf of cream paper folders, only a few showing yellow sheets, with a small tally counter at the end."
author: desk-bot
wildness:
  rating: 3
  verified: "SemiAnalysis newsletter, 8 Oct: 857 releases, 31 with a result, 9 at or before launch, method stated"
  claimed: "Disclosure is not testing; SemiAnalysis itself says not found does not mean not tested"
verdict: "A useful count of what Chinese labs publish, not proof of what they test. Read the per-company numbers as indicative, as the authors ask, and note there is no matching US count."
sources:
  - title: "Beijing Will Not Pace the Frontier: China's Speed-First AI Safety Regime (SemiAnalysis, Mark Chen, Doug and Dylan Patel, 8 October 2026)"
    url: https://newsletter.semianalysis.com/p/beijing-will-not-pace-the-frontier
  - title: "China AI developers publish safety tests for just 3.6% of model releases, report finds (Reuters, 9 October 2026, via Devdiscourse)"
    url: https://www.devdiscourse.com/article/international/3989783-china-ai-developers-publish-safety-tests-for-just-36-of-model-releases-report-finds
---

Research firm SemiAnalysis published a long analysis on 8 October 2026, ["Beijing Will Not Pace the Frontier"](https://newsletter.semianalysis.com/p/beijing-will-not-pace-the-frontier), by Mark Chen, Doug and Dylan Patel. Its centrepiece is an original count of how often China's leading AI developers publish safety-evaluation results for the models they release. [Reuters reported the findings](https://www.devdiscourse.com/article/international/3989783-china-ai-developers-publish-safety-tests-for-just-36-of-model-releases-report-finds) on 9 October. The later sections of the piece are for paid subscribers; the figures below are from the free portion.

## The count

SemiAnalysis built a dataset of every identifiable model release from nine developers between 2021 and 15 September 2026: four large platforms (ByteDance, Alibaba, Tencent, Baidu) and five startups (DeepSeek, Moonshot, Zhipu Z.ai, MiniMax, StepFun). That came to 857 releases, 741 product models and 116 research models. All figures here are SemiAnalysis's:

- **31 releases (3.6%)** have ever had a published safety result from the developer.
- **9 (1.1%)** had that result available at or before launch.
- **16** were documented only afterwards, with a median lag of 42 days and a maximum of 349 days (DeepSeek-R1).
- For **6**, a result exists but its timing or match to the model could not be established.
- **10** carry a claim of evaluation with no figures; **3** are known only from press or investor accounts.
- **813 (94.9%)** have no safety disclosure SemiAnalysis could find.

By company, Alibaba has 7 of 238 releases with any result, Tencent 1 of 133, ByteDance 2 of 120 and Baidu 1 of 49. SemiAnalysis says Zhipu (Z.ai) is the only developer with a result in every year since 2022, and that startups disclose more often than the large platforms (20 of 317 releases against 11 of 540).

## How it was counted, and the caveats

The standard is strict, by the authors' own description. A "result" means a quantitative or substantive finding on harmful output, jailbreaks, toxicity, privacy, refusal or dangerous capability, tied to the named model, found in the developer's model cards, release notes or technical reports. Statements that a model was "safety-trained" or "evaluated" do not count, and a flagship's result is not extended to other sizes.

Two caveats come from SemiAnalysis itself. "'Not found' is bounded to the materials checked and does not mean 'not tested.'" And because companies name variants differently (Alibaba's 238 releases "count every Qwen size and snapshot"), "per-company rates are indicative rather than a ranking." Reuters adds that companies could have tested privately, and that the report gives no comparable figures for US developers.

So this measures public disclosure, not safety. It does not show that any model is untested or unsafe.

## What else the piece argues

SemiAnalysis says no Chinese frontier text model has shipped with a dangerous-capability evaluation across the domains named by the IDAIS scientist statements, with Zhipu's GLM-5.3 cyber note the closest. Its broader argument is that Beijing's binding rules mostly govern applications and outputs rather than requiring frontier developers to test or publish. Reuters notes that leading US labs publish system or model cards for some major launches, but there is no equivalent census for them.

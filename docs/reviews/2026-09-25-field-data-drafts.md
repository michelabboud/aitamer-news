# Field data for the 25 published posts (2026-09-25)

Drafted by the `feat/bestiary` session (Claude Opus 5.5, commit `9e51549`): a first pass at
`wildness`, `verdict` and `sunset` for all 25 published posts, in that branch's pre-contract
shape (`wildness: N` + `wildnessTamed` + `wildnessWild`). Converted to post contract v1
(`docs/plans/2026-09-25-bestiary-redesign.md` §4, `POST.md` §2, `src/content.config.ts`) and
checked against each post's own body and sources by lane L1 (Sonnet). **Awaiting Michel's
editorial review** — nothing here is published editorial judgment until he signs off.

Conversion: `wildness: N` / `wildnessTamed` / `wildnessWild` → `wildness: { rating, verified,
claimed }`; `sunset.note` → `sunset.replacement` (kept when it names one, omitted when it says
there is none). Every `verified`/`claimed` string is ≤120 characters and every `verdict` is
≤240 characters in the original draft, so none needed shortening. Ratings and one-line claims
were checked against each post's own body and `sources:` list; none needed a rating change —
see the rationale column and the changes section below for the one place text itself was
tightened.

## Table

| No. | Slug | Rating | Verified | Claimed | Verdict | Sunset |
|---|---|---|---|---|---|---|
| 0001 | welcome-to-aitamer | — (no claim to rate) | — | — | Explains why the site exists, how bylines mark AI or human authorship, and that drafts stay unpublished until a human hits publish. | — |
| 0002 | open-weights-roundup | 4 | Sources are general Hugging Face and GitHub listings | No specific models or eval numbers are named | A general reminder rather than news: compare open-weight models on your own prompts and check licenses before commercial use. | — |
| 0003 | policy-watch-transparency | 4 | Points to the OECD AI Policy Observatory | No specific rule or regulator is cited | A short editorial nudge for product teams: label AI output clearly, keep an audit trail and make disclosures easy to find. | — |
| 0004 | mistral-rs-0-9-3-fp8-nvfp4 | 1 | Changes are listed on the v0.9.3 GitHub release | Nothing rests on vendor say-so | For teams serving models with mistral.rs who want FP8, NVFP4 or Anthropic-compatible local serving. A changelog note with no speed figures. | — |
| 0005 | nvidia-cuda-rust-two-tracks | 2 | Toolchains and Apache-2.0 licenses are in NVlabs repos | Adoption by Grout and mistral.rs is NVIDIA's claim | Worth watching for Rust GPU developers. Both tracks are early and not production-ready; recheck the toolchain pins first. | — |
| 0006 | gpt-6-sol-luna-api-pricing | 2 | Prices in docs; cost drop confirmed by Artificial Analysis | Only one independent eval so far | Worth trying for cost-sensitive agent and coding loops. If you need a clear quality gain over GPT-5.6, re-run your own evals first. | — |
| 0007 | grok-4-7 | 2 | Prices in xAI docs; gains measured by Artificial Analysis | Only one independent eval so far | Coding gains show up in one independent eval, but Grok 4.7 used about twice the tokens. Check cost per task before switching. | — |
| 0008 | claude-opus-5-5-agentic-coding | 3 | Prices and availability are in official changelogs | "~40% cheaper" is a vendor claim | Worth an A/B for cache-heavy Claude Code or Copilot agent runs. The list-price cut is about 20%; the ~40% saving is Anthropic's figure. | — |
| 0009 | copilot-runtime-rust-migration | 4 | The Rust rewrite is described in GitHub's primary post | LoC, latency and cost figures are GitHub's own numbers | A concrete case study for teams weighing agent-assisted rewrites. The latency gains exclude model and network time. | — |
| 0010 | claude-art-phage-enzyme | 4 | Array RNA signal draws on published SA1 RNA-seq data | Anthropic preprint, not peer-reviewed; function unknown | A notable AI-assisted genome-mining find for life-science and AI-for-science watchers. It is not a gene-editing tool, and its function is unknown. | — |
| 0011 | claude-code-agents-md-mods | 2 | AGENTS.md support is in the changelog and mod source | The 2.1.281 gate fix is a staff HN claim only | Useful for repos shared across coding agents. If you disable telemetry, confirm you are on 2.1.281+ or import @AGENTS.md from CLAUDE.md. | — |
| 0012 | flux-3-action | 3 | Model details, code and license terms are published | RoboLab 42.92% top score is a BFL claim | Useful for robotics research and non-commercial projects. Commercial or production robot control needs a separate BFL license. | — |
| 0013 | gemini-3-8-flash-tts | 3 | Prices are in Google's developer pricing docs | Benchmark wins are Google-cited, not re-run | Worth a look for dubbing, audio and voice-agent builders. Promo prices double on 2027-01-01, and voice cloning is geo-blocked in some regions. | — |
| 0014 | made-on-youtube-2026-gemini-ask-studio | 2 | Features are listed on the official YouTube Blog | Early-2027 timing comes from TechCrunch, not YouTube | Relevant to YouTube creators: more AI feedback and thumbnail tools in Studio, and chat-based Gemini editing coming to Shorts and Create. | — |
| 0015 | openai-legacy-instruct-base-hard-remove-2026-09-28 | 1 | Dates and replacements are on OpenAI's deprecations page | Nothing rests on vendor say-so | Anyone still calling these four legacy models must migrate before 2026-09-28, when they stop working. | 2026-09-28 · gpt-3.5-turbo-instruct, babbage-002, davinci-002, gpt-3.5-turbo-1106 → `gpt-5.6-terra` |
| 0016 | sora-videos-api-sunset | 1 | Dates and missing replacement are in OpenAI's docs | Nothing rests on vendor say-so | Hard cutoff for anyone still on the Videos API or sora-2 models. Export Sora content and move to another video stack. | 2026-09-24 · Videos API, sora-2, sora-2-pro and dated snapshots → none listed |
| 0017 | zerodrift-anchor-3 | 4 | Tiers and list prices are on ZeroDrift's product page | 95.5% recall and 34× speed are self-reported | For regulated firms whose agents send customer messages. Wait for the independent benchmark run before trusting the accuracy figures. | — |
| 0018 | burn-0-22-cubecl-0-11-pre4 | 1 | Both tags and changelogs are public on GitHub | Nothing rests on vendor say-so | Only for teams tracking Burn and CubeCL pre-releases, and several changes break code. Everyone else should wait for stable 0.22 / 0.11. | — |
| 0019 | huggingface-tokenizers-1-0-rc2 | 3 | RC tag and install path are on GitHub | 3–30× faster encode is Hugging Face's own benchmark | Worth testing if tokenization speed matters and you can run a release candidate. Treat it as a candidate, not a stable 1.0. | — |
| 0020 | lightspeed-temporal-rust-agent-harness | 5 | Repo, stack and Apache-2.0 license are public | What works is README claims only; no release tag | For Rust and Temporal teams exploring durable agent harnesses. It is an early repo with no shown production use. | — |
| 0021 | drivingbench-gpt6-astra | 5 | Harness code and run traces are published openly | Self-published; one trial per model, no replication | Interesting for embodied-agent and eval teams. It shows a low-speed cone course in an empty lot, not that any model can drive. | — |
| 0022 | needle-2-pi5-function-calling | 3 | Size and license match across RPi, HF and GitHub | Latency is an RPi demo; ~500 tok/s is vendor-reported | Handy for Pi-class projects that map plain-English commands to local functions. It picks tools; it does not chat. | — |
| 0023 | openai-medicare-eval-agent-au | 2 | On the record from the PM; reported by the BBC | What was accessed is still under investigation | A warning for teams running eval agents with web access: containment and timely disclosure matter. No personal data is believed accessed so far. | — |
| 0024 | codex-cli-0-156 | 1 | Features are listed in the GitHub release notes | Nothing rests on vendor say-so | Codex CLI users get an optional fullscreen TUI, a /usage dashboard and Sol/Luna in the picker. Note that voice is now on by default. | — |
| 0025 | openai-agents-api-public-beta | 2 | Endpoints, billing and data rules are in OpenAI docs | "No extra Agents API fee" is from the announcement | For teams that want a managed Codex agent loop with MCP and sandboxes. US-only data residency and no ZDR rule it out for some. | — |

## Rationale, post by post (own sources only)

- **0001 welcome-to-aitamer** — About-the-site post; nothing in the body rests on an external
  claim to rate (its one source, Astro's own docs, is cited for a build-mechanics fact, not
  news). See "Changes from the original draft" below for why it carries no `wildness` and a
  rewritten `verdict`.
- **0002 open-weights-roundup** — Links only to the general Hugging Face models index and
  GitHub trending, names no specific model or number, and says so itself ("Eval tables remain
  uneven"). Rating 4 (mostly un-checkable) fits; nothing to verify beyond "these are general
  listings."
- **0003 policy-watch-transparency** — An editorial nudge sourced only to the OECD AI Policy
  Observatory home page, with no specific rule, bill or regulator named. Rating 4 fits a piece
  that cites a general reference, not a checkable fact.
- **0004 mistral-rs-0-9-3-fp8-nvfp4** — Every claim traces to the linked GitHub release page
  (a public, checkable changelog) and the post explicitly disclaims "No performance numbers."
  Rating 1 (independently verifiable, nothing vendor-only) fits.
- **0005 nvidia-cuda-rust-two-tracks** — Toolchain requirements and Apache-2.0 licenses are
  confirmed against the two NVlabs repos directly ("Checked on GitHub"); the one unverified
  claim — cutile-rs used by Hugging Face Grout and mistral.rs — is flagged in the body itself
  as "NVIDIA's claim in the post — not independent verification here." Rating 2 fits.
- **0006 gpt-6-sol-luna-api-pricing** — Prices are quoted from OpenAI's own pricing docs; the
  cost-efficiency story is attributed throughout to one independent source (Artificial
  Analysis), and the post says so ("one independent eval write-up"). Rating 2 fits.
- **0007 grok-4-7** — Same shape as 0006: prices from xAI's own docs, gains from one named
  independent evaluator (Artificial Analysis), flagged as such. Rating 2 fits.
- **0008 claude-opus-5-5-agentic-coding** — List prices and same-day availability are sourced
  to Anthropic's and GitHub's own changelogs; the "~40% cheaper" figure is explicitly marked
  "an Anthropic vendor claim about end-to-end workload cost," distinct from the list-price
  table. Rating 3 (a real vendor-only claim sits beside verifiable facts) fits.
- **0009 copilot-runtime-rust-migration** — The whole post is one primary source (Stephen
  Toub's GitHub Blog post); LoC, latency and cost figures are called out repeatedly as
  "GitHub primary / vendor eng claims" and "Soft economics — not an independent audit."
  Rating 4 (heavy reliance on the vendor's own unaudited numbers) fits.
- **0010 claude-art-phage-enzyme** — Anthropic's own preprint is the source for the RNA
  abundance figures; the post is explicit that the preprint is "not peer-reviewed" and that
  ART's function "remain[s] unknown" (quoting the preprint's own Discussion). Rating 4 fits;
  it is not a 5 because the RNA-seq evidence draws on independently published Staphylococcus
  phage SA1 data, not Anthropic's word alone.
- **0011 claude-code-agents-md-mods** — `AGENTS.md` support is confirmed in the public
  changelog and the mod's own source tree; the "fixed in 2.1.281" claim is sourced only to an
  Anthropic staff comment on Hacker News, and the post says so explicitly ("not a named
  changelog bullet ... as of desk check"). Rating 2 fits.
- **0012 flux-3-action** — Model architecture, code and the Kommunity License terms are all
  linked to BFL's own primary pages; the one leaderboard number (RoboLab 42.92%) is labelled
  "a Black Forest Labs claim" in the body. Rating 3 fits.
- **0013 gemini-3-8-flash-tts** — Pricing is pulled straight from Google's developer pricing
  docs; every benchmark figure (Hume AI Voice Design Benchmark, Voice Arena placements) is
  explicitly "Google-cited / third-party scores — not an independent ATN re-run." Rating 3
  fits.
- **0014 made-on-youtube-2026-gemini-ask-studio** — Feature list comes from the official
  YouTube Blog; the one forward-looking date (early-2027 Shorts/Create availability) is
  sourced to TechCrunch and flagged as "TechCrunch-attributed, not YouTube Blog wording."
  Rating 2 fits.
- **0015 openai-legacy-instruct-base-hard-remove-2026-09-28** — A hygiene note built entirely
  from OpenAI's own deprecations page; there is no vendor-only claim in the body at all.
  Rating 1 fits. Sunset: `what` is the four model IDs, `replacement` is `gpt-5.6-terra` per the
  table in the post.
- **0016 sora-videos-api-sunset** — Same shape: shutdown dates and the absence of a
  replacement both come from OpenAI's own deprecations table and Help Center. Rating 1 fits.
  Sunset: the deprecations table lists no successor, so `replacement` is omitted per the
  contract ("Omit when the vendor names none").
- **0017 zerodrift-anchor-3** — Tiers and list prices are read straight off ZeroDrift's
  product page; the recall/speed numbers are called "self-reported" by the vendor's own
  methodology line ("Results are self-reported and an independent run is in progress"), and
  the post repeats that caveat twice more. Rating 4 fits.
- **0018 burn-0-22-cubecl-0-11-pre4** — Every listed change is a bullet from the two linked
  GitHub release pages; the post states "No invented speedups or GFLOPS." Rating 1 fits.
- **0019 huggingface-tokenizers-1-0-rc2** — The RC tag and install path are confirmed on
  GitHub; every performance figure (3–30×, 76% scaling, ~6× smaller crate) is attributed
  in-line to "Hugging Face's numbers, not independent desk benchmarks." Rating 3 fits.
- **0020 lightspeed-temporal-rust-agent-harness** — The entire post is sourced to one
  project's own README with "no release tag in this beat" and explicit language that scale
  claims ("thousands," "weeks to months") are "project aspiration, not desk-verified
  deployments." Rating 5 (nothing beyond self-description) fits.
- **0021 drivingbench-gpt6-astra** — Labelled "self-published until third-party replication"
  in its own second paragraph; a single multi-attempt trial per model, no independent
  replicate, authors' own stated limits. Rating 5 fits.
- **0022 needle-2-pi5-function-calling** — Model size and Apache-2.0 license are cross-checked
  across three primary sources (Raspberry Pi News, Hugging Face, GitHub); the latency table is
  explicitly "an author demo ... not measured by this desk," and the ~500 tok/s figure is
  separately flagged "vendor-reported." Rating 3 fits.
- **0023 openai-medicare-eval-agent-au** — Built from an on-the-record PM press-conference
  transcript plus BBC reporting; the post itself states the central fact under investigation
  ("What was accessed is still under investigation"). Rating 2 fits.
- **0024 codex-cli-0-156** — Every feature bullet is drawn straight from the two linked GitHub
  release pages, with no vendor performance claim in the body. Rating 1 fits.
- **0025 openai-agents-api-public-beta** — Endpoints, billing shape and the US-only/non-ZDR
  data-residency rule are all quoted from OpenAI's own developer docs; the one soft claim ("no
  additional Agents API fee") is attributed to "the announcement." Rating 2 fits.

## Changes from the original draft

- **welcome-to-aitamer** (specimen 0001): dropped the `wildness: 1` block entirely. The task
  brief calls for no wildness on this post since it makes no claim to rate, and the post's own
  body — a description of the site's editorial process — does not carry the kind of external,
  checkable claim the `wildness` field exists to score. Also replaced the draft's `verdict`
  ("... and humans deciding what gets published") with a neutral one-line description of what
  the post explains: site purpose, the AI/Human byline badges, and that drafts stay
  unpublished until someone hits publish. The original wording asserted, as settled fact, that
  humans decide what gets published — the post's own text only says drafts stay unpublished
  "until someone hits publish," which is a narrower and different claim (it does not say who
  approves bot output, or that every publish decision is a human one); asserting it as the
  site's editorial policy is an unconfirmed claim about how the desk actually runs, so it was
  removed rather than carried forward.
- **openai-legacy-instruct-base-hard-remove-2026-09-28** (specimen 0015): converted
  `sunset.note: "Move to gpt-5.6-terra"` to `sunset.replacement: "gpt-5.6-terra"` per the
  contract mapping — a straight rename, no wording change, matching the "recommended
  replacement" column already in the post's own table.
- **sora-videos-api-sunset** (specimen 0016): `sunset.note: "No replacement listed"` was
  omitted rather than carried into `replacement`, per the contract ("Omit when the vendor
  names none; the page then says so") — the post's own deprecations table shows a `—` cell for
  every row, so there is nothing to name.
- All other 22 posts: field-shape conversion only (`wildness: N` / `wildnessTamed` /
  `wildnessWild` → the nested `wildness: { rating, verified, claimed }` object; `verdict`
  carried over verbatim). No rating, wording, or source was changed — each was checked against
  the post's own body and `sources:` list (see the rationale above) and found already
  accurate and within the 120/240-character limits.

## Verification (lane L1)

- `npm test` — 50/50 passing, including `src/lib/field-data.test.ts` and
  `scripts/stamp-specimens.test.mjs`.
- `npm run check:posts` — `check:times: every published post has a publish time.` /
  `check:specimens: 25 published posts numbered; ledger holds 25.`
- `npx astro sync` — `[content] Synced content` / `[types] Generated` with no schema errors,
  confirming `src/content.config.ts`'s `wildness`, `verdict` and `sunset` shapes accept all 25
  converted posts.
